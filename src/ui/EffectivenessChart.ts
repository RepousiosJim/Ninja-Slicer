/**
 * EffectivenessChart Component
 *
 * A bar chart component showing weapon effectiveness against enemy types.
 * Features color-coded bars (green = effective, red = weak),
 * enemy type icons/labels, animated bar growth,
 * and support for both bar and radar chart modes.
 */

import Phaser from 'phaser';
import { COLORS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import { DARK_GOTHIC_THEME } from '../config/theme';
import { MonsterType } from '../config/types';
import { getMonsterColor } from '../utils/ThemeUtils';

/**
 * Effectiveness data interface
 */
export interface EffectivenessData {
  monsterType: MonsterType;
  effectiveness: number; // 0-100
}

/**
 * Effectiveness chart configuration interface
 */
export interface EffectivenessChartConfig {
  data: EffectivenessData[];
  chartType?: 'bar' | 'radar';
  width?: number;
  height?: number;
  showLabels?: boolean;
  showPercentages?: boolean;
}

/**
 * Effectiveness chart component for displaying weapon effectiveness
 */
export class EffectivenessChart extends Phaser.GameObjects.Container {
  // UI elements
  private background: Phaser.GameObjects.Rectangle;
  private bars: Phaser.GameObjects.Rectangle[] = [];
  private labels: Phaser.GameObjects.Text[] = [];
  private percentages: Phaser.GameObjects.Text[] = [];
  private radarLines: Phaser.GameObjects.Graphics | null = null;
  private radarFill: Phaser.GameObjects.Graphics | null = null;

  // Chart state
  private effectivenessData: EffectivenessData[];
  private chartType: 'bar' | 'radar';
  private chartWidth: number;
  private chartHeight: number;
  private showLabels: boolean;
  private showPercentages: boolean;

  /**
   * Create a new effectiveness chart
   * @param scene - The scene this chart belongs to
   * @param x - X position
   * @param y - Y position
   * @param config - Effectiveness chart configuration
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: EffectivenessChartConfig
  ) {
    super(scene, x, y);

    this.effectivenessData = config.data;
    this.chartType = config.chartType || 'bar';
    this.chartWidth = config.width || 300;
    this.chartHeight = config.height || 200;
    this.showLabels = config.showLabels !== false;
    this.showPercentages = config.showPercentages !== false;

    // Create background with theme
    this.background = scene.add.rectangle(0, 0, this.chartWidth, this.chartHeight, DARK_GOTHIC_THEME.colors.background);
    this.background.setStrokeStyle(2, DARK_GOTHIC_THEME.colors.accent);
    this.background.setAlpha(0.8);
    this.add(this.background);

    // Create chart based on type
    if (this.chartType === 'bar') {
      this.createBarChart();
    } else {
      this.createRadarChart();
    }

    // Add to scene
    this.scene.add.existing(this);
  }

  /**
   * Create bar chart with theme
   */
  private createBarChart(): void {
    const barWidth = (this.chartWidth - 40) / this.effectivenessData.length;
    const barSpacing = 10;
    const maxBarHeight = this.chartHeight - 60;

    this.effectivenessData.forEach((item, index) => {
      const x = -this.chartWidth / 2 + 20 + index * barWidth + barWidth / 2;
      const barHeight = (item.effectiveness / 100) * maxBarHeight;
      const y = this.chartHeight / 2 - 30 - barHeight / 2;

      // Create bar with theme colors
      const barColor = this.getEffectivenessColor(item.effectiveness);
      const bar = this.scene.add.rectangle(x, y, barWidth - barSpacing, 0, barColor);
      bar.setOrigin(0.5);
      this.add(bar);
      this.bars.push(bar);

      // Animate bar growth with theme animation
      this.scene.tweens.add({
        targets: bar,
        height: barHeight,
        duration: DARK_GOTHIC_THEME.animations.duration * 2,
        ease: DARK_GOTHIC_THEME.animations.easing,
        delay: index * 50,
      });

      // Create label with theme typography
      if (this.showLabels) {
        const label = this.scene.add.text(x, this.chartHeight / 2 - 15, this.getMonsterTypeLabel(item.monsterType), {
          fontFamily: DARK_GOTHIC_THEME.fonts.primary,
          fontSize: '12px',
          color: '#CCCCCC',
        });
        label.setOrigin(0.5);
        this.add(label);
        this.labels.push(label);
      }

      // Create percentage text with theme typography
      if (this.showPercentages) {
        const percentage = this.scene.add.text(x, y - barHeight / 2 - 10, `${item.effectiveness}%`, {
          fontFamily: DARK_GOTHIC_THEME.fonts.monospace,
          fontSize: '12px',
          color: '#FFFFFF',
          fontStyle: 'bold',
        });
        percentage.setOrigin(0.5);
        percentage.setAlpha(0);
        this.add(percentage);
        this.percentages.push(percentage);

        // Animate percentage appearance with theme animation
        this.scene.tweens.add({
          targets: percentage,
          alpha: 1,
          duration: DARK_GOTHIC_THEME.animations.duration,
          delay: DARK_GOTHIC_THEME.animations.duration + index * 50,
        });
      }
    });
  }

  /**
   * Create radar chart with theme
   */
  private createRadarChart(): void {
    this.radarLines = this.scene.add.graphics();
    this.radarLines.setDepth(1);
    this.add(this.radarLines);

    this.radarFill = this.scene.add.graphics();
    this.radarFill.setDepth(0);
    this.add(this.radarFill);

    const centerX = 0;
    const centerY = 0;
    const radius = Math.min(this.chartWidth, this.chartHeight) / 2 - 40;
    const numPoints = this.effectivenessData.length;
    const angleStep = (Math.PI * 2) / numPoints;

    // Draw radar grid with theme colors
    this.radarLines.lineStyle(1, DARK_GOTHIC_THEME.colors.textSecondary, 0.5);

    // Draw concentric circles
    for (let i = 1; i <= 4; i++) {
      const circleRadius = (radius / 4) * i;
      this.radarLines.strokeCircle(centerX, centerY, circleRadius);
    }

    // Draw axis lines
    for (let i = 0; i < numPoints; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      this.radarLines.lineBetween(centerX, centerY, x, y);
    }

    // Draw data polygon
    this.updateRadarData();

    // Create labels with theme typography
    if (this.showLabels) {
      this.effectivenessData.forEach((item, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const labelRadius = radius + 20;
        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius;

        const label = this.scene.add.text(x, y, this.getMonsterTypeLabel(item.monsterType), {
          fontFamily: DARK_GOTHIC_THEME.fonts.primary,
          fontSize: '12px',
          color: '#CCCCCC',
        });
        label.setOrigin(0.5);
        this.add(label);
        this.labels.push(label);
      });
    }
  }

  /**
   * Update radar data polygon with theme
   */
  private updateRadarData(): void {
    if (!this.radarFill || !this.radarLines) return;

    this.radarFill.clear();

    const centerX = 0;
    const centerY = 0;
    const radius = Math.min(this.chartWidth, this.chartHeight) / 2 - 40;
    const numPoints = this.effectivenessData.length;
    const angleStep = (Math.PI * 2) / numPoints;

    // Calculate points
    const points: { x: number; y: number }[] = [];
    this.effectivenessData.forEach((item, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const pointRadius = (item.effectiveness / 100) * radius;
      const x = centerX + Math.cos(angle) * pointRadius;
      const y = centerY + Math.sin(angle) * pointRadius;
      points.push({ x, y });
    });

    // Draw filled polygon with theme colors
    if (points.length > 0 && this.radarFill) {
      this.radarFill.fillStyle(DARK_GOTHIC_THEME.colors.secondary, 0.3);
      this.radarFill.beginPath();
      if (points[0]) {
        this.radarFill.moveTo(points[0].x, points[0].y);
      }
      for (const point of points) {
        this.radarFill.lineTo(point.x, point.y);
      }
      this.radarFill.closePath();
      this.radarFill.fillPath();

      // Draw polygon outline with theme
      this.radarFill.lineStyle(2, DARK_GOTHIC_THEME.colors.accent, 0.8);
      this.radarFill.beginPath();
      if (points[0]) {
        this.radarFill.moveTo(points[0].x, points[0].y);
      }
      for (const point of points) {
        this.radarFill.lineTo(point.x, point.y);
      }
      this.radarFill.closePath();
      this.radarFill.strokePath();

      // Draw points with theme
      for (const point of points) {
        this.radarFill.fillStyle(DARK_GOTHIC_THEME.colors.accent, 1);
        this.radarFill.fillCircle(point.x, point.y, 4);
      }
    }
  }

  /**
   * Get effectiveness color based on value with theme
   */
  private getEffectivenessColor(effectiveness: number): number {
    if (effectiveness >= 70) {
      return DARK_GOTHIC_THEME.colors.success; // Green - effective
    } else if (effectiveness >= 40) {
      return DARK_GOTHIC_THEME.colors.warning; // Orange - neutral
    } else {
      return DARK_GOTHIC_THEME.colors.danger; // Red - weak
    }
  }

  /**
   * Get monster type label
   */
  private getMonsterTypeLabel(type: MonsterType): string {
    const labels: Record<MonsterType, string> = {
      [MonsterType.ZOMBIE]: 'Zombie',
      [MonsterType.VAMPIRE]: 'Vampire',
      [MonsterType.GHOST]: 'Ghost',
    };
    return labels[type] || type;
  }

  /**
   * Update chart data
   * @param data - New effectiveness data
   */
  public updateData(data: EffectivenessData[]): void {
    this.effectivenessData = data;

    // Clear existing elements
    this.clearChart();

    // Recreate chart
    if (this.chartType === 'bar') {
      this.createBarChart();
    } else {
      this.createRadarChart();
    }
  }

  /**
   * Clear chart elements
   */
  private clearChart(): void {
    // Clear bars
    this.bars.forEach((bar) => {
      this.remove(bar);
      bar.destroy();
    });
    this.bars = [];

    // Clear labels
    this.labels.forEach((label) => {
      this.remove(label);
      label.destroy();
    });
    this.labels = [];

    // Clear percentages
    this.percentages.forEach((percentage) => {
      this.remove(percentage);
      percentage.destroy();
    });
    this.percentages = [];

    // Clear radar graphics
    if (this.radarLines) {
      this.radarLines.clear();
    }
    if (this.radarFill) {
      this.radarFill.clear();
    }
  }

  /**
   * Set chart type
   * @param type - New chart type ('bar' or 'radar')
   */
  public setChartType(type: 'bar' | 'radar'): void {
    if (this.chartType === type) return;

    this.chartType = type;
    this.clearChart();

    if (this.chartType === 'bar') {
      this.createBarChart();
    } else {
      this.createRadarChart();
    }
  }

  /**
   * Get current chart data
   */
  public getData(): EffectivenessData[] {
    return this.effectivenessData;
  }

  /**
   * Clean up chart resources
   */
  public destroy(): void {
    this.clearChart();

    if (this.radarLines) {
      this.radarLines.destroy();
    }
    if (this.radarFill) {
      this.radarFill.destroy();
    }

    super.destroy();
  }
}
