/**
 * UpdatesScene
 *
 * Displays game updates, changelog, and upcoming features
 */

import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT } from '@config/constants';
import { DARK_GOTHIC_THEME } from '@config/theme';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';
import { Button } from '../ui/Button';
import updatesData from '../data/updates.json';

export class UpdatesScene extends Phaser.Scene {
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private contentContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: SCENE_KEYS.updates || 'UpdatesScene' });
  }

  create(): void {
    this.createBackground();
    this.createHeader();
    this.createContent();
    this.createBackButton();
    this.setupScrolling();
  }

  /**
   * Create background
   */
  private createBackground(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.setDepth(0);
  }

  /**
   * Create header
   */
  private createHeader(): void {
    const padding = ResponsiveUtils.getPadding('large');
    const fontSize = ResponsiveUtils.getFontSize('xlarge');

    const title = this.add.text(GAME_WIDTH / 2, padding, 'UPDATES & CHANGELOG', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    });
    title.setOrigin(0.5, 0);
    title.setDepth(1000);
  }

  /**
   * Create scrollable content
   */
  private createContent(): void {
    const padding = ResponsiveUtils.getPadding('medium');
    const startY = padding * 4;

    this.contentContainer = this.add.container(0, startY);
    this.contentContainer.setDepth(100);

    let currentY = 0;

    // Display updates
    updatesData.updates.forEach((update, index) => {
      currentY = this.addUpdateEntry(update, currentY, index);
      currentY += padding * 2;
    });

    // Display upcoming features
    currentY = this.addUpcomingSection(currentY);

    this.maxScroll = Math.max(0, currentY - GAME_HEIGHT + padding * 10);
  }

  /**
   * Add update entry
   */
  private addUpdateEntry(update: any, startY: number, index: number): number {
    const padding = ResponsiveUtils.getPadding('medium');
    const fontSizeLg = ResponsiveUtils.getFontSize('large');
    const fontSizeMd = ResponsiveUtils.getFontSize('medium');
    const fontSizeSm = ResponsiveUtils.getFontSize('small');

    let currentY = startY;

    // Version and date
    const versionText = this.add.text(
      padding * 2,
      currentY,
      `v${update.version} - ${update.date}`,
      {
        fontFamily: DARK_GOTHIC_THEME.fonts.monospace,
        fontSize: `${fontSizeSm}px`,
        color: '#888888',
      }
    );
    this.contentContainer.add(versionText);
    currentY += fontSizeSm + padding / 2;

    // Title
    const titleColor = update.type === 'major' ? '#ff0000' : '#00ffff';
    const titleText = this.add.text(padding * 2, currentY, update.title, {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSizeLg}px`,
      color: titleColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.contentContainer.add(titleText);
    currentY += fontSizeLg + padding;

    // Changes
    update.changes.forEach((change: string) => {
      const changeText = this.add.text(padding * 3, currentY, `• ${change}`, {
        fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
        fontSize: `${fontSizeMd}px`,
        color: '#cccccc',
        wordWrap: { width: GAME_WIDTH - padding * 6 },
      });
      this.contentContainer.add(changeText);
      currentY += changeText.height + padding / 2;
    });

    // Separator line
    const line = this.add.graphics();
    line.lineStyle(2, 0x333333, 1);
    line.beginPath();
    line.moveTo(padding * 2, currentY + padding);
    line.lineTo(GAME_WIDTH - padding * 2, currentY + padding);
    line.strokePath();
    this.contentContainer.add(line);

    return currentY + padding * 2;
  }

  /**
   * Add upcoming features section
   */
  private addUpcomingSection(startY: number): number {
    const padding = ResponsiveUtils.getPadding('medium');
    const fontSizeLg = ResponsiveUtils.getFontSize('large');
    const fontSizeMd = ResponsiveUtils.getFontSize('medium');

    let currentY = startY;

    // Section header
    const header = this.add.text(padding * 2, currentY, 'UPCOMING FEATURES', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSizeLg}px`,
      color: '#ffaa00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.contentContainer.add(header);
    currentY += fontSizeLg + padding * 1.5;

    // Upcoming items
    updatesData.upcoming.forEach((item: any) => {
      const statusColor = item.status === 'in_development' ? '#00ff00' : '#888888';
      const statusText =
        item.status === 'in_development' ? 'In Development' : 'Planned';

      const titleText = this.add.text(padding * 3, currentY, `${item.title} [${statusText}]`, {
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        fontSize: `${fontSizeMd}px`,
        color: statusColor,
        fontStyle: 'bold',
      });
      this.contentContainer.add(titleText);
      currentY += fontSizeMd + padding / 2;

      const descText = this.add.text(padding * 4, currentY, item.description, {
        fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
        fontSize: `${fontSizeMd}px`,
        color: '#aaaaaa',
        wordWrap: { width: GAME_WIDTH - padding * 6 },
      });
      this.contentContainer.add(descText);
      currentY += descText.height + padding * 1.5;
    });

    return currentY;
  }

  /**
   * Create back button
   */
  private createBackButton(): void {
    const padding = ResponsiveUtils.getPadding('large');
    const buttonSize = ResponsiveUtils.getButtonSize('medium');

    const backButton = new Button(
      this,
      padding,
      GAME_HEIGHT - padding,
      buttonSize.width,
      buttonSize.height,
      'BACK',
      {
        onClick: () => {
          this.scene.start(SCENE_KEYS.mainMenu);
        }
      }
    );
    backButton.setDepth(1000);
  }

  /**
   * Setup mouse wheel scrolling
   */
  private setupScrolling(): void {
    this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      this.scrollY += deltaY * 0.5;
      this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
      this.contentContainer.y = ResponsiveUtils.getPadding('medium') * 4 - this.scrollY;
    });

    // Touch scrolling
    let startY = 0;
    let lastY = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      startY = pointer.y;
      lastY = pointer.y;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const deltaY = lastY - pointer.y;
        this.scrollY += deltaY;
        this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
        this.contentContainer.y = ResponsiveUtils.getPadding('medium') * 4 - this.scrollY;
        lastY = pointer.y;
      }
    });
  }
}
