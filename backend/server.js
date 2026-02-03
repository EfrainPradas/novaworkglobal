import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jobSearchRoutes from './routes/jobSearch.js'
import careerVisionRoutes from './routes/careerVision.js'
import interviewRoutes from './routes/interview.js'
import weeklyReinventionRoutes from './routes/weeklyReinvention.js'
import jdAnalyzerRoutes from './routes/jdAnalyzer.js'
import accomplishmentsRoutes from './routes/accomplishments.js'
import resumeParserRoutes from './routes/resumeParser.js'
import coverLetterRoutes from './routes/coverLetter.js'
import profileGeneratorRoutes from './routes/profileGenerator.js'

// Load environment variables
// Try multiple locations: .env (production), ../.env.backend (development), or default .env
const envPaths = [
  '.env',              // Production (created by deploy script)
  '../.env.backend',   // Development
  '../.env.production' // Alternative production location
]

for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath })
    if (process.env.NODE_ENV || process.env.PORT) {
      console.log(`✅ Loaded environment from ${envPath}`)
      break
    }
  } catch (err) {
    // Continue to next path
  }
}

const app = express()
const PORT = process.env.PORT || 5000

// CORS Configuration
// Support both ALLOWED_ORIGINS (comma-separated) and FRONTEND_URL (single URL)
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'development') {
    return true // Allow all in development
  }
  if (process.env.ALLOWED_ORIGINS) {
    // Split comma-separated origins and trim whitespace
    return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  }
  // Fallback to FRONTEND_URL or default localhost for development
  return [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',  // Alternative port
    'http://localhost:5175'   // Another alternative
  ]
}

// Middleware
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}))
app.use(express.json())

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/jobs', jobSearchRoutes)
app.use('/api/career-vision', careerVisionRoutes)
app.use('/api/interviews', interviewRoutes)
app.use('/api/weekly-reinvention', weeklyReinventionRoutes)
app.use('/api/jd-analyzer', jdAnalyzerRoutes)
app.use('/api/ai', accomplishmentsRoutes)
app.use('/api', resumeParserRoutes)
app.use('/api/cover-letter', coverLetterRoutes)
app.use('/api', profileGeneratorRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CareerTipsAI Backend',
    version: 'v2-with-cover-letter'
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 CareerTipsAI Backend Server running on port ${PORT}`)
  console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL}`)
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`)
  console.log(`\n✅ API endpoints available at http://localhost:${PORT}/api`)
  console.log(`   - GET  /api/health - Health check`)
  console.log(`   - POST /api/jobs/search - Job search`)
  console.log(`   - POST /api/jd-analyzer/analyze - Job Description Analyzer`)
  console.log(`   - GET  /api/jd-analyzer/health - JD Analyzer health check`)
  console.log(`   - GET  /api/career-vision/profile - Career Vision profile`)
  console.log(`   - POST /api/career-vision/profile - Save Career Vision profile`)
  console.log(`   - GET  /api/career-vision/status - Career Vision status`)
  console.log(`   - GET  /api/interviews - Interview preparations`)
  console.log(`   - GET  /api/interviews/questions/all - Question bank`)
  console.log(`   - GET  /api/interviews/my-answers - My prepared answers`)
  console.log(`   - POST /api/ai/generate-accomplishments - AI accomplishments generator`)
  console.log(`   - GET  /api/ai/health - AI services health check`)
  console.log(`   - POST /api/parse-resume - Upload and parse resume (PDF/DOCX)`)
  console.log(`\n`)
})

export default app
