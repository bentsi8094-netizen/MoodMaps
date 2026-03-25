# 🌍 MoodMaps: The Emotional Topography of Connection

**MoodMaps** is a futuristic, location-based social ecosystem designed to transform how we perceive and share human emotion in real-time. By combining **Generative AI** with **Dynamic Geolocation**, we've created a "Living Canvas" where every state of mind is a coordinate and every connection is meaningful.

---

## 🚀 Live Demo
- **Web App**: [https://mood-maps.vercel.app](https://mood-maps.vercel.app)
- **API (Status)**: [https://moodmaps-native.onrender.com/ping](https://moodmaps-native.onrender.com/ping)

---

## 🏗 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js |
| **Database** | Supabase (PostreSQL), Cloudinary (Images) |
| **Mobile** | React Native, Expo |
| **Web** | React Native for Web, Vercel |
| **State** | Zustand (Global State Management) |
| **AI** | OpenAI GPT-4o-mini |
| **Maps** | Google Maps SDK (Mobile & JS SDK for Web) |

---

## 📂 Monorepo Structure

```text
 MoodMaps/
 ├── server/             # Express.js Backend
 │   ├── routes/         # API Route definitions
 │   ├── controllers/    # Business logic & Database interaction
 │   ├── services/       # External API integrations (OpenAI, Giphy)
 │   └── server.js       # Main Entry Point
 ├── mobile/             # React Native (Expo) Mobile App
 │   ├── src/screens/    # App screens (Map, Feed, NewPost)
 │   ├── src/store/      # Global state (Zustand)
 │   └── src/services/   # API Client & Service layer
 └── web/                # React Native for Web (Vercel)
     ├── src/components/ # Web-optimized UI components
     ├── vercel.json     # Deployment configuration
     └── package.json    # Web-specific dependencies
```

---

## 🛠 Getting Started

### 1. Prerequisite
- Node.js (v18+)
- Expo Go (for mobile testing)
- Git

### 2. Installation
Run `npm install` in each directory to ensure all dependencies are correctly resolved:

```bash
# Install Backend dependencies
cd server && npm install

# Install Mobile dependencies
cd ../mobile && npm install

# Install Web dependencies
cd ../web && npm install
```

### 3. Environment Variables
Create a `.env` file in the following directories:

**`/server/.env`**:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_key
OPENAI_API_KEY=your_openai_key
JWT_SECRET=your_jwt_secret
```

**`/web/.env` & `/mobile/.env`**:
```env
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## 🏃‍♂️ Running Locally

### Start the Backend
```bash
cd server
npm run dev
```

### Start the Mobile App
```bash
cd mobile
npx expo start
```

### Start the Web App
```bash
cd web
npx expo start --web
```

---

## ☁️ Deployment

### Backend (Render)
- **Service Type**: Web Service
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### Web App (Vercel)
- **Framework Preset**: Other / Expo
- **Root Directory**: `web`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 🧩 Key Features

- **🧠 AI-Empathy Core**: GPT-4o analyzes your mood text and curates unique stickers via Giphy.
- **🛰 Real-time Mapping**: High-precision geolocation pins your mood to the map.
- **♻ 24-Hour Sliding Cycle**: Sessions automatically fade after 24 hours of inactivity to keep the map fresh and relevant.
- **💎 Glassmorphism UI**: A premium, futuristic dark-mode aesthetic consistent across all platforms.

---

## 🗺 Future Roadmap
- [ ] **Push Notifications**: Proximity-based alerts for nearby user moods.
- [ ] **Private Messaging**: Moving beyond community comments to private interactions.
- [ ] **Location Privacy Modes**: Allowing users to "blur" their exact coordinates.

---
*Created with passion for the next generation of social explorers.*