# 🚀 하이브리드 앱 배포 가이드

## 📋 목차
1. [사전 준비](#사전-준비)
2. [Android 앱 배포](#android-앱-배포)
3. [iOS 앱 배포](#ios-앱-배포)
4. [프로덕션 체크리스트](#프로덕션-체크리스트)
5. [문제 해결](#문제-해결)

---

## 🎯 사전 준비

### 1. 로컬 환경 확인

**필수 소프트웨어:**
- ✅ Node.js (v16 이상)
- ✅ npm (v7 이상)
- ✅ Git
- ✅ Android Studio (Android 배포)
- ✅ Xcode (iOS 배포, macOS만)

**프로젝트 최신 상태 확인:**
```bash
cd C:\Users\user\StudioProjects\bsTodoList

# 최신 코드 받기
git pull origin main

# 의존성 설치
npm install
```

---

## 📱 Android 앱 배포

### Step 1: 프로덕션 빌드

```bash
# 1. 웹 앱 빌드
npm run build

# 2. Capacitor 설정 확인
# capacitor.config.ts에서 server.url 주석 처리 (프로덕션용)
```

**capacitor.config.ts 수정:**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.braindump.app',
  appName: 'Brain Dumping',
  webDir: 'dist',
  server: {
    // 🔥 프로덕션: 주석 처리 (앱 자체 assets 사용)
    // url: 'https://webapp-tvo.pages.dev',
    // cleartext: true
  },
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

### Step 2: Capacitor 동기화

```bash
# Capacitor 프로젝트 생성 (처음만)
npx cap add android

# 빌드 파일을 Android 프로젝트에 동기화
npx cap sync android

# 또는 copy만 (설정 변경 없이 빌드만 업데이트)
npx cap copy android
```

### Step 3: AndroidManifest.xml 설정

**파일 위치:** `android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- 🔥 Google OAuth Deep Link -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                
                <!-- Deep Link: com.braindump.app://oauth/callback -->
                <data
                    android:scheme="com.braindump.app"
                    android:host="oauth"
                    android:pathPrefix="/callback" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

### Step 4: Android Studio에서 빌드

```bash
# Android Studio 열기
npx cap open android
```

**Android Studio에서:**

1. **프로젝트 열기**
   - Android Studio가 열리면 자동으로 Gradle 동기화

2. **빌드 설정**
   - `Build` > `Select Build Variant`
   - `release` 선택

3. **서명 키 생성 (처음만)**
   ```bash
   # 명령 프롬프트에서
   keytool -genkey -v -keystore brain-dumping-release.keystore -alias brain-dumping -keyalg RSA -keysize 2048 -validity 10000
   ```
   
   **정보 입력:**
   - 비밀번호: (안전하게 보관)
   - 이름, 조직, 위치 등 정보 입력

4. **서명 설정**
   - `android/app/build.gradle` 파일 수정:
   
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               storeFile file("../../brain-dumping-release.keystore")
               storePassword "your-store-password"
               keyAlias "brain-dumping"
               keyPassword "your-key-password"
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

5. **APK/AAB 빌드**
   
   **AAB (Google Play Store용, 권장):**
   ```
   Build > Generate Signed Bundle / APK > Android App Bundle > Next
   ```
   
   **APK (직접 배포용):**
   ```
   Build > Build Bundle(s) / APK(s) > Build APK(s)
   ```
   
   **출력 위치:**
   - AAB: `android/app/release/app-release.aab`
   - APK: `android/app/build/outputs/apk/release/app-release.apk`

### Step 5: Google Play Store 업로드

1. **Google Play Console 접속**
   - https://play.google.com/console
   - 개발자 계정 필요 (1회 등록비 $25)

2. **새 앱 만들기**
   - `모든 앱` > `앱 만들기`
   - 앱 이름: `Brain Dumping`
   - 기본 언어: 한국어
   - 앱/게임: 앱
   - 무료/유료: 무료

3. **앱 정보 입력**
   - 스토어 등록정보
   - 스크린샷 (최소 2개)
   - 앱 아이콘
   - 설명
   - 개인정보처리방침 URL

4. **프로덕션 트랙에 AAB 업로드**
   - `프로덕션` > `새 버전 만들기`
   - `brain-dumping-release.aab` 업로드
   - 버전 이름: `1.0.0`
   - 출시 노트 작성

5. **검토 및 출시**
   - Google 검토 (보통 1-3일 소요)
   - 승인 후 자동 배포

---

## 🍎 iOS 앱 배포 (macOS 필요)

### Step 1: 프로덕션 빌드

```bash
# 1. 웹 앱 빌드
npm run build

# 2. iOS 프로젝트 생성/동기화
npx cap add ios
npx cap sync ios
```

### Step 2: Info.plist 설정

**파일 위치:** `ios/App/App/Info.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- ... 기존 설정 ... -->
    
    <!-- 🔥 Google OAuth Deep Link -->
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>com.braindump.app</string>
            </array>
            <key>CFBundleURLName</key>
            <string>com.braindump.app</string>
        </dict>
    </array>
    
    <!-- App Transport Security -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
</dict>
</plist>
```

### Step 3: Xcode에서 빌드

```bash
# Xcode 열기
npx cap open ios
```

**Xcode에서:**

1. **Team 설정**
   - 프로젝트 선택 > `Signing & Capabilities`
   - Team: Apple Developer 계정 선택
   - Bundle Identifier: `com.braindump.app`

2. **Build Configuration**
   - Scheme: `App` 선택
   - Device: `Any iOS Device (arm64)` 선택

3. **Archive 생성**
   - `Product` > `Archive`
   - Archive 완료 후 자동으로 Organizer 열림

4. **App Store Connect 업로드**
   - Organizer에서 `Distribute App` 클릭
   - `App Store Connect` 선택
   - `Upload` 클릭
   - 자동으로 업로드

### Step 4: App Store Connect 설정

1. **App Store Connect 접속**
   - https://appstoreconnect.apple.com
   - Apple Developer 계정 필요 (연간 $99)

2. **새 앱 등록**
   - `내 앱` > `+` > `새로운 앱`
   - 플랫폼: iOS
   - 이름: `Brain Dumping`
   - 기본 언어: 한국어
   - Bundle ID: `com.braindump.app`
   - SKU: `com.braindump.app`

3. **앱 정보 입력**
   - 스크린샷 (여러 기기 크기)
   - 미리보기 동영상 (선택)
   - 설명
   - 키워드
   - 지원 URL
   - 개인정보처리방침 URL

4. **빌드 선택 및 제출**
   - Xcode에서 업로드한 빌드 선택
   - 앱 심사 제출
   - Apple 검토 (보통 1-3일 소요)

---

## ✅ 프로덕션 체크리스트

### 배포 전 확인 사항

- [ ] **코드 최신화**
  ```bash
  git pull origin main
  npm install
  npm run build
  ```

- [ ] **capacitor.config.ts 프로덕션 모드**
  ```typescript
  server: {
    // url 주석 처리
  }
  ```

- [ ] **환경 변수 확인**
  - Google OAuth Client ID
  - Cloudflare API 엔드포인트

- [ ] **AndroidManifest.xml Intent Filter**
  - Deep Link 설정 확인
  - `com.braindump.app://oauth/callback`

- [ ] **iOS Info.plist URL Scheme**
  - `com.braindump.app` 등록

- [ ] **버전 관리**
  - `package.json` version 업데이트
  - Android: `build.gradle` versionCode, versionName
  - iOS: Xcode General > Version, Build

- [ ] **아이콘 및 스플래시 스크린**
  ```bash
  # 아이콘 생성 (cordova-res 사용)
  npm install -g cordova-res
  cordova-res android --skip-config --copy
  cordova-res ios --skip-config --copy
  ```

- [ ] **테스트**
  - [ ] Google OAuth 로그인 (In-App Browser)
  - [ ] 이메일 로그인
  - [ ] 회원가입 (이메일 인증)
  - [ ] 할 일 생성/수정/삭제
  - [ ] 오프라인 모드 (PWA)
  - [ ] 푸시 알림 (선택)

---

## 🔄 업데이트 배포

### 코드 변경 후 재배포

```bash
# 1. 코드 업데이트
git pull origin main
npm install

# 2. 버전 업데이트
# package.json, build.gradle, Xcode 버전 변경

# 3. 빌드
npm run build

# 4. 동기화
npx cap sync

# 5. Android
npx cap open android
# Android Studio에서 Build > Generate Signed Bundle / APK

# 6. iOS
npx cap open ios
# Xcode에서 Product > Archive
```

### 핫픽스 (긴급 수정)

```bash
# 1. 수정 커밋
git add -A
git commit -m "hotfix: Critical bug fix"
git push origin main

# 2. 버전 패치 업데이트
# 예: 1.0.0 → 1.0.1

# 3. 빌드 및 배포
npm run build
npx cap sync
# Android/iOS 빌드 및 스토어 업로드
```

---

## 🐛 문제 해결

### 1. Capacitor 동기화 오류

**증상:**
```
Error: Capacitor sync failed
```

**해결:**
```bash
# 캐시 삭제
rm -rf android/
rm -rf ios/
rm -rf node_modules/
rm package-lock.json

# 재설치
npm install
npx cap add android
npx cap add ios
npx cap sync
```

### 2. Android 빌드 오류

**증상:**
```
Execution failed for task ':app:processReleaseMainManifest'
```

**해결:**
```bash
# Android Studio에서
File > Invalidate Caches / Restart

# Gradle 동기화
./gradlew clean build --refresh-dependencies
```

### 3. iOS 빌드 오류

**증상:**
```
Code Sign error
```

**해결:**
1. Xcode > Preferences > Accounts > Apple ID 추가
2. Signing & Capabilities > Team 선택
3. Provisioning Profile 자동 생성 확인

### 4. Deep Link 작동 안 함

**Android:**
- AndroidManifest.xml의 `<intent-filter>` 확인
- `android:exported="true"` 설정 확인
- adb logcat으로 로그 확인

**iOS:**
- Info.plist의 `CFBundleURLTypes` 확인
- URL Scheme 중복 확인
- Xcode Console 로그 확인

### 5. In-App Browser 안 열림

**확인 사항:**
```bash
# @capacitor/browser 설치 확인
npm list @capacitor/browser

# 재설치
npm install @capacitor/browser
npx cap sync
```

**코드 확인:**
```javascript
// public/static/app.js
if (Capacitor && Browser && Capacitor.isNativePlatform()) {
  await Browser.open({ url: authUrl })
}
```

---

## 📊 배포 후 모니터링

### Google Play Console
- **통계**: 설치 수, 활성 사용자, 평점
- **충돌 및 ANR**: 앱 안정성 모니터링
- **사용자 피드백**: 리뷰 및 평점 확인

### App Store Connect
- **Analytics**: 다운로드, 매출, 사용 현황
- **Crashes**: 충돌 보고서
- **평가 및 리뷰**: 사용자 피드백

### Cloudflare Dashboard
- **Workers Logs**: API 요청 모니터링
- **D1 Database**: 데이터베이스 상태 확인
- **Analytics**: 트래픽 분석

---

## 📚 참고 자료

### Capacitor
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Deep Linking](https://capacitorjs.com/docs/guides/deep-links)

### Android
- [Android Studio](https://developer.android.com/studio)
- [Google Play Console](https://play.google.com/console)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)

### iOS
- [Xcode](https://developer.apple.com/xcode/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Apple Developer](https://developer.apple.com)

---

## 🎯 빠른 참조

### Android 빌드 명령어
```bash
# 개발 빌드
npm run build && npx cap sync android && npx cap open android

# 프로덕션 빌드
npm run build && npx cap copy android && npx cap open android
```

### iOS 빌드 명령어
```bash
# 개발 빌드
npm run build && npx cap sync ios && npx cap open ios

# 프로덕션 빌드
npm run build && npx cap copy ios && npx cap open ios
```

### 전체 재설치
```bash
rm -rf android ios node_modules
npm install
npx cap add android
npx cap add ios
npx cap sync
```

---

**작성일:** 2026-01-20  
**작성자:** AI Assistant  
**프로젝트:** Brain Dumping TO_DO_LIST  
**버전:** v2.0.0

**GitHub:** https://github.com/jkkim74/bsTodoList
