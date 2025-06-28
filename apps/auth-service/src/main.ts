import express from 'express';
<<<<<<< HEAD
import cors from 'cors';
import { errorMiddleware } from '@packages/error-handler/error-middleware';
import cookieParser from 'cookie-parser';
import router from './routes/auth.router';
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = require('./swagger-output.json');

const app = express();

app.use(cors({
  origin: ["http://localhost:3000"],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser())

=======

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

>>>>>>> cc3b075 (Initial commit)
app.get('/', (req, res) => {
    res.send({ 'message': 'Hello API'});
});

<<<<<<< HEAD
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/docs-json", (req, res) => { 
    res.json(swaggerDocument);
});

// Routes
app.use('/api', router);

app.use(errorMiddleware);

const port = process.env.PORT || 6001;
const server = app.listen(port, () => {
    console.log(`[ auth-service ] http://localhost:${port}/api`); 
    console.log(`[ swagger-docs ] http://localhost:${port}/docs`)
});

server.on('error', (err) => {
    console.error("Server Error: ", err);
});

=======
app.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
});
>>>>>>> cc3b075 (Initial commit)
