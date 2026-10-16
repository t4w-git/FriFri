#!/bin/bash

echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "Migration failed"
  exit 1
fi

echo "Seeding database..."
npm run seed

echo "Database setup complete"
