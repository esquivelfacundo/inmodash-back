# 🏢 API Backend - Sistema de Gestión Inmobiliaria

API REST para el sistema de gestión inmobiliaria construida con Node.js, Express, TypeScript y SQL Server.

## 🚀 Tecnologías

- **Express.js 5**: Framework web moderno
- **TypeScript 5**: Tipado estático y desarrollo robusto
- **Prisma 6**: ORM de última generación para SQL Server
- **SQL Server**: Base de datos empresarial
- **Node.js ≥18**: Runtime de JavaScript

## 📦 Instalación Rápida

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Sincronizar base de datos
npx prisma db push

# Iniciar en desarrollo
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno

- `DATABASE_URL`: Conexión a SQL Server
  - Formato: `sqlserver://localhost:1433;database=inmobiliaria;user=sa;password=TU_PASSWORD;encrypt=true;trustServerCertificate=true`
- `PORT`: Puerto del servidor (default: 3001)
- `NODE_ENV`: Entorno (development/production)
- `FRONTEND_URL`: URL del frontend para CORS

## 🗄️ Base de Datos

Ver datos:
```bash
npx prisma studio
```

## 📚 Documentación

Ver `BACKEND_IMPLEMENTATION_GUIDE.md` en el proyecto frontend para detalles completos.
