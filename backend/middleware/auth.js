/**
 * Authentication Middleware
 * Verifies Supabase JWT tokens and attaches user info to requests
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Create Supabase clients
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not configured. Auth middleware will not work.')
}

// Client for authentication (uses anon key)
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Admin client for database operations (bypasses RLS)
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase // Fallback to regular client if no service key

/**
 * Middleware to verify JWT token from Supabase Auth
 * Attaches user object to req.user
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return res.status(500).json({
        error: 'Authentication not configured',
        details: 'Supabase credentials are missing'
      })
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'Missing or invalid authorization header'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error('🔒 Auth error:', error?.message || 'No user found')
      return res.status(401).json({
        error: 'Unauthorized',
        details: error?.message || 'Invalid or expired token'
      })
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata
    }

    console.log(`✅ Authenticated user: ${user.email}`)
    next()

  } catch (error) {
    console.error('❌ Auth middleware error:', error)
    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    })
  }
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Just attaches user if token is valid
 */
export const optionalAuth = async (req, res, next) => {
  try {
    if (!supabase) {
      return next() // Skip if not configured
    }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next() // No token, continue without user
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      }
    }

    next()

  } catch (error) {
    // Don't fail the request, just continue without user
    console.warn('⚠️  Optional auth failed:', error.message)
    next()
  }
}

// Export supabase clients for use in routes
export { supabase, supabaseAdmin }
