import { Hono } from 'hono'
import type { Env, LetGoItem, LetGoRequest } from '../types'
import { authMiddleware } from '../middleware/auth'
import { successResponse, errorResponse } from '../utils/response'

const letgo = new Hono<{ Bindings: Env }>()

letgo.use('/*', authMiddleware)

// Create let go item
letgo.post('/', async (c) => {
  try {
    const userId = c.get('userId') as number
    const body = await c.req.json<LetGoRequest>()
    const { task_date, content } = body

    if (!task_date || !content) {
      return errorResponse(c, 'Task date and content are required', 400)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO let_go_items (user_id, task_date, content) 
      VALUES (?, ?, ?)
    `).bind(userId, task_date, content).run()

    const item = await c.env.DB.prepare(
      'SELECT * FROM let_go_items WHERE let_go_id = ?'
    ).bind(result.meta.last_row_id).first<LetGoItem>()

    return successResponse(c, item, '내려놓기 항목이 추가되었습니다.', 201)
  } catch (error) {
    console.error('Create let go error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Get let go items by date
letgo.get('/:date', async (c) => {
  try {
    const userId = c.get('userId') as number
    const date = c.req.param('date')

    const result = await c.env.DB.prepare(
      'SELECT * FROM let_go_items WHERE user_id = ? AND task_date = ? ORDER BY created_at DESC'
    ).bind(userId, date).all<LetGoItem>()

    return successResponse(c, result.results || [])
  } catch (error) {
    console.error('Get let go items error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Delete let go item
letgo.delete('/:letGoId', async (c) => {
  try {
    const userId = c.get('userId') as number
    const letGoId = c.req.param('letGoId')

    const item = await c.env.DB.prepare(
      'SELECT let_go_id FROM let_go_items WHERE let_go_id = ? AND user_id = ?'
    ).bind(letGoId, userId).first()

    if (!item) {
      return errorResponse(c, '항목을 찾을 수 없습니다.', 404)
    }

    await c.env.DB.prepare(
      'DELETE FROM let_go_items WHERE let_go_id = ?'
    ).bind(letGoId).run()

    return successResponse(c, null, '삭제되었습니다.', 204)
  } catch (error) {
    console.error('Delete let go error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

export default letgo
