with open('src/systems/SpawnSystem.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add setDifficultyModifiers method after setSpawnPattern method
old_method = """  setSpawnPattern(pattern: SpawnPattern): void {
    this.spawnPattern = pattern;
  }

  /**
   * Spawn a new entity (monster or villager)
   */"""

new_method = """  setSpawnPattern(pattern: SpawnPattern): void {
    this.spawnPattern = pattern;
  }

  /**
   * Set difficulty modifiers for endless mode
   */
  setDifficultyModifiers(modifiers: {
    spawnRateMultiplier: number;
    speedMultiplier: number;
    villagerChance: number;
  }): void {
    // Apply spawn rate multiplier
    this.spawnInterval = Math.max(
      this.minSpawnInterval,
      this.spawnInterval / modifiers.spawnRateMultiplier
    );

    // Store villager chance for spawnEntity
    (this as any).difficultyVillagerChance = modifiers.villagerChance;
  }

  /**
   * Spawn a new entity (monster or villager)
   */"""

content = content.replace(old_method, new_method)

# Update spawnEntity to use difficultyVillagerChance if set
old_spawn_entity = """  private spawnEntity(): void {
    // Calculate villager spawn chance (use level config if available)
    const gameTimeSeconds = this.elapsedTime / 1000;
    let villagerChance = Math.min(0.05 + (gameTimeSeconds / 120), 0.15);
    
    // Use level-specific villager chance if in campaign mode
    if (this.levelConfig) {
      villagerChance = this.levelConfig.villagerChance;
    }"""

new_spawn_entity = """  private spawnEntity(): void {
    // Calculate villager spawn chance (use level config if available)
    const gameTimeSeconds = this.elapsedTime / 1000;
    let villagerChance = Math.min(0.05 + (gameTimeSeconds / 120), 0.15);

    // Use difficulty modifier if set
    if ((this as any).difficultyVillagerChance !== undefined) {
      villagerChance = (this as any).difficultyVillagerChance;
    }
    
    // Use level-specific villager chance if in campaign mode
    if (this.levelConfig) {
      villagerChance = this.levelConfig.villagerChance;
    }"""

content = content.replace(old_spawn_entity, new_spawn_entity)

with open('src/systems/SpawnSystem.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed SpawnSystem.ts')
