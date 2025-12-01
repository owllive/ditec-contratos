import { Router } from 'express';
import { contratosController } from './contracts.controller.js';

const router = Router();

router.post('/', contratosController.criar);
router.get('/', contratosController.listar);
router.get('/visao-geral', contratosController.visaoGeral);
router.get('/:id', contratosController.buscarPorId);
router.put('/:id', contratosController.atualizar);
router.delete('/:id', contratosController.encerrar);
router.post('/:id/pesquisa-precos', contratosController.registrarPesquisa);

export default router;
