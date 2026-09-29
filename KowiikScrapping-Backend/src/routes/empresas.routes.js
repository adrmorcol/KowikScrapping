import { Router } from "express";
import { buscarEmpresas } from "../controllers/empresas.controller.js";

const router = Router();

router.post('/buscar', buscarEmpresas);

export default router;