import React, { useState } from 'react';
import type { FAQItem } from '../../types/ui';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left group"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-ink group-hover:text-accent transition-colors leading-snug">
          {question}
        </span>
        <span
          className={`flex-shrink-0 w-5 h-5 rounded-full border
                      flex items-center justify-center
                      transition-all duration-200 mt-0.5
                      ${open ? 'rotate-180 border-accent/40 text-accent bg-accent-light' : 'border-border text-ink-faint'}`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {open && (
        <div className="pb-4 pr-9">
          <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

interface FAQAccordionProps {
  category: string;
  items: FAQItem[];
}

export default function FAQAccordion({ category, items }: FAQAccordionProps) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-subtle overflow-hidden">
      <div className="px-5 py-3 bg-mist border-b border-border">
        <h2 className="text-xs font-serif font-normal text-ink-soft uppercase tracking-wider">
          {category}
        </h2>
      </div>

      <div className="px-5">
        {items.map((faq) => (
          <FAQItem key={faq._id} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
}