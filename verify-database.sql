-- Script para verificar la estructura de la base de datos
-- Ejecutar en SSMS después de conectarte

USE inmobiliaria;
GO

-- Listar todas las tablas creadas
PRINT '========================================';
PRINT 'TABLAS EN LA BASE DE DATOS';
PRINT '========================================';
PRINT '';

SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO

PRINT '';
PRINT '========================================';
PRINT 'ESTRUCTURA DE CADA TABLA';
PRINT '========================================';
PRINT '';

-- Información detallada de cada tabla
SELECT 
    t.TABLE_NAME,
    c.COLUMN_NAME,
    c.DATA_TYPE,
    c.CHARACTER_MAXIMUM_LENGTH,
    c.IS_NULLABLE,
    CASE 
        WHEN pk.COLUMN_NAME IS NOT NULL THEN 'PK'
        ELSE ''
    END AS [KEY]
FROM INFORMATION_SCHEMA.TABLES t
INNER JOIN INFORMATION_SCHEMA.COLUMNS c 
    ON t.TABLE_NAME = c.TABLE_NAME
LEFT JOIN (
    SELECT ku.TABLE_NAME, ku.COLUMN_NAME
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
    INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
        ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
    WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
) pk ON c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
WHERE t.TABLE_TYPE = 'BASE TABLE'
ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION;
GO

-- Contar registros en cada tabla
PRINT '';
PRINT '========================================';
PRINT 'CONTEO DE REGISTROS';
PRINT '========================================';
PRINT '';

DECLARE @TableName NVARCHAR(128);
DECLARE @SQL NVARCHAR(MAX);

DECLARE table_cursor CURSOR FOR
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @TableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @SQL = 'SELECT ''' + @TableName + ''' AS TableName, COUNT(*) AS RecordCount FROM [' + @TableName + ']';
    EXEC sp_executesql @SQL;
    FETCH NEXT FROM table_cursor INTO @TableName;
END;

CLOSE table_cursor;
DEALLOCATE table_cursor;
GO

PRINT '';
PRINT '========================================';
PRINT 'VERIFICACIÓN COMPLETADA';
PRINT '========================================';
GO
