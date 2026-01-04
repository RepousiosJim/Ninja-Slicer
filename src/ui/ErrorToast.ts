/**
 * ErrorToast
 *
 * Non-blocking error notification system with severity-based styling
 * and auto-dismiss functionality.
 */

import Phaser from 'phaser';
import { ErrorSeverity } from '../utils/ErrorHandler';

export class ErrorToast extends Phaser.GameObjects.Container {
  private text: Phaser.GameObjects.Text;
  private background: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Text | null = null;
  private dismissCallback: (() => void) | null = null;
  private isDismissing: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.INFO,
    duration: number = 5000
  ) {
    super(scene, x, y);
    
    this.createToast(message, severity);
    this.addToScene();
    this.animateIn();
    this.scheduleDismiss(duration);
  }

  private createToast(message: string, severity: ErrorSeverity): void {
    const width = Math.min(600, this.scene.scale.width * 0.8);
    const height = 80;
    const padding = 15;

    const colors = {
      [ErrorSeverity.INFO]: { bg: 0x2196F3, border: 0x1976D2, text: '#ffffff' },
      [ErrorSeverity.WARNING]: { bg: 0xFF9800, border: 0xF57C00, text: '#ffffff' },
      [ErrorSeverity.ERROR]: { bg: 0xF44336, border: 0xD32F2F, text: '#ffffff' },
      [ErrorSeverity.CRITICAL]: { bg: 0xB71C1C, border: 0x7F0000, text: '#ffffff' }
    };

    const colorScheme = colors[severity];

    this.background = this.scene.add.rectangle(0, 0, width, height, colorScheme.bg, 0.95);
    this.background.setStrokeStyle(2, colorScheme.border);
    this.background.setOrigin(0.5, 1);
    
    const icons = {
      [ErrorSeverity.INFO]: 'ℹ️',
      [ErrorSeverity.WARNING]: '⚠️',
      [ErrorSeverity.ERROR]: '❌',
      [ErrorSeverity.CRITICAL]: '⛔'
    };

    this.icon = this.scene.add.text(-width / 2 + padding, -height / 2 + padding, icons[severity], {
      fontSize: '28px',
      color: colorScheme.text
    }).setOrigin(0, 0.5);

    this.text = this.scene.add.text(
      -width / 2 + padding + 40,
      0,
      message,
      {
        fontSize: '18px',
        color: colorScheme.text,
        fontFamily: 'Arial',
        wordWrap: { width: width - padding * 2 - 40 }
      }
    ).setOrigin(0, 0.5);

    this.add([this.background, this.icon, this.text]);
    this.setSize(width, height);
  }

  private addToScene(): void {
    this.scene.add.existing(this);
    this.setDepth(10000);
  }

  private animateIn(): void {
    this.alpha = 0;
    this.y += 50;
    
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      y: this.y - 50,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  private animateOut(): void {
    if (this.isDismissing) return;
    this.isDismissing = true;
    
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y + 50,
      duration: 200,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.destroy();
        if (this.dismissCallback) {
          this.dismissCallback();
        }
      }
    });
  }

  private scheduleDismiss(duration: number): void {
    this.scene.time.delayedCall(duration, () => {
      this.animateOut();
    });
  }

  public dismiss(): void {
    this.animateOut();
  }

  public setDismissCallback(callback: () => void): void {
    this.dismissCallback = callback;
  }

  public isActive(): boolean {
    return !this.isDismissing;
  }

  public updateMessage(message: string): void {
    if (this.text) {
      this.text.setText(message);
    }
  }

  public destroy(): void {
    if (this.isDismissing) return;
    
    this.scene.tweens.killTweensOf(this);
    super.destroy();
  }
}

export class ErrorToastManager {
  private scene: Phaser.Scene;
  private toasts: ErrorToast[] = [];
  private maxToasts: number = 3;
  private spacing: number = 90;
  private padding: number = 20;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public show(message: string, severity: ErrorSeverity = ErrorSeverity.INFO, duration: number = 5000): ErrorToast {
    this.cleanupDismissedToasts();
    
    const startY = this.padding + (this.toasts.length * this.spacing);
    const toast = new ErrorToast(this.scene, this.scene.scale.width / 2, startY, message, severity, duration);
    toast.setDismissCallback(() => {
      this.removeToast(toast);
      this.repositionToasts();
    });
    
    this.toasts.push(toast);
    
    if (this.toasts.length > this.maxToasts) {
      this.toasts[0].dismiss();
    }
    
    return toast;
  }

  private removeToast(toast: ErrorToast): void {
    const index = this.toasts.indexOf(toast);
    if (index !== -1) {
      this.toasts.splice(index, 1);
    }
  }

  private cleanupDismissedToasts(): void {
    this.toasts = this.toasts.filter(toast => toast.isActive());
  }

  private repositionToasts(): void {
    this.toasts.forEach((toast, index) => {
      const targetY = this.padding + (index * this.spacing);
      this.scene.tweens.add({
        targets: toast,
        y: targetY,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });
  }

  public showError(message: string, duration?: number): ErrorToast {
    return this.show(message, ErrorSeverity.ERROR, duration);
  }

  public showWarning(message: string, duration?: number): ErrorToast {
    return this.show(message, ErrorSeverity.WARNING, duration);
  }

  public showInfo(message: string, duration?: number): ErrorToast {
    return this.show(message, ErrorSeverity.INFO, duration);
  }

  public showCritical(message: string, duration?: number): ErrorToast {
    return this.show(message, ErrorSeverity.CRITICAL, duration || 10000);
  }

  public dismissAll(): void {
    this.toasts.forEach(toast => toast.dismiss());
  }

  public destroy(): void {
    this.toasts.forEach(toast => toast.destroy());
    this.toasts = [];
  }
}
