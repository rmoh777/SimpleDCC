# DocketCC Current Architecture

## Overview
DocketCC is a SvelteKit-based FCC docket monitoring service deployed on Cloudflare Pages with D1 database. The application provides subscription management for FCC docket notifications with an admin dashboard for system management.

## Technology Stack & Configuration

### Core Framework
- **SvelteKit**: Primary framework with TypeScript support
- **Vite**: Build tool and development server
- **Svelte 5**: Latest version with new runes API

### Deployment & Infrastructure
- **Cloudflare Pages**: Static site deployment
- **Cloudflare D1**: SQLite database (serverless)
- **Cloudflare Workers**: Serverless API endpoints
- **Email Service**: Integrated via Cloudflare (Resend/similar)

### Development Tools
- **TypeScript**: Type safety across the application
- **Prettier**: Code formatting
- **Vitest**: Testing framework
- **ESLint**: Code linting

## Current Database Schema

```sql
-- Simple structure with UNIQUE constraint for email/docket pairs
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  docket_number TEXT NOT NULL,  -- Format: "XX-XXX" (e.g., "23-108")
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(email, docket_number)
);
```

**Key Constraints:**
- Email normalized to lowercase for consistency
- Docket format validation: `/^\d{1,3}-\d{1,3}$/`
- Unique email/docket combinations prevent duplicates

## Current Application Structure

### Page Routes
```
src/routes/
├── +page.svelte              # Landing page (current tab-based design)
├── admin/
│   ├── +layout.svelte        # Admin layout with navigation
│   ├── +page.svelte          # Admin dashboard with stats
│   ├── login/+page.svelte    # Admin authentication
│   └── subscriptions/+page.svelte # Subscription management
└── api/                      # Server-side API endpoints
    ├── subscribe/+server.ts  # POST: create, GET: retrieve subscriptions
    ├── unsubscribe/+server.ts # POST: remove subscriptions
    ├── debug/+server.ts      # Development debugging
    └── admin/                # Admin-only endpoints
        ├── auth/             # Authentication endpoints
        ├── stats/+server.js  # Dashboard statistics
        ├── subscriptions/    # Admin subscription management
        └── trigger/          # Manual system triggers
```

### Component Architecture

#### Current UI Components
```
src/lib/components/
├── SubscribeForm.svelte      # Email + docket subscription form
│   ├── Real-time validation (email format, docket format)
│   ├── Loading states and error handling
│   ├── Success/error message display
│   └── Form reset on successful submission
│
└── ManageSubscriptions.svelte # Email-based subscription lookup/management
    ├── Email validation and subscription retrieval
    ├── Subscription list display with formatted dates
    ├── Individual unsubscribe functionality
    └── Confirmation dialogs for deletion
```

#### API Integration Layer
```typescript
// src/lib/api.ts - Centralized API functions
interface Subscription {
  id: number;
  docket_number: string;
  created_at: number;
}

// Core API functions used by components
- subscribe(email, docket_number): Promise<{data, status}>
- unsubscribe(email, docket_number): Promise<{data, status}>
- getSubscriptions(email): Promise<{data, status}>
```

## Current UI/UX Design

### Landing Page (src/routes/+page.svelte)
**Current State:** Tab-based interface combining landing page and functionality
- **Header**: Logo + navigation (Dashboard, About, Pricing)
- **Hero Section**: Title, subtitle, value proposition
- **Tab Navigation**: Toggle between "Add Subscription" and "Manage Subscriptions"
- **Features Grid**: 3-column feature showcase
- **Footer**: Multi-column with links and company info

**Styling Approach:**
- Custom CSS with CSS-in-JS style approach
- Responsive design with mobile considerations
- Color scheme: Blues (#007cba) and grays
- Clean, professional government-appropriate aesthetic

### Admin Dashboard
**Current State:** Tailwind-styled admin interface
- **Stats Cards**: Total subscriptions, active dockets, system health
- **Quick Actions**: Manual check trigger
- **Recent Logs**: Activity monitoring
- **Top Dockets**: Popular docket tracking

## New Design Analysis (UIrefresh folder)

### Design System Direction
Based on the HTML designs in `UIrefresh/`, the new direction includes:

#### Visual Identity
- **Primary Brand Color**: Emerald green (#10b981) - major shift from blue
- **Secondary**: Dark navy (#0f172a) for text and backgrounds
- **Background**: Gradient from dark navy to slate
- **Typography**: System fonts with -apple-system stack

#### Logo Evolution
```html
<!-- New logo structure -->
<div class="logo-graphic">
  <div class="icon">📊</div> <!-- Emerald gradient background -->
  <div class="text">Docket<span class="cc">CC</span></div>
</div>
```

#### Layout Patterns
1. **Government Banner**: Professional authority messaging
2. **Glassmorphism Headers**: Frosted glass effect with backdrop-filter
3. **Card-Based Design**: Rounded corners, subtle shadows
4. **Apple-Inspired Dashboard**: Clean card grid system

### New Page Designs

#### 1. Landing Page (`docketcc_clean_page (1).html`)
- **Government Authority Header**: Professional credibility
- **Hero Section**: Split layout with content + search card
- **Glassmorphism Search Card**: Modern government form styling
- **Features Section**: Enhanced with better iconography

#### 2. User Dashboard (`dashboard_apple.html`)
- **Apple-Style Layout**: Clean card grid system
- **Progressive Enhancement**: Hover effects and animations
- **User-Centric**: Email management, plan status, subscription overview
- **Recent Filings**: Activity tracking for users

#### 3. Pricing Page (`docketcc_pricing_page (1).html`)
- **Professional Pricing Cards**: Government service presentation
- **Feature Comparison**: Clear plan differentiation
- **Authority Messaging**: Enterprise/government focus

#### 4. Style Guide (`docketcc_style_guide.html`)
- **Logo Variations**: Different sizes and contexts
- **Color System**: Comprehensive palette with emerald focus
- **Component Standards**: Consistent design language

## Current API Endpoints

### Public Endpoints
```typescript
// Subscription Management
POST /api/subscribe
  - Body: { email, docket_number }
  - Returns: 201 success, 409 duplicate, 400 validation error
  - Sends welcome email on success

GET /api/subscribe?email={email}
  - Returns: { subscriptions: Subscription[], count: number }

POST /api/unsubscribe
  - Body: { email, docket_number }
  - Returns: 200 success, 404 not found
```

### Admin Endpoints (Protected)
```typescript
// Authentication
POST /api/admin/auth/login - Admin login
POST /api/admin/auth/logout - Session cleanup  
GET /api/admin/auth/check - Session validation

// System Management
GET /api/admin/stats - Dashboard statistics
GET /api/admin/subscriptions - All subscriptions with pagination
POST /api/admin/trigger/manual-check - Trigger system checks
```

## Email System

### Welcome Email Template
- **Professional Design**: Government-appropriate styling
- **Clear Information**: Subscription confirmation, next steps
- **Unsubscribe Link**: Direct docket-specific removal
- **Brand Consistency**: DocketCC branding and messaging

### Email Service Integration
- **Cloudflare Integration**: Uses environment variables for API keys
- **Error Handling**: Non-blocking - subscription succeeds even if email fails
- **Template System**: HTML + text versions for compatibility

## Current Constraints & Considerations

### Functional Requirements (DO NOT CHANGE)
1. **Database Schema**: Must remain unchanged
2. **API Endpoints**: All existing endpoints must work exactly as before
3. **Admin Functionality**: Full preservation required
4. **Email System**: Current email logic must continue working
5. **Validation Logic**: Email/docket validation patterns must be maintained

### Performance Requirements
- **Bundle Size**: Currently minimal, must stay efficient
- **Cloudflare D1**: All database queries optimized for serverless
- **Mobile Performance**: Responsive design required
- **Government Standards**: Professional loading times expected

### Security Considerations
- **Admin Authentication**: bcryptjs for password hashing
- **Input Validation**: Email and docket format enforcement
- **Environment Variables**: Secure API key management
- **CORS**: Proper origin handling for API endpoints

## Migration Priorities

### Phase 1: Foundation (Immediate)
- Establish new design system with emerald color scheme
- Create reusable UI components matching new designs
- Set up CSS custom properties for design tokens
- Maintain all existing functionality during transition

### Phase 2: Landing Page (High Priority)
- Replace current tab-based landing with new hero + search card design
- Implement glassmorphism styling and government header
- Enhance existing SubscribeForm with new visual design
- Preserve all current form validation and API integration

### Phase 3: User Dashboard (High Priority)  
- Create new user dashboard separate from admin
- Apple-style card layout for subscription management
- Enhanced ManageSubscriptions component with new styling
- User activity and recent filings display

### Phase 4: Pricing & Navigation (Medium Priority)
- Implement pricing page with professional government presentation
- Unified site navigation with new header design
- Consistent footer across all pages
- Mobile-responsive navigation patterns

## Development Guidelines

### CSS Architecture
- **Design Tokens**: CSS custom properties for consistent theming
- **Component Scoping**: Svelte's scoped styling for isolation
- **Mobile First**: Responsive design starting with mobile breakpoints
- **Performance**: Minimal CSS bundle, avoid unused styles

### Component Development
- **TypeScript**: Maintain type safety for all new components
- **Props API**: Consistent interfaces across design system
- **Accessibility**: WCAG 2.1 AA compliance required
- **Testing**: Unit tests for complex component logic

### Integration Points
- **No Breaking Changes**: All existing components must continue working
- **API Compatibility**: No changes to request/response formats
- **Environment Parity**: Work in both development and production (Cloudflare)
- **Admin Preservation**: Full admin functionality must remain intact

This architecture serves as the foundation for our migration work. All development should reference this document to ensure we maintain system integrity while implementing the modern design system. 