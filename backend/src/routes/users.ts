import { Router, Response } from 'express';
import User from '../models/User';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// GET /api/users - List all team members
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ role: 1, name: 1 });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Add a new team member
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      role: role || 'admin'
    });

    await newUser.save();
    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      disabled: newUser.disabled
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// PUT /api/users/:id/toggle-disabled - Disable/Enable user
router.put('/:id/toggle-disabled', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email === 'benjosephroberts@gmail.com') {
      return res.status(400).json({ error: 'Cannot disable owner account' });
    }

    user.disabled = !user.disabled;
    await user.save();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email === 'benjosephroberts@gmail.com') {
      return res.status(400).json({ error: 'Cannot delete owner account' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
