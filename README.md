# Pothole Reporter Lebanon

A Progressive Web App (PWA) for reporting and tracking potholes on Lebanese roads. Users can report potholes with photos and GPS location, view all community reports on an interactive map, add comments, and confirm whether potholes are still present.

## Features

- **Report Potholes** — Submit reports with photos, descriptions, severity levels, and GPS-tagged locations
- **Interactive Map** — View all reported potholes on a Leaflet/OpenStreetMap map centered on Lebanon, color-coded by severity
- **Community Feed** — Browse all reports with filtering by status (active/fixed)
- **Comments** — Add comments to any report to provide updates or details
- **Confirmations** — Confirm if a pothole is still there or has been fixed
- **Photo Gallery** — Upload up to 5 photos per report with a lightbox viewer
- **PWA Support** — Installable on mobile devices with offline caching for map tiles and API responses
- **Geolocation** — Use device GPS to auto-detect your location when reporting

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Maps | Leaflet + OpenStreetMap |
| Backend | Express.js |
| Database | SQLite (via better-sqlite3) |
| File Upload | Multer |
| PWA | vite-plugin-pwa + Workbox |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

Run both frontend and backend in development mode:

```bash
npm run dev
```

This starts:
- **Vite dev server** at `http://localhost:5173` (with API proxy to backend)
- **Express API server** at `http://localhost:3000`

### Production

Build and start the production server:

```bash
npm run preview
```

Or build and run separately:

```bash
npm run build
npm start
```

The production server serves both the API and the built frontend at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports` | List all reports (query: `status`, `severity`, `limit`, `offset`) |
| `GET` | `/api/reports/:id` | Get a single report with comments and confirmations |
| `POST` | `/api/reports` | Create a new report (multipart form with photos) |
| `PATCH` | `/api/reports/:id/status` | Update report status |
| `POST` | `/api/reports/:id/comments` | Add a comment |
| `POST` | `/api/reports/:id/confirm` | Confirm or dispute a report |
| `GET` | `/api/stats` | Get aggregate statistics |

## Project Structure

```
├── server/
│   ├── index.js          # Express server entry
│   ├── db.js             # SQLite database setup
│   └── routes.js         # API routes
├── src/
│   ├── main.jsx          # React entry
│   ├── App.jsx           # Router setup
│   ├── api.js            # API client
│   ├── index.css         # Tailwind + custom styles
│   ├── components/
│   │   ├── Layout.jsx         # App shell with nav
│   │   ├── LocationPicker.jsx # Map-based location picker
│   │   ├── PhotoGallery.jsx   # Photo viewer with lightbox
│   │   ├── ReportCard.jsx     # Report list card
│   │   ├── SeverityBadge.jsx  # Severity indicator
│   │   ├── StatusBadge.jsx    # Status indicator
│   │   └── TimeAgo.jsx        # Relative time display
│   ├── hooks/
│   │   └── useUserName.js     # Persistent username
│   └── pages/
│       ├── HomePage.jsx       # Feed with stats
│       ├── MapPage.jsx        # Full map view
│       ├── NewReportPage.jsx  # Report form
│       └── ReportPage.jsx     # Report detail
├── public/
│   ├── favicon.svg
│   └── icons/
├── uploads/              # Uploaded photos
└── data/                 # SQLite database
```
