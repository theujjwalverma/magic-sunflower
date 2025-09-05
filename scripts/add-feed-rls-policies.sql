-- Enable RLS on feed_questions table
ALTER TABLE feed_questions ENABLE ROW LEVEL SECURITY;

-- Users can read questions from their couple
CREATE POLICY "Users can read questions in their couple" ON feed_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM couples c
            WHERE c.id = feed_questions.couple_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

-- Users can insert questions to their couple
CREATE POLICY "Users can insert questions in their couple" ON feed_questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM couples c
            WHERE c.id = feed_questions.couple_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
        AND auth.uid() = feed_questions.created_by
    );

-- Users can delete their own questions
CREATE POLICY "Users can delete their own questions" ON feed_questions
    FOR DELETE USING (
        auth.uid() = feed_questions.created_by
    );

-- Enable RLS on feed_replies table
ALTER TABLE feed_replies ENABLE ROW LEVEL SECURITY;

-- Users can read replies from their couple's questions
CREATE POLICY "Users can read replies in their couple" ON feed_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM feed_questions fq
            JOIN couples c ON fq.couple_id = c.id
            WHERE fq.id = feed_replies.question_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
    );

-- Users can insert replies to questions in their couple
CREATE POLICY "Users can insert replies in their couple" ON feed_replies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM feed_questions fq
            JOIN couples c ON fq.couple_id = c.id
            WHERE fq.id = feed_replies.question_id
            AND (c.partner1_id = auth.uid() OR c.partner2_id = auth.uid())
        )
        AND auth.uid() = feed_replies.user_id
    );

-- Users can delete their own replies
CREATE POLICY "Users can delete their own replies" ON feed_replies
    FOR DELETE USING (
        auth.uid() = feed_replies.user_id
    );

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_feed_questions_couple ON feed_questions(couple_id);
CREATE INDEX IF NOT EXISTS idx_feed_questions_created_by ON feed_questions(created_by);
CREATE INDEX IF NOT EXISTS idx_feed_replies_question_id ON feed_replies(question_id);
CREATE INDEX IF NOT EXISTS idx_feed_replies_user_id ON feed_replies(user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON feed_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON feed_replies TO authenticated;
