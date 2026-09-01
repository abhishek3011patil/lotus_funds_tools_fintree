FROM node:22-bookworm-slim AS frontend-build

WORKDIR /source/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./

ARG VITE_RAZORPAY_KEY_ID=""
ENV VITE_API_URL="" \
    VITE_RAZORPAY_KEY_ID=${VITE_RAZORPAY_KEY_ID}
RUN npm run build

FROM node:22-bookworm-slim AS backend-build

WORKDIR /source/backend
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:22-bookworm-slim AS production

ENV NODE_ENV=production \
    PORT=3000 \
    FRONTEND_DIST_PATH=/app/frontend

WORKDIR /app/backend
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force \
    && apt-get purge -y --auto-remove python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY --from=backend-build /source/backend/dist ./dist
COPY --from=frontend-build /source/frontend/dist /app/frontend

RUN mkdir -p /app/backend/uploads \
    && chown -R node:node /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/check').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
