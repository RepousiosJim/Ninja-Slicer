with open('src/entities/Villager.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add spawn method after the constructor
old_text = """    this.createAnimations(texture);
  }

  /**
   * Create villager animations
   */"""
new_text = """    this.createAnimations(texture);
  }

  /**
   * Spawn the villager with velocity
   */
  spawn(x: number, y: number, velocityX: number, velocityY: number): void {
    this.setPosition(x, y);
    this.setVelocity(velocityX, velocityY);
  }

  /**
   * Create villager animations
   */"""

content = content.replace(old_text, new_text)

with open('src/entities/Villager.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed Villager.ts')
