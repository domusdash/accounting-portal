import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { 
  FaServer, FaBullhorn, FaEnvelope, FaDatabase, FaGlobe, FaRobot, FaCoins,
  FaPlus, FaTrashAlt, FaChartLine, FaArrowUp, FaArrowDown, 
  FaWallet, FaUserCircle, FaSignOutAlt, FaSlidersH
} from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend 
} from 'recharts';

interface Organization {
  _id: string;
  name: string;
  slug: string;
  isParent?: boolean;
}

interface CostItem {
  _id: string;
  organizationId: any;
  category: 'digital_ocean' | 'mongodb_atlas' | 'resend' | 'ad_spend' | 'domain_hosting' | 'ai_apis' | 'other';
  description: string;
  amount: number;
  billingCycle: string;
  date: string;
  notes?: string;
}

interface RevenueItem {
  _id: string;
  organizationId: any;
  source: 'google_adsense' | 'stripe_subscriptions' | 'affiliate' | 'direct_sales' | 'other';
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

interface OverviewData {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  categoryBreakdown: Record<string, number>;
  revenueSourceBreakdown: Record<string, number>;
  brandBreakdown: Array<{ name: string; slug: string; costs: number; revenue: number; net: number }>;
}

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  digital_ocean: FaServer,
  mongodb_atlas: FaDatabase,
  resend: FaEnvelope,
  ad_spend: FaBullhorn,
  domain_hosting: FaGlobe,
  ai_apis: FaRobot,
  other: FaCoins
};

const CATEGORY_LABELS: Record<string, string> = {
  digital_ocean: 'DigitalOcean Servers',
  mongodb_atlas: 'MongoDB Atlas Cluster',
  resend: 'Resend Emails',
  ad_spend: 'Ad Spend (Google/Meta)',
  domain_hosting: 'Domains & SSL',
  ai_apis: 'AI APIs (OpenAI/Gemini)',
  other: 'Other Operating Cost'
};

const SOURCE_LABELS: Record<string, string> = {
  google_adsense: 'Google AdSense',
  stripe_subscriptions: 'Stripe Subscriptions',
  affiliate: 'Affiliate Payouts',
  direct_sales: 'Direct Sales',
  other: 'Other Revenue'
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'revenue'>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [costsList, setCostsList] = useState<CostItem[]>([]);
  const [revenueList, setRevenueList] = useState<RevenueItem[]>([]);

  // Modals
  const [showCostModal, setShowCostModal] = useState<boolean>(false);
  const [showRevModal, setShowRevModal] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // New Cost Form State
  const [costForm, setCostForm] = useState({
    category: 'digital_ocean',
    description: '',
    amount: '',
    billingCycle: 'monthly',
    targetOrganizationId: ''
  });

  // New Revenue Form State
  const [revForm, setRevForm] = useState({
    source: 'google_adsense',
    description: '',
    amount: '',
    targetOrganizationId: ''
  });

  const fetchOrganizations = async () => {
    try {
      const res = await api.get('/organizations');
      setOrganizations(res.data);
      if (res.data.length > 0) {
        let activeId = localStorage.getItem('selectedOrganizationId') || '';
        const parent = res.data.find((o: any) => o.isParent);
        if (!activeId && parent) {
          activeId = `${parent._id}__all`;
        } else if (!activeId) {
          activeId = res.data[0]._id;
        }
        localStorage.setItem('selectedOrganizationId', activeId);
        setSelectedOrgId(activeId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const [overRes, costRes, revRes] = await Promise.all([
        api.get('/accounting/overview'),
        api.get('/accounting/costs'),
        api.get('/accounting/revenue')
      ]);
      setOverview(overRes.data);
      setCostsList(costRes.data);
      setRevenueList(revRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load financial ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      fetchFinancialData();
    }
  }, [selectedOrgId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOrg = organizations.find(o => o._id === selectedOrgId || `${o._id}__all` === selectedOrgId);

  const renderOrganizationOptions = (orgs: Organization[]) => {
    const parents = orgs.filter(o => o.isParent || o.slug === 'daily-flow-labs');
    const children = orgs.filter(o => !o.isParent && o.slug !== 'daily-flow-labs');

    return (
      <>
        {parents.map(parent => (
          <optgroup key={parent._id} label={`👑 ${parent.name} (Parent Studio)`} style={{ background: '#18181b', color: '#818cf8', fontWeight: 'bold' }}>
            <option value={parent._id} style={{ background: '#111', color: '#ffffff', fontWeight: 'bold' }}>
              🏢 {parent.name} (This App Only)
            </option>
            <option value={`${parent._id}__all`} style={{ background: '#111', color: '#a5b4fc', fontWeight: 'bold' }}>
              🌐 {parent.name} (All Studio Apps Aggregated)
            </option>
            {children.map(child => (
              <option key={child._id} value={child._id} style={{ background: '#111', color: '#e4e4e7' }}>
                &nbsp;&nbsp;&nbsp;&nbsp;{child.name}
              </option>
            ))}
          </optgroup>
        ))}
      </>
    );
  };

  const handleCreateCost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/accounting/costs', costForm);
      toast.success('Cost line item added!');
      setShowCostModal(false);
      setCostForm({ category: 'digital_ocean', description: '', amount: '', billingCycle: 'monthly', targetOrganizationId: '' });
      fetchFinancialData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add cost item');
    }
  };

  const handleCreateRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/accounting/revenue', revForm);
      toast.success('Revenue entry added!');
      setShowRevModal(false);
      setRevForm({ source: 'google_adsense', description: '', amount: '', targetOrganizationId: '' });
      fetchFinancialData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add revenue item');
    }
  };

  const handleDeleteCost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this cost record?')) return;
    try {
      await api.delete(`/accounting/costs/${id}`);
      toast.success('Cost entry deleted');
      fetchFinancialData();
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  const handleDeleteRev = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this revenue record?')) return;
    try {
      await api.delete(`/accounting/revenue/${id}`);
      toast.success('Revenue entry deleted');
      fetchFinancialData();
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  // Chart Data formatters
  const categoryChartData = overview ? Object.entries(overview.categoryBreakdown).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] || key,
    value
  })).filter(d => d.value > 0) : [];

  const revenueChartData = overview ? Object.entries(overview.revenueSourceBreakdown).map(([key, value]) => ({
    name: SOURCE_LABELS[key] || key,
    value
  })).filter(d => d.value > 0) : [];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navigation Header */}
      <header className="app-top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: '#fff'
          }}>
            DF
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedOrgId.endsWith('__all') ? `${activeOrg?.name || 'Daily Flow'} (All Aggregated)` : activeOrg?.name || 'Select Brand'}
            </span>
            <select
              value={selectedOrgId}
              onChange={(e) => {
                const val = e.target.value;
                localStorage.setItem('selectedOrganizationId', val);
                setSelectedOrgId(val);
              }}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            >
              {renderOrganizationOptions(organizations)}
            </select>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 6 }}>▼</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }} ref={profileDropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <FaUserCircle style={{ fontSize: '1.5rem', color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name || 'Ben Roberts'}</span>
            </button>

            {profileDropdownOpen && (
              <div className="glass-panel" style={{ position: 'absolute', right: 0, top: '120%', width: 200, padding: '0.5rem', zIndex: 200 }}>
                <button
                  onClick={onLogout}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'transparent', border: 'none', color: '#ef4444', textAlign: 'left', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                >
                  <FaSignOutAlt /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        
        {/* Title Bar & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              Financial Intelligence & Accounting
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
              Cost vs. Return analysis across DigitalOcean droplets, MongoDB Atlas clusters, Resend emails, Ad campaigns, and AdSense revenue.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => setShowCostModal(true)}>
              <FaPlus /> Log Infrastructure Cost
            </button>
            <button className="btn-primary" onClick={() => setShowRevModal(true)}>
              <FaPlus /> Log Revenue Payout
            </button>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          
          {/* Revenue */}
          <div className="glass-panel kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <span>Total Gross Revenue</span>
              <FaWallet style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#10b981' }}>
              ${overview?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AdSense, Stripe Subscriptions & Sales</span>
          </div>

          {/* Infrastructure Costs */}
          <div className="glass-panel kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <span>Total Server & Ops Costs</span>
              <FaServer style={{ color: '#ef4444' }} />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ef4444' }}>
              ${overview?.totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DigitalOcean, MongoDB Atlas, Resend & Ads</span>
          </div>

          {/* Net Profit / Loss */}
          <div className="glass-panel kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <span>Net Studio Profit</span>
              <FaChartLine style={{ color: (overview?.netProfit || 0) >= 0 ? '#10b981' : '#ef4444' }} />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: (overview?.netProfit || 0) >= 0 ? '#10b981' : '#ef4444' }}>
              ${overview?.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {(overview?.netProfit || 0) >= 0 ? <FaArrowUp style={{ color: '#10b981' }} /> : <FaArrowDown style={{ color: '#ef4444' }} />}
              Net Return after operations
            </span>
          </div>

          {/* Profit Margin & ROI */}
          <div className="glass-panel kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <span>Profit Margin & ROI</span>
              <FaCoins style={{ color: '#6366f1' }} />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#6366f1' }}>
              {overview?.profitMargin.toFixed(1) || '0.0'}%
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              ROI: <strong style={{ color: '#fff' }}>{overview?.roi.toFixed(1) || '0.0'}%</strong>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem', gap: '1.5rem' }}>
          {[
            { id: 'overview', label: 'Financial Overview & Charts' },
            { id: 'costs', label: `Cost Ledger (${costsList.length})` },
            { id: 'revenue', label: `Revenue Ledger (${revenueList.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: 'transparent', border: 'none', color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                padding: '0.75rem 0', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & CHARTS */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Visual Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
              
              {/* Cost Categories Pie */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
                  Infrastructure Cost Breakdown
                </h3>
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {categoryChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => `$${Number(val).toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No expense entries logged yet</div>
                )}
              </div>

              {/* Revenue Sources Pie */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
                  Revenue Stream Sources
                </h3>
                {revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={revenueChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {revenueChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 3) % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => `$${Number(val).toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No revenue entries logged yet</div>
                )}
              </div>
            </div>

            {/* Per-Brand Financial Breakdown Table (when Aggregated) */}
            {selectedOrgId.endsWith('__all') && overview?.brandBreakdown && (
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
                  Per-Brand Financial Return Breakdown
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Brand Application</th>
                        <th style={{ padding: '0.75rem' }}>Total Revenue</th>
                        <th style={{ padding: '0.75rem' }}>Total Costs</th>
                        <th style={{ padding: '0.75rem' }}>Net Profit / Loss</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.brandBreakdown.map(brand => (
                        <tr key={brand.slug} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 700, color: '#fff' }}>🏢 {brand.name}</td>
                          <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 600 }}>${brand.revenue.toFixed(2)}</td>
                          <td style={{ padding: '0.75rem', color: '#ef4444', fontWeight: 600 }}>${brand.costs.toFixed(2)}</td>
                          <td style={{ padding: '0.75rem', color: brand.net >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                            ${brand.net.toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                              background: brand.net >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: brand.net >= 0 ? '#10b981' : '#ef4444'
                            }}>
                              {brand.net >= 0 ? 'PROFITABLE' : 'NET LOSS'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COST LEDGER */}
        {activeTab === 'costs' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#fff' }}>
              Infrastructure & Operating Expense Ledger
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Category</th>
                    <th style={{ padding: '0.75rem' }}>Brand</th>
                    <th style={{ padding: '0.75rem' }}>Description</th>
                    <th style={{ padding: '0.75rem' }}>Billing Cycle</th>
                    <th style={{ padding: '0.75rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {costsList.map(cost => {
                    const IconComp = CATEGORY_ICONS[cost.category] || FaCoins;
                    return (
                      <tr key={cost._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: 600 }}>
                          <IconComp style={{ color: 'var(--primary)' }} /> {CATEGORY_LABELS[cost.category] || cost.category}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                          {cost.organizationId?.name || 'Studio'}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>{cost.description}</td>
                        <td style={{ padding: '0.75rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{cost.billingCycle}</td>
                        <td style={{ padding: '0.75rem', color: '#ef4444', fontWeight: 700 }}>${cost.amount.toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <button onClick={() => handleDeleteCost(cost._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: REVENUE LEDGER */}
        {activeTab === 'revenue' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#fff' }}>
              Revenue & Monetization Ledger
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Source</th>
                    <th style={{ padding: '0.75rem' }}>Brand</th>
                    <th style={{ padding: '0.75rem' }}>Description</th>
                    <th style={{ padding: '0.75rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueList.map(rev => (
                    <tr key={rev._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 600 }}>
                        💰 {SOURCE_LABELS[rev.source] || rev.source}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                        {rev.organizationId?.name || 'Studio'}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-main)' }}>{rev.description}</td>
                      <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 700 }}>${rev.amount.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteRev(rev._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD COST */}
      {showCostModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: 450, padding: '2rem', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', color: '#fff' }}>Log Infrastructure Cost</h3>
            <form onSubmit={handleCreateCost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Brand</label>
                <select
                  value={costForm.targetOrganizationId}
                  onChange={e => setCostForm({ ...costForm, targetOrganizationId: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', background: '#1e293b', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, marginTop: 4 }}
                >
                  <option value="">Current Selection / Studio Default</option>
                  {organizations.filter(o => !o.isParent).map(o => (
                    <option key={o._id} value={o._id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Expense Category</label>
                <select
                  value={costForm.category}
                  onChange={e => setCostForm({ ...costForm, category: e.target.value as any })}
                  style={{ width: '100%', padding: '0.65rem', background: '#1e293b', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, marginTop: 4 }}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., DigitalOcean Droplet SFO3"
                  value={costForm.description}
                  onChange={e => setCostForm({ ...costForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', background: '#1e293b', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="5.00"
                    value={costForm.amount}
                    onChange={e => setCostForm({ ...costForm, amount: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', background: '#1e293b', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, marginTop: 4 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Billing Cycle</label>
                  <select
                    value={costForm.billingCycle}
                    onChange={e => setCostForm({ ...costForm, billingCycle: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', background: '#1e293b', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, marginTop: 4 }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="one_time">One-Time</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCostModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Cost Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD REVENUE */}
      {showRevModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: 450, padding: '2rem', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', color: '#fff' }}>Log Revenue Entry</h3>
            <form onSubmit={handleCreateRevenue} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Brand</label>
                <select
                  value={revForm.targetOrganizationId}
                  onChange={e => setRevForm({ ...revForm, targetOrganizationId: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', background: '#1e293b', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, marginTop: 4 }}
                >
                  <option value="">Current Selection / Studio Default</option>
                  {organizations.filter(o => !o.isParent).map(o => (
                    <option key={o._id} value={o._id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Revenue Source</label>
                <select
                  value={revForm.source}
                  onChange={e => setRevForm({ ...revForm, source: e.target.value as any })}
                  style={{ width: '100%', padding: '0.65rem', background: '#1e293b', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, marginTop: 4 }}
                >
                  {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., AdSense Monthly Ad Earnings"
                  value={revForm.description}
                  onChange={e => setRevForm({ ...revForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', background: '#1e293b', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="150.00"
                  value={revForm.amount}
                  onChange={e => setRevForm({ ...revForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', background: '#1e293b', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowRevModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Revenue Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
