# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Recharts
- **State**: Zustand (role store), TanStack React Query (server state)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Financial Dashboard (`/`)

A personal finance tracker built with React + Vite. Features:
- Dashboard overview with summary cards, balance trend chart, spending by category
- Transactions list with search, filter (by type/category), and sort
- Insights page with monthly comparison chart, spending breakdown, savings rate
- Role-based UI: toggle between Viewer (read-only) and Admin (can add/edit/delete)
- Dark mode support via next-themes
- Role and theme persisted in localStorage

### API Server (`/api`)

Express 5 backend serving the finance dashboard data.

## Database Schema

- `transactions` — financial transactions with description, amount, type (income/expense), category, date
