/**
 * Responsive Manager
 *
 * Handles responsive layouts, touch gestures,
 * and mobile-specific optimizations.
 */

import Phaser from 'phaser';

/**
 * Breakpoint enum
 */
export enum Breakpoint {
  MOBILE_SMALL = 320,
  MOBILE = 480,
  TABLET = 768,
  DESKTOP = 1024,
  LARGE_DESKTOP = 1440,
}

/**
 * Device type enum
 */
export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
}

/**
 * Touch gesture type
 */
export enum TouchGesture {
  SWIPE_LEFT = 'swipe_left',
  SWIPE_RIGHT = 'swipe_right',
  SWIPE_UP = 'swipe_up',
  SWIPE_DOWN = 'swipe_down',
  PINCH_IN = 'pinch_in',
  PINCH_OUT = 'pinch_out',
  TAP = 'tap',
  DOUBLE_TAP = 'double_tap',
  LONG_PRESS = 'long_press',
}

/**
 * Responsive configuration
 */
export interface ResponsiveConfig {
  enableTouchGestures: boolean;
  enablePinchToZoom: boolean;
  minTouchTargetSize: number;
  swipeThreshold: number;
  longPressDuration: number;
  doubleTapDelay: number;
}

/**
 * Gesture event data
 */
export interface GestureEvent {
  type: TouchGesture;
  x: number;
  y: number;
  distance?: number;
  duration?: number;
}

/**
 * Default responsive configuration
 */
const DEFAULT_CONFIG: ResponsiveConfig = {
  enableTouchGestures: true,
  enablePinchToZoom: true,
  minTouchTargetSize: 44,
  swipeThreshold: 50,
  longPressDuration: 500,
  doubleTapDelay: 300,
};

/**
 * Responsive Manager
 */
export class ResponsiveManager {
  private scene: Phaser.Scene;
  private config: ResponsiveConfig;
  private currentBreakpoint: Breakpoint = Breakpoint.DESKTOP;
  private currentDeviceType: DeviceType = DeviceType.DESKTOP;

  // Touch state
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private lastTapTime: number = 0;
  private tapCount: number = 0;
  private initialPinchDistance: number = 0;

  // Gesture callbacks
  private gestureCallbacks: Map<TouchGesture, (event: GestureEvent) => void> = new Map();

  constructor(scene: Phaser.Scene, config?: Partial<ResponsiveConfig>) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.initialize();
  }

  /**
   * Initialize responsive manager
   */
  private initialize(): void {
    // Detect current breakpoint
    this.updateBreakpoint();

    // Setup resize listener
    this.scene.scale.on('resize', this.handleResize.bind(this));

    // Setup touch gestures
    if (this.config.enableTouchGestures) {
      this.setupTouchGestures();
    }
  }

  /**
   * Update breakpoint based on screen size
   */
  private updateBreakpoint(): void {
    const width = this.scene.scale.width;

    if (width < Breakpoint.MOBILE_SMALL) {
      this.currentBreakpoint = Breakpoint.MOBILE_SMALL;
      this.currentDeviceType = DeviceType.MOBILE;
    } else if (width < Breakpoint.MOBILE) {
      this.currentBreakpoint = Breakpoint.MOBILE_SMALL;
      this.currentDeviceType = DeviceType.MOBILE;
    } else if (width < Breakpoint.TABLET) {
      this.currentBreakpoint = Breakpoint.MOBILE;
      this.currentDeviceType = DeviceType.TABLET;
    } else if (width < Breakpoint.DESKTOP) {
      this.currentBreakpoint = Breakpoint.TABLET;
      this.currentDeviceType = DeviceType.DESKTOP;
    } else if (width < Breakpoint.LARGE_DESKTOP) {
      this.currentBreakpoint = Breakpoint.DESKTOP;
      this.currentDeviceType = DeviceType.DESKTOP;
    } else {
      this.currentBreakpoint = Breakpoint.LARGE_DESKTOP;
      this.currentDeviceType = DeviceType.DESKTOP;
    }

    // Emit breakpoint change event
    this.scene.events.emit('responsive-breakpoint-changed', {
      breakpoint: this.currentBreakpoint,
      deviceType: this.currentDeviceType,
    });
  }

  /**
   * Handle resize event
   */
  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.updateBreakpoint();
  }

  /**
   * Setup touch gestures
   */
  private setupTouchGestures(): void {
    // Pointer down
    this.scene.input.on('pointerdown', this.handlePointerDown.bind(this));

    // Pointer up
    this.scene.input.on('pointerup', this.handlePointerUp.bind(this));

    // Pointer move
    this.scene.input.on('pointermove', this.handlePointerMove.bind(this));
  }

  /**
   * Handle pointer down
   */
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.touchStartX = pointer.x;
    this.touchStartY = pointer.y;
    this.touchStartTime = this.scene.time.now;

    // Check for double tap
    const timeSinceLastTap = this.scene.time.now - this.lastTapTime;
    if (timeSinceLastTap < this.config.doubleTapDelay) {
      this.tapCount++;
    } else {
      this.tapCount = 1;
    }
    this.lastTapTime = this.scene.time.now;
  }

  /**
   * Handle pointer up
   */
  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    const duration = this.scene.time.now - this.touchStartTime;
    const deltaX = pointer.x - this.touchStartX;
    const deltaY = pointer.y - this.touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check for long press
    if (duration > this.config.longPressDuration && distance < 10) {
      this.emitGesture({
        type: TouchGesture.LONG_PRESS,
        x: pointer.x,
        y: pointer.y,
        duration,
      });
      return;
    }

    // Check for swipe
    if (distance > this.config.swipeThreshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.emitGesture({
            type: TouchGesture.SWIPE_RIGHT,
            x: pointer.x,
            y: pointer.y,
            distance: deltaX,
          });
        } else {
          this.emitGesture({
            type: TouchGesture.SWIPE_LEFT,
            x: pointer.x,
            y: pointer.y,
            distance: Math.abs(deltaX),
          });
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.emitGesture({
            type: TouchGesture.SWIPE_DOWN,
            x: pointer.x,
            y: pointer.y,
            distance: deltaY,
          });
        } else {
          this.emitGesture({
            type: TouchGesture.SWIPE_UP,
            x: pointer.x,
            y: pointer.y,
            distance: Math.abs(deltaY),
          });
        }
      }
      return;
    }

    // Check for tap
    if (distance < 10 && duration < 300) {
      if (this.tapCount === 2) {
        this.emitGesture({
          type: TouchGesture.DOUBLE_TAP,
          x: pointer.x,
          y: pointer.y,
        });
      } else {
        this.emitGesture({
          type: TouchGesture.TAP,
          x: pointer.x,
          y: pointer.y,
        });
      }
    }
  }

  /**
   * Handle pointer move (for pinch zoom)
   */
  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.config.enablePinchToZoom) return;

    // Check for pinch gesture (multiple pointers)
    const pointers = this.scene.input.manager.pointers;
    if (pointers.length >= 2) {
      const pointer1 = pointers[0];
      const pointer2 = pointers[1];

      if (pointer1 && pointer2) {
        const currentDistance = Phaser.Math.Distance.Between(
          pointer1.x,
          pointer1.y,
          pointer2.x,
          pointer2.y,
        );

        if (this.initialPinchDistance === 0) {
          this.initialPinchDistance = currentDistance;
        } else {
          const delta = currentDistance - this.initialPinchDistance;

          if (Math.abs(delta) > 20) {
            if (delta > 0) {
              this.emitGesture({
                type: TouchGesture.PINCH_OUT,
                x: (pointer1.x + pointer2.x) / 2,
                y: (pointer1.y + pointer2.y) / 2,
                distance: delta,
              });
            } else {
              this.emitGesture({
                type: TouchGesture.PINCH_IN,
                x: (pointer1.x + pointer2.x) / 2,
                y: (pointer1.y + pointer2.y) / 2,
                distance: Math.abs(delta),
              });
            }

            this.initialPinchDistance = currentDistance;
          }
        }
      }
    } else {
      this.initialPinchDistance = 0;
    }
  }

  /**
   * Emit gesture event
   */
  private emitGesture(event: GestureEvent): void {
    const callback = this.gestureCallbacks.get(event.type);
    if (callback) {
      callback(event);
    }

    // Emit general gesture event
    this.scene.events.emit('responsive-gesture', event);
  }

  /**
   * Register gesture callback
   */
  public onGesture(type: TouchGesture, callback: (event: GestureEvent) => void): void {
    this.gestureCallbacks.set(type, callback);
  }

  /**
   * Unregister gesture callback
   */
  public offGesture(type: TouchGesture): void {
    this.gestureCallbacks.delete(type);
  }

  /**
   * Get current breakpoint
   */
  public getCurrentBreakpoint(): Breakpoint {
    return this.currentBreakpoint;
  }

  /**
   * Get current device type
   */
  public getCurrentDeviceType(): DeviceType {
    return this.currentDeviceType;
  }

  /**
   * Check if mobile device
   */
  public isMobile(): boolean {
    return this.currentDeviceType === DeviceType.MOBILE;
  }

  /**
   * Check if tablet device
   */
  public isTablet(): boolean {
    return this.currentDeviceType === DeviceType.TABLET;
  }

  /**
   * Check if desktop device
   */
  public isDesktop(): boolean {
    return this.currentDeviceType === DeviceType.DESKTOP;
  }

  /**
   * Get responsive value
   */
  public getResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T {
    return values[this.currentBreakpoint] || values[Breakpoint.DESKTOP] as T;
  }

  /**
   * Get responsive scale
   */
  public getResponsiveScale(): number {
    switch (this.currentBreakpoint) {
    case Breakpoint.MOBILE_SMALL:
      return 0.7;
    case Breakpoint.MOBILE_SMALL:
      return 0.8;
    case Breakpoint.MOBILE:
      return 0.9;
    case Breakpoint.TABLET:
      return 1.0;
    case Breakpoint.DESKTOP:
      return 1.0;
    case Breakpoint.LARGE_DESKTOP:
      return 1.1;
    default:
      return 1.0;
    }
  }

  /**
   * Get grid columns for current breakpoint
   */
  public getGridColumns(defaultColumns: number = 3): number {
    switch (this.currentBreakpoint) {
    case Breakpoint.MOBILE_SMALL:
    case Breakpoint.MOBILE_SMALL:
      return 1;
    case Breakpoint.MOBILE:
      return 2;
    case Breakpoint.TABLET:
      return 2;
    case Breakpoint.DESKTOP:
      return defaultColumns;
    case Breakpoint.LARGE_DESKTOP:
      return defaultColumns + 1;
    default:
      return defaultColumns;
    }
  }

  /**
   * Get grid rows for current breakpoint
   */
  public getGridRows(defaultRows: number = 2): number {
    switch (this.currentBreakpoint) {
    case Breakpoint.MOBILE_SMALL:
    case Breakpoint.MOBILE_SMALL:
      return 3;
    case Breakpoint.MOBILE:
      return 2;
    case Breakpoint.TABLET:
      return 2;
    case Breakpoint.DESKTOP:
      return defaultRows;
    case Breakpoint.LARGE_DESKTOP:
      return defaultRows;
    default:
      return defaultRows;
    }
  }

  /**
   * Get responsive font size
   */
  public getResponsiveFontSize(baseSize: number): number {
    return Math.round(baseSize * this.getResponsiveScale());
  }

  /**
   * Get responsive spacing
   */
  public getResponsiveSpacing(baseSpacing: number): number {
    return Math.round(baseSpacing * this.getResponsiveScale());
  }

  /**
   * Check if touch target meets minimum size
   */
  public isTouchTargetValid(width: number, height: number): boolean {
    return width >= this.config.minTouchTargetSize && height >= this.config.minTouchTargetSize;
  }

  /**
   * Get safe area for touch targets
   */
  public getSafeArea(): Phaser.Geom.Rectangle {
    const padding = this.config.minTouchTargetSize / 2;
    return new Phaser.Geom.Rectangle(
      padding,
      padding,
      this.scene.scale.width - padding * 2,
      this.scene.scale.height - padding * 2,
    );
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ResponsiveConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<ResponsiveConfig> {
    return { ...this.config };
  }

  /**
   * Destroy responsive manager
   */
  public destroy(): void {
    // Remove resize listener
    this.scene.scale.off('resize', this.handleResize.bind(this));

    // Remove touch gesture listeners
    this.scene.input.off('pointerdown', this.handlePointerDown.bind(this));
    this.scene.input.off('pointerup', this.handlePointerUp.bind(this));
    this.scene.input.off('pointermove', this.handlePointerMove.bind(this));

    // Clear gesture callbacks
    this.gestureCallbacks.clear();
  }
}
