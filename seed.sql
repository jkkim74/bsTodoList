-- Seed data for testing
-- Insert test user (password: password123)
INSERT OR IGNORE INTO users (user_id, email, password, username, is_active) VALUES 
  (1, 'test@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.FLlZMLX5XhKk9Z0xqy9VkM0cGF6b7u', '테스트 사용자', 1);

-- Insert sample tasks for today
INSERT OR IGNORE INTO daily_tasks (user_id, task_date, step, title, description, status) VALUES 
  (1, date('now'), 'BRAIN_DUMP', '회의 준비하기', '오전 10시 주간 회의 자료 준비', 'PENDING'),
  (1, date('now'), 'BRAIN_DUMP', '이메일 답장', '중요 이메일 3건 답장하기', 'PENDING'),
  (1, date('now'), 'BRAIN_DUMP', '운동하기', '30분 조깅', 'PENDING');
