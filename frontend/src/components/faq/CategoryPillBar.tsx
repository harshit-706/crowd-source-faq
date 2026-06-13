import React, { useRef, useState } from 'react';
import { categoryPills } from './CategoryGrid';
import { getCategoryIcon } from './faqUtils';

interface CategoryPillBarProps {
  /** Name of the currently active category (case-insensitive match). */
  activeCategory?: string;
  /** Called with the category name on click, or '' when "Browse all" is pressed. */
  onSelect?: (category: string) => void;
  className?: string;
  /**
   * Optional list of categories to render. Falls back to the canonical
   * 14-section list from backend/faqs.json (via `categoryPills`) when
   * omitted. Each item is augmented with an icon resolved by name.
   */
  categories?: Array<{ name: string; count?: number }>;
}

/**
 * Horizontal pill-bar scroller for FAQ categories.
 *
 * Extracted out of the old `CategoryGrid` when that component was repurposed
 * as the FAQ page's card grid. The two components are now distinct:
 *   - `CategoryGrid`      → card grid (used by FAQPage)
 *   - `CategoryPillBar`   → this pill bar (used by HomePage)
 */
export default function CategoryPillBar({
  activeCategory,
  onSelect,
  className = '',
  categories: categoriesProp,
}: CategoryPillBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const categories: Array<{ name: string; count?: number }> =
    categoriesProp ?? categoryPills.map((c) => ({ name: c.name }));

  const updateFades = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 8);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  const handleScroll = (direction: number) => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({
      left: direction * 240,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide">
          Quick filters
        </p>
        {onSelect ? (
          <button
            onClick={() => onSelect('')}
            className="text-xs font-medium text-ink-soft hover:text-accent transition-colors"
          >
            Browse all
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleScroll(-1)}
          className="shrink-0 w-8 h-8 rounded-full border border-border/80 bg-card/90 backdrop-blur-sm shadow-subtle flex items-center justify-center text-ink-faint hover:text-ink hover:border-ink/20 hover:bg-cream transition-all"
          aria-label="Scroll categories left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          ref={scrollerRef}
          onScroll={updateFades}
          className="relative flex-1 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
        >
          {showLeftFade && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-bg/90 to-transparent pointer-events-none z-10" />
          )}
          {showRightFade && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg/90 to-transparent pointer-events-none z-10" />
          )}
          {categories.map((cat) => {
            const isActive = !!(activeCategory
              && activeCategory.toLowerCase() === cat.name.toLowerCase());
            return (
              <button
                key={cat.name}
                onClick={() => onSelect?.(cat.name)}
                aria-pressed={isActive}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0
                  ${isActive
                    ? 'bg-accent text-accent-text border-accent/50 shadow-[0_10px_26px_rgba(90,122,90,0.25)]'
                    : 'bg-card/80 text-ink border-border/70 hover:bg-cream hover:-translate-y-0.5 hover:shadow-subtle'
                  }`}
              >
                <span className={`${isActive ? 'text-accent-text' : 'text-ink-faint'}`}>
                  {getCategoryIcon(cat.name)}
                </span>
                <span>{cat.name}</span>
                {typeof cat.count === 'number' && (
                  <span className="text-ink-faint text-[10px]">({cat.count})</span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleScroll(1)}
          className="shrink-0 w-8 h-8 rounded-full border border-border/80 bg-card/90 backdrop-blur-sm shadow-subtle flex items-center justify-center text-ink-faint hover:text-ink hover:border-ink/20 hover:bg-cream transition-all"
          aria-label="Scroll categories right"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
