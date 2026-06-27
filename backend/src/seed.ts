import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

    // Superadmin user (Pure Google OAuth 2.0 account)
    let admin = await User.findOne({ email: 'benjosephroberts@gmail.com' });
    if (!admin) {
      admin = new User({
        email: 'benjosephroberts@gmail.com',
        name: 'Ben Roberts',
        role: 'superadmin'
      });
      await admin.save();
      console.log('[🌱] Created superadmin user for Google Auth: benjosephroberts@gmail.com');
    } else {
      admin.set('passwordHash', undefined);
      await admin.save();
      console.log('[🌱] Purged legacy password hash for superadmin user');
    }

    await User.updateMany({}, { $unset: { passwordHash: "" } });

    // Clear existing data to seed authentic real app infrastructure ledger
    await CostEntry.deleteMany({});
    await RevenueEntry.deleteMany({});

    console.log('[🌱] Seeding real digital infrastructure & Gemini AI costs...');
    const realCosts = [
      // 🤖 Gemini AI API Costs across Studio Apps
      { org: 'thumbverify', category: 'ai_apis', description: 'Gemini 1.5 Flash Vision Analysis API (Media Verification & EXIF Inspection)', amount: 28.40, billingCycle: 'monthly' },
      { org: 'daily-flow-labs', category: 'ai_apis', description: 'Gemini 1.5 Pro Support API (Automated Support Triage & Draft Response Generation)', amount: 16.50, billingCycle: 'monthly' },
      { org: 'domusdash', category: 'ai_apis', description: 'Gemini 1.5 Flash Vision API (Household Receipt OCR & Meal Plan Parsing)', amount: 22.10, billingCycle: 'monthly' },

      // 🖥️ Real DigitalOcean Droplets (SFO3 droplets)
      { org: 'antiwokeschools', category: 'digital_ocean', description: 'DigitalOcean Droplet Server (antiwokeschools SFO3 512MB)', amount: 4.00, billingCycle: 'monthly' },
      { org: 'thumbverify', category: 'digital_ocean', description: 'DigitalOcean Droplet Server (thumbverify-prod SFO3 512MB)', amount: 4.00, billingCycle: 'monthly' },
      { org: 'oftheworld', category: 'digital_ocean', description: 'DigitalOcean Droplet Server (oftheworld-prod SFO3 512MB)', amount: 4.00, billingCycle: 'monthly' },
      
      // 📦 Real DigitalOcean App Platform Services
      { org: 'localredactpdf', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (localredactpdf)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'blueprintconverter', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (blueprintconverter)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'freeqrcode', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (freeqrcode-pro)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'daily-flow-labs', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (dailyflowlabs)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'irondial', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (irondial)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'short-code-icons', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (shortcode-icons)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'daily-flow-labs', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (accounting-portal)', amount: 5.00, billingCycle: 'monthly' },
      
      // 🗄️ Shared Database & Email Infrastructure
      { org: 'daily-flow-labs', category: 'mongodb_atlas', description: 'MongoDB Atlas Shared Database Cluster (Production M10 multi-region)', amount: 57.00, billingCycle: 'monthly' },
      { org: 'daily-flow-labs', category: 'resend', description: 'Resend API Transactional Mailer (Studio Production Tier)', amount: 20.00, billingCycle: 'monthly' },

      // 📈 Marketing Ad Spend & Domains
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

    console.log('[🌱] Real app integration and Gemini AI accounting seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('[❌] Error seeding database:', err);
    process.exit(1);
  }
};

seedData();
