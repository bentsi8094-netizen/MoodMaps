const jwt = require('jsonwebtoken');

/**
 * Middleware להגנה על נתיבים (Routes)
 * מוודא שהמשתמש מחובר באמצעות בדיקת ה-JWT ב-Headers
 */
const protect = (req, res, next) => {
    let token;
    const auth_header = req.headers.authorization;

    // 1. בדיקה שהטוקן קיים בפורמט הנכון (Bearer <token>)
    if (auth_header && auth_header.startsWith('Bearer ')) {
        token = auth_header.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: "גישה נדחתה, לא נמצא טוקן אבטחה" 
        });
    }

    try {
        // 2. אימות הטוקן מול הסוד (JWT_SECRET)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        /* דיבאג: הדפסת תוכן הטוקן בשרת (רק בזמן פיתוח).
           כך תדע אם המזהה נשמר תחת .id, .sub או .userId
        */
        if (process.env.NODE_ENV === 'development') {
            console.log("[Auth Middleware] Decoded User:", decoded);
        }

        // 3. הזרקת פרטי המשתמש לבקשה (req.user)
        // עכשיו הקונטרולר יוכל לגשת ל-req.user.id
        req.user = decoded; 

        next();
    } catch (err) {
        console.error("[Auth Middleware] Error:", err.message);
        
        // טיפול במקרים של טוקן שפג תוקפו או חתימה לא תואמת
        const error_msg = err.name === 'TokenExpiredError' 
            ? "פג תוקף הטוקן, אנא התחבר מחדש" 
            : "טוקן לא תקין או פג תוקף";

        res.status(401).json({ 
            success: false, 
            error: error_msg 
        });
    }
};

module.exports = { protect };