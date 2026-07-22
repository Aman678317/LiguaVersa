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

## 🏆 Development Phases Completed
| Phase | Focus | Status |
| :--- | :--- | :---: |
| 1 | Architecture Audit | ✅ |
| 2 | AI Translation Architecture | ✅ |
| 3 | MCP Integration | ✅ |
| 4 | Live Voice Translation | ✅ |
| 5 | Multilingual Chat | ✅ |
| 6 | Live Captions & Subtitles | ✅ |
| 7 | User Preferences & Settings | ✅ |
| 8 | Analytics & Metering | ✅ |
| 9 | Security, DevOps & Production Hardening | ✅ |
| 10 | Final Validation & Production Release | ✅ |
| 11 | Enterprise Schedule Meeting System | ✅ |

## 📅 Enterprise Schedule Meeting System
The complete enterprise-grade scheduling system is implemented and integrated across the stack! Here's a breakdown of the new capabilities:

### 1. Database Persistence
Expanded the Prisma schema to natively support advanced scheduling features:
- **Meeting model**: Now includes password, waitingRoom, type, timezone, and recurringType.
- **MeetingParticipant**: Enhanced to support external email invitees and invite statuses (PENDING, ACCEPTED, DECLINED).
- **New Settings Models**: Created MeetingSettings, MeetingTranslationSettings, MeetingSummary, and MeetingReminder to store the rich configurations set from the modal.

### 2. Robust REST API (/meetings)
A fully-fledged MeetingsModule now handles the backend logic:
- `POST /meetings`: Creates a new meeting, associates it with the host, configures AI/Translation settings, sets up reminders, and parses participant emails to send invitations.
- `GET /meetings`: Fetches all of the current user's meetings (including Settings, Participants, and Translation properties).
- `GET /meetings/:id`, `PUT /meetings/:id`, `DELETE /meetings/:id`: Full CRUD operations.
- `POST /meetings/:id/join`: Evaluates passwords and waiting-room logic before allowing entry.

### 3. Frontend Integration
The React UI is deeply integrated with the new API:
- **Dashboard & Scheduling**: When you fill out the ScheduleMeetingModal and click "Schedule", it sends a real POST payload to the backend and immediately refreshes the "Upcoming Meetings" list.
- **Dynamic Calendar**: The CalendarTab consumes the live API data, dynamically organizing your scheduled meetings by their dates onto the interactive calendar grid.
- **Consolidated History**: The HistoryTab leverages `GET /meetings`, rendering the unified table view with real data, status tags (Scheduled, Live, Completed), and keyword search (even across AI Summaries).
- **Meeting Details Modal**: You can click "Delete" on a meeting card to fire a real DELETE request to the backend and remove it from your calendar. You can also click "Edit" to modify the meeting schedule.

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
GOOGLE_CLIENT_ID="your_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_oauth_client_secret"
FRONTEND_URL="http://localhost:5173"
AI_SERVICE_URL="http://localhost:8000"
```

### AI Service (`/ai-service/.env`)
```env
GEMINI_API_KEY="your_gemini_api_key"
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
