import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import Organization from './models/Organization';
import User from './models/User';
import CostEntry from './models/CostEntry';
import RevenueEntry from './models/RevenueEntry';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyflowlabs_accounting';

const seedData = async () => {
  try {
    console.log(`[🌱] Connecting to MongoDB: ${MONGODB_URI.split('@')[1] || MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('[🌱] Connected successfully.');

    const orgs = [
      { name: 'Daily Flow Labs', slug: 'daily-flow-labs', isParent: true },
      { name: 'DomusDash', slug: 'domusdash' },
      { name: 'Blueprint Converter', slug: 'blueprintconverter' },
      { name: 'Of The World', slug: 'oftheworld' },
      { name: 'IronDial', slug: 'irondial' },
      { name: 'Local Redact PDF', slug: 'localredactpdf' },
      { name: 'Thumb Verify', slug: 'thumbverify' },
      { name: 'Free QR Code Generator', slug: 'freeqrcode' },
      { name: 'Short Code Icons', slug: 'short-code-icons' },
      { name: 'Anti-Woke Schools', slug: 'antiwokeschools' }
    ];

    const orgMap: Record<string, any> = {};

    for (const item of orgs) {
      let doc = await Organization.findOne({ slug: item.slug });
      if (!doc) {
        doc = new Organization(item);
        await doc.save();
        console.log(`[🌱] Created organization: ${item.name}`);
      } else {
        Object.assign(doc, item);
        await doc.save();
        console.log(`[🌱] Updated organization: ${item.name}`);
      }
      orgMap[item.slug] = doc;
    }

    // Superadmin user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    let admin = await User.findOne({ email: 'benjosephroberts@gmail.com' });
    if (!admin) {
      admin = new User({
        email: 'benjosephroberts@gmail.com',
        name: 'Ben Roberts',
        passwordHash,
        role: 'superadmin'
      });
      await admin.save();
      console.log('[🌱] Created superadmin user: benjosephroberts@gmail.com');
    } else {
      admin.passwordHash = passwordHash;
      await admin.save();
      console.log('[🌱] Updated superadmin user password');
    }

    // Seed initial benchmark costs and revenues if collection empty
    const costCount = await CostEntry.countDocuments();
    if (costCount === 0) {
      console.log('[🌱] Seeding initial cost benchmarks...');
      const initialCosts = [
        { org: 'daily-flow-labs', category: 'digital_ocean', description: 'Primary App Droplet Load Balancer', amount: 48.00, billingCycle: 'monthly' },
        { org: 'daily-flow-labs', category: 'mongodb_atlas', description: 'MongoDB Atlas M10 Shared Cluster', amount: 57.00, billingCycle: 'monthly' },
        { org: 'daily-flow-labs', category: 'resend', description: 'Resend Pro Plan (100k emails/mo)', amount: 20.00, billingCycle: 'monthly' },
        { org: 'domusdash', category: 'digital_ocean', description: 'Production API Server & Database', amount: 24.00, billingCycle: 'monthly' },
        { org: 'blueprintconverter', category: 'digital_ocean', description: 'PDF Worker & Processing Droplet', amount: 18.00, billingCycle: 'monthly' },
        { org: 'blueprintconverter', category: 'ad_spend', description: 'Google Ads Search Campaign', amount: 120.00, billingCycle: 'monthly' },
        { org: 'oftheworld', category: 'digital_ocean', description: 'Static CDN Hosting & Edge worker', amount: 12.00, billingCycle: 'monthly' },
        { org: 'oftheworld', category: 'ad_spend', description: 'Meta Ads Launch Promotion', amount: 75.00, billingCycle: 'monthly' },
        { org: 'irondial', category: 'digital_ocean', description: 'WebRTC VoIP Relay Droplet', amount: 28.00, billingCycle: 'monthly' },
        { org: 'localredactpdf', category: 'domain_hosting', description: 'Domain renewal (localredactpdf.com)', amount: 14.99, billingCycle: 'annual' },
        { org: 'freeqrcode', category: 'ad_spend', description: 'AdWords Keyword Bidding', amount: 45.00, billingCycle: 'monthly' }
      ];

      for (const c of initialCosts) {
        if (orgMap[c.org]) {
          await new CostEntry({
            organizationId: orgMap[c.org]._id,
            category: c.category,
            description: c.description,
            amount: c.amount,
            billingCycle: c.billingCycle,
            date: new Date()
          }).save();
        }
      }
    }

    const revCount = await RevenueEntry.countDocuments();
    if (revCount === 0) {
      console.log('[🌱] Seeding initial revenue benchmarks...');
      const initialRevenues = [
        { org: 'blueprintconverter', source: 'google_adsense', description: 'Google AdSense Monthly Earnings', amount: 340.50 },
        { org: 'domusdash', source: 'stripe_subscriptions', description: 'Stripe SaaS Subscriptions', amount: 480.00 },
        { org: 'oftheworld', source: 'google_adsense', description: 'AdSense Banner Ads', amount: 185.20 },
        { org: 'freeqrcode', source: 'google_adsense', description: 'AdSense Display Earnings', amount: 94.80 },
        { org: 'irondial', source: 'stripe_subscriptions', description: 'Pro License Subscriptions', amount: 210.00 },
        { org: 'short-code-icons', source: 'affiliate', description: 'Design Resource Affiliate Payout', amount: 62.00 }
      ];

      for (const r of initialRevenues) {
        if (orgMap[r.org]) {
          await new RevenueEntry({
            organizationId: orgMap[r.org]._id,
            source: r.source,
            description: r.description,
            amount: r.amount,
            date: new Date()
          }).save();
        }
      }
    }

    console.log('[🌱] Accounting database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('[❌] Error seeding database:', err);
    process.exit(1);
  }
};

seedData();
