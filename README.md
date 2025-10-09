# Stock Monitor Agent - Frontend

This is the frontend React application for the Stock Monitor Agent project, separated from the backend .NET API.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for development and building
- **TailwindCSS** for styling
- **SignalR** for real-time updates
- **React Query (TanStack)** for data fetching
- **React Router** for navigation
- **Recharts** for data visualization
- **Framer Motion** for animations

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- Backend API running on `https://localhost:7150` (or update `.env` file)

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Configuration

The `.env` file contains:

```env
VITE_API_URL=https://localhost:7150/api
VITE_SIGNALR_URL=https://localhost:7150/hubs/alerts
VITE_APP_NAME=Stock Monitor Agent
VITE_APP_VERSION=1.0.0
VITE_TOAST_DURATION=5000
```

Update these values if your backend runs on a different URL.

### 3. Run Development Server

```bash
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
# or
yarn build
```

The production build will be in the `dist/` folder.

### 5. Preview Production Build

```bash
npm run preview
# or
yarn preview
```

## Project Structure

```
src/
├── api/           # API client and axios configuration
├── components/    # Reusable UI components
├── contexts/      # React contexts (auth, theme, etc.)
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── services/      # Business logic and services
├── store/         # Redux store configuration
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

- 📊 Real-time stock monitoring dashboard
- 🔔 Alert system with SignalR notifications
- 📈 Technical analysis with indicators
- 👥 User management and authentication
- 📱 Responsive design
- 🌙 Dark mode support
- 📉 Trade tracking and watchlists
- 💼 Subscription tiers (Free, Pro, Premium)

## Backend Integration

This frontend connects to the StockMonitorAgent backend API. Make sure the backend is running before starting the frontend.

The Vite development server is configured with proxy settings to forward:
- `/api/*` requests to the backend API
- `/hubs/*` requests to the SignalR hubs

## Development Notes

- The app uses **React Query** for server state management
- **SignalR** connection is established for real-time updates
- Authentication tokens are stored in localStorage
- API base URL is configured via environment variables

### Cache Invalidation System

The app implements an intelligent cache invalidation system to ensure alerts are always up-to-date:

#### 1. **Watchlist Changes** (`WatchlistManager.tsx`)
- Automatically invalidates alert cache when adding/removing symbols
- Ensures new alerts for added symbols appear immediately

#### 2. **Dashboard Navigation** (`Dashboard.tsx`)
- Validates cache freshness when returning to Dashboard
- Auto-refreshes if data is older than 30 seconds
- Prevents stale data without manual refresh

#### 3. **Browser Tab Changes** (`useAlerts.ts`)
- Refreshes alerts when switching browser tabs/windows
- Uses `visibilitychange` API for detection

**Benefits:**
- ✅ No manual refresh (F5) needed
- ✅ Always shows latest trading signals
- ✅ Respects SignalR real-time updates
- ✅ Efficient - only fetches when necessary

**Console Logs:**
```
🔄 Caché de alertas invalidado después de agregar símbolo
🔄 Dashboard montado: Alertas tienen 45s - Invalidando caché...
✅ Dashboard montado: Alertas frescas (15s) - No se invalida caché
👁️ Usuario volvió - Refrescando alerts del servidor...
```

## Troubleshooting

### CORS Errors
If you encounter CORS errors, ensure the backend is configured to allow requests from `http://localhost:5173`.

### SignalR Connection Issues
Check that:
1. Backend is running
2. SignalR hub is properly configured
3. CORS allows WebSocket connections

### Build Errors
Make sure all dependencies are installed:
```bash
npm install
```

If TypeScript errors persist, try:
```bash
npm run build -- --force
```

## License

This project is part of the Stock Monitor Agent system.
