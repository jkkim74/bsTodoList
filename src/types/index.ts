// Database bindings
export interface Env {
  DB: D1Database
}

// User types
export interface User {
  user_id: number
  email: string
  password: string
  username: string
  created_at: string
  updated_at: string
  last_login_at: string | null
  is_active: number
}

// Task enums
export type TaskStep = 'BRAIN_DUMP' | 'CATEGORIZE' | 'ACTION'
export type TaskPriority = 'URGENT_IMPORTANT' | 'IMPORTANT' | 'LATER' | 'LET_GO'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
export type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING'

// Task types
export interface DailyTask {
  task_id: number
  user_id: number
  task_date: string
  step: TaskStep
  priority: TaskPriority | null
  title: string
  description: string | null
  estimated_time: string | null
  status: TaskStatus
  is_top3: number
  top3_order: number | null
  action_detail: string | null
  completed_at: string | null
  time_slot: TimeSlot | null
  created_at: string
  updated_at: string
}

// Review types
export type EnergyLevel = 'VERY_GOOD' | 'GOOD' | 'NORMAL' | 'TIRED' | 'VERY_TIRED'

export interface DailyReview {
  review_id: number
  user_id: number
  review_date: string
  morning_energy: EnergyLevel | null
  current_mood: string | null
  stress_factors: string | null
  well_done_1: string | null
  well_done_2: string | null
  well_done_3: string | null
  improvement: string | null
  gratitude: string | null
  created_at: string
  updated_at: string
}

// Weekly goal types
export type GoalStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface WeeklyGoal {
  goal_id: number
  user_id: number
  week_start_date: string
  week_end_date: string
  goal_order: number
  title: string
  progress_rate: number
  target_date: string | null
  status: GoalStatus
  created_at: string
  updated_at: string
}

// Free note types
export interface FreeNote {
  note_id: number
  user_id: number
  note_date: string
  content: string | null
  created_at: string
  updated_at: string
}

// Let go item types
export interface LetGoItem {
  let_go_id: number
  user_id: number
  task_date: string
  content: string
  created_at: string
}

// Request types
export interface SignupRequest {
  email: string
  password: string
  username: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TaskCreateRequest {
  task_date?: string
  step: TaskStep
  title: string
  description?: string
}

export interface TaskUpdateRequest {
  priority?: TaskPriority
  estimated_time?: string
  description?: string
  status?: TaskStatus
}

export interface TaskCategorizeRequest {
  priority: TaskPriority
  estimated_time?: string
}

export interface TaskTop3Request {
  order: number
  action_detail: string
  time_slot?: TimeSlot
}

export interface ReviewRequest {
  review_date: string
  morning_energy?: EnergyLevel
  current_mood?: string
  stress_factors?: string
  well_done_1?: string
  well_done_2?: string
  well_done_3?: string
  improvement?: string
  gratitude?: string
}

export interface WeeklyGoalRequest {
  week_start_date: string
  week_end_date: string
  goal_order: number
  title: string
  target_date?: string
}

export interface LetGoRequest {
  task_date: string
  content: string
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface AuthResponse {
  user_id: number
  email: string
  username: string
  token: string
}

export interface DailyOverviewResponse {
  date: string
  brainDumpTasks: DailyTask[]
  urgentImportantTasks: DailyTask[]
  importantTasks: DailyTask[]
  laterTasks: DailyTask[]
  top3Tasks: DailyTask[]
  statistics: {
    totalTasks: number
    completedTasks: number
    completionRate: number
  }
}

// JWT payload
export interface JWTPayload {
  userId: number
  email: string
  exp: number
}
