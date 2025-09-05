# Database Profile Setup

This directory contains scripts for setting up the profiles table and related functionality in the Sunflower application.

## Files Overview

### 1. `05-create-profiles-table.sql`

Creates the basic profiles table structure with all required columns:

- `id` (UUID primary key, references auth.users)
- `full_name` (TEXT) - User's full name
- `email` (TEXT, unique) - User's email for partner lookup
- `username` (TEXT, unique) - Unique username
- `avatar_url` (TEXT, nullable) - URL to avatar image
- `website` (TEXT, nullable) - User's website
- `age` (INTEGER, nullable) - User's age
- `relationship` (TEXT, nullable) - Relationship status
- `location` (TEXT, nullable) - User's location
- `updated_at` (TIMESTAMP) - Last updated timestamp

### 2. `06-comprehensive-profile-migration.sql`

Comprehensive migration script that includes:

- Complete profiles table creation
- Database indexes for performance
- Automatic profile creation triggers for new users
- Profile update triggers for user updates
- Proper permissions setup

### 3. `03-add-profile-fields.sql` & `04-add-email-to-profiles.sql`

Legacy migration scripts for adding specific columns to existing profiles table.

## Setup Instructions

### For New Database Setup

1. Run the comprehensive migration script:
   ```sql
   -- Execute scripts/06-comprehensive-profile-migration.sql
   ```

### For Existing Database Setup

1. If profiles table doesn't exist, run:

   ```sql
   -- Execute scripts/05-create-profile-fields.sql
   -- Execute scripts/04-add-email-to-profiles.sql
   ```

2. Or run the comprehensive migration script which handles both cases:
   ```sql
   -- Execute scripts/06-comprehensive-profile-migration.sql
   ```

## Features Implemented

### Automatic Profile Creation

- New users automatically get a profile created when they sign up
- Profile is populated with user's email and full name from registration

### Profile Management

- Users can update their profile through the settings interface
- Profile fields include: full name, age, relationship status, location
- All changes are saved to the database with timestamps

### Partner Lookup

- Email field allows partner lookup functionality
- Unique constraint ensures no duplicate emails in profiles

### Error Handling

- Application gracefully handles missing profiles table
- Provides fallback UI when database is not accessible
- Comprehensive error logging for debugging

## API Endpoints

### Registration (`/api/auth/register`)

- Creates user in auth.users
- Automatically creates corresponding profile record
- Saves full name and email to profiles table

### Profile Update (`/api/profile/update`)

- Updates user profile information
- Handles all profile fields (full_name, age, relationship, location)
- Returns success/error messages

## Database Schema

The profiles table is designed to:

- Reference auth.users with ON DELETE CASCADE
- Provide comprehensive user information beyond basic auth
- Support partner relationship functionality
- Allow for future profile expansion

## Testing

After setup, test the following functionality:

1. User registration - should create profile automatically
2. Profile editing through settings interface
3. Data persistence after refresh
4. Partner linking functionality
5. Error handling when database is unavailable

## Troubleshooting

### Common Issues

1. **"column profiles.email does not exist"**

   - Run the comprehensive migration script to create the table
   - Ensure the database schema has been updated

2. **Permission denied errors**

   - Check that the authenticated role has proper permissions
   - Run the GRANT statements in the migration script

3. **Profile not updating**
   - Check the API response for error messages
   - Verify the user ID is being passed correctly
   - Check database logs for specific errors

### Debug Commands

```sql
-- Check if profiles table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check sample data
SELECT id, full_name, email, age, relationship, location
FROM public.profiles
LIMIT 10;
```
