import os

# Files to update with console.log replacements
files_to_update = [
    ('src/scenes/BootScene.ts', [
        ("console.log('[BootScene] Initializing...')", "debugLog('[BootScene] Initializing...')"),
        ("console.log('[BootScene] Weapons loaded successfully')", "debugLog('[BootScene] Weapons loaded successfully')"),
        ("console.error('[BootScene] Failed to load weapons:', err)", "debugError('[BootScene] Failed to load weapons:', err)"),
        ("console.log('[BootScene] Managers initialized')", "debugLog('[BootScene] Managers initialized')"),
        ("console.log('[BootScene] Settings applied - UI Scale:', uiScale)", "debugLog('[BootScene] Settings applied - UI Scale:', uiScale)"),
        ("console.log('[BootScene] Generating button textures...')", "debugLog('[BootScene] Generating button textures...')"),
        ("console.log('[BootScene] Button textures generated successfully')", "debugLog('[BootScene] Button textures generated successfully')"),
    ]),
    ('src/scenes/GameplayScene.ts', [
        ("console.log('GameplayScene created - Phase 4 Campaign ready!')", "debugLog('GameplayScene created - Phase 4 Campaign ready!')"),
        ("console.error('[GameplayScene] Level', currentWorld, '-', currentLevel, ' not found')", "debugError('[GameplayScene] Level', currentWorld, '-', currentLevel, ' not found')"),
        ("console.log('[GameplayScene] Preparing boss:', bossId)", "debugLog('[GameplayScene] Preparing boss:', bossId)"),
        ("console.error('[GameplayScene] Unknown boss ID:', bossId)", "debugError('[GameplayScene] Unknown boss ID:', bossId)"),
        ("console.log('[GameplayScene] Boss spawned:', bossConfig.name)", "debugLog('[GameplayScene] Boss spawned:', bossConfig.name)"),
        ("console.log('[GameplayScene] Boss defeated!')", "debugLog('[GameplayScene] Boss defeated!')"),
        ("console.log('[GameplayScene] Level', currentWorld, '-', currentLevel, ' complete!')", "debugLog('[GameplayScene] Level', currentWorld, '-', currentLevel, ' complete!')"),
        ("console.log('[GameplayScene] Progression data loaded')", "debugLog('[GameplayScene] Progression data loaded')"),
        ("console.error('[GameplayScene] Failed to setup campaign mode:', error)", "debugError('[GameplayScene] Failed to setup campaign mode:', error)"),
        ("console.log('[GameplayScene] Campaign mode: World', currentWorld, ', Level', currentLevel)", "debugLog('[GameplayScene] Campaign mode: World', currentWorld, ', Level', currentLevel)"),
        ("console.log('Restarting game...')", "debugLog('Restarting game...')"),
    ]),
    ('src/scenes/EndlessGameplayScene.ts', [
        ("console.log('EndlessGameplayScene created - Phase 6 Online ready!')", "debugLog('EndlessGameplayScene created - Phase 6 Online ready!')"),
        ("console.log('[EndlessGameplayScene] Progression data loaded')", "debugLog('[EndlessGameplayScene] Progression data loaded')"),
        ("console.error('[EndlessGameplayScene] Failed to load progression data:', error)", "debugError('[EndlessGameplayScene] Failed to load progression data:', error)"),
        ("console.warn('[EndlessGameplayScene] Supabase not available, skipping score submission')", "debugWarn('[EndlessGameplayScene] Supabase not available, skipping score submission')"),
        ("console.log('[EndlessGameplayScene] Score submitted successfully:', result)", "debugLog('[EndlessGameplayScene] Score submitted successfully:', result)"),
        ("console.warn('[EndlessGameplayScene] Failed to submit score')", "debugWarn('[EndlessGameplayScene] Failed to submit score')"),
        ("console.log('Restarting endless game...')", "debugLog('Restarting endless game...')"),
    ]),
    ('src/scenes/GameOverScene.ts', [
        ("console.log('GameOverScene created with stats:', this.finalStats)", "debugLog('GameOverScene created with stats:', this.finalStats)"),
        ("console.log('Retrying game...')", "debugLog('Retrying game...')"),
        ("console.log('Going to menu...')", "debugLog('Going to menu...')"),
    ]),
    ('src/scenes/LeaderboardScene.ts', [
        ("console.log('LeaderboardScene created - Phase 6 Online ready!')", "debugLog('LeaderboardScene created - Phase 6 Online ready!')"),
        ("console.error('[LeaderboardScene] Failed to load leaderboard:', error)", "debugError('[LeaderboardScene] Failed to load leaderboard:', error)"),
    ]),
    ('src/scenes/CharacterScene.ts', [
        ("console.log('Weapon equipped:', this.currentWeapon.name)", "debugLog('Weapon equipped:', this.currentWeapon.name)"),
        ("console.log('Weapon upgraded to tier', this.currentTier)", "debugLog('Weapon upgraded to tier', this.currentTier)"),
        ("console.log('Switch weapon triggered - comparison view handles switching')", "debugLog('Switch weapon triggered - comparison view handles switching')"),
    ]),
    ('src/managers/SaveManager.ts', [
        ("console.error('[SaveManager] Failed to load save:', error)", "debugError('[SaveManager] Failed to load save:', error)"),
        ("console.error('[SaveManager] Failed to save:', error)", "debugError('[SaveManager] Failed to save:', error)"),
        ("console.error('[SaveManager] Failed to import save:', error)", "debugError('[SaveManager] Failed to import save:', error)"),
        ("console.error('[SaveManager] Failed to load settings:', error)", "debugError('[SaveManager] Failed to load settings:', error)"),
        ("console.error('[SaveManager] Failed to save settings:', error)", "debugError('[SaveManager] Failed to save settings:', error)"),
    ]),
    ('src/managers/LevelManager.ts', [
        ("console.log('[LevelManager] Loaded', this.levels.size, 'levels,', this.worlds.size, 'worlds,', this.bosses.size, 'bosses')", "debugLog('[LevelManager] Loaded', this.levels.size, 'levels,', this.worlds.size, 'worlds,', this.bosses.size, 'bosses')"),
        ("console.error('[LevelManager] Failed to load levels:', error)", "debugError('[LevelManager] Failed to load levels:', error)"),
        ("console.error('[LevelManager] Level', world, '-', level, ' not found')", "debugError('[LevelManager] Level', world, '-', level, ' not found')"),
        ("console.log('[LevelManager] Level', levelId, ' completed with', stars, 'stars, earned', soulsReward, 'souls')", "debugLog('[LevelManager] Level', levelId, ' completed with', stars, 'stars, earned', soulsReward, 'souls')"),
    ]),
    ('src/managers/WeaponManager.ts', [
        ("console.log('[WeaponManager] getAllWeapons called, weapons map size:', this.weapons.size)", "debugLog('[WeaponManager] getAllWeapons called, weapons map size:', this.weapons.size)"),
        ("console.log('[WeaponManager] Weapons in map:', Array.from(this.weapons.keys()))", "debugLog('[WeaponManager] Weapons in map:', Array.from(this.weapons.keys()))"),
        ("console.warn('[WeaponManager] Cannot equip unknown weapon:', weaponId)", "debugWarn('[WeaponManager] Cannot equip unknown weapon:', weaponId)"),
        ("console.warn('[WeaponManager] Cannot upgrade unknown weapon:', weaponId)", "debugWarn('[WeaponManager] Cannot upgrade unknown weapon:', weaponId)"),
        ("console.warn('[WeaponManager] Weapon already at max tier:', weaponId)", "debugWarn('[WeaponManager] Weapon already at max tier:', weaponId)"),
    ]),
    ('src/managers/AudioManager.ts', [
        ("console.log('[AudioManager] Audio unlocked')", "debugLog('[AudioManager] Audio unlocked')"),
        ("console.warn('[AudioManager] Music not found:', key)", "debugWarn('[AudioManager] Music not found:', key)"),
        ("console.warn('[AudioManager] Music not found:', newKey)", "debugWarn('[AudioManager] Music not found:', newKey)"),
        ("console.warn('[AudioManager] SFX not found:', key)", "debugWarn('[AudioManager] SFX not found:', key)"),
    ]),
    ('src/managers/ShopManager.ts', [
        ("console.warn('[ShopManager] Weapon already owned:', weaponId)", "debugWarn('[ShopManager] Weapon already owned:', weaponId)"),
        ("console.warn('[ShopManager] Cannot afford weapon:', weaponId, 'cost:', cost)", "debugWarn('[ShopManager] Cannot afford weapon:', weaponId, 'cost:', cost)"),
        ("console.warn('[ShopManager] Cannot upgrade unowned weapon:', weaponId)", "debugWarn('[ShopManager] Cannot upgrade unowned weapon:', weaponId)"),
        ("console.warn('[ShopManager] Cannot afford weapon upgrade:', weaponId, 'tier:', currentTier, 'cost:', cost)", "debugWarn('[ShopManager] Cannot afford weapon upgrade:', weaponId, 'tier:', currentTier, 'cost:', cost)"),
        ("console.warn('[ShopManager] Upgrade already at max tier:', upgradeId)", "debugWarn('[ShopManager] Upgrade already at max tier:', upgradeId)"),
        ("console.warn('[ShopManager] Cannot afford upgrade:', upgradeId, 'tier:', currentTier, 'cost:', cost)", "debugWarn('[ShopManager] Cannot afford upgrade:', upgradeId, 'tier:', currentTier, 'cost:', cost)"),
    ]),
    ('src/managers/UpgradeManager.ts', [
        ("console.log('[UpgradeManager] Loaded', this.upgrades.size, 'upgrades')", "debugLog('[UpgradeManager] Loaded', this.upgrades.size, 'upgrades')"),
        ("console.warn('[UpgradeManager] Cannot purchase unknown upgrade:', upgradeId)", "debugWarn('[UpgradeManager] Cannot purchase unknown upgrade:', upgradeId)"),
        ("console.warn('[UpgradeManager] Upgrade already at max tier:', upgradeId)", "debugWarn('[UpgradeManager] Upgrade already at max tier:', upgradeId)"),
    ]),
    ('src/managers/ThemeManager.ts', [
        ("console.error('Invalid theme configuration provided')", "debugError('Invalid theme configuration provided')"),
        ("console.error('Theme validation error:', error)", "debugError('Theme validation error:', error)"),
    ]),
    ('src/services/SupabaseService.ts', [
        ("console.warn('[SupabaseService] Missing Supabase credentials. Online features disabled.')", "debugWarn('[SupabaseService] Missing Supabase credentials. Online features disabled.')"),
        ("console.log('[SupabaseService] Initialized')", "debugLog('[SupabaseService] Initialized')"),
        ("console.error('[SupabaseService] Anonymous sign-in failed:', error)", "debugError('[SupabaseService] Anonymous sign-in failed:', error)"),
        ("console.error('[SupabaseService] Failed to get user:', error)", "debugError('[SupabaseService] Failed to get user:', error)"),
        ("console.error('[SupabaseService] Sign out failed:', error)", "debugError('[SupabaseService] Sign out failed:', error)"),
        ("console.warn('[SupabaseService] Cannot submit score: not initialized')", "debugWarn('[SupabaseService] Cannot submit score: not initialized')"),
        ("console.error('[SupabaseService] Failed to submit score:', error)", "debugError('[SupabaseService] Failed to submit score:', error)"),
        ("console.error('[SupabaseService] Failed to get leaderboard:', error)", "debugError('[SupabaseService] Failed to get leaderboard:', error)"),
        ("console.error('[SupabaseService] Failed to get rank:', error)", "debugError('[SupabaseService] Failed to get rank:', error)"),
        ("console.error('[SupabaseService] Failed to get personal bests:', error)", "debugError('[SupabaseService] Failed to get personal bests:', error)"),
        ("console.warn('[SupabaseService] Cannot save to cloud: not authenticated')", "debugWarn('[SupabaseService] Cannot save to cloud: not authenticated')"),
        ("console.log('[SupabaseService] Cloud save successful')", "debugLog('[SupabaseService] Cloud save successful')"),
        ("console.error('[SupabaseService] Cloud save failed:', error)", "debugError('[SupabaseService] Cloud save failed:', error)"),
        ("console.warn('[SupabaseService] Cannot load from cloud: not authenticated')", "debugWarn('[SupabaseService] Cannot load from cloud: not authenticated')"),
        ("console.error('[SupabaseService] Cloud load failed:', error)", "debugError('[SupabaseService] Cloud load failed:', error)"),
        ("console.error('[SupabaseService] Failed to delete cloud save:', error)", "debugError('[SupabaseService] Failed to delete cloud save:', error)"),
    ]),
    ('src/utils/ObjectPool.ts', [
        ("console.warn('[ObjectPool] Pool exhausted, max size reached')", "debugWarn('[ObjectPool] Pool exhausted, max size reached')"),
        ("console.warn('[ObjectPool] Attempting to release object not from this pool')", "debugWarn('[ObjectPool] Attempting to release object not from this pool')"),
    ]),
    ('src/utils/DataLoader.ts', [
        ("console.error('[DataLoader] Failed to load weapons:', error)", "debugError('[DataLoader] Failed to load weapons:', error)"),
        ("console.error('[DataLoader] Failed to load upgrades:', error)", "debugError('[DataLoader] Failed to load upgrades:', error)"),
        ("console.error('[DataLoader] Failed to load levels:', error)", "debugError('[DataLoader] Failed to load levels:', error)"),
    ]),
    ('src/entities/Vampire.ts', [
        ("console.warn('Vampire half textures not found, skipping split effect')", "debugWarn('Vampire half textures not found, skipping split effect')"),
        ("console.warn('Vampire bat texture not found, skipping bat burst effect')", "debugWarn('Vampire bat texture not found, skipping bat burst effect')"),
    ]),
    ('src/entities/Zombie.ts', [
        ("console.warn('Zombie half textures not found, skipping split effect')", "debugWarn('Zombie half textures not found, skipping split effect')"),
    ]),
    ('src/entities/Boss.ts', [
        ("console.log('[Boss]', bossConfig.name, 'spawned at', x, ',', y, ')')", "debugLog('[Boss]', bossConfig.name, 'spawned at', x, ',', y, ')')"),
        ("console.log('[Boss]', bossConfig.name, 'entered phase', phase)", "debugLog('[Boss]', bossConfig.name, 'entered phase', phase)"),
        ("console.log('[Boss]', bossConfig.name, 'attacks with pattern:', attackPattern)", "debugLog('[Boss]', bossConfig.name, 'attacks with pattern:', attackPattern)"),
        ("console.log('[Boss]', bossConfig.name, 'spawned', minionType, 'minions')", "debugLog('[Boss]', bossConfig.name, 'spawned', minionType, 'minions')"),
        ("console.log('[Boss]', bossConfig.name, 'defeated')", "debugLog('[Boss]', bossConfig.name, 'defeated')"),
    ]),
]

# Add import statement to each file
import_statement = "import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';\n\n"

# Process each file
for filepath, replacements in files_to_update:
    if not os.path.exists(filepath):
        print(f'Skipping (not found): {filepath}')
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add import after existing imports
    if 'import { debugLog' not in content:
        # Find the last import line and add after it
        lines = content.split('\n')
        import_inserted = False
        new_lines = []
        
        for i, line in enumerate(lines):
            if import_inserted:
                new_lines.append(line)
            elif line.strip().startswith('import ') and not import_inserted:
                new_lines.append(line)
                new_lines.append(import_statement)
                import_inserted = True
            else:
                new_lines.append(line)
        
        content = '\n'.join(new_lines)
        
        # Apply replacements
        for pattern, replacement in replacements:
            content = content.replace(pattern, replacement)
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated: {filepath}')
    else:
        print(f'Skipping (already has import): {filepath}')

print('All console.log replacements completed')
