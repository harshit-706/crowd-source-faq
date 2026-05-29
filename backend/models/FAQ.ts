import mongoose, { Document, Schema as MongooseSchema, Types } from 'mongoose';

// FAQ status enum
export type FAQStatus = 'pending' | 'approved' | 'rejected';

// Interface for the FAQ document
export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  embedding?: number[];
  searchCount: number;
  status: FAQStatus;
  views: number;
  helpfulVotes: number;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// Main schema for Frequently Asked Questions
const faqSchema = new MongooseSchema(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true, // Used to group FAQs together on the frontend
    },
    embedding: {
      type: [Number], // Stores high-dimensional vector arrays for AI semantic search
      default: undefined,
      select: false,  // EXCELLENT optimization: hides this heavy data from standard queries
    },
    searchCount: {
      type: Number,   // Analytics tracker to easily identify popular FAQs
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'] as FAQStatus[],
      default: 'approved',
    },
    views: {
      type: Number,
      default: 0,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: MongooseSchema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true } // Automatically manages 'createdAt' and 'updatedAt' fields
);

// Creates a compound text index to enable traditional MongoDB $text keyword searches
faqSchema.index({ question: 'text', answer: 'text' });

// Export the model, explicitly defining the target collection name ('yaksha_faq_faqs')
export default mongoose.model<IFAQ>('FAQ', faqSchema, 'yaksha_faq_faqs');