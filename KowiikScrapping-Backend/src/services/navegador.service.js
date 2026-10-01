import puppeteer from 'puppeteer';

export async function descargarConNavegador(url) {
  const navegador = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const pagina = await navegador.newPage();
    await pagina.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    return await pagina.content();
  } finally {
    await navegador.close();
  }
}