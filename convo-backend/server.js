import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';  // Change this line
import authRoutes from './routes/auth.js';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

mongoose.set('strictQuery', false);

dotenv.config({ path: join(__dirname, '.env') });  // Change this line

const app = express();

// Middleware
app.use(cors({ 
  origin: 'http://localhost:3000', 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Load environment variables
console.log('Environment variables loaded from:', join(__dirname, '.env'));
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('PORT:', process.env.PORT);

// MongoDB connection
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  console.error('Error details:', err.message);
  if (err.name === 'MongoParseError') {
    console.error('Please check your MONGODB_URI in the .env file');
  }
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);

// Registration route
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Log the received data (remove this in production)
    console.log('Received registration data:', { username, email, password: '***' });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    // Save the user to the database
    await newUser.save();

    // Return success response
    res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An error occurred during registration', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

server.on('error', (error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});

export const client = mongoose.connection.getClient();
export default app;