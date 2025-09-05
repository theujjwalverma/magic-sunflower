# Couple Connect

A private social network for couples to share messages, photos, and memories.

## Features

- **Authentication**: Secure login and registration system
- **Private Messaging**: Share messages between partners
- **Photo Sharing**: Upload and share memories
- **Couple Feed**: Ask questions and share thoughts
- **Responsive Design**: Works on all devices
- **Progressive Web App (PWA)**: Installable, offline-capable, with native app experience
  - Offline functionality for viewing cached content
  - Background sync for messages and photos
  - App shortcuts for quick access to chat and feed
  - Native app-like installation on mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Neon
- **UI Components**: Radix UI, Shadcn/ui
- **Authentication**: NextAuth.js with credentials provider
- **Password Hashing**: bcryptjs

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Neon account)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install --legacy-peer-deps
   ```

3. Set up your environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local` with your actual values:

   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

4. Set up the database:

   ```bash
   # Run the SQL schema in lib/schema.sql
   psql $DATABASE_URL -f lib/schema.sql
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses a simple schema with the following tables:

- **users**: Stores user information (id, email, name, password, image, etc.)
- **messages**: For private messaging between users
- **photos**: For photo sharing
- **feed_posts**: For the couple feed

## Authentication Flow

1. **Registration**: Users register with email, name, and password
2. **Login**: Users log in with email and password
3. **Session**: JWT tokens are used for session management
4. **Protected Routes**: Middleware protects authenticated routes

## Development

### Adding New Features

1. Create API routes in `app/api/`
2. Add database queries in `lib/db.ts`
3. Create UI components in `components/`
4. Add pages in `app/`

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Base URL for NextAuth
- `NEXTAUTH_SECRET`: Secret for JWT encryption
- `EMAIL_*`: Optional email configuration for password reset

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js 15 and PostgreSQL.

## Progressive Web App (PWA)

Couple Connect is now a fully functional Progressive Web App with the following features:

### PWA Features

- **Installable**: Add to home screen on mobile devices and desktop
- **Offline Support**: View cached messages, photos, and feed content offline
- **Background Sync**: Automatically sync messages and photos when back online
- **App Shortcuts**: Quick access to chat and feed from app icon
- **Native Experience**: Runs in standalone mode without browser UI

### PWA Files

- `public/manifest.json` - App manifest with metadata and icons
- `public/sw.js` - Service worker for offline functionality and caching
- `components/pwa-register.tsx` - Service worker registration
- `components/pwa-install-prompt.tsx` - Installation prompt component
- `app/offline/page.tsx` - Offline fallback page

### Testing PWA Features

1. **Install the App**:

   - Open the app in Chrome/Edge on mobile or desktop
   - Look for the install prompt or "Add to Home Screen" option
   - Or use the custom install button that appears after 3 seconds

2. **Test Offline Mode**:

   - Install the app and open it
   - Go offline (turn off internet)
   - Try accessing different pages and features
   - Messages and photos should still load from cache

3. **Background Sync**:

   - Send messages or upload photos while offline
   - Turn internet back on
   - Messages/photos should sync automatically

4. **App Shortcuts** (Android):
   - Long-press the app icon on home screen
   - Access quick shortcuts to Chat and Feed

### PWA Icons

The app uses the following icon sizes:

- `icon-192x192.png` - Standard app icon
- `icon-512x512.png` - Large app icon for high-DPI displays
- `apple-touch-icon.png` - iOS home screen icon

### Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12.1+
- Edge 79+

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- CSRF protection
- Secure session management
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
