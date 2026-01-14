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
import stats from './routes/stats'
import { SW_CONTENT } from './sw-content'

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

// PWA Routes - Direct serve for development
app.get('/manifest.json', (c) => {
  return c.json({
    "name": "Brain Dumping - 브레인 덤프",
    "short_name": "Brain Dump",
    "description": "GTD 기반 생산성 관리 앱 - 머릿속을 비우고 집중하세요",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#4F46E5",
    "orientation": "portrait-primary",
    "categories": ["productivity", "lifestyle"],
    "lang": "ko-KR",
    "dir": "ltr",
    "icons": [
      {
        "src": "/icons/icon.svg",
        "sizes": "any",
        "type": "image/svg+xml",
        "purpose": "any maskable"
      }
    ]
  })
})

app.get('/icons/icon.svg', (c) => {
  return c.html(`<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#4F46E5" rx="100"/>
  <g transform="translate(256, 256)">
    <path d="M -80 -100 Q -120 -100 -120 -60 Q -120 -20 -100 0 Q -120 20 -120 60 Q -120 100 -80 100 Q -60 100 -40 80 Q -20 60 0 60 L 0 -60 Q -20 -60 -40 -80 Q -60 -100 -80 -100 Z" 
          fill="#FFFFFF" opacity="0.95"/>
    <path d="M 80 -100 Q 120 -100 120 -60 Q 120 -20 100 0 Q 120 20 120 60 Q 120 100 80 100 Q 60 100 40 80 Q 20 60 0 60 L 0 -60 Q 20 -60 40 -80 Q 60 -100 80 -100 Z" 
          fill="#FFFFFF" opacity="0.95"/>
    <path d="M -30 20 L -10 40 L 40 -20" 
          stroke="#4F46E5" 
          stroke-width="20" 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          fill="none"/>
    <circle cx="-60" cy="-40" r="8" fill="#4F46E5" opacity="0.6"/>
    <circle cx="-40" cy="0" r="6" fill="#4F46E5" opacity="0.6"/>
    <circle cx="-60" cy="40" r="8" fill="#4F46E5" opacity="0.6"/>
    <circle cx="60" cy="-40" r="8" fill="#4F46E5" opacity="0.6"/>
    <circle cx="40" cy="0" r="6" fill="#4F46E5" opacity="0.6"/>
    <circle cx="60" cy="40" r="8" fill="#4F46E5" opacity="0.6"/>
  </g>
  <text x="256" y="420" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="#FFFFFF" text-anchor="middle">BD</text>
</svg>`, { headers: { 'Content-Type': 'image/svg+xml' } })
})

app.get('/sw.js', (c) => {
  return c.text(SW_CONTENT, { headers: { 'Content-Type': 'application/javascript' } })
})

// API routes
app.route('/api/auth', auth)
app.route('/api/tasks', tasks)
app.route('/api/reviews', reviews)
app.route('/api/weekly-goals', goals)
app.route('/api/let-go', letgo)
app.route('/api/notes', notes)
app.route('/api/stats', stats)

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>브레인 덤핑 - Brain Dumping</title>
        <meta name="description" content="GTD 기반 생산성 관리 앱 - 머릿속을 비우고 집중하세요">
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#4F46E5">
        
        <!-- iOS Meta Tags -->
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="Brain Dump">
        <link rel="apple-touch-icon" href="/icons/icon.svg">
        
        <!-- Icons -->
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg">
        <link rel="shortcut icon" href="/icons/icon.svg">
        
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
        
        <!-- Service Worker Registration -->
        <script>
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                  console.log('[PWA] Service Worker registered:', registration.scope)
                })
                .catch(error => {
                  console.log('[PWA] Service Worker registration failed:', error)
                })
            })
          }
        </script>
    </head>
    <body>
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
