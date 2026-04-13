import { io } from "socket.io-client";
import { API_BASE_URL } from "../constants/Config";

let socket = null;

/**
 * אתחול חיבור הסוקט במובייל
 */
export const initSocket = (token) => {
    if (socket) return socket;

    // ב-Expo/Mobile לעיתים צריך לוודא שה-transports כולל websocket
    socket = io(API_BASE_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true
    });

    socket.on("connect", () => {
        console.log("[Socket Mobile] Connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
        console.log("[Socket Mobile] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
        console.error("[Socket Mobile] Error:", err.message);
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
