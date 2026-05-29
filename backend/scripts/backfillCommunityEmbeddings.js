import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CommunityPost from '../models/CommunityPost.js';
import { generateEmbedding } from '../utils/embeddings.js';

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const posts = await CommunityPost.find({
    $or: [{ embedding: { $exists: false } }, { embedding: null }],
  });

  for (const post of posts) {
    post.embedding = await generateEmbedding(`${post.title}. ${post.body}`);
    await post.save();
    console.log(`Updated ${post._id}`);
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});