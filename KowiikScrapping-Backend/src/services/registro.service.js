import { config } from '../config.js';

const BASE = 'https://openmercantil.es/api/v1';
const PARECIDO_MINIMO = 0.6;

// Caché en memoria: el plan gratuito de OpenMercantil son 200 peticiones al día por IP
const cache = new Map();

const FORMAS_JURIDICAS = /\b(s\.?\s?l\.?\s?u\.?|s\.?\s?l\.?\s?l\.?|s\.?\s?l\.?|s\.?\s?a\.?\s?u\.?|s\.?\s?a\.?|s\.?\s?coop\.?|sociedad|limitada|anonima|unipersonal|cooperativa|slu|sl|sa|sau)\b/g;
const GENERICOS = /\b(bar|restaurante|restaurant|cafeteria|cafe|farmacia|taller|talleres|clinica|tienda|hosteleria|el|la|los|las|de|del|y|i|en)\b/g;

const sinAcentos = t => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// La API puede devolver los campos con nombres algo distintos; los leemos de forma flexible
const lista = r => r?.items ?? r?.results ?? r?.data ?? (Array.isArray(r) ? r : []);
const nombreDe = o => o?.name ?? o?.nombre ?? o?.razon_social ?? o?.denominacion ?? null;
const cifDe = o => (o?.cif ?? o?.nif ?? null)?.toString().toUpperCase() ?? null;

function palabras(nombre) {
  return sinAcentos(nombre)
    .replace(FORMAS_JURIDICAS, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(GENERICOS, ' ')
    .split(/\s+/)
    .filter(p => p.length > 1);
}

/** Parecido entre 0 (nada en común) y 1 (mismas palabras). */
export function parecido(a, b) {
  const A = new Set(palabras(a));
  const B = new Set(palabras(b));
  if (!A.size || !B.size) return 0;
  const comunes = [...A].filter(p => B.has(p)).length;
  return comunes / new Set([...A, ...B]).size;
}

async function pedirJson(url) {
  if (cache.has(url)) return cache.get(url);

  const res = await fetch(url, {
    headers: { 'User-Agent': config.userAgent, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 404) {
    cache.set(url, null);
    return null;
  }
  if (res.status === 429) throw new Error('Límite diario de OpenMercantil alcanzado (200 consultas/día)');
  if (!res.ok) throw new Error(`OpenMercantil respondió ${res.status} en ${url}`);

  const json = await res.json();
  cache.set(url, json);
  return json;
}

async function buscarPorCif(cif) {
  const cifLimpio = cif.toUpperCase().replace(/[-\s.]/g, '');
  const items = lista(await pedirJson(`${BASE}/search?q=${encodeURIComponent(cifLimpio)}&limit=5`));

  const exacta = items.find(i => cifDe(i) === cifLimpio);
  if (exacta) return exacta;

  // Buscar por CIF solo devuelve coincidencias exactas; si hay un único resultado sin campo cif, es ese
  if (items.length === 1 && !cifDe(items[0])) return items[0];
  return null;
}

async function buscarPorNombre(nombre, minimo = PARECIDO_MINIMO) {
  const consultas = [...new Set([nombre.trim(), palabras(nombre).join(' ')])]
    .map(q => q.slice(0, 120))
    .filter(q => q.length >= 2);

  for (const q of consultas) {
    const items = lista(await pedirJson(`${BASE}/search?q=${encodeURIComponent(q)}&limit=10`));
    const candidatos = items
      .map(i => ({ item: i, puntuacion: parecido(nombre, nombreDe(i)) }))
      .filter(c => c.puntuacion >= minimo)
      .sort((a, b) => b.puntuacion - a.puntuacion);

    if (candidatos.length) return candidatos[0].item;
  }
  return null;
}

function leerCargos(respuesta) {
  const actuales =
    respuesta?.officers?.current ??
    respuesta?.current ??
    (Array.isArray(respuesta?.officers) ? respuesta.officers : null) ??
    (Array.isArray(respuesta) ? respuesta : []);

  return actuales
    .map(c => ({
      nombre: c?.name ?? c?.nombre ?? null,
      cargo: c?.role ?? c?.cargo ?? c?.position ?? null,
    }))
    .filter(c => c.nombre);
}

function leerTrabajadores(valor) {
  if (valor == null) return null;
  if (typeof valor === 'number') return valor;
  const n = parseInt(String(valor).replace(/\./g, ''), 10); // "10-49" → 10
  return Number.isNaN(n) ? null : n;
}

/**
 * Busca la empresa en el registro mercantil (OpenMercantil / BORME), en este orden:
 *  1. Por CIF (seguro). Ojo: OpenMercantil no tiene el CIF de todas las sociedades.
 *  2. Por razón social sacada del aviso legal (casi seguro: la razón social es única en España).
 *  3. Por nombre comercial (aproximado; se exige que coincida la localidad si la sabemos).
 */
export async function buscarEnRegistro({ cif, razonSocial, nombre, localidad }) {
  let encontrada = null;
  let coincidencia = null;

  if (cif) {
    encontrada = await buscarPorCif(cif);
    if (encontrada) coincidencia = 'cif';
  }

  if (!encontrada && razonSocial) {
    encontrada = await buscarPorNombre(razonSocial, 0.9);
    if (encontrada) coincidencia = 'razonSocial';
  }

  if (!encontrada && nombre) {
    encontrada = await buscarPorNombre(nombre);
    if (encontrada) coincidencia = 'nombre';
  }

  if (!encontrada?.slug) {
    console.log(`[registro] no encontrada (CIF ${cif ?? '—'}, razón social ${razonSocial ?? '—'}, nombre ${nombre ?? '—'})`);
    return null;
  }

  const [detalle, cargos] = await Promise.all([
    pedirJson(`${BASE}/company/${encodeURIComponent(encontrada.slug)}`),
    pedirJson(`${BASE}/company/${encodeURIComponent(encontrada.slug)}/officers`).catch(() => null),
  ]);
  const empresa = detalle?.company ?? detalle;

  // Si se encontró por nombre y sabemos la localidad, exigimos que coincida con el domicilio
  if (coincidencia === 'nombre' && localidad && empresa?.address) {
    const domicilio = sinAcentos(JSON.stringify(empresa.address));
    if (!domicilio.includes(sinAcentos(localidad))) {
      console.log(`[registro] ${nombre}: descartada ${nombreDe(encontrada)} (otra localidad)`);
      return null;
    }
  }

  const resultado = {
    coincidencia,
    razonSocial: nombreDe(empresa) ?? nombreDe(encontrada),
    cif: cifDe(empresa) ?? cifDe(encontrada) ?? (coincidencia === 'cif' ? cif.toUpperCase() : null),
    estado: empresa?.status ?? encontrada?.status ?? null,
    domicilio: empresa?.address ?? null,
    trabajadores: leerTrabajadores(empresa?.workers ?? empresa?.employees ?? empresa?.trabajadores),
    cargos: leerCargos(cargos),
  };

  console.log(`[registro] ${cif ?? razonSocial ?? nombre} → ${resultado.razonSocial} (por ${coincidencia}), ${resultado.cargos.length} cargos`);
  return resultado;
}
