# ⚡ 빠른 배포 가이드 (Quick Deploy)

## 🚀 수정사항을 Cloudflare Pages에 배포하는 방법

현재 GitHub에 최신 코드가 업로드되어 있습니다. 로컬 컴퓨터에서 다음 단계를 따르세요:

---

## 📋 방법 1: 로컬에서 직접 배포 (5분)

### 1️⃣ 최신 코드 가져오기
```bash
cd bsTodoList  # 기존 프로젝트 폴더로 이동
git pull origin main  # 최신 코드 가져오기
```

처음 배포하는 경우:
```bash
git clone https://github.com/jkkim74/bsTodoList.git
cd bsTodoList
npm install
```

### 2️⃣ 빌드
```bash
npm run build
```

### 3️⃣ 배포
```bash
npx wrangler pages deploy dist --project-name webapp
```

**배포 완료!** 출력된 URL로 접속하세요:
```
✨ Deployment complete! 
https://xxxxxxxx.webapp.pages.dev
```

---

## 📋 방법 2: Cloudflare Dashboard 자동 배포 (GitHub 연동)

### 설정 (한 번만)

1. **Cloudflare Dashboard** 접속: https://dash.cloudflare.com
2. **Workers & Pages** → **Create application** → **Pages**
3. **Connect to Git** 클릭
4. GitHub 저장소 선택: `jkkim74/bsTodoList`
5. 빌드 설정:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. **Save and Deploy** 클릭

### 이후 배포

GitHub에 푸시하면 **자동으로 재배포**됩니다!
```bash
git push origin main
```

Cloudflare Dashboard에서 배포 진행 상황을 실시간으로 확인할 수 있습니다.

---

## ✅ 배포 확인

### 1. URL 접속
```
https://webapp.pages.dev
```

### 2. 로그인 테스트
- **이메일**: test@example.com
- **비밀번호**: password123

### 3. 기능 테스트
- ✅ 할 일 추가
- ✅ 분류하기 (긴급·중요, 중요, 나중에, **내려놓기**)
- ✅ TOP 3 설정
- ✅ 완료 체크

---

## 🔄 자주 묻는 질문 (FAQ)

### Q: 처음 배포할 때 D1 데이터베이스는?

A: 처음 배포 시 D1 데이터베이스를 생성해야 합니다:

```bash
# 1. D1 데이터베이스 생성
npx wrangler d1 create webapp-production

# 2. database_id를 wrangler.jsonc에 입력

# 3. 마이그레이션 적용
npx wrangler d1 migrations apply webapp-production --remote

# 4. 테스트 계정 생성
npx wrangler d1 execute webapp-production --remote --file=./seed.sql

# 5. 배포
npm run build
npx wrangler pages deploy dist --project-name webapp
```

### Q: 이미 배포한 적이 있다면?

A: 간단히 재배포만 하면 됩니다:

```bash
git pull origin main
npm run build
npx wrangler pages deploy dist --project-name webapp
```

### Q: GitHub 연동 배포를 사용 중이라면?

A: 아무것도 할 필요 없습니다! GitHub에 푸시하면 자동 배포됩니다.

### Q: 배포 후 변경사항이 반영되지 않는다면?

A: 브라우저 캐시를 삭제하세요:
- Chrome: `Ctrl + Shift + R` (Windows/Linux)
- Chrome: `Cmd + Shift + R` (Mac)
- 또는 시크릿 모드에서 접속

---

## 🆘 문제 해결

### ❌ "Cannot use the access token from location" 오류
**원인**: 샌드박스 환경 제약  
**해결**: 로컬 컴퓨터에서 배포 진행

### ❌ "Your user email must been verified" 오류
**원인**: Cloudflare 이메일 미인증  
**해결**: 
1. Cloudflare 가입 이메일 확인
2. "Verify your email address" 메일에서 링크 클릭
3. 인증 완료 후 다시 시도

### ❌ 빌드 오류
**해결**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 상세 가이드

더 자세한 내용은 다음 문서를 참조하세요:
- [DEPLOYMENT_UPDATE.md](./DEPLOYMENT_UPDATE.md) - 전체 배포 가이드
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 원본 배포 가이드
- [README.md](./README.md) - 프로젝트 전체 문서

---

## 🎉 배포 완료!

배포가 완료되면:
1. ✅ 영구 URL 획득 (webapp.pages.dev)
2. ✅ 글로벌 CDN으로 빠른 응답
3. ✅ HTTPS 자동 적용
4. ✅ 무료 호스팅

**질문이나 문제가 있으면 [DEPLOYMENT_UPDATE.md](./DEPLOYMENT_UPDATE.md)의 문제 해결 섹션을 확인하세요!**
