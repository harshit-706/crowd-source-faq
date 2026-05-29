/**
 * Migration: Add performance and safety indexes
 * Run: node scripts/addIndexes.js
 *
 * Indexes added:
 * 1. SearchLog TTL index — auto-deletes logs after 90 days
 * 2. SearchLog query index — speeds up aggregation grouping
 * 3. FAQ category+status compound index — speeds up admin FAQ list
 * 4. CommunityPost status+createdAt index — speeds up community feed filtering
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import FAQ from '../models/FAQ.js';
import CommunityPost from '../models/CommunityPost.js';
import SearchLog from '../models/SearchLog.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yaksha_faq';

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.\n');

  const db = mongoose.connection.db;

  // ── 1. SearchLog TTL Index ─────────────────────────────────────────────────
  // Auto-expires documents after 90 days (60*60*24*90 seconds)
  console.log('Creating SearchLog TTL index (90-day expiry)...');
  try {
    await db.collection('yaksha_faq_searchlogs').createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 60 * 60 * 24 * 90 }
    );
    console.log('  ✓ SearchLog TTL index created');
  } catch (err) {
    if (err.code === 85 || err.code === 86) {
      console.log('  ✓ SearchLog TTL index already exists (with different options) — skipping');
    } else {
      throw err;
    }
  }

  // ── 2. SearchLog query index ────────────────────────────────────────────────
  // Speeds up the aggregation pipeline that groups by lowercase query
  console.log('Creating SearchLog query index...');
  try {
    await db.collection('yaksha_faq_searchlogs').createIndex({ query: 1, createdAt: -1 });
    console.log('  ✓ SearchLog query index created');
  } catch (err) {
    if (err.code === 85 || err.code === 86) {
      console.log('  ✓ SearchLog query index already exists — skipping');
    } else {
      throw err;
    }
  }

  // ── 3. FAQ compound index ───────────────────────────────────────────────────
  // Speeds up admin FAQ list with status/category filters + sort
  console.log('Creating FAQ compound index...');
  try {
    await db.collection('yaksha_faq_faqs').createIndex(
      { category: 1, status: 1, createdAt: -1 }
    );
    console.log('  ✓ FAQ compound index created');
  } catch (err) {
    if (err.code === 85 || err.code === 86) {
      console.log('  ✓ FAQ compound index already exists — skipping');
    } else {
      throw err;
    }
  }

  // ── 4. CommunityPost feed index ─────────────────────────────────────────────
  // Speeds up paginated community feed with status filter
  console.log('Creating CommunityPost feed index...');
  try {
    await db.collection('yaksha_faq_communityposts').createIndex(
      { status: 1, createdAt: -1 }
    );
    console.log('  ✓ CommunityPost feed index created');
  } catch (err) {
    if (err.code === 85 || err.code === 86) {
      console.log('  ✓ CommunityPost feed index already exists — skipping');
    } else {
      throw err;
    }
  }

  // ── 5. User email index ─────────────────────────────────────────────────────
  // Already unique=true in schema, but ensure index exists
  console.log('Creating User email index...');
  try {
    await db.collection('yaksha_faq_users').createIndex(
      { email: 1 },
      { unique: true, background: true }
    );
    console.log('  ✓ User email index created');
  } catch (err) {
    if (err.code === 85 || err.code === 86) {
      console.log('  ✓ User email index already exists — skipping');
    } else {
      throw err;
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n✅ All indexes applied successfully.');
  console.log('\nNote: TTL index takes up to 60 seconds to start processing deletions.');
  console.log('Old search log documents will be removed automatically over time.\n');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});