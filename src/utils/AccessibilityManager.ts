/**
 * Accessibility Manager
 *
 * Handles keyboard navigation, screen reader support,
 * high contrast mode, and other accessibility features.
 */

import Phaser from 'phaser';

/**
 * Focusable element interface
 */
export interface FocusableElement {
  gameObject: Phaser.GameObjects.GameObject;
  label: string;
  description?: string;
  onActivate?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  keyboardEnabled: boolean;
  screenReaderEnabled: boolean;
  highContrastMode: boolean;
  textScale: number;
  focusIndicatorColor: number;
  focusIndicatorWidth: number;
}

/**
 * Default accessibility configuration
 */
const DEFAULT_CONFIG: AccessibilityConfig = {
  keyboardEnabled: true,
  screenReaderEnabled: true,
  highContrastMode: false,
  textScale: 1.0,
  focusIndicatorColor: 0xffff00,
  focusIndicatorWidth: 3,
};

/**
 * Accessibility Manager
 */
export class AccessibilityManager {
  private scene: Phaser.Scene;
  private config: AccessibilityConfig;
  private focusableElements: FocusableElement[] = [];
  private currentFocusIndex: number = -1;
  private focusIndicator: Phaser.GameObjects.Graphics | null = null;
  private screenReaderAnnouncer: Phaser.GameObjects.Text | null = null;

  // Keyboard state
  private keys: Map<string, Phaser.Input.Keyboard.Key> = new Map();

  constructor(scene: Phaser.Scene, config?: Partial<AccessibilityConfig>) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.initialize();
  }

  /**
   * Initialize accessibility manager
   */
  private initialize(): void {
    // Create focus indicator
    this.createFocusIndicator();

    // Create screen reader announcer
    this.createScreenReaderAnnouncer();

    // Setup keyboard input
    this.setupKeyboardInput();

    // Apply accessibility settings
    this.applyAccessibilitySettings();
  }

  /**
   * Create focus indicator
   */
  private createFocusIndicator(): void {
    this.focusIndicator = this.scene.add.graphics();
    this.focusIndicator.setDepth(9999);
    this.focusIndicator.setVisible(false);
  }

  /**
   * Create screen reader announcer
   */
  private createScreenReaderAnnouncer(): void {
    this.screenReaderAnnouncer = this.scene.add.text(
      -1000,
      -1000,
      '',
      {
        fontSize: '1px',
        color: '#000000',
      },
    );
  }

  /**
   * Setup keyboard input
   */
  private setupKeyboardInput(): void {
    if (!this.config.keyboardEnabled) return;

    // Create keyboard keys
    this.keys.set('Tab', this.scene.input.keyboard!.addKey('TAB'));
    this.keys.set('Enter', this.scene.input.keyboard!.addKey('ENTER'));
    this.keys.set('Escape', this.scene.input.keyboard!.addKey('ESC'));
    this.keys.set('ArrowUp', this.scene.input.keyboard!.addKey('UP'));
    this.keys.set('ArrowDown', this.scene.input.keyboard!.addKey('DOWN'));
    this.keys.set('ArrowLeft', this.scene.input.keyboard!.addKey('LEFT'));
    this.keys.set('ArrowRight', this.scene.input.keyboard!.addKey('RIGHT'));
    this.keys.set('Space', this.scene.input.keyboard!.addKey('SPACE'));

    // Listen for key events
    this.scene.input.keyboard!.on('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Handle key down events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.config.keyboardEnabled) return;

    const key = event.key;

    switch (key) {
    case 'Tab':
      event.preventDefault();
      this.navigateFocus(event.shiftKey ? -1 : 1);
      break;

    case 'Enter':
    case ' ':
      event.preventDefault();
      this.activateFocusedElement();
      break;

    case 'Escape':
      event.preventDefault();
      this.handleEscape();
      break;

    case 'ArrowUp':
      event.preventDefault();
      this.navigateFocus(-1);
      break;

    case 'ArrowDown':
      event.preventDefault();
      this.navigateFocus(1);
      break;

    case 'ArrowLeft':
      event.preventDefault();
      this.navigateFocus(-1);
      break;

    case 'ArrowRight':
      event.preventDefault();
      this.navigateFocus(1);
      break;
    }
  }

  /**
   * Navigate focus
   */
  private navigateFocus(direction: number): void {
    if (this.focusableElements.length === 0) return;

    // Remove focus from current element
    if (this.currentFocusIndex >= 0) {
      const currentElement = this.focusableElements[this.currentFocusIndex];
      if (currentElement && currentElement.onBlur) {
        currentElement.onBlur();
      }
    }

    // Calculate new focus index
    this.currentFocusIndex += direction;

    // Wrap around
    if (this.currentFocusIndex < 0) {
      this.currentFocusIndex = this.focusableElements.length - 1;
    } else if (this.currentFocusIndex >= this.focusableElements.length) {
      this.currentFocusIndex = 0;
    }

    // Apply focus to new element
    const newElement = this.focusableElements[this.currentFocusIndex];
    if (newElement) {
      if (newElement.onFocus) {
        newElement.onFocus();
      }

      // Update focus indicator
      this.updateFocusIndicator(newElement.gameObject);

      // Announce to screen reader
      this.announce(newElement.label);
    }
  }

  /**
   * Activate focused element
   */
  private activateFocusedElement(): void {
    if (this.currentFocusIndex < 0 || this.currentFocusIndex >= this.focusableElements.length) {
      return;
    }

    const element = this.focusableElements[this.currentFocusIndex];
    if (element && element.onActivate) {
      element.onActivate();
    }
  }

  /**
   * Handle escape key
   */
  private handleEscape(): void {
    // Emit escape event for scene to handle
    this.scene.events.emit('accessibility-escape');
  }

  /**
   * Update focus indicator
   */
  private updateFocusIndicator(target: Phaser.GameObjects.GameObject): void {
    if (!this.focusIndicator) return;

    // Get bounds if available
    let bounds: Phaser.Geom.Rectangle;
    if ('getBounds' in target) {
      bounds = (target as any).getBounds();
    } else {
      // Fallback to position and size
      const x = (target as any).x || 0;
      const y = (target as any).y || 0;
      const width = (target as any).width || 100;
      const height = (target as any).height || 50;
      bounds = new Phaser.Geom.Rectangle(x, y, width, height);
    }

    this.focusIndicator.clear();
    this.focusIndicator.lineStyle(
      this.config.focusIndicatorWidth,
      this.config.focusIndicatorColor,
      1,
    );
    this.focusIndicator.strokeRect(
      bounds.x - 5,
      bounds.y - 5,
      bounds.width + 10,
      bounds.height + 10,
    );
    this.focusIndicator.setVisible(true);
  }

  /**
   * Hide focus indicator
   */
  private hideFocusIndicator(): void {
    if (this.focusIndicator) {
      this.focusIndicator.setVisible(false);
    }
  }

  /**
   * Register focusable element
   */
  public registerElement(element: FocusableElement): void {
    this.focusableElements.push(element);
  }

  /**
   * Unregister focusable element
   */
  public unregisterElement(gameObject: Phaser.GameObjects.GameObject): void {
    const index = this.focusableElements.findIndex(e => e.gameObject === gameObject);
    if (index >= 0) {
      this.focusableElements.splice(index, 1);

      // Adjust focus index if needed
      if (this.currentFocusIndex >= index) {
        this.currentFocusIndex--;
      }
    }
  }

  /**
   * Clear all focusable elements
   */
  public clearElements(): void {
    this.focusableElements = [];
    this.currentFocusIndex = -1;
    this.hideFocusIndicator();
  }

  /**
   * Set focus to specific element
   */
  public setFocus(gameObject: Phaser.GameObjects.GameObject): void {
    const index = this.focusableElements.findIndex(e => e.gameObject === gameObject);
    if (index >= 0) {
      // Remove focus from current element
      if (this.currentFocusIndex >= 0) {
        const currentElement = this.focusableElements[this.currentFocusIndex];
        if (currentElement && currentElement.onBlur) {
          currentElement.onBlur();
        }
      }

      // Set new focus
      this.currentFocusIndex = index;
      const newElement = this.focusableElements[index];
      if (newElement) {
        if (newElement.onFocus) {
          newElement.onFocus();
        }

        // Update focus indicator
        this.updateFocusIndicator(newElement.gameObject);

        // Announce to screen reader
        this.announce(newElement.label);
      }
    }
  }

  /**
   * Announce to screen reader
   */
  public announce(message: string): void {
    if (!this.config.screenReaderEnabled || !this.screenReaderAnnouncer) return;

    this.screenReaderAnnouncer.setText(message);

    // Clear after announcement
    this.scene.time.delayedCall(1000, () => {
      if (this.screenReaderAnnouncer) {
        this.screenReaderAnnouncer.setText('');
      }
    });
  }

  /**
   * Apply accessibility settings
   */
  private applyAccessibilitySettings(): void {
    // Apply high contrast mode
    if (this.config.highContrastMode) {
      this.applyHighContrastMode();
    }

    // Apply text scale
    this.applyTextScale();
  }

  /**
   * Apply high contrast mode
   */
  private applyHighContrastMode(): void {
    // Emit event for UI components to handle
    this.scene.events.emit('accessibility-high-contrast', this.config.highContrastMode);
  }

  /**
   * Apply text scale
   */
  private applyTextScale(): void {
    // Emit event for UI components to handle
    this.scene.events.emit('accessibility-text-scale', this.config.textScale);
  }

  /**
   * Set high contrast mode
   */
  public setHighContrastMode(enabled: boolean): void {
    this.config.highContrastMode = enabled;
    this.applyHighContrastMode();
  }

  /**
   * Set text scale
   */
  public setTextScale(scale: number): void {
    this.config.textScale = scale;
    this.applyTextScale();
  }

  /**
   * Enable/disable keyboard navigation
   */
  public setKeyboardEnabled(enabled: boolean): void {
    this.config.keyboardEnabled = enabled;
  }

  /**
   * Enable/disable screen reader
   */
  public setScreenReaderEnabled(enabled: boolean): void {
    this.config.screenReaderEnabled = enabled;
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<AccessibilityConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...config };
    this.applyAccessibilitySettings();
  }

  /**
   * Check if element is focused
   */
  public isFocused(gameObject: Phaser.GameObjects.GameObject): boolean {
    if (this.currentFocusIndex < 0) return false;
    return this.focusableElements[this.currentFocusIndex]?.gameObject === gameObject;
  }

  /**
   * Get current focused element
   */
  public getFocusedElement(): FocusableElement | null {
    if (this.currentFocusIndex < 0 || this.currentFocusIndex >= this.focusableElements.length) {
      return null;
    }
    const element = this.focusableElements[this.currentFocusIndex];
    return element || null;
  }

  /**
   * Destroy accessibility manager
   */
  public destroy(): void {
    // Clean up keyboard listeners
    this.scene.input.keyboard!.off('keydown', this.handleKeyDown.bind(this));

    // Clean up keys
    this.keys.forEach(key => key.destroy());
    this.keys.clear();

    // Clean up focus indicator
    if (this.focusIndicator) {
      this.focusIndicator.destroy();
    }

    // Clean up screen reader announcer
    if (this.screenReaderAnnouncer) {
      this.screenReaderAnnouncer.destroy();
    }

    // Clear elements
    this.clearElements();
  }
}
