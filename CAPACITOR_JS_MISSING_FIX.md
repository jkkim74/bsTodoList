# 🐛 하이브리드 앱 Google OAuth 시스템 브라우저 열림 문제 - 근본 원인

## 📋 문제 상황

### 🔴 **증상**
- Google OAuth 로그인 클릭 시
- ❌ In-App Browser가 아닌 **시스템 크롬 브라우저**가 열림
- ❌ 앱에서 완전히 벗어남
- ❌ 로그인 후 앱으로 돌아오지 않음

### 📊 **예상 vs 실제**

| 예상 동작 | 실제 동작 |
|----------|----------|
| In-App Browser 열림 | ❌ 시스템 브라우저 열림 |
| 앱 내에서 Google 로그인 | ❌ 크롬 브라우저에서 로그인 |
| 앱으로 자동 복귀 | ❌ 브라우저에 남아있음 |

---

## 🔍 근본 원인 분석

### 1️⃣ **Capacitor.js 스크립트 누락**

#### **public/index.html 현재 상태:**
```html
<body>
    <div id="app"></div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script src="/static/app.js"></script>
    <!-- ❌ capacitor.js가 없음! -->
</body>
```

#### **문제:**
- `capacitor.js`가 로드되지 않음
- `window.Capacitor`가 `undefined`
- Capacitor 플러그인(Browser, App)을 사용할 수 없음

---

### 2️⃣ **public/static/app.js에서 Capacitor 감지 실패**

```javascript
// public/static/app.js:6-12
let Capacitor, Browser, App
if (typeof window.Capacitor !== 'undefined') {  // ❌ 항상 false
  Capacitor = window.Capacitor
  Browser = window.Capacitor.Plugins?.Browser
  App = window.Capacitor.Plugins?.App
}
```

**결과:**
- `Capacitor` = `undefined`
- `Browser` = `undefined`
- `App` = `undefined`

---

### 3️⃣ **Google Login Handler가 웹 모드로 작동**

```javascript
// public/static/app.js:598-614
async function handleGoogleLogin() {
  try {
    const authResponse = await axios.get(`${API_BASE}/auth/google/authorize`)
    const { authUrl, state } = authResponse.data.data
    sessionStorage.setItem('google_oauth_state', state)

    // 🔥 Hybrid App: Use in-app browser
    if (Capacitor && Browser && Capacitor.isNativePlatform()) {
      // ❌ 절대 실행되지 않음 (Capacitor === undefined)
      console.log('[Hybrid App] Opening OAuth in in-app browser')
      await Browser.open({ url: authUrl, ... })
    } else {
      // ✅ 항상 여기로 실행됨
      console.log('[Web] Redirecting to OAuth URL')
      window.location.href = authUrl  // ⬅️ 시스템 브라우저 열림!
    }
  }
}
```

**실행 흐름:**
```
1. Capacitor === undefined (스크립트 없음)
2. if (Capacitor && Browser && ...) → false
3. else 블록 실행
4. window.location.href = authUrl
5. ❌ 시스템 브라우저가 열림 (In-App Browser 아님)
```

---

## ✅ 해결 방법

### **capacitor.js 스크립트 추가**

`capacitor.js`는 Capacitor가 앱을 빌드할 때 자동으로 생성되는 파일입니다. HTML에서 로드해야 합니다.

---

### 📝 **수정 1: public/index.html**

```html
<body>
    <div id="app"></div>
    
    <!-- 🔥 Capacitor.js를 가장 먼저 로드 -->
    <script src="capacitor.js"></script>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script src="/static/app.js"></script>
</body>
```

**중요:**
- `capacitor.js`를 **가장 먼저** 로드
- `app.js`보다 **앞**에 위치
- 경로: `/capacitor.js` (루트)

---

### 📝 **수정 2: 더 안전한 Capacitor 초기화 (app.js)**

Capacitor가 비동기로 로드될 수 있으므로, 초기화를 지연시킵니다.

```javascript
// Brain Dumping TO_DO_LIST Application
const API_BASE = '/api'
const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || ''

// 🆕 Capacitor imports for hybrid app
let Capacitor, Browser, App

// 🔥 Capacitor 초기화 함수
function initializeCapacitor() {
  if (typeof window.Capacitor !== 'undefined') {
    Capacitor = window.Capacitor
    Browser = window.Capacitor.Plugins?.Browser
    App = window.Capacitor.Plugins?.App
    console.log('[Capacitor] Initialized:', {
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform()
    })
    return true
  }
  console.log('[Capacitor] Not available (web mode)')
  return false
}

// 🔥 페이지 로드 시 Capacitor 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCapacitor)
} else {
  initializeCapacitor()
}

let currentUser = null
let currentDate = new Date().toISOString().split('T')[0]
let dailyOverviewData = null
```

---

### 📝 **수정 3: Google Login Handler 개선**

```javascript
async function handleGoogleLogin() {
  const errorDiv = document.getElementById('error-message')
  errorDiv.classList.add('hidden')

  try {
    // Step 1: Get authorization URL
    const authResponse = await axios.get(`${API_BASE}/auth/google/authorize`)
    const { authUrl, state } = authResponse.data.data

    // Store state for verification
    sessionStorage.setItem('google_oauth_state', state)

    // 🔥 Capacitor 재확인 (비동기 로드 대응)
    if (!Capacitor && typeof window.Capacitor !== 'undefined') {
      initializeCapacitor()
    }

    // 🔥 Hybrid App: Use in-app browser
    if (Capacitor && Browser && Capacitor.isNativePlatform()) {
      console.log('[Hybrid App] Opening OAuth in in-app browser')
      console.log('[Hybrid App] Capacitor platform:', Capacitor.getPlatform())
      
      // Open in-app browser
      await Browser.open({
        url: authUrl,
        windowName: '_self',
        presentationStyle: 'popover'
      })
      
      console.log('[Hybrid App] In-app browser opened')
    } else {
      // 🌐 Web: Use standard redirect
      console.log('[Web] Redirecting to OAuth URL')
      console.log('[Web] Capacitor available:', typeof window.Capacitor !== 'undefined')
      window.location.href = authUrl
    }
  } catch (error) {
    console.error('Google login error:', error)
    errorDiv.textContent = '구글 로그인 준비 중 오류가 발생했습니다.'
    errorDiv.classList.remove('hidden')
  }
}
```

---

## 🔧 Capacitor.js 파일 위치 확인

Capacitor가 빌드할 때 생성하는 파일:

```
dist/
  capacitor.js          ⬅️ 이 파일이 있어야 함
  capacitor.plugins.js  ⬅️ 플러그인 번들
  index.html
  static/
    app.js
```

**빌드 후 확인:**
```bash
cd C:\Users\user\StudioProjects\bsTodoList

# 빌드
npm run build

# Capacitor 동기화 (capacitor.js 생성)
npx cap sync android

# dist 폴더 확인
ls dist/capacitor.js
```

**만약 capacitor.js가 없다면:**
```bash
# Capacitor 재설치
npx cap add android

# 동기화
npx cap sync android
```

---

## 🧪 테스트 및 검증

### **1. Chrome DevTools로 확인 (Android)**

```bash
# Chrome에서
chrome://inspect

# 연결된 Android 기기/에뮬레이터 선택
# Brain Dumping 앱의 WebView 선택
```

**Console에서 확인:**
```javascript
// Capacitor 로드 확인
console.log('Capacitor:', window.Capacitor)
console.log('Platform:', window.Capacitor?.getPlatform())
console.log('Is Native:', window.Capacitor?.isNativePlatform())
console.log('Browser Plugin:', window.Capacitor?.Plugins?.Browser)
```

**예상 출력 (정상):**
```
Capacitor: {Plugins: {…}, getPlatform: ƒ, isNativePlatform: ƒ, …}
Platform: "android"
Is Native: true
Browser Plugin: {open: ƒ, close: ƒ, addListener: ƒ, …}
```

**출력 (문제):**
```
Capacitor: undefined  ⬅️ capacitor.js 미로드
```

---

### **2. 앱 실행 로그 확인**

**정상 로그:**
```
[Capacitor] Initialized: {platform: "android", isNative: true}
[Hybrid App] Opening OAuth in in-app browser
[Hybrid App] Capacitor platform: android
[Hybrid App] In-app browser opened
```

**문제 로그:**
```
[Capacitor] Not available (web mode)
[Web] Redirecting to OAuth URL
[Web] Capacitor available: false
```

---

## 📦 수정 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `public/index.html` | `<script src="capacitor.js"></script>` 추가 |
| `public/static/app.js` | Capacitor 초기화 함수 추가, 로깅 강화 |

---

## 🎯 핵심 체크리스트

배포 전 확인 사항:

- [ ] `dist/capacitor.js` 파일 존재 확인
- [ ] `public/index.html`에 `<script src="capacitor.js"></script>` 추가
- [ ] `npx cap sync android` 실행
- [ ] Chrome DevTools에서 `window.Capacitor` 확인
- [ ] 앱에서 Google 로그인 시 In-App Browser 열림 확인
- [ ] 로그인 후 앱으로 복귀 확인

---

## 🚀 빠른 수정 가이드 (로컬 PC)

```bash
cd C:\Users\user\StudioProjects\bsTodoList

# 1. 최신 코드 받기
git pull origin main

# 2. public/index.html 수정
# <body> 태그 안에 추가:
# <script src="capacitor.js"></script>

# 3. 빌드
npm run build

# 4. Capacitor 동기화
npx cap sync android

# 5. dist/capacitor.js 확인
dir dist\capacitor.js

# 6. Android Studio 실행
npx cap open android

# 7. Run 버튼 클릭 후 테스트
```

---

## 💡 왜 이제야 발견되었나?

### **이전에는 웹 브라우저에서 테스트**
- 웹에서는 `window.location.href = authUrl`이 정상 작동
- 하이브리드 앱에서만 문제 발생

### **Capacitor.js는 필수**
- Capacitor 앱은 **WebView 안에서 실행**
- Capacitor.js가 WebView와 네이티브 브릿지 역할
- 없으면 일반 웹 페이지로 작동

---

## 🔄 정상 작동 흐름

### **Capacitor.js 로드 후:**

```
1. 앱 시작
2. capacitor.js 로드
3. window.Capacitor 초기화
4. Plugins (Browser, App) 로드
5. app.js 로드
6. initializeCapacitor() 실행
7. Google 로그인 클릭
8. if (Capacitor && Browser && ...) → true ✅
9. Browser.open() 실행 → In-App Browser 열림 ✅
10. OAuth 완료 후 Deep Link로 앱 복귀 ✅
```

---

**작성일:** 2026-01-20  
**문제:** Google OAuth 로그인 시 시스템 브라우저가 열림 (In-App Browser 아님)  
**근본 원인:** `capacitor.js` 스크립트 누락으로 Capacitor 초기화 실패  
**해결:** `public/index.html`에 `<script src="capacitor.js"></script>` 추가  

**GitHub:** https://github.com/jkkim74/bsTodoList
