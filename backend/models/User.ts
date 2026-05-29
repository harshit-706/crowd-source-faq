import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User roles enum
export type UserRole = 'user' | 'moderator' | 'admin' | 'ai_moderator';

// Interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Main schema for User accounts
const userSchema = new MongooseSchema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // Prevents duplicate accounts
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'], // Basic regex to enforce email format
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // EXCELLENT security measure: hides password from normal database queries
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin', 'ai_moderator'] as UserRole[], // Strict role-based access control (RBAC)
      default: 'user',
    },
  },
  { timestamps: true }
);

// Mongoose Pre-Save Hook: Automatically hashes the password before saving it to the database
userSchema.pre('save', async function (next) {
  // Skip the hashing process if the user is just updating their name or email
  if (!this.isModified('password')) return next();

  // Generate a secure salt and hash the password (factor of 12 strikes a good balance between security and speed)
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// Instance Method: Safely compares a provided login password against the hashed password stored in the DB
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Export the model, explicitly defining the target collection name ('yaksha_faq_users')
export default mongoose.model<IUser>('User', userSchema, 'yaksha_faq_users');