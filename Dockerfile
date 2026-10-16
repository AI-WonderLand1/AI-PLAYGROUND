# Build browser-facing Vite files in GitHub Actions, never on HostBrr.
# Only Supabase project URL and PUBLISHABLE key are build arguments.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_ANON_KEY" && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3001 PLAYGROUND_LEGACY_STRIPE_WEBHOOK_ENABLED=false
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY server ./server
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
