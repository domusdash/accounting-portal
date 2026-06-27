import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  name: string;
  role: 'superadmin' | 'admin' | 'viewer';
  allowedOrganizations?: mongoose.Types.ObjectId[];
  disabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String },
  name: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'viewer'], default: 'admin' },
  allowedOrganizations: [{ type: Schema.Types.ObjectId, ref: 'Organization' }],
  disabled: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
