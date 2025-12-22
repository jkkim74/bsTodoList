import { Hono } from 'hono'
import type { Env, FreeNote, FreeNoteRequest } from '../types'
import { authMiddleware } from '../middleware/auth'
import { successResponse, errorResponse, getCurrentDateTime } from '../utils/response'

const notes = new Hono<{ Bindings: Env }>()

notes.use('/*', authMiddleware)

// Create or update note
notes.post('/', async (c) => {
  try {
    const userId = c.get('userId') as number
    const body = await c.req.json<FreeNoteRequest>()
    const { note_date, content } = body

    if (!note_date || !content) {
      return errorResponse(c, 'Note date and content are required', 400)
    }

    // Check if note exists for this date
    const existingNote = await c.env.DB.prepare(
      'SELECT note_id FROM free_notes WHERE user_id = ? AND note_date = ?'
    ).bind(userId, note_date).first()

    if (existingNote) {
      // Update existing note
      await c.env.DB.prepare(`
        UPDATE free_notes 
        SET content = ?, updated_at = ?
        WHERE note_id = ?
      `).bind(content, getCurrentDateTime(), existingNote.note_id).run()

      const note = await c.env.DB.prepare(
        'SELECT * FROM free_notes WHERE note_id = ?'
      ).bind(existingNote.note_id).first<FreeNote>()

      return successResponse(c, note, '메모가 수정되었습니다.')
    } else {
      // Create new note
      const result = await c.env.DB.prepare(`
        INSERT INTO free_notes (user_id, note_date, content) 
        VALUES (?, ?, ?)
      `).bind(userId, note_date, content).run()

      const note = await c.env.DB.prepare(
        'SELECT * FROM free_notes WHERE note_id = ?'
      ).bind(result.meta.last_row_id).first<FreeNote>()

      return successResponse(c, note, '메모가 저장되었습니다.', 201)
    }
  } catch (error) {
    console.error('Save note error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Get note by date
notes.get('/:date', async (c) => {
  try {
    const userId = c.get('userId') as number
    const date = c.req.param('date')

    const note = await c.env.DB.prepare(
      'SELECT * FROM free_notes WHERE user_id = ? AND note_date = ?'
    ).bind(userId, date).first<FreeNote>()

    return successResponse(c, note || null)
  } catch (error) {
    console.error('Get note error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Get all notes (recent first)
notes.get('/', async (c) => {
  try {
    const userId = c.get('userId') as number
    const limit = parseInt(c.req.query('limit') || '30')

    const result = await c.env.DB.prepare(
      'SELECT * FROM free_notes WHERE user_id = ? ORDER BY note_date DESC LIMIT ?'
    ).bind(userId, limit).all<FreeNote>()

    return successResponse(c, result.results || [])
  } catch (error) {
    console.error('Get notes error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Delete note
notes.delete('/:noteId', async (c) => {
  try {
    const userId = c.get('userId') as number
    const noteId = c.req.param('noteId')

    const note = await c.env.DB.prepare(
      'SELECT note_id FROM free_notes WHERE note_id = ? AND user_id = ?'
    ).bind(noteId, userId).first()

    if (!note) {
      return errorResponse(c, '메모를 찾을 수 없습니다.', 404)
    }

    await c.env.DB.prepare(
      'DELETE FROM free_notes WHERE note_id = ?'
    ).bind(noteId).run()

    return c.json({ success: true, message: '삭제되었습니다.' }, 200)
  } catch (error) {
    console.error('Delete note error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

export default notes
