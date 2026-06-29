import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganizationGroup extends Document {
  name: string;
  slug: string;
  description?: string;
  memberOrgIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationGroupSchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  memberOrgIds: [{ type: Schema.Types.ObjectId, ref: 'Organization' }]
}, { timestamps: true });

export default mongoose.model<IOrganizationGroup>('OrganizationGroup', OrganizationGroupSchema);
