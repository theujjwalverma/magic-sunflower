-- Check the actual table definitions to understand ID column constraints
SELECT 
    table_name,
    column_name,
    column_default,
    is_nullable,
    data_type,
    identity_generation
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'id'
ORDER BY table_name;

-- Check if tables have IDENTITY constraints
SELECT 
    table_name,
    column_name,
    identity_generation,
    identity_start,
    identity_increment
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND identity_generation IS NOT NULL;
