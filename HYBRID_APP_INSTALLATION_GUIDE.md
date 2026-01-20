# 📱 하이브리드 앱 설치 가이드

## 📋 목차
1. [사용자를 위한 설치 가이드](#사용자를-위한-설치-가이드)
2. [개발자를 위한 설치 가이드](#개발자를-위한-설치-가이드)
3. [테스트 설치 방법](#테스트-설치-방법)
4. [문제 해결](#문제-해결)

---

## 👥 사용자를 위한 설치 가이드

### 🤖 Android 사용자

#### 방법 1: Google Play Store에서 설치 (출시 후)
1. **Google Play Store 열기**
2. **"Brain Dumping" 검색**
3. **설치** 버튼 클릭
4. 앱 아이콘을 찾아 실행

**다운로드 링크:** (출시 후 업데이트 예정)
```
https://play.google.com/store/apps/details?id=com.braindump.app
```

#### 방법 2: APK 직접 설치 (테스트/베타 버전)

**⚠️ 주의사항:**
- 출처를 알 수 없는 앱 설치 허용 필요
- 보안 위험이 있을 수 있으니 신뢰할 수 있는 출처에서만 다운로드

**설치 단계:**

1. **APK 파일 다운로드**
   - 개발자로부터 APK 파일 받기 (`app-release.apk`)
   - 또는 제공된 다운로드 링크 사용

2. **알 수 없는 출처 허용**
   ```
   설정 > 보안 > 알 수 없는 출처 허용
   또는
   설정 > 앱 > 특수 액세스 > 알 수 없는 앱 설치
   ```

3. **APK 설치**
   - 다운로드한 APK 파일 클릭
   - "설치" 버튼 클릭
   - 권한 요청 승인

4. **앱 실행**
   - 설치 완료 후 "열기" 클릭
   - 또는 앱 서랍에서 "Brain Dumping" 찾기

**필요한 권한:**
- ✅ 인터넷 접근 (데이터 동기화)
- ✅ 네트워크 상태 (온라인/오프라인 감지)

### 🍎 iOS 사용자

#### 방법 1: App Store에서 설치 (출시 후)
1. **App Store 열기**
2. **"Brain Dumping" 검색**
3. **받기** 버튼 클릭
4. **Apple ID 비밀번호** 또는 **Face ID/Touch ID** 인증
5. 앱 아이콘을 찾아 실행

**다운로드 링크:** (출시 후 업데이트 예정)
```
https://apps.apple.com/app/brain-dumping/idXXXXXXXXXX
```

#### 방법 2: TestFlight으로 베타 테스트 (테스트 버전)

1. **TestFlight 앱 설치**
   - App Store에서 "TestFlight" 검색 및 설치
   - 무료 Apple 공식 앱

2. **초대 링크 받기**
   - 개발자로부터 TestFlight 초대 이메일 또는 링크 받기

3. **베타 앱 설치**
   - 초대 링크 클릭
   - TestFlight 앱에서 "설치" 클릭
   - 앱이 자동으로 다운로드 및 설치됨

4. **앱 실행**
   - TestFlight에서 "테스트 시작" 또는
   - 홈 화면에서 "Brain Dumping" 아이콘 클릭

**TestFlight 특징:**
- ✅ 베타 버전 무료 테스트
- ✅ 최대 90일간 사용 가능
- ✅ 자동 업데이트 알림

---

## 💻 개발자를 위한 설치 가이드

### 사전 준비

**필수 소프트웨어:**
- ✅ Node.js (v16 이상)
- ✅ npm (v7 이상)
- ✅ Git
- ✅ Android Studio (Android 개발)
- ✅ Xcode (iOS 개발, macOS만)

---

### 📥 프로젝트 클론 및 설치

```bash
# 1. 프로젝트 클론
git clone https://github.com/jkkim74/bsTodoList.git
cd bsTodoList

# 2. 의존성 설치
npm install

# 3. 웹 앱 빌드
npm run build
```

---

### 🤖 Android 설치 (개발자 모드)

#### Step 1: Capacitor 설정

```bash
# Android 플랫폼 추가 (처음만)
npx cap add android

# 빌드 파일을 Android 프로젝트에 동기화
npx cap sync android
```

#### Step 2: Android Studio에서 실행

```bash
# Android Studio 열기
npx cap open android
```

**Android Studio에서:**

1. **에뮬레이터 또는 실기기 선택**
   - 에뮬레이터: AVD Manager에서 생성
   - 실기기: USB 디버깅 활성화 후 연결

2. **실행**
   - 상단의 녹색 "Run" 버튼 클릭 (▶️)
   - 또는 `Shift + F10`

3. **앱이 기기에 설치 및 실행됨**

#### Step 3: USB 디버깅 (실기기 사용 시)

**Android 기기에서:**
```
설정 > 휴대전화 정보 > 빌드 번호 7번 탭 (개발자 옵션 활성화)
설정 > 개발자 옵션 > USB 디버깅 활성화
```

**PC에서:**
```bash
# 기기 연결 확인
adb devices

# 앱 직접 설치 (APK가 있는 경우)
adb install app-release.apk
```

---

### 🍎 iOS 설치 (개발자 모드, macOS만)

#### Step 1: Capacitor 설정

```bash
# iOS 플랫폼 추가 (처음만)
npx cap add ios

# 빌드 파일을 iOS 프로젝트에 동기화
npx cap sync ios
```

#### Step 2: CocoaPods 설치

```bash
# CocoaPods 설치 확인
pod --version

# 없으면 설치
sudo gem install cocoapods

# iOS 디렉토리로 이동
cd ios/App

# Pod 설치
pod install

# 프로젝트 루트로 복귀
cd ../..
```

#### Step 3: Xcode에서 실행

```bash
# Xcode 열기
npx cap open ios
```

**Xcode에서:**

1. **Team 설정**
   - 프로젝트 선택 > `Signing & Capabilities`
   - Team: 개인 Apple ID 선택 (무료)
   - Automatically manage signing 체크

2. **시뮬레이터 또는 실기기 선택**
   - 상단 중앙의 기기 선택 드롭다운
   - 시뮬레이터: iPhone 14 Pro 등
   - 실기기: 연결된 iPhone/iPad

3. **실행**
   - 상단의 "▶️" 버튼 클릭
   - 또는 `Cmd + R`

4. **신뢰 설정 (실기기 사용 시)**
   ```
   iPhone: 설정 > 일반 > VPN 및 기기 관리 > 개발자 앱 > 신뢰
   ```

---

## 🧪 테스트 설치 방법

### 방법 1: 개발 빌드 (가장 빠름)

```bash
# 웹 빌드 + Capacitor 동기화 + 앱 실행 (한 번에)
npm run build && npx cap sync && npx cap run android
# 또는
npm run build && npx cap sync && npx cap run ios
```

### 방법 2: Live Reload (개발 중 실시간 업데이트)

**capacitor.config.ts 수정:**
```typescript
server: {
  url: 'http://192.168.1.100:8788',  // PC의 로컬 IP
  cleartext: true
}
```

**실행:**
```bash
# 1. 개발 서버 시작
npm run dev

# 2. 다른 터미널에서
npx cap sync
npx cap run android
# 또는
npx cap run ios
```

**장점:**
- ✅ 코드 수정 시 자동 새로고침
- ✅ 빠른 개발 사이클
- ✅ Chrome DevTools 사용 가능

### 방법 3: 프로덕션 빌드 테스트

```bash
# 1. capacitor.config.ts에서 server.url 주석 처리
# 2. 빌드
npm run build
npx cap sync

# 3. 실행
npx cap run android --prod
# 또는
npx cap run ios --prod
```

---

## 📦 APK 파일 공유 (Android)

### 개발자가 테스터에게 APK 공유하기

#### 1. APK 생성

```bash
# Android Studio에서
Build > Build Bundle(s) / APK(s) > Build APK(s)
```

**출력 위치:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### 2. APK 공유 방법

**a) 이메일/메신저로 전송**
```
app-debug.apk 파일을 첨부하여 전송
```

**b) 파일 공유 서비스 이용**
- Google Drive
- Dropbox
- OneDrive
- WeTransfer

**c) QR 코드 생성**
```bash
# APK를 웹 서버에 업로드 후
# QR 코드 생성 사이트 이용
https://www.qr-code-generator.com/
```

**d) Firebase App Distribution (권장)**
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 앱 배포
firebase appdistribution:distribute android/app/build/outputs/apk/debug/app-debug.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups testers
```

#### 3. 테스터에게 전달할 정보

```
📱 Brain Dumping 앱 테스트 초대

안녕하세요!
Brain Dumping 앱의 베타 테스트에 초대합니다.

📥 설치 방법:
1. 첨부된 APK 파일 다운로드
2. 설정 > 보안 > 알 수 없는 출처 허용
3. APK 파일 클릭하여 설치
4. 앱 실행

🧪 테스트 계정:
이메일: test@example.com
비밀번호: Test1234!

📝 피드백 부탁드립니다:
- 버그 발견 시 스크린샷과 함께 공유
- 개선 사항 제안
- 사용 경험 공유

감사합니다!
```

---

## 🧪 내부 테스트 배포

### Google Play Console - 내부 테스트

1. **Google Play Console 접속**
   - https://play.google.com/console

2. **내부 테스트 트랙 생성**
   ```
   앱 선택 > 출시 > 테스트 > 내부 테스트 > 새 버전 만들기
   ```

3. **AAB 업로드**
   ```bash
   # AAB 빌드 (Android Studio)
   Build > Generate Signed Bundle / APK > Android App Bundle
   ```
   - `app-release.aab` 업로드

4. **테스터 추가**
   ```
   테스터 > 목록 만들기 > 이메일 주소 추가
   ```

5. **내부 테스트 링크 공유**
   ```
   https://play.google.com/apps/internaltest/XXXXXXX
   ```

**장점:**
- ✅ 쉬운 배포 및 업데이트
- ✅ 최대 100명 테스터
- ✅ 즉시 승인 (검토 없음)

### TestFlight - iOS 베타 테스트

1. **App Store Connect 접속**
   - https://appstoreconnect.apple.com

2. **TestFlight 탭**
   ```
   내 앱 > Brain Dumping > TestFlight
   ```

3. **빌드 업로드**
   ```bash
   # Xcode에서
   Product > Archive > Distribute App > App Store Connect
   ```

4. **내부 테스터 추가**
   ```
   내부 테스트 > 테스터 추가 (최대 100명)
   ```

5. **외부 테스터 추가 (선택)**
   ```
   외부 테스트 > 그룹 생성 > 테스터 초대
   (Apple 검토 필요, 최대 10,000명)
   ```

6. **초대 링크 공유**
   ```
   https://testflight.apple.com/join/XXXXXXX
   ```

**장점:**
- ✅ 앱 스토어 출시 전 테스트
- ✅ 자동 업데이트
- ✅ 피드백 수집 기능

---

## 🔧 문제 해결

### Android 설치 문제

#### 1. "앱이 설치되지 않았습니다"

**원인:**
- 이전 버전 충돌
- 서명 불일치
- 저장 공간 부족

**해결:**
```bash
# 1. 기존 앱 완전 삭제
adb uninstall com.braindump.app

# 2. 재설치
adb install app-release.apk

# 3. 저장 공간 확인
# 설정 > 저장소 > 최소 100MB 이상 확보
```

#### 2. "분석을 위해 앱 전송 중"

**원인:**
- Google Play Protect 검사

**해결:**
- 몇 초~몇 분 대기
- 또는 Play Protect 비활성화 (권장하지 않음)

#### 3. USB 디버깅이 작동하지 않음

**해결:**
```bash
# ADB 서버 재시작
adb kill-server
adb start-server

# 기기 연결 확인
adb devices

# USB 케이블 교체 또는 다른 USB 포트 시도
```

### iOS 설치 문제

#### 1. "신뢰되지 않은 개발자"

**해결:**
```
설정 > 일반 > VPN 및 기기 관리 > 개발자 앱 > [개발자 이름] > 신뢰
```

#### 2. "프로비저닝 프로필이 만료됨"

**해결:**
```
Xcode > Preferences > Accounts > Apple ID 재로그인
프로젝트 > Signing & Capabilities > Automatically manage signing 체크
```

#### 3. "기기를 찾을 수 없음"

**해결:**
```bash
# Mac에서 기기 신뢰 확인
# iPhone에 "이 컴퓨터를 신뢰하시겠습니까?" 표시 시 "신뢰" 클릭

# Xcode에서
Window > Devices and Simulators > 연결된 기기 확인
```

### 일반 문제

#### 1. 앱이 충돌함

**로그 확인:**
```bash
# Android
adb logcat | grep "Brain Dumping"

# iOS (Xcode)
Window > Devices and Simulators > 기기 선택 > View Device Logs
```

#### 2. 네트워크 오류

**확인 사항:**
- ✅ 인터넷 연결 확인
- ✅ API 엔드포인트 확인 (https://webapp-tvo.pages.dev)
- ✅ 방화벽 설정 확인

#### 3. Google OAuth 로그인 안 됨

**확인 사항:**
- ✅ Google Client ID 설정 확인
- ✅ Redirect URI 등록 (https://webapp-tvo.pages.dev/api/auth/google/callback)
- ✅ Deep Link 설정 (com.braindump.app://oauth/callback)

---

## 📊 설치 확인

### 앱 설치 성공 체크리스트

- [ ] 앱 아이콘이 홈 화면에 표시됨
- [ ] 앱 실행 시 스플래시 스크린 표시
- [ ] 로그인 화면 정상 표시
- [ ] Google OAuth 로그인 작동
- [ ] 이메일 로그인 작동
- [ ] 회원가입 작동 (이메일 인증)
- [ ] 할 일 추가/수정/삭제 가능
- [ ] 오프라인 모드 작동

### 로그인 테스트

**테스트 계정:**
```
이메일: test@example.com
비밀번호: Test1234!
```

**Google OAuth 테스트:**
1. "Google 로그인" 버튼 클릭
2. In-App Browser 열림 확인
3. Google 계정 선택
4. 로그인 후 앱으로 복귀 확인
5. 메인 화면 렌더링 확인

---

## 📚 추가 리소스

### 공식 문서
- [Capacitor 설치 가이드](https://capacitorjs.com/docs/getting-started)
- [Android Studio 설치](https://developer.android.com/studio/install)
- [Xcode 설치](https://developer.apple.com/xcode/)

### 커뮤니티
- [Capacitor 포럼](https://forum.ionicframework.com/c/capacitor/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/capacitor)

### 프로젝트
- **GitHub:** https://github.com/jkkim74/bsTodoList
- **프로덕션:** https://webapp-tvo.pages.dev
- **문서:** [HYBRID_APP_DEPLOYMENT_GUIDE.md](./HYBRID_APP_DEPLOYMENT_GUIDE.md)

---

## 🎯 빠른 명령어 참조

### 개발자용 (개발 모드)
```bash
# 전체 프로세스
git clone https://github.com/jkkim74/bsTodoList.git
cd bsTodoList
npm install
npm run build

# Android
npx cap add android
npx cap sync android
npx cap run android

# iOS
npx cap add ios
npx cap sync ios
npx cap run ios
```

### 사용자용 (설치만)
```bash
# Android (APK)
adb install app-release.apk

# iOS (TestFlight)
# TestFlight 앱에서 초대 링크 클릭
```

---

**작성일:** 2026-01-20  
**작성자:** AI Assistant  
**프로젝트:** Brain Dumping TO_DO_LIST  
**버전:** v2.0.0

**문의:** 설치 중 문제가 발생하면 GitHub Issues에 등록해주세요!  
https://github.com/jkkim74/bsTodoList/issues
