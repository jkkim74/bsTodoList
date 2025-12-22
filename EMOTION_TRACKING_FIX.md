# 오늘의 기분 선택 오류 수정 패치

## 문제 상황
**'오늘의 기분'** 선택 시 `Internal server error` 발생

### 오류 원인
1. **DB 스키마 불일치**: 
   - DB는 `TEXT` 타입(ENUM: 'VERY_GOOD', 'GOOD', 'NORMAL', 'TIRED', 'VERY_TIRED')을 기대
   - 프론트엔드는 숫자 값(1-10)을 전송

2. **undefined 값 처리 오류**:
   - `stress_level` 필드가 `undefined`로 전달
   - D1 Database는 `undefined`를 허용하지 않음 (null만 허용)

## 수정 내용

### 1. DB 스키마 변경 (`migrations/0001_initial_schema.sql`)
```sql
-- BEFORE (문제)
morning_energy TEXT CHECK (morning_energy IN ('VERY_GOOD', 'GOOD', 'NORMAL', 'TIRED', 'VERY_TIRED'))

-- AFTER (수정)
morning_energy INTEGER CHECK (morning_energy BETWEEN 1 AND 10),
current_mood TEXT,
stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
```

### 2. TypeScript 타입 정의 변경 (`src/types/index.ts`)
```typescript
// BEFORE (문제)
export type EnergyLevel = 'VERY_GOOD' | 'GOOD' | 'NORMAL' | 'TIRED' | 'VERY_TIRED'
morning_energy: EnergyLevel | null

// AFTER (수정)
morning_energy: number | null  // 1-10
stress_level: number | null    // 1-10
```

### 3. 백엔드 로직 수정 (`src/routes/reviews.ts`)
```typescript
// BEFORE (문제)
.bind(morning_energy, current_mood, stress_factors, ...)

// AFTER (수정)
.bind(
  morning_energy ?? null,     // undefined → null 변환
  current_mood ?? null,
  stress_level ?? null,       // 새로운 필드 추가
  stress_factors ?? null,
  ...
)
```

### 4. 프론트엔드 수정 (`public/static/app.js`)
```javascript
// BEFORE (문제)
await axios.post(`${API_BASE}/reviews`, {
  review_date: currentDate,
  current_mood: selectedEmotion,
  morning_energy: selectedEnergy
})

// AFTER (수정)
await axios.post(`${API_BASE}/reviews`, {
  review_date: currentDate,
  current_mood: selectedEmotion,
  morning_energy: selectedEnergy,
  stress_level: null  // 명시적으로 null 전송
})
```

## 패치 적용 방법

### 방법 1: Git Patch 적용 (권장)
```bash
# 1. 패치 파일 복사
# emotion-tracking-fix.patch 파일을 프로젝트 루트에 복사

# 2. 패치 적용
cd D:/workspace/bsTodoList
git apply emotion-tracking-fix.patch

# 3. 변경사항 확인
git diff

# 4. DB 리셋 (중요!)
npm run db:reset

# 5. 빌드 및 테스트
npm run build
npx wrangler pages dev dist --d1=webapp-production --local --port 3000
```

### 방법 2: 수동 적용
위 "수정 내용"을 참고하여 각 파일을 수동으로 수정

## 적용 후 확인 사항

### ✅ 로컬 테스트
```bash
# 1. DB 초기화
npm run db:reset

# 2. 개발 서버 시작
npm run build
npx wrangler pages dev dist --d1=webapp-production --local --port 3000

# 3. 브라우저에서 테스트
# http://localhost:3000 접속
# test@example.com / password123 로그인
# "오늘의 기분" 섹션에서:
#   - 감정 아이콘 선택
#   - 에너지 레벨 슬라이더 조정
#   - 저장 버튼 클릭
# → 에러 없이 정상 저장되는지 확인
```

### ✅ 프로덕션 배포 (Cloudflare Pages)
```bash
# 1. 코드 커밋 및 푸시
git add .
git commit -m "fix: Fix emotion tracking with proper schema"
git push origin main

# 2. D1 마이그레이션 (중요!)
npx wrangler d1 migrations apply webapp-production --remote

# 3. 배포
npm run deploy

# 4. 테스트
# https://webapp-tvo.pages.dev 접속하여 확인
```

## 주의사항

⚠️ **DB 스키마 변경이 포함되어 있으므로 반드시 마이그레이션 작업 필요**

- **로컬**: `npm run db:reset` 실행 (기존 로컬 DB 삭제 후 재생성)
- **프로덕션**: `npx wrangler d1 migrations apply webapp-production --remote` 실행

⚠️ **기존 데이터 손실 가능성**
- 로컬 DB는 `db:reset`으로 초기화되므로 기존 데이터가 삭제됩니다
- 프로덕션 DB는 마이그레이션으로 스키마만 업데이트되지만, `morning_energy` 컬럼의 데이터 타입이 변경되므로 기존 데이터가 손실될 수 있습니다

## 변경 파일 목록
- ✅ `migrations/0001_initial_schema.sql` - DB 스키마 변경
- ✅ `src/types/index.ts` - TypeScript 타입 정의 수정
- ✅ `src/routes/reviews.ts` - 백엔드 로직 수정
- ✅ `public/static/app.js` - 프론트엔드 로직 수정

## 테스트 결과
```
✅ 감정 선택 → 정상 동작
✅ 에너지 레벨 조정 → 정상 저장
✅ 데이터 조회 → morning_energy 숫자로 표시
✅ 에러 로그 없음
```

## 패치 파일 정보
- **파일명**: `emotion-tracking-fix.patch`
- **크기**: 4.6KB
- **포함된 커밋**: `fef422e - fix: Fix Phase 2 emotion/energy tracking with proper schema`
- **수정된 파일 수**: 4개
- **추가/삭제**: +52/-34 lines
