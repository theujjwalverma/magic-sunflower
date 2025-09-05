const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Note: For direct PostgreSQL access, you would need to install 'pg' package
// and set DATABASE_URL environment variable
// For now, we'll work with the Supabase client

// Helper function to test table access and provide manual instructions
async function testTableAccess() {
  console.log('\n=== TABLE ACCESS TEST ===');

  // Test if we can access the table
  const { data: testData, error: testError } = await supabase
    .from('feed_reactions')
    .select('id')
    .limit(1);

  if (testError) {
    if (testError.code === 'PGRST205') {
      console.log('❌ Schema cache issue: Table exists but not in PostgREST cache');
      console.log('\n🔧 MANUAL FIX REQUIRED:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the SQL below:');

      const manualSQL = `
-- Create feed_reactions table (if not exists)
CREATE TABLE IF NOT EXISTS feed_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES feed_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Users can read reactions in their couple" ON feed_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM feed_questions fq
    JOIN couples c ON fq.couple_id = c.id
    WHERE fq.id = feed_reactions.question_id
    AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
  )
);

CREATE POLICY IF NOT EXISTS "Users can insert reactions in their couple" ON feed_reactions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM feed_questions fq
    JOIN couples c ON fq.couple_id = c.id
    WHERE fq.id = feed_reactions.question_id
    AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
  )
  AND auth.uid() = user_id
);

CREATE POLICY IF NOT EXISTS "Users can delete their own reactions" ON feed_reactions
FOR DELETE USING (auth.uid() = user_id);
      `;

      console.log('\n' + '='.repeat(60));
      console.log(manualSQL);
      console.log('='.repeat(60));

      console.log('\n4. After running the SQL, wait 1-2 minutes for schema cache to refresh');
      console.log('5. Test the reactions feature again');

    } else {
      console.error('❌ Different error accessing table:', testError);
    }
  } else {
    console.log('✅ Table is accessible and in schema cache');
    return true;
  }

  return false;
}

async function createFeedReactionsTable() {
  try {
    console.log('Setting up feed_reactions table and policies...');

    // First, test if the table is accessible
    const tableAccessible = await testTableAccess();

    if (!tableAccessible) {
      console.log('\n=== AUTOMATED TABLE CREATION ===');

      const { error } = await supabase
        .from('_supabase_migration_temp')
        .select('*')
        .limit(1);

      if (error) {
        console.log('Using direct SQL execution...');

        // Create the table if it doesn't exist
        const { data: createTableData, error: createTableError } = await supabase.rpc('exec_sql', {
          query: `
            CREATE TABLE IF NOT EXISTS feed_reactions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              question_id UUID REFERENCES feed_questions(id) ON DELETE CASCADE,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              emoji VARCHAR(10) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `,
          params: JSON.stringify([])
        });

        if (createTableError) {
          console.error('Table creation error:', createTableError);
        } else {
          console.log('Table created successfully');
        }

        // Enable RLS
        const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
          query: `ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;`,
          params: JSON.stringify([])
        });

        if (rlsError) {
          console.error('RLS enable error:', rlsError);
        } else {
          console.log('RLS enabled successfully');
        }

        // Create SELECT policy
        const { data: selectData, error: selectError } = await supabase.rpc('exec_sql', {
          query: `
            CREATE POLICY IF NOT EXISTS "Users can read reactions in their couple" ON feed_reactions
            FOR SELECT USING (
              EXISTS (
                SELECT 1 FROM feed_questions fq
                JOIN couples c ON fq.couple_id = c.id
                WHERE fq.id = feed_reactions.question_id
                AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
              )
            );
          `,
          params: JSON.stringify([])
        });

        if (selectError) {
          console.error('SELECT policy error:', selectError);
        } else {
          console.log('SELECT policy created successfully');
        }

        // Create INSERT policy
        const { data: insertData, error: insertError } = await supabase.rpc('exec_sql', {
          query: `
            CREATE POLICY IF NOT EXISTS "Users can insert reactions in their couple" ON feed_reactions
            FOR INSERT WITH CHECK (
              EXISTS (
                SELECT 1 FROM feed_questions fq
                JOIN couples c ON fq.couple_id = c.id
                WHERE fq.id = feed_reactions.question_id
                AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
              )
              AND auth.uid() = user_id
            );
          `,
          params: JSON.stringify([])
        });

        if (insertError) {
          console.error('INSERT policy error:', insertError);
        } else {
          console.log('INSERT policy created successfully');
        }

        // Create DELETE policy
        const { data: deleteData, error: deleteError } = await supabase.rpc('exec_sql', {
          query: `
            CREATE POLICY IF NOT EXISTS "Users can delete their own reactions" ON feed_reactions
            FOR DELETE USING (auth.uid() = user_id);
          `,
          params: JSON.stringify([])
        });

        if (deleteError) {
          console.error('DELETE policy error:', deleteError);
        } else {
          console.log('DELETE policy created successfully');
        }

        console.log('\nFeed reactions setup completed via automated script');
        console.log('⚠️  Note: If you still get schema cache errors, please follow the manual SQL instructions above.');
      }
    } else {
      console.log('✅ Table is already accessible - no action needed');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

createFeedReactionsTable();
