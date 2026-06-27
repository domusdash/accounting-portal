import { Router, Response } from 'express';
import Organization from '../models/Organization';
import CostEntry from '../models/CostEntry';
import RevenueEntry from '../models/RevenueEntry';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Header validation middleware for Organization selection
router.use(async (req: AuthRequest, res: Response, next) => {
  const orgId = req.headers['x-organization-id'] as string;
  if (!orgId) {
    return res.status(400).json({ error: 'Organization identifier X-Organization-Id header is required' });
  }

  try {
    if (orgId.endsWith('__all')) {
      const realId = orgId.replace('__all', '');
      const parentOrg = await Organization.findById(realId);
      if (!parentOrg) {
        return res.status(404).json({ error: 'Parent organization not found' });
      }
      (req as any).org = parentOrg;
      (req as any).isAggregated = true;
      return next();
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    (req as any).org = org;
    (req as any).isAggregated = false;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid organization identifier' });
  }
});

// GET /api/accounting/overview - Aggregated financial metrics and charts
router.get('/overview', async (req: AuthRequest, res: Response) => {
  const org = (req as any).org;
  const isAggregated = (req as any).isAggregated;

  try {
    const filter = isAggregated ? {} : { organizationId: org._id };

    const costs = await CostEntry.find(filter).populate('organizationId', 'name slug');
    const revenues = await RevenueEntry.find(filter).populate('organizationId', 'name slug');

    const totalCosts = costs.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalRevenue = revenues.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

    // Costs by category breakdown
    const categoryBreakdown: Record<string, number> = {
      digital_ocean: 0,
      mongodb_atlas: 0,
      resend: 0,
      ad_spend: 0,
      domain_hosting: 0,
      ai_apis: 0,
      other: 0
    };
    for (const c of costs) {
      if (c.category in categoryBreakdown) {
        categoryBreakdown[c.category] += c.amount;
      } else {
        categoryBreakdown.other += c.amount;
      }
    }

    // Revenue by source breakdown
    const revenueSourceBreakdown: Record<string, number> = {
      google_adsense: 0,
      stripe_subscriptions: 0,
      affiliate: 0,
      direct_sales: 0,
      other: 0
    };
    for (const r of revenues) {
      if (r.source in revenueSourceBreakdown) {
        revenueSourceBreakdown[r.source] += r.amount;
      } else {
        revenueSourceBreakdown.other += r.amount;
      }
    }

    // Per Brand Breakdown (if aggregated)
    const brandBreakdown: Record<string, { name: string; slug: string; costs: number; revenue: number; net: number }> = {};
    if (isAggregated) {
      const allOrgs = await Organization.find({ isActive: true });
      for (const o of allOrgs) {
        if (!o.isParent) {
          brandBreakdown[o._id.toString()] = { name: o.name, slug: o.slug, costs: 0, revenue: 0, net: 0 };
        }
      }
      for (const c of costs) {
        const idStr = c.organizationId?._id?.toString() || c.organizationId?.toString();
        if (idStr && brandBreakdown[idStr]) {
          brandBreakdown[idStr].costs += c.amount;
          brandBreakdown[idStr].net -= c.amount;
        }
      }
      for (const r of revenues) {
        const idStr = r.organizationId?._id?.toString() || r.organizationId?.toString();
        if (idStr && brandBreakdown[idStr]) {
          brandBreakdown[idStr].revenue += r.amount;
          brandBreakdown[idStr].net += r.amount;
        }
      }
    }

    res.json({
      totalRevenue,
      totalCosts,
      netProfit,
      profitMargin,
      roi,
      categoryBreakdown,
      revenueSourceBreakdown,
      brandBreakdown: Object.values(brandBreakdown)
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate financial overview' });
  }
});

// GET /api/accounting/costs
router.get('/costs', async (req: AuthRequest, res: Response) => {
  const org = (req as any).org;
  const isAggregated = (req as any).isAggregated;
  try {
    const filter = isAggregated ? {} : { organizationId: org._id };
    const costs = await CostEntry.find(filter)
      .sort({ date: -1 })
      .populate('organizationId', 'name slug');
    res.json(costs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch costs' });
  }
});

// POST /api/accounting/costs
router.post('/costs', async (req: AuthRequest, res: Response) => {
  const org = (req as any).org;
  try {
    const { category, description, amount, billingCycle, date, notes, targetOrganizationId } = req.body;
    if (!category || !description || amount === undefined) {
      return res.status(400).json({ error: 'Category, description, and amount are required' });
    }

    const targetOrgId = targetOrganizationId || org._id;

    const entry = new CostEntry({
      organizationId: targetOrgId,
      category,
      description,
      amount: Number(amount),
      billingCycle: billingCycle || 'monthly',
      date: date ? new Date(date) : new Date(),
      notes
    });

    await entry.save();
    const populated = await CostEntry.findById(entry._id).populate('organizationId', 'name slug');
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create cost entry' });
  }
});

// DELETE /api/accounting/costs/:id
router.delete('/costs/:id', async (req: AuthRequest, res: Response) => {
  try {
    await CostEntry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cost entry deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete cost entry' });
  }
});

// GET /api/accounting/revenue
router.get('/revenue', async (req: AuthRequest, res: Response) => {
  const org = (req as any).org;
  const isAggregated = (req as any).isAggregated;
  try {
    const filter = isAggregated ? {} : { organizationId: org._id };
    const revenues = await RevenueEntry.find(filter)
      .sort({ date: -1 })
      .populate('organizationId', 'name slug');
    res.json(revenues);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch revenue' });
  }
});

// POST /api/accounting/revenue
router.post('/revenue', async (req: AuthRequest, res: Response) => {
  const org = (req as any).org;
  try {
    const { source, description, amount, date, notes, targetOrganizationId } = req.body;
    if (!source || !description || amount === undefined) {
      return res.status(400).json({ error: 'Source, description, and amount are required' });
    }

    const targetOrgId = targetOrganizationId || org._id;

    const entry = new RevenueEntry({
      organizationId: targetOrgId,
      source,
      description,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      notes
    });

    await entry.save();
    const populated = await RevenueEntry.findById(entry._id).populate('organizationId', 'name slug');
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create revenue entry' });
  }
});

// DELETE /api/accounting/revenue/:id
router.delete('/revenue/:id', async (req: AuthRequest, res: Response) => {
  try {
    await RevenueEntry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Revenue entry deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete revenue entry' });
  }
});

export default router;
