// src/prisma/mode.enum.ts
export enum AuthMode {
  IITD_ONLY = 'IITD_ONLY',
  PASSWORD_ONLY = 'PASSWORD_ONLY',
  BOTH = 'BOTH',
}

export enum Type {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
}

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  SUPERADMIN = 'SUPERADMIN',
}
