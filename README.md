# UCM Tracker

A React Native (Expo) mobile app for tracking stories, practice cards, monthly commitments, and outing logs with cloud sync via Supabase.

## Features

- **Stories** — name, optional colored tags, rich HTML notes
- **Card pool** — typed cards with difficulty, action, purpose, linked stories, completed-once flag
- **Monthly priorities** — drag-and-drop card ordering per month
- **Calendar tracker** — daily outing logs, weekly progress, starred days
- **Log templates** — customizable before/after sections (default prep & debrief included)
- **Cloud sync** — Supabase auth + Postgres with row-level security

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL schema in [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql) via the Supabase SQL editor

If you already have a database from an earlier version, apply only the missing changes instead of re-running the full schema. For example:

```sql
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS completed_once BOOLEAN NOT NULL DEFAULT FALSE;
```

3. Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
EXPO_PUBLIC_SINGLE_USER_EMAIL=you@example.com
EXPO_PUBLIC_SINGLE_USER_PASSWORD=your-password
```

The app auto-signs in with these credentials on launch — no login screen. On first run it creates the account if it doesn't exist yet. In Supabase, disable **Confirm email** under Authentication → Settings for seamless setup.

### 3. Run the app

```bash
npx expo start
```

Use Expo Go on your device, or press `i` / `a` for iOS/Android simulators.

### 4. Build for devices (optional)

```bash
npx eas build --profile preview --platform ios
npx eas build --profile preview --platform android
```

## Project structure

```
app/           Expo Router screens (auth, tabs)
src/
  components/  Shared UI
  hooks/       TanStack Query data hooks
  lib/         Supabase client, query provider
  types/       TypeScript types
  utils/       Helpers
supabase/      Database migrations
```

## Tech stack

- Expo SDK 57 + Expo Router
- Supabase (Auth, Postgres, RLS)
- TanStack Query + AsyncStorage persistence
- react-native-calendars, react-native-draggable-flatlist
- react-native-pell-rich-editor for story notes
