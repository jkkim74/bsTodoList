import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Env } from './types'
import auth from './routes/auth'
import tasks from './routes/tasks'
import reviews from './routes/reviews'
import goals from './routes/goals'
import letgo from './routes/letgo'
import notes from './routes/notes'

const app = new Hono<{ Bindings: Env }>()

// Enable CORS for API routes
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 3600,
  credentials: true,
}))

// Serve static files
app.use('/static/*', serveStatic({ root: './' }))

// API routes
app.route('/api/auth', auth)
app.route('/api/tasks', tasks)
app.route('/api/reviews', reviews)
app.route('/api/weekly-goals', goals)
app.route('/api/let-go', letgo)
app.route('/api/notes', notes)

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Brain Dumping API is running' })
})

// Default route - Serve frontend
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>브레인 덤핑 TO_DO_LIST</title>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#667eea',
                  secondary: '#2c5f2d',
                }
              }
            }
          }
        </script>
    </head>
    <body>
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
