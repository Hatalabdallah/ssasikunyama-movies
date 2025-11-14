import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path'; // ← Fixed: Changed from require to import
import { fileURLToPath } from 'url'; // ← Add this for __dirname equivalent

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import passwordRoutes from './routes/password.js';
import planRoutes from './routes/plans.js';
// import initDatabase from './utils/initDatabase.js';
import paymentRoutes from './routes/payments.js';
import movieRoutes from './routes/movies.js'; // ← Add this import

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- START CORS CONFIGURATION ---
const allowedOrigins = [
  // 1. Your deployed frontend URL (STATIC SITE)
  'https://loval-filmhub-1.onrender.com', 
  // 2. Optional: Your local frontend development URL
  'http://localhost:8080', 
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-domain requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  // Essential settings for credentials (cookies, auth headers) and HTTP methods
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, 
};

// Middleware
app.use(cors(corsOptions)); // <-- Apply the new, restricted CORS configuration
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/movies', movieRoutes); // Add this

// Initialize database
// initDatabase();


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
});