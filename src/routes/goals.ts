import { Hono } from 'hono'
import type { Env, WeeklyGoal, WeeklyGoalRequest } from '../types'
import { authMiddleware } from '../middleware/auth'
import { successResponse, errorResponse, getCurrentDateTime } from '../utils/response'

const goals = new Hono<{ Bindings: Env }>()

goals.use('/*', authMiddleware)

// Create weekly goal
goals.post('/', async (c) => {
  try {
    const userId = c.get('userId') as number
    const body = await c.req.json<WeeklyGoalRequest>()
    const { week_start_date, week_end_date, goal_order, title, target_date } = body

    if (!week_start_date || !week_end_date || !goal_order || !title) {
      return errorResponse(c, 'Week dates, goal order, and title are required', 400)
    }

    if (goal_order < 1 || goal_order > 3) {
      return errorResponse(c, 'Goal order must be between 1 and 3', 400)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO weekly_goals (
        user_id, week_start_date, week_end_date, goal_order, title, target_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'IN_PROGRESS')
    `).bind(userId, week_start_date, week_end_date, goal_order, title, target_date).run()

    const goal = await c.env.DB.prepare(
      'SELECT * FROM weekly_goals WHERE goal_id = ?'
    ).bind(result.meta.last_row_id).first<WeeklyGoal>()

    return successResponse(c, goal, '주간 목표가 추가되었습니다.', 201)
  } catch (error) {
    console.error('Create goal error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Get current week goals
goals.get('/current', async (c) => {
  try {
    const userId = c.get('userId') as number
    
    // Get current week start and end
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // adjust when day is sunday
    const weekStart = new Date(now.setDate(diff))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    const result = await c.env.DB.prepare(`
      SELECT * FROM weekly_goals 
      WHERE user_id = ? AND week_start_date = ? AND week_end_date = ?
      ORDER BY goal_order ASC
    `).bind(userId, weekStartStr, weekEndStr).all<WeeklyGoal>()

    const data = {
      weekStartDate: weekStartStr,
      weekEndDate: weekEndStr,
      goals: result.results || []
    }

    return successResponse(c, data)
  } catch (error) {
    console.error('Get current goals error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Update goal progress
goals.patch('/:goalId/progress', async (c) => {
  try {
    const userId = c.get('userId') as number
    const goalId = c.req.param('goalId')
    const body = await c.req.json<{ progress_rate: number }>()
    const { progress_rate } = body

    if (progress_rate === undefined || progress_rate < 0 || progress_rate > 100) {
      return errorResponse(c, 'Progress rate must be between 0 and 100', 400)
    }

    const goal = await c.env.DB.prepare(
      'SELECT goal_id FROM weekly_goals WHERE goal_id = ? AND user_id = ?'
    ).bind(goalId, userId).first()

    if (!goal) {
      return errorResponse(c, '목표를 찾을 수 없습니다.', 404)
    }

    const status = progress_rate === 100 ? 'COMPLETED' : 'IN_PROGRESS'

    await c.env.DB.prepare(`
      UPDATE weekly_goals 
      SET progress_rate = ?, status = ?, updated_at = ?
      WHERE goal_id = ?
    `).bind(progress_rate, status, getCurrentDateTime(), goalId).run()

    const updatedGoal = await c.env.DB.prepare(
      'SELECT * FROM weekly_goals WHERE goal_id = ?'
    ).bind(goalId).first<WeeklyGoal>()

    return successResponse(c, updatedGoal, '진행률이 업데이트되었습니다.')
  } catch (error) {
    console.error('Update progress error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Delete goal
goals.delete('/:goalId', async (c) => {
  try {
    const userId = c.get('userId') as number
    const goalId = c.req.param('goalId')

    const goal = await c.env.DB.prepare(
      'SELECT goal_id FROM weekly_goals WHERE goal_id = ? AND user_id = ?'
    ).bind(goalId, userId).first()

    if (!goal) {
      return errorResponse(c, '목표를 찾을 수 없습니다.', 404)
    }

    await c.env.DB.prepare(
      'DELETE FROM weekly_goals WHERE goal_id = ?'
    ).bind(goalId).run()

    return successResponse(c, null, '삭제되었습니다.', 204)
  } catch (error) {
    console.error('Delete goal error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

export default goals
