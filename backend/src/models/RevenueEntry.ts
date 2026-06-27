import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRevenueEntry extends Document {
  organizationId: Types.ObjectId;
  source: 'google_adsense' | 'stripe_subscriptions' | 'affiliate' | 'direct_sales' | 'other';
  description: string;
  amount: number; // in USD
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RevenueEntrySchema: Schema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  source: { 
    type: String, 
    required: true, 
    enum: ['google_adsense', 'stripe_subscriptions', 'affiliate', 'direct_sales', 'other'],
    index: true 
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now, index: true },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model<IRevenueEntry>('RevenueEntry', RevenueEntrySchema);
