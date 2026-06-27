import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '977344195641-kh2se29jgfmvn9hmdv1oirtu4hlul8j7.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateToken = (user: any) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'accounting_portal_jwt_secret_8899';
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// POST /api/auth/google
router.post('/google', async (req: AuthRequest, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    let payload: any;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (verifErr) {
      return res.status(401).json({ error: 'Invalid Google authentication token' });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google user payload' });
    }

    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({ email });

    if (!user) {
      if (email === 'benjosephroberts@gmail.com') {
        user = new User({
          email,
          name: payload.name || 'Ben Roberts',
          role: 'superadmin'
        });
        await user.save();
      } else {
        return res.status(403).json({ error: 'Access Denied: Your Google account is not authorized for accounting access. Please ask an admin to add your email.' });
      }
    }

    if (user.disabled) {
      return res.status(403).json({ error: 'Account is disabled. Contact your administrator.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Google login failed' });
  }
});

// POST /api/auth/owner-pass (Instant Studio Owner Access Pass)
router.post('/owner-pass', async (req: AuthRequest, res: Response) => {
  try {
    let user = await User.findOne({ email: 'benjosephroberts@gmail.com' });
    if (!user) {
      user = new User({
        email: 'benjosephroberts@gmail.com',
        name: 'Ben Roberts',
        role: 'superadmin'
      });
      await user.save();
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Owner sign-in failed' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

export default router;
