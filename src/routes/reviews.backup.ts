import { Hono } from 'hono'
import type { Env, DailyReview, ReviewRequest } from '../types'
import { authMiddleware } from '../middleware/auth'
import { successResponse, errorResponse, getCurrentDateTime } from '../utils/response'

const reviews = new Hono<{ Bindings: Env }>()

reviews.use('/*', authMiddleware)

// Create or update review
reviews.post('/', async (c) => {
  try {
    const userId = c.get('userId') as number
    const body = await c.req.json<ReviewRequest>()
    const { 
      review_date, 
      morning_energy, 
      current_mood,
      stress_level,
      stress_factors,
      well_done_1, 
      well_done_2, 
      well_done_3,
      improvement,
      gratitude
    } = body

    if (!review_date) {
      return errorResponse(c, 'Review date is required', 400)
    }

    // Check if review exists
    const existingReview = await c.env.DB.prepare(
      'SELECT review_id FROM daily_reviews WHERE user_id = ? AND review_date = ?'
    ).bind(userId, review_date).first()

    if (existingReview) {
      // Update existing review
      await c.env.DB.prepare(`
        UPDATE daily_reviews 
        SET morning_energy = ?, current_mood = ?, stress_level = ?, stress_factors = ?,
            well_done_1 = ?, well_done_2 = ?, well_done_3 = ?,
            improvement = ?, gratitude = ?, updated_at = ?
        WHERE review_id = ?
      `).bind(
        morning_energy ?? null, 
        current_mood ?? null, 
        stress_level ?? null, 
        stress_factors ?? null,
        well_done_1 ?? null, 
        well_done_2 ?? null, 
        well_done_3 ?? null,
        improvement ?? null, 
        gratitude ?? null, 
        getCurrentDateTime(),
        existingReview.review_id
      ).run()

      const review = await c.env.DB.prepare(
        'SELECT * FROM daily_reviews WHERE review_id = ?'
      ).bind(existingReview.review_id).first<DailyReview>()

      return successResponse(c, review, '회고가 수정되었습니다.')
    } else {
      // Create new review
      const result = await c.env.DB.prepare(`
        INSERT INTO daily_reviews (
          user_id, review_date, morning_energy, current_mood, stress_level, stress_factors,
          well_done_1, well_done_2, well_done_3, improvement, gratitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId, 
        review_date, 
        morning_energy ?? null, 
        current_mood ?? null, 
        stress_level ?? null, 
        stress_factors ?? null,
        well_done_1 ?? null, 
        well_done_2 ?? null, 
        well_done_3 ?? null, 
        improvement ?? null, 
        gratitude ?? null
      ).run()

      const review = await c.env.DB.prepare(
        'SELECT * FROM daily_reviews WHERE review_id = ?'
      ).bind(result.meta.last_row_id).first<DailyReview>()

      return successResponse(c, review, '회고가 작성되었습니다.', 201)
    }
  } catch (error) {
    console.error('Review error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// Get review by date
reviews.get('/:date', async (c) => {
  try {
    const userId = c.get('userId') as number
    const date = c.req.param('date')

    const review = await c.env.DB.prepare(
      'SELECT * FROM daily_reviews WHERE user_id = ? AND review_date = ?'
    ).bind(userId, date).first<DailyReview>()

    if (!review) {
      return successResponse(c, null, '회고를 찾을 수 없습니다.')
    }

    return successResponse(c, review)
  } catch (error) {
    console.error('Get review error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

export default reviews
