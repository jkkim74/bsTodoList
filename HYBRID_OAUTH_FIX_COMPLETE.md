# 🚀 하이브리드 앱 Google OAuth 외부 브라우저 문제 해결

## 📋 문제 요약

### 🔴 이전 문제
- **증상**: Google OAuth 로그인 시 하이브리드 앱에서 **외부 시스템 브라우저**가 열림
- **원인**: `window.location.href = authUrl` 사용으로 Capacitor가 외부 브라우저 실행
- **결과**: 로그인 후 앱으로 돌아오지 않고 브라우저에 남아있음

### ✅ 해결 방법
- Capacitor **In-App Browser** 플러그인 사용
- **Deep Link** (Custom URL Scheme)로 OAuth 콜백 처리
- 앱 내부에서 완전한 OAuth 플로우 완성

---

## 🔧 구현 내역

### 1️⃣ Capacitor Browser 플러그인 설치

```bash
npm install @capacitor/browser
```

**package.json에 추가됨:**
```json
{
  "dependencies": {
    "@capacitor/browser": "^7.0.0"
  }
}
```

---

### 2️⃣ 프론트엔드: In-App Browser 사용

#### 파일: `public/static/app.js`

**변경 전 (❌):**
```javascript
// 전체 창을 리디렉션 → 외부 브라우저 열림
window.location.href = authUrl
```

**변경 후 (✅):**
```javascript
// 🆕 Capacitor imports for hybrid app
let Capacitor, Browser, App
if (typeof window.Capacitor !== 'undefined') {
  Capacitor = window.Capacitor
  Browser = window.Capacitor.Plugins?.Browser
  App = window.Capacitor.Plugins?.App
}

async function handleGoogleLogin() {
  try {
    const authResponse = await axios.get(`${API_BASE}/auth/google/authorize`)
    const { authUrl, state } = authResponse.data.data
    sessionStorage.setItem('google_oauth_state', state)

    // 🔥 Hybrid App: Use in-app browser
    if (Capacitor && Browser && Capacitor.isNativePlatform()) {
      console.log('[Hybrid App] Opening OAuth in in-app browser')
      
      // In-App Browser 열기
      await Browser.open({
        url: authUrl,
        windowName: '_self',
        presentationStyle: 'popover'
      })
    } else {
      // 🌐 Web: Standard redirect
      console.log('[Web] Redirecting to OAuth URL')
      window.location.href = authUrl
    }
  } catch (error) {
    console.error('Google login error:', error)
  }
}
```

---

### 3️⃣ Deep Link 콜백 처리

#### App URL Listener 등록

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // 🔥 Hybrid App: Register App URL Listener for OAuth callback
  if (Capacitor && App && Capacitor.isNativePlatform()) {
    console.log('[Hybrid App] Registering App URL Listener for OAuth')
    
    App.addListener('appUrlOpen', async (data) => {
      console.log('[Hybrid App] App URL opened:', data.url)
      
      // In-App Browser 닫기
      if (Browser) {
        await Browser.close()
      }
      
      // OAuth 콜백 URL 파싱
      const url = new URL(data.url)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      
      if (code) {
        console.log('[Hybrid App] Handling OAuth callback with code:', code)
        handleGoogleCallback(code, state)
      }
    })
  }
  
  // 🌐 Web: Handle OAuth callback from URL params
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')

  if (code) {
    window.history.replaceState({}, document.title, window.location.pathname)
    handleGoogleCallback(code, state)
  }
})
```

---

### 4️⃣ 백엔드: Deep Link 리디렉션

#### 파일: `src/routes/auth.ts`

**Google OAuth Callback 핸들러 수정:**

```typescript
auth.get('/google/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')

  // 에러 처리
  if (error) {
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <script>
          // 🔥 Hybrid App: Custom URL Scheme
          const isHybridApp = window.Capacitor && window.Capacitor.isNativePlatform()
          if (isHybridApp) {
            window.location.href = 'com.braindump.app://oauth/callback?error=${error}'
          } else {
            window.location.href = '/?error=${error}'
          }
        </script>
      </head>
      <body>Google 로그인 오류...</body>
      </html>
    `)
  }

  // 성공: Deep Link로 리디렉션
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <script>
        const isHybridApp = window.Capacitor && window.Capacitor.isNativePlatform()
        if (isHybridApp) {
          // Deep Link: com.braindump.app://oauth/callback?code=...&state=...
          window.location.href = 'com.braindump.app://oauth/callback?code=${code}&state=${state}'
        } else {
          // Web: Standard URL
          window.location.href = '/?code=${code}&state=${state}'
        }
      </script>
    </head>
    <body>Google 로그인 성공! 앱으로 돌아갑니다...</body>
    </html>
  `)
})
```

---

### 5️⃣ Capacitor 설정 업데이트

#### 파일: `capacitor.config.ts`

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.braindump.app',
  appName: 'Brain Dumping',
  webDir: 'dist',
  server: {
    url: 'https://webapp-tvo.pages.dev',
    cleartext: true
  },
  // 🔥 OAuth Deep Link Configuration
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true
  }
};

export default config;
```

---

## 📱 안드로이드 네이티브 설정 (필요 시)

### AndroidManifest.xml에 Intent Filter 추가

앱 빌드 후 `android/app/src/main/AndroidManifest.xml` 수정:

```xml
<activity android:name=".MainActivity">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    
    <!-- Deep Link: com.braindump.app://oauth/callback -->
    <data
      android:scheme="com.braindump.app"
      android:host="oauth" />
  </intent-filter>
</activity>
```

**Android 빌드 명령:**
```bash
npx cap sync android
npx cap open android
```

---

## 🍎 iOS 네이티브 설정 (필요 시)

### Info.plist에 URL Scheme 추가

`ios/App/App/Info.plist` 수정:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.braindump.app</string>
    </array>
    <key>CFBundleURLName</key>
    <string>com.braindump.app</string>
  </dict>
</array>
```

**iOS 빌드 명령:**
```bash
npx cap sync ios
npx cap open ios
```

---

## 🔄 OAuth 플로우 비교

### ❌ 이전 플로우 (문제)

```
1. 사용자: "Google 로그인" 버튼 클릭
2. 앱: window.location.href = authUrl
3. Capacitor: 시스템 브라우저 실행 (Chrome, Safari 등)
4. 브라우저: Google 로그인 페이지
5. 사용자: Google 계정으로 로그인
6. Google: 브라우저로 리디렉션 (webapp-tvo.pages.dev/api/auth/google/callback?code=...)
7. ❌ 문제: 앱으로 돌아오지 않고 브라우저에 남아있음
```

### ✅ 새 플로우 (해결)

```
1. 사용자: "Google 로그인" 버튼 클릭
2. 앱: Browser.open(authUrl) → In-App Browser 열기
3. In-App Browser: Google 로그인 페이지
4. 사용자: Google 계정으로 로그인
5. Google: 리디렉션 (webapp-tvo.pages.dev/api/auth/google/callback?code=...)
6. 백엔드: Deep Link 생성 (com.braindump.app://oauth/callback?code=...)
7. 앱: App URL Listener가 Deep Link 감지
8. 앱: In-App Browser 자동 닫기
9. 앱: handleGoogleCallback(code, state) 실행
10. 앱: POST /api/auth/google/callback → JWT 발급
11. ✅ 성공: 앱 내에서 로그인 완료, 메인 화면 렌더링
```

---

## 🧪 테스트 가이드

### 웹 브라우저 테스트

1. **개발 서버 실행:**
   ```bash
   npm run dev
   ```

2. **브라우저 접속:**
   ```
   http://localhost:8788
   ```

3. **Google 로그인 테스트:**
   - "Google 로그인" 버튼 클릭
   - 웹에서는 기존 방식으로 작동 (새 탭 열림)

### 하이브리드 앱 테스트

1. **프로덕션 빌드:**
   ```bash
   npm run build
   ```

2. **Capacitor 동기화:**
   ```bash
   npx cap sync
   ```

3. **안드로이드 에뮬레이터/실기기:**
   ```bash
   npx cap open android
   ```
   - Android Studio에서 Run

4. **iOS 시뮬레이터/실기기:**
   ```bash
   npx cap open ios
   ```
   - Xcode에서 Run

5. **테스트 시나리오:**
   - ✅ Google 로그인 버튼 클릭
   - ✅ In-App Browser 열림 (외부 브라우저 아님!)
   - ✅ Google 로그인 완료
   - ✅ In-App Browser 자동 닫힘
   - ✅ 앱 메인 화면으로 자동 이동
   - ✅ 로그인 상태 유지 확인

---

## 🐛 문제 해결

### 1. In-App Browser가 열리지 않음

**증상:**
```
Error: Browser plugin not available
```

**해결:**
```bash
# Browser 플러그인 재설치
npm install @capacitor/browser

# Capacitor 동기화
npx cap sync
```

### 2. Deep Link가 작동하지 않음

**증상:**
- In-App Browser가 닫히지 않음
- 앱으로 돌아오지 않음

**해결:**
- AndroidManifest.xml에 Intent Filter 확인
- iOS Info.plist에 URL Scheme 확인
- Capacitor 재동기화: `npx cap sync`

### 3. 웹에서 작동하지 않음

**증상:**
```
Capacitor is not defined
```

**해결:**
- 정상입니다! 웹에서는 Capacitor가 없으므로 기존 방식 사용
- 조건부 분기가 올바르게 작동 중

```javascript
if (Capacitor && Browser && Capacitor.isNativePlatform()) {
  // 하이브리드 앱 로직
} else {
  // 웹 브라우저 로직
}
```

### 4. Google Console 리디렉션 URI 설정

**Google Cloud Console:**
1. https://console.cloud.google.com/
2. APIs & Services > Credentials
3. OAuth 2.0 Client IDs 선택
4. **Authorized redirect URIs에 추가:**
   ```
   https://webapp-tvo.pages.dev/api/auth/google/callback
   http://localhost:8788/api/auth/google/callback
   ```

---

## 📦 배포

### 프로덕션 배포

```bash
# 1. 빌드
npm run build

# 2. Cloudflare Pages 배포 (자동)
git add -A
git commit -m "fix: Hybrid app Google OAuth in-app browser"
git push origin main

# 3. Capacitor 동기화 (앱 배포)
npx cap sync
npx cap open android
npx cap open ios
```

### 환경 변수 확인

**Cloudflare Dashboard:**
- Workers & Pages > webapp-tvo > Settings > Environment variables
- 필수 변수:
  - `VITE_GOOGLE_CLIENT_ID`: Google OAuth Client ID
  - `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret

---

## ✅ 완료 체크리스트

- [x] @capacitor/browser 플러그인 설치
- [x] handleGoogleLogin() 수정 (In-App Browser 사용)
- [x] App URL Listener 등록 (Deep Link 처리)
- [x] 백엔드 OAuth 콜백 수정 (Deep Link 리디렉션)
- [x] capacitor.config.ts 업데이트
- [x] package.json 업데이트
- [ ] AndroidManifest.xml Intent Filter 추가 (앱 빌드 후)
- [ ] iOS Info.plist URL Scheme 추가 (앱 빌드 후)
- [ ] 하이브리드 앱에서 실제 테스트

---

## 📚 참고 문서

- [Capacitor Browser Plugin](https://capacitorjs.com/docs/apis/browser)
- [Capacitor App Plugin - URL Events](https://capacitorjs.com/docs/apis/app#url-events)
- [Deep Linking in Capacitor](https://capacitorjs.com/docs/guides/deep-links)
- [Google OAuth 2.0 Redirect URIs](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation)

---

## 🎯 다음 단계

1. **로컬 빌드 & 테스트:**
   ```bash
   npm run build
   npx cap sync
   npx cap open android
   ```

2. **실기기 테스트:**
   - Android: USB 디버깅 활성화 후 테스트
   - iOS: Xcode에서 실기기 연결 후 테스트

3. **프로덕션 배포:**
   ```bash
   git push origin main
   ```

4. **앱 스토어 배포:**
   - Google Play Store (Android)
   - Apple App Store (iOS)

---

**작성일:** 2026-01-19  
**작성자:** AI Assistant  
**프로젝트:** Brain Dumping TO_DO_LIST  
**버전:** v2.0.0
