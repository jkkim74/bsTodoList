# 📱 Brain Dumping TO-DO-LIST 알림 기능 설계

## 🎯 목표
사용자에게 적시에 리마인더를 제공하여 작업 완료율과 앱 사용률 향상

---

## ⚠️ Cloudflare Workers 환경 제약사항

### 불가능한 것들
❌ **백그라운드 프로세스**: 지속적인 백그라운드 서버 실행 불가
❌ **Node.js Cron**: `node-cron` 등 Node.js 크론 라이브러리 사용 불가
❌ **Web Socket**: 실시간 푸시 연결 유지 불가
❌ **FCM 서버**: Firebase Cloud Messaging 서버 직접 구동 불가

### 가능한 것들 (우리의 접근 방법)
✅ **Cron Triggers**: Cloudflare Workers의 스케줄된 이벤트
✅ **Web Push API**: 브라우저 네이티브 푸시 알림 (Service Worker)
✅ **Email 알림**: SMTP API (SendGrid, Resend 등)
✅ **인앱 알림**: 앱 내부 알림 배너/모달

---

## 📋 구현 전략

### Phase 1: 인앱 알림 시스템 (즉시 구현 가능) ⭐ 추천
가장 간단하고 효과적인 방법

**특징**:
- 앱을 열면 즉시 표시되는 알림
- 추가 서비스 불필요
- 완전한 제어 가능

**구현 방법**:
1. 알림 설정 DB 테이블 생성
2. 로그인 시 알림 조건 체크
3. 조건 충족 시 알림 배너/모달 표시

**알림 종류**:
- 🌅 "오늘의 TOP 3를 선정하세요!" (아침)
- 🎯 "아직 작업 중인 TOP 3가 있어요!" (오후)
- 📝 "하루 회고를 작성해보세요!" (저녁)
- 🎯 "이번 주 목표 진행률: 67%" (주간)

---

### Phase 2: 웹 푸시 알림 (고급)
브라우저가 닫혀 있어도 알림 가능

**특징**:
- 브라우저 네이티브 알림
- Service Worker 필요
- HTTPS 필수

**제약사항**:
- Cloudflare Workers에서 직접 푸시 불가
- 외부 서비스 필요 (예: OneSignal, Pusher)
- 또는 Cloudflare Durable Objects (유료)

**구현 복잡도**: 높음 (외부 서비스 통합 필요)

---

### Phase 3: 이메일 알림
가장 안정적이지만 즉시성 낮음

**특징**:
- 확실한 도달률
- 외부 SMTP API 필요 (SendGrid, Resend 등)
- 비용 발생 (무료 티어 존재)

**구현 복잡도**: 중간 (API 통합)

---

## 🎨 Phase 1 구현: 인앱 알림 시스템 (선택)

### 1. 데이터베이스 스키마

```sql
-- 사용자 알림 설정
CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id INTEGER PRIMARY KEY,
  morning_reminder BOOLEAN DEFAULT TRUE,
  afternoon_reminder BOOLEAN DEFAULT TRUE,
  evening_review_reminder BOOLEAN DEFAULT TRUE,
  weekly_goal_reminder BOOLEAN DEFAULT TRUE,
  morning_time TEXT DEFAULT '09:00',
  afternoon_time TEXT DEFAULT '15:00',
  evening_time TEXT DEFAULT '21:00',
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 알림 로그 (선택적)
CREATE TABLE IF NOT EXISTS notification_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL,
  shown_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  dismissed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### 2. 알림 로직

```javascript
// src/utils/notifications.js

export function shouldShowMorningReminder(user, tasks, currentTime) {
  // 조건: 오전이고, TOP 3가 비어있음
  const hour = new Date(currentTime).getHours()
  const hasTop3 = tasks.some(task => task.is_top3)
  
  return hour >= 6 && hour < 12 && !hasTop3
}

export function shouldShowAfternoonReminder(user, tasks, currentTime) {
  // 조건: 오후이고, TOP 3 중 미완료 작업 있음
  const hour = new Date(currentTime).getHours()
  const incompleteTasks = tasks.filter(
    task => task.is_top3 && task.status !== 'COMPLETED'
  )
  
  return hour >= 12 && hour < 18 && incompleteTasks.length > 0
}

export function shouldShowEveningReminder(user, review, currentTime) {
  // 조건: 저녁이고, 회고 미작성
  const hour = new Date(currentTime).getHours()
  
  return hour >= 18 && !review
}

export function shouldShowWeeklyGoalReminder(goals) {
  // 조건: 주간 목표가 없거나 진행률 낮음
  if (!goals || goals.length === 0) return true
  
  const avgProgress = goals.reduce((sum, g) => sum + g.progress_rate, 0) / goals.length
  return avgProgress < 30
}
```

### 3. 프론트엔드 알림 컴포넌트

```javascript
// public/static/app.js

function renderNotificationBanner(notification) {
  const banner = document.createElement('div')
  banner.className = 'notification-banner fade-in'
  banner.innerHTML = `
    <div class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 rounded-lg shadow-lg mb-4">
      <div class="flex items-center space-x-3">
        <div class="text-3xl">${notification.icon}</div>
        <div>
          <div class="font-bold text-gray-800">${notification.title}</div>
          <div class="text-sm text-gray-600">${notification.message}</div>
        </div>
      </div>
      <div class="flex space-x-2">
        ${notification.action ? `
          <button onclick="${notification.action}" class="btn btn-primary text-sm">
            ${notification.actionLabel}
          </button>
        ` : ''}
        <button onclick="dismissNotification('${notification.id}')" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `
  return banner
}

// 알림 체크 (앱 로드 시)
async function checkAndShowNotifications() {
  const notifications = []
  
  // 오늘의 데이터 로드
  const tasks = await loadTasks()
  const review = await loadReview()
  const goals = await loadWeeklyGoals()
  
  const currentTime = new Date()
  const hour = currentTime.getHours()
  
  // 아침 알림: TOP 3 선정
  if (hour >= 6 && hour < 12) {
    const hasTop3 = tasks.some(task => task.is_top3)
    if (!hasTop3) {
      notifications.push({
        id: 'morning-top3',
        icon: '🌅',
        title: '좋은 아침입니다!',
        message: '오늘의 TOP 3를 선정하고 하루를 시작하세요!',
        action: 'scrollToTop3Section()',
        actionLabel: 'TOP 3 선정하기'
      })
    }
  }
  
  // 오후 알림: TOP 3 진행 상황
  if (hour >= 12 && hour < 18) {
    const incompleteTasks = tasks.filter(
      task => task.is_top3 && task.status !== 'COMPLETED'
    )
    if (incompleteTasks.length > 0) {
      notifications.push({
        id: 'afternoon-progress',
        icon: '🎯',
        title: 'TOP 3 진행 상황',
        message: `아직 ${incompleteTasks.length}개의 TOP 3 작업이 남아있어요!`,
        action: 'scrollToTop3Section()',
        actionLabel: '확인하기'
      })
    }
  }
  
  // 저녁 알림: 회고 작성
  if (hour >= 18 && hour < 24) {
    if (!review) {
      notifications.push({
        id: 'evening-review',
        icon: '📝',
        title: '하루를 마무리하세요',
        message: '오늘 하루를 돌아보고 회고를 작성해보세요!',
        action: 'showReviewModal()',
        actionLabel: '회고 작성하기'
      })
    }
  }
  
  // 주간 목표 알림
  if (goals.length === 0 || goals.every(g => g.progress_rate < 30)) {
    notifications.push({
      id: 'weekly-goal',
      icon: '🎯',
      title: '이번 주 목표를 확인하세요',
      message: '주간 목표 진행률이 낮습니다. 오늘 조금만 더 노력해보세요!',
      action: 'toggleWeeklyGoals()',
      actionLabel: '목표 확인하기'
    })
  }
  
  // 알림 표시
  const container = document.getElementById('notifications-container')
  notifications.forEach(notification => {
    container.appendChild(renderNotificationBanner(notification))
  })
}

function dismissNotification(id) {
  // LocalStorage에 dismissed 기록
  const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '{}')
  dismissed[id] = new Date().toISOString()
  localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed))
  
  // UI에서 제거
  event.target.closest('.notification-banner').remove()
}
```

---

## 🎨 Phase 2 구현: 웹 푸시 알림 (고급 - 선택적)

### 필요한 것
1. **Service Worker** (`public/sw.js`)
2. **VAPID Keys** (Web Push 인증)
3. **외부 푸시 서비스** (OneSignal 추천 - 무료)

### OneSignal 통합 예시

```javascript
// public/static/app.js

// OneSignal 초기화
window.OneSignal = window.OneSignal || [];
OneSignal.push(function() {
  OneSignal.init({
    appId: "YOUR_ONESIGNAL_APP_ID",
    notifyButton: {
      enable: true,
    },
  });
});

// 알림 권한 요청
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      console.log('Notification permission granted')
    }
  }
}

// 푸시 알림 전송 (백엔드에서 호출)
async function sendPushNotification(userId, message) {
  // OneSignal REST API 호출
  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic YOUR_API_KEY'
    },
    body: JSON.stringify({
      app_id: 'YOUR_APP_ID',
      filters: [{ field: 'tag', key: 'user_id', value: userId }],
      contents: { en: message }
    })
  })
}
```

**단점**:
- 외부 서비스 의존성
- 복잡한 설정
- HTTPS 필수

---

## 📊 추천 구현 순서

### ✅ Phase 1: 인앱 알림 (즉시 시작) - **추천**
1. DB 스키마 추가 (`user_notification_settings`)
2. 알림 설정 UI 구현
3. 알림 로직 구현 (프론트엔드)
4. 알림 배너 컴포넌트 구현

**예상 시간**: 2~3시간
**복잡도**: 낮음
**효과**: 즉시 사용 가능

### 🔶 Phase 2: 웹 푸시 알림 (선택적)
1. OneSignal 가입 및 설정
2. Service Worker 구현
3. 푸시 알림 권한 요청 UI
4. 백엔드 푸시 전송 API

**예상 시간**: 4~6시간
**복잡도**: 높음
**효과**: 브라우저 닫혀도 알림 가능

### 🔶 Phase 3: 이메일 알림 (선택적)
1. SendGrid/Resend API 키 발급
2. 이메일 템플릿 제작
3. Cloudflare Cron Trigger 설정
4. 이메일 전송 API 구현

**예상 시간**: 3~4시간
**복잡도**: 중간
**효과**: 확실한 도달

---

## 💡 최종 추천

### 🎯 우선순위 1: **인앱 알림 시스템**
- 빠른 구현
- 추가 비용 없음
- 완전한 제어
- 즉시 효과 있음

### 🎯 우선순위 2: **웹 푸시 알림** (원하는 경우)
- 더 나은 사용자 경험
- 외부 서비스 필요
- 설정 복잡

---

## 🤔 어떤 방식으로 진행할까요?

**Option A**: 인앱 알림만 구현 (빠르고 간단) ⭐ **추천**
**Option B**: 인앱 알림 + 웹 푸시 알림 (완전한 기능)
**Option C**: 인앱 알림 + 이메일 알림 (안정적)

어떤 방식으로 진행하시겠습니까?
