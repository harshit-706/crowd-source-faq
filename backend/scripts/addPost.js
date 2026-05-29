import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CommunityPost from '../models/CommunityPost.js';
import User from '../models/User.js';

// Load environment variables (like MONGODB_URI) from the .env file
dotenv.config();

async function addCommunityPost() {
  try {
    // 1. Establish a connection to the MongoDB database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 2. Attempt to find a specific test user to act as the post author
    let author = await User.findOne({ email: 'reg@yaksha.com' });
    
    // 3. Fallback: grab the very first user in the database if the specific one isn't found
    if (!author) {
      author = await User.findOne(); 
    }

    // 4. Abort the script if the database has absolutely no users
    if (!author) {
      console.log('No user found to set as author.');
      process.exit(1);
    }

    // 5. Create and save the new community post to the database
    const newPost = await CommunityPost.create({
      title: 'Welcome to the Yaksha Community Board! 🎉',
      body: 'Hello everyone! I just wanted to test out the live deployment. Feel free to ask any internship-related questions here, and the community will help you out!',
      author: author._id,
      status: 'answered',
      answer: 'Thanks for stopping by! The deployment looks great. - Admin',
    });

    console.log('Successfully added new community post:', newPost.title);
    
    // 6. Exit the Node process successfully (status 0) to free up the terminal
    process.exit(0);
  } catch (err) {
    // 7. Catch and log any connection or database insertion errors, then exit with a failure code (1)
    console.error('Failed to add post:', err);
    process.exit(1);
  }
}

// Execute the async function
addCommunityPost();
