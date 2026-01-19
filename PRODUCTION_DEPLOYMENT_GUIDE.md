# 프로덕션 환경 작업 가이드

## 🌐 프로덕션 환경 개요

현재 프로젝트는 **Cloudflare Pages**에 배포되어 있으며, **Cloudflare D1** 데이터베이스를 사용합니다.

### 현재 설정
```json
{
  "name": "webapp-tvo",
  "database_name": "webapp-production",
  "database_id": "3bb5cdf0-d6d8-47ae-8a5c-1da3e9add73c"
}
```

---

## 📍 프로덕션 환경 위치

### 1. Cloudflare Dashboard
**URL**: https://dash.cloudflare.com/

**접근 경로**:
```
Cloudflare Dashboard
  ↓
Workers & Pages (왼쪽 메뉴)
  ↓
webapp-tvo (프로젝트 선택)
  ↓
여기서 프로덕션 환경 관리!
```

### 2. GitHub Repository
**URL**: https://github.com/jkkim74/bsTodoList

**자동 배포**:
- `main` 브랜치에 push하면 자동으로 Cloudflare Pages에 배포됨
- GitHub Actions는 설정되어 있지 않음 (Cloudflare 자동 배포 사용)

---

## 🔑 1단계: Cloudflare 로그인 및 접근

### 방법 1: Cloudflare Dashboard (웹)

1. **Cloudflare 로그인**
   ```
   https://dash.cloudflare.com/login
   ```

2. **Workers & Pages 선택**
   - 왼쪽 메뉴에서 "Workers & Pages" 클릭

3. **프로젝트 선택**
   - `webapp-tvo` 프로젝트 클릭

4. **주요 탭**:
   - **Deployments**: 배포 히스토리 및 활성 배포
   - **Settings**: 환경 변수, 빌드 설정
   - **Custom domains**: 도메인 설정
   - **Analytics**: 트래픽 분석

### 방법 2: Wrangler CLI (명령줄)

로컬 터미널에서 작업:

```bash
# 1. Cloudflare 로그인
wrangler login

# 브라우저가 열리고 Cloudflare에 로그인
# 로그인 성공 후 터미널로 돌아옴

# 2. 로그인 상태 확인
wrangler whoami
```

**출력 예시**:
```
👋 You are logged in with an OAuth Token, associated with the email 'your-email@example.com'!
┌──────────────────────┬──────────────────────────────────┐
│ Account Name         │ Account ID                        │
├──────────────────────┼──────────────────────────────────┤
│ Your Account Name    │ abc123def456...                   │
└──────────────────────┴──────────────────────────────────┘
```

---

## 💾 2단계: 데이터베이스 마이그레이션

### Cloudflare D1 데이터베이스 접근

#### 옵션 1: Wrangler CLI (권장)

```bash
# 현재 위치 확인
cd /home/user/webapp

# 1. 데이터베이스 목록 확인
wrangler d1 list

# 출력:
# ┌──────────────────────┬──────────────────────────────────────┐
# │ name                 │ uuid                                  │
# ├──────────────────────┼──────────────────────────────────────┤
# │ webapp-production    │ 3bb5cdf0-d6d8-47ae-8a5c-1da3e9add73c │
# └──────────────────────┴──────────────────────────────────────┘

# 2. 데이터베이스 정보 확인
wrangler d1 info webapp-production

# 3. 마이그레이션 실행 (로컬 - 개발용)
wrangler d1 execute webapp-production --local --file=./migrations/0006_email_verifications_table.sql

# 4. 마이그레이션 실행 (원격 - 프로덕션!)
wrangler d1 execute webapp-production --remote --file=./migrations/0006_email_verifications_table.sql
```

**⚠️ 중요**: `--remote` 플래그를 사용하면 **실제 프로덕션 데이터베이스**에 적용됩니다!

#### 옵션 2: Cloudflare Dashboard

1. **D1 Dashboard 접근**
   ```
   https://dash.cloudflare.com/
   → Workers & Pages (왼쪽 메뉴)
   → D1 (탭)
   → webapp-production (선택)
   ```

2. **Console 탭에서 쿼리 실행**
   - SQL 쿼리를 직접 입력하고 실행 가능
   - 마이그레이션 파일 내용을 복사해서 붙여넣기

**예시**:
```sql
-- 직접 쿼리 실행
CREATE TABLE IF NOT EXISTS email_verifications (
    verification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    verified INTEGER DEFAULT 0,
    attempt_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 3단계: 환경 변수 설정

### Cloudflare Pages Dashboard에서 설정

1. **Settings 탭으로 이동**
   ```
   https://dash.cloudflare.com/
   → Workers & Pages
   → webapp-tvo
   → Settings
   → Environment variables (왼쪽 메뉴)
   ```

2. **환경 변수 추가**

#### Production 환경 변수

**Google OAuth** (이미 설정되어 있을 수 있음):
```
변수 이름: VITE_GOOGLE_CLIENT_ID
값: your-google-client-id.apps.googleusercontent.com
환경: Production

변수 이름: GOOGLE_CLIENT_SECRET
값: your-google-client-secret
환경: Production
타입: Secret (암호화됨)
```

**이메일 서비스** (새로 추가 필요):

**옵션 1: SendGrid 사용**
```
변수 이름: EMAIL_SERVICE_ENABLED
값: true
환경: Production

변수 이름: SENDGRID_API_KEY
값: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
환경: Production
타입: Secret

변수 이름: FROM_EMAIL
값: noreply@yourdomain.com
환경: Production
```

**옵션 2: Mailgun 사용**
```
변수 이름: EMAIL_SERVICE_ENABLED
값: true
환경: Production

변수 이름: MAILGUN_API_KEY
값: key-xxxxxxxxxxxxxxxxxxxxx
환경: Production
타입: Secret

변수 이름: MAILGUN_DOMAIN
값: mg.yourdomain.com
환경: Production

변수 이름: FROM_EMAIL
값: noreply@yourdomain.com
환경: Production
```

3. **저장 및 재배포**
   - "Save" 버튼 클릭
   - 자동으로 재배포됨 (또는 "Redeploy" 버튼 클릭)

### Wrangler CLI로 환경 변수 설정 (대안)

```bash
# 시크릿 설정 (암호화됨)
wrangler pages secret put GOOGLE_CLIENT_SECRET
# 입력 프롬프트가 나타나면 값 입력

wrangler pages secret put SENDGRID_API_KEY
# 값 입력

# 일반 환경 변수는 Dashboard에서 설정 권장
```

---

## 🚀 4단계: 배포

### 방법 1: Git Push (자동 배포) ✅ 권장

```bash
# 1. 변경사항 커밋
cd /home/user/webapp
git add .
git commit -m "feat: Add email verification system"

# 2. GitHub에 Push
git push origin main

# 3. 자동 배포 시작!
# Cloudflare가 자동으로 감지하고 배포 시작
```

**배포 과정 확인**:
```
https://dash.cloudflare.com/
→ Workers & Pages
→ webapp-tvo
→ Deployments 탭
```

여기서 실시간으로 배포 상태를 확인할 수 있습니다:
- ✅ Building (빌드 중)
- ✅ Deploying (배포 중)
- ✅ Success (배포 완료)

### 방법 2: Wrangler CLI (수동 배포)

```bash
cd /home/user/webapp

# 1. 빌드
npm run build

# 2. Cloudflare Pages에 배포
npx wrangler pages deploy ./dist --project-name=webapp-tvo

# 또는 package.json의 deploy 스크립트 사용
npm run deploy
```

### 배포 확인

```bash
# 배포 목록 확인
wrangler pages deployments list --project-name=webapp-tvo

# 출력:
# ┌────────────────┬──────────────┬────────────────────┐
# │ Created        │ Environment  │ Deployment URL     │
# ├────────────────┼──────────────┼────────────────────┤
# │ 2026-01-19     │ production   │ https://xxx.pages.dev │
# └────────────────┴──────────────┴────────────────────┘
```

---

## 🔍 5단계: 프로덕션 환경 확인 및 테스트

### 1. 프로덕션 URL 확인

**Cloudflare Pages 기본 URL**:
```
https://webapp-tvo.pages.dev
```

또는 대시보드에서 확인:
```
Cloudflare Dashboard
→ Workers & Pages
→ webapp-tvo
→ 상단에 URL 표시됨
```

### 2. 프로덕션 데이터베이스 확인

```bash
# 테이블 목록 확인
wrangler d1 execute webapp-production --remote --command="SELECT name FROM sqlite_master WHERE type='table'"

# email_verifications 테이블 확인
wrangler d1 execute webapp-production --remote --command="SELECT * FROM email_verifications LIMIT 5"

# 사용자 테이블 확인
wrangler d1 execute webapp-production --remote --command="SELECT user_id, email, username, email_verified, oauth_provider FROM users LIMIT 10"
```

### 3. API 헬스 체크

```bash
# 프로덕션 API 테스트
curl https://webapp-tvo.pages.dev/api/health

# 예상 응답:
# {
#   "status": "ok",
#   "message": "Brain Dumping API is running"
# }
```

### 4. 이메일 인증 테스트 (프로덕션)

```bash
# Step 1: 인증 코드 요청
curl -X POST https://webapp-tvo.pages.dev/api/auth/signup/request-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"your-real-email@example.com"}'

# 이메일 수신함 확인
# 인증 코드 6자리 확인

# Step 2: 회원가입
curl -X POST https://webapp-tvo.pages.dev/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-real-email@example.com",
    "password": "Test1234!",
    "password_confirm": "Test1234!",
    "username": "테스터",
    "verification_code": "123456"
  }'
```

---

## 📊 6단계: 모니터링 및 로그

### Cloudflare Dashboard에서 로그 확인

1. **실시간 로그**
   ```
   Cloudflare Dashboard
   → Workers & Pages
   → webapp-tvo
   → Logs (탭)
   → Real-time Logs (실시간 스트리밍)
   ```

2. **분석**
   ```
   Cloudflare Dashboard
   → Workers & Pages
   → webapp-tvo
   → Analytics (탭)
   ```
   
   확인 가능한 정보:
   - 요청 수
   - 오류율
   - 지연 시간
   - 대역폭 사용량

### Wrangler CLI로 로그 확인

```bash
# 실시간 로그 스트리밍
wrangler pages deployment tail --project-name=webapp-tvo

# 특정 배포의 로그
wrangler pages deployment tail --project-name=webapp-tvo --deployment-id=<deployment-id>
```

---

## 🔄 7단계: 롤백 (문제 발생 시)

### Dashboard에서 롤백

1. **Deployments 탭**으로 이동
2. 이전 배포 찾기 (성공한 배포)
3. "..." 메뉴 클릭
4. **Rollback to this deployment** 선택

### Wrangler CLI로 롤백

```bash
# 배포 목록 확인
wrangler pages deployments list --project-name=webapp-tvo

# 특정 배포로 롤백
wrangler pages deployment rollback --project-name=webapp-tvo --deployment-id=<deployment-id>
```

---

## 🗂️ 8단계: 데이터베이스 백업 및 복원

### 백업

```bash
# 모든 테이블 백업 (JSON 형식)
wrangler d1 export webapp-production --remote --output=backup-$(date +%Y%m%d).sql

# 또는 특정 테이블만
wrangler d1 execute webapp-production --remote --command="SELECT * FROM users" --json > users_backup.json
```

### 복원 (신중하게!)

```bash
# SQL 파일로 복원
wrangler d1 execute webapp-production --remote --file=backup-20260119.sql
```

---

## 📋 프로덕션 작업 체크리스트

### 마이그레이션 전
- [ ] 로컬에서 마이그레이션 테스트 완료
- [ ] 백업 생성 (선택사항)
- [ ] 마이그레이션 SQL 파일 검증

### 마이그레이션 실행
```bash
# ⚠️ 프로덕션 마이그레이션 실행
wrangler d1 execute webapp-production --remote --file=./migrations/0006_email_verifications_table.sql
```

### 환경 변수 설정
- [ ] Cloudflare Dashboard에서 이메일 서비스 환경 변수 추가
- [ ] 시크릿 변수는 Secret 타입으로 설정
- [ ] FROM_EMAIL 주소 설정

### 배포
- [ ] Git commit 및 push
- [ ] Cloudflare Dashboard에서 배포 상태 확인
- [ ] 배포 완료 대기 (보통 1-2분)

### 테스트
- [ ] 프로덕션 URL 접속 확인
- [ ] API 헬스 체크
- [ ] Google OAuth 로그인 테스트
- [ ] 이메일 인증 회원가입 테스트 (실제 이메일)
- [ ] 기존 기능 회귀 테스트

### 모니터링
- [ ] 로그에서 오류 확인
- [ ] 이메일 발송 성공 여부 확인
- [ ] 사용자 가입 성공 여부 확인

---

## 🆘 트러블슈팅

### 문제 1: 마이그레이션 실행 오류

**오류**:
```
Error: no such table: email_verifications
```

**해결**:
```bash
# 원격 데이터베이스 스키마 확인
wrangler d1 execute webapp-production --remote --command="SELECT name FROM sqlite_master WHERE type='table'"

# 마이그레이션 다시 실행
wrangler d1 execute webapp-production --remote --file=./migrations/0006_email_verifications_table.sql
```

### 문제 2: 환경 변수가 적용되지 않음

**해결**:
1. Cloudflare Dashboard에서 환경 변수 확인
2. "Redeploy" 버튼 클릭하여 재배포
3. 또는 더미 커밋 후 push

```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

### 문제 3: 이메일이 발송되지 않음

**확인 사항**:
1. 환경 변수 `EMAIL_SERVICE_ENABLED=true` 설정 확인
2. SendGrid/Mailgun API 키 유효성 확인
3. FROM_EMAIL 주소 확인
4. 로그에서 오류 메시지 확인

```bash
wrangler pages deployment tail --project-name=webapp-tvo
```

### 문제 4: API 토큰 오류

**오류**:
```
Error: In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN
```

**해결**:
```bash
# 다시 로그인
wrangler login

# 또는 API 토큰 설정
export CLOUDFLARE_API_TOKEN="your-token"
```

API 토큰 생성:
```
https://dash.cloudflare.com/profile/api-tokens
→ Create Token
→ Edit Cloudflare Workers 템플릿 사용
```

---

## 📞 추가 리소스

### Cloudflare 문서
- **Pages**: https://developers.cloudflare.com/pages/
- **D1**: https://developers.cloudflare.com/d1/
- **Workers**: https://developers.cloudflare.com/workers/

### Wrangler 문서
- **CLI 가이드**: https://developers.cloudflare.com/workers/wrangler/
- **명령어 참조**: https://developers.cloudflare.com/workers/wrangler/commands/

### 프로젝트 정보
- **GitHub**: https://github.com/jkkim74/bsTodoList
- **Dashboard**: https://dash.cloudflare.com/ (로그인 필요)

---

## 🎯 요약

### 프로덕션 환경 위치
1. **Cloudflare Dashboard**: https://dash.cloudflare.com/
2. **프로젝트**: webapp-tvo
3. **데이터베이스**: webapp-production (Cloudflare D1)
4. **URL**: https://webapp-tvo.pages.dev

### 작업 방법
1. **마이그레이션**: `wrangler d1 execute --remote`
2. **환경 변수**: Cloudflare Dashboard → Settings
3. **배포**: `git push origin main` (자동)
4. **모니터링**: Cloudflare Dashboard → Logs, Analytics

### 핵심 명령어
```bash
# 로그인
wrangler login

# 마이그레이션 (프로덕션)
wrangler d1 execute webapp-production --remote --file=./migrations/0006_email_verifications_table.sql

# 배포 (자동)
git push origin main

# 로그 확인
wrangler pages deployment tail --project-name=webapp-tvo
```

---

**모든 프로덕션 작업은 Cloudflare Dashboard와 Wrangler CLI를 통해 수행됩니다!**
