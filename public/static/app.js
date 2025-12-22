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
      morning_energy: selectedEnergy
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
