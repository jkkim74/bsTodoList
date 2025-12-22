# Cloudflare Pages 프로덕션 DB 설정 가이드

## 🚨 문제 상황
- 로컬 환경: 정상 작동 ✅
- Cloudflare Pages: FOREIGN KEY 오류 ❌

## 🔍 원인
Cloudflare Pages의 **원격 D1 데이터베이스**에 마이그레이션 및 시드 데이터가 적용되지 않음

---

## ✅ 해결 방법 (로컬 PC에서 실행)

### Step 1: Wrangler 로그인 확인
```bash
cd D:/workspace/bsTodoList

# Cloudflare 계정 확인
npx wrangler whoami

# 로그인되지 않았다면:
npx wrangler login
```

---

### Step 2: 원격 D1 데이터베이스 확인
```bash
# D1 데이터베이스 목록 확인
npx wrangler d1 list

# webapp-production 데이터베이스 정보 확인
npx wrangler d1 info webapp-production
```

**예상 출력**:
```
Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Name: webapp-production
Created: 2024-xx-xx
```

---

### Step 3: 원격 DB에 마이그레이션 적용
```bash
# ⚠️ 주의: --remote 플래그 사용 (로컬 아님!)
npx wrangler d1 migrations apply webapp-production --remote
```

**예상 출력**:
```
🌀 Applying migrations to remote database webapp-production
✅ Successfully applied 1 migration(s)
  - 0001_initial_schema.sql
```

---

### Step 4: 원격 DB에 시드 데이터 삽입
```bash
# seed.sql 파일이 있는지 확인
cat seed.sql

# 원격 DB에 시드 데이터 삽입
npx wrangler d1 execute webapp-production --remote --file=./seed.sql
```

**예상 출력**:
```
🌀 Executing on remote database webapp-production
✅ Successfully executed 4 commands
```

---

### Step 5: 원격 DB 데이터 확인
```bash
# 사용자 확인
npx wrangler d1 execute webapp-production --remote --command="SELECT * FROM users"

# 테이블 목록 확인
npx wrangler d1 execute webapp-production --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**예상 출력**:
```json
{
  "results": [
    {
      "user_id": 1,
      "email": "test@example.com",
      "username": "테스트 사용자"
    }
  ]
}
```

---

### Step 6: Cloudflare Pages 재배포 (선택사항)
```bash
# 코드는 이미 최신이므로 재배포 불필요
# 하지만 확실하게 하려면:
npm run deploy
```

---

### Step 7: 브라우저 테스트
```
1. https://webapp-tvo.pages.dev 접속
2. F12 > Application > Local Storage > Clear All
3. 페이지 새로고침
4. 로그인: test@example.com / password123
5. "오늘의 기분" 감정 선택 및 저장
```

---

## 🔧 트러블슈팅

### Q1. "Database not found" 오류
```bash
# D1 데이터베이스가 없는 경우 생성
npx wrangler d1 create webapp-production

# 출력된 database_id를 wrangler.jsonc에 복사
# {
#   "d1_databases": [
#     {
#       "binding": "DB",
#       "database_name": "webapp-production",
#       "database_id": "여기에-복사"
#     }
#   ]
# }
```

### Q2. "Authentication error" 발생
```bash
# 재로그인
npx wrangler logout
npx wrangler login

# 또는 API 토큰 사용
export CLOUDFLARE_API_TOKEN=your-token-here
npx wrangler d1 migrations apply webapp-production --remote
```

### Q3. seed.sql 파일이 없는 경우
```bash
# seed.sql 생성
cat > seed.sql << 'SEED_EOF'
-- Insert test user
INSERT OR IGNORE INTO users (user_id, email, password, username, created_at, updated_at, is_active)
VALUES (
  1,
  'test@example.com',
  'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
  '테스트 사용자',
  datetime('now'),
  datetime('now'),
  1
);

-- Insert sample tasks
INSERT OR IGNORE INTO daily_tasks (user_id, task_date, step, title, status)
VALUES 
  (1, date('now'), 'BRAIN_DUMP', '회의 준비하기', 'PENDING'),
  (1, date('now'), 'BRAIN_DUMP', '이메일 답장', 'PENDING'),
  (1, date('now'), 'BRAIN_DUMP', '운동하기', 'PENDING');
SEED_EOF

# 원격 DB에 적용
npx wrangler d1 execute webapp-production --remote --file=./seed.sql
```

### Q4. "No migrations to apply" 메시지
```bash
# 정상입니다! 이미 마이그레이션이 적용된 상태
# 데이터 확인:
npx wrangler d1 execute webapp-production --remote --command="SELECT * FROM users"
```

---

## 📋 체크리스트

Cloudflare Pages 배포 전 필수 확인:

- [ ] `npx wrangler d1 list` - D1 데이터베이스 존재 확인
- [ ] `npx wrangler d1 migrations apply webapp-production --remote` - 마이그레이션 적용
- [ ] `npx wrangler d1 execute webapp-production --remote --file=./seed.sql` - 시드 데이터 삽입
- [ ] `npx wrangler d1 execute webapp-production --remote --command="SELECT * FROM users"` - 사용자 확인
- [ ] `wrangler.jsonc`에 올바른 `database_id` 설정
- [ ] Cloudflare Pages 설정에서 D1 바인딩 확인 (Settings > Functions > D1 database bindings)

---

## 🎯 한 줄 명령어 (모든 것을 한 번에)

```bash
cd D:/workspace/bsTodoList && \
npx wrangler d1 migrations apply webapp-production --remote && \
npx wrangler d1 execute webapp-production --remote --file=./seed.sql && \
npx wrangler d1 execute webapp-production --remote --command="SELECT user_id, email FROM users" && \
echo "✅ 원격 DB 설정 완료!"
```

---

## 📊 로컬 vs 프로덕션 비교

| 항목 | 로컬 개발 | Cloudflare Pages |
|------|----------|------------------|
| **명령어 플래그** | `--local` | `--remote` |
| **DB 위치** | `.wrangler/state/v3/d1` | Cloudflare 클라우드 |
| **마이그레이션** | `npm run db:migrate:local` | `wrangler d1 migrations apply --remote` |
| **시드 데이터** | `npm run db:seed` | `wrangler d1 execute --remote --file` |
| **데이터 확인** | `npm run db:console:local` | `npm run db:console:prod` |

---

## 🚀 추천 package.json 스크립트

```json
{
  "scripts": {
    "db:migrate:prod": "wrangler d1 migrations apply webapp-production --remote",
    "db:seed:prod": "wrangler d1 execute webapp-production --remote --file=./seed.sql",
    "db:check:prod": "wrangler d1 execute webapp-production --remote --command='SELECT * FROM users'",
    "db:setup:prod": "npm run db:migrate:prod && npm run db:seed:prod && npm run db:check:prod"
  }
}
```

사용:
```bash
npm run db:setup:prod
```

