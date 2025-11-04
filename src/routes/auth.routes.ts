import { Router } from 'express'
import { verifyToken, createToken } from '../lib/auth/jwt'

const router = Router()

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
