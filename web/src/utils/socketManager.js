import { io } from "socket.io-client";
import { API_BASE_URL } from "../constants/Config";

let socket = null;

/**
 * אתחול חיבור הסוקט
 */
export const initSocket = (token) => {
    if (socket) return socket;

    socket = io(API_BASE_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 5000
    });

    socket.on("connect", () => {
        console.log("[Socket] Connected to server:", socket.id);
    });

    socket.on("disconnect", () => {
        console.log("[Socket] Disconnected");
    });

    socket.on("connect_error", (err) => {
        console.error("[Socket] Connection Error:", err.message);
    });

    return socket;
};

/**
 * קבלת המופע הנוכחי של הסוקט
 */
export const getSocket = () => socket;

/**
 * ניתוק הסוקט
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
