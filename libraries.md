# 📚 Psyduck Learning Platform - Libraries & Dependencies

## Overview

This document provides a comprehensive overview of all libraries, dependencies, and third-party packages used in the Psyduck Learning Platform. Each library is categorized by its purpose and includes information about version requirements, usage, and integration details.

## 🎯 Core Framework & Language

### React Ecosystem
- **React 18** - Latest React with concurrent features, Suspense, and automatic batching
- **React DOM 18** - DOM-specific methods for React 18
- **TypeScript** - Full type safety throughout the application with strict configuration

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.0.0",
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0"
}
```

## 🎨 Styling & UI Framework

### Tailwind CSS v4
- **@tailwindcss/vite** - Tailwind CSS v4 with Vite integration
- **tailwindcss** - Core Tailwind CSS framework
- **autoprefixer** - CSS vendor prefixing

```json
{
  "@tailwindcss/vite": "^4.0.0-alpha.15",
  "tailwindcss": "^4.0.0-alpha.15",
  "autoprefixer": "^10.4.0"
}
```

## 🧩 UI Component Library

### ShadCN UI Components
Complete component library based on Radix UI primitives for accessibility and functionality.

### Core Radix Primitives
```json
{
  "@radix-ui/react-accordion": "^1.1.2",
  "@radix-ui/react-alert-dialog": "^1.0.5",
  "@radix-ui/react-aspect-ratio": "^1.0.3",
  "@radix-ui/react-avatar": "^1.0.4",
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-collapsible": "^1.0.3",
  "@radix-ui/react-context-menu": "^2.1.5",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-hover-card": "^1.0.7",
  "@radix-ui/react-menubar": "^1.0.4",
  "@radix-ui/react-navigation-menu": "^1.1.4",
  "@radix-ui/react-popover": "^1.0.7",
  "@radix-ui/react-progress": "^1.0.3",
  "@radix-ui/react-radio-group": "^1.1.3",
  "@radix-ui/react-scroll-area": "^1.0.5",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-separator": "^1.0.3",
  "@radix-ui/react-slider": "^1.1.2",
  "@radix-ui/react-switch": "^1.0.3",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-toggle": "^1.0.3",
  "@radix-ui/react-toggle-group": "^1.0.4",
  "@radix-ui/react-tooltip": "^1.0.7"
}
```

## 💻 Code Editor & IDE

### Monaco Editor
- **CodeMirror 6** - Modular code editor with language packages

```json
{
  "@codemirror/state": "^6.x",
  "@codemirror/view": "^6.x"
}
```

**Language Support:** JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, Ruby, and more.

## 📊 Data Fetching & State Management

### React Query (TanStack Query)
- **@tanstack/react-query** - Powerful data fetching, caching, and synchronization
- **@tanstack/react-query-devtools** - Development tools for debugging queries

```json
{
  "@tanstack/react-query": "^5.0.0",
  "@tanstack/react-query-devtools": "^5.0.0"
}
```

## 🔄 Real-Time Communication

### Socket.IO
- **socket.io-client** - Real-time bidirectional event-based communication

```json
{
  "socket.io-client": "^4.7.0"
}
```

## 🎮 Animation & Motion

### Motion (Framer Motion)
- **motion/react** - Production-ready motion library for React

```json
{
  "motion": "^10.16.0"
}
```

**Usage:** Import as `import { motion } from 'motion/react'` for animations and gestures.

## 🎨 Icons & Graphics

### Lucide React
- **lucide-react** - Beautiful and customizable SVG icons

```json
{
  "lucide-react": "^0.400.0"
}
```

**Features:** 1000+ icons, tree-shakable, customizable size and color.

## 📊 Charts & Data Visualization

### Recharts
- **recharts** - Composable charting library built with React and D3

```json
{
  "recharts": "^2.8.0"
}
```

**Chart Types:** Line, Bar, Area, Pie, Radar, Scatter, and more.

## 🎛️ Form Management

### React Hook Form
- **react-hook-form@7.55.0** - Performant forms with minimal re-renders

```json
{
  "react-hook-form": "7.55.0"
}
```

**Note:** Specific version required for compatibility.

### Form Validation
- **zod** - TypeScript-first schema validation
- **@hookform/resolvers** - Validation resolvers for React Hook Form

```json
{
  "zod": "^3.22.0",
  "@hookform/resolvers": "^3.3.0"
}
```

## 🔧 Utility Libraries

### Class Management
- **clsx** - Utility for constructing className strings conditionally
- **tailwind-merge** - Merge Tailwind CSS classes without style conflicts

```json
{
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

### Date Handling
- **date-fns** - Modern JavaScript date utility library

```json
{
  "date-fns": "^2.30.0"
}
```

### Notifications
- **sonner@2.0.3** - Toast notification library

```json
{
  "sonner": "2.0.3"
}
```

**Usage:** `import { toast } from "sonner@2.0.3"`

## 🎪 Interactive Components

### Carousels & Sliders
- **react-slick** - Carousel component for React
- **slick-carousel** - CSS for react-slick

```json
{
  "react-slick": "^0.29.0",
  "slick-carousel": "^1.8.1"
}
```

### Masonry Layouts
- **react-responsive-masonry** - Responsive masonry grid

```json
{
  "react-responsive-masonry": "^2.1.7"
}
```

### Drag and Drop
- **react-dnd** - Drag and drop for React
- **react-dnd-html5-backend** - HTML5 backend for react-dnd

```json
{
  "react-dnd": "^16.0.1",
  "react-dnd-html5-backend": "^16.0.1"
}
```

### Resizable Components
- **re-resizable** - Resizable component for React

```json
{
  "re-resizable": "^6.9.11"
}
```

**Note:** Use instead of `react-resizable` which doesn't work in this environment.

### Virtual Scrolling
- **react-window** - Efficiently render large lists and tabular data

```json
{
  "react-window": "^1.8.8"
}
```

## 🔧 Development Tools

### TypeScript Types
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "@types/react-slick": "^0.23.0"
}
```

### Build Tools
- **Vite** - Next generation frontend tooling
- **@vitejs/plugin-react** - React plugin for Vite

```json
{
  "vite": "^5.0.0",
  "@vitejs/plugin-react": "^4.0.0"
}
```

## 📦 Key Features by Library

### Monaco Editor Integration
- **Syntax Highlighting** - Multi-language support
- **Auto-completion** - IntelliSense-like features  
- **Error Detection** - Real-time syntax checking
- **Theme Support** - Dark/light themes
- **Custom Languages** - Extensible language support

### React Query Features
- **Caching** - Intelligent background refetching
- **Optimistic Updates** - Immediate UI feedback
- **Error Handling** - Automatic retry and error boundaries
- **Offline Support** - Works without network connection
- **DevTools** - Powerful debugging capabilities

### ShadCN UI Benefits
- **Accessibility** - WCAG compliant components
- **Customization** - Fully customizable styling
- **Type Safety** - Full TypeScript support
- **Tree Shaking** - Import only what you need
- **Modern Design** - Clean, professional appearance

### Socket.IO Capabilities
- **Real-time Updates** - Instant data synchronization
- **Room Management** - Project-based communication
- **Automatic Reconnection** - Handles network interruptions
- **Event-based** - Clean pub/sub architecture
- **Fallback Support** - Works with older browsers

## 🔒 Security & Performance

### Security Features
- **XSS Protection** - Input sanitization
- **CSRF Prevention** - Token-based protection
- **Content Security Policy** - Header-based security
- **Dependency Scanning** - Regular security audits

### Performance Optimizations
- **Code Splitting** - Route-based lazy loading
- **Tree Shaking** - Dead code elimination
- **Bundle Analysis** - Size monitoring
- **Caching** - Aggressive caching strategies
- **Compression** - Gzip/Brotli compression

## 📱 Mobile & Responsive

### Mobile Features
- **Touch Events** - Native touch support
- **Responsive Design** - Mobile-first approach
- **PWA Support** - Progressive web app features
- **Offline Functionality** - Service worker integration

### Browser Compatibility
- **Modern Browsers** - Chrome 88+, Firefox 84+, Safari 14+, Edge 88+
- **Mobile Browsers** - iOS Safari 14+, Chrome Android 88+
- **Feature Detection** - Graceful degradation
- **Polyfills** - Legacy browser support

## 🧪 Testing & Quality

### Testing Libraries
- **Jest** - JavaScript testing framework
- **React Testing Library** - Simple React component testing
- **@testing-library/jest-dom** - Custom Jest matchers

```json
{
  "jest": "^29.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0"
}
```

### Code Quality
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Husky** - Git hooks for quality gates

## 🚀 Deployment & Production

### Build Optimization
- **Vite Build** - Fast production builds
- **Asset Optimization** - Image and font optimization
- **Bundle Splitting** - Optimal chunk sizes
- **Source Maps** - Debugging in production

### Performance Monitoring
- **Web Vitals** - Core performance metrics
- **Bundle Analysis** - Size tracking
- **Error Tracking** - Production error monitoring
- **Performance API** - Built-in performance tracking

---

**Library Management by the Psyduck Development Team** 🦆

*Carefully curated for optimal performance and developer experience*