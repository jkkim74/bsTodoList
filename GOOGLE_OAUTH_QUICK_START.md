# Google OAuth 빠른 배포 (Cloudflare 환경 변수 사용)

## ⚡ 5분 안에 배포하기

### 1️⃣ 사전 확인 (1분)

Cloudflare Dashboard에서 다음 환경 변수가 설정되었는지 확인:
- ✅ `VITE_GOOGLE_CLIENT_ID` 
- ✅ `GOOGLE_CLIENT_SECRET`

### 2️⃣ 마이그레이션 적용 (1분)

```bash
cd /d/workspace/bsTodoList

# D1 데이터베이스에 마이그레이션 적용
npx wrangler d1 migrations apply webapp-production --remote
```

**확인:**
```bash
npx wrangler d1 execute webapp-production --remote "SELECT COUNT(*) as oauth_fields FROM pragma_table_info('users') WHERE name IN ('oauth_provider', 'oauth_id');"
```

### 3️⃣ 빌드 (1분)

```bash
npm run build
```

### 4️⃣ 배포 (1분)

```bash
npx wrangler pages deploy dist --project-name webapp
```

### 5️⃣ 테스트 (1분)

```bash
# 배포 URL 접속
https://webapp.pages.dev/

# 또는 명령어로 확인
curl https://webapp.pages.dev/ | grep -i "google"
```

## ✅ 확인 사항

배포 후 다음을 확인하세요:

### 1. HTML에 Google 환경 변수 주입 확인

```bash
curl https://webapp.pages.dev/ | grep "window.GOOGLE_CLIENT_ID"
```

**출력 예시:**
```html
<script>
  window.GOOGLE_CLIENT_ID = 'xxx.apps.googleusercontent.com'
</script>
```

### 2. API 응답 확인

```bash
curl https://webapp.pages.dev/api/health
```

**예상 출력:**
```json
{
  "status": "ok",
  "message": "Brain Dumping API is running"
}
```

### 3. Google 로그인 페이지 확인

1. https://webapp.pages.dev/ 접속
2. 페이지 소스 확인 (Ctrl+U)
3. "Google로 로그인" 버튼 있는지 확인
4. Google 로그인 버튼 클릭 테스트

## 🐛 문제 해결

### "Google Client ID not configured" 에러

```bash
# 환경 변수 확인
npx wrangler pages project list

# 또는 Cloudflare Dashboard에서 확인
# Pages → webapp → Settings → Environment variables
```

**해결:**
1. Cloudflare Dashboard에서 변수 확인
2. 변수명 정확한지 확인: `VITE_GOOGLE_CLIENT_ID`
3. 재배포: `npx wrangler pages deploy dist --project-name webapp`

### 로그인 후 오류

```bash
# 실시간 로그 확인
npx wrangler tail

# 또는 에러 확인
curl https://webapp.pages.dev/api/health -i
```

### D1 마이그레이션 오류

```bash
# 마이그레이션 상태 확인
npx wrangler d1 migrations list webapp-production --remote

# 테이블 확인
npx wrangler d1 execute webapp-production --remote ".tables"

# users 테이블 스키마 확인
npx wrangler d1 execute webapp-production --remote ".schema users"
```

## 📊 배포 확인

### 로그 확인

```bash
# 실시간 로그 (Ctrl+C로 종료)
npx wrangler tail

# 또는 직접 API 호출
curl -X POST https://webapp.pages.dev/api/auth/google/authorize
```

### Google 로그인 전체 흐름 테스트

```bash
# 1. 인증 URL 생성
curl https://webapp.pages.dev/api/auth/google/authorize

# 출력 예시:
# {
#   "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
#   "state": "abc123"
# }

# 2. authUrl을 브라우저에서 열기
# 3. Google 로그인
# 4. ?code=xxx&state=yyy로 콜백됨
# 5. /api/auth/google/callback에 code 전송
# 6. JWT 토큰 받음
```

## 🔒 보안 확인

### 1. Client Secret 노출 확인

```bash
# 프론트엔드에 secret이 없어야 함
curl https://webapp.pages.dev/ | grep -i "client_secret"

# 아무것도 출력되지 않아야 정상
```

### 2. HTTPS 확인

```bash
# https로 접속되는지 확인
curl -I https://webapp.pages.dev/

# HTTP 리다이렉트 확인
curl -I http://webapp.pages.dev/
```

### 3. 환경 변수 검증

```bash
# 백엔드에서만 secret을 사용하는지 확인
grep -r "GOOGLE_CLIENT_SECRET" src/

# 프론트엔드에 노출되지 않았는지 확인
grep -r "GOOGLE_CLIENT_SECRET" public/
```

## 📝 다음 단계

### 배포 후
1. ✅ 로그인 테스트
2. ✅ 에러 로그 확인
3. ✅ 실사용자 테스트

### 계획
- [ ] GitHub OAuth 추가
- [ ] 카카오 로그인 추가
- [ ] 계정 연결 기능
- [ ] 프로필 이미지 표시

## 📚 참고 자료

| 문서 | 내용 |
|------|------|
| [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) | Google Cloud 상세 설정 |
| [GOOGLE_OAUTH_IMPLEMENTATION.md](./GOOGLE_OAUTH_IMPLEMENTATION.md) | 구현 상세 설명 |
| [GOOGLE_OAUTH_CLOUDFLARE_DEPLOYMENT.md](./GOOGLE_OAUTH_CLOUDFLARE_DEPLOYMENT.md) | 배포 가이드 |
| [README.md](./README.md) | 프로젝트 개요 |

---

**배포 시간**: ~5분  
**난이도**: ⭐☆☆☆☆ (매우 간단)
