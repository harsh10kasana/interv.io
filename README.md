# interv.io

An autonomous, full-stack AI-powered mock interview platform that conducts voice-driven technical interviews, evaluates candidate responses in real time, and delivers dynamic performance analytics. Built with React, Node.js, Express, MongoDB, Firebase Auth, and the OpenRouter API.

## Features

- **Hands-Free Autonomous Voice Loop** — zero-click interview arena powered by browser-native Web Speech APIs (`SpeechRecognition` & `SpeechSynthesis`) with cascading silence-detection timers.
- **Real-Time AI Response Evaluation** — passes candidate transcripts to LLMs via OpenRouter to grade answers instantly on technical correctness, communication clarity, and confidence.
- **Performance Analytics Dashboard** — full-page view tracking candidate progress over time with interactive trend charts built using `Recharts`.
- **Firebase Identity Management** — secure user accounts authenticated via Firebase Auth and protected using Firebase Admin token verification middleware.
- **Session Persistence & History** — stores complete interview transcripts, per-question metrics, and holistic evaluations in MongoDB.
- **Webcam & Live Audio Visualizer** — real-time camera feed alongside state-driven audio status indicators during speaking and listening phases.

## Tech Stack

**Frontend**
- React.js
- React Router (`BrowserRouter`)
- Tailwind CSS
- Framer Motion (animations & layout transitions)
- Recharts (analytics charts)
- Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- Axios & React Icons

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose ORM
- Firebase Admin SDK (token verification middleware)
- OpenRouter API (LLM evaluation engine)

## Project Structure

```
interv.io/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── InterviewArena.jsx  # Hands-free interview room
│   │   │   ├── Dashboard.jsx       # Analytics & session history
│   │   │   └── Auth.jsx            # Sign-in / Sign-up page
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Firebase auth provider
│   │   ├── config/
│   │   │   └── firebase.js         # Firebase client config
│   │   └── App.jsx                 # Routes & layout
│   ├── package.json
│   └── tailwind.config.js
│
└── server/                     # Express API
    ├── config/                 # DB & Firebase Admin setup
    ├── controllers/
    │   └── interview.controller.js # AI prompt & evaluation handlers
    ├── middleware/
    │   └── auth.middleware.js     # Firebase token guard
    ├── models/
    │   └── interview.model.js     # Mongoose schema for sessions
    ├── routes/
    │   └── interview.route.js
    ├── server.js
    └── package.json
```

## Setup

### 1. Clone and install

```bash
git clone https://github.com/yourusername/interv.io.git
cd interv.io

cd server && npm install
cd ../client && npm install
```

### 2. Environment variables

**`server/.env`**
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
OPENROUTER_API_KEY=your_openrouter_api_key
FIREBASE_SERVICE_ACCOUNT_KEY=path_to_firebase_service_account.json
```

**`client/.env`**
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_BACKEND_URL=http://localhost:5001
```

Neither `.env` file is committed — see `.gitignore`.

### 3. Firebase & OpenRouter setup

1. Create a Firebase project and enable **Email/Password** or **Google** as a sign-in provider under Authentication.
2. Generate a Service Account private key JSON file from Firebase Project Settings → Service Accounts and link it in `server/.env`.
3. Obtain an API key from [OpenRouter](https://openrouter.ai/) and add it to `server/.env`.

### 4. Run the backend

```bash
cd server
npm run dev
```
Runs on `http://localhost:5001` by default.

### 5. Run the frontend

```bash
cd client
npm run dev
```
Runs on `http://localhost:5173` by default.

## Usage

- Select a target job role and experience level, then enter the **Interview Arena**.
- Grant camera and microphone permissions when prompted.
- Click **Begin Interview** — the AI speaks the initial question out loud and automatically opens your microphone as soon as it finishes.
- Speak your response; the system detects silence for 5 seconds, automatically submits your answer, renders instant feedback, and advances to the next question.
- Upon completion of 5 questions, navigate to **Performance Analytics** to inspect scores, feedback breakdowns, and progression charts over time.

## Development Notes

- **Stale Closure Mitigation**: Asynchronous browser APIs (`setTimeout`) create closures that trap state snapshots. To prevent state trapping during automated answer submissions, rapidly changing state (`transcript`, `conversation`) is mirrored into background `useRef` pointers (`transcriptRef`, `conversationRef`).
- **Event-Driven Handoff**: Turn-taking is completely event-driven. The speech synthesis `utterance.onend` handler triggers `SpeechRecognition.start()`, ensuring the AI never speaks over the user.
- **Cascading Silence Detection**: Voice input utilizes a dual-timer approach—an absolute 7-second timer for total initial silence and a dynamic 5-second reset timer triggered by speech input (`onresult`)—to handle candidate hesitations gracefully.

## License

MIT