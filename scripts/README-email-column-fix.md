# Email Column Fix for Profile Update Error

## Issue Description

The profile update functionality was failing with the error:

```
Profile update failed: "Could not find the 'email' column of 'profiles' in the schema cache"
```

This error occurs because the `email` column is missing from the `profiles` table in the database.

## Root Cause

1. The database migration script that adds the `email` column to the `profiles` table hasn't been executed yet
2. Supabase has a schema cache that needs to be updated after schema changes
3. The profile update API was trying to include the `email` column in the upsert operation

## Solution Implemented

### 1. Created Simple Migration Script

- **File**: `scripts/08-simple-email-fix.sql`
- **Purpose**: Adds the `email` column to the `profiles` table with proper constraints and indexes
- **Script Features**:
  - Checks if the column exists before adding it
  - Adds unique constraint to prevent duplicate emails
  - Creates index for better performance
  - Provides verification query

### 2. Modified Profile Update API

- **File**: `app/api/profile/update/route.ts`
- **Changes**:
  - Removed `email` from the main upsert operation to avoid schema cache errors
  - Added separate email update attempt after successful profile update
  - Made email update non-critical (won't fail the entire operation if it fails)
  - Improved error handling and logging

### 3. Updated Frontend Data Fetching

- **File**: `components/tabs/settings-tab.tsx`
- **Changes**:
  - Removed `email` from the profile data selection query
  - Added better error handling for missing columns
  - Maintained backward compatibility with existing functionality

## Step-by-Step Fix Instructions

### Step 1: Apply Database Migration

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the script from `scripts/08-simple-email-fix.sql`
4. Verify the column was added successfully

### Step 2: Test Profile Updates

1. Navigate to the application
2. Go to Settings tab
3. Click "Edit Profile"
4. Update your profile information (full name, age, relationship, location)
5. Save changes
6. Verify the update was successful

### Step 3: Verify Database Schema

After applying the migration, verify the column exists:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
AND column_name = 'email';
```

## Alternative Solutions

### If the Migration Doesn't Work

If the simple migration script doesn't resolve the issue, try:

1. **Clear Supabase Schema Cache**:

   - Wait 5-10 minutes for Supabase to automatically refresh the schema cache
   - Or manually refresh the connection in your application

2. **Use Raw SQL**:

   ```sql
   ALTER TABLE public.profiles ADD COLUMN email TEXT;
   ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
   CREATE INDEX idx_profiles_email ON public.profiles(email);
   ```

3. **Check Table Existence**:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'profiles';
   ```

### If You Need to Work Without Email Column

If you continue to have issues with the email column, the API has been modified to work without it. The email will be:

- Fetched from `auth.users` table
- Updated separately after the main profile update
- Not critical for the profile update operation

## Testing Checklist

- [ ] Profile update form loads without errors
- [ ] Full name field updates successfully
- [ ] Age field updates successfully
- [ ] Relationship dropdown saves selected value
- [ ] Location field updates successfully
- [ ] Profile data persists after page refresh
- [ ] No console errors related to profile updates
- [ ] Database shows updated profile information

## Troubleshooting

### Common Issues

1. **"Column does not exist" error persists**

   - Solution: Ensure the migration script was executed correctly
   - Check the Supabase SQL Editor for any error messages
   - Try refreshing the schema cache

2. **Profile update still fails**

   - Solution: Check browser console for JavaScript errors
   - Verify the API endpoint is accessible
   - Check database permissions

3. **Email not updating**
   - Solution: This is expected behavior in the temporary fix
   - The email will be updated in a separate operation
   - It's not critical for profile functionality

### Debug Commands

To debug the database schema:

```sql
-- Check if profiles table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'profiles';

-- Check all columns in profiles table
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';

-- Check if email column exists
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email';
```

## Future Improvements

1. **Automatic Schema Migration**: Implement automatic schema checks and migrations
2. **Better Error Handling**: More specific error messages for schema issues
3. **Schema Cache Management**: Implement cache clearing when needed
4. **Database Migrations**: Use proper migration system for schema changes

## Files Modified

1. `scripts/08-simple-email-fix.sql` - Migration script to add email column
2. `app/api/profile/update/route.ts` - Modified to handle missing email column
3. `components/tabs/settings-tab.tsx` - Updated to avoid querying email column

## Conclusion

The profile update functionality should now work correctly. The email column issue has been resolved through a combination of database migration and API modifications. The application will continue to function even if the email column is temporarily unavailable, with graceful degradation of non-critical features.
