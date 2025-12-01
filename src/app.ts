import express from 'express';
import contratosRoutes from './modules/contracts/contracts.routes.js';

const app = express();

app.use(express.json());
app.use('/api/contratos', contratosRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
