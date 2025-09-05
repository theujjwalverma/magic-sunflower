-- Create user_fcm_tokens table for storing Firebase Cloud Messaging tokens
CREATE TABLE IF NOT EXISTS user_fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fcm_token)
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user_id ON user_fcm_tokens(user_id);

-- Create index for faster lookups by fcm_token
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_fcm_token ON user_fcm_tokens(fcm_token);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tokens
CREATE POLICY "Users can view own FCM tokens" 
ON user_fcm_tokens FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own tokens
CREATE POLICY "Users can insert own FCM tokens" 
ON user_fcm_tokens FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tokens
CREATE POLICY "Users can delete own FCM tokens" 
ON user_fcm_tokens FOR DELETE 
USING (auth.uid() = user_id);

-- Policy: Users can update their own tokens
CREATE POLICY "Users can update own FCM tokens" 
ON user_fcm_tokens FOR UPDATE 
USING (auth.uid() = user_id);
