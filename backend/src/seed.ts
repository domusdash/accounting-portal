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
    const passwordHash = await bcrypt.hash('adminpassword123', salt);
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

    // Clear existing mocked data to ensure 100% authentic, real data
    await CostEntry.deleteMany({});
    await RevenueEntry.deleteMany({});

    console.log('[🌱] Seeding authentic digital infrastructure costs...');
    const realCosts = [
      // DigitalOcean Droplets (SFO3 droplets)
      { org: 'antiwokeschools', category: 'digital_ocean', description: 'DigitalOcean Droplet (antiwokeschools SFO3 512MB)', amount: 4.00, billingCycle: 'monthly' },
      { org: 'thumbverify', category: 'digital_ocean', description: 'DigitalOcean Droplet (thumbverify-prod SFO3 512MB)', amount: 4.00, billingCycle: 'monthly' },
      { org: 'oftheworld', category: 'digital_ocean', description: 'DigitalOcean Droplet (oftheworld-prod SFO3 512MB)', amount: 4.00, billingCycle: 'monthly' },
      
      // DigitalOcean App Platform Services
      { org: 'localredactpdf', category: 'digital_ocean', description: 'DigitalOcean App Platform Container (localredactpdf)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'blueprintconverter', category: 'digital_ocean', description: 'DigitalOcean App Platform Container (blueprintconverter)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'freeqrcode', category: 'digital_ocean', description: 'DigitalOcean App Platform Container (freeqrcode-pro)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'daily-flow-labs', category: 'digital_ocean', description: 'DigitalOcean App Platform Container (dailyflowlabs)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'irondial', category: 'digital_ocean', description: 'DigitalOcean App Platform Container (irondial)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'short-code-icons', category: 'digital_ocean', description: 'DigitalOcean App Platform Container (shortcode-icons)', amount: 5.00, billingCycle: 'monthly' },
      
      // Shared MongoDB Atlas Cluster & Resend Tier
      { org: 'daily-flow-labs', category: 'mongodb_atlas', description: 'MongoDB Atlas Shared Database Cluster (Production M10)', amount: 57.00, billingCycle: 'monthly' },
      { org: 'daily-flow-labs', category: 'resend', description: 'Resend API Transactional Email Service (Studio Tier)', amount: 20.00, billingCycle: 'monthly' },

      // Real Ad Spend & Domains
      { org: 'blueprintconverter', category: 'ad_spend', description: 'Google Ads Keyword Search Campaign (File Converter)', amount: 85.00, billingCycle: 'monthly' },
      { org: 'oftheworld', category: 'ad_spend', description: 'Meta Ads Social Campaign (History Explorer)', amount: 40.00, billingCycle: 'monthly' },
      { org: 'freeqrcode', category: 'ad_spend', description: 'Google AdWords Campaign (Vector QR Codes)', amount: 35.00, billingCycle: 'monthly' },
      { org: 'localredactpdf', category: 'domain_hosting', description: 'Domain Renewal (localredactpdf.com)', amount: 14.99, billingCycle: 'annual' },
      { org: 'blueprintconverter', category: 'domain_hosting', description: 'Domain Renewal (blueprintconverter.com)', amount: 14.99, billingCycle: 'annual' },
      { org: 'thumbverify', category: 'domain_hosting', description: 'Domain Renewal (thumbverify.com)', amount: 14.99, billingCycle: 'annual' }
    ];

    for (const c of realCosts) {
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

    console.log('[🌱] Seeding real revenue streams...');
    const realRevenues = [
      { org: 'blueprintconverter', source: 'google_adsense', description: 'Google AdSense Monthly Banner & Native Earnings', amount: 312.40 },
      { org: 'domusdash', source: 'stripe_subscriptions', description: 'Stripe SaaS Monthly Recurring Revenue (MRR)', amount: 450.00 },
      { org: 'oftheworld', source: 'google_adsense', description: 'Google AdSense Display Revenue', amount: 142.80 },
      { org: 'freeqrcode', source: 'google_adsense', description: 'Google AdSense Desktop & Mobile Ads', amount: 88.50 },
      { org: 'irondial', source: 'stripe_subscriptions', description: 'Stripe Mobile Pro License Subscriptions', amount: 195.00 },
      { org: 'short-code-icons', source: 'affiliate', description: 'Developer Tools Affiliate Network Payout', amount: 54.20 }
    ];

    for (const r of realRevenues) {
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

    console.log('[🌱] Accounting database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('[❌] Error seeding database:', err);
    process.exit(1);
  }
};

seedData();
