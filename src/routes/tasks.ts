import { Hono } from 'hono'
import type { 
  Env, 
  DailyTask, 
  TaskCreateRequest, 
  TaskUpdateRequest,
  TaskCategorizeRequest,
  TaskTop3Request,
  DailyOverviewResponse,
  IncompleteTasksResponse
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
    let { order, action_detail, time_slot = null } = body

    if (!action_detail) {
      return errorResponse(c, 'Action detail is required', 400)
    }

    // Verify task ownership
    const task = await c.env.DB.prepare(
      'SELECT task_id, task_date FROM daily_tasks WHERE task_id = ? AND user_id = ?'
    ).bind(taskId, userId).first()

    if (!task) {
      return errorResponse(c, '할 일을 찾을 수 없습니다.', 404)
    }

    // If order is provided, validate it
    if (order) {
      if (order < 1 || order > 3) {
        return errorResponse(c, 'Order must be between 1 and 3', 400)
      }

      // Check if the order is already taken
      const existingTop3 = await c.env.DB.prepare(
        'SELECT task_id FROM daily_tasks WHERE user_id = ? AND task_date = ? AND top3_order = ? AND is_top3 = 1'
      ).bind(userId, task.task_date, order).first()

      if (existingTop3 && existingTop3.task_id !== taskId) {
        return errorResponse(c, `${order}순위는 이미 다른 항목이 사용 중입니다. 다른 순위를 선택해주세요.`, 409)
      }
    } else {
      // Auto-assign to the first available slot (1, 2, or 3)
      const existingTop3s = await c.env.DB.prepare(
        'SELECT top3_order FROM daily_tasks WHERE user_id = ? AND task_date = ? AND is_top3 = 1 ORDER BY top3_order'
      ).bind(userId, task.task_date).all()

      const usedOrders = new Set(existingTop3s.results?.map(t => t.top3_order) || [])
      
      // Find first available slot
      for (let i = 1; i <= 3; i++) {
        if (!usedOrders.has(i)) {
          order = i
          break
        }
      }

      if (!order) {
        return errorResponse(c, 'TOP 3가 모두 차있습니다. 기존 항목을 삭제하거나 순서를 변경해주세요.', 400)
      }
    }

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
      'SELECT task_id, priority, task_date, title, description FROM daily_tasks WHERE task_id = ? AND user_id = ?'
    ).bind(taskId, userId).first<DailyTask>()

    if (!task) {
      return errorResponse(c, '할 일을 찾을 수 없습니다.', 404)
    }

    // If task is LET_GO priority, also delete from let_go_items table
    if (task.priority === 'LET_GO') {
      const content = task.description ? `${task.title} - ${task.description}` : task.title
      await c.env.DB.prepare(
        'DELETE FROM let_go_items WHERE user_id = ? AND task_date = ? AND content = ?'
      ).bind(userId, task.task_date, content).run()
    }

    await c.env.DB.prepare(
      'DELETE FROM daily_tasks WHERE task_id = ?'
    ).bind(taskId).run()

    return c.json({ success: true, message: '삭제되었습니다.' }, 200)
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
    if (body.priority !== undefined) {
      updates.push('priority = ?')
      values.push(body.priority)
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
      values.push(body.time_slot || null)
    }
    if (body.due_date !== undefined) {
      updates.push('due_date = ?')
      values.push(body.due_date || null)
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

// Get incomplete tasks grouped by due date
tasks.get('/incomplete', async (c) => {
  try {
    const userId = c.get('userId') as number
    
    const incompleteTasks = await c.env.DB.prepare(`
      SELECT * FROM daily_tasks
      WHERE user_id = ? AND status != 'COMPLETED'
      ORDER BY 
        CASE 
          WHEN due_date IS NULL THEN 2
          WHEN due_date < date('now') THEN 0
          WHEN due_date = date('now') THEN 1
          ELSE 3
        END,
        due_date ASC,
        created_at DESC
    `).bind(userId).all()
    
    // Group by due date status
    const today = getCurrentDate()
    const grouped: any = {
      overdue: [],
      today: [],
      upcoming: [],
      no_due_date: []
    }
    
    incompleteTasks.results.forEach((task: any) => {
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
    console.error('Get incomplete tasks error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

export default tasks
