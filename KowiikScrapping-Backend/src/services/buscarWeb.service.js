import * as cheerio from 'cheerio';
import { descargar } from './scraping.service.js';
import { conNavegador } from './navegador.service.js';

// Palabras que no suelen formar parte del dominio
const GENERICOS = /\b(bar|restaurante|restaurant|cafeteria|cafe|farmacia|taller|talleres|clinica|tienda|el|la|los|las|de|del|y|i|s\.?l\.?u?|s\.?a\.?u?)\b/g;

// Códigos HTTP que indican que la web existe pero rechaza a fetch (suele dejar pasar a un navegador)
const BLOQUEADA = new Set([401, 403, 406, 429, 503]);

const sinAcentos = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Genera direcciones candidatas a partir del nombre: terrassasantjosep.es, terrassa-sant-josep.com… */
function candidatas(nombre) {
  const base = sinAcentos(nombre).replace(/&/g, ' y ');
  const palabras = base.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
  const sinGenericos = base.replace(GENERICOS, ' ').replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);

  const variantes = [
    palabras.join(''),
    palabras.join('-'),
    sinGenericos.join(''),
    sinGenericos.join('-'),
  ].filter(v => v.replace(/-/g, '').length >= 4);

  const urls = [];
  for (const v of new Set(variantes)) {
    for (const tld of ['es', 'com']) {
      urls.push(`https://${v}.${tld}`, `https://www.${v}.${tld}`);
    }
  }
  return [...new Set(urls)];
}

/**
 * Intenta encontrar la web de una empresa que no la tiene en OpenStreetMap.
 * Solo acepta una web si contiene su teléfono o su nombre (y la localidad, si la sabemos).
 */
export async function buscarWeb(empresa) {
  if (!empresa?.nombre) return null;

  const bloqueadas = [];

  for (const url of candidatas(empresa.nombre)) {
    try {
      const pagina = await descargar(url, 6000);
      if (esSuWeb(pagina.html, empresa)) {
        console.log(`[buscarWeb] ${empresa.nombre} → ${pagina.url}`);
        return pagina.url;
      }
    } catch (err) {
      if (BLOQUEADA.has(err.status)) bloqueadas.push(url);
      // ENOTFOUND, timeout, 404… → esa dirección no existe, seguimos
    }
  }

  // Webs que existen pero rechazan a fetch: las comprobamos con el navegador
  if (bloqueadas.length) {
    const encontrada = await conNavegador(async descargarNav => {
      for (const url of bloqueadas) {
        const pagina = await descargarNav(url).catch(() => null);
        if (pagina && esSuWeb(pagina.html, empresa)) return pagina.url;
      }
      return null;
    }).catch(() => null);

    if (encontrada) {
      console.log(`[buscarWeb] ${empresa.nombre} → ${encontrada} (navegador)`);
      return encontrada;
    }
  }

  console.log(`[buscarWeb] ${empresa.nombre}: no se ha encontrado web`);
  return null;
}

function esSuWeb(html, empresa) {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  const texto = sinAcentos(`${$('title').text()} ${$('body').text()}`).replace(/\s+/g, ' ');

  // 1. Si aparece su teléfono, es suya seguro
  const telefono = empresa.telefono?.replace(/\D/g, '').slice(-9);
  if (telefono && telefono.length === 9 && texto.replace(/\D/g, '').includes(telefono)) return true;

  // 2. Si no, tiene que aparecer el nombre completo…
  const nombre = sinAcentos(empresa.nombre).replace(/\s+/g, ' ').trim();
  if (!texto.includes(nombre)) return false;

  // …y la localidad, si la conocemos
  const localidad = empresa.localidad && sinAcentos(empresa.localidad);
  return !localidad || texto.includes(localidad);
}
