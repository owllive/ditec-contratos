import dotenv from 'dotenv';
import { contratosService } from '../modules/contracts/contracts.service.js';
import { prisma } from '../prisma/client.js';

dotenv.config();

async function run() {
  try {
    const result = await contratosService.atualizarStatusContratosPorData();
    console.log('Contratos atualizados:', result.atualizados);
  } catch (error) {
    console.error('Erro ao atualizar status dos contratos', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
