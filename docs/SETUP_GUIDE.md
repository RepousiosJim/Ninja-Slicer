# Development Setup Guide

## System Updates (December 2024)

This document outlines the updated development environment and tooling for the Monster Slayer project.

## Updated Dependencies

### Core Dependencies
- **Phaser**: ^3.80.1 (Game framework)
- **Supabase**: ^2.46.2 (Backend services)

### Development Dependencies
- **TypeScript**: ^5.7.2 (Latest stable)
- **Vite**: ^5.4.21 (Build tool)
- **ESLint**: ^9.17.0 (Code linting)
- **@typescript-eslint**: ^8.19.1 (TypeScript linting)
- **Prettier**: ^3.4.2 (Code formatting)
- **@types/node**: ^22.10.2 (Type definitions)

## Configuration Files

### TypeScript (tsconfig.json)
- Target: ES2022
- Strict mode enabled
- Path aliases configured for clean imports
- Additional type safety checks enabled

### ESLint (eslint.config.js)
- Modern flat config format (ESLint 9)
- TypeScript support
- Custom rules for code quality
- Auto-fixable issues

### Prettier (.prettierrc)
- Single quotes
- Trailing commas
- 2-space indentation
- 100 character line width

### Vite (vite.config.ts)
- Development server on port 3000
- Hot module replacement
- Path aliases matching tsconfig
- Production build optimizations

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix       # Auto-fix ESLint issues
npm run typecheck       # TypeScript type checking
npm run format         # Format code with Prettier
```

## VSCode Integration

The project includes VSCode settings for:
- Auto-format on save (Prettier)
- Auto-fix ESLint issues on save
- TypeScript workspace SDK
- Proper file associations

## Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   Opens at http://localhost:3000

2. **Write Code**
   - Use path aliases (e.g., `@config/constants`)
   - TypeScript provides type checking
   - ESLint highlights issues in real-time

3. **Format & Lint**
   - Prettier formats on save
   - ESLint fixes on save
   - Run `npm run lint:fix` for bulk fixes

4. **Type Check**
   ```bash
   npm run typecheck
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```
   Output in `dist/` folder

## Environment Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Initial Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables (Optional)
For online features (leaderboards, cloud saves):
```bash
cp env.example.txt .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Code Style Guidelines

### TypeScript
- Use strict type checking
- Avoid `any` types (use `unknown` if needed)
- Use interfaces for object shapes
- Leverage type inference

### Naming Conventions
- Classes: PascalCase (`class Monster`)
- Functions/Variables: camelCase (`function spawnMonster`)
- Constants: UPPER_SNAKE_CASE (`const MAX_LIVES`)
- Private members: underscore prefix (`private _health`)

### Imports
- Use path aliases for internal modules
- Group imports: external → internal
- Keep imports sorted alphabetically

## Troubleshooting

### TypeScript Errors
- Run `npm run typecheck` for detailed errors
- Check tsconfig.json for configuration
- Ensure all dependencies are installed

### ESLint Issues
- Run `npm run lint:fix` for auto-fixes
- Check eslint.config.js for rules
- Disable specific rules with inline comments if needed

### Build Failures
- Clear cache: `rm -rf node_modules/.vite`
- Reinstall: `rm -rf node_modules && npm install`
- Check Vite configuration

### Hot Reload Not Working
- Check browser console for errors
- Restart dev server
- Clear browser cache

## Performance Tips

1. **Development**
   - Use hot reload for faster iteration
   - Keep browser dev tools open for debugging
   - Use `console.log` sparingly (removed in production)

2. **Production**
   - Build with `npm run build`
   - Test production build with `npm run preview`
   - Check bundle size in dist/

## Next Steps

After setting up the environment:
1. Review [GAME_SPEC.md](GAME_SPEC.md) for game design
2. Check [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for roadmap
3. Start with Phase 1: MVP Core
4. Follow the development phases sequentially

## Resources

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
