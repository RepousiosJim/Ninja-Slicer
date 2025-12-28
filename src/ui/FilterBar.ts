/**
 * FilterBar Component
 *
 * A filter and sort control component for inventory.
 * Features filter buttons (All, Owned, Locked, by Type, by Rarity),
 * sort dropdown (Name, Rarity, Tier, Effectiveness),
 * active state indicators, smooth transitions,
 * and event emission for filter/sort changes.
 */

import Phaser from 'phaser';
import { COLORS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import { WeaponRarity } from '../config/types';

/**
 * Filter type enum
 */
export enum FilterType {
  ALL = 'all',
  OWNED = 'owned',
  LOCKED = 'locked',
  TYPE_MELEE = 'melee',
  TYPE_MAGIC = 'magic',
  TYPE_ELEMENTAL = 'elemental',
  RARITY_COMMON = 'common',
  RARITY_UNCOMMON = 'uncommon',
  RARITY_RARE = 'rare',
  RARITY_EPIC = 'epic',
  RARITY_LEGENDARY = 'legendary',
}

/**
 * Sort type enum
 */
export enum SortType {
  NAME = 'name',
  RARITY = 'rarity',
  TIER = 'tier',
  EFFECTIVENESS = 'effectiveness',
}

/**
 * Filter bar configuration interface
 */
export interface FilterBarConfig {
  width?: number;
  height?: number;
  onFilterChange?: (filter: FilterType) => void;
  onSortChange?: (sort: SortType) => void;
}

/**
 * Filter bar component for inventory controls
 */
export class FilterBar extends Phaser.GameObjects.Container {
  // UI elements
  private background: Phaser.GameObjects.Rectangle;
  private filterButtons: Phaser.GameObjects.Container[] = [];
  private sortDropdown: Phaser.GameObjects.Container | null = null;
  private sortText: Phaser.GameObjects.Text | null = null;
  private sortArrow: Phaser.GameObjects.Graphics | null = null;
  private sortMenu: Phaser.GameObjects.Container | null = null;

  // Filter state
  private currentFilter: FilterType;
  private currentSort: SortType;
  private barWidth: number;
  private barHeight: number;
  private isSortMenuOpen: boolean;

  // Callbacks
  private onFilterChangeCallback: ((filter: FilterType) => void) | null = null;
  private onSortChangeCallback: ((sort: SortType) => void) | null = null;

  /**
   * Create a new filter bar
   * @param scene - The scene this filter bar belongs to
   * @param x - X position
   * @param y - Y position
   * @param config - Filter bar configuration
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: FilterBarConfig = {}
  ) {
    super(scene, x, y);

    this.barWidth = config.width || 800;
    this.barHeight = config.height || 50;
    this.currentFilter = FilterType.ALL;
    this.currentSort = SortType.NAME;
    this.isSortMenuOpen = false;
    this.onFilterChangeCallback = config.onFilterChange || null;
    this.onSortChangeCallback = config.onSortChange || null;

    // Create background
    this.background = scene.add.rectangle(0, 0, this.barWidth, this.barHeight, 0x1a1a2e);
    this.background.setStrokeStyle(2, COLORS.accent);
    this.background.setAlpha(0.9);
    this.add(this.background);

    // Create filter buttons
    this.createFilterButtons();

    // Create sort dropdown
    this.createSortDropdown();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Create filter buttons
   */
  private createFilterButtons(): void {
    const filters = [
      { type: FilterType.ALL, label: 'All' },
      { type: FilterType.OWNED, label: 'Owned' },
      { type: FilterType.LOCKED, label: 'Locked' },
      { type: FilterType.TYPE_MELEE, label: 'Melee' },
      { type: FilterType.TYPE_MAGIC, label: 'Magic' },
      { type: FilterType.TYPE_ELEMENTAL, label: 'Elemental' },
    ];

    const buttonWidth = 80;
    const buttonHeight = 35;
    const buttonSpacing = 10;
    const startX = -this.barWidth / 2 + 20;

    filters.forEach((filter, index) => {
      const x = startX + index * (buttonWidth + buttonSpacing);
      const button = this.createFilterButton(x, 0, buttonWidth, buttonHeight, filter.label, filter.type);
      this.filterButtons.push(button);
      this.add(button);
    });
  }

  /**
   * Create a single filter button
   */
  private createFilterButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    filterType: FilterType
  ): Phaser.GameObjects.Container {
    const button = this.scene.add.container(x, y);

    // Create button background
    const background = this.scene.add.rectangle(0, 0, width, height, 0x2a2a4a);
    background.setStrokeStyle(2, 0x444444);
    background.setInteractive({ useHandCursor: true });
    button.add(background);

    // Create button text
    const text = this.scene.add.text(0, 0, label, {
      fontSize: '14px',
      color: '#CCCCCC',
    });
    text.setOrigin(0.5);
    button.add(text);

    // Store filter type
    (button as any).filterType = filterType;
    (button as any).background = background;
    (button as any).text = text;

    // Setup button interaction
    background.on('pointerover', () => this.onFilterButtonHover(button, true));
    background.on('pointerout', () => this.onFilterButtonHover(button, false));
    background.on('pointerdown', () => this.onFilterButtonClick(filterType));

    return button;
  }

  /**
   * Create sort dropdown
   */
  private createSortDropdown(): void {
    this.sortDropdown = this.scene.add.container(this.barWidth / 2 - 100, 0);

    // Create dropdown background
    const dropdownBg = this.scene.add.rectangle(0, 0, 150, 35, 0x2a2a4a);
    dropdownBg.setStrokeStyle(2, 0x444444);
    dropdownBg.setInteractive({ useHandCursor: true });
    this.sortDropdown.add(dropdownBg);

    // Create sort label
    const sortLabel = this.scene.add.text(-60, 0, 'Sort:', {
      fontSize: '14px',
      color: '#CCCCCC',
    });
    sortLabel.setOrigin(0, 0.5);
    this.sortDropdown.add(sortLabel);

    // Create sort text
    this.sortText = this.scene.add.text(20, 0, this.getSortLabel(this.currentSort), {
      fontSize: '14px',
      color: '#FFFFFF',
    });
    this.sortText.setOrigin(0, 0.5);
    this.sortDropdown.add(this.sortText);

    // Create sort arrow
    this.sortArrow = this.scene.add.graphics();
    this.drawSortArrow(false);
    this.sortArrow.setPosition(60, 0);
    this.sortDropdown.add(this.sortArrow);

    // Setup dropdown interaction
    dropdownBg.on('pointerdown', this.onSortDropdownClick.bind(this));

    this.add(this.sortDropdown);
  }

  /**
   * Draw sort arrow
   */
  private drawSortArrow(open: boolean): void {
    if (!this.sortArrow) return;

    this.sortArrow.clear();

    const arrowSize = 8;
    const color = 0xffffff;

    this.sortArrow.lineStyle(2, color, 1);
    this.sortArrow.beginPath();

    if (open) {
      // Up arrow
      this.sortArrow.moveTo(-arrowSize / 2, arrowSize / 2);
      this.sortArrow.lineTo(0, -arrowSize / 2);
      this.sortArrow.lineTo(arrowSize / 2, arrowSize / 2);
    } else {
      // Down arrow
      this.sortArrow.moveTo(-arrowSize / 2, -arrowSize / 2);
      this.sortArrow.lineTo(0, arrowSize / 2);
      this.sortArrow.lineTo(arrowSize / 2, -arrowSize / 2);
    }

    this.sortArrow.strokePath();
  }

  /**
   * Get sort label
   */
  private getSortLabel(sortType: SortType): string {
    const labels: Record<SortType, string> = {
      [SortType.NAME]: 'Name',
      [SortType.RARITY]: 'Rarity',
      [SortType.TIER]: 'Tier',
      [SortType.EFFECTIVENESS]: 'Effectiveness',
    };
    return labels[sortType] || sortType;
  }

  /**
   * Handle filter button hover
   */
  private onFilterButtonHover(button: Phaser.GameObjects.Container, hovered: boolean): void {
    const background = (button as any).background as Phaser.GameObjects.Rectangle;
    const text = (button as any).text as Phaser.GameObjects.Text;

    if (hovered) {
      background.setFillStyle(0x3a3a5a);
      text.setColor('#FFFFFF');
    } else {
      const filterType = (button as any).filterType as FilterType;
      if (filterType === this.currentFilter) {
        background.setFillStyle(COLORS.accent);
        text.setColor('#000000');
      } else {
        background.setFillStyle(0x2a2a4a);
        text.setColor('#CCCCCC');
      }
    }
  }

  /**
   * Handle filter button click
   */
  private onFilterButtonClick(filterType: FilterType): void {
    this.currentFilter = filterType;

    // Update all button appearances
    this.filterButtons.forEach((button) => {
      const buttonFilterType = (button as any).filterType as FilterType;
      const background = (button as any).background as Phaser.GameObjects.Rectangle;
      const text = (button as any).text as Phaser.GameObjects.Text;

      if (buttonFilterType === filterType) {
        background.setFillStyle(COLORS.accent);
        text.setColor('#000000');
      } else {
        background.setFillStyle(0x2a2a4a);
        text.setColor('#CCCCCC');
      }
    });

    // Emit filter change event
    if (this.onFilterChangeCallback) {
      this.onFilterChangeCallback(filterType);
    }
  }

  /**
   * Handle sort dropdown click
   */
  private onSortDropdownClick(): void {
    if (this.isSortMenuOpen) {
      this.closeSortMenu();
    } else {
      this.openSortMenu();
    }
  }

  /**
   * Open sort menu
   */
  private openSortMenu(): void {
    if (this.sortMenu) return;

    this.isSortMenuOpen = true;
    this.drawSortArrow(true);

    // Create sort menu
    this.sortMenu = this.scene.add.container(this.barWidth / 2 - 100, this.barHeight / 2);

    const menuBg = this.scene.add.rectangle(0, 0, 150, 140, 0x1a1a2e);
    menuBg.setStrokeStyle(2, COLORS.accent);
    menuBg.setAlpha(0.95);
    this.sortMenu.add(menuBg);

    // Create sort options
    const sorts = [
      SortType.NAME,
      SortType.RARITY,
      SortType.TIER,
      SortType.EFFECTIVENESS,
    ];

    sorts.forEach((sort, index) => {
      const y = -50 + index * 30;
      const optionText = this.scene.add.text(0, y, this.getSortLabel(sort), {
        fontSize: '14px',
        color: sort === this.currentSort ? '#ffd700' : '#CCCCCC',
      });
      optionText.setOrigin(0.5);
      optionText.setInteractive({ useHandCursor: true });
      if (this.sortMenu) {
        this.sortMenu.add(optionText);
      }

      // Store sort type
      (optionText as any).sortType = sort;

      // Setup option interaction
      optionText.on('pointerover', () => {
        optionText.setColor('#FFFFFF');
      });
      optionText.on('pointerout', () => {
        optionText.setColor(sort === this.currentSort ? '#ffd700' : '#CCCCCC');
      });
      optionText.on('pointerdown', () => {
        this.onSortOptionClick(sort);
      });
    });

    this.add(this.sortMenu);

    // Animate menu appearance
    this.sortMenu.setScale(0);
    this.scene.tweens.add({
      targets: this.sortMenu,
      scaleX: 1,
      scaleY: 1,
      duration: UI_ANIMATION_DURATION,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Close sort menu
   */
  private closeSortMenu(): void {
    if (!this.sortMenu) return;

    this.isSortMenuOpen = false;
    this.drawSortArrow(false);

    this.scene.tweens.add({
      targets: this.sortMenu,
      scaleX: 0,
      scaleY: 0,
      duration: UI_ANIMATION_DURATION,
      ease: 'Power2',
      onComplete: () => {
        if (this.sortMenu) {
          this.remove(this.sortMenu);
          this.sortMenu.destroy();
          this.sortMenu = null;
        }
      },
    });
  }

  /**
   * Handle sort option click
   */
  private onSortOptionClick(sort: SortType): void {
    this.currentSort = sort;
    if (this.sortText) {
      this.sortText.setText(this.getSortLabel(sort));
    }
    this.closeSortMenu();

    // Emit sort change event
    if (this.onSortChangeCallback) {
      this.onSortChangeCallback(sort);
    }
  }

  /**
   * Set current filter
   * @param filter - New filter type
   */
  public setFilter(filter: FilterType): void {
    this.onFilterButtonClick(filter);
  }

  /**
   * Set current sort
   * @param sort - New sort type
   */
  public setSort(sort: SortType): void {
    if (this.sortMenu) {
      this.closeSortMenu();
    }
    if (this.sortText) {
      this.sortText.setText(this.getSortLabel(sort));
    }
    this.onSortOptionClick(sort);
  }

  /**
   * Get current filter
   */
  public getFilter(): FilterType {
    return this.currentFilter;
  }

  /**
   * Get current sort
   */
  public getSort(): SortType {
    return this.currentSort;
  }

  /**
   * Reset filter to All
   */
  public resetFilter(): void {
    this.setFilter(FilterType.ALL);
  }

  /**
   * Clean up filter bar resources
   */
  public destroy(): void {
    // Clean up filter buttons
    this.filterButtons.forEach((button) => {
      const background = (button as any).background as Phaser.GameObjects.Rectangle;
      background.off('pointerover');
      background.off('pointerout');
      background.off('pointerdown');
    });

    // Clean up sort dropdown
    if (this.sortMenu) {
      this.remove(this.sortMenu);
      this.sortMenu.destroy();
    }

    super.destroy();
  }
}
