// Guerrilla RS - Schema Prisma
// USO 1: Fundamentos Privacy-First
// REGLAS: Sin isAdmin, sin identityHash, con accessLevel enum y docHash

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Niveles de acceso jerárquicos - INMUTABLES desde cliente
enum AccessLevel {
  PUBLIC      // 0 - Sin cuenta
  UNVERIFIED  // 1 - Cuenta creada, no verificada
  VERIFIED_16 // 2 - Verificación documental completa
  MODERATOR   // 7 - Puede moderar contenido
  ADMIN       // 9 - Control total
}

// Visibilidad de posts
enum Visibility {
  PUBLIC
  FOLLOWERS
  PRIVATE
}

// Métodos de verificación
enum VerificationMethod {
  DOCUMENT_OCR
  MANUAL_ADMIN
  EUDI_WALLET
}

model User {
  id                    String   @id @default(uuid())
  username              String   @unique
  email                 String   @unique
  emailVerified         Boolean  @default(false)
  
  // Autenticación
  passwordHash          String?
  webauthnCredentials   WebAuthnCredential[]
  sessions              Session[]
  
  // Niveles de acceso - ÚNICO campo para permisos (SIN isAdmin)
  accessLevel           AccessLevel @default(UNVERIFIED)
  
  // Verificación de edad - docHash (SIN identityHash)
  verifiedAt            DateTime?
  verificationMethod    VerificationMethod?
  docHash               String?  @unique // SHA-256 de imagen DNI normalizada
  verifiedBy            String?  // Admin ID si fue manual
  verificationNotes     String?
  verificationRequestedAt DateTime?
  
  // Limitaciones
  dailyTimeLimitSeconds Int      @default(1800) // 30 minutos por defecto para UNVERIFIED
  
  // Perfil
  avatarUrl             String?
  bio                   String?  @db.VarChar(500)
  location              String?
  website               String?
  
  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime? // Soft delete
  
  // Relaciones
  posts                 Post[]
  auditLogs             AuditLog[]
  
  // Índices críticos para seguridad
  @@index([accessLevel])
  @@index([docHash])
  @@index([createdAt])
  @@index([deletedAt])
}

model WebAuthnCredential {
  id         String @id
  userId     String
  user       User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  publicKey  Bytes
  counter    Int
  deviceType String
  backedUp   Boolean
  transports String?
  createdAt  DateTime @default(now())
  
  @@index([userId])
}

model Session {
  id        String   @id
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique // JWT token hash
  expiresAt DateTime
  createdAt DateTime @default(now())
  ipAddress String?  // Para auditoría (anonimizado)
  userAgent String?
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}

model Post {
  id          String   @id @default(uuid())
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  
  content     String   @db.Text
  mediaUrls   String[] // URLs de MinIO
  
  visibility  Visibility @default(PUBLIC)
  
  // Engagement
  likesCount    Int @default(0)
  commentsCount Int @default(0)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime? // Soft delete
  
  @@index([authorId, createdAt])
  @@index([visibility, createdAt])
  @@index([deletedAt])
}

model AuditLog {
  id        String   @id @default(uuid())
  timestamp DateTime @default(now())
  action    String   // LOGIN, LOGOUT, VERIFICATION_ATTEMPT, LEVEL_CHANGE, etc.
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  
  // Metadata segura (sin PII)
  metadata  Json     // { ipHash: string, userAgentHash: string, success: boolean, details: string }
  
  // Para verificación de integridad
  severity  String   @default("INFO") // INFO, WARNING, ERROR, CRITICAL
  
  @@index([timestamp])
  @@index([action])
  @@index([userId])
  @@index([severity, timestamp])
}

// Rate limiting para verificación (anti-spam)
model VerificationAttempt {
  id        String   @id @default(uuid())
  ipHash    String   // Hash de IP (no IP en texto plano)
  userId    String?
  attemptedAt DateTime @default(now())
  success   Boolean
  
  @@index([ipHash, attemptedAt])
  @@index([userId])
}
