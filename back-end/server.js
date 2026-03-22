require('dotenv').config();
const express = require('express');
const cors = require('cors');
const user_routes = require('./routes/userRoutes');
const post_routes = require('./routes/postRoutes');
const comment_routes = require('./routes/commentRoutes');
const ai_routes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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
    console.log(`📍 AI Engine: GPT-4o-mini`);
    console.log(`📍 Database: Supabase + Cloudinary`);
    console.log(`----------------------------------\n`);
});