# Google OAuth 로그인 설정 가이드

## 📋 개요

이 문서는 Brain Dump 애플리케이션에 Google OAuth 로그인 기능을 설정하는 방법을 설명합니다.

## 🔧 Google Cloud Console 설정

### 1단계: Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 상단의 프로젝트 선택 박스에서 **새 프로젝트** 클릭
3. 프로젝트명: `Brain Dump` (또는 원하는 이름)
4. **생성** 클릭

### 2단계: OAuth 2.0 클라이언트 ID 생성

1. 좌측 메뉴에서 **APIs & Services** → **Credentials** 클릭
2. **+ CREATE CREDENTIALS** → **OAuth client ID** 선택
3. "Which application type are you creating OAuth credentials for?" 메시지가 나오면:
   - **Web application** 선택
   - **Create** 클릭
4. Application name: `Brain Dump Web` 입력

### 3단계: OAuth 동의화면 설정 (처음인 경우)

"You need to create a consent screen first" 메시지가 나오면:

1. **CREATE CONSENT SCREEN** 클릭
2. **External** 선택 (개인 프로젝트의 경우)
3. 다음 정보 입력:
   - **App name**: Brain Dump
   - **User support email**: 본인 이메일
   - **Developer contact information**: 본인 이메일
4. **SAVE AND CONTINUE** 클릭
5. Scopes 페이지에서 **ADD OR REMOVE SCOPES** 클릭
6. 다음 스코프 검색 및 선택:
   - `openid` (OpenID Connect)
   - `email`
   - `profile`
7. **UPDATE** → **SAVE AND CONTINUE** → **SAVE AND CREATE** 클릭

### 4단계: OAuth 클라이언트 ID 구성

1. **Credentials** 페이지로 돌아가기
2. 새로 만든 클라이언트 ID 클릭
3. **Authorized JavaScript origins** 섹션에서 **ADD URI** 클릭:
   - 로컬 개발: `http://localhost:3000`
   - 프로덕션: `https://your-domain.com` 또는 `https://webapp.pages.dev`
4. **Authorized redirect URIs**에서 **ADD URI** 클릭:
   - 로컬 개발: `http://localhost:3000/api/auth/google/callback`
   - 프로덕션: `https://your-domain.com/api/auth/google/callback`
5. **SAVE** 클릭

### 5단계: 클라이언트 ID 복사

1. 클라이언트 ID 오른쪽의 **DOWNLOAD JSON** 또는 복사 버튼 클릭
2. 다음 정보를 별도로 저장:
   - **Client ID**: `xxxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: `xxxxxxxxxxxxxx`

## 🚀 로컬 개발 설정

### 1. wrangler.jsonc 환경 변수 추가

```jsonc
{
  "env": {
    "development": {
      "vars": {
        "VITE_GOOGLE_CLIENT_ID": "your-client-id.apps.googleusercontent.com"
      },
      "env_variables": {
        "GOOGLE_CLIENT_SECRET": "your-client-secret"
      }
    },
    "production": {
      "vars": {
        "VITE_GOOGLE_CLIENT_ID": "your-production-client-id.apps.googleusercontent.com"
      },
      "env_variables": {
        "GOOGLE_CLIENT_SECRET": "your-production-client-secret"
      }
    }
  }
}
```

### 2. .env 파일 생성 (로컬 개발용)

```bash
# .env.local
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 3. 데이터베이스 마이그레이션

```bash
# 마이그레이션 파일이 자동으로 적용됨
npx wrangler d1 migrations apply webapp-production --remote
```

## 🌐 프로덕션 배포

### Cloudflare Pages에서 환경 변수 설정

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)에 접속
2. **Pages** → 프로젝트 선택
3. **Settings** → **Environment variables** 클릭
4. 다음 변수 추가:

**Production 환경:**
```
VITE_GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
```

**Preview 환경 (선택사항):**
```
VITE_GOOGLE_CLIENT_ID=your-development-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-development-client-secret
```

## 🧪 테스트

### 로컬 환경에서 테스트

```bash
npm run dev:sandbox
```

1. `http://localhost:3000` 접속
2. 로그인 페이지의 "Google로 로그인" 버튼 클릭
3. Google 계정 선택
4. 성공하면 메인 페이지로 리다이렉트

### 테스트 계정

Google 계정이면 누구나 로그인 가능합니다. 프로덕션 배포 전에 Google Cloud Console에서 테스트 사용자로 지정한 이메일 주소만 로그인할 수 있도록 제한할 수 있습니다.

## 🔒 OAuth 흐름

### Authorization Code Flow (권장)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 사용자가 "Google로 로그인" 버튼 클릭                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 프론트엔드가 Google OAuth Authorization URL로 리다이렉트 │
│    /api/auth/google/authorize 호출                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 사용자가 Google에서 로그인 및 권한 부여                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Google이 authorization code와 함께 콜백 URL로 리다이렉트 │
│    ?code=xxx&state=yyy                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. 프론트엔드가 code를 백엔드로 전송                          │
│    POST /api/auth/google/callback                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. 백엔드가 code를 access token으로 교환                     │
│    Google Token Endpoint로 server-to-server 요청             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. 백엔드가 access token으로 사용자 정보 조회                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. 사용자가 DB에 없으면 생성, 있으면 업데이트                │
│    OAuth 계정 정보 저장                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. 백엔드가 JWT 토큰 발급                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. 프론트엔드가 토큰 저장 및 메인 페이지로 리다이렉트       │
└─────────────────────────────────────────────────────────────┘
```

## 📊 데이터베이스 구조

### users 테이블 (확장)

```sql
-- OAuth 필드
oauth_provider TEXT          -- 'google', 'github' 등
oauth_id TEXT                -- Google의 고유 사용자 ID (sub)
oauth_email TEXT             -- OAuth 제공자의 이메일
profile_picture TEXT         -- 프로필 사진 URL
provider_connected_at        -- OAuth 연동 시간
```

## 🔐 보안 고려사항

### 구현된 보안 기능
- ✅ State 매개변수로 CSRF 공격 방지
- ✅ HTTPS 필수 (프로덕션)
- ✅ Client Secret은 서버에서만 사용
- ✅ Authorization Code는 server-to-server로 교환
- ✅ JWT 토큰으로 세션 관리

### 권장 사항
1. **프로덕션에서 HTTPS 사용**
2. **환경 변수로 Client Secret 관리** (소스 코드에 포함하지 말 것)
3. **State 토큰 유효기간 설정** (현재: 10분)
4. **로그 수준 제한** (프로덕션에서 개인정보 노출 방지)
5. **ID Token 서명 검증** (현재: 개발용 간편 모드)

## 🐛 트러블슈팅

### "redirect_uri_mismatch" 오류

**해결방법:**
1. Google Cloud Console에서 Authorized redirect URIs 확인
2. 현재 URL과 정확히 일치하는지 확인
3. 프로토콜 (http/https) 확인
4. 슬래시(/) 누락 확인

### "invalid_client" 오류

**해결방법:**
1. Client ID와 Client Secret 확인
2. wrangler.jsonc에서 정확히 복사했는지 확인
3. 개발/프로덕션 환경 변수 분리 확인

### 로그인 후 메인 페이지가 로드되지 않음

**해결방법:**
1. 브라우저 콘솔에서 에러 확인
2. `localStorage`에 token이 저장되었는지 확인
3. 백엔드 로그 확인: `npx wrangler tail`

## 📚 참고 자료

- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [Google OpenID Connect](https://developers.google.com/identity/openid-connect)
- [Cloudflare Workers 환경 변수](https://developers.cloudflare.com/workers/platform/environment-variables/)
- [Google Cloud Console](https://console.cloud.google.com/)

## ✅ 체크리스트

배포 전에 다음을 확인하세요:

- [ ] Google Cloud 프로젝트 생성
- [ ] OAuth 2.0 클라이언트 ID 생성
- [ ] Authorized origins에 도메인 추가
- [ ] Authorized redirect URIs에 콜백 URL 추가
- [ ] Client ID와 Secret 복사
- [ ] wrangler.jsonc에 환경 변수 추가
- [ ] 로컬에서 테스트
- [ ] Cloudflare Pages에서 환경 변수 설정
- [ ] 프로덕션에서 테스트

