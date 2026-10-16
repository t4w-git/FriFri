# Frifri - Poetry Game Platform

A modern, full-stack web application for interactive poetry games and contests. Built with React, Vite, Express.js, and MariaDB.

## Features

- 🎮 Interactive poetry games with prizes
- 📜 Browse and submit poems
- 🎁 Prize code management
- 📧 Newsletter subscription system
- 🎯 Game session tracking
- 📊 Admin dashboard
- 🔐 JWT authentication with role-based access control
- ⚡ Rate limiting and caching
- 📈 Performance monitoring with Sentry

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- MySQL/MariaDB (or use the provided Docker setup)
- Redis (optional, or use the provided Docker setup)

## Setup Instructions

### Option 1: Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd frifri

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Start services
docker-compose up --build
```

Services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/v1/docs

### Option 2: Local Development

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Create .env files
cp .env.example ../.env.local
cp .env.example .env

# Update environment variables with your configuration

# Start Redis (required for rate limiting and caching)
redis-server

# In one terminal, start backend
npm run dev

# In another terminal, start frontend
cd ..
npm run dev
```

## Environment Variables

### Frontend (.env.local)

```env
VITE_BACKEND_URL=http://localhost:3000
```

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://frifri:frifri123@localhost:3306/frifri_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_key
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
SENTRY_DSN=https://your_sentry_key@sentry.io/your_project_id
```

## API Documentation

Swagger/OpenAPI documentation is available at:
- http://localhost:3000/api/v1/docs

## Project Structure

```
.
├── src/                    # Frontend (React + Vite)
│   ├── pages/             # Page components
│   ├── components/        # Reusable components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and context
│   └── utils/             # Helper functions
├── backend/               # Backend (Node.js + Express)
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── db/            # Database client
│   │   └── utils/         # Helper functions
│   ├── prisma/            # ORM schema and migrations
│   └── tests/             # Unit and integration tests
└── docker-compose.yml     # Docker orchestration
```

## Available Scripts

### Frontend

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Lint code
npm run lint:fix   # Fix linting issues
npm run typecheck  # Type check JavaScript
```

### Backend

```bash
cd backend
npm run dev        # Start development server with hot reload
npm run build      # Compile TypeScript
npm start          # Start production server
npm run test       # Run tests
npm run test:cov   # Run tests with coverage
```

## Database

The project uses MariaDB with Prisma ORM. Migrations are handled automatically by Prisma.

To manually run migrations:
```bash
cd backend
npx prisma migrate dev --name <migration_name>
npx prisma db push
```

## Testing

### Backend Tests

```bash
cd backend
npm run test              # Run all tests
npm run test:cov          # Run with coverage
npm run test:load         # Run load tests with k6
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## License

Proprietary - Frifri Project 2024

