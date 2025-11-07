import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { errorMiddleware } from '@packages/error-handler/error-middleware';
import router from './routes/order.routes';
import { createOrder } from './controllers/order.controller';

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ✅ Stripe webhook — must come before express.json()
app.post(
  "/api/create-order",
  bodyParser.raw({ type: 'application/json' }),
  (req, res, next) => {
    (req as any).rawBody = req.body;
    next();
  },
  createOrder
);

// ✅ Normal middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ Other routes
app.get('/', (req, res) => {
  res.send({ message: 'Welcome to order-service!' });
});

app.use('/api', router);

// ✅ Error handler
app.use(errorMiddleware);

const port = process.env.PORT || 6004;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);