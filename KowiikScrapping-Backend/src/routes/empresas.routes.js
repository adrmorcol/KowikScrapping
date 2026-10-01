import { Router } from "express";
import { buscarEmpresas } from "../controllers/empresas.controller.js";
import { obtenerFicha } from "../controllers/empresas.controller.js";

const router = Router();

router.post('/buscar', buscarEmpresas);
router.post('/ficha', obtenerFicha);

export default router;