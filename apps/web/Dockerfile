# Guerrilla RS - Dockerfile Multistage
# USO 1: Fundamentos Privacy-First
# Build: docker build -t guerrillars-app .

# ==========================================
# STAGE 1: Dependencies
# ==========================================
FROM node:20-alpine AS deps

# Instalar dependencias del sistema necesarias para compilar módulos nativos
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar dependencias (incluyendo sharp, tesseract, etc.)
RUN npm ci --frozen-lockfile && \
    npm cache clean --force

# Generar cliente Prisma
RUN npx prisma generate

# ==========================================
# STAGE 2: Builder
# ==========================================
FROM node:20-alpine AS builder

# Instalar dependencias para build
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copiar código fuente
COPY . .

# Variables de entorno para build
ENV NODE_ENV=production
ENV PUBLIC_APP_URL=https://guerrillars.es

# Build de la aplicación SvelteKit
RUN npm run build

# ==========================================
# STAGE 3: Production
# ==========================================
FROM node:20-alpine AS production

# Instalar dependencias de runtime necesarias
# sharp: libvips
# tesseract: tesseract-ocr, tesseract-ocr-data-spa
# face-api: canvas dependencies
RUN apk add --no-cache \
    # Sharp dependencies
    vips-dev \
    libvips \
    # Tesseract OCR
    tesseract-ocr \
    tesseract-ocr-data-spa \
    # Canvas dependencies for face-api
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    # Utilidades
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

WORKDIR /app

# Copiar archivos necesarios desde builder
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./package.json
COPY --from=builder --chown=sveltekit:nodejs /app/prisma ./prisma

# Crear directorios necesarios
RUN mkdir -p /app/models /app/uploads /app/tmp && \
    chown -R sveltekit:nodejs /app

# Descargar modelos de face-api (opcional, puede montarse como volumen)
# RUN curl -L https://github.com/justadudewhohacks/face-api.js-models/raw/master/models.tar.gz | tar xz -C /app/models/

# Cambiar a usuario no-root
USER sveltekit

# Exponer puerto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicio
CMD ["node", "build"]

# ==========================================
# STAGE 4: Development (opcional)
# ==========================================
FROM node:20-alpine AS development

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    libvips \
    tesseract-ocr \
    tesseract-ocr-data-spa \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm install && npx prisma generate

COPY . .

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
