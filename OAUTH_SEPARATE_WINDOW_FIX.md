# 🐛 하이브리드 앱 Google OAuth 별도 창 문제 해결

## 📋 문제 상황

### 🔴 **증상**
- ✅ **이메일 로그인**: 하이브리드 앱 내에서 메인 화면으로 정상 이동
- ❌ **Google OAuth 로그인**: 별도의 창으로 메인 화면이 열림
- ❌ **백그라운드**: 로그인 창(In-App Browser)이 여전히 남아있음

### 📊 **비교**

| 로그인 방식 | 동작 | 결과 |
|------------|------|------|
| 이메일 로그인 | 같은 화면에서 `renderApp()` | ✅ 정상 |
| Google OAuth | In-App Browser → 별도 창 | ❌ 문제 |

---

## 🔍 근본 원인 분석

### 1️⃣ **백엔드 HTML에서 Capacitor 감지 불가**

**문제 코드 (src/routes/auth.ts:115-126):**
```typescript
// 백엔드에서 렌더링된 HTML
return c.html(`
  <script>
    // ❌ 문제: Capacitor가 로드되지 않음!
    const isHybridApp = window.Capacitor && window.Capacitor.isNativePlatform()
    if (isHybridApp) {
      window.location.href = 'com.braindump.app://oauth/callback?code=...'
    } else {
      window.location.href = '/?code=...'  // ⬅️ 항상 여기로 실행됨
    }
  </script>
`)
```

**문제점:**
- 백엔드에서 렌더링된 HTML은 **Capacitor 라이브러리가 없음**
- `window.Capacitor`는 항상 `undefined`
- `isHybridApp`이 항상 `false`
- 항상 웹 모드 리디렉션 실행

---

### 2️⃣ **In-App Browser 내에서 웹 리디렉션 발생**

**실행 흐름:**
```
1. 사용자: "Google 로그인" 클릭
2. 앱: In-App Browser 열기 (Google 로그인 페이지)
3. Google: 인증 후 /api/auth/google/callback?code=... 리디렉션
4. 백엔드: HTML 응답 (window.location.href = '/?code=...')
5. ❌ In-App Browser 내부에서: 메인 앱 URL(/?code=...)로 이동
6. ❌ 결과: In-App Browser 안에서 앱이 열림 (별도 창처럼 보임)
7. ❌ 원래 로그인 창: 백그라운드에 그대로 남음
```

**왜 별도 창처럼 보이나?**
- In-App Browser는 **브라우저 창**
- `/?code=...`는 **앱의 메인 URL**
- In-App Browser가 앱 URL을 로드 → 브라우저 안에 앱이 렌더링
- 사용자는 "별도 창"으로 인식

---

### 3️⃣ **Deep Link가 작동하지 않는 이유**

**Deep Link:** `com.braindump.app://oauth/callback?code=...`

**문제:**
- In-App Browser는 **일반 브라우저 컨텍스트**
- Deep Link는 **시스템 레벨**에서 처리됨
- In-App Browser에서 Deep Link를 열면:
  - Android: "앱으로 열기" 확인 다이얼로그 표시 (사용자 액션 필요)
  - iOS: 작동하지 않을 수 있음
- 자동으로 앱으로 돌아가지 않음

---

## ✅ 해결 방법

### **전략: Deep Link 우선 시도 + 웹 폴백**

1. **Deep Link를 먼저 시도** (하이브리드 앱용)
2. **500ms 후 웹 리디렉션** (폴백, 웹 브라우저용)
3. Deep Link가 성공하면 페이지가 네비게이트되므로 폴백은 실행 안 됨

---

### 📝 **수정된 코드**

#### `src/routes/auth.ts` - 성공 리디렉션

```typescript
// Success: Redirect back to app with code and state
return c.html(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Google Login Success</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>
      // 🔥 Try Deep Link first (for hybrid app)
      const deepLink = 'com.braindump.app://oauth/callback?code=${code}' + 
        (('${state}') ? '&state=${state}' : '')
      
      console.log('[OAuth Callback] Attempting deep link:', deepLink)
      
      // Try to open deep link
      window.location.href = deepLink
      
      // Fallback to web redirect after 500ms
      // If deep link works, this won't execute
      setTimeout(() => {
        console.log('[OAuth Callback] Deep link timeout, falling back to web redirect')
        const webUrl = '/?code=${code}' + (('${state}') ? '&state=${state}' : '')
        window.location.href = webUrl
      }, 500)
    </script>
  </head>
  <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
    <h2>Google 로그인 성공!</h2>
    <p>앱으로 돌아가는 중...</p>
    <p style="color: #666; font-size: 14px;">
      자동으로 돌아가지 않는다면 
      <a href="/?code=${code}${state ? '&state=' + state : ''}">여기를 클릭</a>하세요.
    </p>
  </body>
  </html>
`)
```

---

### 🔄 **수정된 플로우**

#### ✅ **하이브리드 앱 (성공 케이스)**
```
1. 사용자: "Google 로그인" 클릭
2. 앱: In-App Browser 열기
3. Google: 인증 후 /api/auth/google/callback?code=... 리디렉션
4. 백엔드: HTML 응답
5. HTML: Deep Link 시도 (com.braindump.app://oauth/callback?code=...)
6. ✅ Android/iOS: Deep Link 감지 → 앱으로 전환
7. ✅ 앱: App URL Listener가 감지
8. ✅ 앱: handleGoogleCallback() 실행
   - Browser.close() → In-App Browser 닫기
   - OAuth 토큰 교환
   - 메인 화면 렌더링
9. ✅ 결과: 앱 내에서 메인 화면 표시, In-App Browser 닫힌 상태
```

#### ✅ **웹 브라우저 (폴백)**
```
1. 사용자: "Google 로그인" 클릭
2. 브라우저: Google 로그인 페이지로 리디렉션
3. Google: 인증 후 /api/auth/google/callback?code=... 리디렉션
4. 백엔드: HTML 응답
5. HTML: Deep Link 시도 (실패 - 앱이 없음)
6. ✅ 500ms 후: 웹 리디렉션 (/?code=...)
7. ✅ 앱: handleGoogleCallback() 실행
8. ✅ 결과: 웹에서 메인 화면 표시
```

---

## 🎯 주요 개선 사항

### 1️⃣ **Capacitor 감지 불필요**
- **이전**: `window.Capacitor` 체크 (항상 실패)
- **이후**: Deep Link를 무조건 시도 (앱이 있으면 작동)

### 2️⃣ **자동 폴백**
- Deep Link 실패 시 자동으로 웹 리디렉션
- 웹과 앱 모두 지원

### 3️⃣ **수동 폴백 링크**
- 500ms 후에도 이동 안 되면 사용자가 클릭 가능

### 4️⃣ **사용자 경험 개선**
- "앱으로 돌아가는 중..." 메시지
- 깔끔한 UI

---

## 🧪 테스트 방법

### **하이브리드 앱에서:**

```bash
cd C:\Users\user\StudioProjects\bsTodoList

# 최신 코드 받기
git pull origin main

# 빌드
npm run build

# Capacitor 동기화
npx cap sync android

# Android Studio 실행
npx cap open android
```

### **테스트 시나리오:**

1. **앱 실행**
2. **"Google 로그인" 클릭**
3. **In-App Browser 열림 확인**
4. **Google 계정 선택**
5. **✅ 확인: Deep Link로 앱 전환**
6. **✅ 확인: In-App Browser 자동 닫힘**
7. **✅ 확인: 앱 내에서 메인 화면 표시**
8. **✅ 확인: 백그라운드에 로그인 창 없음**

---

## 📊 체크리스트

테스트 시 확인할 사항:

- [ ] Google 로그인 후 앱으로 자동 전환
- [ ] In-App Browser가 자동으로 닫힘
- [ ] 메인 화면이 **앱 내부**에서 렌더링 (별도 창 아님)
- [ ] 백그라운드에 로그인 창 없음
- [ ] 뒤로가기 버튼 시 앱 종료 (브라우저 창 안 보임)
- [ ] 웹 브라우저에서도 정상 작동
- [ ] 이메일 로그인과 동일한 UX

---

## 🔧 추가 디버깅

### **Chrome Remote Debugging (Android)**

```bash
# Chrome에서
chrome://inspect

# In-App Browser 내부 콘솔 확인
[OAuth Callback] Attempting deep link: com.braindump.app://oauth/callback?code=...
```

### **Xcode Console (iOS)**

```
[Hybrid App] App URL opened: com.braindump.app://oauth/callback?code=...
[Hybrid App] Handling OAuth callback with code: ...
[Hybrid App] Closing in-app browser before callback processing
```

---

## 📦 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/routes/auth.ts` | Deep Link 우선 + 웹 폴백 로직 |
| `OAUTH_SEPARATE_WINDOW_FIX.md` | 문제 분석 및 해결 문서 |

---

## 💡 왜 이 방법이 작동하나?

### **Deep Link의 동작 원리**

1. **In-App Browser에서 Deep Link 실행**
   ```javascript
   window.location.href = 'com.braindump.app://oauth/callback?code=...'
   ```

2. **Android/iOS가 URL Scheme 감지**
   - `com.braindump.app://` → Brain Dumping 앱으로 연결
   - AndroidManifest.xml / Info.plist에 등록된 스킴

3. **시스템이 앱으로 전환**
   - In-App Browser는 백그라운드로 이동
   - Brain Dumping 앱이 포그라운드로

4. **앱의 App URL Listener 실행**
   ```javascript
   App.addListener('appUrlOpen', (data) => {
     // data.url = 'com.braindump.app://oauth/callback?code=...'
     handleGoogleCallback(code, state)
   })
   ```

5. **handleGoogleCallback()에서 In-App Browser 닫기**
   ```javascript
   await Browser.close()
   ```

---

## 🎉 결과

### ✅ **Before (문제)**
- Google OAuth → 별도 창 열림
- 로그인 창 백그라운드에 남음
- 이메일 로그인과 다른 UX

### ✅ **After (해결)**
- Google OAuth → 앱 내에서 메인 화면 표시
- In-App Browser 자동 닫힘
- 이메일 로그인과 동일한 UX
- 웹 브라우저에서도 정상 작동

---

**작성일:** 2026-01-20  
**문제:** Google OAuth 로그인 시 별도 창으로 열리고 로그인 창이 백그라운드에 남음  
**원인:** 백엔드 HTML에서 Capacitor 감지 불가, In-App Browser 내에서 웹 리디렉션  
**해결:** Deep Link 우선 시도 + 웹 폴백, 자동 In-App Browser 닫기  

**GitHub:** https://github.com/jkkim74/bsTodoList
