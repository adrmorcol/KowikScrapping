import puppeteer from 'puppeteer';

const OPCIONES = {
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
};

/**
 * Abre UN navegador, ejecuta fn(descargar) y lo cierra siempre.
 * Así varias páginas de la misma web comparten navegador en vez de abrir uno por página.
 * descargar(url) devuelve { html, url } (url final, después de redirecciones).
 */
export async function conNavegador(fn) {
  const navegador = await puppeteer.launch(OPCIONES);

  const descargar = async url => {
    const pagina = await navegador.newPage();
    try {
      await pagina.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
      return { html: await pagina.content(), url: pagina.url() };
    } finally {
      await pagina.close();
    }
  };

  try {
    return await fn(descargar);
  } finally {
    await navegador.close();
  }
}

/** Atajo para una sola página. Devuelve solo el HTML. */
export async function descargarConNavegador(url) {
  const { html } = await conNavegador(descargar => descargar(url));
  return html;
}
