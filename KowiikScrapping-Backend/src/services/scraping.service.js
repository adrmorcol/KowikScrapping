import * as cheerio from 'cheerio';
import { config } from '../config.js';
import { descargarConNavegador } from './navegador.service.js';

export async function scrapearWeb(web) {
  const url = web.startsWith('http') ? web : `https://${web}`;  

  let htmlPortada = await descargarPagina(url);

  const primerIntento = extraerDatos(htmlPortada);
  const vacio = !primerIntento.emails.length && !primerIntento.telefonos.length;

  if (vacio) {
    console.log(`Sin datos con fetch en ${url}, probando con navegador…`);
    htmlPortada = await descargarConNavegador(url).catch(() => htmlPortada);
  }

  const paginas = buscarPaginasUtiles(htmlPortada, url);

  const resultados = await Promise.allSettled(paginas.map(descargarPagina));
  const htmls = [htmlPortada, ...resultados.filter(r => r.status === 'fulfilled').map(r => r.value)];

  const datos = htmls.map(extraerDatos);

  const nombreDominio = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
  const todosLosEmails = [...new Set(datos.flatMap(d => d.emails))];  

  return {
    web: url,
    paginasVisitadas: [url, ...paginas],
    email: todosLosEmails.filter(e => e.split('@')[1].includes(nombreDominio)),
    emailsExternos: todosLosEmails.filter(e => !e.split('@')[1].includes(nombreDominio)),
    telefono: [...new Set(datos.flatMap(d => d.telefono))],
    cifs: [...new Set(datos.flatMap(d => d.cifs))],
  };
}

async function descargarPagina(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': config.userAgent },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);

  const tipo = res.headers.get('content-type') ?? '';
  if (!tipo.includes('text/html')) throw new Error(`${url} no es una página HTML`);

  return res.text();
}

const REGEX_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const REGEX_TELEFONO = /(?:\+34|0034)?[\s.-]?[6789](?:[\s.-]?\d){8}/g;
const REGEX_CIF = /\b[ABCDEFGHJNPQRSUVW][-\s]?\d{7}[-\s]?[0-9A-J]\b/g;

function extraerDatos(html) {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  const texto = ($('body').html() ?? '').replace(/<[^>]+>/g, ' ');

  const emails = [
    ...$('a[href^="mailto:"]').map((i, a) => $(a).attr('href').replace('mailto:', '').split('?')[0]).get(),
    ...(texto.match(REGEX_EMAIL) ?? []),
  ].filter(e => !/\.(png|jpe?g|gif|svg|webp)$/i.test(e))
  .map(e => e.trim().toLowerCase())
  .filter(e => /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e));

  const telefono = [
    ...$('a[href^="tel:"]').map((i, a) => $(a).attr('href').replace('tel:', '')).get(),
    ...(texto.match(REGEX_TELEFONO) ?? []),
  ]
    .map(t => t.replace(/\D/g, '').replace(/^(0034|34)(?=\d{9}$)/, ''))
    .filter(t => /^[6789]\d{8}$/.test(t));

  const cifs = (texto.match(REGEX_CIF) ?? []).map(c => c.replace(/[-\s]/g, ''));

  return { emails, telefono, cifs };
}


const REGEX_PAGINA_UTIL = /contact|aviso|legal|quienes|nosotros|about|empresa/i;

const nombreBase = h => h.replace(/^www\./, '').split('.')[0];

function buscarPaginasUtiles(html, urlBase) {
  const $ = cheerio.load(html);
  const base = new URL(urlBase);
  const urls = new Set();

  $('a[href]').each((i, a) => {
    const href = $(a).attr('href');
    const texto = $(a).text();
    if (!REGEX_PAGINA_UTIL.test(href) && !REGEX_PAGINA_UTIL.test(texto)) return;

    try {
      const url = new URL(href, base);
      if (nombreBase(url.hostname) === nombreBase(base.hostname)) {
        urls.add(url.href.split('#')[0]);
      }
    } catch {
      // href inválido: lo ignoramos
    }
  });

  return [...urls].slice(0, 3);
}