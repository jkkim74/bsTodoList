import { Hono } from 'hono'
import type { Env } from '../types'
import { authMiddleware } from '../middleware/auth'
import { successResponse, errorResponse } from '../utils/response'

const stats = new Hono<{ Bindings: Env }>()

// Apply auth middleware to all routes
stats.use('/*', authMiddleware)

// GET /api/stats/daily?start_date=2025-12-01&end_date=2025-12-31
stats.get('/daily', async (c) => {
  try {
    const userId = c.get('userId') as number
    const startDate = c.req.query('start_date') || ''
    const endDate = c.req.query('end_date') || ''
    
    if (!startDate || !endDate) {
      return errorResponse(c, 'start_date and end_date are required', 400)
    }
    
    const dailyStats = await c.env.DB.prepare(`
      SELECT 
        task_date,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN is_top3 = 1 THEN 1 ELSE 0 END) as top3_tasks,
        SUM(CASE WHEN is_top3 = 1 AND status = 'COMPLETED' THEN 1 ELSE 0 END) as top3_completed,
        ROUND(
          CAST(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 
          2
        ) as completion_rate
      FROM daily_tasks
      WHERE user_id = ? 
        AND task_date BETWEEN ? AND ?
      GROUP BY task_date
      ORDER BY task_date DESC
    `).bind(userId, startDate, endDate).all()
    
    return successResponse(c, dailyStats.results)
  } catch (error) {
    console.error('Daily stats error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// GET /api/stats/weekly?start_date=2025-12-16&end_date=2025-12-22
stats.get('/weekly', async (c) => {
  try {
    const userId = c.get('userId') as number
    const startDate = c.req.query('start_date') || ''
    const endDate = c.req.query('end_date') || ''
    
    if (!startDate || !endDate) {
      return errorResponse(c, 'start_date and end_date are required', 400)
    }
    
    // 주간 통계
    const weeklyStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
        ROUND(
          CAST(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 
          2
        ) as completion_rate,
        SUM(CASE WHEN is_top3 = 1 THEN 1 ELSE 0 END) as top3_tasks,
        SUM(CASE WHEN is_top3 = 1 AND status = 'COMPLETED' THEN 1 ELSE 0 END) as top3_completed,
        ROUND(
          CAST(SUM(CASE WHEN is_top3 = 1 AND status = 'COMPLETED' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(SUM(CASE WHEN is_top3 = 1 THEN 1 ELSE 0 END), 0) * 100, 
          2
        ) as top3_completion_rate
      FROM daily_tasks
      WHERE user_id = ? 
        AND task_date BETWEEN ? AND ?
    `).bind(userId, startDate, endDate).first()
    
    // 일별 완료율 추이
    const dailyTrend = await c.env.DB.prepare(`
      SELECT 
        task_date,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
        ROUND(
          CAST(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 
          2
        ) as completion_rate
      FROM daily_tasks
      WHERE user_id = ? 
        AND task_date BETWEEN ? AND ?
      GROUP BY task_date
      ORDER BY task_date
    `).bind(userId, startDate, endDate).all()
    
    // 가장 생산적인 날 찾기
    const mostProductiveDay = dailyTrend.results.length > 0 
      ? dailyTrend.results.reduce((prev, current) => 
          (current.completion_rate > prev.completion_rate) ? current : prev
        )
      : null
    
    return successResponse(c, {
      summary: weeklyStats,
      daily_trend: dailyTrend.results,
      most_productive_day: mostProductiveDay
    })
  } catch (error) {
    console.error('Weekly stats error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

// GET /api/stats/monthly?year=2025&month=12
stats.get('/monthly', async (c) => {
  try {
    const userId = c.get('userId') as number
    const year = c.req.query('year') || new Date().getFullYear().toString()
    const month = c.req.query('month') || (new Date().getMonth() + 1).toString().padStart(2, '0')
    
    const startDate = `${year}-${month}-01`
    const endDate = `${year}-${month}-31`
    
    // 월간 통계
    const monthlyStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT task_date) as working_days,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
        ROUND(
          CAST(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 
          2
        ) as avg_completion_rate,
        SUM(CASE WHEN is_top3 = 1 THEN 1 ELSE 0 END) as top3_tasks,
        SUM(CASE WHEN is_top3 = 1 AND status = 'COMPLETED' THEN 1 ELSE 0 END) as top3_completed,
        ROUND(
          CAST(SUM(CASE WHEN is_top3 = 1 AND status = 'COMPLETED' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(SUM(CASE WHEN is_top3 = 1 THEN 1 ELSE 0 END), 0) * 100, 
          2
        ) as top3_completion_rate
      FROM daily_tasks
      WHERE user_id = ? 
        AND task_date BETWEEN ? AND ?
    `).bind(userId, startDate, endDate).first()
    
    // 일별 완료율 추이
    const dailyTrend = await c.env.DB.prepare(`
      SELECT 
        task_date,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
        ROUND(
          CAST(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 
          2
        ) as completion_rate
      FROM daily_tasks
      WHERE user_id = ? 
        AND task_date BETWEEN ? AND ?
      GROUP BY task_date
      ORDER BY task_date
    `).bind(userId, startDate, endDate).all()
    
    // 최고 완료율 날짜
    const bestDay = dailyTrend.results.length > 0
      ? dailyTrend.results.reduce((prev, current) =>
          (current.completion_rate > prev.completion_rate) ? current : prev
        )
      : null
    
    // 연속 작업일 수 계산
    let currentStreak = 0
    let maxStreak = 0
    let lastDate: Date | null = null
    
    dailyTrend.results.forEach((day: any) => {
      const currentDate = new Date(day.task_date)
      if (lastDate) {
        const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          currentStreak++
        } else {
          maxStreak = Math.max(maxStreak, currentStreak)
          currentStreak = 1
        }
      } else {
        currentStreak = 1
      }
      lastDate = currentDate
    })
    maxStreak = Math.max(maxStreak, currentStreak)
    
    return successResponse(c, {
      summary: monthlyStats,
      daily_trend: dailyTrend.results,
      best_day: bestDay,
      max_streak: maxStreak
    })
  } catch (error) {
    console.error('Monthly stats error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

export default stats
