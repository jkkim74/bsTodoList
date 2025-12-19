# 🚀 Cloudflare Pages 배포 가이드 (업데이트)

## 📋 목차
1. [로컬 환경에서 직접 배포](#로컬-환경에서-직접-배포)
2. [Cloudflare Dashboard에서 GitHub 연동 배포](#cloudflare-dashboard에서-github-연동-배포)
3. [배포 후 확인사항](#배포-후-확인사항)

---

## 🖥️ 로컬 환경에서 직접 배포

### 1️⃣ 사전 준비
- Node.js 18 이상 설치
- Git 설치
- Cloudflare 계정 (이메일 인증 완료)

### 2️⃣ 프로젝트 클론
```bash
git clone https://github.com/jkkim74/bsTodoList.git
cd bsTodoList
```

### 3️⃣ 의존성 설치
```bash
npm install
```

### 4️⃣ Cloudflare 로그인
```bash
npx wrangler login
```
- 브라우저가 열리면 Cloudflare 계정으로 로그인
- 권한 승인

### 5️⃣ D1 데이터베이스 생성 (처음만 실행)
```bash
npx wrangler d1 create webapp-production
```

출력 예시:
```
✅ Successfully created DB 'webapp-production'!

[[d1_databases]]
binding = "DB"
database_name = "webapp-production"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 6️⃣ wrangler.jsonc 업데이트
위 명령어에서 출력된 `database_id`를 복사하여 `wrangler.jsonc` 파일에 붙여넣기:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "webapp",
  "compatibility_date": "2025-12-18",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "여기에-복사한-database-id-붙여넣기"
    }
  ]
}
```

### 7️⃣ 데이터베이스 마이그레이션
```bash
npx wrangler d1 migrations apply webapp-production --remote
```

### 8️⃣ 시드 데이터 삽입
```bash
npx wrangler d1 execute webapp-production --remote --file=./seed.sql
```

### 9️⃣ 프로젝트 빌드
```bash
npm run build
```

### 🔟 Cloudflare Pages 배포
```bash
npx wrangler pages deploy dist --project-name webapp
```

성공하면 다음과 같은 출력을 볼 수 있습니다:
```
✨ Successfully created the 'webapp' project.
✨ Deployment complete! Take a peek over at https://xxxxxxxx.webapp.pages.dev
```

---

## 🌐 Cloudflare Dashboard에서 GitHub 연동 배포

### 1️⃣ Cloudflare Dashboard 접속
https://dash.cloudflare.com 로그인

### 2️⃣ Pages 프로젝트 생성
1. 좌측 메뉴에서 **"Workers & Pages"** 클릭
2. **"Create application"** 버튼 클릭
3. **"Pages"** 탭 선택
4. **"Connect to Git"** 클릭

### 3️⃣ GitHub 저장소 연결
1. GitHub 계정 연결 (처음만)
2. 저장소 선택: **`jkkim74/bsTodoList`**
3. **"Begin setup"** 클릭

### 4️⃣ 빌드 설정
- **Project name**: `webapp` (또는 원하는 이름)
- **Production branch**: `main`
- **Build command**: `npm run build`
- **Build output directory**: `dist`

### 5️⃣ 환경 변수 설정
**Environment Variables** 섹션에서:
- D1 바인딩은 별도로 설정해야 함 (아래 참조)

**"Save and Deploy"** 클릭

### 6️⃣ D1 데이터베이스 바인딩 (중요!)

배포 후 설정:
1. 프로젝트 대시보드로 이동
2. **"Settings"** 탭 클릭
3. **"Functions"** 섹션으로 스크롤
4. **"D1 database bindings"** 섹션에서:
   - **Variable name**: `DB`
   - **D1 database**: `webapp-production` 선택
5. **"Save"** 클릭
6. 프로젝트 재배포 (설정 변경사항 적용)

### 7️⃣ 데이터베이스 마이그레이션 (로컬에서 실행)
```bash
# 로컬 환경에서 실행
npx wrangler d1 migrations apply webapp-production --remote
npx wrangler d1 execute webapp-production --remote --file=./seed.sql
```

---

## ✅ 배포 후 확인사항

### 1️⃣ 배포 URL 확인
```
https://webapp.pages.dev
또는
https://xxxxxxxx.webapp.pages.dev
```

### 2️⃣ 애플리케이션 테스트
1. 배포 URL로 접속
2. 로그인 테스트:
   - 이메일: `test@example.com`
   - 비밀번호: `password123`

3. 기능 테스트:
   - ✅ 할 일 추가 (꺼내기)
   - ✅ 작업 분류 (긴급·중요, 중요, 나중에, 내려놓기)
   - ✅ TOP 3 설정
   - ✅ 작업 완료 체크
   - ✅ 통계 표시

### 3️⃣ 데이터베이스 확인
```bash
# 로컬에서 실행
npx wrangler d1 execute webapp-production --remote --command="SELECT * FROM users LIMIT 5"
npx wrangler d1 execute webapp-production --remote --command="SELECT * FROM daily_tasks LIMIT 5"
```

---

## 🔄 수정사항 재배포

### 코드 변경 후 재배포:

**로컬 배포 방식:**
```bash
git pull origin main  # 최신 코드 가져오기
npm run build         # 빌드
npx wrangler pages deploy dist --project-name webapp  # 재배포
```

**GitHub 연동 방식:**
- GitHub에 푸시하면 자동으로 재배포됨
- Cloudflare Dashboard에서 배포 진행 상황 확인 가능

---

## 🆘 문제 해결

### ❌ 이메일 인증 오류
```
Error: Your user email must been verified [code: 8000077]
```
**해결방법**:
1. Cloudflare 가입 이메일 확인
2. "Verify your email address" 메일에서 링크 클릭
3. 인증 완료 후 다시 시도

### ❌ API 토큰 위치 오류
```
Cannot use the access token from location: xxx.xxx.xxx.xxx [code: 9109]
```
**해결방법**:
- 샌드박스 환경 제약
- 로컬 컴퓨터에서 배포 진행

### ❌ D1 바인딩 오류
```
Error: No D1 database configured
```
**해결방법**:
1. wrangler.jsonc에 database_id 확인
2. Cloudflare Dashboard에서 D1 바인딩 설정 확인
3. 프로젝트 재배포

### ❌ 빌드 오류
```
Error: Build failed
```
**해결방법**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📝 추가 설정

### 커스텀 도메인 연결
1. Cloudflare Dashboard → 프로젝트 선택
2. **"Custom domains"** 탭
3. **"Set up a custom domain"** 클릭
4. 도메인 입력 및 DNS 설정

### 환경 변수 추가
1. Cloudflare Dashboard → 프로젝트 선택
2. **"Settings"** → **"Environment variables"**
3. 변수 추가 (예: API 키, 비밀 키 등)

### HTTPS 강제 적용
- Cloudflare Pages는 기본적으로 HTTPS 제공
- HTTP → HTTPS 자동 리다이렉션 활성화됨

---

## 📚 참고 자료
- [Cloudflare Pages 공식 문서](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 문서](https://developers.cloudflare.com/workers/wrangler/)
- [Hono 프레임워크 문서](https://hono.dev/)

---

**✨ 배포 완료 후 영구 URL로 애플리케이션을 사용할 수 있습니다!**
