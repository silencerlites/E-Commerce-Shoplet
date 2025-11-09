import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import initializeConfig from './libs/initializeSiteConfig';

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
  ],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());
app.set("trust proxy", 1);

// Apply rate limiting 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: any) => (req.user ? 100 : 10), // limit each IP to 100 requests
  message: { error: 'Too many requests, please try again later!.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: true, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: any) => req.ip, // Generate a unique identifier for the rate limit based on the IP address
});
app.use(limiter);

app.get('/gateway', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});

app.use("/admin", proxy('http://localhost:6005'));
app.use("/order", proxy('http://localhost:6004'));
app.use("/seller", proxy('http://localhost:6003'));
app.use("/product", proxy('http://localhost:6002'));
app.use("/", proxy('http://localhost:6001'));


const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  try {
    initializeConfig();
    console.log("Site config initialized successfully");
  } catch (error) {
    console.error("Failed to initializing site config:", error);
  }
});
server.on('error', console.error);
