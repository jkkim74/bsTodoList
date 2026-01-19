# 하이브리드 앱 Google OAuth 로그인 문제 분석

## 🔴 문제 상황

**증상**: Google OAuth 로그인 시 하이브리드 앱에서 메인 화면이 열리지 않고 **외부 브라우저**에서 열림

**기대 동작**: 앱 내에서 로그인 완료 후 메인 화면으로 이동

---

## 🔍 원인 분석

### 1. 현재 OAuth 흐름

**파일**: `public/static/app.js` (Line 591)

```javascript
async function handleGoogleLogin() {
  try {
    // Step 1: Get authorization URL
    const authResponse = await axios.get(`${API_BASE}/auth/google/authorize`)
    const { authUrl, state } = authResponse.data.data

    // Store state for verification
    sessionStorage.setItem('google_oauth_state', state)

    // ❌ 문제: window.location.href로 리디렉션
    window.location.href = authUrl  // 외부 브라우저로 이동!
  } catch (error) {
    console.error('Google login error:', error)
  }
}
```

**문제점**:
- `window.location.href`는 **현재 웹뷰를 떠나서** Google 인증 페이지로 이동
- Capacitor/Cordova 앱에서는 이것이 **시스템 브라우저**를 열게 됨
- Google 인증 완료 후 콜백 URL이 시스템 브라우저에서 열림
- **앱으로 돌아오지 못함**

---

## 🎯 하이브리드 앱에서의 올바른 OAuth 흐름

### Capacitor에서 OAuth 처리 방법

#### 옵션 1: Capacitor Browser Plugin (권장) ⭐

**장점**:
- ✅ 앱 컨텍스트 유지
- ✅ 인증 완료 후 앱으로 복귀
- ✅ Deep Link 지원

**구현**:
```javascript
import { Browser } from '@capacitor/browser'

async function handleGoogleLogin() {
  try {
    const authResponse = await axios.get(`${API_BASE}/auth/google/authorize`)
    const { authUrl, state } = authResponse.data.data
    
    sessionStorage.setItem('google_oauth_state', state)

    // ✅ Capacitor Browser 사용 (In-App Browser)
    await Browser.open({ 
      url: authUrl,
      presentationStyle: 'popover', // iOS: 팝오버 스타일
      windowName: '_self' // Android: 같은 창에서
    })

    // 브라우저 닫힐 때 리스너
    Browser.addListener('browserFinished', () => {
      console.log('Browser closed')
    })
  } catch (error) {
    console.error('Google login error:', error)
  }
}
```

#### 옵션 2: Deep Linking + Custom URL Scheme

**가장 네이티브스러운 방법**

**1. Custom URL Scheme 설정**

`capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'com.braindump.app',
  appName: 'Brain Dumping',
  webDir: 'dist',
  plugins: {
    // ... 기존 플러그인
  },
  // ✅ Deep Link 설정
  server: {
    androidScheme: 'https',
    hostname: 'braindump.app'
  }
}
```

**2. App Links / Universal Links 설정**

**Android** (`AndroidManifest.xml`):
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" 
        android:host="webapp-tvo.pages.dev"
        android:pathPrefix="/api/auth/google/callback" />
  <data android:scheme="braindump" />
</intent-filter>
```

**iOS** (`Info.plist`):
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>braindump</string>
    </array>
    <key>CFBundleURLName</key>
    <string>com.braindump.app</string>
  </dict>
</array>
```

**3. App Launch Handler**

`app.js`:
```javascript
import { App } from '@capacitor/app'

// 앱 시작 시 Deep Link 리스너 등록
App.addListener('appUrlOpen', (data) => {
  console.log('App opened with URL:', data.url)
  
  // braindump://callback?code=xxx&state=xxx
  // 또는 https://webapp-tvo.pages.dev/api/auth/google/callback?code=xxx&state=xxx
  
  const url = new URL(data.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  
  if (code) {
    handleGoogleCallback(code, state)
  }
})
```

#### 옵션 3: Capacitor OAuth Plugin 사용

**전용 OAuth 플러그인**:

```bash
npm install @byteowls/capacitor-oauth2
```

```javascript
import { OAuth2Client } from '@byteowls/capacitor-oauth2'

async function handleGoogleLogin() {
  try {
    const result = await OAuth2Client.authenticate({
      appId: 'com.braindump.app',
      authorizationBaseUrl: 'https://accounts.google.com/o/oauth2/auth',
      accessTokenEndpoint: 'https://oauth2.googleapis.com/token',
      scope: 'openid email profile',
      responseType: 'code',
      pkceEnabled: true,
      logsEnabled: true,
      web: {
        redirectUrl: 'https://webapp-tvo.pages.dev/api/auth/google/callback',
        windowOptions: 'height=600,width=600'
      },
      android: {
        redirectUrl: 'com.braindump.app://callback'
      },
      ios: {
        redirectUrl: 'com.braindump.app://callback'
      }
    })
    
    // result.access_token_response.code 사용
    await handleGoogleCallback(result.authorization_response.code, result.state)
  } catch (error) {
    console.error('OAuth error:', error)
  }
}
```

---

## 🛠️ 권장 해결 방법

### 방법 1: Capacitor Browser Plugin (간단하고 빠름) ⭐

**단계 1: 플러그인 설치**

```bash
npm install @capacitor/browser
npx cap sync
```

**단계 2: 코드 수정**

`public/static/app.js`:

```javascript
// ✅ 추가: Capacitor 환경 감지
function isCapacitorApp() {
  return window.Capacitor && window.Capacitor.isNativePlatform()
}

// ✅ 수정된 Google 로그인
async function handleGoogleLogin() {
  const errorDiv = document.getElementById('error-message')
  errorDiv.classList.add('hidden')

  try {
    // Step 1: Get authorization URL
    const authResponse = await axios.get(`${API_BASE}/auth/google/authorize`)
    const { authUrl, state } = authResponse.data.data

    // Store state for verification
    sessionStorage.setItem('google_oauth_state', state)

    // ✅ Capacitor 앱인 경우 In-App Browser 사용
    if (isCapacitorApp()) {
      const { Browser } = window.Capacitor.Plugins
      
      // In-App Browser로 열기
      await Browser.open({ 
        url: authUrl,
        presentationStyle: 'popover', // iOS
        toolbarColor: '#4F46E5' // 앱 테마 색상
      })
      
      // 브라우저 닫힘 리스너
      Browser.addListener('browserFinished', () => {
        // 사용자가 브라우저를 닫았을 때
        console.log('Browser closed by user')
      })
      
      // URL 변경 리스너 (콜백 감지)
      Browser.addListener('browserPageLoaded', () => {
        // 페이지 로드 시
        console.log('Page loaded in browser')
      })
    } else {
      // ✅ 웹 브라우저에서는 기존 방식
      window.location.href = authUrl
    }
  } catch (error) {
    errorDiv.textContent = '구글 로그인 준비 중 오류가 발생했습니다.'
    errorDiv.classList.remove('hidden')
    console.error('Google login error:', error)
  }
}

// ✅ 앱 초기화 시 Deep Link 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
  loadAuthState()
  
  // Capacitor App URL Open 리스너
  if (isCapacitorApp()) {
    const { App } = window.Capacitor.Plugins
    
    App.addListener('appUrlOpen', (data) => {
      console.log('App opened with URL:', data.url)
      
      try {
        const url = new URL(data.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        
        if (code) {
          // OAuth 콜백 처리
          handleGoogleCallback(code, state)
        }
      } catch (error) {
        console.error('Deep link parsing error:', error)
      }
    })
  }
  
  renderApp()
})
```

**단계 3: index.html에 Capacitor 스크립트 추가**

`public/index.html`:

```html
<head>
  <!-- 기존 스크립트들 -->
  
  <!-- ✅ Capacitor 런타임 추가 (앱에서만 로드됨) -->
  <script src="capacitor.js"></script>
</head>
```

---

### 방법 2: Custom URL Scheme + Deep Linking (프로덕션 권장)

**더 네이티브스럽고 안정적**

**단계 1: Google OAuth Redirect URI 수정**

Google Cloud Console에서:
```
웹: https://webapp-tvo.pages.dev/api/auth/google/callback
Android: com.braindump.app://oauth/callback
iOS: com.braindump.app://oauth/callback
```

**단계 2: 백엔드 Redirect URI 지원**

`src/routes/auth.ts`:

```typescript
auth.get('/google/authorize', async (c) => {
  try {
    const clientId = c.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      return errorResponse(c, 'Google Client ID not configured', 500)
    }

    const state = generateState()
    
    // ✅ User-Agent 또는 Query Parameter로 플랫폼 감지
    const platform = c.req.query('platform') || 'web'
    
    let redirectUri
    if (platform === 'android') {
      redirectUri = 'com.braindump.app://oauth/callback'
    } else if (platform === 'ios') {
      redirectUri = 'com.braindump.app://oauth/callback'
    } else {
      redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`
    }
    
    const authUrl = generateGoogleOAuthUrl(clientId, redirectUri, state)

    return successResponse(c, {
      authUrl,
      state,
      redirectUri
    }, 'Google authorization URL generated')
  } catch (error) {
    console.error('Google authorize error:', error)
    return errorResponse(c, '구글 로그인 준비 중 오류가 발생했습니다.', 500)
  }
})
```

**단계 3: 프론트엔드에서 플랫폼 전달**

```javascript
async function handleGoogleLogin() {
  try {
    // ✅ 플랫폼 정보 전달
    const platform = isCapacitorApp() 
      ? (window.Capacitor.getPlatform() === 'ios' ? 'ios' : 'android')
      : 'web'
    
    const authResponse = await axios.get(`${API_BASE}/auth/google/authorize?platform=${platform}`)
    const { authUrl, state } = authResponse.data.data

    sessionStorage.setItem('google_oauth_state', state)

    if (isCapacitorApp()) {
      // System browser에서 열기 (Deep Link로 돌아옴)
      const { Browser } = window.Capacitor.Plugins
      await Browser.open({ url: authUrl })
    } else {
      window.location.href = authUrl
    }
  } catch (error) {
    console.error('Google login error:', error)
  }
}
```

---

## 📋 구현 체크리스트

### 방법 1: In-App Browser (빠른 해결)

- [ ] `@capacitor/browser` 설치
- [ ] `isCapacitorApp()` 함수 추가
- [ ] `handleGoogleLogin()` 수정 (Browser.open 사용)
- [ ] `appUrlOpen` 리스너 추가
- [ ] 테스트 (Android/iOS)

### 방법 2: Deep Linking (프로덕션)

- [ ] Custom URL Scheme 설정 (capacitor.config.ts)
- [ ] Android Manifest 수정
- [ ] iOS Info.plist 수정
- [ ] Google OAuth Redirect URI 추가
- [ ] 백엔드 플랫폼별 Redirect URI 지원
- [ ] `appUrlOpen` 리스너 구현
- [ ] 테스트 (Android/iOS)

---

## 🧪 테스트 방법

### 로컬 테스트

```bash
# 1. 빌드
npm run build

# 2. Capacitor 동기화
npx cap sync

# 3. Android 실행
npx cap open android
# Android Studio에서 실행

# 4. iOS 실행
npx cap open ios
# Xcode에서 실행
```

### 테스트 시나리오

1. ✅ 앱에서 "Google 로그인" 버튼 클릭
2. ✅ In-App Browser 또는 System Browser 열림
3. ✅ Google 계정 선택 및 인증
4. ✅ 앱으로 자동 복귀
5. ✅ 메인 화면 표시

---

## 🎯 권장 사항

### 개발 속도 우선: 방법 1 (In-App Browser)
- ⏱️ 구현 시간: 1-2시간
- 💰 비용: 낮음
- 📱 UX: 좋음

### 프로덕션 품질: 방법 2 (Deep Linking)
- ⏱️ 구현 시간: 4-6시간
- 💰 비용: 중간
- 📱 UX: 최고

---

## 🔧 다음 단계

어떤 방법을 선택하시겠습니까?

1. **방법 1** (In-App Browser) - 빠르게 수정
2. **방법 2** (Deep Linking) - 완벽한 네이티브 경험

선택하시면 해당 방법으로 코드를 작성해드리겠습니다! 🚀

---

## 📚 참고 자료

- **Capacitor Browser**: https://capacitorjs.com/docs/apis/browser
- **Capacitor App**: https://capacitorjs.com/docs/apis/app
- **Deep Linking**: https://capacitorjs.com/docs/guides/deep-links
- **OAuth2 Plugin**: https://github.com/moberwasserlechner/capacitor-oauth2
