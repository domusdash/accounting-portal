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

    // Clear ledger entries so user has clean slate
    await CostEntry.deleteMany({});
    await RevenueEntry.deleteMany({});

    console.log('[🌱] Seeding only exact verified server droplets...');
    const verifiedCosts = [
      // Verified DigitalOcean Droplet Servers ($4.00/mo SFO3 droplets)
      { org: 'antiwokeschools', category: 'digital_ocean', description: 'DigitalOcean Droplet Server (antiwokeschools SFO3 512MB)', amount: 4.00, billingCycle: 'monthly' },
      { org: 'thumbverify', category: 'digital_ocean', description: 'DigitalOcean Droplet Server (thumbverify-prod SFO3 512MB)', amount: 4.00, billingCycle: 'monthly' },
      { org: 'oftheworld', category: 'digital_ocean', description: 'DigitalOcean Droplet Server (oftheworld-prod SFO3 512MB)', amount: 4.00, billingCycle: 'monthly' },
      
      // Verified DigitalOcean App Platform Services ($5.00/mo)
      { org: 'localredactpdf', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (localredactpdf)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'blueprintconverter', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (blueprintconverter)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'freeqrcode', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (freeqrcode-pro)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'daily-flow-labs', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (dailyflowlabs)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'irondial', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (irondial)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'short-code-icons', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (shortcode-icons)', amount: 5.00, billingCycle: 'monthly' },
      { org: 'daily-flow-labs', category: 'digital_ocean', description: 'DigitalOcean App Platform Instance (accounting-portal)', amount: 5.00, billingCycle: 'monthly' }
    ];

    for (const c of verifiedCosts) {
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

    console.log('[🌱] Accounting database clean seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('[❌] Error seeding database:', err);
    process.exit(1);
  }
};

seedData();
