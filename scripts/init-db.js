const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = "postgresql://neondb_owner:npg_LiIc3zbuRTB9@ep-fancy-darkness-ad9k5kva-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function initDatabase() {
  const sql = neon(DATABASE_URL);

  try {
    console.log("Initializing database schema...");

    // Users table for authentication
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255),
        email_verified TIMESTAMP,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Couples table
    await sql`
      CREATE TABLE IF NOT EXISTS couples (
        id SERIAL PRIMARY KEY,
        couple_username VARCHAR(100) UNIQUE NOT NULL,
        partner1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        partner2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Message reactions table
    await sql`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        emoji VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Feed questions table
    await sql`
      CREATE TABLE IF NOT EXISTS feed_questions (
        id SERIAL PRIMARY KEY,
        couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Feed replies table
    await sql`
      CREATE TABLE IF NOT EXISTS feed_replies (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES feed_questions(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reply TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Shared photos table
    await sql`
      CREATE TABLE IF NOT EXISTS shared_photos (
        id SERIAL PRIMARY KEY,
        couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE,
        uploaded_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        caption TEXT,
        is_highlighted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_couples_partner1 ON couples(partner1_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_couples_partner2 ON couples(partner2_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_couple ON messages(couple_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_feed_questions_couple ON feed_questions(couple_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shared_photos_couple ON shared_photos(couple_id);`;

    console.log("Database schema initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

initDatabase();
