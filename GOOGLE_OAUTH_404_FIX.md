# Google OAuth 404 Not Found 문제 해결

## 🔴 문제 상황

Google OAuth 로그인 시도 시 다음과 같은 오류 발생:
- **화면**: "404 Not Found"
- **URL**: `webapp-tvo.pages.dev/api/auth/google/callback?code=...&state=...`

## 🔍 원인 분석

### Google OAuth 인증 흐름

```
[사용자] 
  ↓ 1. Google 로그인 버튼 클릭
[프론트엔드]
  ↓ 2. GET /api/auth/google/authorize
[백엔드]
  ↓ 3. Google OAuth URL 생성 및 반환
[Google OAuth]
  ↓ 4. 사용자 인증
  ↓ 5. GET /api/auth/google/callback?code=xxx&state=xxx 로 리디렉션 ⬅️ 여기서 404 발생!
[❌ 백엔드에 GET 핸들러 없음]
```

### 문제의 원인

**파일**: `src/routes/auth.ts`

```typescript
// ❌ POST만 있고 GET이 없음
auth.post('/google/callback', async (c) => {
  // ... 인증 처리
})
```

**Google OAuth는 GET 메서드로 리디렉션**하는데, 백엔드는 POST 핸들러만 있어서 404 에러 발생.

## ✅ 해결 방법

### 추가된 코드

**파일**: `src/routes/auth.ts`

```typescript
// ✅ GET 핸들러 추가
auth.get('/google/callback', async (c) => {
  try {
    const code = c.req.query('code')
    const state = c.req.query('state')
    const error = c.req.query('error')

    // 오류 체크
    if (error) {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Login Error</title>
          <script>
            window.location.href = '/?error=' + encodeURIComponent('${error}')
          </script>
        </head>
        <body>
          <p>Google 로그인 오류가 발생했습니다. 잠시 후 리디렉션됩니다...</p>
        </body>
        </html>
      `)
    }

    if (!code) {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Login Error</title>
          <script>
            window.location.href = '/?error=' + encodeURIComponent('인증 코드가 없습니다.')
          </script>
        </head>
        <body>
          <p>리디렉션 중...</p>
        </body>
        </html>
      `)
    }

    // 메인 페이지로 code와 state 전달
    return c.html(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>Google 로그인 처리 중...</title>
        <script>
          // 메인 페이지로 code와 state 파라미터 전달
          window.location.href = '/?code=${encodeURIComponent(code)}${state ? '&state=' + encodeURIComponent(state) : ''}'
        </script>
      </head>
      <body>
        <p style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          Google 로그인 처리 중... 잠시만 기다려주세요.
        </p>
      </body>
      </html>
    `)
  } catch (error) {
    console.error('Google callback GET error:', error)
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Login Error</title>
        <script>
          window.location.href = '/?error=' + encodeURIComponent('Google 로그인 중 오류가 발생했습니다.')
        </script>
      </head>
      <body>
        <p>오류가 발생했습니다. 리디렉션 중...</p>
      </body>
      </html>
    `)
  }
})

// ✅ 기존 POST 핸들러는 그대로 유지
auth.post('/google/callback', async (c) => {
  // ... 인증 처리 (변경 없음)
})
```

## 🔄 수정된 인증 흐름

```
[사용자] 
  ↓ 1. Google 로그인 버튼 클릭
[프론트엔드]
  ↓ 2. GET /api/auth/google/authorize
[백엔드]
  ↓ 3. Google OAuth URL 생성 및 반환
[Google OAuth]
  ↓ 4. 사용자 인증
  ↓ 5. GET /api/auth/google/callback?code=xxx&state=xxx 로 리디렉션
[✅ 백엔드 GET 핸들러]
  ↓ 6. HTML 응답으로 /?code=xxx&state=xxx 로 리디렉션
[프론트엔드 app.js]
  ↓ 7. URL에서 code 파라미터 감지 (DOMContentLoaded)
  ↓ 8. POST /api/auth/google/callback 호출
[백엔드 POST 핸들러]
  ↓ 9. code를 token으로 교환
  ↓ 10. 사용자 정보 조회/생성
  ↓ 11. JWT 토큰 발급 및 반환
[프론트엔드]
  ↓ 12. 토큰 저장 및 로그인 완료
[✅ 메인 페이지 표시]
```

## 📊 핵심 개선 사항

### 1. GET 핸들러 추가
- Google OAuth는 GET 메서드로 리디렉션
- GET 핸들러가 이를 받아서 처리

### 2. 중간 리디렉션 페이지
- GET 핸들러는 HTML을 반환
- JavaScript로 메인 페이지(/)로 리디렉션하면서 code 파라미터 전달

### 3. 프론트엔드 처리
- `app.js`의 `DOMContentLoaded` 이벤트에서 code 파라미터 감지
- 감지되면 `handleGoogleCallback()` 함수 호출
- POST 요청으로 백엔드에 code 전달

### 4. 오류 처리
- Google OAuth 오류 처리
- code가 없는 경우 처리
- 예외 발생 시 처리

## 🧪 테스트 방법

### 1. 로컬 환경 테스트

```bash
# 1. 개발 서버 실행
npm run dev

# 2. 브라우저에서 http://localhost:8788 접속

# 3. Google 로그인 버튼 클릭

# 4. Google 인증 페이지에서 계정 선택

# 5. 리디렉션 후 정상적으로 로그인되는지 확인
```

### 2. 프로덕션 환경 테스트

```bash
# 1. 배포
npm run deploy

# 2. 프로덕션 URL 접속
# https://webapp-tvo.pages.dev

# 3. Google 로그인 버튼 클릭

# 4. 정상 로그인 확인
```

## 📋 체크리스트

- [x] GET 핸들러 추가
- [x] 오류 처리 로직 추가
- [x] 중간 리디렉션 페이지 구현
- [x] 커밋 및 푸시 완료
- [ ] 로컬 환경 테스트
- [ ] 프로덕션 배포
- [ ] 프로덕션 환경 테스트

## 🎯 예상 결과

### Before (문제 상황)
```
Google 로그인 → Google 인증 → 404 Not Found
```

### After (수정 후)
```
Google 로그인 → Google 인증 → 처리 중... → 로그인 완료!
```

## 💡 기술적 세부사항

### HTTP 메서드

| 엔드포인트 | 메서드 | 용도 |
|-----------|--------|------|
| `/api/auth/google/authorize` | GET | OAuth URL 생성 |
| `/api/auth/google/callback` | **GET** | Google 리디렉션 받기 (신규 추가) |
| `/api/auth/google/callback` | POST | 인증 코드 처리 (기존) |

### 리디렉션 체인

```
1. Google OAuth → GET /api/auth/google/callback?code=xxx
2. GET Handler → HTML with redirect to /?code=xxx
3. Frontend app.js → detects code parameter
4. Frontend → POST /api/auth/google/callback with code
5. POST Handler → returns JWT token
6. Frontend → saves token and shows main page
```

## 🚀 배포 절차

### 1. 로컬 테스트
```bash
# 로컬 환경에서 테스트
npm run dev

# Google 로그인 테스트
# - Google 버튼 클릭
# - 계정 선택
# - 로그인 완료 확인
```

### 2. 프로덕션 배포
```bash
# Cloudflare Pages 배포
npm run deploy

# 또는 Git push로 자동 배포
git push origin main
```

### 3. 환경 변수 확인
Cloudflare Pages 대시보드에서 다음 환경 변수 확인:
- `VITE_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## 📚 관련 파일

- ✅ `src/routes/auth.ts` (수정됨)
- 📝 `public/static/app.js` (변경 없음)
- 📝 `src/utils/google-oauth.ts` (변경 없음)

## 🔗 커밋 정보

```
dc56b3f - fix: Add GET handler for Google OAuth callback to fix 404 Not Found
6078ad4 - docs: Add comprehensive fix report for Google OAuth email verification
b3952e9 - docs: Add Google OAuth email verification fix documentation
108cc3b - fix: Update email_verified when linking existing account to Google OAuth
```

## ✅ 결론

**문제**: Google OAuth 콜백 URL에서 404 Not Found 발생

**원인**: 백엔드에 GET 핸들러가 없어서 Google의 GET 리디렉션을 처리하지 못함

**해결**: GET 핸들러를 추가하여 Google 리디렉션을 받고, 메인 페이지로 code 파라미터를 전달하여 프론트엔드에서 처리하도록 구현

**결과**: Google OAuth 로그인 정상 작동 예상

---

**작성일**: 2026-01-19
**커밋**: dc56b3f
**상태**: ✅ 수정 완료, ⏳ 배포 및 테스트 대기
