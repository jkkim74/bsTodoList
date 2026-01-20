# 🚀 Capacitor 플랫폼 설정 가이드

## 📋 문제 요약

### 🔴 근본 원인
```
❌ android/ 및 ios/ 폴더가 없음
❌ Capacitor 플랫폼이 초기화되지 않음
❌ capacitor.js가 생성되지 않음
❌ 하이브리드 앱으로 작동하지 않음
```

### 📂 현재 상태
```bash
# .gitignore에 포함되어 Git에 커밋되지 않음
android/
ios/
```

---

## ✅ 해결 방법

### 1️⃣ 로컬 PC에서 Capacitor 플랫폼 추가

#### 📍 경로
```powershell
cd C:\Users\user\StudioProjects\bsTodoList
```

#### 🔄 최신 코드 받기
```powershell
git pull origin main
```

#### 📦 의존성 설치
```powershell
npm install
```

#### 🏗️ 빌드
```powershell
npm run build
```

#### 📱 Android 플랫폼 추가
```powershell
npx cap add android
```

**예상 출력:**
```
✔ Adding native android project in android in 3.16s
✔ add in 3.18s
✔ Copying web assets from dist to android/app/src/main/assets/public in 234.43ms
✔ Creating capacitor.config.json in android/app/src/main/assets in 2.33ms
✔ copy android in 274.45ms
✔ Updating Android plugins in 3.80ms
✔ update android in 45.84ms
```

#### 🍎 iOS 플랫폼 추가 (선택 사항 - macOS 필요)
```powershell
# macOS에서만 실행 가능
npx cap add ios
```

#### 🔄 Capacitor 동기화
```powershell
npx cap sync android
```

**예상 출력:**
```
✔ Copying web assets from dist to android/app/src/main/assets/public in 125.67ms
✔ Creating capacitor.config.json in android/app/src/main/assets in 1.45ms
✔ copy android in 145.23ms
✔ Updating Android plugins in 4.12ms
✔ update android in 32.56ms
```

---

## 📂 생성되는 파일 구조

### Android 플랫폼
```
android/
├── app/
│   └── src/
│       └── main/
│           ├── assets/
│           │   └── public/
│           │       ├── capacitor.js ✅
│           │       ├── index.html
│           │       ├── manifest.json
│           │       └── static/
│           ├── java/
│           ├── res/
│           └── AndroidManifest.xml
├── gradle/
├── build.gradle
└── settings.gradle
```

### Capacitor 설정 파일
```
dist/
├── capacitor.js ✅ (이제 생성됨!)
├── index.html
├── manifest.json
└── static/
```

---

## 🔍 검증 방법

### 1️⃣ capacitor.js 생성 확인
```powershell
# dist 폴더 확인
dir dist\capacitor.js

# Android assets 폴더 확인
dir android\app\src\main\assets\public\capacitor.js
```

**예상 출력:**
```
2025-01-20  오후 02:15         15,234 capacitor.js
```

### 2️⃣ Android 앱 실행
```powershell
npx cap open android
```

### 3️⃣ Chrome DevTools 연결
1. Android Studio에서 앱 실행
2. Chrome 브라우저에서 `chrome://inspect` 접속
3. "Remote Target" 섹션에서 앱 선택
4. "Inspect" 클릭

### 4️⃣ Capacitor 초기화 확인
콘솔에서 다음 로그 확인:
```javascript
[Capacitor] Initialized successfully
[Capacitor] Platform: android
[Capacitor] Is Native: true
[Capacitor] Browser Plugin: Available
```

### 5️⃣ Google OAuth 테스트
1. Google 로그인 클릭
2. **In-App Browser** 열림 확인 (✅ 시스템 브라우저 ❌)
3. 로그인 후 **앱으로 자동 복귀** 확인
4. **백그라운드에 로그인 창 없음** 확인

---

## 🎯 핵심 체크리스트

### ✅ Before
- [ ] `git pull origin main` 실행
- [ ] `npm install` 실행
- [ ] `npm run build` 실행
- [ ] `npx cap add android` 실행
- [ ] `npx cap sync android` 실행

### ✅ After
- [ ] `dist/capacitor.js` 존재 확인
- [ ] `android/app/src/main/assets/public/capacitor.js` 존재 확인
- [ ] Android Studio에서 앱 실행 성공
- [ ] Chrome DevTools에서 Capacitor 초기화 확인
- [ ] Google OAuth가 In-App Browser에서 열림
- [ ] 로그인 후 앱으로 자동 복귀
- [ ] 백그라운드에 로그인 창 없음

---

## 🚨 일반적인 문제 해결

### 1️⃣ `npx cap add android` 실패
```powershell
# node_modules 재설치
rmdir node_modules -Recurse -Force
npm install

# 다시 시도
npx cap add android
```

### 2️⃣ Gradle 빌드 오류
```powershell
cd android
.\gradlew clean
.\gradlew assembleDebug
```

### 3️⃣ Android Studio에서 앱 실행 실패
1. **File > Invalidate Caches / Restart**
2. **Build > Clean Project**
3. **Build > Rebuild Project**
4. 다시 실행

### 4️⃣ capacitor.js가 여전히 없음
```powershell
# 빌드 재실행
npm run build

# 강제 동기화
npx cap sync android --force

# capacitor.js 확인
dir android\app\src\main\assets\public\capacitor.js
```

---

## 📝 추가 설정

### AndroidManifest.xml 확인
파일 위치: `android/app/src/main/AndroidManifest.xml`

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.braindump.app" />
</intent-filter>
```

### Gradle 버전 확인
파일 위치: `android/build.gradle`

```gradle
dependencies {
    classpath 'com.android.tools.build:gradle:8.9.1'
}
```

파일 위치: `android/app/build.gradle`

```gradle
android {
    compileSdk 36
    defaultConfig {
        targetSdk 36
    }
}
```

---

## 🎉 완료 후 확인 사항

### ✅ Capacitor 초기화 성공
```javascript
console.log('[Capacitor] Initialized successfully');
console.log('[Capacitor] Platform:', Capacitor.getPlatform()); // 'android'
console.log('[Capacitor] Is Native:', Capacitor.isNativePlatform()); // true
```

### ✅ Browser Plugin 사용 가능
```javascript
const { Browser } = Capacitor.Plugins;
console.log('[Capacitor] Browser Plugin:', Browser ? 'Available' : 'Not Available');
```

### ✅ OAuth 흐름 정상 작동
```
1. 사용자가 Google 로그인 클릭
2. In-App Browser 열림
3. Google 계정 선택 및 로그인
4. Deep Link(com.braindump.app://) 트리거
5. App URL Listener가 콜백 감지
6. In-App Browser 자동 닫힘
7. handleGoogleCallback() 실행
8. 토큰 교환 및 저장
9. 메인 화면 렌더링
```

---

## 📚 관련 문서

- [HYBRID_APP_DEPLOYMENT_GUIDE.md](./HYBRID_APP_DEPLOYMENT_GUIDE.md) - 하이브리드 앱 배포 가이드
- [HYBRID_APP_INSTALLATION_GUIDE.md](./HYBRID_APP_INSTALLATION_GUIDE.md) - 하이브리드 앱 설치 가이드
- [ANDROID_BUILD_FIX.md](./ANDROID_BUILD_FIX.md) - Android 빌드 오류 해결
- [OAUTH_BROWSER_BACKGROUND_FIX.md](./OAUTH_BROWSER_BACKGROUND_FIX.md) - OAuth 백그라운드 브라우저 수정
- [CAPACITOR_JS_MISSING_FIX.md](./CAPACITOR_JS_MISSING_FIX.md) - capacitor.js 누락 문제 해결

---

## 🔗 GitHub Repository

https://github.com/jkkim74/bsTodoList

---

## 📅 작성일

2025-01-20

---

## ✅ 다음 단계

1. **로컬 PC에서 실행:**
   ```powershell
   cd C:\Users\user\StudioProjects\bsTodoList
   git pull origin main
   npm install
   npm run build
   npx cap add android
   npx cap sync android
   npx cap open android
   ```

2. **검증:**
   - `dist/capacitor.js` 존재 확인
   - Android Studio에서 앱 실행
   - Google OAuth 테스트

3. **결과 공유:**
   - 테스트 결과를 알려주세요!

---

**이제 Capacitor가 제대로 설정되고 하이브리드 앱이 정상 작동할 것입니다!** 🚀
