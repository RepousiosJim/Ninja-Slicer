#!/usr/bin/env node

// Sync Game Data to Notion
// Populates Levels, Weapons, Systems, Scenes, and Milestones databases

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');
const {
  createDatabasePage,
  queryDatabase,
  titleProperty,
  selectProperty,
  numberProperty,
  multiSelectProperty,
  dateProperty,
  safeExecute,
  logger
} = require('./utils.cjs');

// =============================================================================
// LEVELS SYNC
// =============================================================================

async function syncLevels() {
  console.log('\n🎮 Syncing Levels & Bosses...');

  const levelsPath = path.join(__dirname, '../../src/data/levels.json');
  if (!fs.existsSync(levelsPath)) {
    logger.warning('levels.json not found, skipping levels sync');
    return;
  }

  const levelsData = JSON.parse(fs.readFileSync(levelsPath, 'utf-8'));
  let synced = 0;

  for (const level of levelsData.levels) {
    const properties = {
      'Name': titleProperty(`${level.id}: ${level.name || 'Level ' + level.id}`),
      'World': numberProperty(parseInt(level.id.split('-')[0])),
      'Level Number': numberProperty(parseInt(level.id.split('-')[1])),
      'Boss Fight': { checkbox: level.bossLevel || false },
      'Duration (seconds)': numberProperty(level.duration),
      'Required Score': numberProperty(level.requiredScore),
      'Monster Types': multiSelectProperty(level.monsters || []),
      'Spawn Rate': { rich_text: [{ text: { content: level.spawnRate?.toString() || 'N/A' } }] },
      'Implementation Status': selectProperty('Complete'),
      'Testing Status': selectProperty('Not Tested'),
      'Balance Status': selectProperty('Not Tuned')
    };

    const result = await safeExecute(
      () => createDatabasePage(config.databases.levels, properties),
      `Failed to create level ${level.id}`
    );

    if (result) synced++;
  }

  logger.success(`Synced ${synced}/${levelsData.levels.length} levels`);
}

// =============================================================================
// WEAPONS SYNC
// =============================================================================

async function syncWeapons() {
  console.log('\n⚔️ Syncing Weapons...');

  const weaponsPath = path.join(__dirname, '../../src/data/weapons.json');
  if (!fs.existsSync(weaponsPath)) {
    logger.warning('weapons.json not found, skipping weapons sync');
    return;
  }

  const weaponsData = JSON.parse(fs.readFileSync(weaponsPath, 'utf-8'));
  let synced = 0;

  for (const weapon of weaponsData.weapons) {
    // Create entries for each tier
    for (let tier = 1; tier <= 3; tier++) {
      const tierData = weapon.tiers.find(t => t.tier === tier);
      if (!tierData) continue;

      const properties = {
        'Name': titleProperty(`${weapon.name} (Tier ${tier})`),
        'Tier': numberProperty(tier),
        'Damage': numberProperty(tierData.damageMultiplier),
        'Soul Cost': numberProperty(tierData.cost),
        'Unlock Requirement': { rich_text: [{ text: { content: tierData.unlockCondition || 'Available' } }] },
        'Status': selectProperty('Complete'),
        'Sprite Status': selectProperty('Missing'),
        'Balance Notes': { rich_text: [{ text: { content: weapon.description || '' } }] }
      };

      const result = await safeExecute(
        () => createDatabasePage(config.databases.weapons, properties),
        `Failed to create ${weapon.name} Tier ${tier}`
      );

      if (result) synced++;
    }
  }

  logger.success(`Synced ${synced} weapon variants`);
}

// =============================================================================
// SYSTEMS SYNC
// =============================================================================

async function syncSystems() {
  console.log('\n🏗️ Syncing Systems...');

  const systemsDir = path.join(__dirname, '../../src/systems');
  if (!fs.existsSync(systemsDir)) {
    logger.warning('systems directory not found');
    return;
  }

  const systemFiles = fs.readdirSync(systemsDir).filter(f => f.endsWith('.ts'));
  let synced = 0;

  for (const file of systemFiles) {
    const systemName = file.replace('.ts', '').replace(/([A-Z])/g, ' $1').trim();
    const filePath = `src/systems/${file}`;

    const properties = {
      'System Name': titleProperty(systemName),
      'Category': selectProperty('Gameplay'),
      'Status': selectProperty('Complete'),
      'File Path': { rich_text: [{ text: { content: filePath } }] },
      'Test Coverage': selectProperty('None'),
      'Performance': selectProperty('Unknown'),
      'Known Issues': numberProperty(0)
    };

    const result = await safeExecute(
      () => createDatabasePage(config.databases.systems, properties),
      `Failed to create system ${systemName}`
    );

    if (result) synced++;
  }

  logger.success(`Synced ${synced} systems`);
}

// =============================================================================
// SCENES SYNC
// =============================================================================

async function syncScenes() {
  console.log('\n🎬 Syncing Scenes...');

  const scenesDir = path.join(__dirname, '../../src/scenes');
  if (!fs.existsSync(scenesDir)) {
    logger.warning('scenes directory not found');
    return;
  }

  const sceneFiles = fs.readdirSync(scenesDir).filter(f => f.endsWith('.ts'));
  let synced = 0;

  for (const file of sceneFiles) {
    const sceneName = file.replace('.ts', '').replace(/([A-Z])/g, ' $1').trim();
    const filePath = `src/scenes/${file}`;

    const properties = {
      'Scene Name': titleProperty(sceneName),
      'Implementation %': numberProperty(1.0), // 100%
      'UI Complete': { checkbox: true },
      'Testing Status': selectProperty('Not Tested'),
      'Performance': selectProperty('Good'),
      'File Path': { rich_text: [{ text: { content: filePath } }] }
    };

    const result = await safeExecute(
      () => createDatabasePage(config.databases.scenes, properties),
      `Failed to create scene ${sceneName}`
    );

    if (result) synced++;
  }

  logger.success(`Synced ${synced} scenes`);
}

// =============================================================================
// MILESTONES SYNC
// =============================================================================

async function syncMilestones() {
  console.log('\n🎯 Syncing Milestones...');

  const milestones = [
    { phase: 0, milestone: 'Project Setup & Foundation', status: 'Complete', completion: 1.0, description: 'Initialize project, set up build system, configure TypeScript and Vite' },
    { phase: 1, milestone: 'Core Gameplay Mechanics', status: 'Complete', completion: 1.0, description: 'Implement slash system, monster spawning, collision detection, and combo system' },
    { phase: 2, milestone: 'Progression Systems', status: 'Complete', completion: 1.0, description: 'Weapons, upgrades, souls currency, save system' },
    { phase: 3, milestone: 'Content & Polish', status: 'In Progress', completion: 0.7, description: '25 levels, 5 bosses, power-ups, animations' },
    { phase: 4, milestone: 'UI & Menus', status: 'Complete', completion: 1.0, description: 'All menu screens, HUD, settings, pause menu' },
    { phase: 5, milestone: 'Backend Integration', status: 'In Progress', completion: 0.5, description: 'Supabase setup, leaderboards, cloud saves' },
    { phase: 6, milestone: 'Testing & Optimization', status: 'Not Started', completion: 0.0, description: 'Cross-browser testing, performance optimization, mobile testing' },
    { phase: 7, milestone: 'Launch Preparation', status: 'Not Started', completion: 0.0, description: 'Final assets, deployment, marketing materials' }
  ];

  let synced = 0;

  for (const milestone of milestones) {
    const properties = {
      'Milestone': titleProperty(`Phase ${milestone.phase}: ${milestone.milestone}`),
      'Phase': numberProperty(milestone.phase),
      'Status': selectProperty(milestone.status),
      'Completion %': numberProperty(milestone.completion),
      'Description': { rich_text: [{ text: { content: milestone.description } }] }
    };

    const result = await safeExecute(
      () => createDatabasePage(config.databases.milestones, properties),
      `Failed to create milestone ${milestone.milestone}`
    );

    if (result) synced++;
  }

  logger.success(`Synced ${synced} milestones`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  🎮 Notion Game Data Sync');
    console.log('═══════════════════════════════════════════════════════');

    // Validate config
    config.validate(['levels', 'weapons', 'systems', 'scenes', 'milestones']);

    // Sync all data
    await syncLevels();
    await syncWeapons();
    await syncSystems();
    await syncScenes();
    await syncMilestones();

    console.log('\n═══════════════════════════════════════════════════════');
    logger.success('Game data sync complete!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    logger.error('Error during game data sync:');
    logger.error(error.message);
    if (error.stack) {
      logger.debug(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { syncLevels, syncWeapons, syncSystems, syncScenes, syncMilestones };
