import { Hono } from 'hono'
import type { 
  Env, 
  DailyTask, 
  TaskCreateRequest, 
  TaskCategorizeRequest,
  TaskTop3Request,
  DailyOverviewResponse 
} from '../types'
import { authMiddleware } from '../middleware/auth'
import { successResponse, errorResponse, getCurrentDate, getCurrentDateTime } from '../utils/response'

const tasks = new Hono<{ Bindings: Env }>()

// Apply auth middleware to all routes
tasks.use('/*', authMiddleware)

// STEP 1: Create brain dump task
tasks.post('/', async (c) => {
  try {
    const userId = c.get('userId') as number
    const body = await c.req.json<TaskCreateRequest>()
    const { task_date = getCurrentDate(), step, title, description = '' } = body

    if (!title || !step) {
      return errorResponse(c, 'Title and step are required', 400)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO daily_tasks (
        user_id, task_date, step, title, description, status
      ) VALUES (?, ?, ?, ?, ?, 'PENDING')
    `).bind(userId, task_date, step, title, description).run()

    const task = await c.env.DB.prepare(
      'SELECT * FROM daily_tasks WHERE task_id = ?'
    ).bind(result.meta.last_row_id).first<DailyTask>()

    return successResponse(c, task, '할 일이 추가되었습니다.', 201)
  } catch (error) {
    console.error('Create task error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// STEP 2: Categorize task
tasks.patch('/:taskId/categorize', async (c) => {
  try {
    const userId = c.get('userId') as number
    const taskId = c.req.param('taskId')
    const body = await c.req.json<TaskCategorizeRequest>()
    const { priority, estimated_time = '' } = body

    if (!priority) {
      return errorResponse(c, 'Priority is required', 400)
    }

    // Verify task ownership and get task details
    const task = await c.env.DB.prepare(
      'SELECT task_id, task_date, title, description FROM daily_tasks WHERE task_id = ? AND user_id = ?'
    ).bind(taskId, userId).first<DailyTask>()

    if (!task) {
      return errorResponse(c, '할 일을 찾을 수 없습니다.', 404)
    }

    await c.env.DB.prepare(`
      UPDATE daily_tasks 
      SET step = 'CATEGORIZE', priority = ?, estimated_time = ?, updated_at = ?
      WHERE task_id = ?
    `).bind(priority, estimated_time, getCurrentDateTime(), taskId).run()

    // If priority is LET_GO, also add to let_go_items table
    if (priority === 'LET_GO') {
      const content = task.description ? `${task.title} - ${task.description}` : task.title
      await c.env.DB.prepare(`
        INSERT INTO let_go_items (user_id, task_date, content) 
        VALUES (?, ?, ?)
      `).bind(userId, task.task_date, content).run()
    }

    const updatedTask = await c.env.DB.prepare(
      'SELECT * FROM daily_tasks WHERE task_id = ?'
    ).bind(taskId).first<DailyTask>()

    return successResponse(c, updatedTask, '분류가 완료되었습니다.')
  } catch (error) {
    console.error('Categorize task error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// STEP 3: Set TOP 3 task
tasks.patch('/:taskId/top3', async (c) => {
  try {
    const userId = c.get('userId') as number
    const taskId = c.req.param('taskId')
    const body = await c.req.json<TaskTop3Request>()
    const { order, action_detail, time_slot = null } = body

    if (!order || order < 1 || order > 3) {
      return errorResponse(c, 'Order must be between 1 and 3', 400)
    }

    // Verify task ownership
    const task = await c.env.DB.prepare(
      'SELECT task_id, task_date FROM daily_tasks WHERE task_id = ? AND user_id = ?'
    ).bind(taskId, userId).first()

    if (!task) {
      return errorResponse(c, '할 일을 찾을 수 없습니다.', 404)
    }

    // Clear existing TOP 3 with same order for the date
    await c.env.DB.prepare(`
      UPDATE daily_tasks 
      SET is_top3 = 0, top3_order = NULL
      WHERE user_id = ? AND task_date = ? AND top3_order = ?
    `).bind(userId, task.task_date, order).run()

    // Set new TOP 3
    await c.env.DB.prepare(`
      UPDATE daily_tasks 
      SET step = 'ACTION', is_top3 = 1, top3_order = ?, action_detail = ?, time_slot = ?, updated_at = ?
      WHERE task_id = ?
    `).bind(order, action_detail, time_slot, getCurrentDateTime(), taskId).run()

    const updatedTask = await c.env.DB.prepare(
      'SELECT * FROM daily_tasks WHERE task_id = ?'
    ).bind(taskId).first<DailyTask>()

    return successResponse(c, updatedTask, 'TOP 3 설정이 완료되었습니다.')
  } catch (error) {
    console.error('Set TOP 3 error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Get daily overview
tasks.get('/daily/:date', async (c) => {
  try {
    const userId = c.get('userId') as number
    const date = c.req.param('date')

    const allTasks = await c.env.DB.prepare(
      'SELECT * FROM daily_tasks WHERE user_id = ? AND task_date = ? ORDER BY created_at ASC'
    ).bind(userId, date).all<DailyTask>()

    const tasks = allTasks.results || []

    // Group tasks
    const brainDumpTasks = tasks.filter(t => t.step === 'BRAIN_DUMP')
    const urgentImportantTasks = tasks.filter(t => t.priority === 'URGENT_IMPORTANT')
    const importantTasks = tasks.filter(t => t.priority === 'IMPORTANT')
    const laterTasks = tasks.filter(t => t.priority === 'LATER')
    const letGoTasks = tasks.filter(t => t.priority === 'LET_GO')
    const top3Tasks = tasks.filter(t => t.is_top3 === 1).sort((a, b) => 
      (a.top3_order || 0) - (b.top3_order || 0)
    )

    // Calculate statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const response: DailyOverviewResponse = {
      date,
      brainDumpTasks,
      urgentImportantTasks,
      importantTasks,
      laterTasks,
      letGoTasks,
      top3Tasks,
      statistics: {
        totalTasks,
        completedTasks,
        completionRate
      }
    }

    return successResponse(c, response)
  } catch (error) {
    console.error('Get daily overview error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Complete task
tasks.patch('/:taskId/complete', async (c) => {
  try {
    const userId = c.get('userId') as number
    const taskId = c.req.param('taskId')

    const task = await c.env.DB.prepare(
      'SELECT task_id FROM daily_tasks WHERE task_id = ? AND user_id = ?'
    ).bind(taskId, userId).first()

    if (!task) {
      return errorResponse(c, '할 일을 찾을 수 없습니다.', 404)
    }

    await c.env.DB.prepare(`
      UPDATE daily_tasks 
      SET status = 'COMPLETED', completed_at = ?, updated_at = ?
      WHERE task_id = ?
    `).bind(getCurrentDateTime(), getCurrentDateTime(), taskId).run()

    const updatedTask = await c.env.DB.prepare(
      'SELECT * FROM daily_tasks WHERE task_id = ?'
    ).bind(taskId).first<DailyTask>()

    return successResponse(c, updatedTask, '완료 처리되었습니다.')
  } catch (error) {
    console.error('Complete task error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Delete task
tasks.delete('/:taskId', async (c) => {
  try {
    const userId = c.get('userId') as number
    const taskId = c.req.param('taskId')

    const task = await c.env.DB.prepare(
      'SELECT task_id FROM daily_tasks WHERE task_id = ? AND user_id = ?'
    ).bind(taskId, userId).first()

    if (!task) {
      return errorResponse(c, '할 일을 찾을 수 없습니다.', 404)
    }

    await c.env.DB.prepare(
      'DELETE FROM daily_tasks WHERE task_id = ?'
    ).bind(taskId).run()

    return successResponse(c, null, '삭제되었습니다.', 204)
  } catch (error) {
    console.error('Delete task error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Update task
tasks.put('/:taskId', async (c) => {
  try {
    const userId = c.get('userId') as number
    const taskId = c.req.param('taskId')
    const body = await c.req.json()

    const task = await c.env.DB.prepare(
      'SELECT task_id FROM daily_tasks WHERE task_id = ? AND user_id = ?'
    ).bind(taskId, userId).first()

    if (!task) {
      return errorResponse(c, '할 일을 찾을 수 없습니다.', 404)
    }

    const updates: string[] = []
    const values: any[] = []

    if (body.title !== undefined) {
      updates.push('title = ?')
      values.push(body.title)
    }
    if (body.description !== undefined) {
      updates.push('description = ?')
      values.push(body.description)
    }
    if (body.estimated_time !== undefined) {
      updates.push('estimated_time = ?')
      values.push(body.estimated_time)
    }
    if (body.status !== undefined) {
      updates.push('status = ?')
      values.push(body.status)
    }
    if (body.time_slot !== undefined) {
      updates.push('time_slot = ?')
      values.push(body.time_slot)
    }

    if (updates.length === 0) {
      return errorResponse(c, '업데이트할 내용이 없습니다.', 400)
    }

    updates.push('updated_at = ?')
    values.push(getCurrentDateTime())
    values.push(taskId)

    await c.env.DB.prepare(`
      UPDATE daily_tasks SET ${updates.join(', ')} WHERE task_id = ?
    `).bind(...values).run()

    const updatedTask = await c.env.DB.prepare(
      'SELECT * FROM daily_tasks WHERE task_id = ?'
    ).bind(taskId).first<DailyTask>()

    return successResponse(c, updatedTask, '수정되었습니다.')
  } catch (error) {
    console.error('Update task error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

export default tasks
