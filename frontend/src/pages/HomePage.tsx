import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SearchBar from '../components/ui/SearchBar';
import CategoryGrid, { categoryPills } from '../components/ui/CategoryGrid';
import TopSolved from '../components/ui/TopSolved';
import TrendingIssues from '../components/ui/TrendingIssues';
import CTA from '../components/ui/CTA';
import api from '../utils/api';
import type { SearchResult, TrendingQuery } from '../types/ui';

// Hand-drawn doodle decorations
function DoodleElements(): React.ReactNode {
  return (
    <>
      {/* Curly bracket doodle */}
      <div className="absolute -top-6 -left-16 hidden lg:block" style={{ pointerEvents: 'none' }}>
        <svg width="50" height="100" viewBox="0 0 50 100" fill="none" style={{ opacity: 0.3 }}>
          <path d="M40 8 C26 8, 22 18, 22 28 C22 38, 16 44, 6 46 C16 48, 22 54, 22 64 C22 74, 26 84, 40 84" stroke="#b8a080" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </svg>
      </div>

      {/* "Let's solve it!" speech bubble */}
      <div className="absolute -top-8 left-[40px] hidden lg:block" style={{ pointerEvents: 'none', transform: 'rotate(-6deg)' }}>
        <svg width="105" height="80" viewBox="0 0 105 80" fill="none" style={{ opacity: 0.32 }}>
          <ellipse cx="52" cy="28" rx="42" ry="22" stroke="#b8a080" strokeWidth="2" strokeDasharray="6 4" fill="none"/>
          <path d="M68 46 L80 68 L62 44" stroke="#b8a080" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="22" y="25" fontSize="11" fontFamily="'DM Serif Display', serif" fontStyle="italic" fill="#8a7560" opacity="0.85">Let&apos;s</text>
          <text x="18" y="38" fontSize="11" fontFamily="'DM Serif Display', serif" fontStyle="italic" fill="#8a7560" opacity="0.85">solve it!</text>
        </svg>
      </div>

      {/* Big sparkle */}
      <div className="absolute top-2 right-[28%] hidden lg:block" style={{ pointerEvents: 'none' }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ opacity: 0.35 }}>
          <path d="M14 2 L14 26 M2 14 L26 14 M5 5 L23 23 M23 5 L5 23" stroke="#c4943a" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Small star */}
      <div className="absolute top-[20px] left-[16%] hidden lg:block" style={{ pointerEvents: 'none' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ opacity: 0.3 }}>
          <path d="M9 0 L9 18 M0 9 L18 9" stroke="#5a7a5a" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M3 3 L15 15 M15 3 L3 15" stroke="#5a7a5a" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Curved arrow */}
      <div className="absolute top-[120px] -left-10 hidden lg:block" style={{ pointerEvents: 'none' }}>
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" style={{ opacity: 0.3 }}>
          <path d="M12 8 C24 30, 36 44, 58 54" stroke="#b8a080" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d="M48 48 L58 54 L50 60" stroke="#b8a080" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Lightbulb doodle */}
      <div className="absolute -top-4 -right-14 hidden lg:block" style={{ pointerEvents: 'none' }}>
        <svg width="55" height="75" viewBox="0 0 55 75" fill="none" style={{ opacity: 0.3 }}>
          <path d="M27 12 C16 12, 10 20, 10 28 C10 36, 16 40, 20 46 L34 46 C38 40, 44 36, 44 28 C44 20, 38 12, 27 12Z" stroke="#c4943a" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <line x1="20" y1="50" x2="34" y2="50" stroke="#c4943a" strokeWidth="2" strokeLinecap="round"/>
          <line x1="22" y1="54" x2="32" y2="54" stroke="#c4943a" strokeWidth="2" strokeLinecap="round"/>
          <line x1="27" y1="2" x2="27" y2="7" stroke="#c4943a" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="8" y1="12" x2="12" y2="16" stroke="#c4943a" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="46" y1="12" x2="42" y2="16" stroke="#c4943a" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="2" y1="28" x2="7" y2="28" stroke="#c4943a" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="47" y1="28" x2="52" y2="28" stroke="#c4943a" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Question mark doodle */}
      <div className="absolute top-[210px] -right-14 hidden lg:block" style={{ pointerEvents: 'none' }}>
        <svg width="40" height="60" viewBox="0 0 40 60" fill="none" style={{ opacity: 0.35 }}>
          <path d="M12 16 C12 6, 28 6, 28 16 C28 24, 20 26, 20 36" stroke="#b8a080" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <circle cx="20" cy="44" r="2.5" fill="#b8a080"/>
        </svg>
      </div>

      {/* Pencil doodle */}
      <div className="absolute top-[200px] left-[-20px] hidden lg:block" style={{ pointerEvents: 'none' }}>
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" style={{ opacity: 0.28 }}>
          <path d="M38 5 L12 32 L10 42 L20 40 L46 13 Z" stroke="#8a7560" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="30" y1="12" x2="38" y2="20" stroke="#8a7560" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Code brackets */}
      <div className="absolute top-[330px] right-[-12px] hidden lg:block" style={{ pointerEvents: 'none' }}>
        <svg width="45" height="55" viewBox="0 0 45 55" fill="none" style={{ opacity: 0.28 }}>
          <path d="M16 5 L6 27 L16 49" stroke="#8a7560" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M29 5 L39 27 L29 49" stroke="#8a7560" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="14" y1="20" x2="31" y2="20" stroke="#8a7560" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="14" y1="34" x2="31" y2="34" stroke="#8a7560" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Wavy squiggle */}
      <div className="absolute top-[170px] right-[12%] hidden lg:block" style={{ pointerEvents: 'none' }}>
        <svg width="90" height="16" viewBox="0 0 90 16" fill="none" style={{ opacity: 0.3 }}>
          <path d="M2 8 Q12 2, 22 8 Q32 14, 42 8 Q52 2, 62 8 Q72 14, 82 8" stroke="#5a7a5a" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      </div>
    </>
  );
}

const fallbackPopular = [
  'offer letter',
  'noc request',
  'team formation',
  'project submission',
  'certificate',
];

const getConfidenceLevel = (result: SearchResult): string => {
  const vectorScore = Number(result.vectorScore || 0);
  const textScore = Number(result.textScore || 0);

  if (textScore >= 2 || vectorScore >= 0.9) return 'High';
  if (textScore > 0 || vectorScore >= 0.82) return 'Medium';
  return 'Medium';
};

interface ConfidenceTagProps {
  level: string;
}

function ConfidenceTag({ level }: ConfidenceTagProps) {
  const isHigh = level === 'High';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
      isHigh ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
    }`}>
      {level} Confidence
    </span>
  );
}

interface ResultItemProps {
  result: SearchResult;
  expanded: boolean;
  onToggle: () => void;
}

function ResultItem({ result, expanded, onToggle }: ResultItemProps) {
  const title = result.question || result.title || 'Untitled';
  const fullContent = result.answer || result.body || '';
  const isCommunity = result.source === 'community';
  const sourceLabel = result.source === 'faq' ? 'FAQ' : 'Community';
  const confidence = getConfidenceLevel(result);

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      expanded ? 'border-accent/30 bg-cream' : 'border-border/70 bg-white/80 hover:bg-cream'
    }`}>
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start justify-between gap-3"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink leading-snug line-clamp-1">
            {title}
          </p>
          {fullContent && (
            <p className="mt-1 text-xs text-ink-soft leading-relaxed line-clamp-2">
              {fullContent}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] text-ink-faint">
            <span className="px-2 py-0.5 rounded-full bg-mist text-ink-soft">
              {sourceLabel}
            </span>
            {result.category && (
              <span className="text-ink-faint">{result.category}</span>
            )}
          </div>
        </div>
        <ConfidenceTag level={confidence} />
      </button>

      {expanded && fullContent && (
        <div className="px-4 pb-4 border-t border-border/60">
          {result.source === 'faq' && result.answer && (
            <div className="mt-3 rounded-xl bg-accent-light border border-accent/15 p-4">
              <p className="text-[11px] font-semibold text-accent mb-2 uppercase tracking-wide">Answer</p>
              <p className="text-sm text-ink/75 leading-relaxed whitespace-pre-wrap">
                {result.answer}
              </p>
            </div>
          )}

          {isCommunity && result.body && (
            <div className="mt-3">
              <p className="text-sm text-ink/70 leading-relaxed">{result.body}</p>
            </div>
          )}

          {isCommunity && result.answer && (
            <div className="mt-3 rounded-xl bg-success-light border border-success/15 p-4">
              <p className="text-[11px] font-semibold text-success mb-2 uppercase tracking-wide">
                Official Answer
              </p>
              <p className="text-sm text-ink/75 leading-relaxed">{result.answer}</p>
            </div>
          )}

          {isCommunity && !result.answer && (
            <div className="mt-3 rounded-xl bg-warning-light border border-warning/15 p-3">
              <p className="text-xs text-warning">
                This question has not been answered yet. Ask the community to help!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [trending, setTrending] = useState<TrendingQuery[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchBarRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    api.get('/search/trending')
      .then((res) => {
        if (isMounted) setTrending(res.data.trending || []);
      })
      .catch(() => {
        if (isMounted) setTrending([]);
      })
      .finally(() => {
        if (isMounted) setTrendingLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setExpandedId(null);
  }, [results]);

  const normalizedQuery = query.trim().toLowerCase();
  const isTyping = normalizedQuery.length > 0;
  const isReadyForResults = query.trim().length >= 3;
  const showDropdown = isTyping || loading || Array.isArray(results);
  const showResultsPanel = loading || Array.isArray(results);
  const isSearchActive = showResultsPanel && isReadyForResults;

  let suggestionItems = normalizedQuery
    ? categoryPills.filter((cat) => cat.name.toLowerCase().includes(normalizedQuery))
    : categoryPills.slice(0, 5);
  if (normalizedQuery && suggestionItems.length === 0) {
    suggestionItems = categoryPills.slice(0, 5);
  }

  const popularItems = trending.length
    ? trending
    : fallbackPopular.map((item) => ({ query: item }));

  const matchingResults = Array.isArray(results) ? results : [];

  const handleQuickSearch = async (selectedQuery: string) => {
    const nextQuery = selectedQuery.trim();
    if (!nextQuery) return;

    setQuery(nextQuery);
    setExpandedId(null);
    setLoading(true);
    setResults(null);
    searchBarRef.current?.focus();
    window.scrollTo({ top: 200, behavior: 'smooth' });

    try {
      const res = await api.post('/search', { query: nextQuery });
      setResults(res.data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryName: string) => {
    setActiveCategory(categoryName);
    handleQuickSearch(categoryName);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (activeCategory && value.trim().toLowerCase() !== activeCategory.toLowerCase()) {
      setActiveCategory('');
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setLoading(false);
    setActiveCategory('');
    setExpandedId(null);
  };

  return (
    <div className="min-h-screen bg-bg grid-bg">
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8">
        {/* Hero heading */}
        <section className="relative text-center mb-8">
          <DoodleElements />

          <h1 className="font-serif text-[1.75rem] sm:text-4xl md:text-5xl lg:text-[3.2rem] leading-[1.15] tracking-tight text-ink mb-3">
            Ask. Discover. Get{' '}
            <span className="doodle-underline font-serif" style={{ fontWeight: 700 }}>Solved.</span>
            <svg className="inline-block ml-2 align-middle" width="24" height="18" viewBox="0 0 24 18" style={{ opacity: 0.18 }}>
              <path d="M2 12 Q6 4 12 9 Q18 14 22 6" stroke="#1f1f1f" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </h1>

          <p className="text-sm sm:text-base text-ink-soft mb-6 sm:mb-8 max-w-lg leading-relaxed mx-auto px-2">
            Search your doubt or explore solved questions from the community.
          </p>
        </section>

        {/* Backdrop blur overlay when search is active */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleClear}
            aria-hidden="true"
          />
        )}

        {/* Search + Categories */}
        <section className="relative mb-10 sm:mb-12">
          <div className={`relative max-w-3xl mx-auto ${showDropdown ? 'z-40' : 'z-20'}`}>
            <SearchBar
              ref={searchBarRef}
              value={query}
              onQueryChange={handleQueryChange}
              onResults={setResults}
              onLoading={setLoading}
            />

            {showDropdown && (
              <div className="absolute left-0 right-0 top-full mt-3 z-40 animate-fade-in">
                <div className="rounded-3xl border border-border bg-card/95 backdrop-blur-xl shadow-float">
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div>
                      <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide">
                        {showResultsPanel ? 'Search results' : 'Search suggestions'}
                      </p>
                      {isTyping && (
                        <p className="text-sm text-ink mt-1">
                          Results for <span className="font-semibold">"{query}"</span>
                        </p>
                      )}
                    </div>
                    {isTyping && (
                      <button
                        onClick={handleClear}
                        className="text-xs font-medium text-ink-soft hover:text-ink transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 px-4 pb-4 lg:grid-cols-[1.35fr_0.95fr]">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide">
                          Matching questions
                        </p>
                        {showResultsPanel && (
                          <span className="text-xs text-ink-faint">
                            {matchingResults.length} found
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                        {loading && (
                          [1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-[86px] rounded-2xl border border-border/60 bg-white/70 animate-pulse"
                            />
                          ))
                        )}

                        {!loading && matchingResults.length > 0 && matchingResults.map((result, idx) => {
                          const resultKey = result._id || `${result.source || 'result'}-${idx}`;
                          const isExpanded = expandedId === resultKey;
                          return (
                            <ResultItem
                              key={resultKey}
                              result={result}
                              expanded={isExpanded}
                              onToggle={() => setExpandedId(isExpanded ? null : resultKey)}
                            />
                          );
                        })}

                        {!loading && matchingResults.length === 0 && (
                          <div className="rounded-2xl border border-dashed border-border bg-white/70 p-4">
                            <p className="text-xs text-ink-soft">
                              {isReadyForResults
                                ? 'No matches found. Try a different phrase or ask the community.'
                                : 'Keep typing to see matching questions.'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 rounded-2xl border border-border/70 bg-white/80 p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-ink">Need a human answer?</p>
                          <p className="text-[11px] text-ink-soft">Ask the community and get help faster.</p>
                        </div>
                        <button
                          onClick={() => navigate('/community')}
                          className="shrink-0 px-3 py-2 rounded-full bg-ink text-white text-[11px] font-semibold hover:bg-ink/85 transition-colors"
                        >
                          Ask community
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide">
                          Suggestions
                        </p>
                        <div className="mt-2 space-y-1">
                          {suggestionItems.map((cat) => (
                            <button
                              key={cat.name}
                              onClick={() => handleQuickSearch(cat.name)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl border border-border/60 bg-white/70 text-left hover:bg-cream transition-colors"
                            >
                              <span className="text-ink-faint">{cat.icon}</span>
                              <span className="text-sm text-ink">{cat.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide">
                          Popular searches
                        </p>
                        <div className="mt-2 space-y-1">
                          {trendingLoading && (
                            [1, 2, 3].map((i) => (
                              <div key={i} className="h-10 rounded-2xl border border-border/60 bg-white/70 animate-pulse" />
                            ))
                          )}

                          {!trendingLoading && popularItems.map((item) => (
                            <button
                              key={item.query}
                              onClick={() => handleQuickSearch(item.query)}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-border/60 bg-white/70 text-left hover:bg-cream transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-ink-faint">
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" />
                                    <path d="M6 3.5V6L8 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                  </svg>
                                </span>
                                <span className="text-sm text-ink capitalize">{item.query}</span>
                              </div>
                              {item.count !== undefined && (
                                <span className="text-[11px] text-ink-faint">{item.count}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`mt-5 sm:mt-6 transition-all duration-300 ${
            showDropdown ? 'opacity-70 translate-y-1' : 'opacity-100'
          }`}>
            <CategoryGrid
              activeCategory={activeCategory}
              onSelect={handleCategorySelect}
            />
          </div>
        </section>

        {/* Top Solved + Trending Issues Row */}
        {!isSearchActive && (
          <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 sm:gap-8 items-start">
            <TopSolved />
            <div className="lg:mt-14 mt-0">
              <TrendingIssues />
            </div>
          </section>
        )}

        {/* CTA */}
        {!isSearchActive && <CTA />}

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}