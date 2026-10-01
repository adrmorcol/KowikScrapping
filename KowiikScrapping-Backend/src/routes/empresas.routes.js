import { Router } from 'express';
import { buscarEmpresas, obtenerFicha, cambiarEstadoEmpresa, listarGuardadas, editarGuardada } from '../controllers/empresas.controller.js';

const router = Router();

router.get('/', listarGuardadas);
router.post('/buscar', buscarEmpresas);
router.post('/ficha', obtenerFicha);
router.post('/estado', cambiarEstadoEmpresa);
router.post('/editar', editarGuardada);

export default router;
