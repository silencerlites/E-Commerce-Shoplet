import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { errorMiddleware } from '@packages/error-handler/error-middleware';
import router from './routes/auth.router';


const swaggerDocument = require('./swagger-output.json');

const app = express();
const port = process.env.PORT || 6001;

// Middleware
app.use(cors({
  origin: ["http://localhost:3000"],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => res.send({ message: 'Hello API' }));
app.use('/api', router);

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/docs-json", (req, res) => res.json(swaggerDocument));

// Error handling
app.use(errorMiddleware);

// Start server
const server = app.listen(port, () => {
    console.log(`[ auth-service ] http://localhost:${port}/api`);
    console.log(`[ swagger-docs ] http://localhost:${port}/api-docs`);
});

server.on('error', (err) => console.error("Server Error: ", err));