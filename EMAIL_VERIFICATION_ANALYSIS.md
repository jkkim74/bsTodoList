# 이메일 인증 회원가입 기능 분석 보고서

## 📋 현재 상태

현재 시스템에는 **두 가지 회원가입 방식**이 구현되어 있습니다:

1. ✅ **Google OAuth 회원가입** - 정상 작동
2. ⚠️ **이메일 인증 회원가입** - **부분적으로 구현되었으나 완전히 작동하지 않음**

---

## 🔍 이메일 인증 회원가입 흐름 분석

### 설계된 흐름 (2단계)

```
[Step 1: 인증 코드 요청]
사용자 입력 (이메일, 비밀번호, 이름)
    ↓
POST /api/auth/signup/request-verification
    ↓
인증 코드 생성 (6자리)
    ↓
❌ 이메일 발송 (미구현)
    ↓
인증 코드 반환 (테스트용)

[Step 2: 인증 코드 검증 및 회원가입]
사용자가 인증 코드 입력
    ↓
POST /api/auth/signup
    ↓
❌ 인증 코드 검증 (미구현)
    ↓
사용자 생성 (email_verified = 1)
    ↓
로그인 완료
```

---

## ❌ 발견된 문제점

### 1. 인증 코드 저장 미구현

**파일**: `src/routes/auth.ts` (Line 372-383)

```typescript
// ❌ 문제: 인증 코드를 생성했지만 데이터베이스에 저장하지 않음
auth.post('/signup/request-verification', async (c) => {
  // ...
  // Generate verification code
  const verificationCode = generateVerificationCode()
  const expiresAt = getVerificationCodeExpiry()

  // In production, send email here
  console.log(`[TEST] Verification code for ${email}: ${verificationCode}`)

  // ❌ 데이터베이스에 저장하지 않음!
  // 필요한 코드:
  // await c.env.DB.prepare(
  //   'UPDATE users SET email_verification_code = ?, email_verification_expires_at = ? WHERE email = ?'
  // ).bind(verificationCode, expiresAt, email).run()

  return successResponse(c, {
    email,
    message: '인증 코드가 발송되었습니다. (테스트용: 콘솔 확인)',
    verificationCode  // ⚠️ 테스트용으로 코드를 반환 (보안 위험)
  }, '인증 코드가 발송되었습니다.')
})
```

**문제점**:
- 인증 코드를 생성했지만 DB에 저장하지 않음
- 따라서 Step 2에서 검증할 방법이 없음

### 2. 인증 코드 검증 미구현

**파일**: `src/routes/auth.ts` (Line 393-432)

```typescript
auth.post('/signup', async (c) => {
  try {
    const body = await c.req.json<SignupRequest & { verification_code: string }>()
    const { email, password, password_confirm, username, verification_code } = body

    // ... 유효성 검사 ...

    // ❌ 인증 코드 검증 로직이 완전히 누락됨!
    // Step 1에서 저장하지도 않았고, 여기서 확인하지도 않음

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Insert new user
    // ⚠️ 인증 코드 검증 없이 바로 사용자 생성
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password, username, is_active, email_verified) VALUES (?, ?, ?, 1, 1)'
    ).bind(email, hashedPassword, username).run()
    
    // ... JWT 발급 및 로그인 ...
  }
})
```

**문제점**:
- `verification_code` 파라미터를 받지만 실제로 검증하지 않음
- 인증 코드 없이도 회원가입이 완료됨
- **보안 문제**: 인증 코드를 입력하지 않아도 회원가입 가능

### 3. 임시 데이터 저장소 부재

**데이터베이스 스키마**: `migrations/0003_email_verification.sql`

```sql
-- users 테이블에 컬럼은 추가되어 있음
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verification_code TEXT;
ALTER TABLE users ADD COLUMN email_verification_expires_at DATETIME;
```

**문제점**:
- 컬럼은 있지만 사용하지 않음
- Step 1에서 아직 `users` 테이블에 레코드가 없는 상태
- **Catch-22 상황**: 사용자가 생성되기 전에 인증 코드를 저장할 곳이 없음

### 4. 이메일 발송 미구현

**파일**: `src/routes/auth.ts` (Line 376-377)

```typescript
// In production, send email here
console.log(`[TEST] Verification code for ${email}: ${verificationCode}`)
```

**문제점**:
- 실제 이메일 발송 기능이 없음
- 콘솔에만 출력됨 (프로덕션에서 사용 불가)
- 테스트용으로 응답에 인증 코드를 포함 (보안 위험)

---

## 📊 현재 동작 방식

### 실제로 일어나는 일

```typescript
// Step 1: 인증 코드 요청
POST /api/auth/signup/request-verification
↓
인증 코드 생성: "123456"
↓
❌ DB 저장 안 함
↓
✅ 응답으로 코드 반환 (테스트용)
{
  email: "user@example.com",
  verificationCode: "123456"  // ⚠️ 보안 위험
}

// Step 2: 회원가입
POST /api/auth/signup
Body: {
  email: "user@example.com",
  password: "password123",
  username: "User",
  verification_code: "123456"  // ← 이 값을 받지만
}
↓
❌ verification_code 검증 안 함
↓
✅ 바로 사용자 생성 (email_verified = 1)
↓
✅ 로그인 완료
```

**결과**: 인증 코드를 아무거나 입력하거나 입력하지 않아도 회원가입이 됨

---

## 🛠️ 수정이 필요한 부분

### 방법 1: 임시 저장소 사용 (권장)

별도의 `email_verifications` 테이블 생성:

```sql
CREATE TABLE IF NOT EXISTS email_verifications (
    verification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(code);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
```

**장점**:
- 사용자가 생성되기 전에 인증 코드 저장 가능
- 여러 번 인증 시도 추적 가능
- 인증 완료 후 정리 가능

### 방법 2: 세션/캐시 사용

Cloudflare Workers KV 또는 D1 임시 테이블 사용:

```typescript
// KV 사용 예시
await c.env.EMAIL_VERIFICATION_KV.put(
  `verify:${email}`,
  JSON.stringify({ code: verificationCode, expiresAt }),
  { expirationTtl: 600 } // 10분
)
```

### 방법 3: 간단한 구현 (임시 해결책)

프론트엔드에 코드를 저장하고 백엔드에서 검증:

```typescript
// ⚠️ 이 방법은 보안에 취약함 (권장하지 않음)
// 테스트 환경에서만 사용

// Step 1: 클라이언트에 코드 반환
return successResponse(c, {
  email,
  verificationCode  // 프론트엔드에서 저장
})

// Step 2: 간단한 검증 (해시 비교)
const expectedHash = await hashVerificationCode(email, timestamp)
if (verification_code !== expectedHash) {
  return errorResponse(c, '인증 코드가 올바르지 않습니다.', 400)
}
```

---

## ✅ 올바른 구현 예시

### Step 1: 인증 코드 저장

```typescript
auth.post('/signup/request-verification', async (c) => {
  try {
    const body = await c.req.json<{ email: string }>()
    const { email } = body

    // 유효성 검사...

    // Generate verification code
    const verificationCode = generateVerificationCode()
    const expiresAt = getVerificationCodeExpiry()

    // ✅ 임시 테이블에 저장
    await c.env.DB.prepare(`
      INSERT INTO email_verifications (email, code, expires_at, verified)
      VALUES (?, ?, ?, 0)
      ON CONFLICT(email) DO UPDATE SET
        code = excluded.code,
        expires_at = excluded.expires_at,
        verified = 0,
        created_at = CURRENT_TIMESTAMP
    `).bind(email, verificationCode, expiresAt).run()

    // ✅ 이메일 발송 (Cloudflare Email Workers 사용)
    await sendVerificationEmail(email, verificationCode)

    return successResponse(c, {
      email,
      message: '인증 코드가 발송되었습니다.'
      // ❌ 코드를 반환하지 않음 (보안)
    }, '인증 코드가 발송되었습니다.')
  } catch (error) {
    console.error('Request verification error:', error)
    return errorResponse(c, '요청 처리 중 오류가 발생했습니다.', 500)
  }
})
```

### Step 2: 인증 코드 검증

```typescript
auth.post('/signup', async (c) => {
  try {
    const body = await c.req.json<SignupRequest & { verification_code: string }>()
    const { email, password, password_confirm, username, verification_code } = body

    // 유효성 검사...

    // ✅ 인증 코드 검증
    const verification = await c.env.DB.prepare(
      'SELECT * FROM email_verifications WHERE email = ? AND code = ? AND verified = 0'
    ).bind(email, verification_code).first()

    if (!verification) {
      return errorResponse(c, '인증 코드가 올바르지 않습니다.', 400)
    }

    // ✅ 만료 시간 확인
    const now = new Date()
    const expiresAt = new Date(verification.expires_at as string)
    if (now > expiresAt) {
      return errorResponse(c, '인증 코드가 만료되었습니다. 다시 요청해주세요.', 400)
    }

    // ✅ 인증 완료 표시
    await c.env.DB.prepare(
      'UPDATE email_verifications SET verified = 1 WHERE email = ?'
    ).bind(email).run()

    // Hash password
    const hashedPassword = await hashPassword(password)

    // ✅ 사용자 생성 (email_verified = 1)
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password, username, is_active, email_verified) VALUES (?, ?, ?, 1, 1)'
    ).bind(email, hashedPassword, username).run()

    const userId = result.meta.last_row_id as number

    // Generate JWT
    const token = await signJWT({ userId, email })

    const response: AuthResponse = {
      user_id: userId,
      email,
      username,
      token
    }

    return successResponse(c, response, '회원가입이 완료되었습니다.', 201)
  } catch (error) {
    console.error('Signup error:', error)
    return errorResponse(c, '회원가입 중 오류가 발생했습니다.', 500)
  }
})
```

---

## 🔒 보안 고려사항

### 현재 보안 문제

1. **인증 코드 노출**: 응답에 인증 코드를 포함하여 반환
2. **검증 없음**: 인증 코드를 확인하지 않고 회원가입 허용
3. **재사용 방지 없음**: 같은 코드를 여러 번 사용 가능
4. **만료 시간 미확인**: 오래된 코드도 사용 가능

### 개선 방안

1. ✅ 인증 코드를 DB에 안전하게 저장
2. ✅ 이메일로만 코드 전송 (응답에 포함 안 함)
3. ✅ 사용된 코드는 `verified = 1`로 표시
4. ✅ 만료 시간 검증
5. ✅ 시도 횟수 제한 (예: 5회)
6. ✅ Rate limiting (이메일당 1분에 1회 요청)

---

## 📝 프론트엔드 동작 분석

**파일**: `public/static/app.js`

### 현재 동작

```javascript
// Step 1: 인증 코드 요청
async function handleSignupStep1() {
  // ... 입력 검증 ...
  
  // ✅ 백엔드 호출
  const response = await axios.post(`${API_BASE}/auth/signup/request-verification`, { email })
  
  // ⚠️ 응답에서 인증 코드를 받음 (테스트용)
  // response.data.data.verificationCode
  
  // ✅ Step 2로 이동
  signupStep = 2
  updateAuthFormUI()
}

// Step 2: 회원가입
async function handleSignupStep2() {
  const verificationCode = document.getElementById('verification_code').value
  
  // ✅ 입력한 인증 코드 전송
  const response = await axios.post(`${API_BASE}/auth/signup`, {
    email: window.signupFormData.email,
    password: window.signupFormData.password,
    password_confirm: window.signupFormData.passwordConfirm,
    username: window.signupFormData.username,
    verification_code: verificationCode
  })
  
  // ✅ 로그인 처리
  const { data } = response.data
  saveAuthState(data, data.token)
  renderApp()
}
```

**프론트엔드는 정상 작동**하고 있으나, 백엔드가 코드를 검증하지 않음.

---

## 🎯 결론 및 권장사항

### 현재 상태

| 기능 | 상태 | 비고 |
|------|------|------|
| Google OAuth | ✅ 정상 | 완전히 작동 |
| 이메일 인증 UI | ✅ 정상 | 프론트엔드 구현 완료 |
| 인증 코드 생성 | ⚠️ 부분 | 생성은 되지만 저장 안 함 |
| 인증 코드 저장 | ❌ 미구현 | DB에 저장하지 않음 |
| 인증 코드 검증 | ❌ 미구현 | 검증 로직 없음 |
| 이메일 발송 | ❌ 미구현 | 콘솔 출력만 |
| 회원가입 | ⚠️ 불완전 | 인증 없이 가능 |

### 권장사항

#### 옵션 1: 완전한 이메일 인증 구현 (권장)
- `email_verifications` 테이블 생성
- 인증 코드 저장 및 검증 로직 구현
- 이메일 발송 기능 추가 (Cloudflare Email Workers)
- 만료 시간 및 재시도 제한 구현

#### 옵션 2: 이메일 인증 제거
- Google OAuth만 사용
- 이메일/비밀번호 회원가입 UI 제거
- 코드 간소화

#### 옵션 3: 간단한 회원가입 (인증 없음)
- 2단계 프로세스 제거
- 일반적인 1단계 회원가입으로 변경
- `email_verified = 0`으로 생성
- 나중에 이메일 인증 링크 발송

---

**어떤 방향으로 수정하시겠습니까?**

1. 완전한 이메일 인증 구현
2. 이메일 인증 제거 (Google OAuth만)
3. 간단한 회원가입으로 변경

선택하시면 해당 방향으로 코드를 수정해드리겠습니다.
