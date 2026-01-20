# 🐛 capacitor.js 파일이 생성되지 않는 문제 해결

## 🔴 문제 상황

```bash
cd C:\Users\user\StudioProjects\bsTodoList
npm run build
npx cap sync android
dir dist\capacitor.js

# 결과: 파일을 찾을 수 없습니다
```

**증상:**
- `npm run build` 성공
- `npx cap sync android` 성공
- ❌ `dist/capacitor.js` 파일이 없음

---

## 🔍 근본 원인

### **capacitor.config.ts 설정 문제**

```typescript
// ❌ 현재 설정 (문제)
const config: CapacitorConfig = {
  appId: 'com.braindump.app',
  appName: 'Brain Dumping',
  webDir: 'dist',
  server: {
    url: 'https://webapp-tvo.pages.dev',  // ⬅️ 문제!
    cleartext: true
  },
  // ...
};
```

### **왜 문제인가?**

`server.url`이 설정되어 있으면:
1. ✅ 앱은 `https://webapp-tvo.pages.dev`에서 HTML/JS/CSS를 로드
2. ❌ `dist/` 폴더의 로컬 파일을 사용하지 않음
3. ❌ Capacitor가 `capacitor.js`를 `dist/`에 복사하지 않음
4. ❌ 앱이 외부 서버에 의존 (오프라인 작동 불가)

**`server.url`의 용도:**
- **개발 중 Live Reload**: 코드 수정 시 자동 새로고침
- **로컬 개발 서버 연결**: `http://192.168.1.100:8788`
- **프로덕션에서는 사용하지 않음!**

---

## ✅ 해결 방법

### **1. capacitor.config.ts 수정**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.braindump.app',
  appName: 'Brain Dumping',
  webDir: 'dist',
  
  // ✅ 프로덕션: server 설정 주석 처리 또는 제거
  // server: {
  //   url: 'https://webapp-tvo.pages.dev',
  //   cleartext: true
  // },
  
  // 🔥 개발 중 Live Reload가 필요하다면:
  // server: {
  //   url: 'http://192.168.1.100:8788',  // 로컬 IP
  //   cleartext: true
  // },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4F46E5',
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'splash',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#FFFFFF'
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#4F46E5'
    }
  },
  
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true
  }
};

export default config;
```

---

### **2. 빌드 및 동기화 재실행**

```bash
cd C:\Users\user\StudioProjects\bsTodoList

# 1. capacitor.config.ts에서 server.url 주석 처리

# 2. 기존 빌드 삭제 (선택)
rmdir /s /q dist
rmdir /s /q android\app\src\main\assets\public

# 3. 웹 앱 빌드
npm run build

# 4. Capacitor 동기화
npx cap sync android

# 5. capacitor.js 확인
dir dist\capacitor.js
# 결과: capacitor.js, capacitor.plugins.js 등 표시됨

# 6. Android assets 확인
dir android\app\src\main\assets\public\capacitor.js
```

---

### **3. 확인**

```bash
# dist 폴더 확인
dir dist

# 예상 결과:
# capacitor.js
# capacitor.plugins.js
# index.html
# static/
#   app.js
#   styles.css
```

---

## 🔄 개발 모드 vs 프로덕션 모드

### **개발 모드 (Live Reload)**

```typescript
// capacitor.config.ts
server: {
  url: 'http://192.168.1.100:8788',  // 로컬 개발 서버
  cleartext: true
}
```

**사용 시나리오:**
- 코드 수정 후 자동 새로고침 필요
- 빠른 개발 사이클
- 실제 기기에서 테스트

**실행:**
```bash
# 터미널 1: 개발 서버 시작
npm run dev

# 터미널 2: 앱 실행
npx cap sync android
npx cap run android
```

---

### **프로덕션 모드 (로컬 빌드)**

```typescript
// capacitor.config.ts
// server: {
//   url: 'https://webapp-tvo.pages.dev',
//   cleartext: true
// },
```

**사용 시나리오:**
- 최종 APK/AAB 빌드
- 앱 스토어 배포
- 오프라인 작동 필요
- `capacitor.js` 포함 필수

**실행:**
```bash
npm run build
npx cap sync android
npx cap open android
# Android Studio에서 APK 빌드
```

---

## 📦 정상 빌드 결과

### **dist/ 폴더 구조**

```
dist/
├── capacitor.js          ⬅️ 필수!
├── capacitor.plugins.js  ⬅️ 필수!
├── index.html
├── manifest.json
├── sw.js
├── _worker.js
├── icons/
│   └── icon.svg
└── static/
    ├── app.js
    ├── style.css
    └── styles.css
```

### **android/app/src/main/assets/public/ 구조**

```
public/
├── capacitor.js          ⬅️ dist에서 복사됨
├── capacitor.plugins.js
├── index.html
├── manifest.json
└── static/
    └── app.js
```

---

## 🧪 테스트

### **1. capacitor.js 생성 확인**

```bash
cd C:\Users\user\StudioProjects\bsTodoList

# capacitor.config.ts 수정 (server.url 주석 처리)
# notepad capacitor.config.ts

npm run build
npx cap sync android

# 파일 확인
dir dist\capacitor.js
dir android\app\src\main\assets\public\capacitor.js
```

### **2. 앱 실행 및 로그 확인**

```bash
npx cap open android
```

**Android Studio에서:**
1. Run 버튼 클릭
2. Logcat 확인
3. Chrome DevTools (chrome://inspect) 연결
4. Console에서 확인:

```javascript
console.log('Capacitor:', window.Capacitor)
console.log('Platform:', window.Capacitor?.getPlatform())

// 예상 결과:
// Capacitor: {Plugins: {…}, getPlatform: ƒ, ...}
// Platform: "android"
```

---

## 🐛 문제 해결

### **문제 1: capacitor.js가 여전히 없음**

**확인 사항:**
```bash
# 1. capacitor.config.ts 확인
type capacitor.config.ts | findstr "server"

# 결과: server 부분이 주석 처리되어야 함

# 2. webDir 확인
type capacitor.config.ts | findstr "webDir"

# 결과: webDir: 'dist',

# 3. dist 폴더 삭제 후 재빌드
rmdir /s /q dist
npm run build
```

---

### **문제 2: "Cannot find module 'capacitor.js'"**

**원인:**
- `index.html`에 `<script src="capacitor.js"></script>`가 있지만
- 파일이 없음

**해결:**
```bash
# server.url 주석 처리 확인
# 재빌드
npm run build
npx cap copy android  # sync 대신 copy만
```

---

### **문제 3: 외부 서버(webapp-tvo.pages.dev) 사용 vs 로컬 빌드**

| 항목 | 외부 서버 모드 | 로컬 빌드 모드 |
|------|---------------|---------------|
| `server.url` | ✅ 설정됨 | ❌ 주석 처리 |
| `capacitor.js` | ❌ 없음 | ✅ 있음 |
| 오프라인 작동 | ❌ 불가 | ✅ 가능 |
| 앱 크기 | 작음 | 큼 |
| 업데이트 | 서버에서 자동 | 앱 재배포 필요 |
| 권장 용도 | 개발/테스트 | 프로덕션 |

---

## 📝 올바른 빌드 프로세스

### **프로덕션 빌드 (APK/AAB 배포용)**

```bash
# 1. capacitor.config.ts 수정
#    server.url 주석 처리

# 2. 클린 빌드
rmdir /s /q dist
rmdir /s /q android\app\src\main\assets\public
npm install
npm run build

# 3. Capacitor 동기화
npx cap sync android

# 4. 파일 확인
dir dist\capacitor.js
dir android\app\src\main\assets\public\capacitor.js

# 5. Android Studio에서 APK 빌드
npx cap open android
```

---

## ✅ 체크리스트

빌드 전 확인:

- [ ] `capacitor.config.ts`에서 `server.url` 주석 처리됨
- [ ] `webDir: 'dist'` 설정 확인
- [ ] `npm run build` 성공
- [ ] `npx cap sync android` 성공
- [ ] `dist/capacitor.js` 파일 존재 확인
- [ ] `android/app/src/main/assets/public/capacitor.js` 파일 존재 확인
- [ ] `public/index.html`에 `<script src="capacitor.js"></script>` 있음
- [ ] 앱 실행 시 `[Capacitor] Initialized` 로그 확인

---

## 🎯 요약

### **문제:**
```typescript
server: {
  url: 'https://webapp-tvo.pages.dev',  // ❌
}
```

### **해결:**
```typescript
// server: {
//   url: 'https://webapp-tvo.pages.dev',
// },
```

### **결과:**
- ✅ `capacitor.js` 파일 생성됨
- ✅ 앱이 로컬 빌드 사용
- ✅ Capacitor 초기화 성공
- ✅ In-App Browser 작동

---

**작성일:** 2026-01-20  
**문제:** `capacitor.js` 파일이 생성되지 않음  
**원인:** `capacitor.config.ts`의 `server.url` 설정 활성화  
**해결:** `server.url` 주석 처리 후 재빌드  

**GitHub:** https://github.com/jkkim74/bsTodoList
