-- Enable Row Level Security on feed-related tables
ALTER TABLE feed_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_replies ENABLE ROW LEVEL SECURITY;

-- Policies for feed_questions table
-- Allow users to view questions from their couple
CREATE POLICY "Users can view feed questions from their couple" ON feed_questions
    FOR SELECT USING (
        couple_id IN (
            SELECT id FROM couples
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
    );

-- Allow users to create questions for their couple
CREATE POLICY "Users can create feed questions for their couple" ON feed_questions
    FOR INSERT WITH CHECK (
        couple_id IN (
            SELECT id FROM couples
            WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- Allow users to update questions they created
CREATE POLICY "Users can update their own feed questions" ON feed_questions
    FOR UPDATE USING (created_by = auth.uid());

-- Allow users to delete questions they created
CREATE POLICY "Users can delete their own feed questions" ON feed_questions
    FOR DELETE USING (created_by = auth.uid());

-- Policies for feed_replies table
-- Allow users to view replies to questions from their couple
CREATE POLICY "Users can view feed replies from their couple" ON feed_replies
    FOR SELECT USING (
        question_id IN (
            SELECT fq.id FROM feed_questions fq
            JOIN couples c ON fq.couple_id = c.id
            WHERE c.partner1_id = auth.uid() OR c.partner2_id = auth.uid()
        )
    );

-- Allow users to create replies to questions from their couple
CREATE POLICY "Users can create feed replies for their couple" ON feed_replies
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND question_id IN (
            SELECT fq.id FROM feed_questions fq
            JOIN couples c ON fq.couple_id = c.id
            WHERE c.partner1_id = auth.uid() OR c.partner2_id = auth.uid()
        )
    );

-- Allow users to update their own replies
CREATE POLICY "Users can update their own feed replies" ON feed_replies
    FOR UPDATE USING (user_id = auth.uid());

-- Allow users to delete their own replies
CREATE POLICY "Users can delete their own feed replies" ON feed_replies
    FOR DELETE USING (user_id = auth.uid());
