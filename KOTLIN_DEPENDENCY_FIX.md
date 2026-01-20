# 🔧 Kotlin 의존성 충돌 해결 가이드

## 📋 문제 요약

### 🔴 오류 메시지
```
Duplicate class kotlin.collections.jdk8.CollectionsJDK8Kt found in modules 
kotlin-stdlib-1.8.22.jar (org.jetbrains.kotlin:kotlin-stdlib:1.8.22) and 
kotlin-stdlib-jdk8-1.6.21.jar (org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.6.21)
```

### 🔍 근본 원인
- **Kotlin stdlib 버전 충돌**
  - `kotlin-stdlib:1.8.22` ✅ (최신)
  - `kotlin-stdlib-jdk7:1.6.21` ❌ (구버전)
  - `kotlin-stdlib-jdk8:1.6.21` ❌ (구버전)

- **문제점:**
  - Kotlin 1.8+에서는 `kotlin-stdlib-jdk7`과 `kotlin-stdlib-jdk8`이 `kotlin-stdlib`에 통합됨
  - 구버전 의존성이 중복 클래스를 발생시킴

---

## ✅ 해결 방법

### 1️⃣ Android 플랫폼 추가 (아직 안 했다면)

```powershell
cd C:\Users\user\StudioProjects\bsTodoList
npx cap add android
```

### 2️⃣ `android/build.gradle` 수정

**파일 위치:** `android/build.gradle`

```gradle
buildscript {
    ext {
        // ✅ Kotlin 버전 통일
        kotlinVersion = '1.9.0'  // 최신 안정 버전
    }
    
    repositories {
        google()
        mavenCentral()
    }
    
    dependencies {
        classpath 'com.android.tools.build:gradle:8.9.1'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion"
    }
}
```

### 3️⃣ `android/app/build.gradle` 수정

**파일 위치:** `android/app/build.gradle`

#### 📍 Option 1: 의존성 해상도 강제 (권장)

```gradle
android {
    compileSdk 36
    
    defaultConfig {
        applicationId "com.braindump.app"
        minSdk 22
        targetSdk 36
        versionCode 1
        versionName "1.0"
    }
}

// ✅ Kotlin stdlib 버전 통일
configurations.all {
    resolutionStrategy {
        force 'org.jetbrains.kotlin:kotlin-stdlib:1.9.0'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.0'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.0'
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation project(':capacitor-android')
    implementation project(':capacitor-cordova-android-plugins')
    
    // ✅ 명시적으로 최신 Kotlin stdlib 사용
    implementation 'org.jetbrains.kotlin:kotlin-stdlib:1.9.0'
}
```

#### 📍 Option 2: 구버전 의존성 제외

```gradle
dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation project(':capacitor-android')
    implementation project(':capacitor-cordova-android-plugins')
    
    // ✅ 최신 Kotlin stdlib 사용
    implementation 'org.jetbrains.kotlin:kotlin-stdlib:1.9.0'
    
    // ❌ 구버전 제외
    configurations.all {
        exclude group: 'org.jetbrains.kotlin', module: 'kotlin-stdlib-jdk7'
        exclude group: 'org.jetbrains.kotlin', module: 'kotlin-stdlib-jdk8'
    }
}
```

### 4️⃣ Gradle 동기화 및 빌드

```powershell
cd C:\Users\user\StudioProjects\bsTodoList\android

# 1️⃣ 캐시 정리
.\gradlew clean

# 2️⃣ 의존성 확인
.\gradlew dependencies --configuration debugRuntimeClasspath | Select-String "kotlin-stdlib"

# 3️⃣ 빌드
.\gradlew assembleDebug
```

---

## 🎯 빠른 해결 (권장)

### 📂 `android/build.gradle`

```gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 22
        compileSdkVersion = 36
        targetSdkVersion = 36
        androidxAppCompatVersion = "1.7.0"
        androidxCoreVersion = "1.15.0"
        androidxMaterialVersion = "1.12.0"
        androidxBrowserVersion = "1.9.0"
        coreSplashScreenVersion = "1.0.1"
        androidxWebkitVersion = "1.12.1"
        junitVersion = "4.13.2"
        androidxJunitVersion = "1.2.1"
        androidxEspressoCoreVersion = "3.6.1"
        cordovaAndroidVersion = "10.1.1"
        
        // ✅ Kotlin 버전 추가
        kotlinVersion = '1.9.0'
    }
    
    repositories {
        google()
        mavenCentral()
    }
    
    dependencies {
        classpath 'com.android.tools.build:gradle:8.9.1'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion"
    }
}
```

### 📂 `android/app/build.gradle`

파일 **맨 아래**에 추가:

```gradle
// ✅ Kotlin stdlib 버전 통일 (맨 아래 추가)
configurations.all {
    resolutionStrategy {
        force 'org.jetbrains.kotlin:kotlin-stdlib:1.9.0'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.0'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.0'
    }
}
```

---

## 🔍 검증 방법

### 1️⃣ 의존성 트리 확인

```powershell
cd android
.\gradlew app:dependencies --configuration debugRuntimeClasspath | Select-String "kotlin-stdlib"
```

**예상 출력:**
```
+--- org.jetbrains.kotlin:kotlin-stdlib:1.9.0
```

### 2️⃣ 빌드 성공 확인

```powershell
.\gradlew assembleDebug
```

**예상 출력:**
```
BUILD SUCCESSFUL in 45s
124 actionable tasks: 124 executed
```

### 3️⃣ APK 생성 확인

```powershell
dir app\build\outputs\apk\debug\app-debug.apk
```

---

## 🚨 추가 문제 해결

### 문제 1: 여전히 중복 클래스 오류

**해결책: Gradle 캐시 완전 정리**

```powershell
# Android 프로젝트 캐시 정리
cd android
.\gradlew clean
.\gradlew cleanBuildCache

# Gradle 캐시 정리
cd ..
rmdir .gradle -Recurse -Force
rmdir android\.gradle -Recurse -Force
rmdir android\app\.cxx -Recurse -Force

# 재빌드
cd android
.\gradlew assembleDebug
```

### 문제 2: Gradle 버전 호환성 문제

**해결책: Gradle Wrapper 업데이트**

```powershell
cd android
.\gradlew wrapper --gradle-version=8.7

# 재빌드
.\gradlew clean
.\gradlew assembleDebug
```

### 문제 3: Kotlin 플러그인 버전 불일치

**파일:** `android/build.gradle`

```gradle
buildscript {
    ext {
        kotlinVersion = '1.9.0'  // ✅ 명시적 버전 지정
    }
    
    dependencies {
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion"
    }
}

// ✅ 모든 프로젝트에 Kotlin 버전 강제
allprojects {
    configurations.all {
        resolutionStrategy {
            force "org.jetbrains.kotlin:kotlin-stdlib:$kotlinVersion"
        }
    }
}
```

---

## 📝 완전한 수정 파일 예시

### 📂 `android/build.gradle`

```gradle
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 22
        compileSdkVersion = 36
        targetSdkVersion = 36
        androidxAppCompatVersion = "1.7.0"
        androidxCoreVersion = "1.15.0"
        androidxMaterialVersion = "1.12.0"
        androidxBrowserVersion = "1.9.0"
        coreSplashScreenVersion = "1.0.1"
        androidxWebkitVersion = "1.12.1"
        junitVersion = "4.13.2"
        androidxJunitVersion = "1.2.1"
        androidxEspressoCoreVersion = "3.6.1"
        cordovaAndroidVersion = "10.1.1"
        kotlinVersion = '1.9.0'  // ✅ 추가
    }

    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:8.9.1'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion"  // ✅ 추가
    }
}

apply from: "variables.gradle"

allprojects {
    repositories {
        google()
        mavenCentral()
    }
    
    // ✅ Kotlin 버전 통일
    configurations.all {
        resolutionStrategy {
            force "org.jetbrains.kotlin:kotlin-stdlib:$kotlinVersion"
        }
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
```

### 📂 `android/app/build.gradle`

기존 파일 **맨 아래**에 추가:

```gradle
// ... 기존 코드 ...

// ✅ Kotlin stdlib 버전 통일
configurations.all {
    resolutionStrategy {
        force 'org.jetbrains.kotlin:kotlin-stdlib:1.9.0'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.0'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.0'
    }
}
```

---

## 🎉 완료 후 확인 사항

### ✅ 체크리스트

- [ ] `android/build.gradle`에 `kotlinVersion` 추가
- [ ] `android/app/build.gradle`에 `resolutionStrategy` 추가
- [ ] `.\gradlew clean` 실행
- [ ] `.\gradlew assembleDebug` 빌드 성공
- [ ] `app-debug.apk` 생성 확인
- [ ] Android Studio에서 앱 실행 성공

### ✅ 예상 결과

```
BUILD SUCCESSFUL in 45s
124 actionable tasks: 124 executed

app-debug.apk generated at:
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📚 관련 문서

- [CAPACITOR_PLATFORM_SETUP_GUIDE.md](./CAPACITOR_PLATFORM_SETUP_GUIDE.md)
- [ANDROID_BUILD_FIX.md](./ANDROID_BUILD_FIX.md)
- [HYBRID_APP_DEPLOYMENT_GUIDE.md](./HYBRID_APP_DEPLOYMENT_GUIDE.md)

---

## 🔗 참고 자료

- [Kotlin stdlib migration](https://kotlinlang.org/docs/whatsnew18.html#usage-of-the-latest-kotlin-stdlib-version-in-transitive-dependencies)
- [Android Gradle Plugin 8.9.1](https://developer.android.com/build/releases/gradle-plugin)
- [Gradle Dependency Resolution](https://docs.gradle.org/current/userguide/dependency_resolution.html)

---

## 🔗 GitHub Repository

https://github.com/jkkim74/bsTodoList

---

## 📅 작성일

2025-01-20

---

## ✅ 다음 단계

### 로컬 PC에서 실행:

```powershell
cd C:\Users\user\StudioProjects\bsTodoList

# 1️⃣ Android 플랫폼 추가 (아직 안 했다면)
npx cap add android

# 2️⃣ build.gradle 파일 수정 (위 내용대로)
# - android/build.gradle
# - android/app/build.gradle

# 3️⃣ 빌드
cd android
.\gradlew clean
.\gradlew assembleDebug

# 4️⃣ Android Studio 실행
cd ..
npx cap open android
```

**테스트 후 결과를 알려주세요!** 🚀
