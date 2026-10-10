FROM mcr.microsoft.com/playwright:v1.64.0-noble

WORKDIR /app
ENV CI=true

COPY package.json package-lock.json ./
RUN npm ci

COPY playwright.config.ts tsconfig.json ./
COPY tests/ ./tests/
RUN npm run typecheck

CMD ["npm", "test", "--", "--workers=1"]
