# 🔴 Production Internal Server Error 원인 분석

## 🔍 가능한 원인 (우선순위 순)

### 1. D1 Database 마이그레이션 누락 (가장 가능성 높음) ⚠️

**증상**: Sandbox는 정상, Production만 오류

**원인**: Production DB에 `due_date` 컬럼이 없음
- Local: `migrations/0002_add_due_date.sql` 적용됨 (`--local`)
- **Production: 마이그레이션 미적용** (`--remote` 실행 안 함)

**해결**:
```bash
# 로컬 PC에서 실행
cd D:/workspace/bsTodoList
npx wrangler d1 migrations apply webapp-production --remote
```

**확인 방법**:
```bash
# Production DB 스키마 확인
npx wrangler d1 execute webapp-production --remote --command="PRAGMA table_info(daily_tasks);"
```

---

### 2. 환경 변수 누락 (두 번째 가능성) 🔧

**증상**: JWT 인증 실패 또는 DB 연결 실패

**확인 사항**:
- `JWT_SECRET` 설정 여부
- D1 Database 바인딩 설정

**해결**:
```bash
# Cloudflare Dashboard에서 확인
1. Pages > webapp-tvo > Settings > Environment variables
2. JWT_SECRET 확인 (없으면 추가)

# 또는 CLI로 확인
npx wrangler pages secret list --project-name webapp-tvo
```

---

### 3. D1 Database ID 불일치 🗄️

**증상**: Database not found 오류

**확인**:
```bash
# D1 Database 목록 확인
npx wrangler d1 list

# ID가 wrangler.jsonc와 일치하는지 확인
# 현재 설정: 3bb5cdf0-d6d8-47ae-8a5c-1da3e9add73c
```

---

### 4. 빌드 배포 문제 📦

**증상**: 구버전 코드가 배포됨

**확인**:
```bash
# 최신 커밋 확인
git log --oneline -3

# 빌드 파일 확인
ls -la dist/
```

**해결**:
```bash
# 클린 빌드 후 재배포
rm -rf dist .wrangler
npm run build
npm run deploy
```

---

### 5. toNull 함수 미적용 📝

**증상**: undefined 값 처리 오류

**확인**: `src/routes/tasks.ts`에 toNull 함수가 있는지 확인

**이미 수정됨**: 커밋 `694c7ca`에서 수정 완료

---

## 🎯 즉시 실행할 진단 명령어

### 로컬 PC에서 실행:

```bash
cd D:/workspace/bsTodoList

# 1. 최신 코드 확인
git log --oneline -5
# 예상 결과: 053ef6c가 최신이어야 함

# 2. Production D1 스키마 확인 (가장 중요!)
npx wrangler d1 execute webapp-production --remote --command="PRAGMA table_info(daily_tasks);"
# due_date 컬럼이 있는지 확인!

# 3. 마이그레이션 목록 확인
npx wrangler d1 migrations list webapp-production --remote

# 4. 환경 변수 확인
npx wrangler pages secret list --project-name webapp-tvo

# 5. D1 Database 목록 확인
npx wrangler d1 list
```

---

## 🚨 가장 가능성 높은 시나리오

### Scenario A: due_date 컬럼 없음 (90% 확률)

**상황**:
1. Local: `0002_add_due_date.sql` 적용됨
2. Production: 마이그레이션 미적용
3. 코드: `due_date` 필드 업데이트 시도
4. 결과: **Column 'due_date' does not exist** 에러

**증상**:
- 작업 수정 시 Internal Server Error
- 특히 마감일을 설정하려 할 때 오류

**해결**:
```bash
npx wrangler d1 migrations apply webapp-production --remote
```

---

### Scenario B: 환경 변수 누락 (5% 확률)

**상황**:
- JWT_SECRET 미설정
- 인증 토큰 생성/검증 실패

**해결**:
```bash
# Cloudflare Dashboard
Pages > webapp-tvo > Settings > Environment variables
JWT_SECRET = [your-secret-key]
```

---

### Scenario C: 빌드/배포 문제 (5% 확률)

**상황**:
- 구버전 코드 배포됨
- toNull 함수 없는 상태

**해결**:
```bash
git pull origin main
npm run build
npm run deploy
```

---

## 📊 에러 유형별 원인 추정

### "Column not found" / "no such column"
→ **D1 마이그레이션 미적용** (Scenario A) ⭐

### "Unauthorized" / "Invalid token"
→ **JWT_SECRET 미설정** (Scenario B)

### "undefined is not supported"
→ **toNull 함수 미적용** (이미 해결됨)

### "Database not found"
→ **D1 Database ID 불일치** (Scenario 3)

---

## ✅ 단계별 해결 프로세스

### Step 1: 진단
```bash
cd D:/workspace/bsTodoList

# 현재 코드 버전 확인
git log --oneline -3

# Production DB 스키마 확인
npx wrangler d1 execute webapp-production --remote \
  --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='daily_tasks';"
```

### Step 2: 마이그레이션 적용 (가장 중요!)
```bash
# 마이그레이션 상태 확인
npx wrangler d1 migrations list webapp-production --remote

# 마이그레이션 적용
npx wrangler d1 migrations apply webapp-production --remote
```

### Step 3: 환경 변수 확인
```bash
# Secret 목록 확인
npx wrangler pages secret list --project-name webapp-tvo

# JWT_SECRET이 없으면 추가
npx wrangler pages secret put JWT_SECRET --project-name webapp-tvo
# 입력: your-secret-key (예: my-super-secret-jwt-key-2024)
```

### Step 4: 재배포 (필요시)
```bash
# 최신 코드 가져오기
git pull origin main

# 클린 빌드
rm -rf dist .wrangler
npm run build

# 배포
npm run deploy
```

### Step 5: 테스트
```bash
# Production 접속
# https://webapp-tvo.pages.dev

# 작업 수정 테스트
1. 로그인
2. 작업 추가 및 분류
3. 수정 버튼 클릭
4. 마감일 설정
5. 저장
6. 결과 확인
```

---

## 🔬 상세 진단 가이드

### A. D1 스키마 전체 확인
```bash
npx wrangler d1 execute webapp-production --remote \
  --command="SELECT name, sql FROM sqlite_master WHERE type='table';"
```

### B. daily_tasks 컬럼 목록
```bash
npx wrangler d1 execute webapp-production --remote \
  --command="PRAGMA table_info(daily_tasks);"
```

**예상 출력**:
```
task_id | INTEGER | PRIMARY KEY
user_id | INTEGER | NOT NULL
...
due_date | DATE | NULL  ← 이 컬럼이 있어야 함!
```

### C. 마이그레이션 히스토리
```bash
npx wrangler d1 migrations list webapp-production --remote
```

**예상 출력**:
```
✅ 0001_initial_schema.sql
✅ 0002_add_due_date.sql  ← 이것이 있어야 함!
```

### D. 실제 데이터 테스트
```bash
# 테스트 쿼리
npx wrangler d1 execute webapp-production --remote \
  --command="SELECT task_id, title, due_date FROM daily_tasks LIMIT 1;"
```

---

## 📞 추가 정보 수집

### Cloudflare Dashboard에서 확인

1. **Pages Deployment Logs**
   - Pages > webapp-tvo > Deployments
   - 최신 배포 클릭
   - "View build logs" 확인

2. **Real-time Logs**
   - Pages > webapp-tvo > Deployments
   - "View function logs" 클릭
   - 실시간 에러 메시지 확인

3. **Environment Variables**
   - Pages > webapp-tvo > Settings > Environment variables
   - Production 탭 확인
   - JWT_SECRET 존재 여부

4. **Functions Routes**
   - Pages > webapp-tvo > Settings > Functions
   - `_routes.json` 확인

---

## 🎯 99% 확실한 해결 방법

**가장 가능성 높은 원인은 D1 마이그레이션 누락입니다.**

```bash
# 이 명령어 하나로 해결될 가능성이 매우 높습니다
cd D:/workspace/bsTodoList
npx wrangler d1 migrations apply webapp-production --remote
```

**이유**:
1. Sandbox (`--local`)는 정상 작동 → 코드는 문제없음
2. Production만 오류 → 환경 차이
3. 최근 `due_date` 컬럼 추가 → DB 스키마 변경
4. `--remote` 마이그레이션 실행 기록 없음 → 누락 가능성 높음

---

## 📋 체크리스트

실행 후 체크:
- [ ] `git log` 최신 커밋 확인 (053ef6c)
- [ ] D1 스키마에 `due_date` 컬럼 존재 확인
- [ ] 마이그레이션 `0002_add_due_date.sql` 적용 확인
- [ ] JWT_SECRET 환경 변수 존재 확인
- [ ] Production 접속 테스트
- [ ] 작업 수정 기능 테스트
- [ ] Internal Server Error 미발생 확인

---

## 🚀 빠른 실행 스크립트

```bash
#!/bin/bash
# production-fix.sh

cd D:/workspace/bsTodoList

echo "1. 현재 코드 버전 확인..."
git log --oneline -3

echo "\n2. D1 마이그레이션 적용..."
npx wrangler d1 migrations apply webapp-production --remote

echo "\n3. 스키마 확인..."
npx wrangler d1 execute webapp-production --remote \
  --command="PRAGMA table_info(daily_tasks);"

echo "\n4. 환경 변수 확인..."
npx wrangler pages secret list --project-name webapp-tvo

echo "\n완료! Production 테스트를 진행하세요."
echo "https://webapp-tvo.pages.dev"
```

---

## ✨ 결론

**즉시 실행**: D1 마이그레이션을 Production에 적용하세요!

```bash
npx wrangler d1 migrations apply webapp-production --remote
```

**이 명령어 하나로 99% 해결될 것입니다.** 🎯

실행 후 결과를 알려주시면 추가 지원하겠습니다! 😊
