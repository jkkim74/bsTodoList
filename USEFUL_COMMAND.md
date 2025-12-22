1. 정기적인 백업
Copy# 원격 DB 백업
npx wrangler d1 export webapp-production --remote --output=backup_$(date +%Y%m%d).sql

2. 개발 워크플로우
Copy# 로컬에서 개발
npm run db:reset
npm run build
npx wrangler pages dev dist --d1=webapp-production --local --port 3000

# 테스트 후 배포
git add .
git commit -m "feat: 새로운 기능"
git push origin main
npm run deploy

3. 프로덕션 DB 관리
Copy# 사용자 확인
npm run db:check:prod

# 마이그레이션 적용
npm run db:migrate:prod

# 시드 데이터 (필요시)
npm run db:seed:prod

📚 유용한 명령어 모음
Copy# 로컬 개발
npm run dev              # Vite 개발 서버 (HMR)
npm run build            # 프로덕션 빌드
npm run db:reset         # 로컬 DB 초기화

# 프로덕션
npm run deploy           # Cloudflare Pages 배포
npm run db:migrate:prod  # 원격 DB 마이그레이션
npm run db:check:prod    # 원격 DB 사용자 확인

# Git
npm run git:status       # git status
npm run git:log          # git log --oneline