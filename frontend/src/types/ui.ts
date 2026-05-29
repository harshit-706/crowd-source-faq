// Shared types across UI components

export interface Post {
  _id: string;
  title: string;
  body?: string;
  status?: 'answered' | 'open' | string;
  author?: { name?: string; _id?: string };
  createdAt?: string;
  upvotes?: (string | { _id?: string })[];
  comments?: unknown[];
  [key: string]: unknown;
}

export interface TrendingQuery {
  query: string;
  count: number;
}

export interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface SearchResult {
  _id: string;
  question?: string;
  title?: string;
  answer?: string;
  body?: string;
  source?: 'faq' | 'community';
  status?: 'answered' | 'open' | string;
  category?: string;
  upvotes?: unknown[];
  comments?: unknown[];
}

export interface Category {
  name: string;
  icon: React.ReactNode;
}