# 🔧 Google OAuth 환경 변수 설정 가이드

## 📋 문제 증상

```javascript
[Google Login] Error: TypeError: Cannot destructure property 'authUrl' 
of 'authResponse.data.data' as it is undefined.
```

**원인:** `VITE_GOOGLE_CLIENT_ID` 환경 변수가 설정되지 않음

---

## 🔍 근본 원인

### 백엔드 코드 (src/routes/auth.ts:27-29)

```typescript
const clientId = c.env.VITE_GOOGLE_CLIENT_ID
if (!clientId) {
  return errorResponse(c, 'Google Client ID not configured', 500)
}
```

`VITE_GOOGLE_CLIENT_ID`가 없으면 오류 응답을 반환합니다:

```json
{
  "success": false,
  "error": "Google Client ID not configured"
}
```

### 프론트엔드 코드 (public/static/app.js:611)

```javascript
const { authUrl, state } = authResponse.data.data  // ❌ data.data가 undefined!
```

오류 응답에는 `data` 속성이 없어서 `undefined` 접근 오류 발생!

---

## ✅ 해결 방법

### 1️⃣ Cloudflare Pages 환경 변수 설정

#### Google Cloud Console에서 OAuth Client ID 생성

1. **Google Cloud Console** 접속
   - https://console.cloud.google.com/

2. **프로젝트 선택** 또는 **새 프로젝트 생성**

3. **APIs & Services > Credentials**
   - 왼쪽 메뉴에서 **Credentials** 클릭

4. **CREATE CREDENTIALS > OAuth client ID**

5. **Application type** 선택
   - **Web application** 선택

6. **Name** 입력
   - 예: `Brain Dump Web App`

7. **Authorized JavaScript origins** 추가
   ```
   https://webapp-tvo.pages.dev
   ```

8. **Authorized redirect URIs** 추가
   ```
   https://webapp-tvo.pages.dev/api/auth/google/callback
   http://localhost/api/auth/google/callback
   capacitor://localhost/api/auth/google/callback
   https://localhost/api/auth/google/callback
   http://localhost:8788/api/auth/google/callback
   ```

9. **CREATE** 클릭

10. **Client ID**와 **Client Secret** 복사
    ```
    Client ID: 123456789-xxxxxxxxxx.apps.googleusercontent.com
    Client Secret: GOCSPX-xxxxxxxxxxxxx
    ```

#### Cloudflare Pages 환경 변수 설정

1. **Cloudflare Dashboard** 접속
   - https://dash.cloudflare.com/

2. **Workers & Pages** 클릭

3. **webapp-tvo** (또는 프로젝트 이름) 선택

4. **Settings** 탭 클릭

5. **Environment variables** 섹션

6. **Add variable** 클릭

7. **Production** 환경에 다음 변수 추가:

   **변수 1:**
   ```
   Variable name: VITE_GOOGLE_CLIENT_ID
   Value: 123456789-xxxxxxxxxx.apps.googleusercontent.com
   Type: Plain text
   ```

   **변수 2:**
   ```
   Variable name: GOOGLE_CLIENT_SECRET
   Value: GOCSPX-xxxxxxxxxxxxx
   Type: Secret
   ```

8. **Save** 클릭

9. **Deployments** 탭으로 이동

10. **최신 배포**에서 **⋯ (More)** → **Retry deployment** 클릭

11. 재배포 완료 대기 (약 1-2분)

---

## 🧪 환경 변수 확인

### 1️⃣ Cloudflare Pages Logs

```bash
npx wrangler pages deployment tail --project-name webapp
```

### 2️⃣ 프론트엔드에서 확인

**Chrome DevTools Console:**

```javascript
console.log('GOOGLE_CLIENT_ID:', window.GOOGLE_CLIENT_ID)
```

**예상 출력:**
```
GOOGLE_CLIENT_ID: 123456789-xxxxxxxxxx.apps.googleusercontent.com
```

**오류 출력:**
```
GOOGLE_CLIENT_ID: undefined  // ❌ 환경 변수 미설정
```

### 3️⃣ API 엔드포인트 테스트

```javascript
axios.get('/api/auth/google/authorize')
  .then(res => {
    console.log('✅ Success:', res.data)
  })
  .catch(err => {
    console.error('❌ Error:', err.response?.data)
  })
```

**성공 응답:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "state": "random_state"
  }
}
```

**오류 응답 (환경 변수 없음):**
```json
{
  "success": false,
  "error": "Google Client ID not configured"
}
```

---

## 🔧 프론트엔드 수정 (오류 처리 개선)

### 수정 내용

**파일:** `public/static/app.js`

**Before:**
```javascript
const authResponse = await axios.get(`${API_BASE}/auth/google/authorize`)
const { authUrl, state } = authResponse.data.data  // ❌ data.data 직접 접근
```

**After:**
```javascript
const authResponse = await axios.get(`${API_BASE}/auth/google/authorize`)

// 🔥 응답 검증
if (!authResponse.data.success) {
  throw new Error(authResponse.data.error || 'Google 로그인 준비 실패')
}

const { authUrl, state } = authResponse.data.data  // ✅ 검증 후 접근
```

---

## 📊 디버깅 체크리스트

### ✅ 환경 변수 설정 확인

- [ ] Google Cloud Console에서 OAuth Client ID 생성
- [ ] Client ID와 Secret 복사
- [ ] Cloudflare Pages에 `VITE_GOOGLE_CLIENT_ID` 추가
- [ ] Cloudflare Pages에 `GOOGLE_CLIENT_SECRET` 추가
- [ ] 재배포 완료

### ✅ 앱에서 확인

- [ ] Chrome DevTools에서 `window.GOOGLE_CLIENT_ID` 확인
- [ ] `/api/auth/google/authorize` API 응답 확인
- [ ] Google 로그인 클릭 시 In-App Browser 열림
- [ ] 로그인 후 앱으로 복귀

---

## 🚨 일반적인 문제

### 문제 1: 환경 변수가 여전히 undefined

**원인:** 재배포하지 않음

**해결:**
1. Cloudflare Dashboard → **webapp-tvo**
2. **Deployments** 탭
3. **Retry deployment** 클릭
4. 배포 완료 대기

### 문제 2: Client ID가 잘못됨

**증상:**
```
400 오류: invalid_client
```

**해결:**
1. Google Cloud Console에서 **Client ID** 재확인
2. Cloudflare Pages 환경 변수 수정
3. 재배포

### 문제 3: redirect_uri_mismatch

**증상:**
```
400 오류: redirect_uri_mismatch
```

**해결:**
1. [GOOGLE_OAUTH_REDIRECT_URI_FIX.md](./GOOGLE_OAUTH_REDIRECT_URI_FIX.md) 참고
2. Google Cloud Console에 Redirect URI 추가

---

## 🎯 완전한 설정 예시

### .dev.vars (로컬 개발)

```env
VITE_GOOGLE_CLIENT_ID=123456789-xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

### Cloudflare Pages 환경 변수 (프로덕션)

```
Production Environment:
  VITE_GOOGLE_CLIENT_ID = 123456789-xxxxxxxxxx.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET = [Secret] (encrypted)

Preview Environment:
  VITE_GOOGLE_CLIENT_ID = 123456789-xxxxxxxxxx.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET = [Secret] (encrypted)
```

### Google Cloud Console OAuth 설정

```
Application type: Web application
Name: Brain Dump Web App

Authorized JavaScript origins:
  https://webapp-tvo.pages.dev

Authorized redirect URIs:
  https://webapp-tvo.pages.dev/api/auth/google/callback
  http://localhost/api/auth/google/callback
  capacitor://localhost/api/auth/google/callback
  https://localhost/api/auth/google/callback
  http://localhost:8788/api/auth/google/callback
```

---

## 📚 관련 문서

- [GOOGLE_LOGIN_ERROR_DEBUG.md](./GOOGLE_LOGIN_ERROR_DEBUG.md)
- [GOOGLE_OAUTH_REDIRECT_URI_FIX.md](./GOOGLE_OAUTH_REDIRECT_URI_FIX.md)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

---

## 🔗 GitHub Repository

https://github.com/jkkim74/bsTodoList

---

## 📅 작성일

2025-01-20

---

## ✅ 다음 단계

1. **Google Cloud Console**에서 OAuth Client ID 생성
2. **Cloudflare Pages**에 환경 변수 추가
3. **재배포** 완료
4. **앱 테스트**
5. **결과 공유**

**환경 변수 설정 완료 후 테스트 결과를 알려주세요!** 🚀
