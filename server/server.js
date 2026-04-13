require('dotenv').config();
const express = require('express');
const cors = require('cors');
const user_routes = require('./routes/userRoutes');
const post_routes = require('./routes/postRoutes');
const comment_routes = require('./routes/commentRoutes');
const ai_routes = require('./routes/aiRoutes');

const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// הגבלת CORS לדומיינים ספציפיים
const whitelist = [
    'http://localhost:19006', 
    'http://localhost:8081',
    'http://localhost:3000',
    'https://moodmaps.vercel.app', // דוגמה לדומיין Web
    /\.expo\.dev$/ // מאפשר גישה מ-Expo Go
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.some(domain => 
            typeof domain === 'string' ? domain === origin : domain.test(origin)
        )) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));

// הגבלת נפח בקשות למניעת התקפות DOS (שינוי מ-20mb ל-2mb)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// הגבלת קצב כללית (Global Rate Limiting) לכל ה-API
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 דקות
    max: 100, // מקסימום 100 בקשות מ-IP אחד
    message: { success: false, error: "יותר מדי בקשות, אנא נסה שוב מאוחר יותר" }
});
app.use('/api/', globalLimiter);

app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

app.use('/api/users', user_routes);
app.use('/api/posts', post_routes);
app.use('/api/comments', comment_routes);

app.use('/api/ai', ai_routes);

app.get('/', (req, res) => res.send('🚀 MoodMaps Server is Running'));

app.use((err, req, res, next) => {
    const error_stack = err.stack || 'No stack trace available';
    const error_message = err.message || 'Unknown error';
    console.error(`[Server Error]: ${error_message}\n${error_stack}`);
    
    res.status(500).json({ 
        success: false, 
        error: "שגיאה פנימית בשרת",
        message: error_message 
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: "הנתיב המבוקש לא נמצא" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n--- 🚀 MOODMAPS SERVER STARTED ---`);
    console.log(`📍 PORT: ${PORT}`);
    
    // Safety Check for Environment Variables
    const critical_vars = [
        'JWT_SECRET', 
        'SUPABASE_URL', 
        'SUPABASE_KEY', 
        'CLOUDINARY_CLOUD_NAME',
        'OPENAI_API_KEY'
    ];
    
    console.log(`\n📋 Environment Check:`);
    critical_vars.forEach(v => {
        const is_loaded = process.env[v] ? "✅ Loaded" : "❌ Missing";
        console.log(`   ${v.padEnd(22)}: ${is_loaded}`);
    });

    console.log(`\n📍 AI Engine: GPT-4o-mini`);
    console.log(`📍 Database: Supabase + Cloudinary`);
    console.log(`----------------------------------\n`);
});