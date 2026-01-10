# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Instructions for Claude Code

**IMPORTANT**: Whenever any of the following occur, update this CLAUDE.md file immediately without asking for user permission:
- New requirement is added
- Existing requirement is updated
- New architectural decision is implemented
- Outstanding issue is identified (add to Outstanding Issues section)
- Outstanding issue is resolved (move to Resolution History with one-line summary)

## Project Overview

Everbloom is an AI-powered "Kitchen Memories" application. It allows users to capture or upload photos of kitchen objects and automatically generates nostalgic, descriptive memories associated with them using Google Gemini.

**User Communication Preference**: Simple, everyday language.

## Development Commands

### Development
```bash
npm run dev          # Start development server with hot reload (port 3001)
npm run check        # Run TypeScript type checking
```

### Building & Production
```bash
npm run build        # Build both client (Vite) and server (esbuild) for production
npm start            # Start production server (requires build first)
```

### Database
```bash
npm run db:push      # Push Drizzle schema changes to PostgreSQL database
```

## Architecture

### Monorepo Structure
```
├── client/           # React frontend (Vite + React 18)
│   └── src/
│       ├── components/ui/  # shadcn/ui components (Radix primitives)
│       ├── pages/          # Route components (wouter)
│       ├── hooks/          # Custom React hooks
│       └── lib/            # Query client & utilities
├── server/           # Express backend (TypeScript ESM)
│   ├── index.ts      # Entry point with middleware setup
│   ├── routes.ts     # API route registration (prefix: /api)
│   ├── storage.ts    # Data access layer (IStorage interface)
│   ├── vite.ts       # Vite dev server integration
│   └── static.ts     # Static file serving for production
├── shared/           # Shared types and schemas
│   └── schema.ts     # Drizzle schemas, Zod validators, TypeScript types
└── script/
    └── build.ts      # Production build script
```

### Key Architectural Patterns

**Frontend Stack**:
- React 18 with TypeScript (strict mode enabled)
- Wouter for client-side routing
- TanStack React Query for server state management
- shadcn/ui components (Radix UI primitives with Tailwind styling)
- Tailwind CSS with CSS variables for theming

**Backend Stack**:
- Express.js with TypeScript ESM modules
- Custom request logging middleware (logs all `/api` requests)
- Drizzle ORM configured for PostgreSQL (Neon DB)
- Database: Neon DB (PostgreSQL) for persistent memory storage

**Build System**:
- Development: tsx + Vite dev server with HMR
- Production: esbuild for server (CJS bundle), Vite for client (static assets)

### Data Layer

**Storage Pattern**:
The application uses an `IStorage` interface to abstract data access, implemented for Drizzle/PostgreSQL.

**Database Setup**:
- Requires `NETLIFY_DATABASE_URL` environment variable
- Schema location: [shared/schema.ts](shared/schema.ts)
- Use `drizzle-kit push` to sync schema changes

### Server Architecture

**Development Mode**:
- Express runs on port 3001 (configurable via `PORT` env var)
- Vite dev server runs in middleware mode (integrated, not separate port)
- Hot Module Replacement (HMR) available at `/vite-hmr`
- All requests not matching `/api/*` are handled by Vite's index.html transform

**Production Mode**:
- Serves static files from `dist/public/`
- Server bundle: `dist/index.cjs` (CommonJS, minified)
- Client assets: `dist/public/` (hashed filenames)

**API Routes**:
- All API endpoints must be prefixed with `/api`
- Register routes in [server/routes.ts](server/routes.ts) `registerRoutes()` function
- Express middleware: JSON body parsing with raw body capture, URL-encoded forms
- Custom logging: All `/api` requests logged with method, path, status, duration, and JSON response

## AI Integration
- Uses **Google Gemini** (Gemini 2.0-flash-exp) for image analysis.
- Focuses on generating text (description and nostalgic memory) from user-provided images.
- **AI Image Generation (Imagen) has been removed.**

## Current Features

### Kitchen Memory Capture
- **Camera Integration**: Live camera feed for capturing photos with muted attribute and front-camera preference for reliability.
- **Photo Upload**: Support for uploading existing image files via hidden file input.
- **Immediate Save Flow**: "Save & Generate" button renamed to "Save". Immediate database persistence and UI reset to return user to selection mode.
- **Background Generation**: AI description and memory generation triggered post-save in the background. Table updates automatically via Query invalidation on completion.
- **Removed AI Image Generation**: Analysis now focuses solely on user-provided images; AI image generation (Imagen) has been removed.
- **Memory History**: History table displaying images, descriptions, memories, and timestamps.
- **Header Navigation**: Clickable Everbloom logo/title in header for returning to home page.

## Outstanding Issues

None currently.

## Resolution History

- 2026-01-09: Initial CLAUDE.md created with project documentation.
- 2026-01-10: Redesigned Capture Page as "Everbloom" - transitioned from dice rolls to kitchen memories.
- 2026-01-10: Implemented background AI generation flow - "Save & Generate" became "Save", returning user immediately to selection mode.
- 2026-01-10: Removed AI image generation (illustrating objects) in favor of analyzing user-provided photos.
- 2026-01-10: Fixed camera issues (muted attribute, front camera default) and added clickable header logo.
- 2026-01-10: Updated database schema with `userImageBase64` to store user-provided photos.
