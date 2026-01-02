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
      ORDER BY task_date ASC
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
// Returns last 6 months trend (including current month)
stats.get('/monthly', async (c) => {
  try {
    const userId = c.get('userId') as number
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString())
    const month = parseInt(c.req.query('month') || (new Date().getMonth() + 1).toString())
    
    // Calculate 6 months range (current month - 5 months)
    const startDate = new Date(year, month - 6, 1) // 6 months ago start
    const endDate = new Date(year, month, 0) // Current month last day
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    // Monthly trend (group by year-month)
    const monthlyTrend = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', task_date) as month,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
        ROUND(
          CAST(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 
          2
        ) as completion_rate,
        SUM(CASE WHEN is_top3 = 1 THEN 1 ELSE 0 END) as top3_tasks,
        SUM(CASE WHEN is_top3 = 1 AND status = 'COMPLETED' THEN 1 ELSE 0 END) as top3_completed,
        COUNT(DISTINCT task_date) as working_days
      FROM daily_tasks
      WHERE user_id = ? 
        AND task_date BETWEEN ? AND ?
      GROUP BY strftime('%Y-%m', task_date)
      ORDER BY month
    `).bind(userId, startDateStr, endDateStr).all()
    
    // Overall summary for the 6 months
    const monthlyStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT strftime('%Y-%m', task_date)) as total_months,
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
    `).bind(userId, startDateStr, endDateStr).first()
    
    // Best month (highest completion rate)
    const bestMonth = monthlyTrend.results.length > 0
      ? monthlyTrend.results.reduce((prev, current) =>
          (current.completion_rate > prev.completion_rate) ? current : prev
        )
      : null
    
    // Max streak calculation across all days in 6 months
    const allDays = await c.env.DB.prepare(`
      SELECT DISTINCT task_date
      FROM daily_tasks
      WHERE user_id = ? 
        AND task_date BETWEEN ? AND ?
      ORDER BY task_date
    `).bind(userId, startDateStr, endDateStr).all()
    
    let currentStreak = 0
    let maxStreak = 0
    let lastDate: Date | null = null
    
    allDays.results.forEach((day: any) => {
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
      monthly_trend: monthlyTrend.results,
      best_month: bestMonth,
      max_streak: maxStreak,
      period: {
        start: startDateStr,
        end: endDateStr
      }
    })
  } catch (error) {
    console.error('Monthly stats error:', error)
    return errorResponse(c, 'Internal server error', 500)
  }
})

export default stats
