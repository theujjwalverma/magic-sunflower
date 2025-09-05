-- Simple script to add the email column to profiles table
-- This is a targeted fix for the schema cache issue

-- Add email column if it doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
            ALTER TABLE public.profiles ADD COLUMN email TEXT;
            RAISE NOTICE 'Added email column to profiles table';
        ELSE
            RAISE NOTICE 'Email column already exists in profiles table';
        END IF;
        
        -- Add unique constraint to email if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key') THEN
            ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
            RAISE NOTICE 'Added unique constraint to email column';
        END IF;
        
        -- Create index if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_email') THEN
            CREATE INDEX idx_profiles_email ON public.profiles(email);
            RAISE NOTICE 'Created index on email column';
        END IF;
        
        RAISE NOTICE 'Email column setup completed successfully';
    ELSE
        RAISE NOTICE 'Profiles table does not exist';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles' 
AND column_name = 'email';
