FROM node:18-alpine AS builder

WORKDIR /app

# Copy workspace-level manifests for all packages first (layer cache)
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/components/ui/package.json ./packages/components/ui/
COPY packages/components/customComponents/package.json ./packages/components/customComponents/
COPY packages/lib/package.json ./packages/lib/
COPY packages/models/package.json ./packages/models/
COPY packages/ui-styles/package.json ./packages/ui-styles/

RUN npm ci

COPY . .

# Firebase env vars are baked in at build time (NEXT_PUBLIC_ vars are static)
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

RUN npm run build -w apps/web

# ---- Serve with nginx ----
FROM nginx:alpine

COPY --from=builder /app/apps/web/out /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
