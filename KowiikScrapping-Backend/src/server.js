import app from './app.js';
import { config } from './config.js';

app.listen(config.puerto, () => console.log(`Backend en http://localhost:${config.puerto}`));