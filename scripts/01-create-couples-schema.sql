-- Creating couples app database schema
CREATE TABLE IF NOT EXISTS couples (
  id SERIAL PRIMARY KEY,
  couple_username VARCHAR(50) UNIQUE NOT NULL,
  partner1_id TEXT REFERENCES neon_auth.users_sync(id),
  partner2_id TEXT REFERENCES neon_auth.users_sync(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES neon_auth.users_sync(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- text, image, audio
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES neon_auth.users_sync(id),
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id) -- One reaction per user per message
);

CREATE TABLE IF NOT EXISTS pinned_messages (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE,
  pinned_by TEXT REFERENCES neon_auth.users_sync(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id) -- Each message can only be pinned once
);

CREATE TABLE IF NOT EXISTS feed_questions (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_by TEXT REFERENCES neon_auth.users_sync(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feed_replies (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES feed_questions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES neon_auth.users_sync(id),
  reply TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_photos (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE,
  uploaded_by TEXT REFERENCES neon_auth.users_sync(id),
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_highlighted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_couple_id ON messages(couple_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_feed_questions_couple_id ON feed_questions(couple_id);
CREATE INDEX IF NOT EXISTS idx_shared_photos_couple_id ON shared_photos(couple_id);
