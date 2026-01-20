# 🔍 구글 로그인 오류 디버깅 가이드

## 📋 문제 증상

```
"구글 로그인 준비 중 오류가 발생했습니다."
```

이 메시지가 표시되는 경우는 `handleGoogleLogin()` 함수에서 예외가 발생한 것입니다.

---

## 🔍 가능한 원인

### 1️⃣ Google Client ID 미설정
- **원인:** `VITE_GOOGLE_CLIENT_ID` 환경 변수가 없음
- **확인 방법:**
  ```javascript
  console.log('GOOGLE_CLIENT_ID:', window.GOOGLE_CLIENT_ID)
  ```
- **예상 값:** `123456789-xxxxxxxxxx.apps.googleusercontent.com`

### 2️⃣ 백엔드 API 응답 오류
- **원인:** `/api/auth/google/authorize` 엔드포인트 오류
- **확인 방법:**
  ```javascript
  axios.get('/api/auth/google/authorize')
    .then(res => console.log('Success:', res.data))
    .catch(err => console.error('Error:', err.response))
  ```

### 3️⃣ Capacitor 초기화 실패
- **원인:** `capacitor.js`가 로드되지 않음
- **확인 방법:**
  ```javascript
  console.log('Capacitor:', window.Capacitor)
  console.log('Browser Plugin:', window.Capacitor?.Plugins?.Browser)
  ```

### 4️⃣ CORS 오류
- **원인:** 백엔드와 프론트엔드 간 CORS 설정 문제
- **확인 방법:** Chrome DevTools Network 탭에서 확인

---

## 🔧 디버깅 단계

### 1️⃣ Chrome DevTools 연결

**Android Studio에서 앱 실행 후:**

1. Chrome 브라우저에서 `chrome://inspect` 접속
2. "Remote Target" 섹션에서 **com.braindump.app** 선택
3. **Inspect** 클릭

### 2️⃣ Console 로그 확인

**Google 로그인 클릭 시 다음 로그 확인:**

```javascript
// ✅ 정상 로그
[Google Login] Re-initializing Capacitor
[Hybrid App] Opening OAuth in in-app browser
[Hybrid App] Auth URL: https://accounts.google.com/o/oauth2/v2/auth?...
[Hybrid App] Platform: android
[Hybrid App] In-app browser opened successfully

// ❌ 오류 로그
[Google Login] Error: ...
```

### 3️⃣ Network 탭 확인

**Request:**
```
GET /api/auth/google/authorize
```

**Response (성공):**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "state": "random_state_string"
  }
}
```

**Response (실패):**
```json
{
  "success": false,
  "error": "Google Client ID not configured"
}
```

### 4️⃣ 환경 변수 확인

**Chrome DevTools Console에서 실행:**

```javascript
// API Base URL 확인
console.log('API_BASE:', '/api')

// Google Client ID 확인
console.log('GOOGLE_CLIENT_ID:', window.GOOGLE_CLIENT_ID)

// Capacitor 확인
console.log('Capacitor:', window.Capacitor)
console.log('Platform:', window.Capacitor?.getPlatform())
console.log('IsNative:', window.Capacitor?.isNativePlatform())
console.log('Browser Plugin:', window.Capacitor?.Plugins?.Browser)
```

---

## ✅ 해결 방법

### 문제 1: Google Client ID 미설정

#### Cloudflare Pages 환경 변수 설정

**Cloudflare Dashboard에서:**

1. **Workers & Pages** → **webapp-tvo** 선택
2. **Settings** → **Environment Variables** 클릭
3. **Production** 탭에서 변수 추가:

```
Variable name: VITE_GOOGLE_CLIENT_ID
Value: YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
```

4. **Save** 클릭
5. **Deployments** → **Retry deployment** (재배포)

#### 로컬 개발 환경 설정

**파일:** `.dev.vars`

```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
```

### 문제 2: capacitor.js 로드 실패

#### 해결책: 빌드 및 동기화

```powershell
cd C:\Users\user\StudioProjects\bsTodoList

# 1️⃣ 빌드
npm run build

# 2️⃣ Capacitor 동기화
npx cap sync android

# 3️⃣ capacitor.js 확인
dir dist\capacitor.js
dir android\app\src\main\assets\public\capacitor.js

# 4️⃣ Android Studio 실행
npx cap open android
```

### 문제 3: API 엔드포인트 오류

#### 백엔드 로그 확인

**Cloudflare Pages 로그:**

```bash
npx wrangler pages deployment tail --project-name webapp
```

**로컬 개발 서버:**

```bash
npm run dev
```

**예상 로그:**
```
GET /api/auth/google/authorize 200 OK
```

### 문제 4: CORS 오류

#### Capacitor에서는 CORS 무시됨

Capacitor는 Native HTTP를 사용하므로 CORS가 적용되지 않습니다.

하지만 웹 브라우저에서 테스트 시 CORS 설정 필요:

**파일:** `src/index.ts`

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORS 설정
app.use('*', cors({
  origin: ['https://webapp-tvo.pages.dev', 'http://localhost:8788'],
  credentials: true
}))
```

---

## 🧪 테스트 스크립트

### Chrome DevTools Console에서 실행

```javascript
// 1️⃣ 환경 확인
console.log('=== Environment Check ===')
console.log('API_BASE:', '/api')
console.log('GOOGLE_CLIENT_ID:', window.GOOGLE_CLIENT_ID)
console.log('Capacitor:', typeof window.Capacitor !== 'undefined')
console.log('Platform:', window.Capacitor?.getPlatform())
console.log('IsNative:', window.Capacitor?.isNativePlatform())

// 2️⃣ API 테스트
console.log('\n=== API Test ===')
axios.get('/api/auth/google/authorize')
  .then(res => {
    console.log('✅ Success:', res.data)
  })
  .catch(err => {
    console.error('❌ Error:', err.response?.data || err.message)
  })

// 3️⃣ Browser Plugin 확인
console.log('\n=== Browser Plugin Check ===')
if (window.Capacitor?.Plugins?.Browser) {
  console.log('✅ Browser Plugin Available')
  console.log('Browser Plugin:', window.Capacitor.Plugins.Browser)
} else {
  console.error('❌ Browser Plugin Not Available')
}
```

---

## 📊 예상 결과

### ✅ 정상 시나리오

```javascript
=== Environment Check ===
API_BASE: /api
GOOGLE_CLIENT_ID: 123456789-xxxxxxxxxx.apps.googleusercontent.com
Capacitor: true
Platform: android
IsNative: true

=== API Test ===
✅ Success: {
  success: true,
  data: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth?...",
    state: "abc123xyz"
  }
}

=== Browser Plugin Check ===
✅ Browser Plugin Available
Browser Plugin: {open: ƒ, close: ƒ, ...}
```

### ❌ 오류 시나리오

**시나리오 1: Client ID 미설정**
```javascript
GOOGLE_CLIENT_ID: undefined
❌ Error: {success: false, error: "Google Client ID not configured"}
```

**시나리오 2: capacitor.js 누락**
```javascript
Capacitor: false
❌ Browser Plugin Not Available
```

**시나리오 3: API 엔드포인트 오류**
```javascript
❌ Error: {success: false, error: "구글 로그인 준비 중 오류가 발생했습니다."}
```

---

## 🔧 문제별 해결 체크리스트

### ✅ Google Client ID 설정

- [ ] Cloudflare Pages 환경 변수에 `VITE_GOOGLE_CLIENT_ID` 추가
- [ ] 재배포 완료
- [ ] `window.GOOGLE_CLIENT_ID` 값 확인

### ✅ capacitor.js 설정

- [ ] `npm run build` 실행
- [ ] `npx cap sync android` 실행
- [ ] `dist/capacitor.js` 존재 확인
- [ ] `android/app/src/main/assets/public/capacitor.js` 존재 확인

### ✅ API 엔드포인트 확인

- [ ] `/api/auth/google/authorize` 응답 200 OK
- [ ] 응답에 `authUrl`과 `state` 포함
- [ ] `authUrl`이 `https://accounts.google.com/...` 시작

### ✅ Browser Plugin 확인

- [ ] `window.Capacitor` 정의됨
- [ ] `window.Capacitor.Plugins.Browser` 사용 가능
- [ ] `Browser.open()` 함수 존재

---

## 🎯 빠른 체크 명령

### 로컬 PC (PowerShell)

```powershell
# 1️⃣ 최신 코드
cd C:\Users\user\StudioProjects\bsTodoList
git pull origin main

# 2️⃣ 빌드 & 동기화
npm run build
npx cap sync android

# 3️⃣ capacitor.js 확인
if (Test-Path "dist\capacitor.js") { 
  Write-Host "✅ dist\capacitor.js exists" -ForegroundColor Green 
} else { 
  Write-Host "❌ dist\capacitor.js missing" -ForegroundColor Red 
}

if (Test-Path "android\app\src\main\assets\public\capacitor.js") { 
  Write-Host "✅ android capacitor.js exists" -ForegroundColor Green 
} else { 
  Write-Host "❌ android capacitor.js missing" -ForegroundColor Red 
}

# 4️⃣ Android Studio 실행
npx cap open android
```

---

## 📚 관련 문서

- [CAPACITOR_PLATFORM_SETUP_GUIDE.md](./CAPACITOR_PLATFORM_SETUP_GUIDE.md)
- [CAPACITOR_JS_MISSING_FIX.md](./CAPACITOR_JS_MISSING_FIX.md)
- [OAUTH_BROWSER_BACKGROUND_FIX.md](./OAUTH_BROWSER_BACKGROUND_FIX.md)

---

## 🔗 GitHub Repository

https://github.com/jkkim74/bsTodoList

---

## 📅 작성일

2025-01-20

---

## ✅ 다음 단계

1. **Chrome DevTools 연결** → `chrome://inspect`
2. **Google 로그인 클릭** → Console 로그 확인
3. **오류 메시지 복사** → 여기에 공유
4. **환경 변수 확인** → `window.GOOGLE_CLIENT_ID`
5. **API 응답 확인** → Network 탭

**Chrome DevTools에서 확인한 오류 내용을 알려주시면 정확한 해결 방법을 제시하겠습니다!** 🚀
