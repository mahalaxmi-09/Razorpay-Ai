import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable cross-origin resource sharing
app.use(cors());

// Express json parser capturing raw request buffers for signature checking
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Global error boundary middleware (preventing internal stack leakages)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred on the server.'
    }
  });
});

// Start listener only when executed directly (not when imported as a serverless module)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 RazorRecover AI Server running on http://localhost:${PORT}`);
  });
}

export default app;
