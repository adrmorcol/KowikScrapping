import express from 'express';
import empresasRoutes from './routes/empresas.routes.js';
import { manejarErrores } from './middleware/errores.js';

const app = express();
app.use(express.json());

app.get('/api/salud', (req, res) => res.json({ ok: true }));
app.use('/api/empresas', empresasRoutes);

app.use(manejarErrores);

export default app;