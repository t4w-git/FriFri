# Frifri Backend

Backend enterprise-level per la piattaforma di giochi e poesie Frifri.

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Language**: TypeScript
- **Validation**: Zod
- **Testing**: Vitest + Supertest
- **Logging**: Pino
- **Container**: Docker + Docker Compose

## Struttura Progetto

```
src/
├── config.ts                 # Configurazione globale
├── logger.ts                 # Logger Pino
├── server.ts                 # Express app setup
├── db/
│   ├── client.ts            # Prisma client
│   ├── seed.ts              # Database seeding
│   └── migrate.ts           # Migrations
├── services/                 # Business logic
│   ├── poem.service.ts
│   ├── sponsor.service.ts
│   ├── prizecode.service.ts
│   ├── gamesession.service.ts
│   ├── newsletter.service.ts
│   └── __tests__/           # Unit tests
├── routes/                   # Express routes
│   ├── poems.routes.ts
│   ├── sponsors.routes.ts
│   ├── prizecodes.routes.ts
│   ├── gamesessions.routes.ts
│   ├── newsletter.routes.ts
│   └── admin.routes.ts
├── middleware/               # Express middleware
│   ├── auth.middleware.ts
│   └── validation.middleware.ts
├── schemas/                  # Zod validation schemas
│   ├── poem.schema.ts
│   ├── sponsor.schema.ts
│   ├── prizecode.schema.ts
│   ├── gamesession.schema.ts
│   └── newsletter.schema.ts
└── utils/
    └── errors.ts            # Custom error classes
prisma/
└── schema.prisma            # Database schema

```

## Setup

### Requisiti
- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- Docker (opzionale)

### Installazione

1. Installa dipendenze:
```bash
npm install
```

2. Crea `.env`:
```bash
cp .env.example .env
```

3. Configura le variabili d'ambiente:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/frifri_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173
```

4. Setup database:
```bash
npm run migrate
npm run seed
```

## Esecuzione

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Con Docker Compose
```bash
docker-compose -f docker-compose.yml up
```

## API Endpoints

### Poems
- `POST /api/v1/poems` - Crea poesia
- `GET /api/v1/poems` - Lista poesie
- `GET /api/v1/poems/:id` - Dettaglio poesia
- `PUT /api/v1/poems/:id` - Aggiorna poesia
- `DELETE /api/v1/poems/:id` - Elimina poesia

### Sponsors
- `POST /api/v1/sponsors` - Crea sponsor
- `GET /api/v1/sponsors` - Lista sponsor
- `GET /api/v1/sponsors/:id` - Dettaglio sponsor
- `PUT /api/v1/sponsors/:id` - Aggiorna sponsor
- `DELETE /api/v1/sponsors/:id` - Elimina sponsor
- `POST /api/v1/sponsors/:id/view` - Traccia view
- `POST /api/v1/sponsors/:id/play` - Traccia play

### Prize Codes
- `POST /api/v1/prize-codes` - Crea codice premio
- `GET /api/v1/prize-codes` - Lista codici
- `GET /api/v1/prize-codes/code/:code` - Valida codice
- `POST /api/v1/prize-codes/code/:code/redeem` - Riscatta codice
- `DELETE /api/v1/prize-codes/:id` - Elimina codice

### Game Sessions
- `POST /api/v1/game-sessions` - Crea sessione gioco
- `GET /api/v1/game-sessions` - Lista sessioni
- `GET /api/v1/game-sessions/stats` - Statistiche giochi
- `POST /api/v1/game-sessions/:id/claim-prize` - Riscatta premio

### Newsletter
- `POST /api/v1/newsletter/subscribe` - Iscriviti
- `GET /api/v1/newsletter` - Lista subscriber
- `POST /api/v1/newsletter/unsubscribe/:email` - Annulla iscrizione
- `DELETE /api/v1/newsletter/:id` - Elimina subscriber
- `GET /api/v1/newsletter/stats` - Statistiche newsletter

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard admin

## Testing

```bash
npm run test              # Esegui test
npm run test:coverage    # Coverage report
```

## Linting

```bash
npm run lint      # Check errori
npm run lint:fix  # Fix automatici
```

## Database

### Migrations
```bash
npm run migrate
```

### Reset Database
```bash
npm run db:reset
```

### Seeding
```bash
npm run seed
```

## Troubleshooting

### Database Connection Error
Verificare che PostgreSQL sia in esecuzione e che DATABASE_URL sia corretto.

### Port Already in Use
Cambiare PORT in .env (default 3000)

### Module Not Found
Eseguire `npm install` e verificare che tsconfig.json sia configurato correttamente.

## Roadmap

- [ ] Autenticazione JWT completamente integrata
- [ ] Email service integration (SendGrid/Nodemailer)
- [ ] Rate limiting e caching Redis
- [ ] File upload per immagini/audio
- [ ] Monitoring e error tracking (Sentry)
- [ ] API documentation Swagger/OpenAPI
- [ ] CI/CD GitHub Actions
- [ ] Load testing e optimization
