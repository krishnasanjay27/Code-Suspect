import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.js';

const app = express();
app.use(cors({
    origin : 'http://localhost:5173'
}))

app.use(express.json());

app.use('/api/health', healthRoutes);

export default app;