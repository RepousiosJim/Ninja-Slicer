/**
 * LeaderboardScene
 *
 * Leaderboard scene for displaying top scores.
 * Supports tab navigation: All-Time / Weekly / Personal.
 * Fetches data from Supabase and displays in scrollable list.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, LEADERBOARD_DISPLAY_LIMIT, LEADERBOARD_PERSONAL_LIMIT, COLORS, FONT_SIZES } from '@config/constants';
import { Button, ButtonStyle } from '../ui/Button';
import { Card } from '../ui/Card';
import { SupabaseService, LeaderboardEntry } from '../services/SupabaseService';

export class LeaderboardScene extends Phaser.Scene {
  private supabaseService: SupabaseService;
  private currentTab: 'all' | 'weekly' | 'personal' = 'all';
  private leaderboardEntries: LeaderboardEntry[] = [];
  private isLoading: boolean = false;
  private userId: string | null = null;

  // UI elements
  private titleText: Phaser.GameObjects.Text;
  private tabsContainer: Phaser.GameObjects.Container;
  private leaderboardContainer: Phaser.GameObjects.Container;
  private loadingText: Phaser.GameObjects.Text;
  private refreshButton: Button;
  private backButton: Button;

  // Tab buttons
  private allTimeButton: Button;
  private weeklyButton: Button;
  private personalButton: Button;

  // Scrollable list
  private scrollContainer: Phaser.GameObjects.Container;
  private scrollMask: Phaser.GameObjects.Graphics;
  private scrollY: number = 0;
  private maxScrollY: number = 0;

  constructor() {
    super({ key: SCENE_KEYS.leaderboard });
    this.supabaseService = new SupabaseService();
    this.titleText = {} as Phaser.GameObjects.Text;
    this.tabsContainer = {} as Phaser.GameObjects.Container;
    this.leaderboardContainer = {} as Phaser.GameObjects.Container;
    this.loadingText = {} as Phaser.GameObjects.Text;
    this.refreshButton = {} as Button;
    this.backButton = {} as Button;
    this.allTimeButton = {} as Button;
    this.weeklyButton = {} as Button;
    this.personalButton = {} as Button;
    this.scrollContainer = {} as Phaser.GameObjects.Container;
    this.scrollMask = {} as Phaser.GameObjects.Graphics;
  }

  create(): void {
    // Create background
    this.createBackground();

    // Create title
    this.createTitle();

    // Create tabs
    this.createTabs();

    // Create leaderboard container
    this.createLeaderboardContainer();

    // Create loading indicator
    this.createLoadingIndicator();

    // Create buttons
    this.createButtons();

    // Get user ID for highlighting
    this.getUserId();

    // Load initial leaderboard
    this.loadLeaderboard();

    // Setup scroll handling
    this.setupScrollHandling();

    console.log('LeaderboardScene created - Phase 6 Online ready!');
  }

  /**
   * Create background
   */
  private createBackground(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Add decorative elements
    graphics.fillStyle(0x2a2a4e, 0.5);
    graphics.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 300);
    graphics.fillCircle(100, 100, 80);
    graphics.fillCircle(GAME_WIDTH - 100, GAME_HEIGHT - 100, 120);
  }

  /**
   * Create title
   */
  private createTitle(): void {
    this.titleText = this.add.text(GAME_WIDTH / 2, 80, 'Leaderboard', {
      fontSize: `${FONT_SIZES.title}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    this.titleText.setOrigin(0.5);
  }

  /**
   * Create tab navigation
   */
  private createTabs(): void {
    this.tabsContainer = this.add.container(GAME_WIDTH / 2, 150);

    const tabWidth = 150;
    const tabHeight = 40;
    const spacing = 10;
    const totalWidth = (tabWidth * 3) + (spacing * 2);
    const startX = -totalWidth / 2 + tabWidth / 2;

    // All-Time tab
    this.allTimeButton = new Button(
      this,
      startX,
      0,
      tabWidth,
      tabHeight,
      'All-Time',
      {
        style: ButtonStyle.PRIMARY,
        fontSize: FONT_SIZES.small,
        onClick: () => this.onTabChange('all'),
      }
    );
    this.tabsContainer.add(this.allTimeButton);

    // Weekly tab
    this.weeklyButton = new Button(
      this,
      startX + tabWidth + spacing,
      0,
      tabWidth,
      tabHeight,
      'Weekly',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: () => this.onTabChange('weekly'),
      }
    );
    this.tabsContainer.add(this.weeklyButton);

    // Personal tab
    this.personalButton = new Button(
      this,
      startX + (tabWidth + spacing) * 2,
      0,
      tabWidth,
      tabHeight,
      'Personal',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: () => this.onTabChange('personal'),
      }
    );
    this.tabsContainer.add(this.personalButton);
  }

  /**
   * Create leaderboard container
   */
  private createLeaderboardContainer(): void {
    this.leaderboardContainer = this.add.container(GAME_WIDTH / 2, 220);

    // Create scroll mask
    this.scrollMask = this.add.graphics();
    this.scrollMask.fillStyle(0xffffff, 1);
    this.scrollMask.fillRect(-GAME_WIDTH / 2 + 50, 0, GAME_WIDTH - 100, 400);
    this.scrollMask.setVisible(false);

    // Create scroll container
    this.scrollContainer = this.add.container(0, 0);
    this.scrollContainer.setMask(this.scrollMask.createGeometryMask());
    this.leaderboardContainer.add(this.scrollContainer);
  }

  /**
   * Create loading indicator
   */
  private createLoadingIndicator(): void {
    this.loadingText = this.add.text(GAME_WIDTH / 2, 420, 'Loading...', {
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
    });
    this.loadingText.setOrigin(0.5);
    this.loadingText.setVisible(false);
  }

  /**
   * Create buttons
   */
  private createButtons(): void {
    // Refresh button
    this.refreshButton = new Button(
      this,
      GAME_WIDTH / 2 - 100,
      650,
      180,
      50,
      'Refresh',
      {
        style: ButtonStyle.PRIMARY,
        fontSize: FONT_SIZES.medium,
        onClick: () => this.onRefresh(),
      }
    );

    // Back button
    this.backButton = new Button(
      this,
      GAME_WIDTH / 2 + 100,
      650,
      180,
      50,
      'Back',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.medium,
        onClick: () => this.onBack(),
      }
    );
  }

  /**
   * Get user ID for highlighting
   */
  private async getUserId(): Promise<void> {
    if (!this.supabaseService.isAvailable()) {
      return;
    }

    const user = await this.supabaseService.getUser();
    if (user) {
      this.userId = user.id;
    }
  }

  /**
   * Load leaderboard from Supabase
   */
  private async loadLeaderboard(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.loadingText.setVisible(true);
    this.clearLeaderboardList();

    try {
      let entries: LeaderboardEntry[] = [];

      if (this.currentTab === 'personal') {
        // Get personal bests
        entries = await this.supabaseService.getPersonalBests(LEADERBOARD_PERSONAL_LIMIT);
      } else {
        // Get global leaderboard
        const timeFilter = this.currentTab === 'weekly' ? 'weekly' : 'all';
        entries = await this.supabaseService.getLeaderboard(LEADERBOARD_DISPLAY_LIMIT, timeFilter);
      }

      this.leaderboardEntries = entries;
      this.createLeaderboardList();
    } catch (error) {
      console.error('[LeaderboardScene] Failed to load leaderboard:', error);
      this.loadingText.setText('Failed to load leaderboard');
    } finally {
      this.isLoading = false;
      this.loadingText.setVisible(false);
    }
  }

  /**
   * Clear leaderboard list
   */
  private clearLeaderboardList(): void {
    this.scrollContainer.removeAll(true);
    this.scrollY = 0;
    this.maxScrollY = 0;
  }

  /**
   * Create leaderboard list
   */
  private createLeaderboardList(): void {
    if (this.leaderboardEntries.length === 0) {
      const noDataText = this.add.text(0, 200, 'No entries yet', {
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#888888',
      });
      noDataText.setOrigin(0.5);
      this.scrollContainer.add(noDataText);
      return;
    }

    let y = 0;
    const entryHeight = 80;
    const spacing = 10;

    this.leaderboardEntries.forEach((entry, index) => {
      const card = this.createLeaderboardEntry(entry, index + 1);
      card.setPosition(0, y);
      this.scrollContainer.add(card);
      y += entryHeight + spacing;
    });

    this.maxScrollY = Math.max(0, y - 400);
  }

  /**
   * Create single leaderboard entry
   */
  private createLeaderboardEntry(entry: LeaderboardEntry, rank: number): Card {
    const isPlayerEntry = this.userId !== null && entry.user_id === this.userId;
    const borderColor = isPlayerEntry ? COLORS.accent : COLORS.secondary;

    const card = new Card(
      this,
      0,
      0,
      GAME_WIDTH - 120,
      70,
      {
        title: `#${rank} - ${entry.player_name}`,
        subtitle: `Score: ${entry.score.toLocaleString()}`,
        description: `Weapon: ${entry.weapon_used} | Monsters: ${entry.monsters_sliced} | Max Combo: ${entry.max_combo}`,
        locked: false,
        selected: isPlayerEntry,
      }
    );

    // Highlight player's entries
    if (isPlayerEntry) {
      const highlight = this.add.rectangle(0, 0, GAME_WIDTH - 110, 60, 0xffd700, 0.1);
      highlight.setOrigin(0.5);
      card.add(highlight);
    }

    return card;
  }

  /**
   * Handle tab change
   */
  private onTabChange(tab: 'all' | 'weekly' | 'personal'): void {
    if (this.currentTab === tab) return;

    this.currentTab = tab;

    // Update tab button styles
    this.allTimeButton.setStyle(tab === 'all' ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY);
    this.weeklyButton.setStyle(tab === 'weekly' ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY);
    this.personalButton.setStyle(tab === 'personal' ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY);

    // Load leaderboard for new tab
    this.loadLeaderboard();
  }

  /**
   * Handle refresh button click
   */
  private onRefresh(): void {
    this.loadLeaderboard();
  }

  /**
   * Handle back button click
   */
  private onBack(): void {
    this.scene.start(SCENE_KEYS.mainMenu);
  }

  /**
   * Setup scroll handling
   */
  private setupScrollHandling(): void {
    let isDragging = false;
    let lastY = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const bounds = {
        x: GAME_WIDTH / 2 - (GAME_WIDTH - 100) / 2,
        y: 220,
        width: GAME_WIDTH - 100,
        height: 400,
      };

      if (
        pointer.x >= bounds.x &&
        pointer.x <= bounds.x + bounds.width &&
        pointer.y >= bounds.y &&
        pointer.y <= bounds.y + bounds.height
      ) {
        isDragging = true;
        lastY = pointer.y;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;

      const deltaY = pointer.y - lastY;
      this.scrollY += deltaY;

      // Clamp scroll
      this.scrollY = Math.max(-this.maxScrollY, Math.min(0, this.scrollY));

      this.scrollContainer.setY(this.scrollY);
      lastY = pointer.y;
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });
  }

  /**
   * Clean up when scene is destroyed
   */
  shutdown(): void {
    this.input.off('pointerdown');
    this.input.off('pointermove');
    this.input.off('pointerup');
  }
}
