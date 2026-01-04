/**
 * Inventory Scene
 *
 * Enhanced inventory screen with filtering, sorting, weapon comparison,
 * details modal, pagination, and thematic UI elements.
 */

import { MessageDisplay } from '../utils/MessageDisplay';
import { SCENE_KEYS, TEXTURE_KEYS, COLORS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import { Button, ButtonStyle } from '../ui/Button';
import { SaveManager } from '../managers/SaveManager';
import { WeaponManager } from '../managers/WeaponManager';
import { AudioManager } from '../managers/AudioManager';
import { debugLog } from '../utils/DebugLogger';
import type { WeaponId, WeaponConfig, WeaponRarity } from '../config/types';
import type { WeaponCardConfig } from '../ui/WeaponCard';
import { WeaponCard } from '../ui/WeaponCard';
import { FilterBar, FilterType, SortType } from '../ui/FilterBar';
import { ComparisonView } from '../ui/ComparisonView';
import { WeaponDetailsModal } from '../ui/WeaponDetailsModal';

/**
 * Weapon type enum for filtering
 */
enum WeaponType {
  MELEE = 'melee',
  MAGIC = 'magic',
  ELEMENTAL = 'elemental',
}

/**
 * Get weapon type from weapon ID
 */
function getWeaponType(weaponId: string): WeaponType {
  if (weaponId.includes('sword') || weaponId.includes('blade') || weaponId.includes('katana')) {
    return WeaponType.MELEE;
  } else if (weaponId.includes('holy') || weaponId.includes('cross')) {
    return WeaponType.MAGIC;
  } else if (weaponId.includes('fire') || weaponId.includes('ice') || weaponId.includes('lightning')) {
    return WeaponType.ELEMENTAL;
  }
  return WeaponType.MELEE;
}

/**
 * Inventory Scene
 */
export class InventoryScene extends Phaser.Scene {
  // UI elements
  private title: Phaser.GameObjects.Text | null = null;
  private weaponCards: Map<string, WeaponCard> = new Map();
  private backButton: Button | null = null;
  private background: Phaser.GameObjects.Rectangle | null = null;
  private filterBar: FilterBar | null = null;
  private comparisonView: ComparisonView | null = null;
  private detailsModal: WeaponDetailsModal | null = null;
  private paginationContainer: Phaser.GameObjects.Container | null = null;
  private actionButtonsContainer: Phaser.GameObjects.Container | null = null;
  private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  // Managers
  private saveManager: SaveManager;
  private weaponManager: WeaponManager;
  private audioManager: AudioManager;

  // Grid configuration
  private readonly GRID_COLS = 3;
  private readonly GRID_ROWS = 2;
  private readonly CARD_WIDTH = 200;
  private readonly CARD_HEIGHT = 280;
  private readonly CARD_SPACING = 20;

  // Pagination
  private currentPage: number = 1;
  private itemsPerPage: number = 6;
  private totalPages: number = 1;
  private filteredWeapons: WeaponConfig[] = [];

  // State
  private selectedWeaponId: WeaponId | null = null;
  private comparisonWeaponId: WeaponId | null = null;

  constructor() {
    super({ key: SCENE_KEYS.inventory });
    this.saveManager = new SaveManager();
    this.weaponManager = WeaponManager.getInstance();
    this.audioManager = new AudioManager(this);
  }

  /**
   * Create scene
   */
  public create(): void {
    // Create background with thematic elements
    this.createBackground();

    // Create title
    this.createTitle();

    // Create filter bar
    this.createFilterBar();

    // Create weapon grid
    this.createWeaponGrid();

    // Create pagination controls
    this.createPagination();

    // Create action buttons
    this.createActionButtons();

    // Create particle effects
    this.createParticleEffects();

    // Animate elements in
    this.animateIn();
  }

  /**
   * Create background with thematic elements
   */
  private createBackground(): void {
    // Main background
    this.background = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      COLORS.background,
    );

    // Add subtle gradient overlay
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x2a2a4a, 0x2a2a4a, 1);
    gradient.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    gradient.setAlpha(0.3);
  }

  /**
   * Create title with thematic styling
   */
  private createTitle(): void {
    this.title = this.add.text(
      this.cameras.main.width / 2,
      60,
      'INVENTORY',
      {
        fontSize: `${FONT_SIZES.title}px`,
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#8b0000',
        strokeThickness: 8,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 5,
          fill: true,
        },
      },
    );

    this.title.setOrigin(0.5);
    this.title.setAlpha(0);

    this.tweens.add({
      targets: this.title,
      alpha: 1,
      y: 70,
      duration: UI_ANIMATION_DURATION * 2,
      ease: 'Power2',
    });
  }

  /**
   * Create filter bar
   */
  private createFilterBar(): void {
    this.filterBar = new FilterBar(this, this.cameras.main.width / 2, 140, {
      width: 800,
      height: 50,
      onFilterChange: this.onFilterChange.bind(this),
      onSortChange: this.onSortChange.bind(this),
    });

    this.filterBar.setAlpha(0);
    this.add.existing(this.filterBar);

    this.tweens.add({
      targets: this.filterBar,
      alpha: 1,
      duration: UI_ANIMATION_DURATION * 2,
      delay: UI_ANIMATION_DURATION,
      ease: 'Power2',
    });
  }

  /**
   * Create weapon grid
   */
  private createWeaponGrid(): void {
    const saveData = this.saveManager.getSaveData();
    const allWeapons = this.weaponManager.getAllWeapons();
    const equippedWeaponId = saveData.equippedWeapon;

    // DEBUG: Log weapon loading status
    debugLog('[InventoryScene] Creating weapon grid');
    debugLog('[InventoryScene] Number of weapons loaded:', allWeapons.length);
    debugLog('[InventoryScene] Weapons:', allWeapons.map(w => w.id));
    debugLog('[InventoryScene] Unlocked weapons:', saveData.unlockedWeapons);
    debugLog('[InventoryScene] Equipped weapon:', equippedWeaponId);

    // Apply initial filter
    this.applyFilter(FilterType.ALL);
  }

  /**
   * Apply filter to weapons
   */
  private applyFilter(filter: FilterType): void {
    const saveData = this.saveManager.getSaveData();
    const allWeapons = this.weaponManager.getAllWeapons();

    this.filteredWeapons = allWeapons.filter(weapon => {
      switch (filter) {
      case FilterType.ALL:
        return true;
      case FilterType.OWNED:
        return saveData.unlockedWeapons.includes(weapon.id as WeaponId);
      case FilterType.LOCKED:
        return !saveData.unlockedWeapons.includes(weapon.id as WeaponId);
      case FilterType.TYPE_MELEE:
        return getWeaponType(weapon.id) === WeaponType.MELEE;
      case FilterType.TYPE_MAGIC:
        return getWeaponType(weapon.id) === WeaponType.MAGIC;
      case FilterType.TYPE_ELEMENTAL:
        return getWeaponType(weapon.id) === WeaponType.ELEMENTAL;
      case FilterType.RARITY_COMMON:
        return weapon.rarity === 'common';
      case FilterType.RARITY_UNCOMMON:
        return weapon.rarity === 'uncommon';
      case FilterType.RARITY_RARE:
        return weapon.rarity === 'rare';
      case FilterType.RARITY_EPIC:
        return weapon.rarity === 'epic';
      case FilterType.RARITY_LEGENDARY:
        return weapon.rarity === 'legendary';
      default:
        return true;
      }
    });

    // Reset to first page
    this.currentPage = 1;
    this.updatePagination();
    this.renderWeaponCards();
  }

  /**
   * Apply sort to weapons
   */
  private applySort(sort: SortType): void {
    switch (sort) {
    case SortType.NAME:
      this.filteredWeapons.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case SortType.RARITY:
      const rarityOrder: Record<WeaponRarity, number> = {
        common: 0,
        uncommon: 1,
        rare: 2,
        epic: 3,
        legendary: 4,
      };
      this.filteredWeapons.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
      break;
    case SortType.TIER:
      const saveData = this.saveManager.getSaveData();
      this.filteredWeapons.sort((a, b) => {
        const tierA = saveData.weaponTiers[a.id] || 1;
        const tierB = saveData.weaponTiers[b.id] || 1;
        return tierB - tierA;
      });
      break;
    case SortType.EFFECTIVENESS:
      this.filteredWeapons.sort((a, b) => {
        const effectivenessA = a.effectiveAgainst ? 80 : 40;
        const effectivenessB = b.effectiveAgainst ? 80 : 40;
        return effectivenessB - effectivenessA;
      });
      break;
    }

    this.currentPage = 1;
    this.updatePagination();
    this.renderWeaponCards();
  }

  /**
   * Render weapon cards for current page
   */
  private renderWeaponCards(): void {
    // Clear existing cards
    this.weaponCards.forEach(card => {
      card.destroy();
    });
    this.weaponCards.clear();

    const saveData = this.saveManager.getSaveData();
    const equippedWeaponId = saveData.equippedWeapon;

    // Calculate grid dimensions
    const gridWidth = this.GRID_COLS * (this.CARD_WIDTH + this.CARD_SPACING) - this.CARD_SPACING;
    const gridHeight = this.GRID_ROWS * (this.CARD_HEIGHT + this.CARD_SPACING) - this.CARD_SPACING;
    const startX = (this.cameras.main.width - gridWidth) / 2 + this.CARD_WIDTH / 2;
    const startY = (this.cameras.main.height - gridHeight) / 2 + this.CARD_HEIGHT / 2 + 50;

    // Get weapons for current page
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageWeapons = this.filteredWeapons.slice(startIndex, endIndex);

    // Create weapon cards
    pageWeapons.forEach((weapon, index) => {
      const row = Math.floor(index / this.GRID_COLS);
      const col = index % this.GRID_COLS;

      const x = startX + col * (this.CARD_WIDTH + this.CARD_SPACING);
      const y = startY + row * (this.CARD_HEIGHT + this.CARD_SPACING);

      const isUnlocked = saveData.unlockedWeapons.includes(weapon.id as WeaponId);
      const isEquipped = weapon.id === equippedWeaponId;
      const weaponTier = saveData.weaponTiers[weapon.id] || 1;

      const card = this.createWeaponCard(weapon, x, y, isUnlocked, isEquipped, weaponTier);
      this.weaponCards.set(weapon.id, card);
    });
  }

  /**
   * Create a single weapon card
   */
  private createWeaponCard(
    weapon: WeaponConfig,
    x: number,
    y: number,
    isUnlocked: boolean,
    isEquipped: boolean,
    weaponTier: number,
  ): WeaponCard {
    const config: WeaponCardConfig = {
      weapon: weapon,
      tier: weaponTier,
      locked: !isUnlocked,
      equipped: isEquipped,
      onClick: () => this.onWeaponSelect(weapon.id as WeaponId, isUnlocked),
      onEquip: () => this.onWeaponEquip(weapon.id as WeaponId),
      onDetails: () => this.onWeaponDetails(weapon.id as WeaponId, weaponTier),
    };

    const card = new WeaponCard(this, x, y, this.CARD_WIDTH, this.CARD_HEIGHT, config);
    card.setAlpha(0);

    // Animate in
    this.tweens.add({
      targets: card,
      alpha: 1,
      duration: UI_ANIMATION_DURATION * 2,
      delay: UI_ANIMATION_DURATION * (1 + this.weaponCards.size * 0.1),
      ease: 'Power2',
    });

    this.add.existing(card);
    return card;
  }

  /**
   * Handle filter change
   */
  private onFilterChange(filter: FilterType): void {
    this.audioManager.playSFX('uiClick');
    this.applyFilter(filter);
  }

  /**
   * Handle sort change
   */
  private onSortChange(sort: SortType): void {
    this.audioManager.playSFX('uiClick');
    this.applySort(sort);
  }

  /**
   * Handle weapon selection
   */
  private onWeaponSelect(weaponId: WeaponId, isUnlocked: boolean): void {
    this.audioManager.playSFX('uiClick');
    this.selectedWeaponId = weaponId;

    if (!isUnlocked) {
      // Show buy option for locked weapons
      this.showBuyOption(weaponId);
      return;
    }

    // Update card selection states
    this.weaponCards.forEach((card, id) => {
      card.setEquipped(id === weaponId);
    });
  }

  /**
   * Handle weapon equip
   */
  private onWeaponEquip(weaponId: WeaponId): void {
    this.audioManager.playSFX('uiClick');

    // Equip weapon
    this.weaponManager.equipWeapon(weaponId);

    // Update card selection states
    this.weaponCards.forEach((card, id) => {
      card.setEquipped(id === weaponId);
    });

    // Show equipped message using MessageDisplay
    MessageDisplay.showEquipped(this);
  }

  /**
   * Handle weapon details
   */
  private onWeaponDetails(weaponId: WeaponId, tier: number): void {
    this.audioManager.playSFX('uiClick');

    const weapon = this.weaponManager.getWeaponConfig(weaponId);
    if (!weapon) return;

    // Close existing modal
    if (this.detailsModal) {
      this.detailsModal.destroy();
      this.detailsModal = null;
    }

    // Create details modal
    this.detailsModal = new WeaponDetailsModal(this, this.cameras.main.width / 2, this.cameras.main.height / 2, {
      weapon: weapon,
      tier: tier,
      maxTier: weapon.tiers.length,
      onEquip: () => {
        this.onWeaponEquip(weaponId);
        this.detailsModal?.close();
      },
      onUpgrade: () => {
        this.onWeaponUpgrade(weaponId);
        this.detailsModal?.close();
      },
      onClose: () => {
        this.detailsModal?.destroy();
        this.detailsModal = null;
      },
    });

    this.add.existing(this.detailsModal);
    this.detailsModal.open();
  }

  /**
   * Handle weapon upgrade
   */
  private onWeaponUpgrade(weaponId: WeaponId): void {
    this.audioManager.playSFX('uiClick');

    const success = this.weaponManager.upgradeWeapon(weaponId);
    if (success) {
      MessageDisplay.showUpgraded(this);
      this.renderWeaponCards();
    } else {
      MessageDisplay.showUpgradeFailed(this);
    }
  }

  /**
   * Show buy option for locked weapon
   */
  private showBuyOption(weaponId: WeaponId): void {
    const weapon = this.weaponManager.getWeaponConfig(weaponId);
    if (!weapon) return;

    const unlockCost = weapon.unlockCost || 0;
    const saveData = this.saveManager.getSaveData();
    const canAfford = saveData.souls >= unlockCost;

    const message = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 150,
      `UNLOCK COST: ${unlockCost} SOULS`,
      {
        fontSize: `${FONT_SIZES.medium}px`,
        color: canAfford ? '#44ff44' : '#ff4444',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      },
    );

    message.setOrigin(0.5);
    message.setAlpha(0);

    this.tweens.add({
      targets: message,
      alpha: 1,
      duration: UI_ANIMATION_DURATION,
      yoyo: true,
      hold: 2000,
      onComplete: () => {
        message.destroy();
      },
    });

    // Add buy button
    const buyButton = new Button(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height - 100,
      150,
      40,
      'BUY',
      {
        style: canAfford ? ButtonStyle.PRIMARY : ButtonStyle.DISABLED,
        fontSize: FONT_SIZES.small,
        onClick: () => {
          if (canAfford) {
            this.onWeaponBuy(weaponId, unlockCost);
          }
          message.destroy();
          buyButton.destroy();
        },
      },
    );

    this.add.existing(buyButton);
  }

  /**
   * Handle weapon buy
   */
  private onWeaponBuy(weaponId: WeaponId, cost: number): void {
    this.audioManager.playSFX('uiClick');

    if (this.saveManager.spendSouls(cost)) {
      // Unlock weapon
      this.saveManager.purchaseWeapon(weaponId);

      // Refresh display
      this.renderWeaponCards();
      MessageDisplay.showUnlocked(this);
    }
  }

  /**
   * Create pagination controls
   */
  private createPagination(): void {
    this.paginationContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height - 180);
    this.paginationContainer.setAlpha(0);

    // Previous button
    const prevButton = new Button(
      this,
      -100,
      0,
      80,
      35,
      'PREV',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: () => this.onPreviousPage(),
      },
    );
    this.paginationContainer.add(prevButton);

    // Page indicator
    const pageText = this.add.text(0, 0, `Page ${this.currentPage} of ${this.totalPages}`, {
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    pageText.setOrigin(0.5);
    this.paginationContainer.add(pageText);
    (this.paginationContainer as any).pageText = pageText;

    // Next button
    const nextButton = new Button(
      this,
      100,
      0,
      80,
      35,
      'NEXT',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: () => this.onNextPage(),
      },
    );
    this.paginationContainer.add(nextButton);

    this.tweens.add({
      targets: this.paginationContainer,
      alpha: 1,
      duration: UI_ANIMATION_DURATION * 2,
      delay: UI_ANIMATION_DURATION * 2,
      ease: 'Power2',
    });
  }

  /**
   * Update pagination
   */
  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredWeapons.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;

    if (this.paginationContainer) {
      const pageText = (this.paginationContainer as any).pageText as Phaser.GameObjects.Text;
      if (pageText) {
        pageText.setText(`Page ${this.currentPage} of ${this.totalPages}`);
      }
    }
  }

  /**
   * Handle previous page
   */
  private onPreviousPage(): void {
    this.audioManager.playSFX('uiClick');

    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      this.renderWeaponCards();
    }
  }

  /**
   * Handle next page
   */
  private onNextPage(): void {
    this.audioManager.playSFX('uiClick');

    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      this.renderWeaponCards();
    }
  }

  /**
   * Create action buttons
   */
  private createActionButtons(): void {
    this.actionButtonsContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height - 60);
    this.actionButtonsContainer.setAlpha(0);

    // Compare button
    const compareButton = new Button(
      this,
      -100,
      0,
      150,
      40,
      'COMPARE',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: () => this.onCompareClick(),
      },
    );
    this.actionButtonsContainer.add(compareButton);

    // Back button
    this.backButton = new Button(
      this,
      100,
      0,
      150,
      40,
      'BACK',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onBack.bind(this),
      },
    );
    this.actionButtonsContainer.add(this.backButton);

    this.tweens.add({
      targets: this.actionButtonsContainer,
      alpha: 1,
      duration: UI_ANIMATION_DURATION * 2,
      delay: UI_ANIMATION_DURATION * 3,
      ease: 'Power2',
    });
  }

  /**
   * Handle compare button click
   */
  private onCompareClick(): void {
    this.audioManager.playSFX('uiClick');

    if (!this.selectedWeaponId) {
      MessageDisplay.showSelectWeapon(this);
      return;
    }

    const saveData = this.saveManager.getSaveData();
    const equippedWeaponId = saveData.equippedWeapon as WeaponId;

    if (this.selectedWeaponId === equippedWeaponId) {
      MessageDisplay.showSelectDifferentWeapon(this);
      return;
    }

    const weapon1 = this.weaponManager.getWeaponConfig(equippedWeaponId);
    const weapon2 = this.weaponManager.getWeaponConfig(this.selectedWeaponId);

    if (!weapon1 || !weapon2) return;

    const tier1 = saveData.weaponTiers[equippedWeaponId] || 1;
    const tier2 = saveData.weaponTiers[this.selectedWeaponId] || 1;

    // Close existing comparison view
    if (this.comparisonView) {
      this.comparisonView.destroy();
      this.comparisonView = null;
    }

    // Create comparison view
    this.comparisonView = new ComparisonView(this, this.cameras.main.width / 2, this.cameras.main.height / 2, {
      weapon1: weapon1,
      weapon1Tier: tier1,
      weapon2: weapon2,
      weapon2Tier: tier2,
      onSwitch: () => {
        this.onWeaponEquip(this.selectedWeaponId!);
        this.comparisonView?.close();
      },
      onClose: () => {
        this.comparisonView?.destroy();
        this.comparisonView = null;
      },
    });

    this.add.existing(this.comparisonView);
  }

  /**
   * Create particle effects
   */
  private createParticleEffects(): void {
    // Create ambient particle emitter for supernatural atmosphere
    this.particleEmitter = this.add.particles(0, 0, 'ui_soul_icon', {
      x: { min: 0, max: this.cameras.main.width },
      y: { min: 0, max: this.cameras.main.height },
      speedX: { min: -20, max: 20 },
      speedY: { min: -50, max: -10 },
      scale: { start: 0.1, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 3000,
      frequency: 200,
      blendMode: 'ADD',
      tint: 0x8b0000,
    });

    this.particleEmitter.setDepth(-1);
  }

  /**
   * Animate elements in
   */
  private animateIn(): void {
    // Background fade in
    if (this.background) {
      this.background.setAlpha(0);
      this.tweens.add({
        targets: this.background,
        alpha: 1,
        duration: UI_ANIMATION_DURATION,
      });
    }
  }

  /**
   * Handle back button click
   */
  private onBack(): void {
    this.audioManager.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.character);
  }

  /**
   * Clean up scene resources
   */
  public destroy(): void {
    // Clean up weapon cards
    this.weaponCards.forEach(card => {
      card.destroy();
    });
    this.weaponCards.clear();

    // Clean up modals
    if (this.comparisonView) {
      this.comparisonView.destroy();
      this.comparisonView = null;
    }

    if (this.detailsModal) {
      this.detailsModal.destroy();
      this.detailsModal = null;
    }

    // Clean up particle emitter
    if (this.particleEmitter) {
      this.particleEmitter.destroy();
      this.particleEmitter = null;
    }

    // Clean up containers
    if (this.paginationContainer) {
      this.paginationContainer.destroy();
      this.paginationContainer = null;
    }

    if (this.actionButtonsContainer) {
      this.actionButtonsContainer.destroy();
      this.actionButtonsContainer = null;
    }

    // Clean up filter bar
    if (this.filterBar) {
      this.filterBar.destroy();
      this.filterBar = null;
    }
  }
}
