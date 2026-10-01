import * as cheerio from 'cheerio';
import { config } from '../config.js';
import { conNavegador } from './navegador.service.js';

const TIEMPO_MAXIMO = 10000;
const MAX_SUBPAGINAS = 4;

// ---------------------------------------------------------------------------
// Descarga
// ---------------------------------------------------------------------------

/** Error de descarga que guarda el código HTTP (si lo hay). */
export class ErrorDescarga extends Error {
  constructor(mensaje, status = null) {
    super(mensaje);
    this.status = status;
  }
}

/**
 * Descarga una página con fetch.
 * Devuelve { html, url } donde url es la dirección final (después de redirecciones).
 */
export async function descargar(url, tiempoMaximo = TIEMPO_MAXIMO) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': config.userAgent,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'es-ES,es;q=0.9,ca;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(tiempoMaximo),
  });
  if (!res.ok) throw new ErrorDescarga(`${url} respondió ${res.status}`, res.status);

  const tipo = res.headers.get('content-type') ?? '';
  if (!tipo.includes('html')) throw new ErrorDescarga(`${url} no es una página HTML`);

  return { html: await res.text(), url: res.url || url };
}

/** Versión que devuelve solo el HTML (se mantiene por compatibilidad). */
export async function descargarPagina(url) {
  const { html } = await descargar(url);
  return html;
}

// ---------------------------------------------------------------------------
// Scraping de una web completa
// ---------------------------------------------------------------------------

export async function scrapearWeb(web) {
  const inicio = normalizarUrl(web);

  // 1. Primero lo intentamos con fetch, que es rápido
  const portada = await descargar(inicio).catch(err => {
    console.warn(`[scraping] ${err.message}`);
    return null;
  });

  let recorrido = null;
  if (portada && !pareceVacia(portada.html)) {
    recorrido = await recorrer(descargar, portada);
  }

  // 2. Si fetch no ha podido (web bloqueada, hecha con JavaScript o sin datos), probamos con el navegador
  if (!recorrido || !tieneDatos(recorrido.datos)) {
    console.log(`[scraping] ${inicio}: probando con navegador…`);
    const conChrome = await conNavegador(async descargarNav => {
      const portadaNav = await descargarNav(inicio);
      return recorrer(descargarNav, portadaNav);
    }).catch(err => {
      console.warn(`[scraping] navegador falló en ${inicio}: ${err.message}`);
      return null;
    });
    if (conChrome && (!recorrido || tieneDatos(conChrome.datos))) recorrido = conChrome;
  }

  if (!recorrido) throw new Error(`No se ha podido descargar ${inicio}`);

  const { urlFinal, paginasVisitadas, datos } = recorrido;
  const nombreDominio = nombreBase(new URL(urlFinal).hostname);

  const emails = unicos(datos.flatMap(d => d.emails));
  const resultado = {
    web: urlFinal,
    paginasVisitadas,
    email: emails.filter(e => e.split('@')[1].includes(nombreDominio)),
    emailsExternos: emails.filter(e => !e.split('@')[1].includes(nombreDominio)),
    telefono: unicos(datos.flatMap(d => d.telefono)),
    cifs: unicos(datos.flatMap(d => d.cifs)),
    razonesSociales: unicos(datos.flatMap(d => d.razonesSociales)),
  };

  console.log(`[scraping] ${urlFinal}: ${resultado.telefono.length} tel, ${resultado.email.length} email, CIF ${resultado.cifs.join(', ') || '—'}, razón social ${resultado.razonesSociales[0] ?? '—'} (${paginasVisitadas.length} páginas)`);
  return resultado;
}

/** Descarga las subpáginas útiles (aviso legal, contacto…) y extrae los datos de todas. */
async function recorrer(descargarFn, portada) {
  const subpaginas = buscarPaginasUtiles(portada.html, portada.url);
  const resultados = await Promise.allSettled(subpaginas.map(url => descargarFn(url)));
  const paginas = [portada, ...resultados.filter(r => r.status === 'fulfilled').map(r => r.value)];

  return {
    urlFinal: portada.url,
    paginasVisitadas: paginas.map(p => p.url),
    datos: paginas.map(p => extraerDatos(p.html)),
  };
}

// ---------------------------------------------------------------------------
// Extracción de datos
// ---------------------------------------------------------------------------

const REGEX_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const REGEX_TELEFONO = /(?:\+34|0034)?[\s.-]?[6789](?:[\s.-]?\d){8}/g;
const REGEX_CIF = /\b[ABCDEFGHJNPQRSUVW][-\s.]?\d{7}[-\s.]?[0-9A-J]\b/g;

// Razón social: un nombre que termina en una forma jurídica (S.L., SLU, S.A., Sociedad Limitada…)
const FORMA_JURIDICA = String.raw`(?:S\.?\s?L\.?\s?U\.?|S\.?\s?L\.?\s?L\.?|S\.?\s?L\.?|S\.?\s?A\.?\s?U\.?|S\.?\s?A\.?|SOCIEDAD LIMITADA(?: UNIPERSONAL)?|SOCIEDAD AN[OÓ]NIMA(?: UNIPERSONAL)?|S\.?\s?COOP\.?(?:\s?V\.?)?|COOP\.?(?:\s?V\.?)?|COOPERATIVA(?: VALENCIANA)?)`;
// La forma jurídica tiene que ir separada del nombre por un espacio o una coma
// (si no, "Terrassa" acabaría en "sa" y se tomaría por "S.A.")
const DETRAS_DE_NOMBRE = String.raw`[\s,]+${FORMA_JURIDICA}(?![A-Za-zÁÉÍÓÚÑáéíóúñ])`;

// 1) Detrás de una etiqueta fuerte: "Razón social: X S.L.", "Denominación social: X SLU"
const REGEX_RAZON_SOCIAL = new RegExp(
  String.raw`(?:raz[oó]n social|denominaci[oó]n(?: social)?)\s*[:\-–]?\s*([^:;|]{1,80}?${DETRAS_DE_NOMBRE})`,
  'gi'
);
// 2) Detrás de una etiqueta más débil: "Titular: X S.L.", "Responsable: X S.A."
const REGEX_RAZON_TITULAR = new RegExp(
  String.raw`(?:titular|responsable)[^:]{0,40}?[:\-–]\s*([^:;|]{1,80}?${DETRAS_DE_NOMBRE})`,
  'gi'
);
// 3) Sin etiqueta: nombres EN MAYÚSCULAS terminados en forma jurídica
const REGEX_RAZON_MAYUS = new RegExp(
  String.raw`\b([A-ZÁÉÍÓÚÑÜ0-9][A-ZÁÉÍÓÚÑÜ0-9&'\-. ]{0,60}?[\s,]+${FORMA_JURIDICA})(?![A-Za-zÁÉÍÓÚÑáéíóúñ])`,
  'g'
);

function limpiarRazon(r) {
  return r.replace(/\s+/g, ' ').replace(/^[\s,.\-–]+|[\s,\-–]+$/g, '').trim();
}

function extraerRazonesSociales(texto) {
  for (const regex of [REGEX_RAZON_SOCIAL, REGEX_RAZON_TITULAR, REGEX_RAZON_MAYUS]) {
    const encontradas = [...texto.matchAll(regex)].map(m => limpiarRazon(m[1])).filter(r => r.length >= 4);
    if (encontradas.length) return unicos(encontradas);
  }
  return [];
}

function textoVisible($) {
  $('script, style, noscript, svg, iframe, template').remove();
  // Añadimos un espacio al final de cada elemento para que no se peguen textos de elementos distintos
  $('body *').append(' ');
  return $('body').text().replace(/\s+/g, ' ');
}

export function extraerDatos(html) {
  const $ = cheerio.load(html);
  const texto = textoVisible($);

  const emails = [
    ...$('a[href^="mailto:"]').map((i, a) => decodificar($(a).attr('href')).replace(/^mailto:/i, '').split('?')[0]).get(),
    ...(texto.match(REGEX_EMAIL) ?? []),
  ]
    .map(e => e.trim().toLowerCase())
    .filter(e => /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e))
    .filter(e => !/\.(png|jpe?g|gif|svg|webp)$/i.test(e));

  const telefono = [
    ...$('a[href^="tel:"]').map((i, a) => decodificar($(a).attr('href')).replace(/^tel:/i, '')).get(),
    ...(texto.match(REGEX_TELEFONO) ?? []),
  ]
    .map(t => t.replace(/\D/g, '').replace(/^(0034|34)(?=\d{9}$)/, ''))
    .filter(t => /^[6789]\d{8}$/.test(t));

  const cifs = (texto.match(REGEX_CIF) ?? [])
    .map(c => c.replace(/[-\s.]/g, '').toUpperCase())
    .filter(cifValido);

  return {
    emails: unicos(emails),
    telefono: unicos(telefono),
    cifs: unicos(cifs),
    razonesSociales: extraerRazonesSociales(texto),
  };
}

/** Comprueba la letra/dígito de control del CIF para descartar falsos positivos. */
export function cifValido(cif) {
  const m = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(cif);
  if (!m) return false;
  const [, letra, numeros, control] = m;

  let suma = 0;
  for (let i = 0; i < 7; i++) {
    let d = Number(numeros[i]);
    if (i % 2 === 0) {
      d *= 2;
      d = Math.floor(d / 10) + (d % 10);
    }
    suma += d;
  }
  const digito = (10 - (suma % 10)) % 10;
  const letraControl = 'JABCDEFGHI'[digito];

  if ('PQRSNW'.includes(letra)) return control === letraControl;
  if ('ABEH'.includes(letra)) return control === String(digito);
  return control === String(digito) || control === letraControl;
}

// ---------------------------------------------------------------------------
// Enlaces a páginas útiles
// ---------------------------------------------------------------------------

// En orden de prioridad: el aviso legal es donde está el CIF y la razón social
const PRIORIDADES = [
  /aviso|legal|imprint|datos[-_ ]?fiscales|condiciones/i,
  /contact/i,
  /privacidad|privacitat|privacy|politica/i,
  /quienes|nosaltres|nosotros|about|empresa/i,
];

function prioridad(href, texto) {
  const i = PRIORIDADES.findIndex(re => re.test(href) || re.test(texto));
  return i === -1 ? null : i;
}

function buscarPaginasUtiles(html, urlBase) {
  const $ = cheerio.load(html);
  const base = new URL(urlBase);
  const encontradas = new Map(); // url -> prioridad

  $('a[href]').each((i, a) => {
    const href = $(a).attr('href') ?? '';
    const texto = $(a).text();
    if (/^(mailto|tel|javascript):/i.test(href)) return;

    const p = prioridad(href, texto);
    if (p === null) return;

    try {
      const url = new URL(href, base);
      if (!/^https?:$/.test(url.protocol)) return;
      if (/\.(pdf|jpe?g|png|gif|zip|docx?)$/i.test(url.pathname)) return;
      if (nombreBase(url.hostname) !== nombreBase(base.hostname)) return;

      const limpia = url.href.split('#')[0];
      if (limpia === base.href.split('#')[0]) return;
      if (!encontradas.has(limpia) || encontradas.get(limpia) > p) encontradas.set(limpia, p);
    } catch {
      // href inválido: lo ignoramos
    }
  });

  return [...encontradas.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, MAX_SUBPAGINAS)
    .map(([url]) => url);
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

export function normalizarUrl(web) {
  const limpia = web.trim();
  return /^https?:\/\//i.test(limpia) ? limpia : `https://${limpia}`;
}

export const nombreBase = h => h.replace(/^www\./, '').split('.')[0];

function pareceVacia(html) {
  const texto = textoVisible(cheerio.load(html));
  return texto.trim().length < 300;
}

function tieneDatos(datos) {
  return datos.some(d => d.emails.length || d.telefono.length || d.cifs.length);
}

function unicos(lista) {
  return [...new Set(lista)];
}

function decodificar(texto = '') {
  try {
    return decodeURIComponent(texto);
  } catch {
    return texto;
  }
}
