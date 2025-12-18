# 브레인 덤핑 TO_DO_LIST

3단계 브레인 덤핑 기법을 활용한 할 일 관리 웹 애플리케이션

## 📋 프로젝트 개요

- **이름**: 브레인 덤핑 TO_DO_LIST
- **목표**: 머릿속 생각을 체계적으로 정리하고 실행 계획을 수립하는 3단계 할 일 관리 시스템
- **기술 스택**: Hono + TypeScript + Cloudflare D1 + Vanilla JavaScript

## 🌟 주요 기능

### STEP 1: 꺼내기 (Brain Dump)
- 머릿속의 모든 생각과 할 일을 판단 없이 자유롭게 기록
- 빠른 입력과 즉각적인 저장

### STEP 2: 분류하기 (Categorize)
- **긴급·중요**: 오늘 반드시 해야 할 일
- **중요**: 이번 주 내에 해야 할 일
- **나중에**: 여유 있을 때 할 일
- **내려놓기**: 의도적으로 내려놓을 일

### STEP 3: 행동하기 (Take Action)
- 오늘의 TOP 3 할 일 선정
- 구체적인 실행 계획 수립
- 시간대별 스케줄링 (오전/오후/저녁)
- 완료 체크 및 진행 상황 추적

### 추가 기능
- 일일 통계 (전체/완료/완료율)
- 날짜별 할 일 관리
- 실시간 자동 저장
- 반응형 디자인 (모바일/태블릿/데스크톱)

## 🌐 URL

- **개발 서버**: https://3000-inpthy8x5rk4j3zc2m4jd-d0b9e1e2.sandbox.novita.ai
- **API Health Check**: https://3000-inpthy8x5rk4j3zc2m4jd-d0b9e1e2.sandbox.novita.ai/api/health
- **GitHub**: (배포 후 업데이트 예정)

## 💾 데이터 아키텍처

### 데이터베이스: Cloudflare D1 (SQLite)

**주요 테이블:**
- `users`: 사용자 정보
- `daily_tasks`: 일일 할 일 (3단계 프로세스 포함)
- `daily_reviews`: 하루 회고
- `weekly_goals`: 주간 목표 (3개)
- `free_notes`: 자유 메모
- `let_go_items`: 내려놓기 항목

**저장 방식:**
- 로컬 개발: `.wrangler/state/v3/d1` (로컬 SQLite)
- 프로덕션: Cloudflare D1 (글로벌 분산 데이터베이스)

## 🔌 API 명세

### 인증 API
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인

### 할 일 관리 API
- `POST /api/tasks` - STEP 1: Brain Dump 생성
- `PATCH /api/tasks/:taskId/categorize` - STEP 2: 우선순위 분류
- `PATCH /api/tasks/:taskId/top3` - STEP 3: TOP 3 설정
- `GET /api/tasks/daily/:date` - 특정 날짜 전체 조회
- `PATCH /api/tasks/:taskId/complete` - 완료 처리
- `PUT /api/tasks/:taskId` - 할 일 수정
- `DELETE /api/tasks/:taskId` - 할 일 삭제

### 회고 API
- `POST /api/reviews` - 회고 생성/수정
- `GET /api/reviews/:date` - 특정 날짜 회고 조회

### 주간 목표 API
- `POST /api/weekly-goals` - 주간 목표 생성
- `GET /api/weekly-goals/current` - 현재 주 목표 조회
- `PATCH /api/weekly-goals/:goalId/progress` - 진행률 업데이트
- `DELETE /api/weekly-goals/:goalId` - 목표 삭제

### 내려놓기 API
- `POST /api/let-go` - 내려놓기 항목 추가
- `GET /api/let-go/:date` - 특정 날짜 조회
- `DELETE /api/let-go/:letGoId` - 항목 삭제

## 👤 테스트 계정

로그인 페이지에서 다음 계정으로 바로 테스트할 수 있습니다:

```
이메일: test@example.com
비밀번호: password123
```

## 🚀 로컬 개발 가이드

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd webapp
npm install
```

### 2. 데이터베이스 초기화
```bash
# 마이그레이션 적용
npm run db:migrate:local

# 시드 데이터 삽입
npm run db:seed
```

### 3. 개발 서버 시작
```bash
# 빌드
npm run build

# PM2로 서비스 시작
pm2 start ecosystem.config.cjs

# 또는 직접 실행
npm run dev:sandbox
```

### 4. 접속
```
http://localhost:3000
```

## 📦 배포

### Cloudflare Pages 배포

1. **D1 데이터베이스 생성**
```bash
# 프로덕션 데이터베이스 생성
npx wrangler d1 create webapp-production

# database_id를 wrangler.jsonc에 입력
```

2. **마이그레이션 적용**
```bash
# 프로덕션 DB에 마이그레이션 적용
npm run db:migrate:prod
```

3. **Cloudflare Pages 프로젝트 생성**
```bash
npx wrangler pages project create webapp --production-branch main
```

4. **배포**
```bash
npm run deploy
```

## 🗂️ 프로젝트 구조

```
webapp/
├── src/
│   ├── index.tsx           # 메인 애플리케이션 (Hono)
│   ├── types/
│   │   └── index.ts        # TypeScript 타입 정의
│   ├── routes/
│   │   ├── auth.ts         # 인증 API
│   │   ├── tasks.ts        # 할 일 API
│   │   ├── reviews.ts      # 회고 API
│   │   ├── goals.ts        # 주간 목표 API
│   │   └── letgo.ts        # 내려놓기 API
│   ├── middleware/
│   │   └── auth.ts         # JWT 인증 미들웨어
│   └── utils/
│       ├── jwt.ts          # JWT 유틸리티
│       └── response.ts     # 응답 헬퍼
├── public/
│   └── static/
│       └── app.js          # 프론트엔드 JavaScript
├── migrations/
│   └── 0001_initial_schema.sql  # DB 스키마
├── seed.sql                # 테스트 데이터
├── ecosystem.config.cjs    # PM2 설정
├── wrangler.jsonc          # Cloudflare 설정
└── package.json
```

## 🛠️ 기술 스택

### 백엔드
- **Hono**: 경량 웹 프레임워크
- **TypeScript**: 타입 안정성
- **Cloudflare D1**: 글로벌 분산 SQLite 데이터베이스
- **Cloudflare Workers**: 서버리스 실행 환경
- **JWT**: 인증 토큰

### 프론트엔드
- **Vanilla JavaScript**: 빠른 로딩과 간단한 구조
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Axios**: HTTP 클라이언트
- **Font Awesome**: 아이콘

### DevOps
- **Wrangler**: Cloudflare CLI
- **PM2**: 프로세스 관리
- **Git**: 버전 관리

## 📊 현재 완료 기능

### ✅ 완료된 기능
1. 사용자 인증 (회원가입/로그인)
2. STEP 1: Brain Dump (할 일 꺼내기)
3. STEP 2: Categorize (우선순위 분류)
4. STEP 3: Action (TOP 3 설정)
5. 할 일 완료/수정/삭제
6. 일일 통계 (전체/완료/완료율)
7. 날짜별 할 일 관리
8. 반응형 UI

### 🚧 구현 예정 기능
1. 하루 회고 UI
2. 주간 목표 관리 UI
3. 감정/에너지 레벨 추적 UI
4. 자유 메모 기능
5. PWA (Progressive Web App)
6. 다크 모드
7. 데이터 내보내기/가져오기

## 🎯 추천 다음 단계

1. **UI/UX 개선**
   - 드래그 앤 드롭으로 분류하기
   - 애니메이션 효과 추가
   - 모바일 최적화

2. **기능 확장**
   - 회고 및 주간 목표 UI 완성
   - 알림 기능 (브라우저 알림)
   - 통계 대시보드 (주간/월간)

3. **성능 최적화**
   - 오프라인 모드 지원 (Service Worker)
   - 캐싱 전략 개선
   - 이미지 최적화

## 📝 참고 사항

- **데이터 저장**: 모든 데이터는 Cloudflare D1에 저장되며, 글로벌하게 분산됩니다
- **인증**: JWT 기반으로 7일간 유효한 토큰 사용
- **보안**: 비밀번호는 SHA-256으로 해시되어 저장 (프로덕션에서는 bcrypt 권장)
- **로컬 개발**: --local 플래그로 로컬 SQLite 사용

## 📄 라이선스

MIT License

## 👨‍💻 개발자

Brain Dumping Team

---

**최종 업데이트**: 2025-12-18
