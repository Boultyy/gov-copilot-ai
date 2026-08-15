# UI/UX Redesign Plan

Redesign GovCopilot AI to feel like a premium, trustworthy Indian government digital platform (Modern SaaS + Digital India aesthetic).

## Design System Update

### Colors & Spacing
- Refine `oklch` values in `src/styles.css` for a more professional "Government Blue" palette.
- Implement a strict 8px spacing system via Tailwind classes.
- Soften shadows (`shadow-sm`, `shadow-md`) and increase border-radius for a friendlier feel.

### Typography
- Primary: **Plus Jakarta Sans** (Headings) - already in project but needs better hierarchy.
- Secondary: **Inter** (Body) - already in project.

## Layout & Navigation

### Global Layout (`src/routes/__root.tsx`)
- Redesign the `Sidebar` to be cleaner, using subtle borders and a refined logo area.
- Add a "Trust Bar" or footer indicators for "Official Government Information".
- Improve `Topbar` with a more integrated search and clearer user actions.

### Main Dashboard (`src/routes/index.tsx`)
- Replace the current analytical dashboard with a high-impact **Landing Dashboard**.
- **Hero Section**: Large, clear title "Your AI Copilot for Government Services".
- **Feature Cards**: Modern cards for "Discover Schemes", "Eligibility", "Document Assistant", etc.
- **Popular Services**: A horizontal grid of attractive service cards.
- **How it Works**: Simple 3-step visual guide.

## Module Redesigns

### Main Copilot Experience (`src/routes/copilot.tsx`)
- Redesign the chat interface into a premium full-page AI workspace.
- Left sidebar for history and saved items.
- Rich AI responses: Custom cards for schemes, eligibility results, and checklists.
- Quick action buttons (Primary CTA: "Start Application").

### Scheme Discovery (`src/routes/schemes.tsx`)
- Advanced filtering sidebar (Category, State, Age, Income).
- Results grid with clear eligibility badges (Eligible, May be Eligible, Not Eligible).

### Eligibility Checker (`src/routes/eligibility.tsx`)
- Multi-step wizard with a progress bar.
- Final "Result Card" summarizing benefits and next steps.

### Document Assistant & Application Tracker
- Redesign `src/routes/documents.tsx` and `src/routes/applications.tsx` to follow the new "Workspace" aesthetic.
- Use timeline views for tracking and status badges for document verification.

## Technical Implementation
- Use Radix UI primitives and Shadcn components.
- Implement Framer Motion for subtle transitions (Hero entrance, card hover).
- Maintain existing `createServerFn` and Supabase logic.

## Phased Rollout
1. **Phase 1**: Styles & Global Layout (CSS variables, Sidebar, Topbar).
2. **Phase 2**: Home Dashboard (New Landing experience).
3. **Phase 3**: Copilot & Module Screens.
4. **Phase 4**: Micro-interactions & Polishing.
