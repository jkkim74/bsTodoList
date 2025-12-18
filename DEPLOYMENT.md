# 🚀 Cloudflare Pages 배포 가이드

이 문서는 브레인 덤핑 TO_DO_LIST를 Cloudflare Pages에 배포하는 상세한 가이드입니다.

## 📋 목차
1. [사전 준비](#사전-준비)
2. [Cloudflare 계정 설정](#cloudflare-계정-설정)
3. [로컬 환경 설정](#로컬-환경-설정)
4. [D1 데이터베이스 설정](#d1-데이터베이스-설정)
5. [프로젝트 배포](#프로젝트-배포)
6. [배포 확인 및 테스트](#배포-확인-및-테스트)
7. [커스텀 도메인 설정](#커스텀-도메인-설정)
8. [문제 해결](#문제-해결)

---

## 사전 준비

### 필수 요구사항
- ✅ **Cloudflare 계정** (무료 플랜 가능)
- ✅ **Node.js 18 이상**
- ✅ **Git**
- ✅ **npm 또는 yarn**

### 확인 방법
```bash
# Node.js 버전 확인
node --version  # v18.0.0 이상

# npm 버전 확인
npm --version

# Git 버전 확인
git --version
```

---

## Cloudflare 계정 설정

### 1. Cloudflare 가입
1. https://dash.cloudflare.com/sign-up 접속
2. 이메일과 비밀번호로 가입
3. 이메일 인증 완료

### 2. API Token 생성 (선택사항)
Wrangler CLI를 사용하면 자동으로 인증되므로 이 단계는 선택사항입니다.

---

## 로컬 환경 설정

### 1. 프로젝트 클론
```bash
git clone https://github.com/jkkim74/bsTodoList.git
cd bsTodoList
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Wrangler 로그인
```bash
npx wrangler login
```
- 브라우저가 자동으로 열립니다
- Cloudflare 계정으로 로그인
- "Allow" 클릭하여 권한 부여

---

## D1 데이터베이스 설정

### 1. 프로덕션 데이터베이스 생성
```bash
npx wrangler d1 create webapp-production
```

**출력 예시:**
```
✅ Successfully created DB 'webapp-production'!

[[d1_databases]]
binding = "DB"
database_name = "webapp-production"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. wrangler.jsonc 수정
`database_id`를 복사하여 `wrangler.jsonc` 파일 수정:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "webapp",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "여기에-실제-database-id-입력"  // ← 이 부분 수정
    }
  ]
}
```

### 3. 마이그레이션 적용
```bash
# 프로덕션 데이터베이스에 테이블 생성
npx wrangler d1 migrations apply webapp-production --remote
```

### 4. 시드 데이터 삽입 (선택사항)
```bash
# 테스트 계정 생성
npx wrangler d1 execute webapp-production --remote --file=./seed.sql
```

---

## 프로젝트 배포

### 1. 프로젝트 빌드
```bash
npm run build
```

빌드가 완료되면 `dist/` 폴더가 생성됩니다.

### 2. Cloudflare Pages 프로젝트 생성
```bash
npx wrangler pages project create webapp --production-branch main
```

### 3. 배포 실행
```bash
npx wrangler pages deploy dist --project-name webapp
```

**배포 성공 시 출력:**
```
✨ Success! Uploaded 2 files (1.23 sec)

✨ Deployment complete! Take a peek over at
   https://xxxxxxxx.webapp.pages.dev
```

---

## 배포 확인 및 테스트

### 1. 배포된 URL 접속
- **프로덕션 URL**: `https://webapp.pages.dev`
- **브랜치 URL**: `https://main.webapp.pages.dev`

### 2. 로그인 테스트
- 이메일: `test@example.com`
- 비밀번호: `password123`

### 3. 기능 테스트
- ✅ STEP 1: 할 일 추가
- ✅ STEP 2: 우선순위 분류
- ✅ STEP 3: TOP 3 설정
- ✅ 완료 체크
- ✅ 통계 확인

### 4. API 헬스 체크
```bash
curl https://webapp.pages.dev/api/health
```

---

## 커스텀 도메인 설정

### 1. Cloudflare 대시보드 접속
1. https://dash.cloudflare.com/ 로그인
2. "Workers & Pages" 선택
3. "webapp" 프로젝트 선택

### 2. 커스텀 도메인 추가
1. "Custom domains" 탭 클릭
2. "Set up a custom domain" 클릭
3. 소유한 도메인 입력 (예: `todo.yourdomain.com`)
4. DNS 레코드 추가 안내에 따라 설정

### 3. DNS 설정 (도메인 소유 시)
```
Type: CNAME
Name: todo (또는 원하는 서브도메인)
Content: webapp.pages.dev
```

---

## 문제 해결

### ❌ "database_id not found" 오류
**원인**: wrangler.jsonc에 database_id가 올바르지 않음

**해결책**:
```bash
# 데이터베이스 목록 확인
npx wrangler d1 list

# database_id를 wrangler.jsonc에 정확히 입력
```

### ❌ "Authentication error" 오류
**원인**: Wrangler 인증이 만료되었거나 실패

**해결책**:
```bash
# 로그아웃 후 재로그인
npx wrangler logout
npx wrangler login
```

### ❌ 빌드 실패
**원인**: Node.js 버전 또는 의존성 문제

**해결책**:
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# Node.js 버전 확인
node --version  # 18 이상이어야 함
```

### ❌ 로그인 실패
**원인**: 데이터베이스에 사용자가 없음

**해결책**:
```bash
# 시드 데이터 삽입
npx wrangler d1 execute webapp-production --remote --file=./seed.sql

# 또는 수동으로 사용자 생성
npx wrangler d1 execute webapp-production --remote --command="
INSERT INTO users (email, password, username, is_active) 
VALUES ('test@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '테스트 사용자', 1)
"
```

### ❌ 정적 파일(CSS/JS) 404 오류
**원인**: 빌드 설정 또는 파일 경로 문제

**해결책**:
```bash
# 빌드 재실행
npm run build

# dist 폴더 확인
ls -la dist/
ls -la dist/static/

# 재배포
npx wrangler pages deploy dist --project-name webapp
```

---

## 지속적 배포 (CI/CD)

### GitHub Actions 자동 배포
`.github/workflows/deploy.yml` 파일 생성:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy dist --project-name webapp
```

**GitHub Secrets 설정:**
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: Cloudflare API Token 입력

---

## 유용한 명령어

```bash
# 프로젝트 상태 확인
npx wrangler pages project list

# 배포 목록 확인
npx wrangler pages deployment list --project-name webapp

# 데이터베이스 쿼리 실행
npx wrangler d1 execute webapp-production --remote --command="SELECT * FROM users"

# 로컬 개발 서버 시작
npm run dev:sandbox

# 빌드 및 배포 (한 번에)
npm run build && npx wrangler pages deploy dist --project-name webapp
```

---

## 참고 자료

- **Cloudflare Pages 공식 문서**: https://developers.cloudflare.com/pages/
- **Cloudflare D1 공식 문서**: https://developers.cloudflare.com/d1/
- **Wrangler CLI 문서**: https://developers.cloudflare.com/workers/wrangler/
- **Hono 프레임워크**: https://hono.dev/

---

**문의사항이 있으시면 GitHub Issues를 통해 질문해주세요!**

GitHub: https://github.com/jkkim74/bsTodoList
