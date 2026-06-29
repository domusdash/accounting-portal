import { Router } from 'express';
import OrganizationGroup from '../models/OrganizationGroup';
import Organization from '../models/Organization';

const router = Router();

// GET /api/groups - List all organization groups
router.get('/', async (req, res) => {
  try {
    await OrganizationGroup.updateMany({ name: { $regex: /Daily Flow/i } }, { $set: { name: 'All Organizations', slug: 'all-organizations' } });
    let groups = await OrganizationGroup.find().populate('memberOrgIds', 'name slug supportEmail');
    if (groups.length === 0) {
      const allOrgs = await Organization.find();
      if (allOrgs.length > 0) {
        const defaultGroup = new OrganizationGroup({
          name: 'All Organizations',
          slug: 'all-organizations',
          description: 'Master organization portfolio holding all studio product brands.',
          memberOrgIds: allOrgs.map(o => o._id)
        });
        await defaultGroup.save();
        groups = await OrganizationGroup.find().populate('memberOrgIds', 'name slug supportEmail');
      }
    }
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch groups' });
  }
});

// GET /api/groups/:id - Get single group by ID or slug
router.get('/:id', async (req, res) => {
  try {
    const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: req.params.id } : { slug: req.params.id };
    const group = await OrganizationGroup.findOne(query).populate('memberOrgIds');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch group' });
  }
});

// POST /api/groups - Create a new group (Super Admin only)
router.post('/', async (req, res) => {
  try {
    const authReq = req as any;
    if (authReq.user?.role !== 'admin' && authReq.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { name, slug, description, memberOrgIds } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const group = new OrganizationGroup({
      name,
      slug,
      description,
      memberOrgIds: memberOrgIds || []
    });

    await group.save();
    res.status(201).json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create group' });
  }
});

// PUT /api/groups/:id - Update group details
router.put('/:id', async (req, res) => {
  try {
    const authReq = req as any;
    if (authReq.user?.role !== 'admin' && authReq.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const group = await OrganizationGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const allowedFields = ['name', 'slug', 'description', 'memberOrgIds'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (group as any)[field] = req.body[field];
      }
    }

    await group.save();
    res.json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update group' });
  }
});

// DELETE /api/groups/:id - Delete group
router.delete('/:id', async (req, res) => {
  try {
    const authReq = req as any;
    if (authReq.user?.role !== 'admin' && authReq.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const group = await OrganizationGroup.findByIdAndDelete(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ message: 'Group deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete group' });
  }
});

export default router;
