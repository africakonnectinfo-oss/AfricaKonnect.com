const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { testConnection } = require('./database/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');

dotenv.config();

const http = require('http');
const setupSocket = require('./socket');

// ... imports remain ...

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = setupSocket(server);
app.set('io', io); // Make io available in routes via req.app.get('io')

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for Socket.IO
}));

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general API rate limiting
app.use('/api/', apiLimiter);

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/experts', require('./routes/expertRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api', require('./routes/collaborationRoutes')); // Handling tasks, milestones, files, activity
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api', require('./routes/paymentRoutes')); // Handling escrow, releases
app.use('/api/files', require('./routes/fileRoutes'));

// Initialize Scheduled Jobs
const { initScheduledJobs } = require('./services/scheduledJobs');
initScheduledJobs();

// Health check route
app.get('/', (req, res) => {
    res.json({
        message: 'Africa Konnect API Running',
        version: '2.0.0',
        database: 'PostgreSQL',
        realtime: 'Enabled'
    });
});

// API info route
app.get('/api', (req, res) => {
    res.json({
        message: 'Africa Konnect API',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            experts: '/api/experts',
            projects: '/api/projects',
            contracts: '/api/contracts',
            messages: '/api/messages'
        }
    });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Please check your credentials.');
            console.log('Make sure you have set the DB_PASSWORD in your .env file');
            process.exit(1);
        }

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📊 Database: PostgreSQL (Supabase)`);
            console.log(`🔌 Socket.IO: Enabled`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`\n📡 API Endpoints:`);
            console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
            console.log(`   - Experts: http://localhost:${PORT}/api/experts`);
            console.log(`   - Projects: http://localhost:${PORT}/api/projects`);
            console.log(`   - Contracts: http://localhost:${PORT}/api/contracts`);
            console.log(`   - Messages: http://localhost:${PORT}/api/messages\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
