# DiceForge - Die Roller Application

## Overview

DiceForge is a hackathon-style die roller web application built by Giga Mangosteen Enterprises. The application features an interactive 3D isometric die visualization with configurable sides (6-24), roll animations, and a clean Material Design-inspired interface. Users can adjust the number of die sides via a slider and roll the die with animated visual feedback.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state, React useState for local UI state
- **Styling**: Tailwind CSS with CSS variables for theming
- **Component Library**: shadcn/ui (Radix UI primitives with custom styling)
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Development**: tsx for TypeScript execution, Vite dev server with HMR

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for shared types between client/server
- **Current Implementation**: In-memory storage (`MemStorage` class) as default, ready for PostgreSQL migration
- **Schema Validation**: Zod with drizzle-zod integration

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/ui/  # shadcn/ui components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and query client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Data access layer
│   └── vite.ts       # Vite dev server integration
├── shared/           # Shared code between client/server
│   └── schema.ts     # Database schema and types
└── migrations/       # Drizzle database migrations
```

### Design System
- **Typography**: Roboto font family (Google Fonts)
- **Color Scheme**: Material Design 3 inspired with teal primary accent
- **Layout**: Centered container (max-w-4xl) with consistent spacing
- **Theme**: Light mode default with dark mode support via CSS variables

## External Dependencies

### UI Framework
- **Radix UI**: Full suite of accessible, unstyled primitives (dialogs, dropdowns, sliders, etc.)
- **shadcn/ui**: Pre-configured component library built on Radix

### Data & Validation
- **Drizzle ORM**: Type-safe database toolkit (PostgreSQL configured)
- **Zod**: Schema validation for forms and API payloads
- **TanStack Query**: Async state management and caching

### Build & Development
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundling for production
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner (development only)

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **connect-pg-simple**: Session storage for Express (available but not currently implemented)

### Fonts & Icons
- **Google Fonts**: Roboto, DM Sans, Fira Code, Geist Mono, Architects Daughter
- **Lucide React**: Icon library