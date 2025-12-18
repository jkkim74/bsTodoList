-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    username TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    is_active INTEGER DEFAULT 1
);

-- Daily tasks table
CREATE TABLE IF NOT EXISTS daily_tasks (
    task_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_date DATE NOT NULL,
    step TEXT NOT NULL CHECK (step IN ('BRAIN_DUMP', 'CATEGORIZE', 'ACTION')),
    priority TEXT CHECK (priority IN ('URGENT_IMPORTANT', 'IMPORTANT', 'LATER', 'LET_GO')),
    title TEXT NOT NULL,
    description TEXT,
    estimated_time TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
    is_top3 INTEGER DEFAULT 0,
    top3_order INTEGER CHECK (top3_order BETWEEN 1 AND 3),
    action_detail TEXT,
    completed_at DATETIME,
    time_slot TEXT CHECK (time_slot IN ('MORNING', 'AFTERNOON', 'EVENING')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Daily reviews table
CREATE TABLE IF NOT EXISTS daily_reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    review_date DATE NOT NULL,
    morning_energy TEXT CHECK (morning_energy IN ('VERY_GOOD', 'GOOD', 'NORMAL', 'TIRED', 'VERY_TIRED')),
    current_mood TEXT,
    stress_factors TEXT,
    well_done_1 TEXT,
    well_done_2 TEXT,
    well_done_3 TEXT,
    improvement TEXT,
    gratitude TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(user_id, review_date)
);

-- Weekly goals table
CREATE TABLE IF NOT EXISTS weekly_goals (
    goal_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    goal_order INTEGER NOT NULL CHECK (goal_order BETWEEN 1 AND 3),
    title TEXT NOT NULL,
    progress_rate INTEGER NOT NULL DEFAULT 0 CHECK (progress_rate BETWEEN 0 AND 100),
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Free notes table
CREATE TABLE IF NOT EXISTS free_notes (
    note_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    note_date DATE NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Let go items table
CREATE TABLE IF NOT EXISTS let_go_items (
    let_go_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_priority ON daily_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status ON daily_tasks(status);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_top3 ON daily_tasks(user_id, task_date, is_top3);
CREATE INDEX IF NOT EXISTS idx_daily_reviews_user_date ON daily_reviews(user_id, review_date);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_week ON weekly_goals(user_id, week_start_date, week_end_date);
CREATE INDEX IF NOT EXISTS idx_free_notes_user_date ON free_notes(user_id, note_date);
CREATE INDEX IF NOT EXISTS idx_let_go_items_user_date ON let_go_items(user_id, task_date);
