# Production 배포 문제 해결 가이드

## 🔴 현재 상황
- **문제**: Cloudflare API 인증 실패 (Too many authentication failures - Code: 10502)
- **원인**: IP 제한 및 인증 시도 횟수 초과로 일시적 차단
- **영향**: Sandbox에서 직접 `wrangler pages deploy` 실행 불가

## ✅ 해결 방법 (로컬 PC 배포 권장)

### Option A: 로컬 PC에서 직접 배포 (가장 빠름) ⭐

#### 1단계: 최신 코드 가져오기
```bash
cd D:/workspace/bsTodoList
git pull origin main
```

#### 2단계: 빌드
```bash
npm run build
```

#### 3단계: 프로덕션 배포
```bash
# 방법 1: npm script 사용
npm run deploy

# 방법 2: 직접 wrangler 명령어 사용
npx wrangler pages deploy dist --project-name webapp-tvo
```

#### 4단계: 배포 확인
```bash
# 배포 후 출력되는 URL 확인
# 예: https://webapp-tvo.pages.dev
```

---

### Option B: GitHub에서 자동 배포 (시간 소요)

#### GitHub Actions 자동 배포가 설정되어 있다면:
1. GitHub에 푸시 완료 (✅ 이미 완료: commit `5272a12`)
2. Cloudflare Pages가 자동으로 감지하여 배포
3. 1~5분 후 https://webapp-tvo.pages.dev 에서 확인

#### 자동 배포 상태 확인:
- Cloudflare Dashboard > Pages > webapp-tvo > Deployments
- 최신 commit `5272a12`가 배포 중인지 확인

---

### Option C: Sandbox 인증 문제 해결 후 재시도

#### Cloudflare API 토큰 재설정 필요:
1. Cloudflare Dashboard 접속
2. My Profile > API Tokens
3. 기존 토큰 확인 (IP 제한 설정 확인)
4. 필요시 새 토큰 생성 (IP 제한 없이)
5. GenSpark Deploy 탭에서 새 토큰 설정

#### 그 후 다시 시도:
```bash
cd /home/user/webapp
source ~/.bashrc
npx wrangler whoami  # 인증 확인
npx wrangler pages deploy dist --project-name webapp-tvo
```

---

## 📋 현재 Git 상태

### 최신 커밋
```
5272a12 - feat: Replace alert() with custom toast notifications for better UX
07f5de5 - fix: Resolve edit modal error by adding data caching and fallback
127b06e - feat(phase1): Add task editing and due date management
b232ac8 - feat: Mobile responsive optimization
37522e6 - fix: Fix weekly goal modal UI layout and styling
```

### GitHub Status
- **Repository**: https://github.com/jkkim74/bsTodoList
- **Branch**: main
- **Latest Commit**: `5272a12` (토스트 알림 구현)
- **Status**: ✅ Pushed successfully

---

## 🎯 배포 내역 (이번 업데이트)

### 토스트 알림 시스템
- ✅ 커스텀 토스트 알림 디자인
- ✅ 21개 alert() → showToast() 변경
- ✅ 4가지 알림 타입 (success/error/warning/info)
- ✅ 모바일 반응형
- ✅ 자동 사라짐 (3초)

### 이전 업데이트 (함께 배포됨)
- ✅ 작업 수정 기능 (Phase 1)
- ✅ 마감일 관리
- ✅ 수정 모달 오류 수정
- ✅ 모바일 최적화
- ✅ 주간 목표 UI 개선

---

## 📊 배포 확인 방법

### 1. 로컬 테스트
```bash
cd D:/workspace/bsTodoList
npm run build
npx wrangler pages dev dist --d1=webapp-production --local --port 3000
# http://localhost:3000 접속
```

### 2. Sandbox 테스트 (현재 작동 중)
- **URL**: https://3000-inpthy8x5rk4j3zc2m4jd-d0b9e1e2.sandbox.novita.ai
- **로그인**: test@example.com / password123
- **상태**: ✅ 토스트 알림 적용됨

### 3. Production 테스트
```bash
# 배포 후 확인
curl -I https://webapp-tvo.pages.dev

# 브라우저에서 확인
# https://webapp-tvo.pages.dev
```

---

## 🔧 로컬 PC 배포 상세 가이드

### 사전 준비 확인
```bash
# Node.js 버전 확인 (16 이상)
node --version

# npm 버전 확인
npm --version

# wrangler 설치 확인
npx wrangler --version
```

### 전체 배포 프로세스
```bash
# 1. 디렉토리 이동
cd D:/workspace/bsTodoList

# 2. 최신 코드 가져오기
git fetch origin
git pull origin main

# 3. 의존성 확인 (필요시)
npm install

# 4. 빌드
npm run build

# 5. D1 마이그레이션 (로컬 테스트용)
npx wrangler d1 migrations apply webapp-production --local

# 6. 로컬 테스트 (선택사항)
npx wrangler pages dev dist --d1=webapp-production --local --port 3000

# 7. 프로덕션 배포
npm run deploy
# 또는
npx wrangler pages deploy dist --project-name webapp-tvo

# 8. D1 마이그레이션 (프로덕션)
npx wrangler d1 migrations apply webapp-production --remote
```

---

## ⚠️ 주의사항

### D1 Database
- 로컬 테스트는 `--local` 플래그 사용
- 프로덕션 배포 후 `--remote` 플래그로 마이그레이션 필요
- 마이그레이션 파일: `migrations/0002_add_due_date.sql`

### 환경 변수
- 로컬 개발: `.dev.vars` 파일 사용
- 프로덕션: Cloudflare Dashboard에서 설정
- JWT_SECRET 등 민감 정보 확인

### 배포 시간
- Cloudflare Pages 배포: 1~3분
- D1 마이그레이션: 수초
- GitHub 자동 배포: 3~5분

---

## 📞 추가 지원

### Cloudflare 인증 문제가 계속되면:
1. **Deploy 탭**에서 API 토큰 재설정
2. **IP 제한** 없는 토큰 생성
3. 토큰 권한 확인:
   - Account > Cloudflare Pages > Edit
   - Account > D1 > Edit

### 배포 오류 발생 시:
```bash
# 로그 확인
npx wrangler pages deployment tail

# 빌드 정리 후 재시도
rm -rf dist .wrangler
npm run build
npm run deploy
```

---

## ✅ 권장 배포 방법

**지금 당장 배포하려면**: Option A (로컬 PC 직접 배포) ⭐

**시간 여유가 있다면**: Option B (GitHub 자동 배포 대기)

**Sandbox에서 꼭 배포하려면**: Option C (API 토큰 재설정 필요)

---

## 🎯 배포 후 테스트 항목

1. ✅ 로그인 작동
2. ✅ 작업 추가/수정/삭제
3. ✅ **토스트 알림 표시** (주요 확인 사항)
4. ✅ 수정 모달 → 저장 → 모달 닫힘 → 토스트 표시
5. ✅ 마감일 설정 및 표시
6. ✅ 주간 목표 기능
7. ✅ 모바일 반응형

---

**결론**: 로컬 PC에서 `git pull origin main` → `npm run build` → `npm run deploy` 실행하시면 됩니다! 🚀
