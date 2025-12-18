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
    <div class="min-h-screen flex items-center justify-center">
      <div class="card max-w-md w-full">
        <h1 class="text-3xl font-bold text-center mb-6 text-primary">
          <i class="fas fa-brain mr-2"></i>
          브레인 덤핑 TO_DO_LIST
        </h1>
        
        <div id="auth-form">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">이메일</label>
            <input type="email" id="email" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" placeholder="test@example.com">
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">비밀번호</label>
            <input type="password" id="password" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" placeholder="password123">
          </div>
          
          <div class="mb-6" id="username-field" style="display:none;">
            <label class="block text-gray-700 text-sm font-medium mb-2">이름</label>
            <input type="text" id="username" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" placeholder="홍길동">
          </div>
          
          <div id="error-message" class="mb-4 text-red-500 text-sm hidden"></div>
          
          <button onclick="handleLogin()" id="login-btn" class="w-full btn-primary mb-3">
            로그인
          </button>
          
          <button onclick="toggleSignup()" id="toggle-btn" class="w-full btn-secondary">
            회원가입
          </button>
        </div>
        
        <div class="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-600">
          <p class="font-medium mb-2">테스트 계정:</p>
          <p>이메일: test@example.com</p>
          <p>비밀번호: password123</p>
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
  return `
    <div class="min-h-screen">
      <nav class="bg-white shadow-sm mb-6">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-primary">
            <i class="fas fa-brain mr-2"></i>
            브레인 덤핑 TO_DO_LIST
          </h1>
          <div class="flex items-center space-x-4">
            <input type="date" id="date-picker" value="${currentDate}" 
              onchange="changeDate(this.value)"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
            <span class="text-gray-700">${currentUser.username}님</span>
            <button onclick="handleLogout()" class="btn-secondary">
              <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
            </button>
          </div>
        </div>
      </nav>
      
      <div class="max-w-7xl mx-auto px-4">
        <!-- STEP 1: 꺼내기 -->
        <div class="card mb-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
            STEP 1: 꺼내기 (Brain Dump)
          </h2>
          <p class="text-gray-600 mb-4">▶ 머릿속의 모든 생각을 판단 없이 적어보세요</p>
          
          <div class="mb-4">
            <textarea id="brain-dump-input" rows="3" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              placeholder="예: 회의 준비, 프로젝트 마감일 확인, 친구에게 연락..."></textarea>
            <button onclick="addBrainDumpTask()" class="btn-primary mt-2">
              <i class="fas fa-plus mr-2"></i>추가하기
            </button>
          </div>
          
          <div id="brain-dump-list" class="space-y-2"></div>
        </div>
        
        <!-- STEP 2: 분류하기 -->
        <div class="card mb-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            <i class="fas fa-folder-open text-blue-500 mr-2"></i>
            STEP 2: 분류하기 (Categorize)
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 class="font-bold text-red-600 mb-2">🔴 긴급·중요</h3>
              <div id="urgent-important-list" class="space-y-2"></div>
            </div>
            <div>
              <h3 class="font-bold text-yellow-600 mb-2">🟡 중요</h3>
              <div id="important-list" class="space-y-2"></div>
            </div>
            <div>
              <h3 class="font-bold text-blue-600 mb-2">🔵 나중에</h3>
              <div id="later-list" class="space-y-2"></div>
            </div>
            <div>
              <h3 class="font-bold text-gray-600 mb-2">❌ 내려놓기</h3>
              <div id="let-go-list" class="space-y-2"></div>
            </div>
          </div>
        </div>
        
        <!-- STEP 3: 행동하기 -->
        <div class="card mb-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            STEP 3: 행동하기 (Take Action)
          </h2>
          <p class="text-gray-600 mb-4">▶ 오늘의 TOP 3 할 일</p>
          
          <div id="top3-list" class="space-y-4"></div>
        </div>
        
        <!-- Statistics -->
        <div class="card">
          <h2 class="text-xl font-bold text-gray-800 mb-4">📊 오늘의 통계</h2>
          <div id="statistics" class="grid grid-cols-3 gap-4 text-center"></div>
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
    list.innerHTML = '<p class="text-gray-400 text-center py-4">아직 작성된 항목이 없습니다</p>'
    return
  }
  
  list.innerHTML = tasks.map(task => `
    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span class="flex-1">${task.title}</span>
      <div class="flex space-x-2">
        <select onchange="categorizeTask(${task.task_id}, this.value)" class="px-2 py-1 border rounded text-sm">
          <option value="">분류</option>
          <option value="URGENT_IMPORTANT">긴급·중요</option>
          <option value="IMPORTANT">중요</option>
          <option value="LATER">나중에</option>
          <option value="LET_GO">내려놓기</option>
        </select>
        <button onclick="deleteTask(${task.task_id})" class="text-red-500 hover:text-red-700">
          <i class="fas fa-trash"></i>
        </button>
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
    list.innerHTML = '<p class="text-gray-400 text-sm">없음</p>'
    return
  }
  
  list.innerHTML = tasks.map(task => `
    <div class="p-2 bg-gray-50 rounded text-sm">
      <div class="flex items-center justify-between mb-1">
        <span class="font-medium">${task.title}</span>
        <button onclick="deleteTask(${task.task_id})" class="text-red-500 hover:text-red-700">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>
      ${task.estimated_time ? `<div class="text-xs text-gray-500">⏱ ${task.estimated_time}</div>` : ''}
      <button onclick="promptSetTop3(${task.task_id})" class="text-xs text-primary hover:underline mt-1">
        TOP 3 설정
      </button>
    </div>
  `).join('')
}

// Render TOP 3 list
function renderTop3List(tasks) {
  const list = document.getElementById('top3-list')
  if (tasks.length === 0) {
    list.innerHTML = '<p class="text-gray-400 text-center py-4">TOP 3를 설정해주세요</p>'
    return
  }
  
  list.innerHTML = tasks.map((task, index) => `
    <div class="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
      <div class="flex items-start justify-between mb-2">
        <h3 class="text-lg font-bold text-gray-800">${index + 1}. ${task.title}</h3>
        <button onclick="${task.status === 'COMPLETED' ? `uncompleteTask(${task.task_id})` : `completeTask(${task.task_id})`}" 
          class="text-2xl ${task.status === 'COMPLETED' ? 'text-green-500' : 'text-gray-300'}">
          <i class="fas fa-check-circle"></i>
        </button>
      </div>
      ${task.action_detail ? `
        <p class="text-gray-600 text-sm mb-2">${task.action_detail}</p>
      ` : ''}
      ${task.time_slot ? `
        <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
          ${task.time_slot === 'MORNING' ? '🌅 오전' : task.time_slot === 'AFTERNOON' ? '☀️ 오후' : '🌙 저녁'}
        </span>
      ` : ''}
    </div>
  `).join('')
}

// Render statistics
function renderStatistics(stats) {
  const div = document.getElementById('statistics')
  div.innerHTML = `
    <div class="p-4 bg-blue-50 rounded-lg">
      <div class="text-3xl font-bold text-blue-600">${stats.totalTasks}</div>
      <div class="text-sm text-gray-600">전체 할 일</div>
    </div>
    <div class="p-4 bg-green-50 rounded-lg">
      <div class="text-3xl font-bold text-green-600">${stats.completedTasks}</div>
      <div class="text-sm text-gray-600">완료</div>
    </div>
    <div class="p-4 bg-purple-50 rounded-lg">
      <div class="text-3xl font-bold text-purple-600">${stats.completionRate}%</div>
      <div class="text-sm text-gray-600">완료율</div>
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
