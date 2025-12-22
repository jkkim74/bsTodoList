import { Hono } from 'hono'
import type { Env, DailyReview, ReviewRequest } from '../types'
import { authMiddleware } from '../middleware/auth'
import { successResponse, errorResponse, getCurrentDateTime } from '../utils/response'

const reviews = new Hono<{ Bindings: Env }>()

reviews.use('/*', authMiddleware)

// Helper function to safely convert undefined to null
const toNull = <T>(value: T | undefined): T | null => {
  return value === undefined ? null : value
}

// Create or update review
reviews.post('/', async (c) => {
  try {
    const userId = c.get('userId') as number
    const body = await c.req.json<ReviewRequest>()
    
    console.log('👤 User ID from auth:', userId, 'Type:', typeof userId)
    console.log('📝 Review request body:', JSON.stringify(body, null, 2))
    
    // Verify user exists
    const userCheck = await c.env.DB.prepare(
      'SELECT user_id, email FROM users WHERE user_id = ?'
    ).bind(userId).first()
    
    console.log('🔍 User exists check:', userCheck ? 'YES' : 'NO', userCheck)
    
    if (!userCheck) {
      console.error('❌ User not found in database:', userId)
      return errorResponse(c, 'User not found', 404)
    }
    
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

    // Convert all undefined values to null
    const safeData = {
      morning_energy: toNull(morning_energy),
      current_mood: toNull(current_mood),
      stress_level: toNull(stress_level),
      stress_factors: toNull(stress_factors),
      well_done_1: toNull(well_done_1),
      well_done_2: toNull(well_done_2),
      well_done_3: toNull(well_done_3),
      improvement: toNull(improvement),
      gratitude: toNull(gratitude)
    }

    console.log('✅ Safe data (undefined→null):', JSON.stringify(safeData, null, 2))

    // Check if review exists
    const existingReview = await c.env.DB.prepare(
      'SELECT review_id FROM daily_reviews WHERE user_id = ? AND review_date = ?'
    ).bind(userId, review_date).first()

    if (existingReview) {
      // Update existing review
      console.log('🔄 Updating existing review:', existingReview.review_id)
      
      await c.env.DB.prepare(`
        UPDATE daily_reviews 
        SET morning_energy = ?, current_mood = ?, stress_level = ?, stress_factors = ?,
            well_done_1 = ?, well_done_2 = ?, well_done_3 = ?,
            improvement = ?, gratitude = ?, updated_at = ?
        WHERE review_id = ?
      `).bind(
        safeData.morning_energy,
        safeData.current_mood,
        safeData.stress_level,
        safeData.stress_factors,
        safeData.well_done_1,
        safeData.well_done_2,
        safeData.well_done_3,
        safeData.improvement,
        safeData.gratitude,
        getCurrentDateTime(),
        existingReview.review_id
      ).run()

      const review = await c.env.DB.prepare(
        'SELECT * FROM daily_reviews WHERE review_id = ?'
      ).bind(existingReview.review_id).first<DailyReview>()

      return successResponse(c, review, '회고가 수정되었습니다.')
    } else {
      // Create new review
      console.log('➕ Creating new review')
      
      const result = await c.env.DB.prepare(`
        INSERT INTO daily_reviews (
          user_id, review_date, morning_energy, current_mood, stress_level, stress_factors,
          well_done_1, well_done_2, well_done_3, improvement, gratitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        review_date,
        safeData.morning_energy,
        safeData.current_mood,
        safeData.stress_level,
        safeData.stress_factors,
        safeData.well_done_1,
        safeData.well_done_2,
        safeData.well_done_3,
        safeData.improvement,
        safeData.gratitude
      ).run()

      const review = await c.env.DB.prepare(
        'SELECT * FROM daily_reviews WHERE review_id = ?'
      ).bind(result.meta.last_row_id).first<DailyReview>()

      return successResponse(c, review, '회고가 작성되었습니다.', 201)
    }
  } catch (error) {
    console.error('❌ Review error:', error)
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
