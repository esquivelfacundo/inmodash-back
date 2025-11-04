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
    const { email, password, name, companyName } = req.body

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

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        companyName: companyName || null,
        role: 'user'
      }
    })

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
    res.cookie('auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1 hour
    })

    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

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

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      })
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.passwordHash, password)

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
    res.cookie('auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1 hour
    })

    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1 hour
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
