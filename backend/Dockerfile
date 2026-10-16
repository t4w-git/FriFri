FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["npm", "start"]
