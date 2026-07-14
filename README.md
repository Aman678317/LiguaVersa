<div align="center">
  <br />
  <h1>🌐 LinguaVerse</h1>
  <p>
    <strong>A next-generation enterprise video conferencing platform powered by real-time AI Translation.</strong>
  </p>
  <p>
    <a href="https://ligua-versa-uh2k.vercel.app/" target="_blank"><strong>✨ View Live Demo ✨</strong></a>
  </p>
  <br />
</div>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" alt="WebRTC" />
  <img src="https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Google Cloud" />
</p>

## ✨ Introduction
LinguaVerse breaks down language barriers in professional environments. It is a fully-featured, desktop-class web application that allows users to hold 1-on-1 video meetings while an integrated AI translates speech in real-time. Built with modern, glassmorphic UI aesthetics and high-performance WebRTC connections.

## 🚀 Key Features
- **Real-Time AI Translation:** Integrated with Google's Gemini AI to instantly translate chat and transcribe speech across different languages.
- **High-Quality Video Calling:** Powered by WebRTC for ultra-low latency, peer-to-peer video and audio streaming.
- **Enterprise Authentication:** Secure Google OAuth 2.0 integration and JWT-based authentication.
- **Live Presence Tracking:** Real-time green dot indicators show you exactly when your contacts are online using WebSockets.
- **Native OS Notifications:** Never miss a meeting with native Windows/macOS desktop push notifications for incoming calls.
- **Meeting History & Summaries:** Automatically logs past meetings.
- **Beautiful Glassmorphic UI:** A stunning, fully responsive dashboard built with modern CSS and Framer Motion animations.

## 🛠️ Technology Stack
### Frontend (Client)
- **Framework:** React.js (Vite)
- **Styling:** Vanilla CSS (Glassmorphism design system)
- **Animations:** Framer Motion
- **Video/Audio:** WebRTC (`simple-peer`)
- **Hosting:** Vercel

### Backend (Server)
- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Real-Time Engine:** Socket.io (WebSockets)
- **Authentication:** Passport.js (Google Strategy), JWT
- **AI Engine:** Google Generative AI (Gemini Flash)
- **Hosting:** Render

## ⚙️ Environment Variables
To run this project locally, you will need the following environment variables.

### Backend (`/backend/.env`)
```env
DATABASE_URL="postgresql://user:password@host:port/db?schema=public"
JWT_SECRET="your_jwt_secret"
GEMINI_API_KEY="your_google_gemini_api_key"
GOOGLE_CLIENT_ID="your_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_oauth_client_secret"
FRONTEND_URL="http://localhost:5173"
```

## 💻 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/priyanshu0707july-art/LiguaVersa.git
cd LiguaVersa
```

### 2. Start the Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

### 3. Start the Frontend
Open a new terminal window.
```bash
# From the project root
npm install
npm run dev
```
Visit `http://localhost:5173` in your browser.

## 🤝 Contact
Developed by Priyanshu. If you find this project interesting, feel free to star the repository!
