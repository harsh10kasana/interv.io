# Job Tracker

A Chrome extension that lets you log job applications in one click while browsing, and manage them from a dashboard. Auto-fills the role and company from the page you're on, syncs to your account via Google Sign-In, and tracks status (Applied, Interviewing, Offer, Rejected) over time.

## Features

- **One-click logging** — open the extension popup on any job posting page and it auto-fills the role, company, and URL from the page.
- **Google Sign-In** — accounts are tied to your Google identity via Firebase Auth, using Chrome's native `chrome.identity` API (no popup-blocked OAuth flows).
- **Dashboard** — a full-page view of all logged applications, with search, status filters, inline status updates, and delete.
- **Duplicate protection** — won't let you log the same job URL twice.
- **Per-user data** — every request is scoped to the signed-in user's Firebase UID on the backend.

## Tech Stack

**Extension / Frontend**
- React
- React Router (`HashRouter`, since Chrome extensions can't use browser history routing)
- Tailwind CSS
- Firebase Auth (Google provider via `chrome.identity`)
- Axios
- React Toastify

**Backend**
- Node.js + Express
- MongoDB (Mongoose)
- Firebase Admin SDK (verifies ID tokens from the extension)
- CORS (locked to the extension's origin)

## Project Structure

```
job-tracker/
├── extension/               # Chrome extension (React + Vite)
│   ├── src/
│   │   ├── popup/
│   │   │   ├── popup.jsx       # Quick-add job form
│   │   │   └── auth.jsx        # Google Sign-In screen
│   │   ├── pages/
│   │   │   └── dashboard.jsx   # Full dashboard view
│   │   ├── context/
│   │   │   └── authContext.jsx # Firebase auth state + login/logout
│   │   ├── utils/
│   │   │   └── firebase.js     # Firebase config/init
│   │   ├── content.js          # Reads job info from the current page
│   │   └── App.jsx             # Routes
│   ├── manifest.json
│   └── package.json
│
└── server/                  # Express API
    ├── controllers/
    │   └── job.controller.js
    ├── models/
    │   └── job.model.js
    ├── routes/
    │   ├── jobs.route.js
    │   └── auth.route.js
    ├── middleware/
    │   └── (Firebase token verification)
    ├── app.js
    └── package.json
```

## Setup

### 1. Clone and install

```bash
git clone https://github.com/yourusername/job-tracker.git
cd job-tracker

cd server && npm install
cd ../extension && npm install
```

### 2. Environment variables

**`server/.env`**
```
MONGO_URI=your_mongodb_connection_string
PORT=5001
```
(Plus whatever Firebase Admin credentials your server auth middleware expects.)

**`extension/.env`**
```
VITE_FIREBASE_APIKEY=your_firebase_api_key
```

Neither `.env` file is committed — see `.gitignore`.

### 3. Firebase & Google Cloud setup

1. Create a Firebase project and enable **Google** as a sign-in provider under Authentication.
2. In [Google Cloud Console](https://console.cloud.google.com/), under the same project, create an OAuth Client ID of type **Chrome Extension**.
3. Set the **Item ID** field to your extension's ID (find it at `chrome://extensions` with Developer Mode on, after loading the extension unpacked once).
4. Add that OAuth client ID to `extension/manifest.json`:
   ```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
     "scopes": ["openid", "email", "profile"]
   }
   ```

> **Note:** `chrome.identity.getAuthToken()` relies on Chrome's built-in Google account integration, so this sign-in flow only works in actual Google Chrome — not Chromium forks like Brave, Edge, or Opera.

### 4. Run the backend

```bash
cd server
npm start
```
Runs on `http://localhost:5001` by default.

### 5. Build and load the extension

```bash
cd extension
npm run build
```
Then in `chrome://extensions`:
1. Enable Developer Mode
2. **Load unpacked** → select the `extension/dist` folder

## Usage

- Click the extension icon on any job posting page → confirm/edit the auto-filled details → **Log application**.
- Click **Open Dashboard** to view, search, filter, update, or delete logged applications.
- Click **Logout** on the dashboard to sign out (also clears the cached Google token so the account picker reappears on next login).

## Development Notes

- The extension popup and dashboard are separate browser contexts (popup unmounts on close; dashboard is a full tab) — auth state is shared through Firebase's persisted session plus a shared `AuthContext`.
- Backend routes that mutate or fetch a specific job always scope queries by both `_id` and the requesting user's `userId` — never by `_id` alone — to prevent one user from accessing another's data.
- When developing with `npm run dev` (Vite dev server), you may see harmless console errors from Vite's HMR client being blocked by the extension's CSP. This doesn't affect functionality; it goes away once you build (`npm run build`) and load the built output instead.

## License

MIT