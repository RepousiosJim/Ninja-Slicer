# 🎉 Notion Integration - Complete Setup Guide

## ✅ What's Been Implemented

You now have a **comprehensive Notion workspace** for tracking your entire Ninja Slicer project!

### 📊 Databases Created

1. **📋 Tasks & Features** - Track development tasks, bugs, features
2. **📚 Documentation Hub** - All your markdown docs synced automatically
3. **🎨 Asset Tracker** - Sprites, animations, audio files
4. **📝 Commit Log** - Every git commit automatically logged
5. **🎮 Levels & Bosses** - All 30 levels from levels.json
6. **⚔️ Weapons & Upgrades** - All 18 weapon variants from weapons.json
7. **🏗️ Systems Status** - Track implementation of all game systems
8. **🎬 Scenes Status** - Track all Phaser scenes
9. **🎯 Development Milestones** - Phase 0-7 from your development plan

### 🔧 Scripts Created

| Command | What It Does |
|---------|-------------|
| `npm run notion:sync-docs` | Sync all markdown documentation to Notion |
| `npm run notion:sync-game-data` | Populate Levels, Weapons, Systems, Scenes, Milestones |
| `npm run notion:sync-todos` | Scan code for TODO/FIXME and create tasks |
| `npm run notion:create-task` | Interactive CLI to create new tasks |
| `npm run notion:sync-all` | Run all syncs at once |
| Every `git commit` | Auto-syncs commit to Notion (via Husky hook) |

---

## ⚠️ Required: Add Database Properties

The databases were created but Notion API doesn't always save properties correctly. You need to manually add properties to each database (takes 5-10 minutes total):

### How to Add Properties

1. Go to: https://www.notion.so/Ninja-Slicer-2d7ac8f53c2180389e3ed5b44de179c1
2. Click on each database
3. Click "+ New Property" button for each property below

---

### 🎮 Levels & Bosses

Add these properties:

- **World** (Number)
- **Level Number** (Number)
- **Boss Fight** (Checkbox)
- **Duration (seconds)** (Number)
- **Required Score** (Number)
- **Monster Types** (Multi-select)
- **Spawn Rate** (Text)
- **Implementation Status** (Select): Not Started, In Progress, Complete, Needs Testing
- **Testing Status** (Select): Not Tested, Testing, Passed, Issues Found
- **Balance Status** (Select): Not Tuned, Tuning, Balanced, Too Easy, Too Hard
- **Notes** (Text)

---

### ⚔️ Weapons & Upgrades

Add these properties:

- **Tier** (Number)
- **Damage** (Number)
- **Soul Cost** (Number)
- **Unlock Requirement** (Text)
- **Status** (Select): Not Started, In Progress, Complete
- **Sprite Status** (Select): Missing, In Progress, Complete
- **Balance Notes** (Text)

---

### 🏗️ Systems Status

Add these properties:

- **Category** (Select): Gameplay, UI, Data, Service, Manager
- **Status** (Select): Not Started, In Progress, Complete, Needs Refactor
- **File Path** (Text)
- **Test Coverage** (Select): None, Partial, Good
- **Performance** (Select): Unknown, Good, Needs Optimization, Critical
- **Known Issues** (Number)

---

### 🎬 Scenes Status

Add these properties:

- **Implementation %** (Number - percent format)
- **UI Complete** (Checkbox)
- **Testing Status** (Select): Not Tested, In Testing, Passed, Issues
- **Performance** (Select): Good, Acceptable, Poor
- **File Path** (Text)

---

### 🎯 Development Milestones

Add these properties:

- **Phase** (Number)
- **Status** (Select): Not Started, In Progress, Complete, Blocked
- **Start Date** (Date)
- **Target Date** (Date)
- **Completion %** (Number - percent format)
- **Dependencies** (Multi-select)
- **Blockers** (Text)
- **Description** (Text)

---

## 🚀 Once Properties Are Added

Run these commands to populate all your data:

```bash
# Populate all game data (levels, weapons, systems, scenes, milestones)
npm run notion:sync-game-data

# Scan for TODO/FIXME comments and create tasks
npm run notion:sync-todos

# Sync all documentation
npm run notion:sync-docs
```

---

## 📖 Daily Workflow

### As You Develop:

1. **Make code changes**
2. **Commit your work**: `git commit -m "feat: your feature #T-123"`
   - Commit automatically appears in Notion Commit Log
   - If you reference a task ID (#T-123), it links automatically

### Create Tasks:

```bash
npm run notion:create-task
```

Follow the prompts to create a task. You'll get a task ID (e.g., T-42) to reference in commits.

### Sync Documentation:

Whenever you update markdown files:

```bash
npm run notion:sync-docs
```

### Track TODO Comments:

Periodically run:

```bash
npm run notion:sync-todos
```

This scans your codebase for `// TODO`, `// FIXME`, `// BUG` comments and creates tasks.

---

## 🎯 What You Get

### Real-Time Visibility

- See all 30 levels and their implementation status
- Track all 18 weapon variants and balance notes
- Monitor system performance and issues
- View milestone progress (Phase 0-7)
- Every commit logged automatically

### Automatic Tracking

- Git commits → Notion (no manual work)
- TODO comments → Tasks (automated scanning)
- Documentation → Always up-to-date

### Project Management

- Kanban boards for tasks
- Progress tracking with percentages
- Link commits to tasks
- Track blockers and dependencies

---

## 📁 Files Created

### Scripts (`scripts/notion/`)

- `config.cjs` - Configuration and validation
- `utils.cjs` - API client with rate limiting
- `markdown-parser.cjs` - Markdown → Notion converter
- `sync-commit.cjs` - Auto-sync commits
- `sync-docs.cjs` - Sync documentation
- `sync-game-data.cjs` - Populate game databases
- `sync-todos.cjs` - Scan for TODO comments
- `create-task.cjs` - Interactive task creator

### Git Hooks (`.husky/`)

- `post-commit` - Runs after every commit to sync to Notion

### Configuration

- `.env` - All database IDs configured
- `package.json` - All NPM scripts added

---

## 🔗 Your Notion Workspace

Access your workspace here:
https://www.notion.so/Ninja-Slicer-2d7ac8f53c2180389e3ed5b44de179c1

---

## 🎨 Customization

### Add More Databases

You can create additional databases for:
- Character designs
- Story/narrative content
- Marketing assets
- Test cases
- Performance benchmarks

### Modify Sync Scripts

All scripts are in `scripts/notion/` and can be customized to:
- Filter which files to sync
- Add custom properties
- Change sync frequency
- Add notifications

### Create Views

In Notion, create custom views:
- Kanban by Status
- Calendar by Due Date
- Table grouped by Type
- Gallery view for assets
- Timeline for milestones

---

## 💡 Pro Tips

1. **Use Task IDs in Commits**: `git commit -m "fix: bug in spawning #T-42"`
2. **Run TODO Scan Weekly**: Find hidden technical debt
3. **Update Milestones Manually**: Keep completion % current
4. **Add Screenshots to Assets**: Use the Preview field
5. **Link Related Items**: Connect tasks to levels, weapons, etc.

---

## 🐛 Troubleshooting

### Sync Fails

- Check your internet connection
- Verify `.env` has all database IDs
- Make sure Notion page is shared with your integration

### Properties Not Found

- Manually add properties to databases (see above)
- Property names must match exactly (case-sensitive)

### Commit Hook Not Running

- Run `npx husky install`
- Check `.husky/post-commit` exists and is executable

---

## 🎉 You're All Set!

You now have a **production-grade project management system** that:

✅ Tracks all 30 levels
✅ Monitors 18 weapon variants
✅ Logs every commit automatically
✅ Syncs all documentation
✅ Scans for TODO comments
✅ Tracks 8 development phases
✅ Manages tasks with Kanban boards

**Next Step**: Add the database properties (10 minutes), then run `npm run notion:sync-game-data` to populate everything!
