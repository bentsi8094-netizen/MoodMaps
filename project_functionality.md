# MoodMaps - Technical Architecture & Developer Documentation

## 1. System Overview
**MoodMaps** is a location-based social platforms that enables users to express and share their real-time emotional states on a collective digital map and a community feed. 

### Core Concept & Product Vision
The product is built around the idea of "Emotional Geography." Instead of static profiles, MoodMaps focuses on "the now." Users share their current mood through text, which is analyzed by AI to generate a representative emoji and a high-quality Giphy sticker. These moods are pinned to the user's GPS coordinates, creating a living, breathing emotional map of a city or community.

### Target Users & Use Cases
- **Community Seekers**: Users looking to see how others in their vicinity are feeling.
- **Micro-Bloggers**: People who want to log their emotional journey with a visual flair.
- **Local Interactions**: Discovering nearby users with similar moods to foster spontaneous social interaction.

---

## 2. Architecture Breakdown (Monorepo)
MoodMaps uses a monorepo structure to manage its three primary layers. This ensures a shared understanding of the API contracts and simplifies the synchronization of the data models.

- **`/server`**: The central Node.js/Express brain. It handles the single source of truth for all data and external integrations.
- **`/mobile`**: A React Native (Expo) application targeting iOS and Android. It focuses on a smooth, gesture-heavy mobile experience.
- **`/web`**: A web application built using React Native for Web. It mirrors the mobile functionality but is optimized for desktop and mobile browsers, deployed via Vercel.

### Data Flow
The architecture follows a standard **Client-Server-Database** pattern:
1.  **Clients** (Web/Mobile) manage local state via **Zustand**.
2.  State updates trigger asynchronous calls to the **Backend API**.
3.  The **Backend** processes logic, interacts with **Supabase (PostgreSQL)**, and returns a unified response.
4.  Clients update their global state, triggering UI re-renders across the Map and Feed components.

---

## 3. Backend (server)
The backend is a robust Express.js application designed for scalability and high-concurrency event handling.

### Entry Point (`server.js`)
The `server.js` file initializes the Express app, configures global middleware (CORS, JSON parsing), and defines the top-level route prefixes. It also includes a `/ping` health-check endpoint used by Render and external Cron jobs to monitor uptime.

### Middleware
- **Auth (protect)**: A JWT-based middleware that validates the `Authorization: Bearer <token>` header, attaching the `user_id` to the request object.
- **Error Handling**: A centralized catch-all middleware that logs stack traces and returns user-friendly Hebrew error messages.

### Routes & Controllers
- **`/api/users`**: Handles registration (with Cloudinary image upload), login, and profile retrieval.
- **`/api/posts`**: The core of the system. Includes:
    - `create`: Initializes a new active session.
    - `update-active`: Allows the AI agent to update the emoji/sticker of the current session.
    - `deactivate`: Manually closes a session.
    - `my-session`: Retrieves the user's current live status.
- **`/api/comments`**: Manages the social layer beneath each post.
- **`/api/ai`**: Orchestrates the communication with OpenAI for the mood analysis.

### Services & Integrations
- **Supabase**: Used as the primary PostgreSQL database and for its real-time capabilities.
- **Cloudinary**: Handles storage for user avatars and profile images.
- **OpenAI Service**: Wraps the GPT-4o API for sentiment analysis.
- **Giphy Service**: Converts AI-suggested terms into visual stickers.

---

## 4. Frontend (Mobile + Web)
The frontend layers share an identical service structure to maintain parity, but utilize platform-specific components where necessary.

### Shared State Management (`useAppStore.js`)
Zustand is the heart of the frontend. It manages:
- **Authentication State**: Persistence of tokens via `AsyncStorage` (web uses `localStorage` shim).
- **Post Persistence**: Local caching of the global feed.
- **Location Sync**: Periodic background GPS pings (mobile) and reactive location updates (web).
- **Session Cleanup**: Proactive logic to remove "ghost" posts (posts that the server no longer considers active).

### Navigation & UX
- **Mobile**: Uses `react-navigation` with a Bottom Tab layout (Map, Feed, New Post).
- **Web**: Uses `react-navigation` (integrated with browsers history API) for a semi-responsive layout that maintains the mobile-first aesthetic on larger screens.
- **Glassmorphism**: Both platforms use a custom `GlassCard` component to create a premium, translucent design language.

### API Communication Layer (`apiClient.js`)
A unified fetch wrapper that handles:
- Automatic inclusion of JWT tokens.
- 401 Unauthorized handling (automatic logout).
- Standardized success/error object responses.

---

## 5. AI Integration (The Agent)
The "AI Agent" is the primary USP (Unique Selling Proposition) of MoodMaps.

### The Flow:
1.  **Input**: User types "I'm feeling a bit overwhelmed but also hopeful."
2.  **Analysis**: The client sends this to `/api/ai/chat`.
3.  **Processing**: The backend prompts GPT-4o to return a JSON object containing:
    - `emoji`: A single representative character (e.g., 🌊).
    - `giphy_query`: A optimized search term (e.g., "tranquil ocean").
4.  **Sticker Fetch**: The backend immediately queries the Giphy SDK and returns the URL of a transparent sticker.
5.  **Finalization**: The user previews the sticker and "publishes" the update, which hits `/api/posts/update-active`.

---

## 6. Key Features & Logic

### Sliding 24h Session Window
Posts in MoodMaps are not permanent. A post is "Active" (visible on the map/feed) only if:
- It was created less than 24 hours ago.
- OR, there was "Liveness activity" (a new AI message or update) in the last 24 hours.
*Note: Comments do not extend liveness.*

### Location Seeding
To prevent markers from being missing, the frontend "seeds" the location by fetching the current GPS coordinates *before* the post-creation API call is fired. This ensures every active session has valid coordinates from the start.

### Map Clustering & Markers
The Map uses custom marker components (`UniversalMarker`) that are optimized for performance. On Web, these are direct overlays on the Google Maps JS SDK for maximum fluidness.

---

## 7. Important Design Decisions

- **Unidirection API (Web -> Server)**: To ensure stability, the `web` implementation was designed to follow the `server` API exactly, even when the `mobile` app contained legacy bugs. This makes the Web version the "Reference Implementation."
- **Monorepo Separation**: While files are shared, the `mobile` and `web` directories are kept separate to allow platform-specific build optimizations (Metro for mobile, Webpack/Vite for web via Expo).

---

## 8. Deployment Strategy

- **Backend**: Deployed on **Render** (as a Web Service).
- **Web App**: Deployed on **Vercel**. Requires SPA routing configuration in `vercel.json`.
- **Root Directory Strategy**: The project must use **Root Directory** settings in deployment providers (e.g., `server/` for the backend, `web/` for the website) to ensure correct dependency resolution.

---

## 9. Known Limitations & Future Roadmap

### Limitations
- **Cold Boot (Render Free Tier)**: The backend may take up to 30 seconds to spin up after inactivity, causing initial 504 errors on the frontend.
- **Location Permissions**: The map requires explicit user permission. If denied, the user remains invisible on the map.

### Roadmap
- **Push Notifications**: Real-time alerts when a user in your vicinity shares a core mood.
- **Direct Messaging**: Moving beyond public comments to private ephemeral chats.
- **Enhanced AI Customization**: Allowing users to refine the AI-generated sticker via further prompts.

---
**Prepared by**: Antigravity Technical Architecture Team
**Last Updated**: March 2026
