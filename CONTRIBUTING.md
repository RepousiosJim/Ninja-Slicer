# Contributing to Monster Slayer

Thank you for your interest in contributing to Monster Slayer! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Common Tasks](#common-tasks)
- [Getting Help](#getting-help)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Use of sexualized language or imagery
- Trolling, insulting or derogatory comments
- Personal or political attacks
- Public or private harassment
- Publishing others' private information
- Other unethical or unprofessional conduct

### Enforcement

Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned with this Code of Conduct.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 20.0.0+** installed
- **npm 9.0.0+** or **yarn** installed
- **Git** installed and configured
- A **GitHub account**
- Basic knowledge of **TypeScript** and **Phaser 3**

### Setup Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/monster-slayer.git
cd monster-slayer

# 2. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/monster-slayer.git

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```

### Verify Setup

```bash
# Run quality checks
npm run lint
npm run typecheck

# Build project
npm run build

# Run tests (if available)
npm run test
```

---

## Development Workflow

### 1. Choose an Issue

1. Browse [GitHub Issues](https://github.com/ORIGINAL_OWNER/monster-slayer/issues)
2. Find an issue you'd like to work on
3. Comment on the issue to claim it (if applicable)
4. Wait for maintainer approval

### 2. Create a Branch

Create a new branch for your changes:

```bash
# From main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/description-of-your-changes

# Or for bug fixes
git checkout -b fix/description-of-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `style/` - Code style changes (formatting, etc.)
- `chore/` - Maintenance tasks

### 3. Make Changes

- Follow the [Coding Standards](#coding-standards)
- Write tests for new features
- Update documentation as needed
- Keep changes focused and atomic

### 4. Commit Changes

Commit your changes following [Commit Guidelines](#commit-guidelines):

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new weapon type"
```

### 5. Sync with Upstream

Before pushing, sync with upstream to avoid conflicts:

```bash
# Fetch latest changes
git fetch upstream

# Rebase your branch on upstream/main
git rebase upstream/main

# Resolve conflicts if any
```

### 6. Push Your Changes

```bash
# Push to your fork
git push origin feature/description-of-your-changes
```

### 7. Create Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Compare to `main` branch
5. Fill out the PR template
6. Submit your PR

---

## Coding Standards

### TypeScript

#### Type Safety

Always use TypeScript types. Avoid `any` except where necessary:

```typescript
// Good: Explicit types
interface Monster {
  type: MonsterType;
  health: number;
}

function damageMonster(monster: Monster, damage: number): void {
  monster.health -= damage;
}

// Bad: Using any
function damageMonster(monster: any, damage: any): void {
  monster.health -= damage;
}
```

#### Type Assertions

Avoid type assertions when possible:

```typescript
// Good: Type guards
function isMonster(entity: BaseEntity): entity is Monster {
  return entity instanceof Monster;
}

// Avoid if possible
const monster = entity as Monster;
```

#### Enums

Use enums for fixed sets of values:

```typescript
// Good
enum MonsterType {
  ZOMBIE = 'zombie',
  VAMPIRE = 'vampire',
  GHOST = 'ghost',
}

// Bad
type MonsterType = 'zombie' | 'vampire' | 'ghost';
```

### Code Style

#### Naming Conventions

```typescript
// Classes: PascalCase
class MonsterManager { }

// Functions and variables: camelCase
function calculateDamage() { }
const monsterHealth = 100;

// Constants: UPPER_SNAKE_CASE
const MAX_HEALTH = 100;
const GAME_WIDTH = 1280;

// Private members: prefix with underscore
class MyClass {
  private _privateValue: number;

  private _privateMethod(): void { }
}

// Interfaces: PascalCase, no 'I' prefix
interface MonsterConfig { }

// Types: PascalCase, no 'T' prefix
type Vector2D = { x: number; y: number };

// Enums: PascalCase, UPPER_SNAKE_CASE
enum MonsterType {
  ZOMBIE = 'zombie',
  VAMPIRE = 'vampire',
}
```

#### File Structure

Organize files logically:

```typescript
// 1. Imports (third-party, local, types)
import Phaser from 'phaser';
import { MonsterManager } from './managers/MonsterManager';
import type { Monster } from './entities/Monster';

// 2. Constants
const CONFIG = {
  maxHealth: 100,
  damage: 10,
};

// 3. Interface definitions
interface MonsterConfig {
  type: MonsterType;
  health: number;
}

// 4. Class implementation
export class MonsterManager {
  private config: MonsterConfig;
  
  constructor(config: MonsterConfig) {
    this.config = config;
  }
  
  // Methods...
}
```

#### Functions

Keep functions focused and small:

```typescript
// Good: Single responsibility
function calculateDamage(base: number, multiplier: number): number {
  return base * multiplier;
}

function applyCritMultiplier(damage: number, isCrit: boolean): number {
  return isCrit ? damage * 2 : damage;
}

// Bad: Too many responsibilities
function processMonster(monster: any): any {
  // Does damage calculation
  // Does health checking
  // Does score updating
  // Does audio playing
  // Too much!
}
```

#### Comments

Use JSDoc for public APIs:

```typescript
/**
 * Calculates damage based on weapon and monster type
 * @param weaponId - The weapon ID
 * @param monsterType - The monster type
 * @param baseDamage - The base damage value
 * @returns The calculated damage
 */
export function calculateDamage(
  weaponId: string,
  monsterType: MonsterType,
  baseDamage: number
): number {
  // Implementation...
}
```

Inline comments should explain *why*, not *what*:

```typescript
// Good: Explains reason
// We use setTimeout to allow the browser to render the frame first
setTimeout(() => {
  this.updateDisplay();
}, 0);

// Bad: Repeats code
// Set timeout to 0
setTimeout(() => {
  // Update display
  this.updateDisplay();
}, 0);
```

### Phaser Best Practices

#### Scene Lifecycle

Follow Phaser scene lifecycle:

```typescript
class GameplayScene extends Phaser.Scene {
  // 1. Initialize scene data
  constructor() {
    super({ key: 'GameplayScene' });
  }

  // 2. Preload assets
  preload(): void {
    this.load.image('monster', 'assets/monster.png');
  }

  // 3. Create game objects
  create(): void {
    this.createPlayer();
    this.createMonsters();
    this.setupInputs();
  }

  // 4. Update game state
  update(time: number, delta: number): void {
    this.updatePlayer();
    this.updateMonsters();
  }

  // 5. Clean up
  shutdown(): void {
    this.destroyObjects();
    this.removeEventListeners();
  }
}
```

#### Object Pooling

Use object pools for frequently created objects:

```typescript
class MonsterPool {
  private pool: Phaser.GameObjects.GameObject[] = [];

  get(x: number, y: number): Monster {
    const monster = this.pool.pop() as Monster;

    if (monster) {
      monster.setPosition(x, y);
      monster.setActive(true);
      monster.setVisible(true);
    } else {
      // Create new if pool empty
      monster = new Monster(this.scene, x, y);
    }

    return monster;
  }

  release(monster: Monster): void {
    monster.setActive(false);
    monster.setVisible(false);
    this.pool.push(monster);
  }
}
```

#### Input Handling

Use Phaser input systems:

```typescript
create(): void {
  // Pointer input
  this.input.on('pointerdown', this.onPointerDown, this);
  this.input.on('pointermove', this.onPointerMove, this);
  this.input.on('pointerup', this.onPointerUp, this);

  // Keyboard input
  this.input.keyboard.on('keydown-ESC', this.onPause, this);
  this.input.keyboard.on('keydown-P', this.onPause, this);
}

// Always remove listeners in shutdown
shutdown(): void {
  this.input.off('pointerdown', this.onPointerDown, this);
  this.input.off('pointermove', this.onPointerMove, this);
  this.input.off('pointerup', this.onPointerUp, this);
  this.input.keyboard.off('keydown-ESC', this.onPause);
  this.input.keyboard.off('keydown-P', this.onPause);
}
```

### Performance Guidelines

#### Avoid Unnecessary Re-renders

```typescript
// Bad: Creates new objects every frame
update(): void {
  const position = { x: 0, y: 0 };
  position.x = this.player.x;
  position.y = this.player.y;
}

// Good: Reuse objects
class GameplayScene {
  private position: { x: number; y: number } = { x: 0, y: 0 };

  update(): void {
    this.position.x = this.player.x;
    this.position.y = this.player.y;
  }
}
```

#### Optimize Loop Performance

```typescript
// Bad: Nested loops over large arrays
for (let i = 0; i < this.monsters.length; i++) {
  for (let j = 0; j < this.monsters.length; j++) {
    // Check collision
  }
}

// Good: Use spatial partitioning
// Only check nearby monsters
const nearbyMonsters = this.quadTree.query(this.player.bounds);
nearbyMonsters.forEach(monster => {
  if (this.checkCollision(this.player, monster)) {
    this.handleCollision(monster);
  }
});
```

#### Minimize Garbage Collection

```typescript
// Bad: Creates new objects
update(): void {
  const { x, y } = this.player;
  const position = { x, y }; // New object every frame
}

// Good: Reuse objects
class GameplayScene {
  private tempPosition: { x: number; y: number } = { x: 0, y: 0 };

  update(): void {
    this.tempPosition.x = this.player.x;
    this.tempPosition.y = this.player.y;
  }
}
```

---

## Testing Guidelines

### Unit Tests

Write unit tests for utility functions and managers:

```typescript
// tests/utils/helpers.test.ts
import { formatNumber } from '../src/utils/helpers';

describe('formatNumber', () => {
  it('should format large numbers with K suffix', () => {
    expect(formatNumber(1500)).toBe('1.5K');
  });

  it('should format large numbers with M suffix', () => {
    expect(formatNumber(1500000)).toBe('1.5M');
  });

  it('should format small numbers without suffix', () => {
    expect(formatNumber(500)).toBe('500');
  });
});
```

### Integration Tests

Test interactions between components:

```typescript
// tests/integration/SaveManager.test.ts
import { SaveManager } from '../src/managers/SaveManager';
import type { GameSave } from '../src/config/types';

describe('SaveManager Integration', () => {
  let saveManager: SaveManager;
  let mockScene: Phaser.Scene;

  beforeEach(() => {
    mockScene = new Phaser.Scene({ key: 'Test' });
    saveManager = new SaveManager();
    saveManager.initialize();
  });

  afterEach(() => {
    saveManager.clearSave();
    saveManager.shutdown();
  });

  it('should save and load game data', async () => {
    const saveData: GameSave = {
      version: 1,
      souls: 1000,
      // ... other fields
    };

    await saveManager.save(saveData);
    const loaded = saveManager.load();

    expect(loaded).not.toBeNull();
    expect(loaded!.souls).toBe(1000);
  });
});
```

### E2E Tests

Test complete user flows:

```typescript
// tests/e2e/gameplay.test.ts
import { test, expect } from '@playwright/test';

test.describe('Gameplay Flow', () => {
  test('should complete level with 3 stars', async ({ page }) => {
    // Navigate to game
    await page.goto('/');
    await page.click('[data-testid="play-button"]');

    // Select level
    await page.click('[data-testid="level-1-1"]');

    // Play level
    await page.waitForTimeout(60000); // Simulate 60s level

    // Verify completion
    await expect(page.locator('[data-testid="level-complete"]')).toBeVisible();
    await expect(page.locator('[data-testid="stars-3"]')).toBeVisible();
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Commit Guidelines

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat:** A new feature
- **fix:** A bug fix
- **docs:** Documentation only changes
- **style:** Changes that do not affect code meaning (formatting, etc.)
- **refactor:** Code change that neither fixes a bug nor adds a feature
- **perf:** Code change that improves performance
- **test:** Adding or updating tests
- **chore:** Changes to the build process or auxiliary tools
- **ci:** CI/CD changes

### Examples

```bash
# Feature
feat(weapons): add fire sword weapon with burn effect

# Bug fix
fix(spawn): resolve monster spawning outside screen bounds

# Documentation
docs(api): add complete API reference documentation

# Refactor
refactor(slash): extract slash pattern detection to separate class

# Performance
perf(particles): reduce particle count by 30% on mobile

# Test
test(monsters): add unit tests for monster damage calculation

# Chore
chore(deps): update Phaser to version 3.85.2
```

### Detailed Format

For more complex changes, include a body:

```bash
feat(shop): implement bulk weapon purchases

Users can now purchase multiple weapons at once in the shop.
This improves the UX for new players who want to quickly
unlock multiple starter weapons.

- Add bulk purchase button
- Implement discount for bulk purchases (10% off)
- Add confirmation dialog
- Update save manager to handle multiple purchases

Closes #123
```

### Footer References

- **Closes #123** - Closes issue #123
- **Fixes #456** - Fixes issue #456
- **Refs #789** - References issue #789

---

## Pull Request Process

### PR Title

Use the same format as commit messages:

```
feat(weapons): add ice blade weapon
fix(spawn): prevent monster overlap
docs(api): update manager documentation
```

### PR Description

Include:

1. **Type:** What type of change is this?
2. **Motivation:** Why is this change needed?
3. **Changes:** What changes are included?
4. **Screenshots:** For UI/visual changes
5. **Testing:** How was this tested?
6. **Breaking Changes:** Any backwards incompatible changes?

#### PR Template

```markdown
## Type
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Description
<!-- Describe your changes in detail -->

## Motivation
<!-- Why is this change needed? What problem does it solve? -->

## Changes
<!-- List the changes included in this PR -->
- Changed X to Y
- Added feature Z
- Removed deprecated code

## Screenshots
<!-- Add screenshots for UI changes -->
![Screenshot](url)

## Testing
<!-- How did you test this? -->
- [ ] Manual testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested on Safari
- [ ] Tested on mobile

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings generated
- [ ] Added/updated tests
- [ ] All tests passing
```

### PR Reviews

#### For Contributors

- Be responsive to feedback
- Address review comments promptly
- Thank reviewers for their time
- Be open to suggestions

#### For Reviewers

- Be constructive and specific
- Focus on the code, not the person
- Provide suggestions for improvement
- Ask clarifying questions when needed

### Approval Process

1. **Automated checks:** All CI checks must pass
2. **Code review:** At least one maintainer approval required
3. **Test review:** Test coverage must not decrease
4. **Merge:** Maintainer merges after approval

---

## Project Structure

### Core Directories

```
src/
├── config/          # Configuration and types
├── data/            # JSON game data
├── entities/         # Game entities
├── managers/         # Singleton managers
├── scenes/          # Phaser scenes
├── services/        # External services
├── systems/         # Game systems
├── ui/              # UI components
├── utils/           # Utility functions
└── main.ts          # Entry point
```

### Where to Put New Code

#### New Feature

```
New Feature: Double Jump
├── src/systems/DoubleJumpSystem.ts   # Core logic
├── src/managers/MovementManager.ts     # Extended
├── src/config/constants.ts            # New constants
└── src/scenes/GameplayScene.ts        # Integration
```

#### Bug Fix

```
Bug Fix: Monster Stuck at Screen Edge
├── src/entities/Monster.ts            # Fix collision logic
└── tests/entities/Monster.test.ts     # Add regression test
```

#### Refactor

```
Refactor: Extract Monster Factory
├── src/entities/MonsterFactory.ts      # New class
├── src/entities/Monster.ts            # Updated to use factory
└── src/entities/Zombie.ts             # Updated to use factory
```

---

## Common Tasks

### Adding a New Monster

1. Create sprite assets in `public/assets/monsters/`
2. Add monster type to `src/config/types.ts`
3. Create monster class in `src/entities/NewMonster.ts`
4. Add to `MonsterFactory.ts`
5. Add to `src/data/levels.json` weights
6. Update documentation

### Adding a New Weapon

1. Create sprite assets in `public/assets/weapons/`
2. Add weapon to `src/data/weapons.json`
3. Add weapon effects in weapon class
4. Update `WeaponManager.ts`
5. Add to shop scene
6. Update documentation

### Adding a New Scene

1. Create scene class in `src/scenes/NewScene.ts`
2. Add scene key to `src/config/constants.ts`
3. Register scene in `main.ts`
4. Create scene UI components
5. Add navigation to/from scene
6. Test all navigation paths

### Adding a New Upgrade

1. Add upgrade to `src/data/upgrades.json`
2. Implement upgrade logic in `UpgradeManager.ts`
3. Add UI to shop/character scene
4. Test upgrade effect
5. Balance upgrade cost/effect

---

## Getting Help

### Documentation

- [API Documentation](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Game Spec](docs/GAME_SPEC.md)
- [Setup Guide](docs/SETUP_GUIDE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

### Communication Channels

- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** Questions and ideas
- **Discord:** Real-time chat (if available)

### Asking for Help

When asking for help:

1. **Search existing issues** first
2. **Create minimal reproduction** - Show only necessary code
3. **Describe environment** - OS, browser, versions
4. **Provide error messages** - Console errors, stack traces
5. **Be patient** - Maintainers volunteer their time

### Example Help Request

```markdown
## Issue
Monster spawning incorrectly on mobile devices

## Environment
- OS: iOS 16.4
- Browser: Safari 16
- Game Version: 0.1.0

## Steps to Reproduce
1. Open game on iPhone 14
2. Start level 1-1
3. Observe monster spawn behavior

## Expected Behavior
Monsters should spawn within screen bounds (x: 100-1180, y: -50-750)

## Actual Behavior
Monsters sometimes spawn outside visible area (x: < 100 or x: > 1180)

## Console Errors
No errors in console

## Screenshots
![Screenshot](url)
```

---

## Recognition

### Contributors

All contributors will be credited in:
- `CONTRIBUTORS.md` file
- Game credits (for major contributions)
- Release notes

### Maintainer Guidelines

For maintainers:
- Review PRs promptly
- Provide constructive feedback
- Help new contributors get started
- Follow up on issues
- Update documentation regularly

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Monster Slayer! 🎉

**[⬆ Back to Top](#contributing-to-monster-slayer)**
