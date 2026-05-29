import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import CommunityPost from '../models/CommunityPost.js';
import User from '../models/User.js';
import { generateEmbedding } from '../utils/embeddings.js';

// Resolve directory paths (required because standard __dirname is not available in ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the parent directory's .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Hardcoded array of sample community discussions to populate the database
const samplePosts = [
  {
    title: 'Do I need to attend all team standups?',
    body: 'My team has daily standups at 9 AM but my timezone makes it hard. Is attendance strictly mandatory?',
    status: 'answered',
    answer: 'Standups are generally expected unless you have a prior arrangement with your manager. Please discuss timezone accommodations directly with them.',
  },
  {
    title: 'Project documentation – is there a specific format required?',
    body: 'I want to start writing my project documentation. Is there a template I should follow?',
    status: 'unanswered',
    answer: null,
  },
  {
    title: 'Can I work on side features outside the assigned project scope?',
    body: 'I have some ideas that go beyond the current task. Should I implement them anyway?',
    status: 'answered',
    answer: 'Always complete your core tasks first. If you have bandwidth, discuss the side features with your mentor before starting them.',
  },
  {
    title: 'How to request time off during the internship?',
    body: 'I have a family event next month. What is the process for taking a few days off?',
    status: 'answered',
    answer: 'Submit a PTO request through the HR portal at least 2 weeks in advance and notify your direct manager.',
  },
  {
    title: 'When do we get access to the production servers?',
    body: 'I need to debug a live issue but I do not have SSH access to production yet.',
    status: 'unanswered',
    answer: null,
  }
];

async function seedPosts() {
  try {
    // 1. Establish database connection
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 2. Locate an existing user to act as the author for these test posts
    let author = await User.findOne({ email: 'reg@yaksha.com' });
    if (!author) {
      author = await User.findOne(); // Fallback to any user
    }
    
    if (!author) {
      console.log('No user found to act as author. Please run seed.js first.');
      process.exit(1);
    }

    // Clear existing community posts to prevent duplicate pollution
    console.log("Clearing existing community posts...");
    await CommunityPost.deleteMany();

    const docsToInsert = [];
    
    // 4. Process each post sequentially to generate its semantic embedding
    for (let i = 0; i < samplePosts.length; i++) {
      const post = samplePosts[i];
      
      // Combine title, body, and answer (if any) to create a dense semantic footprint
      const textToEmbed = `Question: ${post.title}. Description: ${post.body}. Answer: ${post.answer || ''}`;
      
      // Generate embedding vector using the unified utility function
      const embedding = await generateEmbedding(textToEmbed);

      // Prepare the final document object
      docsToInsert.push({
        ...post,
        author: author._id,
        embedding: embedding,
      });
      
      console.log(`Processed post: ${post.title}`);
    }

    // 5. Bulk insert all processed posts into MongoDB for optimal performance
    await CommunityPost.insertMany(docsToInsert);
    console.log(`\nSuccessfully inserted ${docsToInsert.length} community posts into the database!`);
    
    process.exit(0); // Exit successfully
  } catch (err) {
    console.error('Error seeding posts:', err);
    process.exit(1); // Exit with error code
  }
}

// Execute the seeding script
seedPosts();
