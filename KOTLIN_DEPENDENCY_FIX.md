# Android Build Error Fix: Kotlin Duplicate Class

## Issue Analysis
You are encountering "Duplicate class" errors during the Android build.
```
Duplicate class kotlin.collections.jdk8.CollectionsJDK8Kt found in modules kotlin-stdlib-1.8.22.jar ... and kotlin-stdlib-jdk8-1.6.21.jar
```

**Reason:**
- Your project is pulling in **Kotlin 1.8.22** (which includes JDK7/8 support inside the main `kotlin-stdlib` artifact).
- Some other dependency (likely an older plugin) is pulling in **Kotlin 1.6.21** (specifically `kotlin-stdlib-jdk8`), which used to be a separate artifact.
- Since Kotlin 1.8, the separate `jdk8` artifact is no longer needed, but because the old version is being requested, both are included, causing duplicate classes.

## Solution

You need to force Gradle to align all Kotlin versions to `1.8.22`. This will effectively make the old `jdk8` artifact "empty" (as 1.8.22's version of it is just a pointer to the main stdlib), resolving the conflict.

### Step-by-Step Fix

1. Open your project in your local code editor.
2. Navigate to **`android/app/build.gradle`** (NOT the root `android/build.gradle`).
3. Find the `dependencies { ... }` block.
4. Add the `constraints` block shown below inside `dependencies`.

**File:** `android/app/build.gradle`

```gradle
dependencies {
    // ... existing dependencies ...
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    // ...

    // 🔥 ADD THIS BLOCK TO FIX DUPLICATE CLASS ERRORS
    constraints {
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22") {
            because("kotlin-stdlib-jdk7 is now part of kotlin-stdlib")
        }
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22") {
            because("kotlin-stdlib-jdk8 is now part of kotlin-stdlib")
        }
    }
}
```

5. **Clean and Rebuild**:
   - In Android Studio: `Build` -> `Clean Project` then `Rebuild Project`.
   - Or via command line: `./gradlew clean build` in the `android` directory.

### Alternative Method (Variables)

If the above doesn't work, try updating the `kotlinVersion` variable in **`android/variables.gradle`**:

```gradle
ext {
    // ...
    kotlinVersion = '1.8.22'
    // ...
}
```

However, the `constraints` method in `app/build.gradle` is usually more effective for transitive dependency conflicts.
