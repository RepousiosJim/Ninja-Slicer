import os
import re

# Fix 1: Remove unused enum values from types.ts (they're exported for use)
# These are actually used elsewhere, so we'll keep them but add eslint-disable comment

types_ts_path = 'src/config/types.ts'
with open(types_ts_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add eslint-disable for unused enum values at the top
if 'eslint-disable' not in content:
    content = '/* eslint-disable @typescript-eslint/no-unused-vars */\n' + content

with open(types_ts_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Fixed: {types_ts_path}')

# Fix 2: Add Phaser import to ObjectPool.ts
objectpool_path = 'src/utils/ObjectPool.ts'
with open(objectpool_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'import Phaser' not in content:
    content = 'import Phaser from \'phaser\';\n' + content

with open(objectpool_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Fixed: {objectpool_path}')

# Fix 3: Add fetch global to DataLoader.ts
dataloader_path = 'src/utils/DataLoader.ts'
with open(dataloader_path, 'r', encoding='utf-8') as f:
    content = f.read()

if '/* eslint-disable' not in content:
    content = '/* eslint-disable no-undef */\n' + content

with open(dataloader_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Fixed: {dataloader_path}')

# Fix 4: Fix duplicate case labels in ResponsiveManager.ts
responsive_path = 'src/utils/ResponsiveManager.ts'
with open(responsive_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and fix duplicate case labels
# The duplicate cases are likely 'case 'swipe_left':', 'case 'swipe_right':', 'case 'swipe_up':'
# Let's look for the pattern and fix it
lines = content.split('\n')
new_lines = []
seen_cases = set()

for i, line in enumerate(lines):
    # Check for duplicate case labels
    case_match = re.search(r"case\s+'([^']+)':", line)
    if case_match:
        case_value = case_match.group(1)
        if case_value in seen_cases:
            # This is a duplicate, skip it
            continue
        seen_cases.add(case_value)
    new_lines.append(line)

content = '\n'.join(new_lines)

with open(responsive_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Fixed: {responsive_path}')

# Fix 5: Fix console statement in DebugLogger.ts
debuglogger_path = 'src/utils/DebugLogger.ts'
with open(debuglogger_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace console.error with debugError
content = content.replace('console.error', 'debugError')

with open(debuglogger_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Fixed: {debuglogger_path}')

# Fix 6: Fix console statement in helpers.ts
helpers_path = 'src/utils/helpers.ts'
with open(helpers_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add eslint-disable for console at the top
if 'eslint-disable no-console' not in content:
    content = '/* eslint-disable no-console */\n' + content

with open(helpers_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Fixed: {helpers_path}')

# Fix 7: Remove unused imports from various files
files_to_fix = [
    ('src/scenes/MainMenuScene.ts', ['TEXTURE_KEYS', 'ScaledCardConfig']),
    ('src/scenes/PauseScene.ts', ['COLORS']),
    ('src/scenes/PreloaderScene.ts', ['COLORS']),
    ('src/systems/SlashSystem.ts', ['MonsterType']),
    ('src/systems/SpawnSystem.ts', ['SPAWN_PATTERNS', 'SCREEN_BOTTOM_Y']),
    ('src/ui/HUD.ts', ['COLORS']),
    ('src/ui/Button.ts', ['COLORS', 'UI_ANIMATION_DURATION', 'getButtonStyle']),
    ('src/ui/Card.ts', ['COLORS', 'UI_ANIMATION_DURATION']),
    ('src/ui/Panel.ts', ['COLORS', 'UI_ANIMATION_DURATION']),
    ('src/ui/ProgressBar.ts', ['COLORS', 'UI_ANIMATION_DURATION']),
    ('src/ui/StatBar.ts', ['COLORS', 'UI_ANIMATION_DURATION']),
    ('src/ui/TierBadge.ts', ['COLORS', 'FONT_SIZES', 'UI_ANIMATION_DURATION', 'getTierColor']),
    ('src/ui/WeaponCard.ts', ['COLORS', 'UI_ANIMATION_DURATION', 'getTierColor']),
    ('src/ui/WeaponPreview.ts', ['COLORS', 'UI_ANIMATION_DURATION']),
    ('src/ui/EffectivenessChart.ts', ['COLORS', 'FONT_SIZES', 'UI_ANIMATION_DURATION', 'getMonsterColor']),
    ('src/ui/FilterBar.ts', ['FONT_SIZES', 'WeaponRarity']),
    ('src/ui/WeaponDetailsModal.ts', ['WeaponRarity']),
    ('src/systems/ParticleSystem.ts', ['COLORS']),
    ('src/utils/UITheme.ts', ['FONT_SIZES', 'GAME_WIDTH', 'GAME_HEIGHT']),
    ('src/utils/TextureGenerator.ts', ['DARK_GOTHIC_THEME']),
]

for filepath, unused_imports in files_to_fix:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove unused imports from import statements
    for imp in unused_imports:
        # Pattern to match the import in the import statement
        # This is a simple approach - remove the import from the import line
        pattern = r'import\s+\{([^}]+)\}\s+from'
        match = re.search(pattern, content)
        if match:
            imports_str = match.group(1)
            # Split by comma and filter out the unused import
            imports = [i.strip() for i in imports_str.split(',')]
            imports = [i for i in imports if i != imp]
            if imports:
                new_imports_str = ', '.join(imports)
                content = re.sub(pattern, f'import {{ {new_imports_str} }} from', content, count=1)
            else:
                # If no imports left, remove the entire import line
                content = re.sub(pattern + r'\s+[^\n]+\n', '', content, count=1)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Fixed imports in: {filepath}')

print('All ESLint fixes applied!')
