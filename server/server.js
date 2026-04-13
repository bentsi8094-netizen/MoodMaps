require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const rateLimit = require('express-rate-limit');
const socketService = require('./services/socketService');

// Routes
const user_routes = require('./routes/userRoutes');
const post_routes = require('./routes/postRoutes');
const comment_routes = require('./routes/commentRoutes');
const ai_routes = require('./routes/aiRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// הגבלת CORS לדומיינים ספציפיים
const whitelist = [
    'http://localhost:19006', 
    'http://localhost:8081',
    'http://localhost:19000',
    'http://localhost:3000',
    'https://moodmaps.vercel.app',
    /\.expo\.dev$/
];

const corsOptions = {
    origin: true, // מאפשר לכל מקור להתחבר לצורך בדיקה (יש להחזיר ל-Whitelist בייצור)
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// הגבלת קצב כללית
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: "יותר מדי בקשות, אנא נסה שוב מאוחר יותר" }
});
app.use('/api/', globalLimiter);

// אתחול Socket.io
socketService.init(server);

// API Routes
app.use('/api/users', user_routes);
app.use('/api/posts', post_routes);
app.use('/api/comments', comment_routes);
app.use('/api/ai', ai_routes);

app.get('/ping', (req, res) => res.status(200).send('pong'));
app.get('/', (req, res) => res.send('🚀 MoodMaps Server is Running with Socket.io Support'));

// Error handling
app.use((err, req, res, next) => {
    console.error(`[Server Error]: ${err.message}`);
    res.status(500).json({ success: false, error: "שגיאה פנימית בשרת" });
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: "הנתיב המבוקש לא נמצא" });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n--- 🚀 MOODMAPS SERVER STARTED ---`);
    console.log(`📍 PORT: ${PORT}`);
    
    const critical_vars = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_KEY', 'CLOUDINARY_CLOUD_NAME'];
    console.log(`\n📋 Environment Check:`);
    critical_vars.forEach(v => {
        console.log(`   ${v.padEnd(22)}: ${process.env[v] ? "✅ Loaded" : "❌ Missing"}`);
    });
    console.log(`----------------------------------\n`);
});