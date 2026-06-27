import { Router, Response } from 'express';
import Organization from '../models/Organization';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// GET /api/organizations
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const orgs = await Organization.find({ isActive: true }).sort({ isParent: -1, name: 1 });
    res.json(orgs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

export default router;
