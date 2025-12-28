# Character & Weapon Screen Implementation Plan
## Ninja Slicer Game - Implementation Roadmap

**Document Version:** 1.0
**Date:** 2025-12-27
**Game:** Ninja Slicer (Phaser 3)
**Theme:** Supernatural/Horror

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Implementation Phases Overview](#implementation-phases-overview)
3. [Phase 1: Core UI Components](#phase-1-core-ui-components)
4. [Phase 2: Character Screen Enhancements](#phase-2-character-screen-enhancements)
5. [Phase 3: Weapon Screen Enhancements](#phase-3-weapon-screen-enhancements)
6. [Phase 4: Advanced Features and Polish](#phase-4-advanced-features-and-polish)
7. [Dependencies Matrix](#dependencies-matrix)
8. [Risk Assessment](#risk-assessment)
9. [Testing Strategy](#testing-strategy)

---

## Executive Summary

This implementation plan outlines the phased development of enhanced Character and Weapon screens for the Ninja Slicer game. The plan follows a modular approach, building core UI components first, then enhancing existing screens, and finally adding advanced features and polish.

**Key Implementation Goals:**
- Modular, reusable UI components
- Enhanced visual design with horror/supernatural theme
- Improved user experience and information architecture
- Performance-optimized animations and interactions
- Mobile-responsive design
- Accessibility compliance

**Total Estimated Effort:** High (4 phases, ~20 tasks, ~50 subtasks)
**Timeline:** 4-6 weeks (depending on team size and asset availability)

---

## Implementation Phases Overview

### Phase 1: Core UI Components (Foundation Layer)
**Focus:** Build reusable UI components that will be used across both screens
**Effort:** High
**Duration:** 1-2 weeks
**Dependencies:** None (foundation phase)

### Phase 2: Character Screen Enhancements (Primary UX)
**Focus:** Redesign and enhance the CharacterScene with new layout and features
**Effort:** High
**Duration:** 1-2 weeks
**Dependencies:** Phase 1 completion

### Phase 3: Weapon Screen Enhancements (Secondary UX)
**Focus:** Redesign and enhance the InventoryScene with filtering and comparison
**Effort:** High
**Duration:** 1-2 weeks
**Dependencies:** Phase 1 completion

### Phase 4: Advanced Features and Polish (Enhancement Layer)
**Focus:** Add advanced interactions, animations, and performance optimizations
**Effort:** Medium
**Duration:** 1 week
**Dependencies:** Phases 1-3 completion

---

## Phase 1: Core UI Components

### Task 1.1: WeaponCard Component
**Complexity:** Medium
**Files to Create/Modify:**
- `src/ui/WeaponCard.ts` (new)
- `src/ui/WeaponCard.ts` (update types)

**Subtasks:**
1.1.1 Create base WeaponCard class extending Phaser.GameObjects.Container
1.1.2 Implement rarity border system with color coding
1.1.3 Add animated weapon icon with hover effects
1.1.4 Create tier badge component with Roman numerals
1.1.5 Add effectiveness preview icons
1.1.6 Implement equip/details button actions
1.1.7 Add lock overlay for locked weapons
1.1.8 Create hover preview tooltip system

**Dependencies:** None
**Acceptance Criteria:**
- WeaponCard renders correctly with all visual elements
- Hover animations work smoothly (60fps)
- Button interactions trigger appropriate callbacks
- Rarity colors match design specification
- Component is fully typed and documented

### Task 1.2: WeaponPreview Component
**Complexity:** Medium
**Files to Create/Modify:**
- `src/ui/WeaponPreview.ts` (new)
- `src/config/types.ts` (update animation types)

**Subtasks:**
1.2.1 Create WeaponPreview class for large weapon display
1.2.2 Implement idle floating animation (±5px vertical)
1.2.3 Add glow effects based on weapon rarity
1.2.4 Create trail effect preview system
1.2.5 Add weapon type badge (Melee/Magic/Elemental)
1.2.6 Implement hover scale and glow intensification
1.2.7 Add selection pulse animation
1.2.8 Create particle burst on selection

**Dependencies:** None
**Acceptance Criteria:**
- Weapon preview displays with smooth animations
- Glow effects render correctly for all rarities
- Trail preview shows weapon-specific colors
- Performance maintains 60fps during animations

### Task 1.3: StatBar Component
**Complexity:** Low
**Files to Create/Modify:**
- `src/ui/StatBar.ts` (new)
- `src/ui/StatBar.ts` (update with color schemes)

**Subtasks:**
1.3.1 Create StatBar class extending ProgressBar
1.3.2 Implement color coding (green/yellow/red for values)
1.3.3 Add animated fill on value changes
1.3.4 Create tooltip system for detailed stats
1.3.5 Add comparison mode highlighting
1.3.6 Implement responsive width adjustments

**Dependencies:** None
**Acceptance Criteria:**
- Stat bars animate smoothly on value changes
- Color coding accurately represents stat levels
- Tooltips display correct information
- Component handles edge cases (0% and 100%)

### Task 1.4: EffectivenessChart Component
**Complexity:** High
**Files to Create/Modify:**
- `src/ui/EffectivenessChart.ts` (new)
- `src/data/weapons.json` (update effectiveness data)
- `src/managers/WeaponManager.ts` (add effectiveness calculations)

**Subtasks:**
1.4.1 Create EffectivenessChart class with bar chart option
1.4.2 Implement radar chart alternative
1.4.3 Add enemy type icons and labels
1.4.4 Create animated fill on chart load
1.4.5 Add color coding by effectiveness level
1.4.6 Implement hover tooltips with percentages
1.4.7 Add comparison mode for side-by-side charts

**Dependencies:** Task 1.3 (StatBar for consistent styling)
**Acceptance Criteria:**
- Charts render accurately with weapon data
- Animations are smooth and not jarring
- Hover interactions provide clear feedback
- Both chart types (bar/radar) work correctly

### Task 1.5: EffectCard Component
**Complexity:** Low
**Files to Create/Modify:**
- `src/ui/EffectCard.ts` (new)
- `src/ui/EffectCard.ts` (add effect icon mapping)

**Subtasks:**
1.5.1 Create EffectCard class for special effects display
1.5.2 Add effect icon system (fire, ice, lightning, etc.)
1.5.3 Implement tier progression indicators
1.5.4 Add hover tooltips with full descriptions
1.5.5 Create compact layout for multiple effects

**Dependencies:** None
**Acceptance Criteria:**
- Effect cards display correctly with icons
- Hover tooltips show detailed information
- Layout adapts to different numbers of effects

### Task 1.6: FilterBar Component
**Complexity:** Medium
**Files to Create/Modify:**
- `src/ui/FilterBar.ts` (new)
- `src/ui/FilterBar.ts` (add dropdown functionality)

**Subtasks:**
1.6.1 Create FilterBar class with dropdown controls
1.6.2 Implement filter options (All, Type, Rarity, Effectiveness)
1.6.3 Add sort options (Name, Rarity, Tier, Effectiveness)
1.6.4 Create filter state management
1.6.5 Add visual feedback for active filters
1.6.6 Implement filter reset functionality

**Dependencies:** None
**Acceptance Criteria:**
- Filter dropdowns work correctly
- Sort options apply proper ordering
- Visual feedback indicates active filters
- State persists during screen navigation

### Task 1.7: ComparisonView Component
**Complexity:** High
**Files to Create/Modify:**
- `src/ui/ComparisonView.ts` (new)
- `src/ui/ComparisonView.ts` (add side-by-side layout)

**Subtasks:**
1.7.1 Create ComparisonView modal class
1.7.2 Implement side-by-side weapon display
1.7.3 Add stat comparison with highlighting
1.7.4 Create effectiveness comparison charts
1.7.5 Add quick switch functionality
1.7.6 Implement weapon selection for comparison

**Dependencies:** Tasks 1.1, 1.3, 1.4
**Acceptance Criteria:**
- Comparison view displays two weapons clearly
- Stat differences are visually highlighted
- Switch functionality works correctly
- Modal can be closed and reopened

### Task 1.8: WeaponDetailsModal Component
**Complexity:** High
**Files to Create/Modify:**
- `src/ui/WeaponDetailsModal.ts` (new)
- `src/ui/WeaponDetailsModal.ts` (add tabbed interface)

**Subtasks:**
1.8.1 Create WeaponDetailsModal class
1.8.2 Implement detailed weapon information display
1.8.3 Add upgrade path visualization
1.8.4 Create special effects section
1.8.5 Add equip/upgrade action buttons
1.8.6 Implement modal animations (open/close)

**Dependencies:** Tasks 1.1, 1.3, 1.4, 1.5
**Acceptance Criteria:**
- Modal displays comprehensive weapon information
- Upgrade path is clearly visualized
- Action buttons trigger correct behaviors
- Modal animations are smooth

### Task 1.9: TierBadge Component
**Complexity:** Low
**Files to Create/Modify:**
- `src/ui/TierBadge.ts` (new)
- `src/ui/TierBadge.ts` (add color schemes)

**Subtasks:**
1.9.1 Create TierBadge class for Roman numerals
1.9.2 Implement color coding by tier
1.9.3 Add glow effects for higher tiers
1.9.4 Create scalable size variants

**Dependencies:** None
**Acceptance Criteria:**
- Badges display correct Roman numerals
- Colors match tier hierarchy
- Glow effects enhance visual hierarchy

---

## Phase 2: Character Screen Enhancements

### Task 2.1: CharacterScene Layout Redesign
**Complexity:** High
**Files to Create/Modify:**
- `src/scenes/CharacterScene.ts` (major refactor)
- `src/scenes/CharacterScene.ts` (update layout structure)

**Subtasks:**
2.1.1 Analyze current CharacterScene structure
2.1.2 Create new layout with weapon preview area
2.1.3 Implement stat panels (weapon/player side-by-side)
2.1.4 Add effectiveness visualization section
2.1.5 Create active effects display area
2.1.6 Update navigation button layout

**Dependencies:** Phase 1 completion
**Acceptance Criteria:**
- New layout matches design specification
- All sections are properly positioned
- Responsive design works on different screen sizes

### Task 2.2: Weapon Preview Integration
**Complexity:** Medium
**Files to Create/Modify:**
- `src/scenes/CharacterScene.ts` (add WeaponPreview integration)

**Subtasks:**
2.2.1 Integrate WeaponPreview component into layout
2.2.2 Connect weapon data to preview display
2.2.3 Add weapon switching functionality
2.2.4 Implement preview animations and effects

**Dependencies:** Task 2.1, Task 1.2
**Acceptance Criteria:**
- Weapon preview displays current equipped weapon
- Switching weapons updates preview smoothly
- Animations enhance user experience

### Task 2.3: Enhanced Stat Display
**Complexity:** Medium
**Files to Create/Modify:**
- `src/scenes/CharacterScene.ts` (add StatBar integration)
- `src/managers/WeaponManager.ts` (add stat calculation methods)

**Subtasks:**
2.3.1 Integrate StatBar components for weapon stats
2.3.2 Add player stat display with progress bars
2.3.3 Implement comparison mode against base weapon
2.3.4 Add tooltips for detailed stat information

**Dependencies:** Task 2.1, Task 1.3
**Acceptance Criteria:**
- Stats display accurately with visual bars
- Comparison mode highlights improvements
- Tooltips provide additional context

### Task 2.4: Effectiveness Visualization
**Complexity:** Medium
**Files to Create/Modify:**
- `src/scenes/CharacterScene.ts` (add EffectivenessChart integration)

**Subtasks:**
2.4.1 Integrate EffectivenessChart into layout
2.4.2 Connect weapon effectiveness data
2.4.3 Add chart animation on weapon change
2.4.4 Implement chart type selection (bar/radar)

**Dependencies:** Task 2.1, Task 1.4
**Acceptance Criteria:**
- Effectiveness chart displays correct data
- Animations provide smooth transitions
- Chart type can be switched

### Task 2.5: Active Effects Display
**Complexity:** Low
**Files to Create/Modify:**
- `src/scenes/CharacterScene.ts` (add EffectCard integration)

**Subtasks:**
2.5.1 Integrate EffectCard components
2.5.2 Display current tier effects
2.5.3 Add next tier preview
2.5.4 Implement effect hover details

**Dependencies:** Task 2.1, Task 1.5
**Acceptance Criteria:**
- Active effects display correctly
- Next tier information is visible
- Hover interactions work smoothly

### Task 2.6: Interactive Elements
**Complexity:** Medium
**Files to Create/Modify:**
- `src/scenes/CharacterScene.ts` (add interaction handlers)

**Subtasks:**
2.6.1 Add "View Details" button functionality
2.6.2 Implement "Test Weapon" mode trigger
2.6.3 Add "View Upgrades" navigation
2.6.4 Create weapon comparison mode
2.6.5 Add weapon cycling interactions

**Dependencies:** Task 2.1, Task 1.7, Task 1.8
**Acceptance Criteria:**
- All buttons trigger appropriate actions
- Interactions provide clear feedback
- Navigation flows work correctly

---

## Phase 3: Weapon Screen Enhancements

### Task 3.1: InventoryScene Layout Redesign
**Complexity:** High
**Files to Create/Modify:**
- `src/scenes/InventoryScene.ts` (major refactor)

**Subtasks:**
3.1.1 Analyze current InventoryScene structure
3.1.2 Create new grid layout with filter bar
3.1.3 Implement pagination system
3.1.4 Add weapon card grid display
3.1.5 Update navigation elements

**Dependencies:** Phase 1 completion
**Acceptance Criteria:**
- New layout matches design specification
- Grid displays weapons correctly
- Pagination works for large weapon collections

### Task 3.2: Enhanced Weapon Cards Integration
**Complexity:** Medium
**Files to Create/Modify:**
- `src/scenes/InventoryScene.ts` (add WeaponCard integration)

**Subtasks:**
3.2.1 Integrate WeaponCard components into grid
3.2.2 Connect weapon data to card displays
3.2.3 Add hover preview functionality
3.2.4 Implement card selection states

**Dependencies:** Task 3.1, Task 1.1
**Acceptance Criteria:**
- Weapon cards display all required information
- Hover effects enhance user experience
- Selection states are visually clear

### Task 3.3: Filter and Sort System
**Complexity:** Medium
**Files to Create/Modify:**
- `src/scenes/InventoryScene.ts` (add FilterBar integration)
- `src/managers/WeaponManager.ts` (add filtering methods)

**Subtasks:**
3.3.1 Integrate FilterBar component
3.3.2 Implement filter logic for weapon types
3.3.3 Add sort functionality for all criteria
3.3.4 Create filtered weapon list management
3.3.5 Add filter state persistence

**Dependencies:** Task 3.1, Task 1.6
**Acceptance Criteria:**
- Filters work correctly for all criteria
- Sort options apply proper ordering
- Filtered results update grid immediately

### Task 3.4: Weapon Comparison Mode
**Complexity:** High
**Files to Create/Modify:**
- `src/scenes/InventoryScene.ts` (add ComparisonView integration)

**Subtasks:**
3.4.1 Integrate ComparisonView modal
3.4.2 Add comparison trigger from weapon cards
3.4.3 Implement weapon selection for comparison
3.4.4 Add comparison result handling

**Dependencies:** Task 3.1, Task 1.7
**Acceptance Criteria:**
- Comparison mode can be triggered
- Weapon selection works correctly
- Comparison results are actionable

### Task 3.5: Weapon Details Integration
**Complexity:** Medium
**Files to Create/Modify:**
- `src/scenes/InventoryScene.ts` (add WeaponDetailsModal integration)

**Subtasks:**
3.5.1 Integrate WeaponDetailsModal
3.5.2 Connect card buttons to modal display
3.5.3 Add modal action handling
3.5.4 Implement modal close behavior

**Dependencies:** Task 3.1, Task 1.8
**Acceptance Criteria:**
- Details modal opens from card buttons
- Modal displays correct weapon information
- Actions (equip/upgrade) work correctly

### Task 3.6: Shop Integration
**Complexity:** Low
**Files to Create/Modify:**
- `src/scenes/InventoryScene.ts` (add shop navigation)

**Subtasks:**
3.6.1 Add "Buy" buttons to locked weapon cards
3.6.2 Implement shop navigation for locked weapons
3.6.3 Display unlock costs on cards
3.6.4 Add upgrade cost previews

**Dependencies:** Task 3.2
**Acceptance Criteria:**
- Locked weapons show buy options
- Shop navigation works correctly
- Cost information is accurate

---

## Phase 4: Advanced Features and Polish

### Task 4.1: Test Weapon Mode
**Complexity:** High
**Files to Create/Modify:**
- `src/scenes/TestWeaponScene.ts` (new)
- `src/scenes/CharacterScene.ts` (add navigation)

**Subtasks:**
4.1.1 Create TestWeaponScene class
4.1.2 Implement simplified gameplay for testing
4.1.3 Add weapon switching during test
4.1.4 Create test completion and results
4.1.5 Add navigation back to character screen

**Dependencies:** Phase 2 completion
**Acceptance Criteria:**
- Test mode provides weapon feedback
- Gameplay is simplified but functional
- Results inform weapon selection

### Task 4.2: Particle Effects System
**Complexity:** Medium
**Files to Create/Modify:**
- `src/systems/ParticleSystem.ts` (new/enhance)
- `src/ui/WeaponPreview.ts` (add particle integration)

**Subtasks:**
4.2.1 Create particle system for weapon effects
4.2.2 Add ambient particles to rare weapons
4.2.3 Implement burst effects on selection
4.2.4 Add sparkle effects on hover
4.2.5 Optimize particle performance

**Dependencies:** Phase 1-3 completion
**Acceptance Criteria:**
- Particles enhance visual appeal
- Performance impact is minimal
- Effects are appropriately themed

### Task 4.3: Advanced Animations
**Complexity:** Medium
**Files to Create/Modify:**
- `src/utils/AnimationManager.ts` (new)
- `src/scenes/CharacterScene.ts` (enhance animations)
- `src/scenes/InventoryScene.ts` (enhance animations)

**Subtasks:**
4.3.1 Create centralized animation manager
4.3.2 Add screen transition animations
4.3.3 Implement staggered card animations
4.3.4 Add loading animations for data
4.3.5 Create smooth state transitions

**Dependencies:** Phase 1-3 completion
**Acceptance Criteria:**
- Animations feel polished and professional
- Transitions are smooth and not jarring
- Performance remains high

### Task 4.4: Performance Optimization
**Complexity:** Medium
**Files to Create/Modify:**
- `src/utils/ObjectPool.ts` (enhance)
- `src/managers/AssetManager.ts` (new)
- `src/scenes/CharacterScene.ts` (optimize)
- `src/scenes/InventoryScene.ts` (optimize)

**Subtasks:**
4.4.1 Implement object pooling for UI components
4.4.2 Add lazy loading for weapon assets
4.4.3 Optimize animation frame rates
4.4.4 Implement texture atlas usage
4.4.5 Add memory cleanup on scene changes

**Dependencies:** Phase 1-3 completion
**Acceptance Criteria:**
- Frame rate remains stable at 60fps
- Memory usage is optimized
- Load times are acceptable

### Task 4.5: Accessibility Improvements
**Complexity:** Low
**Files to Create/Modify:**
- `src/utils/AccessibilityManager.ts` (new)
- `src/ui/*.ts` (add ARIA labels)

**Subtasks:**
4.5.1 Add ARIA labels to interactive elements
4.5.2 Implement keyboard navigation
4.5.3 Add screen reader support
4.5.4 Create high contrast mode
4.5.5 Add focus indicators

**Dependencies:** Phase 1-3 completion
**Acceptance Criteria:**
- Screen readers can navigate the interface
- Keyboard navigation works for all features
- Color contrast meets accessibility standards

### Task 4.6: Mobile Responsiveness
**Complexity:** Medium
**Files to Create/Modify:**
- `src/utils/ResponsiveManager.ts` (new)
- `src/scenes/CharacterScene.ts` (responsive updates)
- `src/scenes/InventoryScene.ts` (responsive updates)

**Subtasks:**
4.6.1 Create responsive layout system
4.6.2 Add touch gesture support
4.6.3 Implement mobile-optimized layouts
4.6.4 Add swipe navigation
4.6.5 Optimize touch targets

**Dependencies:** Phase 1-3 completion
**Acceptance Criteria:**
- Interface works well on mobile devices
- Touch interactions are intuitive
- Layout adapts to different screen sizes

---

## Dependencies Matrix

| Task | Dependencies |
|------|-------------|
| 1.1 WeaponCard | None |
| 1.2 WeaponPreview | None |
| 1.3 StatBar | None |
| 1.4 EffectivenessChart | 1.3 |
| 1.5 EffectCard | None |
| 1.6 FilterBar | None |
| 1.7 ComparisonView | 1.1, 1.3, 1.4 |
| 1.8 WeaponDetailsModal | 1.1, 1.3, 1.4, 1.5 |
| 1.9 TierBadge | None |
| 2.1 CharacterScene Layout | Phase 1 |
| 2.2 Weapon Preview Integration | 2.1, 1.2 |
| 2.3 Enhanced Stat Display | 2.1, 1.3 |
| 2.4 Effectiveness Visualization | 2.1, 1.4 |
| 2.5 Active Effects Display | 2.1, 1.5 |
| 2.6 Interactive Elements | 2.1, 1.7, 1.8 |
| 3.1 InventoryScene Layout | Phase 1 |
| 3.2 Enhanced Weapon Cards | 3.1, 1.1 |
| 3.3 Filter and Sort System | 3.1, 1.6 |
| 3.4 Weapon Comparison Mode | 3.1, 1.7 |
| 3.5 Weapon Details Integration | 3.1, 1.8 |
| 3.6 Shop Integration | 3.2 |
| 4.1 Test Weapon Mode | Phase 2 |
| 4.2 Particle Effects | Phases 1-3 |
| 4.3 Advanced Animations | Phases 1-3 |
| 4.4 Performance Optimization | Phases 1-3 |
| 4.5 Accessibility | Phases 1-3 |
| 4.6 Mobile Responsiveness | Phases 1-3 |

---

## Risk Assessment

### High Risk Items
1. **Performance Impact of Animations** - Risk: Complex animations may drop frame rate
   - Mitigation: Performance testing in Phase 4, fallback to simpler animations

2. **Asset Loading Times** - Risk: Large number of new assets may increase load times
   - Mitigation: Implement lazy loading and asset optimization

3. **Mobile Responsiveness** - Risk: Touch interactions may not work as expected
   - Mitigation: Early mobile testing and iteration

### Medium Risk Items
1. **Component Integration** - Risk: UI components may not integrate smoothly
   - Mitigation: Comprehensive testing of component interactions

2. **Data Structure Changes** - Risk: Weapon data extensions may break existing code
   - Mitigation: Backward compatibility and thorough testing

### Low Risk Items
1. **Visual Design Consistency** - Risk: New components may not match theme
   - Mitigation: Design review checkpoints

---

## Testing Strategy

### Unit Testing
- Component rendering and interactions
- Data transformation and calculations
- Animation performance metrics

### Integration Testing
- Component communication
- Scene transitions
- Data flow between managers

### User Acceptance Testing
- Visual design compliance
- User flow validation
- Performance benchmarks
- Accessibility compliance

### Performance Testing
- Frame rate monitoring
- Memory usage tracking
- Load time measurements
- Asset loading optimization

---

**End of Implementation Plan**