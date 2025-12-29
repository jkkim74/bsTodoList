-- Add due_date column to daily_tasks table
ALTER TABLE daily_tasks ADD COLUMN due_date DATE;

-- Create index for due_date queries
CREATE INDEX IF NOT EXISTS idx_daily_tasks_due_date ON daily_tasks(due_date);

-- Create index for incomplete tasks with due dates
CREATE INDEX IF NOT EXISTS idx_daily_tasks_incomplete_due ON daily_tasks(user_id, status, due_date);
