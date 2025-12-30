import os

# Add Phaser import to ThemeUtils.ts
filepath = 'src/utils/ThemeUtils.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Phaser import after the comment block
if "import Phaser from 'phaser';" not in content:
    content = content.replace(
        "import { ThemeConfig, GradientPalette, ShadowConfig } from '../config/types';",
        "import Phaser from 'phaser';\nimport { ThemeConfig, GradientPalette, ShadowConfig } from '../config/types';"
    )
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated: {filepath}')
else:
    print(f'Skipping (already has import): {filepath}')
