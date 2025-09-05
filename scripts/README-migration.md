# UUID Migration Guide

This guide will help you migrate your database from SERIAL to UUID primary keys to fix the registration error.

## Problem Summary

Your registration was failing with this error:

```json
{
  "code": "22P02",
  "message": "invalid input syntax for type integer: \"2c454f7e-493b-4f8b-a265-7504eba535e6\""
}
```

This occurred because:

- Your database schema used `SERIAL PRIMARY KEY` (integer auto-increment)
- Supabase Auth uses UUID strings for user IDs
- The mismatch caused a type conversion error

## Solution Overview

1. **Updated Schema**: Changed all primary keys from SERIAL to UUID
2. **Updated TypeScript Types**: Modified type definitions to use UUIDs
3. **Migration Script**: Created a script to migrate existing data
4. **Code Compatibility**: Verified existing code works with UUIDs

## Files Modified

### 1. `lib/schema.sql`

- Changed `users.id` from `SERIAL PRIMARY KEY` to `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Updated all foreign key references to use UUID types
- Added `uuid-ossp` extension
- Updated all table primary keys to use UUIDs

### 2. `types/supabase.ts`

- Updated all type definitions to use `string` instead of `number` for ID fields
- Updated all foreign key relationships to use UUID types

### 3. `scripts/migrate-to-uuid.sql`

- Comprehensive migration script to convert existing SERIAL data to UUIDs
- Handles all foreign key relationships
- Includes data integrity verification

## Migration Steps

### Step 1: Apply New Schema

First, apply the updated schema to your database:

```bash
# Connect to your Supabase database
# You can use the Supabase SQL editor or psql

# Run the updated schema
psql -h your-db-host -U your-user -d your-db -f lib/schema.sql
```

### Step 2: Run Migration Script

Execute the migration script to convert existing data:

```bash
psql -h your-db-host -U your-user -d your-db -f scripts/migrate-to-uuid.sql
```

### Step 3: Verify Migration

After running the migration script, check the output to ensure:

- All tables have the correct record counts
- No errors were reported
- Foreign key relationships are intact

### Step 4: Update TypeScript Types

The TypeScript types have already been updated in `types/supabase.ts`.
Your IDE should pick up these changes automatically.

### Step 5: Test Registration

Try registering a new user through your application. The registration should now work without the UUID/integer type mismatch error.

## Important Notes

### Backup Your Database

Before running any migration, ensure you have a complete backup of your database.

### Data Integrity

The migration script includes comprehensive data integrity checks. If you encounter any errors, review the script and ensure you understand what went wrong before proceeding.

### New User Registration

After migration, new users will get UUIDs automatically via `gen_random_uuid()`.

### Existing Users

Existing users will get new UUIDs generated during the migration. The old SERIAL IDs will no longer be used.

### Foreign Key Relationships

All foreign key relationships have been updated to use UUIDs. The migration script handles updating all references.

## Testing

After migration, test these scenarios:

1. **New User Registration**: Should work without errors
2. **User Login**: Existing users should still be able to log in
3. **Partner Matching**: Registration with partner email should work
4. **Data Relationships**: Verify that all relationships between tables work correctly

## Rollback Plan

If you need to rollback, you would need to:

1. Restore from your backup
2. Revert the schema changes in `lib/schema.sql`
3. Revert the type changes in `types/supabase.ts`

## Questions?

If you encounter any issues during migration:

1. Check this README for troubleshooting steps
2. Review the migration script for any specific error messages
3. Ensure you have proper database permissions
4. Consider consulting with a PostgreSQL expert if needed

## Next Steps

Once migration is complete:

1. Monitor your application for any unexpected behavior
2. Update any documentation that references database schema
3. Consider implementing proper UUID handling in your application code
4. Test all user flows thoroughly
