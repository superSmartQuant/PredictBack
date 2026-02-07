# TradingView × Magic Eden Design System
## Dark Data Aesthetics Meets Japanese Pink Elegance

---

## 🎨 Design Philosophy

This design system merges the **precision and depth of TradingView's dark trading interface** with the **soft, elegant Japanese pink aesthetic of Magic Eden**. The result is a sophisticated, data-rich environment that feels both professional and approachable, technical yet beautiful.

### Core Principles
1. **Dark Foundation, Pink Accents** - Deep charcoal/black base with strategic pink highlights
2. **Data Clarity First** - Information hierarchy always takes precedence
3. **Elegant Contrast** - Soft pinks against hard technical elements create memorable juxtaposition
4. **Japanese Minimalism** - Clean layouts with intentional negative space
5. **Professional Warmth** - Trading-floor precision softened by organic color warmth

---

## 🎭 Aesthetic Identity

**Primary Vibe**: *Neo-Tokyo Trading Floor*  
A late-night Tokyo trading desk where cherry blossoms meet candlestick charts. Think neon-lit Shibuya crossing data terminals with sakura-inspired accent lighting.

**Differentiation Factor**: The unexpected warmth of Japanese pink in a traditionally cold, blue/green trading environment creates instant memorability.

---

## 🌈 Color Palette

### Foundation Colors
```css
:root {
  /* Dark Base (TradingView inspired) */
  --bg-primary: #0D0E12;           /* Deep space black */
  --bg-secondary: #161823;         /* Card/panel background */
  --bg-tertiary: #1E202E;          /* Elevated surfaces */
  --bg-elevated: #252836;          /* Hover/active states */
  
  /* Japanese Pink Spectrum (Magic Eden inspired) */
  --pink-50: #FFF5F7;              /* Lightest pink, text on dark */
  --pink-100: #FFE4EC;             /* Subtle backgrounds */
  --pink-200: #FFC7D9;             /* Borders, dividers */
  --pink-300: #FF9AB8;             /* Icons, secondary elements */
  --pink-400: #FF6B9D;             /* Primary interactive elements */
  --pink-500: #FF4785;             /* Main brand pink */
  --pink-600: #E63D75;             /* Hover states */
  --pink-700: #C73066;             /* Active/pressed */
  --pink-800: #A02553;             /* Dark accent */
  --pink-900: #7A1D41;             /* Deepest pink */
  
  /* Data Visualization (TradingView palette) */
  --bullish-green: #26A69A;        /* Positive/up */
  --bearish-red: #EF5350;          /* Negative/down */
  --neutral-gray: #787B86;         /* Flat/neutral */
  
  /* Functional Colors */
  --text-primary: #E8E9ED;         /* Main text */
  --text-secondary: #B2B5BE;       /* Secondary text */
  --text-tertiary: #787B86;        /* Muted text */
  --border: #2A2D3A;               /* Subtle borders */
  --border-pink: rgba(255, 71, 133, 0.15); /* Pink borders */
}
```

### Color Usage Guidelines
- **Backgrounds**: Use dark foundation colors exclusively
- **Primary Actions**: Pink-500 to Pink-600 range
- **Data Points**: Green for up, Red for down, Gray for neutral
- **Highlights**: Pink-400 for important interactive elements
- **Accents**: Pink gradients for premium/special features
- **Borders**: Mix of dark borders (2A2D3A) with occasional pink borders for emphasis

---

## 📝 Typography

### Font Families

```css
:root {
  /* Display/Headers - Bold, Technical */
  --font-display: 'Chakra Petch', 'Rajdhani', -apple-system, sans-serif;
  
  /* Body/Data - Clean, Readable */
  --font-body: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Monospace/Numbers - Technical Precision */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Roboto Mono', monospace;
  
  /* Accent/Japanese Elements */
  --font-accent: 'Noto Sans JP', sans-serif;
}
```

### Font Hierarchy

**Display Text** (Headings, Hero)
- Font: Chakra Petch (geometric, technical, slightly futuristic)
- Weight: 600-700
- Color: Pink-50 to Pink-100
- Use for: Page titles, section headers, primary CTAs

**Body Text** (Paragraphs, Descriptions)
- Font: IBM Plex Sans (professional, highly readable)
- Weight: 400-500
- Color: Text-secondary (#B2B5BE)
- Use for: Content blocks, descriptions, labels

**Data/Numbers** (Metrics, Prices, Stats)
- Font: JetBrains Mono (tabular nums, technical)
- Weight: 500-600
- Color: Text-primary (#E8E9ED) or Pink-400 for highlights
- Use for: Charts, tables, numerical data, prices

**Accent Text** (Japanese elements, special labels)
- Font: Noto Sans JP
- Weight: 400-500
- Color: Pink-300 to Pink-400
- Use for: Badges, tags, decorative elements

### Type Scale
```css
--text-xs: 0.75rem;    /* 12px - Micro labels */
--text-sm: 0.875rem;   /* 14px - Secondary text */
--text-base: 1rem;     /* 16px - Body text */
--text-lg: 1.125rem;   /* 18px - Emphasized body */
--text-xl: 1.25rem;    /* 20px - Small headings */
--text-2xl: 1.5rem;    /* 24px - Section headers */
--text-3xl: 1.875rem;  /* 30px - Page titles */
--text-4xl: 2.25rem;   /* 36px - Hero text */
--text-5xl: 3rem;      /* 48px - Display text */
```

---

## 🏗️ Layout & Spacing

### Grid System
- **Base unit**: 4px (0.25rem)
- **Common spacing**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- **Desktop breakpoints**: 1920px (XL), 1440px (L), 1024px (M)
- **Mobile breakpoints**: 768px (tablet), 640px (mobile)

### Container Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### Layout Patterns

**Trading Layout** (TradingView style)
- Full-bleed charts and graphs
- Sidebar navigation (240-280px)
- Top bar for quick actions (60-72px)
- Bottom status bar (32-40px)

**Card-Based Layout** (Magic Eden style)
- Card grids: gap of 16-24px
- Card padding: 20-24px
- Border radius: 8-12px
- Subtle shadows with pink tint

**Data Tables**
- Row height: 40-48px
- Cell padding: 12px 16px
- Sticky headers
- Alternating row backgrounds (very subtle)

---

## 🎨 Component Patterns

### Buttons

**Primary Button** (Call-to-action)
```css
background: linear-gradient(135deg, #FF4785 0%, #E63D75 100%);
padding: 12px 24px;
border-radius: 8px;
font: var(--font-display);
font-weight: 600;
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
box-shadow: 0 4px 12px rgba(255, 71, 133, 0.25);

/* Hover */
transform: translateY(-2px);
box-shadow: 0 6px 20px rgba(255, 71, 133, 0.35);
```

**Secondary Button** (Less emphasis)
```css
background: var(--bg-tertiary);
border: 1px solid var(--border-pink);
color: var(--pink-400);

/* Hover */
background: rgba(255, 71, 133, 0.1);
border-color: var(--pink-400);
```

**Ghost Button** (Minimal)
```css
background: transparent;
color: var(--text-secondary);
border: 1px solid var(--border);

/* Hover */
color: var(--pink-400);
border-color: var(--border-pink);
```

### Cards

**Standard Card**
```css
background: var(--bg-secondary);
border: 1px solid var(--border);
border-radius: 12px;
padding: 24px;
transition: all 0.3s ease;

/* Hover */
border-color: var(--border-pink);
box-shadow: 0 8px 24px rgba(255, 71, 133, 0.08);
transform: translateY(-4px);
```

**Featured Card** (Pink accent)
```css
background: linear-gradient(135deg, 
  rgba(255, 71, 133, 0.05) 0%, 
  rgba(255, 71, 133, 0.02) 100%);
border: 1px solid var(--border-pink);
position: relative;

/* Pink glow effect */
&::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 12px;
  padding: 1px;
  background: linear-gradient(135deg, var(--pink-500), var(--pink-700));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, 
                linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  opacity: 0.5;
}
```

### Charts & Data Visualization

**Chart Container**
```css
background: var(--bg-primary);
border-radius: 8px;
padding: 16px;
border: 1px solid var(--border);

/* Chart colors */
--chart-grid: rgba(255, 255, 255, 0.05);
--chart-axis: var(--text-tertiary);
--chart-line-pink: var(--pink-400);
--chart-area-pink: rgba(255, 71, 133, 0.2);
```

**Data Points**
- Use pink for primary data series
- Use green/red for financial up/down
- Use gray for secondary/inactive data
- Add subtle glow to active points

### Input Fields

**Text Input**
```css
background: var(--bg-tertiary);
border: 1px solid var(--border);
border-radius: 8px;
padding: 12px 16px;
color: var(--text-primary);
font-family: var(--font-body);

/* Focus */
border-color: var(--pink-400);
box-shadow: 0 0 0 3px rgba(255, 71, 133, 0.15);
outline: none;
```

**Select/Dropdown**
```css
/* Same as text input + dropdown icon */
background-image: url("data:image/svg+xml,..."); /* Pink caret */
```

### Navigation

**Sidebar Navigation**
```css
background: var(--bg-secondary);
border-right: 1px solid var(--border);

/* Nav items */
padding: 12px 16px;
border-radius: 8px;
transition: all 0.2s ease;

/* Active state */
background: rgba(255, 71, 133, 0.1);
color: var(--pink-400);
border-left: 3px solid var(--pink-500);
```

**Top Navigation**
```css
background: rgba(13, 14, 18, 0.95);
backdrop-filter: blur(12px);
border-bottom: 1px solid var(--border);
```

### Badges & Tags

**Status Badge**
```css
background: rgba(255, 71, 133, 0.15);
color: var(--pink-400);
padding: 4px 12px;
border-radius: 24px;
font-size: var(--text-xs);
font-weight: 600;
font-family: var(--font-display);
letter-spacing: 0.5px;
text-transform: uppercase;
```

---

## ✨ Visual Effects & Motion

### Animations

**Page Load**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger children */
.stagger-container > * {
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

.stagger-container > *:nth-child(1) { animation-delay: 0.1s; }
.stagger-container > *:nth-child(2) { animation-delay: 0.2s; }
.stagger-container > *:nth-child(3) { animation-delay: 0.3s; }
```

**Hover Glow**
```css
.glow-on-hover {
  transition: all 0.3s ease;
}

.glow-on-hover:hover {
  box-shadow: 
    0 0 20px rgba(255, 71, 133, 0.3),
    0 0 40px rgba(255, 71, 133, 0.1);
}
```

**Pulse Effect** (for live data)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.live-indicator {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Micro-interactions
- **Button Press**: Scale down to 0.98 on active
- **Card Hover**: Lift 4px with pink shadow
- **Input Focus**: Pink border glow (3px shadow)
- **Toggle Switch**: Slide with bounce easing
- **Loading States**: Subtle shimmer with pink tint

### Transitions
```css
/* Standard easing */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-sharp: cubic-bezier(0.4, 0, 0.6, 1);

/* Duration */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

---

## 🌸 Japanese-Inspired Elements

### Sakura Accents
Use subtle cherry blossom motifs:
- Background patterns (very low opacity, ~3-5%)
- Decorative corner elements
- Loading animations
- Success state celebrations

**SVG Pattern Example**
```css
background-image: url("data:image/svg+xml,..."); /* Sakura pattern */
opacity: 0.03;
```

### Geometric Patterns
Inspired by traditional Japanese lattice work:
- Hexagonal grids
- Diagonal line patterns
- Kumiko-inspired borders

### Gradient Meshes
Soft, organic gradients reminiscent of Japanese watercolors:
```css
background: radial-gradient(
  ellipse at top right,
  rgba(255, 71, 133, 0.15) 0%,
  transparent 50%
);
```

---

## 📊 Data Visualization Guidelines

### Chart Styling
- **Background**: Deep dark (--bg-primary)
- **Grid lines**: Subtle white (5% opacity)
- **Primary line**: Pink-400 with glow
- **Area fill**: Pink gradient (20% to 5% opacity)
- **Axis labels**: Text-tertiary
- **Tooltip**: bg-secondary with pink border

### Color Mapping
- **Positive trends**: Gradient from pink-400 to bullish-green
- **Negative trends**: Pink-400 to bearish-red
- **Neutral**: Gray with pink accents
- **Volume bars**: Low opacity pink (15-30%)

### Interactive Elements
- Crosshair: Pink-400
- Tooltips: Dark background, pink border, white text
- Hover states: Brighten by 20%
- Selection: Pink overlay at 15% opacity

---

## 🎯 Component Library Essentials

### Must-Have Components
1. **Trading Chart** - Full-featured candlestick/line chart with pink accents
2. **Data Table** - Sortable, filterable, with pink highlights
3. **Stat Cards** - Key metrics with sparklines
4. **Price Ticker** - Live updating prices with color coding
5. **Order Book** - Depth chart with pink/green visualization
6. **Navigation Sidebar** - Collapsible with pink active states
7. **Modal/Dialog** - Dark with pink CTA buttons
8. **Toast Notifications** - Success (pink), Error (red), Info (gray)
9. **Search Bar** - With pink focus state
10. **Dropdown Select** - Dark themed with pink highlights

### State Patterns
- **Loading**: Skeleton screens with pink shimmer
- **Empty State**: Centered illustration with pink accent
- **Error**: Red with option to retry (pink button)
- **Success**: Green checkmark with pink celebration effect

---

## 📱 Responsive Considerations

### Mobile Adaptations
- Reduce pink intensity slightly on mobile (better battery)
- Simplify charts to essential data
- Bottom navigation with pink active indicator
- Swipeable cards with momentum
- Larger touch targets (min 44px)

### Desktop Enhancements
- Multi-column layouts
- Hover states with pink glows
- Keyboard shortcuts (show with pink badge)
- Advanced charts with more data layers
- Sidebar always visible

---

## 🚀 Implementation Notes

### Performance
- Use CSS gradients over images when possible
- Lazy load chart libraries
- Debounce pink glow effects
- Use `will-change` sparingly
- Optimize pink shadow rendering

### Accessibility
- Ensure pink text meets WCAG AA contrast (4.5:1)
- Provide colorblind-friendly alternatives for data
- Use aria-labels for icon-only pink buttons
- Keyboard navigation with pink focus indicators
- Screen reader announcements for live data

### Browser Support
- CSS Variables: Modern browsers
- Backdrop-filter: Add fallback solid background
- Custom fonts: Include fallbacks
- Animations: Respect `prefers-reduced-motion`

---

## 🎨 Design Tokens (CSS Variables)

### Full Token Set
```css
:root {
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-pink: 0 8px 24px rgba(255, 71, 133, 0.25);
  
  /* Z-index */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal: 1040;
  --z-popover: 1050;
  --z-tooltip: 1060;
}
```

---

## 🎯 Quick Start Checklist

When building a page with this design system:

- [ ] Start with dark foundation (--bg-primary)
- [ ] Use Chakra Petch for headings
- [ ] Use IBM Plex Sans for body
- [ ] Use JetBrains Mono for data/numbers
- [ ] Apply pink-500 to primary CTAs
- [ ] Add pink borders to featured elements
- [ ] Include subtle pink glow on hover states
- [ ] Use green/red for up/down data
- [ ] Add staggered fade-in animations
- [ ] Include Japanese accent elements sparingly
- [ ] Test contrast ratios
- [ ] Add loading states with pink shimmer
- [ ] Implement responsive breakpoints

---

## 💡 Pro Tips

1. **Balance is Key**: Don't overuse pink - it should accent, not dominate
2. **Data First**: Always prioritize readability of data over aesthetics
3. **Subtle Japanese**: Japanese elements should be whispers, not shouts
4. **Contrast Matters**: Pink pops against dark, but ensure text is readable
5. **Animation Restraint**: Animate intentionally, not everything
6. **Consistency**: Stick to the token system
7. **Test in Dark**: View in actual dark environments, not just dark mode
8. **Pink Variations**: Use the full pink spectrum, not just pink-500

---

## 🔗 Font Loading

```html
<!-- In HTML head -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+JP:wght@400;500&display=swap" rel="stylesheet">
```

---

## 📚 Reference Inspiration

**From TradingView:**
- Deep dark backgrounds
- Technical precision
- Data density
- Grid systems
- Chart sophistication

**From Magic Eden:**
- Japanese pink (#FF4785)
- Soft gradients
- Elegant spacing
- Premium feel
- Playful yet professional

**Unique Fusion:**
- Neo-Tokyo cyberpunk vibes
- Sakura-lit trading floors
- Technical elegance
- Data with warmth
- Professional playfulness

---

*This design system creates interfaces that are simultaneously professional and approachable, technical and beautiful, dark and warm. Use it to build trading platforms, dashboards, analytics tools, or any data-rich application that needs personality and polish.*