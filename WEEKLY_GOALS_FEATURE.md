# 주간 목표 기능 구현 완료 🎉

## 📅 구현 날짜
2025-12-22

---

## ✨ 주요 기능

### 1️⃣ Mini 헤더 (접을 수 있는 요약)
```
┌─────────────────────────────────────────┐
│ 🎯 이번 주 목표                          │
│ ████████░░ 80% • 2/3 완료               │
│ [펼치기 ▼]                              │
└─────────────────────────────────────────┘
```

**특징**:
- 페이지 최상단 배치 (날짜 헤더 바로 아래)
- 평균 진행률과 완료 개수 표시
- 클릭으로 펼치기/접기
- LocalStorage로 상태 저장

---

### 2️⃣ 상세 섹션 (펼쳤을 때)
```
┌─────────────────────────────────────────┐
│ 🎯 이번 주 목표 (12/16 ~ 12/22) [접기 ▲]│
│                                         │
│ 1️⃣ [████████░░] 80%                    │
│    프로젝트 A 완료하기                   │
│    목표일: 2025-12-20                   │
│    [진행률 업데이트] [삭제]              │
│                                         │
│ 2️⃣ [████░░░░░░] 40%                    │
│    운동 5회 하기                        │
│    [진행률 업데이트] [삭제]              │
│                                         │
│ 3️⃣ [░░░░░░░░░░] 0%                     │
│    독서 3권 완료                        │
│    [진행률 업데이트] [삭제]              │
│                                         │
│ [+ 새 주간 목표 추가]                    │
└─────────────────────────────────────────┘
```

**기능**:
- 최대 3개 목표 설정
- 진행률 시각화 (프로그레스 바)
- 우선순위 표시 (1️⃣ 2️⃣ 3️⃣)
- 상태 뱃지 (진행중/완료/취소)
- 목표일 표시 (선택사항)

---

### 3️⃣ 목표 추가 모달
```
┌─────────────────────────────┐
│ 새 주간 목표 추가             │
├─────────────────────────────┤
│ 우선순위: 1번째 목표          │
│                             │
│ 목표 제목 *                  │
│ ┌─────────────────────────┐ │
│ │ 프로젝트 완료하기        │ │
│ └─────────────────────────┘ │
│                             │
│ 목표일 (선택)                │
│ ┌─────────────────────────┐ │
│ │ 2025-12-20              │ │
│ └─────────────────────────┘ │
│                             │
│ [취소] [추가]                │
└─────────────────────────────┘
```

---

### 4️⃣ 진행률 업데이트 모달
```
┌─────────────────────────────┐
│ 진행률 업데이트               │
├─────────────────────────────┤
│ 진행률: 60%                  │
│ ╸━━━━━━━━━━━━━━━━━━━━━━╺   │
│ 0%       50%        100%    │
│                             │
│ ┌─────────────────────────┐ │
│ │ ██████░░░░░░░░░░░░░░    │ │
│ └─────────────────────────┘ │
│                             │
│ ℹ️ 100% 달성 시 자동 완료   │
│                             │
│ [취소] [저장]                │
└─────────────────────────────┘
```

**특징**:
- 슬라이더로 0-100% 조정 (5% 단위)
- 실시간 프리뷰
- 100% 달성 시 자동 '완료' 상태 전환

---

## 🎯 API 엔드포인트

### 백엔드 라우트: `/api/weekly-goals`

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/` | 주간 목표 생성 |
| GET | `/current` | 현재 주 목표 조회 |
| PATCH | `/:goalId/progress` | 진행률 업데이트 |
| DELETE | `/:goalId` | 목표 삭제 |

---

## 📊 데이터베이스 스키마

```sql
CREATE TABLE weekly_goals (
  goal_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  goal_order INTEGER NOT NULL CHECK (goal_order BETWEEN 1 AND 3),
  title TEXT NOT NULL,
  progress_rate INTEGER NOT NULL DEFAULT 0 CHECK (progress_rate BETWEEN 0 AND 100),
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

---

## 🚀 사용 방법

### **1. 로컬 테스트**
```bash
cd D:/workspace/bsTodoList
npm run build
npx wrangler pages dev dist --d1=webapp-production --local --port 3000

# 브라우저: http://localhost:3000
# 로그인: test@example.com / password123
```

### **2. 주간 목표 추가**
1. "이번 주 목표" Mini 헤더 클릭 → 펼치기
2. "새 주간 목표 추가" 버튼 클릭
3. 목표 제목 입력 (필수)
4. 목표일 선택 (선택사항)
5. "추가" 버튼 클릭

### **3. 진행률 업데이트**
1. 목표 카드에서 "진행률 업데이트" 버튼 클릭
2. 슬라이더로 진행률 조정 (0-100%)
3. "저장" 버튼 클릭
4. 100% 달성 시 자동으로 "완료" 상태로 전환

### **4. 목표 삭제**
1. 목표 카드에서 휴지통 아이콘 클릭
2. 확인 메시지에서 "확인" 클릭

---

## 🎨 UI/UX 특징

### **배치 전략**
- **위치**: 페이지 최상단 (날짜 헤더 바로 아래)
- **이유**: 
  - 주간 관점 → 일일 관점 자연스러운 흐름
  - 하루 계획 시 큰 그림 먼저 확인
  - 동기부여 극대화

### **접기/펼치기 기능**
- 기본: 첫 방문 시 펼쳐짐
- 이후: LocalStorage로 상태 유지
- Mini 헤더는 항상 표시 (진행 상황 실시간 인지)

### **진행률 시각화**
- 프로그레스 바: 파란색 그라데이션
- 텍스트 프로그레스: `████████░░` (블록 문자)
- 퍼센트 표시: `80%`

### **상태 관리**
- `IN_PROGRESS`: 파란색 뱃지
- `COMPLETED`: 초록색 뱃지
- `CANCELLED`: 회색 뱃지

---

## 🔧 기술 세부사항

### **프론트엔드**
- 접기/펼치기: `localStorage.setItem('weeklyGoalsExpanded', 'true/false')`
- 주간 계산: 월요일~일요일 자동 인식
- 실시간 업데이트: Axios API 호출 후 UI 즉시 반영

### **백엔드**
- 자동 주 계산: `Date` 객체로 현재 주 월요일~일요일 계산
- 진행률 기반 상태 전환: `progress_rate === 100` → `COMPLETED`
- 순서 제약: `goal_order` 1-3 CHECK 제약

---

## 📋 제한사항

1. **최대 3개**: 주간 목표는 최대 3개까지만 설정 가능
2. **주 단위**: 월요일~일요일 기준
3. **목표일 범위**: 현재 주 내에서만 설정 가능
4. **진행률 단위**: 5% 단위로 조정

---

## 🎯 향후 개선 가능 사항

1. **드래그 앤 드롭**: 목표 순서 변경
2. **목표 복사**: 이전 주 목표를 다음 주로 복사
3. **통계**: 주간 달성률 추이 그래프
4. **알림**: 주 초/주 말 목표 리마인더
5. **태그**: 목표 카테고리 분류
6. **서브 목표**: 메인 목표 아래 세부 목표
7. **회고 연동**: 하루 회고와 주간 목표 연결

---

## 📦 배포 방법

### **로컬 PC에서 배포**
```bash
cd D:/workspace/bsTodoList

# 1. 코드 업데이트
git pull origin main

# 2. 빌드
npm run build

# 3. 배포
npm run deploy

# 또는 수동:
npx wrangler pages deploy dist --project-name webapp
```

### **원격 DB 확인 (첫 배포 시)**
```bash
# 테이블 확인
npx wrangler d1 execute webapp-production --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='weekly_goals'"

# 스키마 확인
npx wrangler d1 execute webapp-production --remote --command="PRAGMA table_info(weekly_goals)"
```

---

## ✅ 테스트 체크리스트

- [ ] Mini 헤더 표시 확인
- [ ] 펼치기/접기 동작 확인
- [ ] 목표 추가 (1개, 2개, 3개)
- [ ] 최대 3개 제한 확인
- [ ] 진행률 업데이트 (0%, 50%, 100%)
- [ ] 100% 달성 시 자동 완료 전환 확인
- [ ] 목표 삭제 확인
- [ ] 목표일 설정 확인
- [ ] LocalStorage 상태 유지 확인
- [ ] 브라우저 새로고침 후 데이터 유지 확인

---

## 🌐 테스트 URL

**Sandbox 개발 서버**:  
https://3000-inpthy8x5rk4j3zc2m4jd-d0b9e1e2.sandbox.novita.ai

**테스트 계정**:
- Email: `test@example.com`
- Password: `password123`

---

## 📚 관련 문서

- `README.md` - 프로젝트 전체 문서
- `cloudflare-db-setup.md` - DB 설정 가이드
- `EMOTION_FIX_FINAL.md` - 감정 트래킹 수정 가이드

---

## 🎉 구현 완료!

주간 목표 기능이 성공적으로 구현되었습니다!

**주요 성과**:
- ✅ 백엔드 API 완전 구현
- ✅ 프론트엔드 UI/UX 구현
- ✅ Mini 헤더 + 상세 섹션
- ✅ CRUD 전체 기능
- ✅ 진행률 트래킹
- ✅ LocalStorage 상태 관리
- ✅ 모바일 반응형 지원

**사용자 혜택**:
- 주간 목표로 큰 그림 유지
- 일일 작업과 주간 목표 연계
- 진행 상황 실시간 확인
- 동기부여 향상
