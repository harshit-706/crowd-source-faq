/**
 * style_config.ts — Centralised Tailwind class-string constants
 *
 * Purpose: every theme-aware Tailwind class string used in the frontend
 * is defined ONCE here. Components import from this file instead of
 * writing class strings inline. Benefits:
 *
 *  1. Modularity: rename a class here, update the whole UI.
 *  2. Consistency: same role always uses the same class.
 *  3. Theme-awareness: every constant here uses semantic tokens
 *     (bg-accent, text-ink, border-border, ...) that resolve to the
 *     CSS variables in src/styles/index.css. The whole UI re-skins
 *     automatically when theme tokens change.
 *  4. Discoverability: one grep here finds every variant of a role
 *     (card padding, modal surface, danger state, etc.).
 *
 * Conventions:
 *  - Class strings only — no JSX, no logic, no runtime values.
 *  - Semantic naming by ROLE not APPEARANCE (`buttonPrimary` not
 *    `brownButton`). A role's appearance may change with theme.
 *  - Tailwind utility names not opaque aliases.
 *  - String concatenation at the call site for variants (e.g.
 *    `${buttonPrimary} ${disabled && 'opacity-40 cursor-not-allowed'}`).
 *
 * Adding new constants:
 *  - Pick the right section (typography, layout, surfaces, controls,
 *    status, feedback). Don't dump everything in one bag.
 *  - Use semantic tokens (bg-accent, text-ink, ...), never raw hex
 *    or hardcoded tailwind colours (no bg-red-500 etc.).
 *  - If a class string is only used once, it doesn't belong here yet
 *    — wait until a second caller appears.
 */

/* ── 1. Typography ────────────────────────────────────────────────
 * Body text, labels, headers, and numeric/mono. All use the
 * text-ink / text-ink-soft / text-ink-faint token chain. */

export const textBody        = 'text-sm text-ink';
export const textBodySoft    = 'text-sm text-ink-soft';
export const textBodyFaint   = 'text-sm text-ink-faint';
export const textBodyMuted   = 'text-sm text-ink-soft -mt-2';

export const textLabel       = 'text-sm font-medium text-ink';
export const textLabelBold   = 'text-sm font-semibold text-ink';
export const textLabelStrong = 'text-sm font-semibold text-ink mb-1.5';
export const textLabelFaint  = 'text-xs text-ink-faint mt-0.5';
export const textLabelFaintLg = 'text-sm text-ink-faint -mt-2';

export const textXs          = 'text-xs text-ink-soft';
export const textXsFaint     = 'text-xs text-ink-faint';
export const textXsFaintTop  = 'text-xs text-ink-faint mt-1';
export const textXsFaintTop0 = 'text-xs text-ink-faint mt-0.5';
export const textXsMuted     = 'text-xs text-ink-faint';
export const textXsLabel     = 'text-xs font-medium text-ink-soft mb-1.5';
export const textXsUpper     = 'text-[11px] font-semibold text-ink-faint uppercase tracking-wider mb-1';
export const textMicro      = 'text-[10px] text-ink-faint';

export const textHeaderSm    = 'text-base font-semibold text-ink';
export const textHeaderMd    = 'text-lg font-semibold text-ink';
export const textHeaderLg    = 'text-xl font-semibold text-ink';
export const textHeaderXl    = 'text-2xl font-semibold text-ink';

export const textLabelXsBold = 'text-xs font-semibold text-ink-faint uppercase tracking-wider mb-1';
export const textLabelXs     = 'text-[11px] text-ink-faint';
export const textLabelXsMb1  = 'text-[11px] font-semibold text-ink-faint uppercase tracking-wide';

export const textMono        = 'font-mono';
export const textNumeric     = 'tabular-nums';

/* ── 2. Layout primitives ─────────────────────────────────────────
 * Flex / grid containers. No color tokens here — pure shape. */

export const flexRow        = 'flex items-center gap-2';
export const flexRowSm      = 'flex items-center gap-1';
export const flexRowLg      = 'flex items-center gap-3';
export const flexRowXl      = 'flex items-center gap-4';
export const flexRowWrap    = 'flex items-center gap-2 flex-wrap';
export const flexRowBetween = 'flex items-center justify-between';
export const flexCol        = 'flex flex-col gap-2';
export const flexColSm      = 'flex flex-col gap-1';
export const flexColMd      = 'flex flex-col gap-3';

export const flexRowStart    = 'flex items-start gap-3';
export const flexColStart   = 'flex flex-col gap-0.5';

export const flexGrow       = 'flex-1 min-w-0';
export const flexShrink     = 'flex-shrink-0';
export const flexNoShrink   = 'flex-shrink-0';

export const stackSm        = 'space-y-2';
export const stackMd        = 'space-y-3';
export const stackLg        = 'space-y-4';
export const stackXs        = 'space-y-1';

/* ── 3. Surfaces ──────────────────────────────────────────────────
 * Background, card, modal, and surface treatments. All use the
 * bg-card / bg-bg / border-border token chain. */

export const surfaceCard        = 'bg-card border border-border rounded-xl';
export const surfaceCardFlat   = 'bg-card';
export const surfaceCardHover  = 'bg-card hover:bg-card-hover border border-border rounded-xl';
export const surfaceCardPadded = 'bg-card border border-border rounded-xl p-5';
export const surfaceCardInline = 'bg-card border border-border rounded-2xl p-4';

export const surfaceMuted      = 'bg-mist border border-border rounded-xl';
export const surfaceMutedFlat  = 'bg-mist';

export const surfacePage       = 'bg-bg text-ink';
export const surfaceOverlay    = 'bg-ink/40 backdrop-blur-sm';

/* Modal/dialog panel — used by DialogShell/DialogPanel. */
export const surfaceModal      = 'bg-card border border-border rounded-2xl shadow-float';

/* ── 4. Controls ───────────────────────────────────────────────────
 * Buttons, inputs, selects. All buttons and inputs use theme
 * variables for the fill / border / text — the previously-hardcoded
 * colour classes were the main source of theme inconsistency. */

export const buttonPrimary    = 'inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-accent-text font-medium px-4 py-2 transition-all duration-200 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed';
export const buttonSecondary  = 'inline-flex items-center justify-center gap-2 rounded-lg bg-card border border-border text-ink font-medium px-4 py-2 transition-all duration-200 hover:bg-mist disabled:opacity-50 disabled:cursor-not-allowed';
export const buttonGhost      = 'inline-flex items-center justify-center gap-2 rounded-lg bg-transparent text-ink-soft font-medium px-4 py-2 transition-all duration-200 hover:bg-mist hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed';
export const buttonDanger     = 'inline-flex items-center justify-center gap-2 rounded-lg bg-danger text-white font-medium px-4 py-2 transition-all duration-200 hover:bg-danger/80 disabled:opacity-50 disabled:cursor-not-allowed';
export const buttonSm         = 'inline-flex items-center justify-center gap-1.5 rounded-md bg-accent text-accent-text text-xs font-medium px-2.5 py-1 transition-all duration-200 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed';
export const buttonIcon       = 'inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-soft hover:bg-mist hover:text-ink transition-colors';
export const buttonIconSm     = 'inline-flex items-center justify-center w-6 h-6 rounded text-ink-soft hover:bg-mist hover:text-ink transition-colors';

export const inputBase        = 'w-full px-3 py-2 rounded-md text-sm text-ink bg-card border border-border outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder-ink-faint disabled:opacity-50 disabled:cursor-not-allowed';
export const inputError       = 'w-full px-3 py-2 rounded-md text-sm text-ink bg-card border border-danger outline-none focus:border-danger focus:ring-2 focus:ring-danger/20 transition-all placeholder-ink-faint';
export const inputSearch      = 'w-full pl-10 pr-3 py-2 rounded-lg text-sm text-ink bg-card border border-border outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all placeholder-ink-faint';

/* ── 5. Status / semantic ──────────────────────────────────────────
 * Success / warning / danger / info. Pulls from the new
 * --success-rgb / --warning-rgb / --danger-rgb / --info-rgb
 * tokens so the four-status palette re-skins with the theme. */

export const statusSuccess   = 'text-success bg-success-light border border-success/20';
export const statusWarning   = 'text-warning bg-warning-light border border-warning/20';
export const statusDanger    = 'text-danger bg-danger-light border border-danger/20';
export const statusInfo      = 'text-info bg-info-light border border-info/20';

export const badgeSuccess    = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-success/10 text-success border border-success/20';
export const badgeWarning    = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-warning/10 text-warning border border-warning/20';
export const badgeDanger     = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-danger/10 text-danger border border-danger/20';
export const badgeInfo       = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-info/10 text-info border border-info/20';
export const badgeNeutral    = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-mist text-ink-soft border border-border';


/* ── 6. Feedback ──────────────────────────────────────────────────
 * Banners, toasts, alerts. */

export const bannerInfo      = 'flex items-start gap-3 px-4 py-3 rounded-xl border border-info/20 bg-info/10 text-info';
export const bannerSuccess   = 'flex items-start gap-3 px-4 py-3 rounded-xl border border-success/20 bg-success/10 text-success';
export const bannerWarning   = 'flex items-start gap-3 px-4 py-3 rounded-xl border border-warning/20 bg-warning/10 text-warning';
export const bannerDanger    = 'flex items-start gap-3 px-4 py-3 rounded-xl border border-danger/20 bg-danger/10 text-danger';

/* ── 7. Loading / empty states ──────────────────────────────────── */

export const skeletonBlock   = 'animate-pulse rounded-xl bg-card-hover';
export const skeletonLine    = 'animate-pulse rounded bg-card-hover';
export const skeletonCircle  = 'animate-pulse rounded-full bg-card-hover';

export const emptyState      = 'flex flex-col items-center justify-center py-12 text-sm text-ink-faint';

/* ── 8. Common icon button patterns ───────────────────────────────
 * Small circular icon buttons used throughout the UI. */

export const iconBtn         = 'inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-soft hover:bg-mist hover:text-ink transition-colors';
export const iconBtnSm       = 'inline-flex items-center justify-center w-6 h-6 rounded text-ink-soft hover:bg-mist hover:text-ink transition-colors';
export const iconBtnAccent   = 'inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-soft hover:text-accent hover:bg-accent-light transition-colors';
export const iconBtnPrimary  = 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-mist text-ink-soft hover:bg-mist hover:text-ink transition-colors';

/* ── 9. Avatar patterns ──────────────────────────────────────────── */

export const avatarSm         = 'w-6 h-6 rounded-full object-cover';
export const avatarMd         = 'w-8 h-8 rounded-full object-cover';
export const avatarLg         = 'w-10 h-10 rounded-full object-cover';
export const avatarPlaceholder = 'w-8 h-8 rounded-full bg-mist flex items-center justify-center text-xs font-semibold text-ink-soft';

/* ── 10. Card / section patterns ──────────────────────────────────
 * Higher-level reusable compositions. */

export const cardSection     = 'bg-card border border-border rounded-xl overflow-hidden';
export const cardSectionPad  = 'bg-card border border-border rounded-xl overflow-hidden p-5';
export const cardHeader      = 'px-4 py-3 border-b border-border';
export const cardBody        = 'px-4 py-3';
export const cardFooter      = 'px-4 py-3 border-t border-border';

/* ── 11. Navbar / pill patterns ─────────────────────────────────── */

export const navPill         = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium text-ink-soft transition-colors hover:text-ink hover:bg-mist';
export const navPillActive   = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold text-white bg-ink transition-colors';
export const navPillActiveAccent = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold text-accent-text bg-accent transition-colors';

/* ── 12. Table patterns ─────────────────────────────────────────── */

export const tableBase       = 'w-full';
export const tableTh         = 'px-3 py-2.5 text-left text-[10px] font-semibold text-ink-faint uppercase tracking-widest whitespace-nowrap';
export const tableTd         = 'px-3 py-3 text-sm text-ink';
export const tableTr         = 'border-b border-border/50 last:border-0 hover:bg-mist transition-colors';
export const tableTrLast     = 'hover:bg-mist transition-colors';

/* ── 13. Result / answer surfaces ─────────────────────────────────
 * Used by FAQ result cards, search result cards, answer panels. */

export const resultCardCollapsed = 'border border-border/70 bg-card/80 hover:bg-cream rounded-2xl transition-all duration-300 overflow-hidden';
export const resultCardExpanded  = 'border border-accent/30 bg-cream rounded-2xl transition-all duration-300 overflow-hidden';

export const resultMetaSource    = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-mist text-ink-soft font-semibold uppercase tracking-wider';
export const resultMetaCategory  = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent-light text-accent font-semibold uppercase tracking-wider';

export const resultBody          = 'mt-1.5 text-xs text-ink-soft leading-relaxed line-clamp-2';
export const resultTitle         = 'text-sm font-semibold text-ink leading-snug';

export const resultHeaderFaq     = 'rounded-xl bg-accent-light border border-accent/15 p-4';
export const resultHeaderCommunity = 'rounded-xl bg-success-light border border-success/15 p-4';

export const resultFaqLabel      = 'text-[11px] font-semibold text-accent mb-2 uppercase tracking-wide';
export const resultCommunityLabel = 'text-[11px] font-semibold text-success mb-2 uppercase tracking-wide';

export const resultBodyFaq       = 'text-sm text-ink/75 leading-relaxed whitespace-pre-wrap';
export const resultBodyFaqShort  = 'text-sm text-ink/75 leading-relaxed';
export const resultBodyCommunity = 'text-sm text-ink/70 leading-relaxed';

/* ── 14. Vote / feedback pills ────────────────────────────────────
 * Round pill buttons for "Was this helpful?" style votes. */

export const votePillBase       = 'inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full border transition-all duration-200 disabled:cursor-default';
export const voteUp             = 'border-accent/40 bg-accent-light text-accent';
export const voteDown           = 'border-danger/40 bg-danger-light text-danger';
export const voteUpIdle         = 'border-border text-ink-faint hover:border-accent/40 hover:text-accent';
export const voteDownIdle       = 'border-border text-ink-faint hover:border-danger/40 hover:text-danger';

/* ── 15. Suggestion / inline form ────────────────────────────────
 * Used inside ResultItem for "Suggest better answer" forms. */

export const suggestForm         = 'mt-3 bg-mist/60 border border-border/70 rounded-2xl p-4 space-y-3 animate-fade-in';
export const suggestLabel        = 'text-xs font-semibold text-ink';
export const suggestTextarea     = 'w-full text-xs p-3 rounded-xl border border-border bg-card focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y';
export const suggestError        = 'text-[11px] text-danger';
export const suggestSuccess      = 'text-[11px] text-success';

export const suggestBtnCancel    = 'px-3 py-1.5 rounded-full border border-border bg-card text-[11px] font-semibold text-ink-soft hover:bg-cream transition-colors';
export const suggestBtnSubmit    = 'px-4 py-1.5 rounded-full bg-accent text-accent-text text-[11px] font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50';

/* ── 16. Suggestion CTA (link-style) ───────────────────────────── */

export const suggestCta         = 'inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-accent transition-colors';
export const suggestCtaAccent    = 'inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-dark hover:underline transition-colors';
export const suggestCtaFaint     = 'inline-flex items-center gap-1 text-xs text-ink-faint hover:text-ink-soft transition-colors';

/* ── 17. Confidence tag (search results) ─────────────────────────
 * The "High/Medium/Low Confidence" pill on each search result. */

export const confidencePill       = 'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold';
export const confidenceHigh       = 'bg-success-light text-success';
export const confidenceMedium     = 'bg-warning-light text-warning';
export const confidenceLow        = 'bg-mist text-ink-faint';

/* ── 18. Search bar input variants ─────────────────────────────────
 * The two input styles used inside SearchBar.tsx — the "default"
 * large hero search and the "compact" navbar search. Both kept
 * theme-token-driven so they re-skin with the rest of the UI. */

export const searchInputDefault = 'w-full pl-12 pr-32 py-5 sm:py-[22px] rounded-[26px] border border-border bg-card text-sm sm:text-base text-ink placeholder-ink-faint focus:outline-none focus:border-accent focus:bg-card transition-all duration-300 shadow-[0_14px_34px_rgba(31,41,51,0.07)]';
export const searchInputCompact = 'w-full bg-mist border border-border/60 text-ink text-sm rounded-[14px] pl-10 pr-3 py-1.5 outline-none focus:bg-card focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all placeholder-ink-faint';

/* ── 19. Search bar suggestion list item ────────────────────────── */

export const searchSuggestionItem = 'w-full text-left px-5 py-3.5 text-sm text-ink hover:bg-cream/60 transition-colors duration-150 border-b border-border/30 last:border-0 flex items-center gap-3';
