-- Script para crear la base de datos inmobiliaria
-- Ejecutar en SQL Server Management Studio (SSMS)

-- Verificar si la base de datos ya existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'inmobiliaria')
BEGIN
    CREATE DATABASE inmobiliaria;
    PRINT 'Base de datos "inmobiliaria" creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La base de datos "inmobiliaria" ya existe.';
END
GO

-- Usar la base de datos
USE inmobiliaria;
GO

-- Verificar la creación
SELECT 
    name AS 'Database Name',
    database_id AS 'ID',
    create_date AS 'Created Date',
    compatibility_level AS 'Compatibility Level'
FROM sys.databases 
WHERE name = 'inmobiliaria';
GO

PRINT 'Base de datos lista para usar con Prisma.';
GO
