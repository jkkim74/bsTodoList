# Google OAuth 프로덕션 배포 가이드

## ✅ 구현 상태

Cloudflare에 설정된 환경 변수를 사용하여 Google OAuth가 구현되었습니다.

### 환경 변수
- ✅ `VITE_GOOGLE_CLIENT_ID` - Cloudflare 대시보드에 설정됨
- ✅ `GOOGLE_CLIENT_SECRET` - Cloudflare 대시보드에 설정됨

## 🔄 작동 흐름

### 백엔드 (src/routes/auth.ts)
```
GET /api/auth/google/authorize
  ↓
1. Cloudflare에서 VITE_GOOGLE_CLIENT_ID 읽기
2. Google OAuth URL 생성
3. state 토큰 생성 및 반환

POST /api/auth/google/callback
  ↓
1. Authorization code 수신
2. Cloudflare에서 VITE_GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 읽기
3. code를 access token으로 교환
4. 사용자 정보 조회
5. DB에 사용자 생성/업데이트
6. JWT 토큰 발급
```

### 프론트엔드 (public/static/app.js)
```
1. Cloudflare HTML 렌더링 시 VITE_GOOGLE_CLIENT_ID 주입
2. window.GOOGLE_CLIENT_ID에 저장
3. 로그인 화면에 Google 버튼 표시
4. /api/auth/google/authorize 호출
5. Google 로그인 페이지로 리다이렉트
6. Google 승인 후 콜백 처리
7. /api/auth/google/callback 호출
8. JWT 토큰 받아 저장
```

## 🧪 로컬 테스트

### 1단계: 마이그레이션 적용

```bash
# 로컬 D1에 마이그레이션 적용
npx wrangler d1 migrations apply webapp-production --local
```

### 2단계: 개발 서버 실행

```bash
npm run dev:sandbox
```

### 3단계: 로그인 페이지 테스트

1. `http://localhost:3000` 접속
2. "Google로 로그인" 버튼 클릭
3. Google 계정으로 로그인
4. 권한 부여
5. 메인 페이지 확인

## 🚀 프로덕션 배포

### 1단계: 마이그레이션 적용

```bash
# 프로덕션 D1에 마이그레이션 적용
npx wrangler d1 migrations apply webapp-production --remote
```

**출력 예시:**
```
Executing migration 0004_add_oauth.sql...
✅ Migration successful
```

### 2단계: 빌드

```bash
npm run build
```

### 3단계: 배포

```bash
npx wrangler pages deploy dist --project-name webapp
```

### 4단계: Cloudflare 환경 변수 확인

1. Cloudflare Dashboard 접속
2. **Pages** → **webapp** 클릭
3. **Settings** → **Environment variables** 확인
4. 다음이 설정되어 있는지 확인:
   - `VITE_GOOGLE_CLIENT_ID`: your-client-id.apps.googleusercontent.com
   - `GOOGLE_CLIENT_SECRET`: your-secret

**스크린샷 경로:**
```
Cloudflare Dashboard
  ↓
Pages
  ↓
webapp (프로젝트 선택)
  ↓
Settings
  ↓
Environment variables (확인)
```

## 🔒 보안 체크리스트

### Cloudflare 설정
- [ ] `VITE_GOOGLE_CLIENT_ID` 설정됨
- [ ] `GOOGLE_CLIENT_SECRET` 설정됨
- [ ] Production 환경에서만 활성화
- [ ] Preview 환경에는 별도 설정 (선택사항)

### Google Cloud 설정
- [ ] Authorized JavaScript origins에 도메인 추가
  ```
  https://webapp.pages.dev
  ```
- [ ] Authorized redirect URIs에 콜백 URL 추가
  ```
  https://webapp.pages.dev/api/auth/google/callback
  ```

### 코드 검사
- [ ] Client Secret이 소스 코드에 노출되지 않음
- [ ] 환경 변수는 Cloudflare에서만 읽음
- [ ] HTTPS 사용 (Cloudflare Pages는 자동 HTTPS)

## 📊 배포 확인

### 1. 프로덕션 환경에서 테스트

```bash
# 배포된 URL 접속
https://webapp.pages.dev

# 로그인 페이지 접속
https://webapp.pages.dev/
```

### 2. Google 로그인 테스트

1. **Google로 로그인** 버튼 클릭
2. Google 계정 선택
3. 권한 부여
4. 메인 페이지 로드 확인
5. 브라우저 Console에서 에러 확인

### 3. 에러 로그 확인

```bash
# Cloudflare 실시간 로그 보기
npx wrangler tail
```

## 🐛 트러블슈팅

### "Google Client ID not configured" 오류

**원인:** 환경 변수를 읽을 수 없음

**해결방법:**
1. Cloudflare Dashboard에서 변수 확인
2. 변수명이 정확한지 확인: `VITE_GOOGLE_CLIENT_ID`
3. Pages 프로젝트에 설정되었는지 확인 (Worker가 아님)

### "redirect_uri_mismatch" 오류

**원인:** Google Cloud의 Authorized redirect URIs 설정 오류

**해결방법:**
1. Google Cloud Console 접속
2. OAuth 클라이언트 설정 확인
3. Authorized redirect URIs에 다음 추가:
   ```
   https://webapp.pages.dev/api/auth/google/callback
   ```

### 배포 후 Google 버튼이 보이지 않음

**원인:** HTML이 제대로 렌더링되지 않음

**해결방법:**
1. 브라우저 개발자 도구 → Console 확인
2. 다음 명령어로 배포 확인:
   ```bash
   curl https://webapp.pages.dev/
   ```
3. HTML에 Google 버튼이 포함되어 있는지 확인

### 로그인 후 메인 페이지가 로드되지 않음

**원인:** JWT 토큰 생성 실패

**해결방법:**
1. 실시간 로그 확인:
   ```bash
   npx wrangler tail
   ```
2. 백엔드 콘솔에 에러 메시지 확인
3. D1 마이그레이션 적용되었는지 확인:
   ```bash
   npx wrangler d1 execute webapp-production --remote "SELECT name FROM sqlite_master WHERE type='table';"
   ```

## 📝 마이그레이션 상태 확인

```bash
# 적용된 마이그레이션 확인
npx wrangler d1 execute webapp-production --remote ".tables"

# users 테이블 구조 확인
npx wrangler d1 execute webapp-production --remote ".schema users"
```

**예상 출력:**
```
oauth_provider TEXT
oauth_id TEXT
oauth_email TEXT
profile_picture TEXT
provider_connected_at DATETIME
```

## 🔄 배포 후 업데이트

코드를 수정한 후:

```bash
# 빌드
npm run build

# 배포
npx wrangler pages deploy dist --project-name webapp

# 환경 변수는 유지됨 (다시 설정할 필요 없음)
```

## 📚 관련 문서

- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - Google Cloud 설정 가이드
- [GOOGLE_OAUTH_IMPLEMENTATION.md](./GOOGLE_OAUTH_IMPLEMENTATION.md) - 구현 상세 설명
- [README.md](./README.md) - 프로젝트 개요

## ✅ 완료 체크리스트

배포 전에 다음을 확인하세요:

- [ ] Cloudflare에 환경 변수 설정됨
  - [ ] VITE_GOOGLE_CLIENT_ID
  - [ ] GOOGLE_CLIENT_SECRET
- [ ] Google Cloud에 Authorized redirect URIs 추가됨
- [ ] D1 마이그레이션 적용됨
- [ ] 로컬 테스트 완료됨
- [ ] 프로덕션 배포 완료됨
- [ ] 프로덕션 환경에서 Google 로그인 테스트 완료됨

---

**마지막 업데이트**: 2026-01-16  
**상태**: ✅ 배포 완료
