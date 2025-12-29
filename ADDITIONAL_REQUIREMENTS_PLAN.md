# 📋 Brain Dumping TO-DO-LIST 추가 요구사항 구현 계획

## 🎯 요구사항 정리

### 1️⃣ 분류된 항목 수정 기능
**현재 상태**: 한번 분류하면 수정 불가  
**요구사항**: 우선순위, 제목, 설명, 시간대 등을 수정할 수 있어야 함

### 2️⃣ 일별/주별/월별 추적 기능
**현재 상태**: 오늘 날짜만 조회 가능  
**요구사항**: 
- 일별: 날짜별 작업 완료 현황
- 주별: 주간 통계 및 트렌드
- 월별: 월간 생산성 분석

### 3️⃣ 미완료 아이템 관리
**현재 상태**: 모든 항목 표시, 날짜 추적 없음  
**요구사항**:
- 미완료 항목만 필터링
- 생성일자 표시
- 마감일(목표 완료일) 설정 기능
- 지연된 항목 하이라이트

---

## 🏗️ 기술 설계

### 📊 DB 스키마 변경

#### 1. daily_tasks 테이블 수정
```sql
-- 기존 테이블에 컬럼 추가
ALTER TABLE daily_tasks ADD COLUMN due_date DATE;
ALTER TABLE daily_tasks ADD COLUMN completed_at DATETIME;

-- 인덱스 추가 (쿼리 성능 향상)
CREATE INDEX idx_tasks_status ON daily_tasks(status);
CREATE INDEX idx_tasks_due_date ON daily_tasks(due_date);
CREATE INDEX idx_tasks_completed_at ON daily_tasks(completed_at);
```

#### 2. 통계 뷰 생성 (선택적)
```sql
-- 일별 통계 뷰
CREATE VIEW IF NOT EXISTS daily_stats AS
SELECT 
  user_id,
  task_date,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
  SUM(CASE WHEN is_top3 = TRUE THEN 1 ELSE 0 END) as top3_tasks,
  SUM(CASE WHEN is_top3 = TRUE AND status = 'COMPLETED' THEN 1 ELSE 0 END) as top3_completed
FROM daily_tasks
GROUP BY user_id, task_date;
```

---

## 🎨 UI/UX 설계

### 1️⃣ 분류된 항목 수정 기능

#### UI 위치
각 작업 항목에 **"수정" 버튼** 추가 (편집 아이콘)

```
┌─────────────────────────────────────────┐
│ 🔴 긴급·중요                              │
│ ┌─────────────────────────────────────┐ │
│ │ ☐ 프로젝트 A 마감   [✏️ 수정] [🗑️ 삭제] │ │
│ │ 오늘 17:00까지 완료                   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### 수정 모달
```
┌────────────── 작업 수정 ──────────────┐
│                                        │
│ 제목: [프로젝트 A 마감______________]  │
│                                        │
│ 설명: [상세 내용___________________]  │
│       [____________________________]  │
│                                        │
│ 우선순위:                              │
│  ○ 긴급·중요  ○ 중요  ○ 나중에  ○ 내려놓기 │
│                                        │
│ 시간대:                                │
│  ○ 아침  ○ 오전  ○ 오후  ○ 저녁        │
│                                        │
│ 마감일: [2025-12-25______] (선택)     │
│                                        │
│ [취소]                    [저장하기]   │
└────────────────────────────────────────┘
```

---

### 2️⃣ 일별/주별/월별 추적 대시보드

#### 네비게이션 추가
헤더에 **"통계"** 탭 추가

```
┌─────────────────────────────────────────┐
│ 🧠 Brain Dump  [오늘] [통계📊] [로그아웃]  │
└─────────────────────────────────────────┘
```

#### 통계 페이지 레이아웃

```
┌──────────── 📊 생산성 통계 ────────────┐
│                                        │
│ [일별] [주별] [월별]  ← 탭              │
│                                        │
│ ━━━━━━ 일별 보기 (선택) ━━━━━━━━━━━━   │
│                                        │
│ 📅 2025년 12월                         │
│ ◀ [15] [16] [17] [18] [19] [20] [21] ▶│
│                                        │
│ ┌─── 12월 22일 (일) ────────────────┐  │
│ │ 📊 완료율: 75% (3/4)               │  │
│ │ ⭐ TOP 3 완료: 2/3                 │  │
│ │ ✅ 완료한 작업:                    │  │
│ │   • 프로젝트 A 마감                │  │
│ │   • 이메일 답장                    │  │
│ │   • 주간 보고서 작성               │  │
│ │ ⏳ 미완료:                         │  │
│ │   • 회의 준비                      │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ━━━━━━ 주별 보기 ━━━━━━━━━━━━━━━━━━   │
│                                        │
│ 📅 12월 3주차 (12/16 ~ 12/22)         │
│                                        │
│ 📈 주간 완료율 추이                    │
│ ┌─────────────────────────────────┐   │
│ │ 80% ▓▓▓▓▓▓▓▓░░                  │   │
│ │ 60% ▓▓▓▓▓▓▓▓▓▓                  │   │
│ │ 40% ▓▓▓▓▓▓▓▓▓▓▓▓                │   │
│ │ 20% ▓▓▓▓▓▓▓▓▓▓▓▓▓▓              │   │
│ │      월 화 수 목 금 토 일         │   │
│ └─────────────────────────────────┘   │
│                                        │
│ 📊 주간 통계                           │
│ • 총 작업: 28개                        │
│ • 완료: 21개 (75%)                     │
│ • TOP 3 달성률: 85%                    │
│ • 가장 생산적인 날: 금요일 (90%)       │
│                                        │
│ ━━━━━━ 월별 보기 ━━━━━━━━━━━━━━━━━━   │
│                                        │
│ 📅 2025년 12월                         │
│                                        │
│ 📊 월간 요약                           │
│ • 총 작업일: 22일                      │
│ • 평균 완료율: 72%                     │
│ • 총 완료 작업: 156개                  │
│ • TOP 3 달성률: 80%                    │
│                                        │
│ 📈 월간 완료율 추이                    │
│ [그래프 표시]                          │
│                                        │
│ 🏆 이번 달 성과                        │
│ • 최고 완료율: 12/15 (95%)             │
│ • 연속 작업일: 7일                     │
│ • 주간 목표 달성: 3/4주                │
└────────────────────────────────────────┘
```

---

### 3️⃣ 미완료 아이템 필터 및 관리

#### 필터 토글 버튼
각 STEP 섹션에 필터 추가

```
┌──── STEP 2: 분류하기 ────────────────┐
│                                      │
│ [전체 보기] [미완료만 보기] [완료만 보기] │
│                                      │
│ 🔴 긴급·중요                          │
│ ┌──────────────────────────────────┐ │
│ │ ☐ 프로젝트 A                      │ │
│ │ 📅 생성: 12/20  ⚠️ 마감: 12/25   │ │
│ │ ⏰ 2일 남음                        │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

#### 미완료 항목 전용 대시보드

```
┌─────── 🔍 미완료 항목 모아보기 ───────┐
│                                        │
│ 📊 요약                                │
│ • 전체 미완료: 12개                    │
│ • 오늘 마감: 3개 ⚠️                   │
│ • 지연된 항목: 2개 🔴                  │
│                                        │
│ ━━━━━━ 오늘 마감 (3) ━━━━━━━━━━━━━   │
│ ┌──────────────────────────────────┐  │
│ │ 🔴 프로젝트 A 마감                 │  │
│ │ 📅 생성: 12/20 | ⏰ 오늘 17:00    │  │
│ │ [수정] [완료 처리]                 │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ━━━━━━ 지연된 항목 (2) 🔴 ━━━━━━━━   │
│ ┌──────────────────────────────────┐  │
│ │ 🔴 주간 보고서 작성                │  │
│ │ 📅 생성: 12/15 | ⚠️ 마감: 12/20   │  │
│ │ 🔴 2일 지연                        │  │
│ │ [수정] [완료 처리] [재조정]        │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ━━━━━━ 이번 주 마감 (7) ━━━━━━━━━━   │
│ [작업 목록...]                         │
└────────────────────────────────────────┘
```

---

## 🔧 구현 상세

### 1️⃣ 분류된 항목 수정 기능

#### Backend API 수정
```typescript
// src/routes/tasks.ts

// PUT /api/tasks/:taskId - 작업 수정
tasks.put('/:taskId', async (c) => {
  try {
    const userId = c.get('userId') as number
    const taskId = parseInt(c.req.param('taskId'))
    const body = await c.req.json<TaskUpdateRequest>()
    
    const { 
      title, 
      description, 
      priority, 
      time_slot,
      due_date 
    } = body
    
    // 소유권 확인
    const existingTask = await c.env.DB.prepare(
      'SELECT task_id FROM daily_tasks WHERE task_id = ? AND user_id = ?'
    ).bind(taskId, userId).first()
    
    if (!existingTask) {
      return errorResponse(c, '작업을 찾을 수 없습니다', 404)
    }
    
    // 수정
    await c.env.DB.prepare(`
      UPDATE daily_tasks 
      SET title = ?, description = ?, priority = ?, 
          time_slot = ?, due_date = ?, updated_at = ?
      WHERE task_id = ?
    `).bind(
      title, 
      description, 
      priority, 
      time_slot || null,
      due_date || null,
      getCurrentDateTime(),
      taskId
    ).run()
    
    const updatedTask = await c.env.DB.prepare(
      'SELECT * FROM daily_tasks WHERE task_id = ?'
    ).bind(taskId).first<DailyTask>()
    
    return successResponse(c, updatedTask, '작업이 수정되었습니다')
  } catch (error) {
    console.error('Update task error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})
```

#### Frontend 수정 모달
```javascript
// public/static/app.js

function openEditTaskModal(taskId) {
  // 기존 작업 데이터 로드
  const task = tasks.find(t => t.task_id === taskId)
  
  const modal = document.createElement('div')
  modal.id = 'edit-task-modal'
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal-content max-w-lg">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-edit text-blue-500 mr-2"></i>작업 수정
          </h3>
          <button onclick="closeEditTaskModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <!-- 제목 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-heading text-blue-500 mr-1"></i>제목 *
            </label>
            <input 
              type="text" 
              id="edit-task-title" 
              value="${task.title}"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="작업 제목"
            />
          </div>
          
          <!-- 설명 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-align-left text-green-500 mr-1"></i>설명
            </label>
            <textarea 
              id="edit-task-description" 
              rows="3"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="작업 설명 (선택)"
            >${task.description || ''}</textarea>
          </div>
          
          <!-- 우선순위 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-flag text-red-500 mr-1"></i>우선순위 *
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 ${task.priority === 'URGENT_IMPORTANT' ? 'border-red-500 bg-red-50' : 'border-gray-300'}">
                <input type="radio" name="edit-priority" value="URGENT_IMPORTANT" ${task.priority === 'URGENT_IMPORTANT' ? 'checked' : ''} class="mr-2">
                <span class="text-sm font-medium">🔴 긴급·중요</span>
              </label>
              <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 ${task.priority === 'IMPORTANT' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'}">
                <input type="radio" name="edit-priority" value="IMPORTANT" ${task.priority === 'IMPORTANT' ? 'checked' : ''} class="mr-2">
                <span class="text-sm font-medium">🟡 중요</span>
              </label>
              <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 ${task.priority === 'LATER' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}">
                <input type="radio" name="edit-priority" value="LATER" ${task.priority === 'LATER' ? 'checked' : ''} class="mr-2">
                <span class="text-sm font-medium">🔵 나중에</span>
              </label>
              <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 ${task.priority === 'LET_GO' ? 'border-gray-500 bg-gray-50' : 'border-gray-300'}">
                <input type="radio" name="edit-priority" value="LET_GO" ${task.priority === 'LET_GO' ? 'checked' : ''} class="mr-2">
                <span class="text-sm font-medium">⚪ 내려놓기</span>
              </label>
            </div>
          </div>
          
          <!-- 시간대 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-clock text-purple-500 mr-1"></i>시간대 (선택)
            </label>
            <select id="edit-task-timeslot" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
              <option value="">선택 안함</option>
              <option value="MORNING" ${task.time_slot === 'MORNING' ? 'selected' : ''}>🌅 아침 (06:00-09:00)</option>
              <option value="FORENOON" ${task.time_slot === 'FORENOON' ? 'selected' : ''}>☀️ 오전 (09:00-12:00)</option>
              <option value="AFTERNOON" ${task.time_slot === 'AFTERNOON' ? 'selected' : ''}>🌤️ 오후 (12:00-18:00)</option>
              <option value="EVENING" ${task.time_slot === 'EVENING' ? 'selected' : ''}>🌙 저녁 (18:00-24:00)</option>
            </select>
          </div>
          
          <!-- 마감일 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-calendar-check text-orange-500 mr-1"></i>마감일 (선택)
            </label>
            <input 
              type="date" 
              id="edit-task-duedate" 
              value="${task.due_date || ''}"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button onclick="closeEditTaskModal()" class="flex-1 btn btn-secondary">
            취소
          </button>
          <button onclick="submitTaskUpdate(${taskId})" class="flex-1 btn btn-primary">
            <i class="fas fa-save mr-2"></i>저장
          </button>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

async function submitTaskUpdate(taskId) {
  const title = document.getElementById('edit-task-title').value.trim()
  const description = document.getElementById('edit-task-description').value.trim()
  const priority = document.querySelector('input[name="edit-priority"]:checked').value
  const time_slot = document.getElementById('edit-task-timeslot').value || null
  const due_date = document.getElementById('edit-task-duedate').value || null
  
  if (!title) {
    alert('제목을 입력해주세요')
    return
  }
  
  try {
    await axios.put(`${API_BASE}/tasks/${taskId}`, {
      title,
      description,
      priority,
      time_slot,
      due_date
    })
    
    closeEditTaskModal()
    loadDailyOverview()
    alert('작업이 수정되었습니다')
  } catch (error) {
    alert('작업 수정 실패: ' + (error.response?.data?.error || ''))
  }
}

function closeEditTaskModal() {
  document.getElementById('edit-task-modal')?.remove()
}
```

---

### 2️⃣ 통계 대시보드

#### Backend API
```typescript
// src/routes/stats.ts (신규)

import { Hono } from 'hono'
import type { Env } from '../types'
import { authMiddleware } from '../middleware/auth'
import { successResponse, errorResponse } from '../utils/response'

const stats = new Hono<{ Bindings: Env }>()

stats.use('/*', authMiddleware)

// GET /api/stats/daily?start_date=2025-12-01&end_date=2025-12-31
stats.get('/daily', async (c) => {
  try {
    const userId = c.get('userId') as number
    const startDate = c.req.query('start_date') || ''
    const endDate = c.req.query('end_date') || ''
    
    const dailyStats = await c.env.DB.prepare(`
      SELECT 
        task_date,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN is_top3 = TRUE THEN 1 ELSE 0 END) as top3_tasks,
        SUM(CASE WHEN is_top3 = TRUE AND status = 'COMPLETED' THEN 1 ELSE 0 END) as top3_completed,
        ROUND(
          CAST(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 
          2
        ) as completion_rate
      FROM daily_tasks
      WHERE user_id = ? 
        AND task_date BETWEEN ? AND ?
      GROUP BY task_date
      ORDER BY task_date DESC
    `).bind(userId, startDate, endDate).all()
    
    return successResponse(c, dailyStats.results)
  } catch (error) {
    console.error('Daily stats error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// GET /api/stats/weekly?year=2025&week=51
stats.get('/weekly', async (c) => {
  try {
    const userId = c.get('userId') as number
    const year = c.req.query('year') || new Date().getFullYear().toString()
    const week = c.req.query('week') || '1'
    
    // 주간 날짜 계산 (간단 버전)
    const startDate = c.req.query('start_date') || ''
    const endDate = c.req.query('end_date') || ''
    
    const weeklyStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
        ROUND(
          CAST(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 
          2
        ) as completion_rate,
        SUM(CASE WHEN is_top3 = TRUE THEN 1 ELSE 0 END) as top3_tasks,
        SUM(CASE WHEN is_top3 = TRUE AND status = 'COMPLETED' THEN 1 ELSE 0 END) as top3_completed
      FROM daily_tasks
      WHERE user_id = ? 
        AND task_date BETWEEN ? AND ?
    `).bind(userId, startDate, endDate).first()
    
    return successResponse(c, weeklyStats)
  } catch (error) {
    console.error('Weekly stats error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// GET /api/stats/monthly?year=2025&month=12
stats.get('/monthly', async (c) => {
  try {
    const userId = c.get('userId') as number
    const year = c.req.query('year') || new Date().getFullYear().toString()
    const month = c.req.query('month') || (new Date().getMonth() + 1).toString()
    
    const startDate = `${year}-${month.padStart(2, '0')}-01`
    const endDate = `${year}-${month.padStart(2, '0')}-31`
    
    const monthlyStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT task_date) as working_days,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
        ROUND(
          CAST(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 
          2
        ) as avg_completion_rate,
        SUM(CASE WHEN is_top3 = TRUE THEN 1 ELSE 0 END) as top3_tasks,
        SUM(CASE WHEN is_top3 = TRUE AND status = 'COMPLETED' THEN 1 ELSE 0 END) as top3_completed
      FROM daily_tasks
      WHERE user_id = ? 
        AND task_date BETWEEN ? AND ?
    `).bind(userId, startDate, endDate).first()
    
    // 일별 완료율 추이
    const dailyTrend = await c.env.DB.prepare(`
      SELECT 
        task_date,
        ROUND(
          CAST(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 
          2
        ) as completion_rate
      FROM daily_tasks
      WHERE user_id = ? 
        AND task_date BETWEEN ? AND ?
      GROUP BY task_date
      ORDER BY task_date
    `).bind(userId, startDate, endDate).all()
    
    return successResponse(c, {
      summary: monthlyStats,
      daily_trend: dailyTrend.results
    })
  } catch (error) {
    console.error('Monthly stats error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

export default stats
```

---

### 3️⃣ 미완료 항목 필터

#### Backend API
```typescript
// src/routes/tasks.ts

// GET /api/tasks/incomplete?include_overdue=true
tasks.get('/incomplete', async (c) => {
  try {
    const userId = c.get('userId') as number
    const includeOverdue = c.req.query('include_overdue') === 'true'
    
    let query = `
      SELECT * FROM daily_tasks
      WHERE user_id = ? AND status != 'COMPLETED'
    `
    
    if (includeOverdue) {
      query += ` AND (due_date IS NULL OR due_date >= date('now'))`
    }
    
    query += ` ORDER BY 
      CASE 
        WHEN due_date < date('now') THEN 0
        WHEN due_date = date('now') THEN 1
        ELSE 2
      END,
      due_date ASC,
      created_at DESC
    `
    
    const incompleteTasks = await c.env.DB.prepare(query)
      .bind(userId)
      .all()
    
    // 그룹화
    const today = new Date().toISOString().split('T')[0]
    const grouped = {
      overdue: [],
      today: [],
      upcoming: [],
      no_due_date: []
    }
    
    incompleteTasks.results.forEach(task => {
      if (!task.due_date) {
        grouped.no_due_date.push(task)
      } else if (task.due_date < today) {
        grouped.overdue.push(task)
      } else if (task.due_date === today) {
        grouped.today.push(task)
      } else {
        grouped.upcoming.push(task)
      }
    })
    
    return successResponse(c, grouped)
  } catch (error) {
    console.error('Incomplete tasks error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})
```

---

## 📋 구현 우선순위

### Phase 1: 필수 기능 (즉시 구현) ⭐
1. ✅ DB 스키마 수정 (due_date, completed_at 추가)
2. ✅ 분류된 항목 수정 기능
3. ✅ 미완료 항목 필터

**예상 시간**: 3~4시간
**복잡도**: 중간

### Phase 2: 통계 대시보드 (중요)
1. ✅ 통계 API 구현
2. ✅ 일별/주별/월별 UI
3. ✅ 차트 라이브러리 통합 (Chart.js)

**예상 시간**: 4~5시간
**복잡도**: 높음

---

## 🤔 구현 방향 선택

**Option A**: Phase 1만 구현 (빠른 배포) ⭐ 추천
- 분류 항목 수정
- 마감일 설정
- 미완료 필터

**Option B**: Phase 1 + Phase 2 전체 구현 (완전한 기능)
- 모든 기능 포함
- 통계 대시보드

**Option C**: 단계별 구현 (Phase 1 → 테스트 → Phase 2)

어떤 방식으로 진행하시겠습니까?
