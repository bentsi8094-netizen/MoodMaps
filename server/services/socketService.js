const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabaseClient");

let io;

/**
 * אתחול שרת ה-Socket.io
 */
const init = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // בייצור ניתן להחמיר לרשימת ה-Whitelist שלנו
            methods: ["GET", "POST"]
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error"));

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error("Authentication error"));
            socket.user_id = decoded.id;
            next();
        });
    });

    io.on("connection", (socket) => {
        console.log(`[Socket] User connected: ${socket.user_id} (${socket.id})`);
        
        // הצטרפות לחדר פרטי לפי ID משתמש לצורך שליחת התראות אישיות
        socket.join(`user_${socket.user_id}`);

        socket.on("disconnect", () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
        });
    });

    setupSupabaseListener();
    console.log("✅ Socket.io initialized and listening to Supabase Realtime");
    return io;
};

/**
 * הקמת המאזין ל-Supabase בצד השרת
 */
const setupSupabaseListener = () => {
    // מאזין להתראות חדשות בטבלה
    supabase
        .channel('server-notifications')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications_history' },
            (payload) => {
                const newNotification = payload.new;
                console.log(`[Supabase] New notification for user: ${newNotification.user_id}`);
                
                // שליחה דרך Socket למשתמש הספציפי אם הוא מחובר
                if (io) {
                    io.to(`user_${newNotification.user_id}`).emit("new_notification", newNotification);
                }
            }
        )
        .subscribe();

    // מאזין לתגובות חדשות לשליחת עדכוני פיד בזמן אמת
    supabase
        .channel('server-comments')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'comments' },
            (payload) => {
                const newComment = payload.new;
                // בסידור הנוכחי, אנחנו פשוט שולחים שידור לכולם (Broadcast) או לחדר של הסשן
                if (io) {
                    io.emit("new_comment", newComment);
                }
            }
        )
        .subscribe();
};

/**
 * פונקציה לשליחת הודעה יזומה מהקוד (למשל מתוך קונטרולר)
 */
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
};

module.exports = { init, emitToUser };
