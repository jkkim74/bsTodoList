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
      <nav class="bg-white shadow-sm mb-6" style="border-bottom: 3px solid #2c5f2d;">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center flex-wrap gap-4">
          <h1 class="text-2xl font-bold" style="color: #2c5f2d;">
            <i class="fas fa-brain mr-2"></i>
            브레인 덤핑 TO_DO_LIST
          </h1>
          <div class="flex items-center space-x-4 flex-wrap gap-2">
            <div class="text-right">
              <div class="text-sm text-gray-600">날짜</div>
              <input type="date" id="date-picker" value="${currentDate}" 
                onchange="changeDate(this.value)"
                class="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors">
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-600">사용자</div>
              <div class="font-medium text-gray-800">${currentUser.username}님</div>
            </div>
            <button onclick="handleLogout()" class="btn btn-secondary">
              <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
            </button>
          </div>
        </div>
      </nav>
      
      <div class="max-w-7xl mx-auto px-4 pb-8">
        <!-- Date Header -->
        <div class="text-right mb-4 text-gray-600">
          <strong>${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 (${dayName}요일)</strong>
        </div>
        
        <!-- STEP 1: 꺼내기 -->
        <div class="step-box fade-in">
          <div class="step-title">
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
        </div>
        <button onclick="deleteTask(${task.task_id})" 
          class="text-gray-400 hover:text-red-500 transition-colors">
          <i class="fas fa-times text-xs"></i>
        </button>
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
  const order = prompt('TOP 3 순서를 입력하세요 (1-3):')
  if (!order || order < 1 || order > 3) return
  
  const actionDetail = prompt('구체적인 행동 계획을 입력하세요:')
  if (!actionDetail) return
  
  setTop3Task(taskId, parseInt(order), actionDetail)
}

async function setTop3Task(taskId, order, actionDetail) {
  try {
    await axios.patch(`${API_BASE}/tasks/${taskId}/top3`, { order, action_detail: actionDetail })
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
