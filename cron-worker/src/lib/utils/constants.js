// Design System Constants
export const COLORS = {
  primary: '#10b981',
  primaryHover: '#059669',
  primaryLight: '#a7f3d0',
  secondary: '#0f172a',
  secondaryHover: '#1e293b',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e5e7eb',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af'
};

export const SPACING = {
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem',
  '2xl': '4rem',
  '3xl': '6rem'
};

export const FONT_SIZES = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem'
};

export const FONT_WEIGHTS = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900
};

export const BORDER_RADIUS = {
  default: '8px',
  lg: '16px',
  xl: '24px'
};

export const SHADOWS = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
};

export const TRANSITIONS = {
  fast: '0.15s ease',
  normal: '0.3s ease',
  slow: '0.5s ease'
};

// Application Constants
export const APP_CONFIG = {
  name: 'DocketCC',
  description: 'Professional FCC Docket Monitoring & AI Intelligence',
  url: 'https://docketcc.com',
  supportEmail: 'support@docketcc.com',
  maxDocketsFreePlan: 3,
  freePlanPrice: 0,
  proPlanPrice: 49,
  trialDays: 14
};

export const API_ENDPOINTS = {
  subscribe: '/api/subscribe',
  unsubscribe: '/api/unsubscribe',
  manage: '/api/manage',
  adminStats: '/api/admin/stats',
  adminLogin: '/api/admin/auth/login'
};

export const ROUTES = {
  home: '/',
  pricing: '/pricing',
  contact: '/contact',
  about: '/about',
  admin: '/admin',
  adminLogin: '/admin/login'
}; 