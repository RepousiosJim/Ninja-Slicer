/**
 * Panel Component
 * 
 * A reusable panel component for UI containers with title bar,
 * close button, and draggable support.
 */

import Phaser from 'phaser';
import { COLORS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import { DARK_GOTHIC_THEME } from '../config/theme';
import { Button, ButtonStyle } from './Button';

/**
 * Panel configuration interface
 */
export interface PanelConfig {
  width: number;
  height: number;
  title?: string;
  closable?: boolean;
  draggable?: boolean;
}

/**
 * Panel component for UI containers
 */
export class Panel extends Phaser.GameObjects.Container {
  // UI elements
  private background: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private titleBar: Phaser.GameObjects.Rectangle | null = null;
  private titleText: Phaser.GameObjects.Text | null = null;
  private closeButton: Button | null = null;
  private content: Phaser.GameObjects.GameObject | null = null;

  // Panel state
  private isDraggable: boolean;
  private isDragging: boolean;
  private dragOffset: { x: number; y: number };
  private isVisible: boolean;

  /**
   * Create a new panel
   * @param scene - The scene this panel belongs to
   * @param x - X position
   * @param y - Y position
   * @param width - Panel width
   * @param height - Panel height
   * @param title - Optional panel title
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    title?: string
  ) {
    super(scene, x, y);

    // Create background with theme
    this.background = scene.add.rectangle(0, 0, width, height, DARK_GOTHIC_THEME.colors.background);
    this.background.setAlpha(0.95);
    this.add(this.background);

    // Create border with theme
    this.border = scene.add.rectangle(0, 0, width, height);
    this.border.setStrokeStyle(3, DARK_GOTHIC_THEME.colors.accent);
    this.border.setFillStyle(0x000000, 0);
    this.add(this.border);

    // Create title bar if title is provided
    if (title) {
      this.titleBar = scene.add.rectangle(0, -height / 2 + 25, width, 50, DARK_GOTHIC_THEME.colors.primary);
      this.titleBar.setStrokeStyle(2, DARK_GOTHIC_THEME.colors.accent);
      this.add(this.titleBar);

      this.titleText = scene.add.text(0, -height / 2 + 25, title, {
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#FFFFFF',
        fontStyle: 'bold',
      });
      this.titleText.setOrigin(0.5);
      this.add(this.titleText);
    }

    // Initialize state
    this.isDraggable = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.isVisible = true;

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Set panel title
   * @param title - New panel title
   */
  public setTitle(title: string): void {
    if (!this.titleText) {
      // Create title bar if it doesn't exist
      const height = this.background.height;
      this.titleBar = this.scene.add.rectangle(0, -height / 2 + 25, this.background.width, 50, DARK_GOTHIC_THEME.colors.primary);
      this.titleBar.setStrokeStyle(2, DARK_GOTHIC_THEME.colors.accent);
      this.add(this.titleBar);

      this.titleText = this.scene.add.text(0, -height / 2 + 25, title, {
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#FFFFFF',
        fontStyle: 'bold',
      });
      this.titleText.setOrigin(0.5);
      this.add(this.titleText);
    } else {
      this.titleText.setText(title);
    }
  }

  /**
   * Enable or disable dragging
   * @param draggable - Whether panel should be draggable
   */
  public setDraggable(draggable: boolean): void {
    this.isDraggable = draggable;

    if (draggable && this.titleBar) {
      this.titleBar.setInteractive({ useHandCursor: true });
      this.titleBar.on('pointerdown', this.onDragStart.bind(this));
      this.scene.input.on('pointermove', this.onDragMove.bind(this));
      this.scene.input.on('pointerup', this.onDragEnd.bind(this));
    } else if (this.titleBar) {
      this.titleBar.disableInteractive();
      this.titleBar.off('pointerdown', this.onDragStart.bind(this));
      this.scene.input.off('pointermove', this.onDragMove.bind(this));
      this.scene.input.off('pointerup', this.onDragEnd.bind(this));
    }
  }

  /**
   * Handle drag start
   */
  private onDragStart(): void {
    if (!this.isDraggable) return;

    this.isDragging = true;
    const pointer = this.scene.input.activePointer;
    this.dragOffset.x = pointer.x - this.x;
    this.dragOffset.y = pointer.y - this.y;
  }

  /**
   * Handle drag move
   */
  private onDragMove(): void {
    if (!this.isDragging) return;

    const pointer = this.scene.input.activePointer;
    this.x = pointer.x - this.dragOffset.x;
    this.y = pointer.y - this.dragOffset.y;
  }

  /**
   * Handle drag end
   */
  private onDragEnd(): void {
    this.isDragging = false;
  }

  /**
   * Set panel content
   * @param content - Content game object to display in panel
   */
  public setContent(content: Phaser.GameObjects.GameObject): void {
    // Remove existing content
    if (this.content) {
      this.remove(this.content);
    }

    // Add new content
    this.content = content;
    this.add(content);

    // Center content in panel
    if (content instanceof Phaser.GameObjects.Container) {
      content.setPosition(0, 0);
    }
  }

  /**
   * Add close button to panel
   * @param callback - Function to call when close button is clicked
   */
  public addCloseButton(callback: () => void): void {
    if (this.closeButton) {
      this.remove(this.closeButton);
      this.closeButton.destroy();
    }

    const panelWidth = this.background.width;
    const panelHeight = this.background.height;

    this.closeButton = new Button(
      this.scene,
      panelWidth / 2 - 30,
      -panelHeight / 2 + 25,
      50,
      30,
      'X',
      {
        style: ButtonStyle.DANGER,
        fontSize: FONT_SIZES.small,
        onClick: callback,
      }
    );

    this.add(this.closeButton);
  }

  /**
   * Show panel with animation
   */
  public show(): void {
    if (this.isVisible) return;

    this.isVisible = true;
    this.setVisible(true);

    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: DARK_GOTHIC_THEME.animations.duration,
      ease: DARK_GOTHIC_THEME.animations.easing,
    });
  }

  /**
   * Hide panel with animation
   */
  public hide(): void {
    if (!this.isVisible) return;

    this.isVisible = false;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: DARK_GOTHIC_THEME.animations.duration,
      ease: DARK_GOTHIC_THEME.animations.easing,
      onComplete: () => {
        this.setVisible(false);
      },
    });
  }

  /**
   * Get panel visibility state
   */
  public getVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Get panel dimensions
   */
  public getDimensions(): { width: number; height: number } {
    return {
      width: this.background.width,
      height: this.background.height,
    };
  }

  /**
   * Clean up panel resources
   */
  public destroy(): void {
    if (this.titleBar) {
      this.titleBar.off('pointerdown', this.onDragStart.bind(this));
    }
    this.scene.input.off('pointermove', this.onDragMove.bind(this));
    this.scene.input.off('pointerup', this.onDragEnd.bind(this));

    if (this.closeButton) {
      this.closeButton.destroy();
    }

    super.destroy();
  }
}
