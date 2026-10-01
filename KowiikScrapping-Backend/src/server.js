import app from './app.js';
import { config } from './config.js';
import { prepararBaseDeDatos } from './repositories/empresas.repository.js';

const ESPERA_MS = 3000;
const INTENTOS = 10;

/** Prepara la base de datos; si MySQL aún está arrancando, reintenta unas cuantas veces. */
async function iniciarBaseDeDatos() {
  for (let intento = 1; intento <= INTENTOS; intento++) {
    try {
      await prepararBaseDeDatos();
      console.log('[bd] base de datos lista');
      return;
    } catch (err) {
      console.warn(`[bd] intento ${intento}/${INTENTOS}: ${err.message}`);
      await new Promise(r => setTimeout(r, ESPERA_MS));
    }
  }
  console.warn('[bd] no se ha podido preparar la base de datos; el backend funcionará sin guardar datos');
}

app.listen(config.puerto, () => console.log(`Backend en http://localhost:${config.puerto}`));
iniciarBaseDeDatos();
