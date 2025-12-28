# Ninja Slicer Theme Visual Guide

## Color Palette Visualization

### Primary Colors
```
+----------------+----------------+----------------+----------------+
| Dark Red       | Dark Purple    | Gold           | Dark Blue-Gray |
| #8B0000        | #4A0080        | #FFD700        | #1A1A2E        |
+----------------+----------------+----------------+----------------+
| Primary buttons| Secondary btns | Accents/borders| Backgrounds    |
+----------------+----------------+----------------+----------------+
```

### Text Colors
```
+----------------+----------------+----------------+
| White          | Light Gray     | Dark Gray      |
| #FFFFFF        | #CCCCCC        | #666666        |
+----------------+----------------+----------------+
| Main text      | Secondary text | Disabled text  |
+----------------+----------------+----------------+
```

### State Colors
```
+----------------+----------------+----------------+
| Bright Red     | Bright Green   | Bright Orange  |
| #FF4444        | #44FF44        | #FFAA00        |
+----------------+----------------+----------------+
| Danger/errors  | Success        | Warnings       |
+----------------+----------------+----------------+
```

### Extended Palette
```
+----------------+----------------+----------------+----------------+----------------+
| Blood Red      | Vampire Purple| Ghostly Blue   | Demon Green    | Holy White     |
| #B80000        | #6A0DAD        | #00A8CC        | #008000        | #F5F5F5        |
+----------------+----------------+----------------+----------------+----------------+
| Health UI      | Vampire theme  | Ghost theme    | Demon theme    | Holy elements  |
+----------------+----------------+----------------+----------------+----------------+
```

## Typography Examples

### Font Hierarchy
```
Title: 64px Arial Black (900 weight)
+---------------------------------------------------+
| NINJA SLICER - WEAPON INVENTORY                  |
+---------------------------------------------------+

Heading: 32px Arial Black (700 weight)
+---------------------------------------------------+
| Available Swords                                 |
+---------------------------------------------------+

Subheading: 24px Arial (700 weight)
+---------------------------------------------------+
| Fire Sword - Elemental Weapon                    |
+---------------------------------------------------+

Body Text: 16px Georgia (400 weight)
+---------------------------------------------------+
| This powerful sword deals fire damage and        |
| has a chance to set enemies ablaze.              |
+---------------------------------------------------+

Caption: 14px Courier New (400 weight)
+---------------------------------------------------+
| ATK: 150 | CRIT: 25% | FIRE DMG: +50%           |
+---------------------------------------------------+
```

## UI Component Examples

### Button Variations
```
+---------------------+---------------------+---------------------+
| PRIMARY BUTTON      | SECONDARY BUTTON    | DANGER BUTTON       |
+---------------------+---------------------+---------------------+
| [Buy Weapon]        | [View Details]      | [Delete Save]       |
| BG: #8B0000         | BG: #4A0080         | BG: #FF4444         |
| Border: #FFD700     | Border: #FFD700     | Border: #8B0000     |
| Text: #FFFFFF       | Text: #FFFFFF       | Text: #FFFFFF       |
+---------------------+---------------------+---------------------+

States:
- Normal: Standard appearance
- Hover: Scale 1.02, brighter border, glow
- Pressed: Scale 0.98, darker background
- Disabled: 50% opacity, grayed out
```

### Card Design
```
+---------------------------------------------------+
|                   FIRE SWORD                      |
| +---------------+---------------------------------+
| |               | Elemental Weapon                |
| |  🔥🗡️         |                                 |
| |               | Deals fire damage to enemies    |
| +---------------+---------------------------------+
| | ATK: 150      | CRIT: 25%                      |
| | FIRE DMG: +50%| BURN CHANCE: 30%               |
| +---------------+---------------------------------+
| [Equip]        | [Upgrade]      | [Sell]         |
+---------------------------------------------------+

Locked Card:
+---------------------------------------------------+
|                   LOCKED WEAPON                   |
| +---------------+---------------------------------+
| |               | Requires Level 10               |
| |  🔒           |                                 |
| |               | Defeat the Vampire Lord to     |
| +---------------+---------------------------------+
| |               | unlock this weapon             |
| +---------------+---------------------------------+
+---------------------------------------------------+
```

### Panel Structure
```
+---------------------------------------------------+
| Panel Title [X]                                  |
+---------------------------------------------------+
|                                                   |
| Panel Content Area                               |
|                                                   |
| +-------------------------------+                 |
| |                               |                 |
| | Content goes here              |                 |
| |                               |                 |
| +-------------------------------+                 |
|                                                   |
+---------------------------------------------------+
| [Action Button]                                  |
+---------------------------------------------------+
```

## Layout Patterns

### Main Scene Layout
```
+---------------------------------------------------+
| Header: Logo | Navigation | Player Stats      |
+---------------------------------------------------+
|                                                   |
| Content Area: Main UI Components                 |
|                                                   |
| +-------------------------------+                 |
| | Panel/Modal Content           |                 |
| +-------------------------------+                 |
|                                                   |
+---------------------------------------------------+
| Footer: Action Buttons | Page Navigation      |
+---------------------------------------------------+
```

### Inventory Grid
```
+----------------+----------------+----------------+
| Weapon Card 1  | Weapon Card 2  | Weapon Card 3  |
+----------------+----------------+----------------+
| Weapon Card 4  | Weapon Card 5  | Weapon Card 6  |
+----------------+----------------+----------------+
| Weapon Card 7  | Weapon Card 8  | [Add More...]  |
+----------------+----------------+----------------+
```

### Settings Panel
```
+---------------------------------------------------+
| Settings [X]                                    |
+---------------------------------------------------+
|                                                   |
| Audio Settings                                    |
| [🔊 Music: 100%]  [🔈 Sound: 80%]               |
|                                                   |
| Gameplay Settings                                 |
| [☑️ Show Tutorials] [☑️ Screen Shake]           |
|                                                   |
| Controls                                          |
| [Keyboard] [Gamepad]                              |
|                                                   |
+---------------------------------------------------+
| [Save]           [Cancel]                         |
+---------------------------------------------------+
```

## Animation Examples

### Button Interaction
```
Normal State:
+---------------------+
| [Buy Weapon]        |
| Scale: 1.0          |
+---------------------+

Hover State:
+---------------------+
| [Buy Weapon]        |
| Scale: 1.02         |
| Glow: #FFD700       |
+---------------------+

Pressed State:
+---------------------+
| [Buy Weapon]        |
| Scale: 0.98         |
| BG: Darker          |
+---------------------+
```

### Modal Appearance
```
Initial State:
+---------------------+
| Alpha: 0            |
| Scale: 0.9          |
+---------------------+

Final State:
+---------------------+
| Alpha: 1            |
| Scale: 1.0          |
| Duration: 200ms     |
+---------------------+
```

## Implementation Checklist

### For Developers
- [ ] Update `src/config/constants.ts` with new theme colors
- [ ] Create theme constants file for easy access
- [ ] Apply theme to all existing UI components
- [ ] Ensure consistent spacing and layout
- [ ] Implement responsive design patterns
- [ ] Add accessibility features
- [ ] Test across all scenes

### For Designers
- [ ] Create theme-compliant UI assets
- [ ] Design consistent icon set
- [ ] Provide visual examples for new components
- [ ] Document visual style guide
- [ ] Create animation prototypes

### For QA
- [ ] Test color contrast ratios
- [ ] Verify responsive layouts
- [ ] Check accessibility compliance
- [ ] Test cross-device compatibility
- [ ] Validate animation performance

## Theme Evolution

### Future Enhancements
- Seasonal theme variations (Halloween, Christmas)
- Player-customizable themes
- Dynamic theme based on game progress
- Animated backgrounds and effects
- Advanced particle effects for UI elements

### Maintenance Plan
- Regular visual audits
- Player feedback integration
- Performance optimization
- Accessibility improvements
- Cross-platform consistency checks

This visual guide complements the comprehensive theme documentation and provides clear examples for implementing the Dark Gothic theme consistently across all Ninja Slicer UI components.