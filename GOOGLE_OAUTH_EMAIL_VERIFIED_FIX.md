# Google OAuth 이메일 인증 문제 해결

## 🔍 문제 상황

Google OAuth로 로그인 시도 시 다음과 같은 오류 메시지가 표시됨:
```
이메일 인증이 필요합니다. 이메일을 확인해주세요.
```

## 📊 문제 분석

### 원인 파악

**파일**: `src/routes/auth.ts`

1. **일반 로그인 검증 로직** (392-394번 라인)
   ```typescript
   // Check if email is verified
   if (!user.email_verified) {
     return errorResponse(c, '이메일 인증이 필요합니다. 이메일을 확인해주세요.', 403)
   }
   ```
   - 모든 로그인 시도 시 `email_verified` 필드를 체크
   - `email_verified = 0`이면 로그인 거부

2. **Google OAuth 신규 사용자 생성** (219-235번 라인) ✅ 정상
   ```typescript
   INSERT INTO users (
     email, password, username, is_active, email_verified,
     oauth_provider, oauth_id, oauth_email, profile_picture, provider_connected_at
   ) VALUES (?, ?, ?, 1, 1, ?, ?, ?, ?, ?)
   ```
   - 신규 Google OAuth 사용자는 `email_verified = 1`로 생성됨
   - **정상 작동**

3. **기존 사용자에 Google OAuth 연결** (212-216번 라인) ❌ 문제 발견
   ```typescript
   // 수정 전 (문제 코드)
   await c.env.DB.prepare(
     'UPDATE users SET oauth_provider = ?, oauth_id = ?, oauth_email = ?, profile_picture = ?, provider_connected_at = ? WHERE user_id = ?'
   ).bind('google', userInfo.sub, userInfo.email, userInfo.picture, getCurrentDateTime(), existingUser.user_id).run()
   ```
   - OAuth 연결 시 `email_verified` 필드가 업데이트되지 않음
   - 기존에 `email_verified = 0`이던 사용자는 계속 `0`으로 유지됨
   - **이게 문제의 핵심!**

### 시나리오

1. 사용자가 일반 회원가입으로 계정 생성 (`email_verified = 0`)
2. 이메일 인증을 완료하지 않음
3. 나중에 Google OAuth로 로그인 시도
4. 기존 이메일과 매칭되어 OAuth 연결됨
5. 하지만 `email_verified`는 여전히 `0`
6. 로그인 시 "이메일 인증 필요" 오류 발생

## ✅ 해결 방법

### 1. 코드 수정

**파일**: `src/routes/auth.ts` (2곳 수정)

```typescript
// 수정 후
await c.env.DB.prepare(
  'UPDATE users SET oauth_provider = ?, oauth_id = ?, oauth_email = ?, profile_picture = ?, provider_connected_at = ?, email_verified = 1 WHERE user_id = ?'
).bind('google', userInfo.sub, userInfo.email, userInfo.picture, getCurrentDateTime(), existingUser.user_id).run()
```

**변경 내용**:
- `email_verified = 1` 추가
- Google OAuth 연결 시 자동으로 이메일 인증 완료 처리
- Google은 자체적으로 이메일 인증을 하므로, OAuth 연결 시 신뢰 가능

### 2. 데이터베이스 마이그레이션

**파일**: `migrations/0005_fix_oauth_email_verified.sql`

```sql
-- Fix email_verified for existing OAuth users
UPDATE users 
SET email_verified = 1 
WHERE oauth_provider = 'google' 
  AND oauth_id IS NOT NULL 
  AND email_verified = 0;

-- For safety, also ensure all OAuth users have email_verified = 1
UPDATE users 
SET email_verified = 1 
WHERE oauth_provider IS NOT NULL 
  AND oauth_id IS NOT NULL 
  AND email_verified = 0;
```

**목적**:
- 기존 데이터베이스의 OAuth 사용자들 수정
- 이미 OAuth가 연결되었지만 `email_verified = 0`인 사용자들을 일괄 업데이트

## 🚀 배포 절차

### 로컬 개발 환경

```bash
# 1. 마이그레이션 실행 (로컬)
wrangler d1 execute webapp-production --local --file=./migrations/0005_fix_oauth_email_verified.sql

# 2. 변경사항 확인
wrangler d1 execute webapp-production --local --command="SELECT user_id, email, oauth_provider, email_verified FROM users WHERE oauth_provider IS NOT NULL"
```

### 프로덕션 환경

```bash
# 1. 마이그레이션 실행 (프로덕션)
wrangler d1 execute webapp-production --remote --file=./migrations/0005_fix_oauth_email_verified.sql

# 2. 변경사항 확인
wrangler d1 execute webapp-production --remote --command="SELECT user_id, email, oauth_provider, email_verified FROM users WHERE oauth_provider IS NOT NULL LIMIT 10"

# 3. 배포
npm run deploy
```

## 🧪 테스트 방법

### 1. 신규 Google OAuth 사용자
```bash
# 테스트: Google OAuth로 신규 가입
# 예상 결과: email_verified = 1로 생성됨
```

### 2. 기존 사용자 OAuth 연결
```bash
# 테스트 시나리오:
# 1. 일반 회원가입으로 계정 생성 (이메일 인증 안 함)
# 2. Google OAuth로 로그인
# 예상 결과: OAuth 연결되면서 email_verified = 1로 업데이트
```

### 3. 로그인 테스트
```bash
# 테스트: 이메일/비밀번호 로그인
# OAuth 연결된 사용자도 일반 로그인 가능
# 예상 결과: 정상 로그인 (email_verified = 1이므로)
```

## 📋 검증 체크리스트

- [x] 코드 수정: OAuth 연결 시 `email_verified = 1` 업데이트
- [x] 마이그레이션 스크립트 작성
- [x] 커밋 및 푸시 완료
- [x] 로컬 환경에서 마이그레이션 실행 ✅ 모든 마이그레이션 성공
- [ ] 로컬 환경에서 테스트
- [ ] 프로덕션 마이그레이션 실행 (API 토큰 필요)
- [ ] 프로덕션 배포
- [ ] 프로덕션 환경에서 테스트

## 💡 추가 개선 사항

### 1. OAuth 사용자는 비밀번호 불필요
현재 OAuth 사용자도 비밀번호로 로그인 가능하지만, 실제로는 빈 비밀번호('')가 저장됨.

**개선 방안**:
```typescript
// 로그인 시 OAuth 사용자 체크
if (user.oauth_provider && !user.password) {
  return errorResponse(c, 'Google 계정으로 로그인해주세요.', 400)
}
```

### 2. 프로필 사진 표시
OAuth 사용자는 `profile_picture` 필드에 Google 프로필 이미지 URL이 저장됨.

**개선 방안**:
- 프론트엔드에서 프로필 사진 표시
- AuthResponse에 profile_picture 추가

### 3. OAuth 연결 해제 기능
사용자가 Google OAuth 연결을 해제할 수 있는 기능 추가.

**필요한 엔드포인트**:
```typescript
POST /api/auth/disconnect-oauth
```

## 📝 관련 파일

- `src/routes/auth.ts` - 인증 로직 (수정됨)
- `migrations/0005_fix_oauth_email_verified.sql` - 마이그레이션 스크립트 (신규)
- `src/utils/google-oauth.ts` - Google OAuth 유틸리티
- `migrations/0003_email_verification.sql` - email_verified 컬럼 추가
- `migrations/0004_add_oauth.sql` - OAuth 컬럼 추가

## 🎯 결론

**문제**: 기존 사용자가 Google OAuth를 연결할 때 `email_verified`가 업데이트되지 않아 로그인 실패

**해결**: OAuth 연결 시 `email_verified = 1`로 업데이트하도록 코드 수정

**효과**: 
- Google OAuth 사용자는 항상 이메일 인증 완료 상태
- "이메일 인증 필요" 오류 해결
- 기존 데이터도 마이그레이션으로 수정 가능

---

**커밋**: `108cc3b` - fix: Update email_verified when linking existing account to Google OAuth
**푸시 완료**: ✅ origin/main
