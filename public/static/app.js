// Brain Dumping TO_DO_LIST Application
const API_BASE = '/api'
let currentUser = null
let currentDate = new Date().toISOString().split('T')[0]

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadAuthState()
  renderApp()
})

// Load auth state from localStorage
function loadAuthState() {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  if (token && user) {
    currentUser = JSON.parse(user)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }
}

// Save auth state
function saveAuthState(user, token) {
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('token', token)
  currentUser = user
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Clear auth state
function clearAuthState() {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  currentUser = null
  delete axios.defaults.headers.common['Authorization']
}

// Main render function
function renderApp() {
  const app = document.getElementById('app')
  if (!currentUser) {
    app.innerHTML = renderLoginPage()
  } else {
    app.innerHTML = renderMainPage()
    loadDailyOverview()
  }
}

// Login page
function renderLoginPage() {
  return `
    <div class="min-h-screen flex items-center justify-center p-4" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div class="card max-w-md w-full">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold mb-2" style="color: #2c5f2d;">
            <i class="fas fa-brain mr-2"></i>
            브레인 덤핑 TO_DO_LIST
          </h1>
          <p class="text-gray-600 text-sm">생각을 꺼내고, 정리하고, 실행하는 3단계 시스템</p>
        </div>
        
        <div id="auth-form">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">
              <i class="fas fa-envelope mr-1"></i> 이메일
            </label>
            <input type="email" id="email" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors" placeholder="test@example.com">
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">
              <i class="fas fa-lock mr-1"></i> 비밀번호
            </label>
            <input type="password" id="password" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors" placeholder="password123">
          </div>
          
          <div class="mb-6" id="username-field" style="display:none;">
            <label class="block text-gray-700 text-sm font-medium mb-2">
              <i class="fas fa-user mr-1"></i> 이름
            </label>
            <input type="text" id="username" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors" placeholder="홍길동">
          </div>
          
          <div id="error-message" class="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded hidden"></div>
          
          <button onclick="handleLogin()" id="login-btn" class="w-full btn btn-primary mb-3 py-3">
            <i class="fas fa-sign-in-alt mr-2"></i> 로그인
          </button>
          
          <button onclick="toggleSignup()" id="toggle-btn" class="w-full btn btn-secondary py-3">
            <i class="fas fa-user-plus mr-2"></i> 회원가입
          </button>
        </div>
        
        <div class="footer-note mt-6">
          <p class="font-medium mb-2"><i class="fas fa-info-circle mr-1"></i> 테스트 계정:</p>
          <p><strong>이메일:</strong> test@example.com</p>
          <p><strong>비밀번호:</strong> password123</p>
        </div>
      </div>
    </div>
  `
}

let isSignupMode = false

function toggleSignup() {
  isSignupMode = !isSignupMode
  const usernameField = document.getElementById('username-field')
  const loginBtn = document.getElementById('login-btn')
  const toggleBtn = document.getElementById('toggle-btn')
  
  if (isSignupMode) {
    usernameField.style.display = 'block'
    loginBtn.textContent = '회원가입'
    loginBtn.onclick = handleSignup
    toggleBtn.textContent = '로그인'
  } else {
    usernameField.style.display = 'none'
    loginBtn.textContent = '로그인'
    loginBtn.onclick = handleLogin
    toggleBtn.textContent = '회원가입'
  }
}

async function handleLogin() {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const errorDiv = document.getElementById('error-message')
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password })
    const { data } = response.data
    saveAuthState(data, data.token)
    renderApp()
  } catch (error) {
    errorDiv.textContent = error.response?.data?.error || '로그인 실패'
    errorDiv.classList.remove('hidden')
  }
}

async function handleSignup() {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const username = document.getElementById('username').value
  const errorDiv = document.getElementById('error-message')
  
  if (!username) {
    errorDiv.textContent = '이름을 입력해주세요'
    errorDiv.classList.remove('hidden')
    return
  }
  
  try {
    const response = await axios.post(`${API_BASE}/auth/signup`, { email, password, username })
    const { data } = response.data
    saveAuthState(data, data.token)
    renderApp()
  } catch (error) {
    errorDiv.textContent = error.response?.data?.error || '회원가입 실패'
    errorDiv.classList.remove('hidden')
  }
}

function handleLogout() {
  clearAuthState()
  renderApp()
}

// Main page
function renderMainPage() {
  const today = new Date(currentDate)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dayName = dayNames[today.getDay()]
  
  return `
    <div class="min-h-screen" style="background-color: #f8f9fa;">
      <!-- Header -->
      <nav class="bg-white shadow-sm mb-4 md:mb-6" style="border-bottom: 3px solid #2c5f2d;">
        <div class="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <!-- Mobile: Stacked layout, Desktop: Flex row -->
          <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <!-- Title -->
            <h1 class="text-xl md:text-2xl font-bold flex items-center" style="color: #2c5f2d;">
              <i class="fas fa-brain mr-2"></i>
              <span class="hidden sm:inline">브레인 덤핑 TO_DO_LIST</span>
              <span class="sm:hidden">Brain Dump</span>
            </h1>
            
            <!-- Controls: Mobile stacked, Desktop row -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <!-- Date Picker -->
              <div class="flex items-center justify-between sm:justify-start gap-2">
                <label class="text-sm text-gray-600 sm:text-right min-w-[40px]">날짜</label>
                <input type="date" id="date-picker" value="${currentDate}" 
                  onchange="changeDate(this.value)"
                  class="flex-1 sm:flex-initial px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors text-sm md:text-base">
              </div>
              
              <!-- User Info & Logout -->
              <div class="flex items-center justify-between sm:justify-start gap-2">
                <div class="flex items-center gap-2">
                  <i class="fas fa-user text-gray-500 text-sm"></i>
                  <span class="font-medium text-gray-800 text-sm md:text-base">${currentUser.username}님</span>
                </div>
                <button onclick="handleLogout()" class="btn btn-secondary text-sm">
                  <i class="fas fa-sign-out-alt mr-1 sm:mr-2"></i>
                  <span class="hidden xs:inline">로그아웃</span>
                  <span class="xs:hidden">OUT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div class="max-w-7xl mx-auto px-3 md:px-4 pb-8">
        <!-- Date Header -->
        <div class="text-center md:text-right mb-3 md:mb-4 text-gray-600 text-sm md:text-base">
          <strong>${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 (${dayName}요일)</strong>
        </div>
        
        <!-- Weekly Goals Mini Header -->
        <div id="weekly-goals-mini" class="card mb-4 cursor-pointer hover:shadow-lg transition-shadow" onclick="toggleWeeklyGoals()">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div class="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <span class="text-xl sm:text-2xl flex-shrink-0">🎯</span>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-gray-800 text-sm sm:text-base">이번 주 목표</div>
                <div id="weekly-goals-summary" class="text-xs sm:text-sm text-gray-600 truncate">로딩 중...</div>
              </div>
            </div>
            <button id="weekly-goals-toggle-btn" class="text-gray-500 hover:text-gray-700 sm:ml-2">
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>
        </div>
        
        <!-- Weekly Goals Detail Section -->
        <div id="weekly-goals-detail" class="card mb-6" style="display: none;">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
            <h3 class="text-lg sm:text-xl font-bold text-gray-800">
              🎯 이번 주 목표
            </h3>
            <div class="text-xs sm:text-sm text-gray-600" id="weekly-goals-date-range"></div>
          </div>
          
          <div id="weekly-goals-list" class="space-y-3 sm:space-y-4 mb-4"></div>
          
          <button onclick="openAddGoalModal()" class="btn btn-primary w-full text-sm sm:text-base">
            <i class="fas fa-plus mr-2"></i>새 주간 목표 추가
          </button>
        </div>
        
        <!-- STEP 1: 꺼내기 -->
        <div class="step-box fade-in">
          <div class="step-title text-base sm:text-xl md:text-2xl">
            📝 STEP 1: 꺼내기 (Brain Dump)
          </div>
          <div class="step-instruction">
            ▶ 머릿속의 모든 생각을 판단 없이 적어보세요. 할 일, 걱정, 아이디어, 감정 모두 환영합니다!
          </div>
          
          <div class="mb-4">
            <textarea id="brain-dump-input" rows="4" 
              class="brain-dump-input"
              placeholder="예시: 회의 준비, 프로젝트 마감일 확인, 친구에게 연락, 운동하기...&#10;&#10;생각나는 대로 자유롭게 작성하세요!"></textarea>
            <button onclick="addBrainDumpTask()" class="btn btn-primary mt-3">
              <i class="fas fa-plus mr-2"></i>추가하기
            </button>
          </div>
          
          <div id="brain-dump-list"></div>
        </div>
        
        <!-- STEP 2: 분류하기 -->
        <div class="section-header fade-in">
          🗂️ STEP 2: 분류하기 (Categorize)
        </div>
        <div class="step-instruction mb-4">
          ▶ 위에서 적은 내용들을 중요도와 긴급도에 따라 분류하세요.
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
          <div class="card priority-urgent">
            <h3 class="font-bold text-red-600 mb-3 text-lg">
              🔴 긴급·중요<br>
              <span class="text-xs font-normal text-gray-600">(오늘 반드시)</span>
            </h3>
            <div id="urgent-important-list"></div>
          </div>
          <div class="card priority-important">
            <h3 class="font-bold text-yellow-600 mb-3 text-lg">
              🟡 중요<br>
              <span class="text-xs font-normal text-gray-600">(이번 주 내)</span>
            </h3>
            <div id="important-list"></div>
          </div>
          <div class="card priority-later">
            <h3 class="font-bold text-blue-600 mb-3 text-lg">
              🔵 나중에<br>
              <span class="text-xs font-normal text-gray-600">(여유 있을 때)</span>
            </h3>
            <div id="later-list"></div>
          </div>
          <div class="card priority-letgo">
            <h3 class="font-bold text-gray-600 mb-3 text-lg">
              ❌ 내려놓기<br>
              <span class="text-xs font-normal text-gray-600">(의도적으로)</span>
            </h3>
            <div id="let-go-list"></div>
          </div>
        </div>
        
        <!-- STEP 3: 행동하기 -->
        <div class="section-header fade-in">
          ✅ STEP 3: 행동하기 (Take Action)
        </div>
        <div class="step-instruction mb-4">
          ▶ 긴급·중요 항목 중 오늘 반드시 실행할 3가지만 선택하고 구체적인 행동 계획을 세우세요.
        </div>
        
        <div id="top3-list" class="mb-6 fade-in"></div>
        
        <!-- Statistics -->
        <div class="section-header fade-in">
          📊 오늘의 통계
        </div>
        <div id="statistics" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 fade-in"></div>
        
        <!-- Emotion & Energy Level -->
        <div class="section-header fade-in">
          😊 오늘의 기분과 에너지
        </div>
        <div id="emotion-energy" class="card fade-in mb-6"></div>
        
        <!-- Daily Review -->
        <div class="section-header fade-in">
          📝 하루 회고
        </div>
        <div id="daily-review" class="card fade-in mb-6"></div>
        
        <!-- Free Notes -->
        <div class="section-header fade-in">
          📔 자유 메모
        </div>
        <div id="free-notes" class="card fade-in mb-6"></div>
        
        <!-- Footer Tips -->
        <div class="footer-note fade-in">
          <strong>💡 브레인 덤핑 TO_DO_LIST 사용 팁:</strong>
          <ul>
            <li><strong>아침에:</strong> STEP 1에서 머릿속 모든 생각을 쏟아내고, STEP 2-3으로 우선순위를 정하세요.</li>
            <li><strong>하루 중:</strong> 새로운 할 일이 생기면 즉시 STEP 1에 추가하고, 필요시 우선순위를 재조정하세요.</li>
            <li><strong>저녁에:</strong> 완료된 항목을 체크하며 성취감을 느끼고, 내일을 준비하세요.</li>
            <li><strong>핵심:</strong> 완벽하게 하려 하지 마세요. 생각을 '밖으로 꺼내는 것' 자체가 가장 중요합니다.</li>
            <li><strong>주의:</strong> TOP 3는 반드시 3개로 제한하세요. 집중력이 분산되는 것을 방지합니다.</li>
          </ul>
        </div>
        
        <div class="text-center text-gray-500 text-sm mt-6">
          "생각을 비우는 것이 아니라, 꺼내는 것이다" - 닉 트렌턴, 『브레인 덤핑』
        </div>
      </div>
    </div>
  `
}

function changeDate(date) {
  currentDate = date
  loadDailyOverview()
}

// Load daily overview
async function loadDailyOverview() {
  try {
    const response = await axios.get(`${API_BASE}/tasks/daily/${currentDate}`)
    const data = response.data.data
    
    renderBrainDumpList(data.brainDumpTasks)
    renderCategorizedLists(data)
    renderTop3List(data.top3Tasks)
    renderStatistics(data.statistics)
    
    // Load Phase 2 features
    loadEmotionEnergy()
    loadDailyReview()
    loadFreeNotes()
    loadWeeklyGoals()
  } catch (error) {
    console.error('Load daily overview error:', error)
  }
}

// Render brain dump list
function renderBrainDumpList(tasks) {
  const list = document.getElementById('brain-dump-list')
  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>아직 작성된 항목이 없습니다</p>
        <p class="text-sm mt-2">머릿속 생각을 자유롭게 적어보세요!</p>
      </div>
    `
    return
  }
  
  list.innerHTML = tasks.map(task => `
    <div class="task-item fade-in">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="font-medium text-gray-800">${task.title}</div>
          ${task.description ? `<div class="text-sm text-gray-600 mt-1">${task.description}</div>` : ''}
        </div>
        <div class="flex items-center space-x-2">
          <select onchange="categorizeTask(${task.task_id}, this.value)" 
            class="px-3 py-1 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary">
            <option value="">분류하기</option>
            <option value="URGENT_IMPORTANT">🔴 긴급·중요</option>
            <option value="IMPORTANT">🟡 중요</option>
            <option value="LATER">🔵 나중에</option>
            <option value="LET_GO">❌ 내려놓기</option>
          </select>
          <button onclick="deleteTask(${task.task_id})" 
            class="text-gray-400 hover:text-red-500 transition-colors">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('')
}

// Render categorized lists
function renderCategorizedLists(data) {
  renderTaskList('urgent-important-list', data.urgentImportantTasks)
  renderTaskList('important-list', data.importantTasks)
  renderTaskList('later-list', data.laterTasks)
  renderLetGoList('let-go-list', data.letGoTasks)
}

function renderTaskList(elementId, tasks) {
  const list = document.getElementById(elementId)
  if (tasks.length === 0) {
    list.innerHTML = '<div class="text-center text-gray-400 text-sm py-4">없음</div>'
    return
  }
  
  list.innerHTML = tasks.map(task => `
    <div class="task-item bg-white fade-in">
      <div class="flex items-start justify-between gap-2 mb-2">
        <div class="flex-1">
          <div class="font-medium text-gray-800 text-sm">${task.title}</div>
          ${task.description ? `<div class="text-xs text-gray-600 mt-1">${task.description}</div>` : ''}
          ${task.due_date ? `
            <div class="text-xs text-gray-500 mt-1">
              <i class="fas fa-calendar-check text-orange-500 mr-1"></i>
              마감: ${formatDateKorean(task.due_date)}
              ${getDaysUntilDue(task.due_date)}
            </div>
          ` : ''}
        </div>
        <div class="flex gap-1">
          <button onclick="openEditTaskModal(${task.task_id})" 
            class="text-gray-400 hover:text-blue-500 transition-colors" title="수정">
            <i class="fas fa-edit text-sm"></i>
          </button>
          <button onclick="deleteTask(${task.task_id})" 
            class="text-gray-400 hover:text-red-500 transition-colors" title="삭제">
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>
      ${task.estimated_time ? `
        <div class="text-xs text-gray-600 mb-2">
          <i class="far fa-clock"></i> ${task.estimated_time}
        </div>
      ` : ''}
      <button onclick="promptSetTop3(${task.task_id})" 
        class="btn btn-primary text-xs py-1 px-3">
        <i class="fas fa-star mr-1"></i> TOP 3 설정
      </button>
    </div>
  `).join('')
}

// Render let go list (내려놓기)
function renderLetGoList(elementId, tasks) {
  const list = document.getElementById(elementId)
  if (tasks.length === 0) {
    list.innerHTML = '<div class="text-center text-gray-400 text-sm py-4">없음</div>'
    return
  }
  
  list.innerHTML = tasks.map(task => `
    <div class="task-item bg-white fade-in">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1">
          <div class="font-medium text-gray-600 text-sm line-through">${task.title}</div>
          ${task.description ? `<div class="text-xs text-gray-500 mt-1 line-through">${task.description}</div>` : ''}
          <div class="text-xs text-gray-400 mt-2 italic">
            <i class="fas fa-check-circle mr-1"></i>의도적으로 내려놓음
          </div>
        </div>
        <button onclick="deleteTask(${task.task_id})" 
          class="text-gray-400 hover:text-red-500 transition-colors">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>
    </div>
  `).join('')
}

// Render TOP 3 list
function renderTop3List(tasks) {
  const list = document.getElementById('top3-list')
  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state card">
        <i class="fas fa-star"></i>
        <p>오늘의 TOP 3를 설정해주세요</p>
        <p class="text-sm mt-2">긴급·중요 항목 중에서 선택하세요</p>
      </div>
    `
    return
  }
  
  list.innerHTML = tasks.map((task, index) => `
    <div class="top3-item fade-in ${task.status === 'COMPLETED' ? 'opacity-75' : ''}">
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-start flex-1">
          <span class="top3-number">${index + 1}</span>
          <div class="flex-1">
            <h3 class="top3-title ${task.status === 'COMPLETED' ? 'line-through' : ''}">${task.title}</h3>
            ${task.description ? `<p class="text-sm opacity-90 mt-1">${task.description}</p>` : ''}
          </div>
        </div>
        <button onclick="${task.status === 'COMPLETED' ? `uncompleteTask(${task.task_id})` : `completeTask(${task.task_id})`}" 
          class="text-3xl transition-all hover:scale-110 ${task.status === 'COMPLETED' ? 'text-green-300' : 'text-white/50 hover:text-white'}">
          <i class="fas fa-check-circle"></i>
        </button>
      </div>
      ${task.action_detail ? `
        <div class="top3-detail">
          <i class="fas fa-clipboard-list mr-1"></i>
          ${task.action_detail}
        </div>
      ` : ''}
      <div class="mt-3 flex items-center gap-2">
        ${task.time_slot ? `
          <span class="time-badge">
            ${task.time_slot === 'MORNING' ? '🌅 오전 (06:00-12:00)' : task.time_slot === 'AFTERNOON' ? '☀️ 오후 (12:00-18:00)' : '🌙 저녁 (18:00-22:00)'}
          </span>
        ` : ''}
        ${task.estimated_time ? `
          <span class="time-badge">
            <i class="far fa-clock"></i> ${task.estimated_time}
          </span>
        ` : ''}
        ${task.completed_at ? `
          <span class="time-badge">
            <i class="fas fa-check"></i> 완료됨
          </span>
        ` : ''}
      </div>
    </div>
  `).join('')
}

// Render statistics
function renderStatistics(stats) {
  const div = document.getElementById('statistics')
  div.innerHTML = `
    <div class="stat-card fade-in">
      <div class="stat-number stat-total">
        <i class="fas fa-list"></i> ${stats.totalTasks}
      </div>
      <div class="stat-label">전체 할 일</div>
    </div>
    <div class="stat-card fade-in">
      <div class="stat-number stat-completed">
        <i class="fas fa-check-circle"></i> ${stats.completedTasks}
      </div>
      <div class="stat-label">완료</div>
    </div>
    <div class="stat-card fade-in">
      <div class="stat-number stat-rate">
        <i class="fas fa-chart-pie"></i> ${stats.completionRate}%
      </div>
      <div class="stat-label">완료율</div>
    </div>
  `
}

// Task operations
async function addBrainDumpTask() {
  const input = document.getElementById('brain-dump-input')
  const title = input.value.trim()
  
  if (!title) return
  
  try {
    await axios.post(`${API_BASE}/tasks`, {
      task_date: currentDate,
      step: 'BRAIN_DUMP',
      title
    })
    input.value = ''
    loadDailyOverview()
  } catch (error) {
    alert('할 일 추가 실패: ' + (error.response?.data?.error || error.message))
  }
}

async function categorizeTask(taskId, priority) {
  if (!priority) return
  
  try {
    await axios.patch(`${API_BASE}/tasks/${taskId}/categorize`, { priority })
    loadDailyOverview()
  } catch (error) {
    alert('분류 실패: ' + (error.response?.data?.error || error.message))
  }
}

function promptSetTop3(taskId) {
  showTop3Modal(taskId)
}

// Show TOP 3 modal
function showTop3Modal(taskId) {
  const modal = document.createElement('div')
  modal.id = 'top3-modal'
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 fade-in">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-star text-yellow-500 mr-2"></i>
            TOP 3 설정
          </h3>
          <button onclick="closeTop3Modal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-sort-numeric-down mr-1"></i>
              우선순위 (선택사항)
            </label>
            <select id="top3-order" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors">
              <option value="">자동 배정 (빈 슬롯 찾기)</option>
              <option value="1">1순위 (가장 중요)</option>
              <option value="2">2순위</option>
              <option value="3">3순위</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">
              <i class="fas fa-info-circle mr-1"></i>
              선택하지 않으면 자동으로 빈 슬롯에 배정됩니다
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-clipboard-list mr-1"></i>
              구체적인 행동 계획
            </label>
            <textarea id="top3-action" rows="4" 
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors"
              placeholder="예시: 회의 자료 3페이지 작성하고 팀장님께 검토 요청"></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="far fa-clock mr-1"></i>
              실행 시간대 (선택)
            </label>
            <select id="top3-timeslot" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors">
              <option value="">선택 안 함</option>
              <option value="MORNING">🌅 오전 (06:00-12:00)</option>
              <option value="AFTERNOON">☀️ 오후 (12:00-18:00)</option>
              <option value="EVENING">🌙 저녁 (18:00-22:00)</option>
            </select>
          </div>
        </div>
        
        <div class="mt-6 flex gap-3">
          <button onclick="closeTop3Modal()" class="flex-1 btn btn-secondary">
            <i class="fas fa-times mr-2"></i>취소
          </button>
          <button onclick="submitTop3(${taskId})" class="flex-1 btn btn-primary">
            <i class="fas fa-check mr-2"></i>설정
          </button>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

// Close TOP 3 modal
function closeTop3Modal() {
  const modal = document.getElementById('top3-modal')
  if (modal) {
    modal.remove()
  }
}

// Submit TOP 3
async function submitTop3(taskId) {
  const orderValue = document.getElementById('top3-order').value
  const order = orderValue ? parseInt(orderValue) : null
  const actionDetail = document.getElementById('top3-action').value.trim()
  const timeSlot = document.getElementById('top3-timeslot').value || null
  
  if (!actionDetail) {
    alert('구체적인 행동 계획을 입력해주세요')
    return
  }
  
  closeTop3Modal()
  await setTop3Task(taskId, order, actionDetail, timeSlot)
}

function setTop3Task(taskId, order, actionDetail, timeSlot = null) {
  return setTop3TaskWithTimeSlot(taskId, order, actionDetail, timeSlot)
}

async function setTop3TaskWithTimeSlot(taskId, order, actionDetail, timeSlot = null) {
  try {
    await axios.patch(`${API_BASE}/tasks/${taskId}/top3`, { 
      order, 
      action_detail: actionDetail,
      time_slot: timeSlot
    })
    loadDailyOverview()
  } catch (error) {
    alert('TOP 3 설정 실패: ' + (error.response?.data?.error || error.message))
  }
}

async function completeTask(taskId) {
  try {
    await axios.patch(`${API_BASE}/tasks/${taskId}/complete`)
    loadDailyOverview()
  } catch (error) {
    alert('완료 처리 실패: ' + (error.response?.data?.error || error.message))
  }
}

async function uncompleteTask(taskId) {
  try {
    await axios.put(`${API_BASE}/tasks/${taskId}`, { status: 'IN_PROGRESS' })
    loadDailyOverview()
  } catch (error) {
    alert('완료 취소 실패: ' + (error.response?.data?.error || error.message))
  }
}

async function deleteTask(taskId) {
  if (!confirm('삭제하시겠습니까?')) return
  
  try {
    await axios.delete(`${API_BASE}/tasks/${taskId}`)
    loadDailyOverview()
  } catch (error) {
    alert('삭제 실패: ' + (error.response?.data?.error || error.message))
  }
}

// ========================================
// Phase 2: 감정/에너지, 회고, 자유 메모
// ========================================

// Load and render emotion & energy level
async function loadEmotionEnergy() {
  const container = document.getElementById('emotion-energy')
  if (!container) return
  
  try {
    const response = await axios.get(`${API_BASE}/reviews/${currentDate}`)
    const review = response.data.data
    
    renderEmotionEnergy(review)
  } catch (error) {
    renderEmotionEnergy(null)
  }
}

function renderEmotionEnergy(review) {
  const container = document.getElementById('emotion-energy')
  const currentMood = review?.current_mood || ''
  const energyLevel = review?.morning_energy || 5
  
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          <i class="fas fa-smile mr-2"></i>오늘의 기분
        </label>
        <div class="flex gap-2 flex-wrap">
          ${renderEmotionButtons(currentMood)}
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          <i class="fas fa-battery-three-quarters mr-2"></i>에너지 레벨: <span id="energy-value">${energyLevel}</span>/10
        </label>
        <input type="range" min="1" max="10" value="${energyLevel}" 
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          oninput="updateEnergyLevel(this.value)"
          onchange="saveEmotionEnergy()">
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>낮음</span>
          <span>보통</span>
          <span>높음</span>
        </div>
      </div>
    </div>
  `
}

function renderEmotionButtons(currentMood) {
  const emotions = [
    { value: 'VERY_GOOD', emoji: '😊', label: '매우 좋음', color: 'bg-green-500' },
    { value: 'GOOD', emoji: '🙂', label: '좋음', color: 'bg-blue-500' },
    { value: 'NORMAL', emoji: '😐', label: '보통', color: 'bg-gray-500' },
    { value: 'BAD', emoji: '😞', label: '나쁨', color: 'bg-orange-500' },
    { value: 'VERY_BAD', emoji: '😢', label: '매우 나쁨', color: 'bg-red-500' }
  ]
  
  return emotions.map(emotion => `
    <button onclick="selectEmotion('${emotion.value}')" 
      class="flex-1 min-w-[80px] py-3 px-2 rounded-lg border-2 transition-all ${
        currentMood === emotion.value 
          ? `${emotion.color} text-white border-transparent transform scale-105` 
          : 'border-gray-300 hover:border-gray-400 bg-white'
      }">
      <div class="text-2xl mb-1">${emotion.emoji}</div>
      <div class="text-xs font-medium">${emotion.label}</div>
    </button>
  `).join('')
}

let selectedEmotion = null
let selectedEnergy = 5

function selectEmotion(emotion) {
  selectedEmotion = emotion
  saveEmotionEnergy()
}

function updateEnergyLevel(value) {
  document.getElementById('energy-value').textContent = value
  selectedEnergy = parseInt(value)
}

async function saveEmotionEnergy() {
  try {
    await axios.post(`${API_BASE}/reviews`, {
      review_date: currentDate,
      current_mood: selectedEmotion,
      morning_energy: selectedEnergy,
      stress_level: null  // 스트레스 레벨은 나중에 추가 예정
    })
    loadEmotionEnergy()
  } catch (error) {
    console.error('Save emotion/energy error:', error)
  }
}

// Load and render daily review
async function loadDailyReview() {
  const container = document.getElementById('daily-review')
  if (!container) return
  
  try {
    const response = await axios.get(`${API_BASE}/reviews/${currentDate}`)
    const review = response.data.data
    
    renderDailyReview(review)
  } catch (error) {
    renderDailyReview(null)
  }
}

function renderDailyReview(review) {
  const container = document.getElementById('daily-review')
  
  if (review && (review.well_done_1 || review.well_done_2 || review.well_done_3 || review.improvement || review.gratitude)) {
    container.innerHTML = `
      <div class="space-y-4">
        <div>
          <h4 class="font-semibold text-gray-700 mb-2">
            <i class="fas fa-star text-yellow-500 mr-2"></i>오늘 잘한 일 3가지
          </h4>
          <ol class="list-decimal list-inside space-y-1 text-gray-600">
            ${review.well_done_1 ? `<li>${review.well_done_1}</li>` : ''}
            ${review.well_done_2 ? `<li>${review.well_done_2}</li>` : ''}
            ${review.well_done_3 ? `<li>${review.well_done_3}</li>` : ''}
          </ol>
        </div>
        
        ${review.improvement ? `
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">
              <i class="fas fa-lightbulb text-blue-500 mr-2"></i>개선할 점
            </h4>
            <p class="text-gray-600">${review.improvement}</p>
          </div>
        ` : ''}
        
        ${review.gratitude ? `
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">
              <i class="fas fa-heart text-pink-500 mr-2"></i>감사한 일
            </h4>
            <p class="text-gray-600">${review.gratitude}</p>
          </div>
        ` : ''}
        
        ${review.stress_factors ? `
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">
              <i class="fas fa-exclamation-triangle text-orange-500 mr-2"></i>스트레스 요인
            </h4>
            <p class="text-gray-600">${review.stress_factors}</p>
          </div>
        ` : ''}
        
        <button onclick="showReviewModal()" class="btn btn-secondary text-sm">
          <i class="fas fa-edit mr-2"></i>회고 수정
        </button>
      </div>
    `
  } else {
    container.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-pen-fancy text-4xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 mb-4">하루를 돌아보고 회고를 작성해보세요</p>
        <button onclick="showReviewModal()" class="btn btn-primary">
          <i class="fas fa-plus mr-2"></i>회고 작성하기
        </button>
      </div>
    `
  }
}

function showReviewModal() {
  axios.get(`${API_BASE}/reviews/${currentDate}`)
    .then(response => {
      const review = response.data.data || {}
      openReviewModal(review)
    })
    .catch(() => {
      openReviewModal({})
    })
}

function openReviewModal(review) {
  const modal = document.createElement('div')
  modal.id = 'review-modal'
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 fade-in max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-pen-fancy text-purple-500 mr-2"></i>
            하루 회고
          </h3>
          <button onclick="closeReviewModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-star text-yellow-500 mr-1"></i>
              오늘 잘한 일 1
            </label>
            <input type="text" id="well-done-1" value="${review.well_done_1 || ''}"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              placeholder="오늘 가장 잘한 일">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-star text-yellow-500 mr-1"></i>
              오늘 잘한 일 2
            </label>
            <input type="text" id="well-done-2" value="${review.well_done_2 || ''}"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              placeholder="두 번째로 잘한 일">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-star text-yellow-500 mr-1"></i>
              오늘 잘한 일 3
            </label>
            <input type="text" id="well-done-3" value="${review.well_done_3 || ''}"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              placeholder="세 번째로 잘한 일">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-lightbulb text-blue-500 mr-1"></i>
              개선할 점
            </label>
            <textarea id="improvement" rows="3"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              placeholder="내일 더 나아지기 위해 개선할 점">${review.improvement || ''}</textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-heart text-pink-500 mr-1"></i>
              감사한 일
            </label>
            <textarea id="gratitude" rows="3"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              placeholder="오늘 감사했던 일이나 사람">${review.gratitude || ''}</textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-exclamation-triangle text-orange-500 mr-1"></i>
              스트레스 요인 (선택)
            </label>
            <textarea id="stress-factors" rows="2"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              placeholder="오늘 느낀 스트레스나 걱정거리">${review.stress_factors || ''}</textarea>
          </div>
        </div>
        
        <div class="mt-6 flex gap-3">
          <button onclick="closeReviewModal()" class="flex-1 btn btn-secondary">
            <i class="fas fa-times mr-2"></i>취소
          </button>
          <button onclick="submitReview()" class="flex-1 btn btn-primary">
            <i class="fas fa-save mr-2"></i>저장
          </button>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

function closeReviewModal() {
  const modal = document.getElementById('review-modal')
  if (modal) modal.remove()
}

async function submitReview() {
  const wellDone1 = document.getElementById('well-done-1').value.trim()
  const wellDone2 = document.getElementById('well-done-2').value.trim()
  const wellDone3 = document.getElementById('well-done-3').value.trim()
  const improvement = document.getElementById('improvement').value.trim()
  const gratitude = document.getElementById('gratitude').value.trim()
  const stressFactors = document.getElementById('stress-factors').value.trim()
  
  if (!wellDone1 && !wellDone2 && !wellDone3 && !improvement && !gratitude) {
    alert('최소 하나의 항목을 입력해주세요')
    return
  }
  
  try {
    await axios.post(`${API_BASE}/reviews`, {
      review_date: currentDate,
      well_done_1: wellDone1,
      well_done_2: wellDone2,
      well_done_3: wellDone3,
      improvement: improvement,
      gratitude: gratitude,
      stress_factors: stressFactors
    })
    closeReviewModal()
    loadDailyReview()
  } catch (error) {
    alert('회고 저장 실패: ' + (error.response?.data?.error || error.message))
  }
}

// Load and render free notes
async function loadFreeNotes() {
  const container = document.getElementById('free-notes')
  if (!container) return
  
  try {
    const response = await axios.get(`${API_BASE}/notes/${currentDate}`)
    const note = response.data.data
    
    renderFreeNotes(note)
  } catch (error) {
    renderFreeNotes(null)
  }
}

function renderFreeNotes(note) {
  const container = document.getElementById('free-notes')
  
  if (note && note.content) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="whitespace-pre-wrap text-gray-700 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
          ${note.content}
        </div>
        <div class="flex gap-2">
          <button onclick="showNoteModal()" class="btn btn-secondary text-sm">
            <i class="fas fa-edit mr-2"></i>수정
          </button>
          <button onclick="deleteNote(${note.note_id})" class="btn btn-secondary text-sm text-red-600">
            <i class="fas fa-trash mr-2"></i>삭제
          </button>
        </div>
      </div>
    `
  } else {
    container.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-sticky-note text-4xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 mb-4">자유롭게 메모를 작성해보세요</p>
        <button onclick="showNoteModal()" class="btn btn-primary">
          <i class="fas fa-plus mr-2"></i>메모 작성하기
        </button>
      </div>
    `
  }
}

function showNoteModal() {
  axios.get(`${API_BASE}/notes/${currentDate}`)
    .then(response => {
      const note = response.data.data || {}
      openNoteModal(note)
    })
    .catch(() => {
      openNoteModal({})
    })
}

function openNoteModal(note) {
  const modal = document.createElement('div')
  modal.id = 'note-modal'
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 fade-in">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-sticky-note text-yellow-500 mr-2"></i>
            자유 메모
          </h3>
          <button onclick="closeNoteModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div>
          <textarea id="note-content" rows="10"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary resize-vertical"
            placeholder="메모할 내용을 자유롭게 작성하세요...&#10;&#10;💡 아이디어, 생각, 기록하고 싶은 내용 등 무엇이든 좋습니다.">${note.content || ''}</textarea>
        </div>
        
        <div class="mt-6 flex gap-3">
          <button onclick="closeNoteModal()" class="flex-1 btn btn-secondary">
            <i class="fas fa-times mr-2"></i>취소
          </button>
          <button onclick="submitNote()" class="flex-1 btn btn-primary">
            <i class="fas fa-save mr-2"></i>저장
          </button>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

function closeNoteModal() {
  const modal = document.getElementById('note-modal')
  if (modal) modal.remove()
}

async function submitNote() {
  const content = document.getElementById('note-content').value.trim()
  
  if (!content) {
    alert('메모 내용을 입력해주세요')
    return
  }
  
  try {
    await axios.post(`${API_BASE}/notes`, {
      note_date: currentDate,
      content: content
    })
    closeNoteModal()
    loadFreeNotes()
  } catch (error) {
    alert('메모 저장 실패: ' + (error.response?.data?.error || error.message))
  }
}

async function deleteNote(noteId) {
  if (!confirm('메모를 삭제하시겠습니까?')) return
  
  try {
    await axios.delete(`${API_BASE}/notes/${noteId}`)
    loadFreeNotes()
  } catch (error) {
    alert('메모 삭제 실패: ' + (error.response?.data?.error || error.message))
  }
}

// ==================== Weekly Goals Functions ====================

let weeklyGoalsData = {
  weekStartDate: '',
  weekEndDate: '',
  goals: []
}

// Toggle weekly goals section
function toggleWeeklyGoals() {
  const detail = document.getElementById('weekly-goals-detail')
  const toggleBtn = document.getElementById('weekly-goals-toggle-btn')
  const icon = toggleBtn.querySelector('i')
  
  if (detail.style.display === 'none') {
    detail.style.display = 'block'
    icon.className = 'fas fa-chevron-up'
    localStorage.setItem('weeklyGoalsExpanded', 'true')
  } else {
    detail.style.display = 'none'
    icon.className = 'fas fa-chevron-down'
    localStorage.setItem('weeklyGoalsExpanded', 'false')
  }
}

// Load weekly goals
async function loadWeeklyGoals() {
  try {
    const response = await axios.get(`${API_BASE}/weekly-goals/current`)
    weeklyGoalsData = response.data.data
    
    // Update date range
    const dateRange = document.getElementById('weekly-goals-date-range')
    if (dateRange) {
      const start = new Date(weeklyGoalsData.weekStartDate)
      const end = new Date(weeklyGoalsData.weekEndDate)
      dateRange.textContent = `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`
    }
    
    // Update summary
    updateWeeklyGoalsSummary()
    
    // Render goals list
    renderWeeklyGoalsList()
    
    // Restore expanded state
    const isExpanded = localStorage.getItem('weeklyGoalsExpanded')
    if (isExpanded === 'true') {
      const detail = document.getElementById('weekly-goals-detail')
      const toggleBtn = document.getElementById('weekly-goals-toggle-btn')
      const icon = toggleBtn.querySelector('i')
      detail.style.display = 'block'
      icon.className = 'fas fa-chevron-up'
    }
  } catch (error) {
    console.error('Load weekly goals error:', error)
    document.getElementById('weekly-goals-summary').textContent = '목표를 불러올 수 없습니다'
  }
}

// Update summary
function updateWeeklyGoalsSummary() {
  const summary = document.getElementById('weekly-goals-summary')
  const goals = weeklyGoalsData.goals || []
  
  if (goals.length === 0) {
    summary.innerHTML = '<span class="text-gray-500">아직 주간 목표가 없습니다</span>'
    return
  }
  
  const completedCount = goals.filter(g => g.status === 'COMPLETED').length
  const totalCount = goals.length
  const avgProgress = Math.round(goals.reduce((sum, g) => sum + g.progress_rate, 0) / totalCount)
  
  const progressBar = generateProgressBar(avgProgress)
  
  summary.innerHTML = `
    <div class="flex items-center space-x-2">
      <span class="font-medium">${progressBar} ${avgProgress}%</span>
      <span class="text-gray-500">•</span>
      <span>${completedCount}/${totalCount} 완료</span>
    </div>
  `
}

// Generate progress bar
function generateProgressBar(progress) {
  const filled = Math.floor(progress / 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

// Render weekly goals list
function renderWeeklyGoalsList() {
  const container = document.getElementById('weekly-goals-list')
  const goals = weeklyGoalsData.goals || []
  
  if (goals.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-flag text-4xl mb-3"></i>
        <p>이번 주 목표를 설정해보세요!</p>
        <p class="text-sm mt-2">최대 3개까지 설정할 수 있습니다.</p>
      </div>
    `
    return
  }
  
  container.innerHTML = goals.map(goal => `
    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center space-x-2">
          <span class="text-2xl">${goal.goal_order === 1 ? '1️⃣' : goal.goal_order === 2 ? '2️⃣' : '3️⃣'}</span>
          <div>
            <h4 class="font-bold text-gray-800">${goal.title}</h4>
            ${goal.target_date ? `<p class="text-xs text-gray-500">목표일: ${goal.target_date}</p>` : ''}
          </div>
        </div>
        <span class="px-2 py-1 text-xs font-medium rounded ${
          goal.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
          goal.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' : 
          'bg-blue-100 text-blue-800'
        }">
          ${goal.status === 'COMPLETED' ? '완료' : goal.status === 'CANCELLED' ? '취소' : '진행중'}
        </span>
      </div>
      
      <div class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm text-gray-600">진행률</span>
          <span class="text-sm font-bold">${goal.progress_rate}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: ${goal.progress_rate}%"></div>
        </div>
      </div>
      
      <div class="flex space-x-2">
        <button onclick="openUpdateProgressModal(${goal.goal_id}, ${goal.progress_rate})" class="flex-1 btn btn-sm btn-secondary">
          <i class="fas fa-chart-line mr-1"></i>진행률 업데이트
        </button>
        <button onclick="deleteWeeklyGoal(${goal.goal_id})" class="btn btn-sm btn-danger">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('')
  
  // Disable add button if 3 goals exist
  const addButton = document.querySelector('button[onclick="openAddGoalModal()"]')
  if (addButton) {
    if (goals.length >= 3) {
      addButton.disabled = true
      addButton.classList.add('opacity-50', 'cursor-not-allowed')
      addButton.innerHTML = '<i class="fas fa-check mr-2"></i>최대 3개 목표 설정 완료'
    } else {
      addButton.disabled = false
      addButton.classList.remove('opacity-50', 'cursor-not-allowed')
      addButton.innerHTML = '<i class="fas fa-plus mr-2"></i>새 주간 목표 추가'
    }
  }
}

// Open add goal modal
function openAddGoalModal() {
  if (weeklyGoalsData.goals && weeklyGoalsData.goals.length >= 3) {
    alert('주간 목표는 최대 3개까지만 설정할 수 있습니다.')
    return
  }
  
  const nextOrder = (weeklyGoalsData.goals?.length || 0) + 1
  
  const modal = document.createElement('div')
  modal.id = 'add-goal-modal'
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal-content max-w-md">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-target text-blue-500 mr-2"></i>새 주간 목표 추가
          </h3>
          <button onclick="closeAddGoalModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
            <p class="text-sm font-medium text-gray-700">
              <i class="fas fa-sort-numeric-up mr-2 text-blue-500"></i>
              우선순위: <span class="text-blue-600 font-bold">${nextOrder}번째 목표</span>
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-pencil-alt text-green-500 mr-1"></i>
              목표 제목 <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="goal-title" 
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="예: 프로젝트 A 완료하기"
              maxlength="100"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-calendar-check text-orange-500 mr-1"></i>
              목표일 (선택)
            </label>
            <input 
              type="date" 
              id="goal-target-date" 
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              min="${weeklyGoalsData.weekStartDate}"
              max="${weeklyGoalsData.weekEndDate}"
            />
          </div>
          
          <div class="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <i class="fas fa-info-circle text-blue-500 mr-2"></i>
            주간 목표는 이번 주 <span class="font-semibold">(${weeklyGoalsData.weekStartDate} ~ ${weeklyGoalsData.weekEndDate})</span> 동안 달성할 목표입니다.
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button onclick="closeAddGoalModal()" class="flex-1 btn btn-secondary">
            취소
          </button>
          <button onclick="submitAddGoal()" class="flex-1 btn btn-primary">
            <i class="fas fa-plus mr-2"></i>추가
          </button>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  
  // Focus on title input
  setTimeout(() => {
    document.getElementById('goal-title').focus()
  }, 100)
}

function closeAddGoalModal() {
  const modal = document.getElementById('add-goal-modal')
  if (modal) modal.remove()
}

async function submitAddGoal() {
  const title = document.getElementById('goal-title').value.trim()
  const targetDate = document.getElementById('goal-target-date').value || null
  
  if (!title) {
    alert('목표 제목을 입력해주세요')
    return
  }
  
  const nextOrder = (weeklyGoalsData.goals?.length || 0) + 1
  
  try {
    await axios.post(`${API_BASE}/weekly-goals`, {
      week_start_date: weeklyGoalsData.weekStartDate,
      week_end_date: weeklyGoalsData.weekEndDate,
      goal_order: nextOrder,
      title: title,
      target_date: targetDate
    })
    
    closeAddGoalModal()
    loadWeeklyGoals()
  } catch (error) {
    alert('목표 추가 실패: ' + (error.response?.data?.error || error.message))
  }
}

// Open update progress modal
function openUpdateProgressModal(goalId, currentProgress) {
  const modal = document.createElement('div')
  modal.id = 'update-progress-modal'
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal-content max-w-md">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold">진행률 업데이트</h3>
        <button onclick="closeUpdateProgressModal()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            진행률: <span id="progress-value">${currentProgress}</span>%
          </label>
          <input 
            type="range" 
            id="progress-slider" 
            min="0" 
            max="100" 
            step="5" 
            value="${currentProgress}"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            oninput="document.getElementById('progress-value').textContent = this.value; updateProgressPreview(this.value)"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div>
          <div class="w-full bg-gray-200 rounded-full h-4">
            <div id="progress-preview" class="bg-blue-500 h-4 rounded-full transition-all duration-300" style="width: ${currentProgress}%"></div>
          </div>
        </div>
        
        <div class="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
          <i class="fas fa-lightbulb mr-1"></i>
          100% 달성 시 자동으로 '완료' 상태로 변경됩니다.
        </div>
      </div>
      
      <div class="flex space-x-3 mt-6">
        <button onclick="closeUpdateProgressModal()" class="flex-1 btn btn-secondary">
          취소
        </button>
        <button onclick="submitUpdateProgress(${goalId})" class="flex-1 btn btn-primary">
          <i class="fas fa-save mr-2"></i>저장
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

function closeUpdateProgressModal() {
  const modal = document.getElementById('update-progress-modal')
  if (modal) modal.remove()
}

function updateProgressPreview(value) {
  const preview = document.getElementById('progress-preview')
  if (preview) {
    preview.style.width = value + '%'
  }
}

async function submitUpdateProgress(goalId) {
  const progress = parseInt(document.getElementById('progress-slider').value)
  
  try {
    await axios.patch(`${API_BASE}/weekly-goals/${goalId}/progress`, {
      progress_rate: progress
    })
    
    closeUpdateProgressModal()
    loadWeeklyGoals()
  } catch (error) {
    alert('진행률 업데이트 실패: ' + (error.response?.data?.error || error.message))
  }
}

// Delete weekly goal
async function deleteWeeklyGoal(goalId) {
  if (!confirm('이 목표를 삭제하시겠습니까?')) return
  
  try {
    await axios.delete(`${API_BASE}/weekly-goals/${goalId}`)
    loadWeeklyGoals()
  } catch (error) {
    alert('목표 삭제 실패: ' + (error.response?.data?.error || error.message))
  }
}

// ==================== Task Edit Modal ====================

// Helper: Format date to Korean
function formatDateKorean(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}월 ${day}일`
}

// Helper: Calculate days until due date
function getDaysUntilDue(dueDate) {
  if (!dueDate) return ''
  const today = new Date(currentDate)
  const due = new Date(dueDate)
  const diffTime = due - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return `<span class="text-red-600 font-semibold">🔴 ${Math.abs(diffDays)}일 지연</span>`
  } else if (diffDays === 0) {
    return `<span class="text-orange-600 font-semibold">⚠️ 오늘 마감</span>`
  } else if (diffDays <= 3) {
    return `<span class="text-orange-500">⏰ ${diffDays}일 남음</span>`
  } else {
    return `<span class="text-gray-500">${diffDays}일 남음</span>`
  }
}

// Open edit task modal
async function openEditTaskModal(taskId) {
  try {
    // Find task from current data
    const allTasks = [
      ...dailyOverviewData.brainDumpTasks,
      ...dailyOverviewData.urgentImportantTasks,
      ...dailyOverviewData.importantTasks,
      ...dailyOverviewData.laterTasks
    ]
    const task = allTasks.find(t => t.task_id === taskId)
    
    if (!task) {
      alert('작업을 찾을 수 없습니다')
      return
    }
    
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
                value="${task.title.replace(/"/g, '&quot;')}"
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
              <p class="text-xs text-gray-500 mt-1">마감일을 설정하면 미완료 항목 추적에 도움이 됩니다</p>
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
  } catch (error) {
    console.error('Open edit modal error:', error)
    alert('모달 열기 실패')
  }
}

async function submitTaskUpdate(taskId) {
  const title = document.getElementById('edit-task-title').value.trim()
  const description = document.getElementById('edit-task-description').value.trim()
  const priority = document.querySelector('input[name="edit-priority"]:checked')?.value
  const time_slot = document.getElementById('edit-task-timeslot').value || null
  const due_date = document.getElementById('edit-task-duedate').value || null
  
  if (!title) {
    alert('제목을 입력해주세요')
    return
  }
  
  if (!priority) {
    alert('우선순위를 선택해주세요')
    return
  }
  
  try {
    await axios.put(`${API_BASE}/tasks/${taskId}`, {
      title,
      description: description || null,
      priority,
      time_slot,
      due_date
    })
    
    closeEditTaskModal()
    loadDailyOverview()
    alert('✅ 작업이 수정되었습니다')
  } catch (error) {
    alert('작업 수정 실패: ' + (error.response?.data?.error || error.message))
  }
}

function closeEditTaskModal() {
  document.getElementById('edit-task-modal')?.remove()
}
