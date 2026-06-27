import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  isParent?: boolean;
  supportEmail?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  isParent: { type: Boolean, default: false },
  supportEmail: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
