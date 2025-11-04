import { Router } from 'express'
import { verifyToken, createToken, createRefreshToken } from '../lib/auth/jwt'
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const router = Router()
const prisma = new PrismaClient()

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      companyName, 
      companyTaxId, 
      companyAddress, 
      companyPhone, 
      phone, 
      position 
    } = req.body

    console.log('🔥 REGISTER - Received data:', req.body)

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required' 
      })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists with this email' 
      })
    }

    // Hash password
    const passwordHash = await argon2.hash(password)

    // Create user with all fields
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        companyName: companyName || null,
        companyTaxId: companyTaxId || null,
        companyAddress: companyAddress || null,
        companyPhone: companyPhone || null,
        phone: phone || null,
        position: position || null,
        role: 'user',
        isEmailVerified: false
      }
    })

    console.log('🔥 REGISTER - User created:', { id: user.id, email: user.email, name: user.name })

    // Create tokens
    const accessToken = createToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    const refreshToken = createRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Set cookies
    // Enhanced cookie configuration for mobile compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
      path: '/'
    };

    res.cookie('auth-token', accessToken, {
      ...cookieOptions,
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    })

    res.cookie('refresh-token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    // Add headers for mobile compatibility
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Vary', 'Origin')

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ 
      error: 'Failed to register user' 
    })
  }
})

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    console.log('🔥 LOGIN ATTEMPT:', { email, passwordLength: password?.length })

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password')
      return res.status(400).json({ 
        error: 'Email and password are required' 
      })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('❌ User not found:', email)
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      })
    }

    console.log('✅ User found:', { id: user.id, email: user.email, hasPassword: !!user.passwordHash })

    // Verify password
    const isValidPassword = await argon2.verify(user.passwordHash, password)
    console.log('🔐 Password verification:', isValidPassword)

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      })
    }

    // Create tokens
    const accessToken = createToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    const refreshToken = createRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Set cookies
    // Enhanced cookie configuration for mobile compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
      path: '/'
    };

    res.cookie('auth-token', accessToken, {
      ...cookieOptions,
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    })

    res.cookie('refresh-token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    // Add headers for mobile compatibility
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Vary', 'Origin')

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      error: 'Failed to login' 
    })
  }
})

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
  try {
    // Get token from cookies
    const token = req.cookies['auth-token']

    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided' 
      })
    }

    // Verify token
    const payload = await verifyToken(token)

    if (!payload) {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyName: true,
        isEmailVerified: true,
        lastLoginAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      })
    }

    res.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ 
      error: 'Failed to get user info' 
    })
  }
})

/**
 * POST /api/auth/logout
 * Logout user and clear cookies
 */
router.post('/logout', async (req, res) => {
  try {
    // Clear cookies with same options used to set them
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
      path: '/'
    }

    res.clearCookie('auth-token', cookieOptions)
    res.clearCookie('refresh-token', cookieOptions)

    // Also clear any potential variations
    res.clearCookie('auth-token', { path: '/' })
    res.clearCookie('refresh-token', { path: '/' })

    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ 
      error: 'Failed to logout' 
    })
  }
})

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies['refresh-token']

    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'No refresh token provided' 
      })
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken)

    if (!payload) {
      return res.status(401).json({ 
        error: 'Invalid or expired refresh token' 
      })
    }

    // Create new access token
    const newAccessToken = createToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    })

    // Set new access token in cookie
    res.cookie('auth-token', newAccessToken, {
      httpOnly: true,
      secure: true, // Always secure for production
      sameSite: 'none', // Required for cross-domain cookies
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    })

    res.json({ 
      success: true,
      accessToken: newAccessToken
    })
  } catch (error) {
    console.error('Error refreshing token:', error)
    res.status(500).json({ 
      error: 'Failed to refresh token' 
    })
  }
})

export default router
