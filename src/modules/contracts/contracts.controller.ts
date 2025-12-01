import { Request, Response } from 'express';
import { contratosService } from './contracts.service.js';
import { ModalidadeContrato, StatusContrato } from '@prisma/client';

export const contratosController = {
  async criar(req: Request, res: Response) {
    try {
      const contrato = await contratosService.criarContrato(req.body);
      res.status(201).json(contrato);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao criar contrato' });
    }
  },

  async listar(req: Request, res: Response) {
    const { page, pageSize, statusContrato, modalidade, orgaoResponsavel, empresaContratada, search } = req.query;

    const filters = {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      statusContrato: statusContrato as StatusContrato,
      modalidade: modalidade as ModalidadeContrato,
      orgaoResponsavel: orgaoResponsavel as string,
      empresaContratada: empresaContratada as string,
      search: search as string,
    };

    try {
      const result = await contratosService.listarContratos(filters);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao listar contratos' });
    }
  },

  async buscarPorId(req: Request, res: Response) {
    try {
      const contrato = await contratosService.buscarPorId(req.params.id);
      if (!contrato) return res.status(404).json({ message: 'Contrato não encontrado' });
      res.json(contrato);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar contrato' });
    }
  },

  async atualizar(req: Request, res: Response) {
    try {
      const contrato = await contratosService.atualizarContrato(req.params.id, req.body);
      if (!contrato) return res.status(404).json({ message: 'Contrato não encontrado' });
      res.json(contrato);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao atualizar contrato' });
    }
  },

  async encerrar(req: Request, res: Response) {
    try {
      const contrato = await contratosService.encerrarContrato(req.params.id);
      if (!contrato) return res.status(404).json({ message: 'Contrato não encontrado' });
      res.json(contrato);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao encerrar contrato' });
    }
  },

  async registrarPesquisa(req: Request, res: Response) {
    try {
      const contrato = await contratosService.registrarPesquisaDePrecos(req.params.id, req.body.fontes || req.body);
      if (!contrato) return res.status(404).json({ message: 'Contrato não encontrado' });
      res.json(contrato);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao registrar pesquisa de preços' });
    }
  },

  async visaoGeral(_req: Request, res: Response) {
    try {
      const overview = await contratosService.obterVisaoGeral();
      res.json(overview);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao gerar visão geral' });
    }
  },
};
