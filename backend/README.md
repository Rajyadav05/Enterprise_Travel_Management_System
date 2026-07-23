# Enterprise Travel Management System — Backend

Production-grade backend API for the Enterprise Travel Management System (ETMS). This service handles travel requests, bookings, approvals, reporting, and organizational workflows.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT (planned) |
| Frontend | React + Tailwind (separate repo) |

## Folder Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema (models added later)
│   ├── migrations/         # Prisma migration history
│   └── seed.ts             # Database seed script
│
├── src/
│   ├── app.ts              # Express app configuration
│   ├── server.ts           # Server entry point
│   ├── config/             # Environment and app configuration
│   ├── common/             # Shared utilities and base classes
│   ├── middleware/         # Express middleware
│   ├── routes/             # Route aggregators
│   ├── modules/            # Feature modules (domain-driven)
│   │   ├── auth/
│   │   ├── employee/
│   │   ├── organization/
│   │   ├── travel/
│   │   ├── booking/
│   │   ├── reports/
│   │   ├── notification/
│   │   ├── documents/
│   │   ├── audit/
│   │   └── settings/
│   ├── services/           # Cross-cutting services
│   ├── utils/              # Helper functions
│   ├── types/              # Shared TypeScript types
│   └── constants/          # Application constants
│
├── uploads/                # User-uploaded files (git-ignored)
│   ├── tickets/
│   ├── invoices/
│   └── attachments/
│
├── reports/                # Generated report output
├── .env                    # Local environment variables (git-ignored)
├── .env.example            # Environment variable template
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### Installation

1. Clone the repository and navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment template and configure your variables:

   ```bash
   cp .env.example .env
   ```

   Update `DATABASE_URL` and other values in `.env` as needed.

4. Generate the Prisma client:

   ```bash
   npm run prisma:generate
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Verify the health check:

   ```bash
   curl http://localhost:5000/
   ```

   Expected response:

   ```json
   {
     "success": true,
     "application": "Enterprise Travel Management System",
     "version": "1.0.0",
     "status": "Running"
   }
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run the compiled production build |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |

## License

ISC
