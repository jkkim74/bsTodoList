# 🔧 Google OAuth Redirect URI Mismatch 해결 가이드

## 📋 오류 내용

```
400 오류: redirect_uri_mismatch
액세스 차단됨: 이 앱의 요청이 잘못되었습니다
```

**원인:** Google OAuth에 등록된 Redirect URI와 실제 요청한 Redirect URI가 일치하지 않음

---

## 🔍 문제 분석

### 백엔드 코드 (src/routes/auth.ts:38)

```typescript
const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`
```

이 코드는 **요청이 들어온 origin**을 기반으로 Redirect URI를 동적으로 생성합니다.

### 발생 가능한 Redirect URI

#### 1️⃣ 웹 (Cloudflare Pages)
```
https://webapp-tvo.pages.dev/api/auth/google/callback
```

#### 2️⃣ 하이브리드 앱 (Capacitor)
```
capacitor://localhost/api/auth/google/callback
http://localhost/api/auth/google/callback
https://localhost/api/auth/google/callback
```

#### 3️⃣ 로컬 개발 환경
```
http://localhost:8788/api/auth/google/callback
```

---

## ✅ 해결 방법

### 1️⃣ Google Cloud Console 설정

#### 단계별 가이드

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/

2. **프로젝트 선택**
   - 현재 사용 중인 프로젝트 선택

3. **APIs & Services > Credentials**
   - 왼쪽 메뉴에서 **Credentials** 클릭

4. **OAuth 2.0 Client IDs** 섹션
   - 현재 사용 중인 Client ID 클릭

5. **Authorized redirect URIs**
   - 다음 URI들을 **모두** 추가:

```
https://webapp-tvo.pages.dev/api/auth/google/callback
http://localhost/api/auth/google/callback
capacitor://localhost/api/auth/google/callback
https://localhost/api/auth/google/callback
http://localhost:8788/api/auth/google/callback
```

6. **Save** 클릭

#### 스크린샷 예시

```
Authorized redirect URIs
┌────────────────────────────────────────────────────────────────┐
│ URIs                                                            │
├────────────────────────────────────────────────────────────────┤
│ 1. https://webapp-tvo.pages.dev/api/auth/google/callback      │
│ 2. http://localhost/api/auth/google/callback                  │
│ 3. capacitor://localhost/api/auth/google/callback             │
│ 4. https://localhost/api/auth/google/callback                 │
│ 5. http://localhost:8788/api/auth/google/callback             │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔍 현재 Redirect URI 확인 방법

### Chrome DevTools에서 확인

1. **Android Studio**에서 앱 실행
2. **Chrome** 브라우저에서 `chrome://inspect` 접속
3. **Inspect** 클릭
4. **Console** 탭에서 다음 실행:

```javascript
// 1️⃣ 현재 origin 확인
console.log('Current Origin:', window.location.origin)

// 2️⃣ API 요청하여 authUrl 확인
axios.get('/api/auth/google/authorize')
  .then(res => {
    const authUrl = res.data.data.authUrl
    console.log('Auth URL:', authUrl)
    
    // URL 파싱하여 redirect_uri 추출
    const url = new URL(authUrl)
    const redirectUri = url.searchParams.get('redirect_uri')
    console.log('Redirect URI:', redirectUri)
    
    // 이 Redirect URI를 Google Cloud Console에 추가하세요!
    console.log('✅ Add this to Google Cloud Console:')
    console.log(redirectUri)
  })
  .catch(err => {
    console.error('❌ Error:', err.response?.data || err.message)
  })
```

### 예상 출력

```javascript
Current Origin: capacitor://localhost
Auth URL: https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=capacitor%3A%2F%2Flocalhost%2Fapi%2Fauth%2Fgoogle%2Fcallback&...
Redirect URI: capacitor://localhost/api/auth/google/callback
✅ Add this to Google Cloud Console:
capacitor://localhost/api/auth/google/callback
```

---

## 🎯 체크리스트

### ✅ Google Cloud Console 설정

- [ ] Google Cloud Console 접속
- [ ] APIs & Services > Credentials 이동
- [ ] OAuth 2.0 Client ID 선택
- [ ] Authorized redirect URIs에 다음 추가:
  - [ ] `https://webapp-tvo.pages.dev/api/auth/google/callback`
  - [ ] `http://localhost/api/auth/google/callback`
  - [ ] `capacitor://localhost/api/auth/google/callback`
  - [ ] `https://localhost/api/auth/google/callback`
  - [ ] `http://localhost:8788/api/auth/google/callback`
- [ ] Save 클릭

### ✅ 테스트

- [ ] 앱 재시작 (Android Studio에서 Stop 후 Run)
- [ ] Google 로그인 클릭
- [ ] 로그인 화면 정상 표시 확인
- [ ] 로그인 후 앱으로 복귀 확인

---

## 🚨 주의사항

### 1️⃣ 설정 반영 시간

Google Cloud Console에서 설정 변경 후 **최대 5분**까지 소요될 수 있습니다.

### 2️⃣ 캐시 클리어

설정 후에도 오류가 발생하면:

```javascript
// Chrome DevTools Console에서 실행
sessionStorage.clear()
localStorage.clear()
location.reload()
```

### 3️⃣ 앱 재시작

Android Studio에서:
1. **Stop** 버튼 클릭
2. **Run** 버튼 클릭

---

## 🧪 테스트 시나리오

### 시나리오 1: 웹 브라우저 (Chrome)

**URL:** https://webapp-tvo.pages.dev

**예상 Redirect URI:**
```
https://webapp-tvo.pages.dev/api/auth/google/callback
```

**결과:**
- ✅ Google 로그인 페이지 표시
- ✅ 로그인 후 웹 앱으로 리디렉션

### 시나리오 2: 하이브리드 앱 (Android)

**Origin:** `capacitor://localhost`

**예상 Redirect URI:**
```
capacitor://localhost/api/auth/google/callback
```

**결과:**
- ✅ In-App Browser 열림
- ✅ Google 로그인 페이지 표시
- ✅ 로그인 후 앱으로 복귀
- ✅ In-App Browser 자동 닫힘

---

## 📊 디버깅 로그

### ✅ 정상 시나리오

```javascript
[Google Login] Opening OAuth in in-app browser
[Google Login] Auth URL: https://accounts.google.com/o/oauth2/v2/auth?...
[Google Login] Redirect URI: capacitor://localhost/api/auth/google/callback
[Google Login] In-app browser opened successfully
```

### ❌ 오류 시나리오 (Redirect URI Mismatch)

```
400 오류: redirect_uri_mismatch
액세스 차단됨: 이 앱의 요청이 잘못되었습니다
```

**해결:**
1. Chrome DevTools에서 실제 Redirect URI 확인
2. Google Cloud Console에 해당 URI 추가
3. 앱 재시작

---

## 🔧 대체 해결 방법 (고급)

만약 Capacitor의 origin이 계속 변경되어 문제가 발생하면, **고정 Redirect URI**를 사용할 수 있습니다.

### 백엔드 수정 (src/routes/auth.ts)

```typescript
auth.get('/google/authorize', async (c) => {
  try {
    const clientId = c.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      return errorResponse(c, 'Google Client ID not configured', 500)
    }

    const state = generateState()
    
    // 🔥 고정 Redirect URI 사용 (모든 요청에 대해 동일)
    const redirectUri = 'https://webapp-tvo.pages.dev/api/auth/google/callback'
    const authUrl = generateGoogleOAuthUrl(clientId, redirectUri, state)

    return successResponse(c, {
      authUrl,
      state
    }, 'Google authorization URL generated')
  } catch (error) {
    console.error('Google authorize error:', error)
    return errorResponse(c, '구글 로그인 준비 중 오류가 발생했습니다.', 500)
  }
})
```

**장점:**
- 하나의 Redirect URI만 등록하면 됨
- 모든 플랫폼(웹, 앱)에서 동일한 URI 사용

**단점:**
- 로컬 개발 환경에서는 사용 불가
- 프로덕션 전용

---

## 📚 관련 문서

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [GOOGLE_LOGIN_ERROR_DEBUG.md](./GOOGLE_LOGIN_ERROR_DEBUG.md)

---

## 🔗 GitHub Repository

https://github.com/jkkim74/bsTodoList

---

## 📅 작성일

2025-01-20

---

## ✅ 다음 단계

1. **Chrome DevTools**에서 실제 Redirect URI 확인
2. **Google Cloud Console**에 해당 URI 추가
3. **앱 재시작** 후 테스트
4. **결과 공유**

**Chrome DevTools Console에서 확인한 Redirect URI를 알려주시면, 정확한 URI를 추가할 수 있도록 도와드리겠습니다!** 🚀
