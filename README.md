# Monster Slayer 🗡️

A Fruit Ninja-style monster slicing game with RPG progression, built with Phaser 3 and TypeScript.

![Game Preview](docs/preview.png) <!-- Add a screenshot later -->

## 🎮 Features

- **Slash Mechanic:** Fast-paced mouse/touch slicing gameplay
- **Monster Variety:** Zombies, Vampires, and Ghosts with unique behaviors
- **5 Worlds:** Graveyard → Haunted Village → Vampire Castle → Ghost Realm → Hell Dimension
- **25 Levels + 5 Epic Bosses**
- **6 Unique Weapons:** Each with 3 upgrade tiers and special effects
- **5 Character Upgrades:** Customize your playstyle
- **Endless Mode:** Compete for high scores on online leaderboards
- **Responsive Design:** Play on desktop or mobile browsers

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

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

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## 🛠️ Tech Stack

- **Framework:** [Phaser 3](https://phaser.io/)
- **Language:** TypeScript
- **Build Tool:** Vite
- **Backend:** Supabase (leaderboards, cloud saves)

## 📁 Project Structure

```
monster-slayer/
├── docs/               # Documentation
├── public/             # Static assets
│   └── assets/         # Sprites, audio, backgrounds
├── src/
│   ├── config/         # Game configuration, constants, types
│   ├── data/           # JSON data (levels, weapons, upgrades)
│   ├── scenes/         # Phaser scenes
│   ├── entities/       # Game entities (monsters, bosses, etc.)
│   ├── systems/        # Game systems (slash, spawn, combo)
│   ├── managers/       # Singleton managers (save, audio, etc.)
│   ├── services/       # External services (Supabase)
│   ├── ui/             # UI components
│   ├── utils/          # Utility functions
│   └── main.ts         # Entry point
├── supabase/           # Database schema
└── package.json
```

## 📖 Documentation

- [Game Design Spec](docs/GAME_SPEC.md) - Complete game design document
- [Development Plan](docs/DEVELOPMENT_PLAN.md) - Phase-by-phase task list
- [Architecture](docs/ARCHITECTURE.md) - Technical architecture and patterns
- [Quick Reference](docs/QUICK_REFERENCE.md) - Cheat sheet for common values
- [Asset Requirements](docs/ASSET_REQUIREMENTS.md) - Art and audio asset list

## 🎯 Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 0. Setup | ✅ | Project configuration |
| 1. MVP | 🔲 | Core slash mechanic |
| 2. Core Loop | 🔲 | Full gameplay with all monsters |
| 3. Progression | 🔲 | Weapons, upgrades, saves |
| 4. Campaign | 🔲 | 25 levels + 5 bosses |
| 5. UI | 🔲 | All menu screens |
| 6. Online | 🔲 | Leaderboards, cloud saves |
| 7. Polish | 🔲 | Audio, VFX, optimization |

## 🔧 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required for online features:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

## 🎨 Assets

This game uses pixel art assets. See [Asset Requirements](docs/ASSET_REQUIREMENTS.md) for the complete list.

Recommended sources:
- [itch.io](https://itch.io/game-assets)
- [OpenGameArt](https://opengameart.org/)
- [GameDevMarket](https://www.gamedevmarket.net/)

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint code linting |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Fruit Ninja by Halfbrick Studios
- Built with [Phaser 3](https://phaser.io/)
- Backend powered by [Supabase](https://supabase.com/)

---

Made with ❤️ and lots of slicing
