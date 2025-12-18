import type { Context } from 'hono'
import type { ApiResponse } from '../types'

export function successResponse<T>(c: Context, data: T, message?: string, status: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  }
  return c.json(response, status)
}

export function errorResponse(c: Context, error: string, status: number = 400) {
  const response: ApiResponse = {
    success: false,
    error
  }
  return c.json(response, status)
}

export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function getCurrentDateTime(): string {
  return new Date().toISOString()
}
