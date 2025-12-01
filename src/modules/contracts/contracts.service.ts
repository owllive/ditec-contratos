import { prisma } from '../../prisma/client.js';
import {
  Contract,
  ModalidadeContrato,
  Prisma,
  StatusContrato,
} from '@prisma/client';

export interface ContractPayload {
  numeroContrato: string;
  processoLicitatorio?: string;
  orgaoResponsavel: string;
  empresaContratada: string;
  cnpjEmpresa: string;
  objetoContrato: string;
  dataInicio: string;
  dataFim: string;
  valorGlobal: number;
  modalidade: ModalidadeContrato;
  prazoMaximoMeses?: number;
  valorEstimado?: number;
  diferencaPercentual?: number;
}

export interface PriceSourceInput {
  fonte: string;
  url?: string;
  precoColetado: number;
  dataColeta: string;
}

export interface ContractFilters {
  page?: number;
  pageSize?: number;
  statusContrato?: StatusContrato;
  modalidade?: ModalidadeContrato;
  orgaoResponsavel?: string;
  empresaContratada?: string;
  search?: string;
}

export const calcularDiasRestantes = (dataFim: Date): number => {
  const hoje = new Date();
  const diff = dataFim.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const determinarStatusPorData = (dataFim: Date): StatusContrato => {
  const diasRestantes = calcularDiasRestantes(dataFim);

  if (diasRestantes < 0) {
    return StatusContrato.VENCIDO;
  }
  if (diasRestantes <= 90) {
    return StatusContrato.EM_ALERTA;
  }
  return StatusContrato.ATIVO;
};

const toDecimal = (value?: number | null): Prisma.Decimal | null => {
  if (value === undefined || value === null) return null;
  return new Prisma.Decimal(value);
};

const parseDate = (value: string): Date => new Date(value);

export const contratosService = {
  async criarContrato(payload: ContractPayload): Promise<Contract> {
    const dataFim = parseDate(payload.dataFim);
    const statusContrato = determinarStatusPorData(dataFim);

    const contrato = await prisma.contract.create({
      data: {
        numeroContrato: payload.numeroContrato,
        processoLicitatorio: payload.processoLicitatorio,
        orgaoResponsavel: payload.orgaoResponsavel,
        empresaContratada: payload.empresaContratada,
        cnpjEmpresa: payload.cnpjEmpresa,
        objetoContrato: payload.objetoContrato,
        dataInicio: parseDate(payload.dataInicio),
        dataFim,
        valorGlobal: new Prisma.Decimal(payload.valorGlobal),
        modalidade: payload.modalidade,
        statusContrato,
        prazoMaximoMeses: payload.prazoMaximoMeses ?? 60,
        valorEstimado: toDecimal(payload.valorEstimado ?? null),
        diferencaPercentual: toDecimal(payload.diferencaPercentual ?? null),
      },
    });

    return contrato;
  },

  async listarContratos(filters: ContractFilters) {
    const {
      page = 1,
      pageSize = 10,
      statusContrato,
      modalidade,
      orgaoResponsavel,
      empresaContratada,
      search,
    } = filters;

    const where: Prisma.ContractWhereInput = {
      statusContrato,
      modalidade,
      orgaoResponsavel: orgaoResponsavel
        ? { contains: orgaoResponsavel, mode: 'insensitive' }
        : undefined,
      empresaContratada: empresaContratada
        ? { contains: empresaContratada, mode: 'insensitive' }
        : undefined,
      OR: search
        ? [
            { numeroContrato: { contains: search, mode: 'insensitive' } },
            { objetoContrato: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [contratos, total] = await prisma.$transaction([
      prisma.contract.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      data: contratos,
      total,
      page,
      pageSize,
    };
  },

  async buscarPorId(id: string) {
    return prisma.contract.findUnique({ where: { id }, include: { priceSources: true } });
  },

  async atualizarContrato(id: string, payload: Partial<ContractPayload>) {
    const contratoExistente = await prisma.contract.findUnique({ where: { id } });
    if (!contratoExistente) return null;

    const dataFim = payload.dataFim ? parseDate(payload.dataFim) : contratoExistente.dataFim;
    const statusContrato =
      contratoExistente.statusContrato === StatusContrato.ENCERRADO
        ? StatusContrato.ENCERRADO
        : determinarStatusPorData(dataFim);

    const contratoAtualizado = await prisma.contract.update({
      where: { id },
      data: {
        ...payload,
        dataInicio: payload.dataInicio ? parseDate(payload.dataInicio) : undefined,
        dataFim,
        valorGlobal: payload.valorGlobal !== undefined ? new Prisma.Decimal(payload.valorGlobal) : undefined,
        statusContrato,
        valorEstimado:
          payload.valorEstimado !== undefined ? toDecimal(payload.valorEstimado) : undefined,
        diferencaPercentual:
          payload.diferencaPercentual !== undefined ? toDecimal(payload.diferencaPercentual) : undefined,
      },
    });

    return contratoAtualizado;
  },

  async encerrarContrato(id: string) {
    const contratoExistente = await prisma.contract.findUnique({ where: { id } });
    if (!contratoExistente) return null;

    return prisma.contract.update({
      where: { id },
      data: { statusContrato: StatusContrato.ENCERRADO },
    });
  },

  async atualizarStatusContratosPorData() {
    const contratos = await prisma.contract.findMany({
      where: { statusContrato: { not: StatusContrato.ENCERRADO } },
    });

    const updates = contratos.map((contrato) => {
      const statusContrato = determinarStatusPorData(contrato.dataFim);
      if (statusContrato === contrato.statusContrato) return null;
      return prisma.contract.update({ where: { id: contrato.id }, data: { statusContrato } });
    });

    const validUpdates = updates.filter(Boolean) as Promise<Contract>[];
    await Promise.all(validUpdates);

    return { atualizados: validUpdates.length };
  },

  async registrarPesquisaDePrecos(contractId: string, fontes: PriceSourceInput[]) {
    const contrato = await prisma.contract.findUnique({ where: { id: contractId } });
    if (!contrato) return null;

    await prisma.$transaction(async (tx) => {
      for (const fonte of fontes) {
        await tx.priceSource.create({
          data: {
            contractId,
            fonte: fonte.fonte,
            url: fonte.url,
            precoColetado: new Prisma.Decimal(fonte.precoColetado),
            dataColeta: parseDate(fonte.dataColeta),
          },
        });
      }

      const priceSources = await tx.priceSource.findMany({ where: { contractId } });
      const soma = priceSources.reduce((acc, item) => acc + Number(item.precoColetado), 0);
      const valorEstimado = priceSources.length ? soma / priceSources.length : 0;
      const diferencaPercentual = valorEstimado
        ? ((Number(contrato.valorGlobal) - valorEstimado) / valorEstimado) * 100
        : null;

      await tx.contract.update({
        where: { id: contractId },
        data: {
          valorEstimado: toDecimal(valorEstimado),
          diferencaPercentual: diferencaPercentual !== null ? toDecimal(diferencaPercentual) : null,
        },
      });
    });

    return this.buscarPorId(contractId);
  },

  async obterVisaoGeral() {
    const contratos = await prisma.contract.findMany({
      orderBy: { valorGlobal: 'asc' },
    });

    return contratos.map((contrato) => {
      const diasRestantes = calcularDiasRestantes(contrato.dataFim);
      const emAlerta = diasRestantes <= 90;
      return {
        id: contrato.id,
        numeroContrato: contrato.numeroContrato,
        orgaoResponsavel: contrato.orgaoResponsavel,
        empresaContratada: contrato.empresaContratada,
        modalidade: contrato.modalidade,
        dataInicio: contrato.dataInicio,
        dataFim: contrato.dataFim,
        diasRestantes,
        statusContrato: contrato.statusContrato,
        valorGlobal: contrato.valorGlobal,
        valorEstimado: contrato.valorEstimado,
        diferencaPercentual: contrato.diferencaPercentual,
        emAlerta,
      };
    });
  },
};
