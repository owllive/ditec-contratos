import express from 'express';
import contratosRoutes from './modules/contracts/contracts.routes.js';
import path from 'path';

const app = express();

app.use(express.json());
app.use('/api/contratos', contratosRoutes);

app.use('/ui', express.static(path.resolve('stitch_tela_de_cadastro_de_usu_rio')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
