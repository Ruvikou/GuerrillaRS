# Guerrilla RS 🌿

> Red Social Privacy-First, Zero Third-Parties, Compliance EU

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.0-orange)](https://kit.svelte.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)

## 🌱 Filosofía

**Guerrilla RS** es una red social radicalmente privada, sin algoritmos, sin IA, con control total del usuario. Estética Solarpunk (naturaleza + tecnología).

- ✅ **Zero third-parties**: Sin Google Analytics, sin Cloudflare, sin CDNs externas
- ✅ **Data sovereignty**: Todos los datos permanecen en servidores bajo control directo
- ✅ **Verificación local**: DNIe o biometría on-premise, sin enviar documentos a terceros
- ✅ **Código abierto**: Stack completamente auditable

## 🏗️ Arquitectura

### Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Frontend** | SvelteKit (full-stack) |
| **Base de datos** | PostgreSQL 16 |
| **Caché** | KeyDB (Redis multi-thread) |
| **Almacenamiento** | MinIO (S3-compatible) |
| **Autenticación** | JWT ES256 + Argon2id + WebAuthn |
| **Verificación** | Tesseract OCR + Face-API.js |

### Niveles de Acceso

```typescript
enum AccessLevel {
  PUBLIC      = 0,  // Sin cuenta
  UNVERIFIED  = 1,  // Cuenta creada, no verificada
  VERIFIED_16 = 2,  // Verificación documental completa
  MODERATOR   = 7,  // Puede moderar contenido
  ADMIN       = 9   // Control total
}
```

## 🚀 Inicio Rápido

### Requisitos

- Node.js 20+
- Docker & Docker Compose
- 4GB RAM mínimo

### 1. Clonar y configurar

```bash
git clone https://github.com/guerrillars/guerrillars.git
cd guerrillars

# Copiar variables de entorno
cp apps/web/.env.example apps/web/.env

# Generar secrets (IMPORTANTE: cambiar en producción)
openssl rand -hex 32  # SESSION_SALT
openssl rand -hex 32  # EPHEMERAL_KEY
openssl ecparam -genkey -name prime256v1 -noout -out private.pem
openssl ec -in private.pem -pubout -out public.pem
```

### 2. Iniciar servicios

```bash
cd docker
docker-compose up -d

# Verificar estado
docker-compose ps
docker-compose logs -f app
```

### 3. Migrar base de datos

```bash
cd apps/web
npm install
npx prisma migrate dev
npx prisma generate
```

### 4. Iniciar desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
guerrillars/
├── apps/
│   └── web/                    # Aplicación SvelteKit
│       ├── src/
│       │   ├── lib/
│       │   │   ├── components/ # Componentes UI orgánicos
│       │   │   ├── server/     # Lógica server-side
│       │   │   │   ├── auth/   # Autenticación
│       │   │   │   ├── verification.ts  # Verificación DNI
│       │   │   │   └── permissions.ts   # Sistema de permisos
│       │   │   └── types/      # Tipos TypeScript
│       │   ├── routes/         # Rutas de la aplicación
│       │   │   ├── api/        # Endpoints API
│       │   │   │   ├── auth/   # Login/register/logout
│       │   │   │   └── verify/ # Verificación de edad
│       │   │   └── admin/      # Panel de administración
│       │   └── hooks.server.ts # Middleware de autenticación
│       ├── prisma/
│       │   └── schema.prisma   # Esquema de base de datos
│       ├── docs/
│       │   └── DESIGN_SYSTEM.md # Sistema de diseño Solarpunk
│       └── Dockerfile
├── docker/
│   └── docker-compose.yml      # Servicios: PostgreSQL, Redis, MinIO
└── README.md
```

## 🔐 Seguridad

### Reglas Absolutas

1. **NUNCA** usar `isAdmin` boolean. Usar únicamente `accessLevel` enum.
2. **NUNCA** usar `identityHash`. Usar `docHash`: SHA-256 de imagen DNI normalizada.
3. **NUNCA** confiar en cliente para permisos. Verificar `accessLevel` en BD en **CADA** request.
4. **NUNCA** persistir imágenes DNI. Borrado inmediato en `finally{}` tras extracción de datos.

### Verificación de Edad

El sistema de verificación:
1. Recibe imagen de documento + selfie (encriptadas)
2. Normaliza la imagen (grayscale, resize, threshold)
3. Genera hash SHA-256 (docHash)
4. Verifica duplicado en BD
5. OCR extrae fecha de nacimiento
6. Face-API compara rostros
7. **Borra todas las imágenes** inmediatamente

## 🎨 Design System

Ver [docs/DESIGN_SYSTEM.md](apps/web/docs/DESIGN_SYSTEM.md) para:
- Filosofía visual Solarpunk
- Tokens de diseño (colores, tipografía, espaciado)
- Componentes UI orgánicos
- Anti-patrones (qué NO copiar)

## 🧪 Testing

```bash
# Linting
npm run lint

# Type checking
npm run check

# Tests (próximamente)
npm test
```

## 📄 Licencia

AGPL-3.0 - Ver [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📞 Contacto

- Website: https://guerrillars.es
- Email: hola@guerrillars.es
- Matrix: #guerrillars:matrix.org

---

**Hecho con ❤️ y 🌱 para la comunidad.**
