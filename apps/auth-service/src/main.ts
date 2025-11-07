import express from 'express';
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 3ebf8ac (Shoplet Base Code w/ 7 Service Apps)
import cors from 'cors';
import { errorMiddleware } from '@packages/error-handler/error-middleware';
import cookieParser from 'cookie-parser';
import router from './routes/auth.router';
import swaggerUi from 'swagger-ui-express';
<<<<<<< HEAD

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
=======
>>>>>>> 3ebf8ac (Shoplet Base Code w/ 7 Service Apps)

const swaggerDocument = require('./swagger-output.json');

const app = express();

<<<<<<< HEAD
>>>>>>> cc3b075 (Initial commit)
=======
app.use(cors({
  origin: ["http://localhost:3000"],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser())

>>>>>>> 3ebf8ac (Shoplet Base Code w/ 7 Service Apps)
app.get('/', (req, res) => {
    res.send({ 'message': 'Hello API'});
});

<<<<<<< HEAD
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
=======
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

>>>>>>> 3ebf8ac (Shoplet Base Code w/ 7 Service Apps)
