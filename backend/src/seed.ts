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

    // Wipe all static seeded cost/revenue entries so everything is fetched 100% dynamically via live APIs
    await CostEntry.deleteMany({});
    await RevenueEntry.deleteMany({});

    console.log('[🌱] Clean initialization complete! Zero static seeded cost entries. Everything is fetched 100% live from DigitalOcean, Name.com, and Resend APIs.');
    process.exit(0);
  } catch (err) {
    console.error('[❌] Error initializing database:', err);
    process.exit(1);
  }
};

seedData();
