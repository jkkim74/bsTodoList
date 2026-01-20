# 🔧 Android 빌드 오류 해결 가이드

## 🔴 문제 상황

```
Dependency 'androidx.browser:browser:1.9.0' requires:
1. compileSdk 36 or later (현재: 35)
2. Android Gradle Plugin 8.9.1 or higher (현재: 8.7.2)
```

**원인:** `@capacitor/browser` 플러그인이 최신 버전을 사용하여 더 높은 Android API 레벨이 필요합니다.

---

## ✅ 해결 방법

### 방법 1: Gradle 및 SDK 버전 업데이트 (권장)

#### Step 1: `build.gradle` 파일 수정

**파일 위치:** `android/build.gradle`

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        // 🔥 Android Gradle Plugin 버전 업데이트
        classpath 'com.android.tools.build:gradle:8.9.1'
        classpath 'com.google.gms:google-services:4.4.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
```

#### Step 2: `app/build.gradle` 파일 수정

**파일 위치:** `android/app/build.gradle`

```gradle
android {
    namespace "com.braindump.app"
    
    // 🔥 compileSdk 36으로 업데이트
    compileSdk 36
    
    defaultConfig {
        applicationId "com.braindump.app"
        minSdk 22
        // 🔥 targetSdk도 36으로 업데이트 (선택)
        targetSdk 36
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation "androidx.appcompat:appcompat:1.7.0"
    implementation "androidx.coordinatorlayout:coordinatorlayout:1.2.0"
    implementation "androidx.core:core-splashscreen:1.0.1"
    testImplementation "junit:junit:4.13.2"
    androidTestImplementation "androidx.test.ext:junit:1.2.1"
    androidTestImplementation "androidx.test.espresso:espresso-core:3.6.1"
    implementation project(':capacitor-android')
    implementation project(':capacitor-cordova-android-plugins')
}

apply from: 'capacitor.build.gradle'

try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
```

#### Step 3: Android SDK 설치

**Android Studio에서:**

1. **Tools > SDK Manager** 열기
2. **SDK Platforms** 탭
   - ✅ Android 15.0 (API 36) 체크
   - ✅ Apply 클릭
3. **SDK Tools** 탭
   - ✅ Android SDK Build-Tools 36
   - ✅ Apply 클릭

#### Step 4: Gradle Wrapper 업데이트 (선택)

**파일 위치:** `android/gradle/wrapper/gradle-wrapper.properties`

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.9-all.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

#### Step 5: 빌드 재시도

```bash
cd android

# Gradle 캐시 정리
./gradlew clean

# 디버그 빌드
./gradlew assembleDebug

# 또는 릴리즈 빌드
./gradlew assembleRelease
```

---

### 방법 2: `@capacitor/browser` 버전 다운그레이드 (임시)

만약 Android SDK 36을 설치할 수 없는 경우, 플러그인 버전을 낮춥니다.

#### Step 1: `package.json` 수정

```json
{
  "dependencies": {
    "@capacitor/browser": "^6.0.0"
  }
}
```

#### Step 2: 재설치

```bash
# 프로젝트 루트에서
npm uninstall @capacitor/browser
npm install @capacitor/browser@^6.0.0

# Capacitor 동기화
npx cap sync android
```

#### Step 3: 빌드

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

---

## 📝 전체 수정 스크립트

로컬 PC에서 실행 (PowerShell):

```powershell
# 위치: C:\Users\user\StudioProjects\bsTodoList

# 1. build.gradle 백업
Copy-Item android\build.gradle android\build.gradle.backup
Copy-Item android\app\build.gradle android\app\build.gradle.backup

# 2. Android Studio에서 SDK 36 설치
# Tools > SDK Manager > Android 15.0 (API 36) 체크 > Apply

# 3. Gradle 정리 및 재빌드
cd android
.\gradlew clean
.\gradlew assembleDebug

# 4. 성공 확인
# BUILD SUCCESSFUL 메시지 확인
```

---

## 🎯 권장 설정값

### `android/build.gradle`
```gradle
classpath 'com.android.tools.build:gradle:8.9.1'
```

### `android/app/build.gradle`
```gradle
compileSdk 36
targetSdk 36
minSdk 22
```

### `android/gradle/wrapper/gradle-wrapper.properties`
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.9-all.zip
```

---

## 🐛 추가 문제 해결

### 1. "SDK location not found"

**해결:**
```bash
# android/local.properties 생성
echo "sdk.dir=C:\\Users\\user\\AppData\\Local\\Android\\Sdk" > android\local.properties
```

### 2. "Unsupported Java version"

**해결:**
```bash
# Java 17 설치 확인
java -version

# Android Studio에서
File > Settings > Build, Execution, Deployment > Build Tools > Gradle
> Gradle JDK: Java 17 선택
```

### 3. "Cannot resolve symbol 'R'"

**해결:**
```bash
cd android
.\gradlew clean
# Android Studio > File > Invalidate Caches / Restart
```

### 4. Gradle Daemon 오류

**해결:**
```bash
cd android
.\gradlew --stop
.\gradlew clean assembleDebug
```

---

## ✅ 빌드 성공 확인

빌드가 성공하면 다음과 같은 메시지가 표시됩니다:

```
BUILD SUCCESSFUL in 45s
124 actionable tasks: 124 executed

출력 위치:
android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 🚀 다음 단계

### 1. APK 설치 테스트

```bash
# 실기기/에뮬레이터에 설치
adb install android\app\build\outputs\apk\debug\app-debug.apk

# 또는 Android Studio에서
# Run > Run 'app' (Shift + F10)
```

### 2. Google OAuth 테스트

1. 앱 실행
2. "Google 로그인" 버튼 클릭
3. In-App Browser 열리는지 확인
4. Google 로그인 후 앱으로 복귀 확인

---

## 📚 참고 자료

- [Android Gradle Plugin Release Notes](https://developer.android.com/studio/releases/gradle-plugin)
- [Android API Levels](https://developer.android.com/studio/releases/platforms)
- [Capacitor Android Configuration](https://capacitorjs.com/docs/android/configuration)

---

**작성일:** 2026-01-20  
**문제:** Android Gradle Plugin & compileSdk 버전 불일치  
**해결:** AGP 8.9.1 + compileSdk 36 업데이트
