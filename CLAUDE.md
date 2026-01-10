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

DiceForge is a hackathon-style die roller web application built as a full-stack TypeScript monorepo. The application is designed to demonstrate Material Design principles with a 3D die visualization interface.

**User Communication Preference**: Simple, everyday language.

## Development Commands

### Development
```bash
npm run dev          # Start development server with hot reload (port 5000)
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
- Database: Neon DB (PostgreSQL) for persistent dice roll tracking via Netlify integration
- Storage: Automatically uses PostgreSQL when DATABASE_URL is set, otherwise falls back to MemStorage

**Build System**:
- Development: tsx + Vite dev server with HMR (integrated via middleware)
- Production: esbuild for server (CJS bundle), Vite for client (static assets)
- Build artifacts: `dist/index.cjs` (server) and `dist/public/` (client)

**Path Aliases** (defined in tsconfig.json and vite.config.ts):
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

### Data Layer

**Storage Pattern**:
The application uses an `IStorage` interface defined in [server/storage.ts](server/storage.ts) to abstract data access. The current implementation is `MemStorage` (in-memory Map), but this can be swapped for a Drizzle-based PostgreSQL implementation.

To add new data access methods:
1. Add method signature to `IStorage` interface
2. Implement in `MemStorage` class
3. Create corresponding Drizzle schema in [shared/schema.ts](shared/schema.ts)
4. Access via `storage` export in API routes

**Database Setup**:
- Requires `DATABASE_URL` environment variable for PostgreSQL
- Schema location: [shared/schema.ts](shared/schema.ts)
- Migrations output: `./migrations/`
- Use `drizzle-kit push` to sync schema changes

### Server Architecture

**Development Mode**:
- Express runs on port 5000 (configurable via `PORT` env var)
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

**Request Logging**:
The server includes custom middleware that logs all API requests with format:
```
HH:MM:SS AM/PM [express] METHOD /path STATUS in XXms :: {"response":"json"}
```

## Design System

**Material Design 3** principles with Tailwind CSS implementation:

- **Typography**: Roboto font (Google Fonts), hierarchical sizing (xs → 3xl)
- **Spacing**: Consistent Tailwind units (4, 8, 12, 16, 24)
- **Components**: shadcn/ui "new-york" style variant
- **Theme**: CSS variables in [client/src/index.css](client/src/index.css)
- **Colors**: Neutral base color with teal accent, CSS custom properties
- **Shadows**: Material elevation system (shadow-sm → shadow-xl)

See [design_guidelines.md](design_guidelines.md) for detailed design specifications including header/footer structure, die visualization requirements, and accessibility guidelines.

## Adding New Features

### Adding API Endpoints
1. Define route handler in [server/routes.ts](server/routes.ts) within `registerRoutes()`
2. Use `storage` interface for data access (e.g., `storage.getUser()`)
3. Prefix all routes with `/api` (e.g., `app.get('/api/users', ...)`)
4. Response format: JSON with appropriate HTTP status codes

### Adding Database Tables
1. Define table schema in [shared/schema.ts](shared/schema.ts) using Drizzle
2. Create Zod insert schema using `createInsertSchema()`
3. Export TypeScript types using `$inferSelect` and `z.infer`
4. Add corresponding methods to `IStorage` interface in [server/storage.ts](server/storage.ts)
5. Run `npm run db:push` to push schema changes

### Adding Frontend Pages
1. Create page component in [client/src/pages/](client/src/pages/)
2. Add route in [client/src/App.tsx](client/src/App.tsx) `<Switch>` component (wouter syntax)
3. Use TanStack Query hooks for server data fetching
4. Import shadcn/ui components from `@/components/ui`

### Adding shadcn/ui Components
shadcn/ui is configured with "new-york" style in [components.json](components.json). To add new components:
```bash
npx shadcn@latest add <component-name>
```
Components will be added to [client/src/components/ui/](client/src/components/ui/).

## Environment Variables

**Required for Production**:
- `PORT` - Server port (default: 5000, **must use this port - others are firewalled**)
- `NODE_ENV` - Set to "production" for production builds

**Required for PostgreSQL**:
- `NETLIFY_DATABASE_URL` - PostgreSQL connection string from Netlify Neon integration (automatically set in production, add to `.env` for local development)

**Required for AI Features**:
- `GEMINI_API_KEY` - Google Gemini API key for AI-generated kitchen memories and images (add to `.env` for local development and Netlify environment variables for production)

## Deployment

**Netlify Configuration**: The project includes [netlify.toml](netlify.toml) for static site deployment.
- Build command: `npm install && npx vite build`
- Publish directory: `dist/public`
- SPA redirect: `/* → /index.html` (status 200)

**Note**: Current Netlify config deploys only the frontend static build. For full-stack deployment with the Express backend, use a different platform (e.g., Railway, Fly.io, Render).

## TypeScript Configuration

- **Strict mode**: Enabled
- **Module system**: ESNext with bundler resolution
- **No emit**: TypeScript used for type checking only (tsx/Vite handle transpilation)
- **Include**: client, server, shared directories
- **Exclude**: node_modules, dist, build, test files

## Special Notes

- **Port Restriction**: The server MUST run on the port specified by `PORT` environment variable. Other ports are firewalled. Default is 5000.
- **Build Output**: Running `npm run build` clears the `dist/` directory and builds both client and server from scratch.
- **Dependencies**: The build script bundles select server dependencies (see allowlist in [script/build.ts](script/build.ts)) to optimize cold start times by reducing file system operations.
- **ESM Modules**: The project uses `"type": "module"` in package.json. All imports must use `.js` extensions or be configured in path aliases.

## Current Features

### Dice Roll Tracking
- **Session Management**: Each user session tracks dice rolls with a unique session ID
- **Roll Tallies**: Display real-time tallies for each die number (1 through max sides)
- **Database Storage**: Persistent storage using Neon DB (PostgreSQL)
- **Reset Functionality**: Users can reset tallies to start a new session
- **Smart Side Changes**:
  - Changing max die sides with existing tallies prompts confirmation and starts new session
  - Changing max die sides with no tallies does not require confirmation
- **Session Lifecycle**: New sessions start on first load, hard refresh, or explicit reset
- **Database Schema**: `dice_rolls` table with session_id (UUID), created_at, last_updated, rolls (int array), sides (int set after first roll), imageBase64 (text), imageDescription (text), memory (text)

### AI-Generated Kitchen Memories
- **Google Gemini Integration**: Uses Gemini 2.0-flash-exp for text generation and Imagen-3.0-generate-001 for image generation
- **Kitchen Object Images**: Each dice roll generates a 256x256px cartoonish image of a random kitchen object (23 objects: rolling pin, whisk, spatula, etc.)
- **Nostalgic Memories**: Generates fictional personal memories about the kitchen object with specific details and emotions
- **Image Descriptions**: Provides text descriptions of the generated images
- **Database Storage**: All three pieces (base64 image, description, memory) are saved to the dice_rolls table
- **Display**: New columns shown in the database debug table at bottom of page
- **Error Handling**: Graceful degradation - dice rolls continue to work even if Gemini API fails
- **Implementation**: Integrated into both Express routes ([server/routes.ts](server/routes.ts)) and Netlify serverless functions ([netlify/functions/api.ts](netlify/functions/api.ts))
- **Service Module**: [server/gemini.ts](server/gemini.ts) contains the core AI generation logic

## Outstanding Issues

None currently.

## Resolution History

- 2026-01-09: Initial CLAUDE.md created with project documentation and auto-update instructions
- 2026-01-09: Added dice roll tracking feature with Neon DB integration - tracks sessions, roll tallies, with smart reset logic
- 2026-01-09: Successfully set up Neon DB via Netlify CLI (v23.12.0 with --assume-no flag), pushed schema, created .env file, verified database persistence
- 2026-01-09: Standardized environment variable to use `NETLIFY_DATABASE_URL` consistently across all environments (local and production)
- 2026-01-10: Removed unnecessary users table and fixed PostgreSQL storage using Pool connection instead of neon-http, added dotenv for production .env loading
- 2026-01-10: Added Google Gemini AI integration - generates 256x256px cartoonish kitchen object images, nostalgic memories, and descriptions on each dice roll, stored in database and displayed in debug table
