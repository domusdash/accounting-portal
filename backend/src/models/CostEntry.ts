import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICostEntry extends Document {
  organizationId: Types.ObjectId;
  category: 'digital_ocean' | 'mongodb_atlas' | 'resend' | 'ad_spend' | 'domain_hosting' | 'ai_apis' | 'github' | 'other';
  description: string;
  amount: number; // in USD
  billingCycle: 'monthly' | 'one_time' | 'annual';
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CostEntrySchema: Schema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['digital_ocean', 'mongodb_atlas', 'resend', 'ad_spend', 'domain_hosting', 'ai_apis', 'github', 'other'],
    index: true 
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  billingCycle: { type: String, enum: ['monthly', 'one_time', 'annual'], default: 'monthly' },
  date: { type: Date, default: Date.now, index: true },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model<ICostEntry>('CostEntry', CostEntrySchema);
