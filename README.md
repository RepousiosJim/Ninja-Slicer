# Monster Slayer 🗡️

A high-performance Fruit Ninja-style monster slicing game with deep RPG progression, built with Phaser 3, TypeScript, and Supabase.

![Game Preview](docs/preview.png)

## 🎮 Game Overview

Monster Slayer is a fast-paced arcade game where you slice through waves of monsters using your mouse or touch. Progress through 5 unique worlds, defeat epic bosses, upgrade your weapons, and compete for high scores on global leaderboards.

### Key Features

- 🎯 **Intuitive Slash Mechanics** - Fast-paced mouse/touch slicing with visual feedback
- 👹 **Diverse Monster Roster** - Zombies, Vampires, and Ghosts with unique behaviors
- 🏰 **5 Thematic Worlds** - Graveyard → Haunted Village → Vampire Castle → Ghost Realm → Hell Dimension
- ⚔️ **6 Unique Weapons** - Each with 3 upgrade tiers and special elemental effects
- 📈 **RPG Progression** - Character upgrades, weapon tiers, and skill customization
- 🏆 **Endless Mode** - Compete for global high scores on Supabase leaderboards
- 💾 **Cloud Saves** - Automatic save synchronization across devices
- 📱 **Responsive Design** - Optimized for desktop and mobile browsers
- 🎨 **Dark Gothic Theme** - Immersive visual style with atmospheric effects
- ♿ **Accessibility** - High contrast mode, reduced motion, keyboard navigation

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.0.0 or higher
- **npm** 9.0.0 or higher (or yarn)
- **Modern browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/monster-slayer.git
cd monster-slayer

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will open at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

Built files will be in the `dist/` folder, ready for deployment.

## 🏗️ Architecture

Monster Slayer follows a clean, modular architecture built on Phaser 3:

```
┌─────────────────────────────────────────────────────────────┐
│                     Game Loop                            │
├─────────────────────────────────────────────────────────────┤
│                      Scenes                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐     │
│  │ Main Menu │  │ Gameplay  │  │   Shop    │     │
│  └───────────┘  └───────────┘  └───────────┘     │
├─────────────────────────────────────────────────────────────┤
│                     Managers                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │   Audio  │ │   Save   │ │   Shop   │          │
│  └──────────┘ └──────────┘ └──────────┘          │
├─────────────────────────────────────────────────────────────┤
│                    Systems                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Slash   │ │  Spawn   │ │  Combo   │          │
│  └──────────┘ └──────────┘ └──────────┘          │
├─────────────────────────────────────────────────────────────┤
│                    Entities                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Monsters  │ │  Bosses  │ │ Powerups │          │
│  └──────────┘ └──────────┘ └──────────┘          │
├─────────────────────────────────────────────────────────────┤
│                      Services                           │
│  ┌──────────────────────────────────┐                  │
│  │          Supabase               │                  │
│  │   (Leaderboard, Cloud Save)     │                  │
│  └──────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

For detailed architecture, see [Architecture Documentation](docs/ARCHITECTURE.md).

## 📁 Project Structure

```
monster-slayer/
├── docs/                      # Complete documentation
│   ├── ARCHITECTURE.md         # Technical architecture
│   ├── GAME_SPEC.md            # Game design document
│   ├── SETUP_GUIDE.md          # Development setup
│   ├── PERFORMANCE_GUIDE.md    # Performance optimization
│   └── ...
├── public/                    # Static assets
│   ├── assets/                # Game assets (sprites, audio, backgrounds)
│   └── offline.html           # PWA offline page
├── scripts/                   # Utility scripts
│   ├── linear/                # Linear integration
│   └── notion/                # Notion sync utilities
├── src/
│   ├── config/                # Game configuration
│   │   ├── constants.ts       # Game constants
│   │   ├── theme.ts          # Dark Gothic theme configuration
│   │   └── types.ts          # TypeScript type definitions
│   ├── data/                  # JSON game data
│   │   ├── levels.json        # Level configurations
│   │   ├── updates.json       # Update notes
│   │   ├── upgrades.json      # Upgrade definitions
│   │   └── weapons.json      # Weapon definitions
│   ├── entities/              # Game entities
│   │   ├── BaseEntity.ts     # Base entity class
│   │   ├── Monster.ts        # Monster entity
│   │   ├── Boss.ts           # Boss entity
│   │   └── ...
│   ├── managers/              # Singleton managers
│   │   ├── AudioManager.ts    # Audio playback management
│   │   ├── SaveManager.ts    # Save/load game data
│   │   ├── ShopManager.ts    # Shop transactions
│   │   ├── LevelManager.ts   # Level management
│   │   ├── ThemeManager.ts   # Theme management
│   │   └── ...
│   ├── scenes/                # Phaser scenes
│   │   ├── BaseScene.ts      # Base scene class
│   │   ├── BootScene.ts      # Boot and initialization
│   │   ├── MainMenuScene.ts  # Main menu
│   │   ├── GameplayScene.ts   # Core gameplay
│   │   └── ...
│   ├── services/              # External services
│   │   └── SupabaseService.ts
│   ├── systems/               # Game systems
│   │   ├── SlashSystem.ts    # Slash detection
│   │   ├── SpawnSystem.ts    # Monster spawning
│   │   ├── ComboSystem.ts    # Combo tracking
│   │   └── ...
│   ├── ui/                    # UI components
│   │   ├── DashboardCard.ts   # Main menu cards
│   │   ├── Button.ts         # Reusable button
│   │   ├── HUD.ts            # Heads-up display
│   │   └── ...
│   ├── utils/                 # Utility functions
│   │   ├── helpers.ts        # Helper functions
│   │   ├── TextureGenerator.ts
│   │   ├── ResponsiveUtils.ts
│   │   └── ...
│   └── main.ts                # Application entry point
├── supabase/                 # Database schema
│   └── schema.sql            # SQL schema
├── .eslintrc.js             # ESLint configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
└── package.json            # Project dependencies
```

## 📚 Documentation

### Core Documentation
- [Architecture](docs/ARCHITECTURE.md) - Technical architecture and patterns
- [Game Design Spec](docs/GAME_SPEC.md) - Complete game design document
- [Development Plan](docs/DEVELOPMENT_PLAN.md) - Phase-by-phase development tasks
- [Quick Reference](docs/QUICK_REFERENCE.md) - Common values and constants

### Technical Guides
- [Setup Guide](docs/SETUP_GUIDE.md) - Development environment setup
- [Performance Guide](docs/PERFORMANCE_GUIDE.md) - Optimization strategies
- [Asset Requirements](docs/ASSET_REQUIREMENTS.md) - Art and audio asset specifications
- [Asset Tools Guide](docs/ASSET_TOOLS_GUIDE.md) - Recommended asset creation tools
- [Balance Guide](docs/BALANCE_GUIDE.md) - Game balance considerations

### Theme & UI
- [Theme System](docs/THEME_SYSTEM.md) - Dark Gothic theme implementation
- [Theme Visual Guide](docs/THEME_VISUAL_GUIDE.md) - Visual design guidelines
- [Architecture V1.0](docs/ARCHITECTURE_V1.0.md) - Architecture documentation

### Additional Documentation
- [Contributing](CONTRIBUTING.md) - Contribution guidelines
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment instructions
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [API Reference](docs/API.md) - Complete API documentation

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                # Start development server with hot reload
npm run build              # Build for production (outputs to dist/)
npm run preview            # Preview production build locally

# Code Quality
npm run lint               # Run ESLint code linting
npm run lint:fix          # Fix ESLint issues automatically
npm run typecheck         # Run TypeScript type checking
npm run format            # Format code with Prettier

# Notion Integration (optional)
npm run notion:sync-docs      # Sync documentation to Notion
npm run notion:sync-game-data  # Sync game data to Notion
npm run notion:sync-todos     # Sync todos to Notion
npm run notion:sync-all       # Sync everything to Notion

# Linear Integration (optional)
npm run linear:start       # Start Linear MCP server
npm run linear:test        # Test Linear connection
```

### Code Quality Standards

The project maintains strict code quality standards:

- **TypeScript** - Full type safety, no `any` types except where necessary
- **ESLint** - Enforced code style and best practices
- **Prettier** - Consistent code formatting
- **Husky** - Pre-commit hooks for quality checks

#### Commit Message Format

Follow conventional commits:

```
feat: add new weapon system
fix: resolve slash detection on mobile
docs: update API documentation
refactor: improve performance of spawn system
test: add unit tests for combo system
style: format code with prettier
chore: update dependencies
```

### Development Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make changes:**
   - Follow coding standards
   - Write tests when applicable
   - Update documentation

3. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

4. **Run quality checks:**
   ```bash
   npm run lint
   npm run typecheck
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/amazing-feature
   ```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

#### Required Variables

```bash
# Supabase (required for leaderboards and cloud saves)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Optional Variables

```bash
# Sentry (error tracking - optional)
VITE_SENTRY_DSN=your-sentry-dsn-here
```

### Game Configuration

Main game configuration is in `src/config/`:

- **constants.ts** - Game constants, physics, gameplay values
- **theme.ts** - Dark Gothic theme colors, fonts, animations
- **types.ts** - TypeScript type definitions

### Level Configuration

Level data is in `src/data/levels.json` with structure:

```json
{
  "1-1": {
    "world": 1,
    "level": 1,
    "name": "Graveyard Awakening",
    "duration": 60,
    "minKills": 20,
    "spawnRate": 1.5,
    "monsterWeights": {
      "zombie": 70,
      "vampire": 20,
      "ghost": 10
    },
    "starThresholds": [500, 1000, 1500]
  }
}
```

## 🎨 Theming

The game uses a Dark Gothic theme with:

- **Colors** - Deep crimson, obsidian black, blood red, antique gold
- **Fonts** - Arial Black (primary), Georgia (secondary)
- **Effects** - Glows, shadows, particle systems
- **Accessibility** - High contrast mode support

Theme configuration in `src/config/theme.ts` can be customized.

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e
```

## 📦 Deployment

### Deployment Platforms

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

#### GitHub Pages

```bash
# Build
npm run build

# Deploy with gh-pages
npm install -g gh-pages
gh-pages -d dist
```

#### Self-Hosted

1. Build the project: `npm run build`
2. Upload `dist/` folder to your web server
3. Configure server to serve SPA (all routes to index.html)

### PWA Setup

The game is a Progressive Web App with offline support:

- Offline HTML page included
- Service worker for offline caching
- Web App Manifest for installation

For PWA deployment, ensure HTTPS is enabled.

## 🐛 Troubleshooting

### Common Issues

#### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors

```bash
# Regenerate type checking
npm run typecheck
```

#### Assets Not Loading

- Check asset paths in `src/data/`
- Ensure files exist in `public/assets/`
- Verify case sensitivity (Linux is case-sensitive)

#### Performance Issues

- Reduce quality settings in Settings menu
- Close other browser tabs
- Update graphics drivers

For more troubleshooting, see [Troubleshooting Guide](docs/TROUBLESHOOTING.md).

## 🤝 Contributing

We welcome contributions! See [Contributing Guide](CONTRIBUTING.md) for details.

### Contribution Areas

- **Bug fixes** - Report and fix issues
- **New features** - Propose new game mechanics
- **Performance** - Optimize existing systems
- **Documentation** - Improve guides and references
- **Assets** - Create sprites, sounds, or music
- **Testing** - Write tests and report bugs

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Update documentation
6. Submit a pull request

All PRs must pass:
- ESLint checks
- TypeScript compilation
- Unit tests
- Code review

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by **Fruit Ninja** by Halfbrick Studios
- Built with **[Phaser 3](https://phaser.io/)**
- Backend powered by **[Supabase](https://supabase.com/)**
- Error tracking by **[Sentry](https://sentry.io/)**
- Font: **Arial Black** and **Georgia** (system fonts)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/monster-slayer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/monster-slayer/discussions)
- **Email**: support@monsterslayer.com

## 🗺️ Roadmap

See [Development Plan](docs/DEVELOPMENT_PLAN.md) and [Improvement Roadmap](IMPROVEMENT_ROADMAP.md) for upcoming features.

### Current Version: 0.1.0

- ✅ Core gameplay mechanics
- ✅ 6 weapons with upgrades
- ✅ 5 character upgrades
- ✅ 25 levels + 5 bosses
- ✅ Endless mode
- ✅ Leaderboards
- ✅ Cloud saves
- ✅ Responsive design
- ✅ Dark Gothic theme
- ✅ Accessibility features

### Planned Features

- 🔲 Multiplayer mode
- 🔲 Daily challenges
- 🔲 Achievement system
- 🔲 More worlds and bosses
- 🔲 Mini-games
- 🔲 Trading card collection

---

Made with ❤️ and lots of slicing

**[⬆ Back to Top](#monster-slayer-)**
