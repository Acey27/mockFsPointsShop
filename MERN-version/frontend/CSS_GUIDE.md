# CSS & Styling Guide

## Overview
This project uses **Tailwind CSS** for styling with a custom design system built on top of it.

## File Structure
- `src/index.css` - Main stylesheet with Tailwind directives and custom components
- `tailwind.config.js` - Tailwind configuration with custom colors and theme
- `postcss.config.js` - PostCSS configuration for processing Tailwind

## VS Code Configuration
The project includes VS Code settings to suppress CSS warnings for Tailwind directives:
- `.vscode/settings.json` - Disables CSS validation for Tailwind directives
- `.vscode/extensions.json` - Recommends Tailwind CSS IntelliSense extension

## CSS Architecture

### Layers
1. **@layer base** - Global base styles and resets
2. **@layer components** - Reusable component classes
3. **@layer utilities** - Custom utility classes

### Component Classes
- `.btn` family - Button variants (primary, secondary, outline, ghost, danger, success)
- `.input` family - Form input styles with validation states
- `.card` family - Card container with header, body, footer
- `.badge` family - Status badges with color variants
- `.spinner` - Loading spinner animation

### Custom Colors
- `brand` - Primary brand colors (blue)
- `success` - Success states (green)
- `warning` - Warning states (yellow)
- `error` - Error states (red)

## Common Issues

### VS Code CSS Warnings
If you see "Unknown at rule @tailwind" or "@apply" warnings:
1. Install the **Tailwind CSS IntelliSense** extension
2. The warnings don't affect functionality - they're just IDE warnings
3. CSS compiles correctly during build process

### IntelliSense Setup
```json
// .vscode/settings.json
{
  "css.validate": false,
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## Usage Examples

### Buttons
```tsx
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<button className="btn-outline">Outline Button</button>
```

### Cards
```tsx
<div className="card">
  <div className="card-header">
    <h3>Card Title</h3>
  </div>
  <div className="card-body">
    Card content goes here
  </div>
</div>
```

### Badges
```tsx
<span className="badge-success">Active</span>
<span className="badge-warning">Pending</span>
<span className="badge-error">Failed</span>
```

## Build Process
The CSS is processed through:
1. **Tailwind CSS** - Generates utility classes and processes custom styles
2. **PostCSS** - Applies autoprefixer and other transformations
3. **Vite** - Bundles and optimizes the final CSS output

All Tailwind directives (`@tailwind`, `@apply`, `@layer`) are compiled away during the build process.
