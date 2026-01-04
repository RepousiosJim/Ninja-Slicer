# Specification: Basic Audio Integration

## Overview

This task implements a comprehensive audio system for the Ninja Slicer game, addressing the #1 priority item in the IMPROVEMENT_ROADMAP. The system will add essential sound effects for combat actions (slash swoosh, monster deaths), progression feedback (combo milestones), and UI interactions (button clicks), along with user control via an audio toggle setting. This feature is critical for game feel, as silent games create a dead and unengaging experience.

## Workflow Type

**Type**: feature

**Rationale**: This is a new feature implementation that adds audio capabilities to an existing game system. It requires creating new audio management infrastructure, integrating with existing game events (slashing, monster deaths, combo progression, UI interactions), and adding user settings for audio control.

## Task Scope

### Services Involved
- **main** (primary) - TypeScript/Phaser game application where all audio integration will occur

### This Task Will:
- [x] Implement audio manager system for centralized sound playback
- [x] Integrate slash swoosh sound triggered on player swipe events
- [x] Add monster death sounds with type-specific variations
- [x] Create combo milestone sound system with escalating intensity
- [x] Add audio feedback to all UI button interactions
- [x] Implement settings toggle for audio on/off control
- [x] Organize audio assets in appropriate directory structure
- [x] Ensure audio system integrates with Phaser's audio capabilities

### Out of Scope:
- Background music implementation
- Advanced audio mixing or ducking
- 3D positional audio
- Audio asset creation (assumes assets will be provided)
- Volume slider controls (only on/off toggle required)
- Audio preloading optimization beyond basic Phaser defaults

## Service Context

### main

**Tech Stack:**
- Language: TypeScript
- Framework: Phaser (game engine)
- Build Tool: Vite
- Key directories: src/

**Entry Point:** `src/main.ts`

**How to Run:**
```bash
npm run dev
```

**Port:** 5173

## Files to Modify

⚠️ **Context Phase Gap**: The context discovery phase did not identify specific files. The implementation phase will need to explore the codebase to locate:

| Expected File Pattern | Service | What to Change |
|------|---------|---------------|
| `src/scenes/*GameScene.ts` or similar | main | Add audio manager initialization and swipe sound triggers |
| `src/entities/Monster.ts` or `src/monsters/*` | main | Integrate death sound playback on monster defeat |
| `src/systems/ComboSystem.ts` or similar | main | Add combo milestone sound triggers |
| `src/ui/*Button*.ts` or UI components | main | Add click sound feedback to button interactions |
| `src/managers/SettingsManager.ts` or similar | main | Add audio toggle state management |
| `src/managers/AudioManager.ts` (new) | main | Create centralized audio management system |

## Files to Reference

⚠️ **Context Phase Gap**: No reference files were identified. The implementation phase should search for:

| Expected Pattern | Pattern to Copy |
|------|----------------|
| Existing manager classes (`src/managers/*`) | Class structure, initialization patterns, singleton usage |
| Scene files (`src/scenes/*`) | Phaser lifecycle methods, event handling patterns |
| Settings/state management files | State persistence patterns, toggle implementation |
| UI component files | Event binding patterns for user interactions |

## Patterns to Follow

### Phaser Audio System Integration

Since this is a Phaser-based game, the audio system should leverage Phaser's built-in audio capabilities:

```typescript
// Expected pattern for Phaser audio
class AudioManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound>;
  private audioEnabled: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sounds = new Map();
  }

  preload() {
    // Load audio assets in Phaser preload
    this.scene.load.audio('swoosh', 'assets/audio/swoosh.mp3');
    this.scene.load.audio('monster_death_basic', 'assets/audio/death_basic.mp3');
  }

  play(soundKey: string, config?: Phaser.Types.Sound.SoundConfig) {
    if (!this.audioEnabled) return;

    const sound = this.scene.sound.add(soundKey, config);
    sound.play();
  }
}
```

**Key Points:**
- Use `scene.load.audio()` in preload phase
- Use `scene.sound.add()` and `.play()` for playback
- Check audio enabled state before playing
- Support sound configuration for volume/rate variations

### Settings Persistence Pattern

```typescript
// Expected localStorage pattern for settings
class SettingsManager {
  private static STORAGE_KEY = 'ninja-slicer-settings';

  static getAudioEnabled(): boolean {
    const settings = this.loadSettings();
    return settings.audioEnabled ?? true;
  }

  static setAudioEnabled(enabled: boolean): void {
    const settings = this.loadSettings();
    settings.audioEnabled = enabled;
    this.saveSettings(settings);
  }

  private static loadSettings(): Settings {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private static saveSettings(settings: Settings): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
  }
}
```

**Key Points:**
- Persist settings to localStorage
- Default audio to enabled (true)
- Provide getter/setter methods
- Type-safe settings interface

## Requirements

### Functional Requirements

1. **Slash Swoosh Sound**
   - Description: Play satisfying swoosh/slash sound effect whenever player performs a swipe action
   - Acceptance: Sound triggers immediately on swipe gesture, plays to completion without cutting off

2. **Monster Death Sounds**
   - Description: Play death sound when monster is defeated, with unique sounds per monster type
   - Acceptance: Each monster type has distinct death sound; sound plays when monster health reaches zero

3. **Combo Milestone Sounds**
   - Description: Play escalating intensity sounds at combo milestones (e.g., every 5 combo hits)
   - Acceptance: Sound intensity/pitch increases with combo level; plays at defined milestone thresholds

4. **UI Button Click Sounds**
   - Description: Provide audio feedback for all button interactions in the game UI
   - Acceptance: All interactive buttons play click sound on press; sound is consistent across UI

5. **Audio Toggle Setting**
   - Description: Settings option to enable/disable all game audio
   - Acceptance: Toggle persists across sessions; when disabled, no sounds play; re-enabling restores audio

### Edge Cases

1. **Rapid Sound Triggering** - Prevent audio distortion when multiple sounds trigger simultaneously (e.g., multiple monster deaths). Consider sound pooling or limiting concurrent instances.
2. **Settings During Gameplay** - Audio toggle should take effect immediately without requiring scene reload
3. **Browser Audio Restrictions** - Modern browsers require user interaction before audio playback; ensure first sound plays after user input
4. **Missing Audio Assets** - Gracefully handle missing audio files without crashing (log warning, continue silently)
5. **Audio Loading Failures** - Handle network errors or unsupported formats; provide fallback or silent mode

## Implementation Notes

### DO
- Use Phaser's built-in audio system (`scene.sound.add()`, `scene.load.audio()`)
- Preload all audio assets during scene initialization to prevent runtime delays
- Create centralized AudioManager class for consistent audio control
- Store audio enabled state in localStorage for persistence
- Use audio sprite sheets if multiple short sounds exist (optimization)
- Implement sound pooling for frequently played effects (slash swoosh)
- Follow existing TypeScript patterns in the codebase for class structure
- Use dependency injection or singleton pattern for AudioManager access across scenes

### DON'T
- Play audio directly in multiple places without centralized control
- Ignore browser autoplay restrictions (requires user interaction)
- Load audio assets synchronously during gameplay (causes lag)
- Hard-code audio file paths (use constants or configuration)
- Create separate toggle settings for different audio types (single master toggle for now)
- Implement custom audio library when Phaser provides built-in support

## Development Environment

### Start Services

```bash
# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

### Service URLs
- Main Application: http://localhost:5173

### Required Environment Variables

No additional environment variables required for audio feature. Existing `.env` configuration for Supabase, Notion, and Sentry remains unchanged.

### Audio Asset Requirements

Create `public/assets/audio/` directory structure:
```
public/assets/audio/
├── combat/
│   ├── swoosh.mp3
│   ├── swoosh_alt.mp3 (optional variation)
├── monsters/
│   ├── death_basic.mp3
│   ├── death_fast.mp3
│   ├── death_tank.mp3
│   └── (other type-specific sounds)
├── combo/
│   ├── milestone_1.mp3
│   ├── milestone_2.mp3
│   └── milestone_3.mp3
└── ui/
    └── button_click.mp3
```

**Audio Format Recommendations:**
- Format: MP3 (universally supported) or OGG (smaller file size)
- Sample Rate: 44.1kHz
- Bit Rate: 128kbps (balance quality/size)
- Duration:
  - Swoosh: 200-500ms
  - Death: 500-1000ms
  - Combo: 300-800ms
  - Click: 50-150ms

## Success Criteria

The task is complete when:

1. [x] Slash swoosh sound plays on every swipe gesture
2. [x] Monster death sounds play when monsters are defeated, with type-specific variations
3. [x] Combo milestone sounds trigger at defined thresholds with escalating intensity
4. [x] All UI buttons provide audio click feedback
5. [x] Settings menu contains functional audio toggle that persists across sessions
6. [x] No console errors related to audio playback
7. [x] Existing game functionality remains unaffected (no regressions)
8. [x] Audio toggle immediately affects playback without requiring page refresh
9. [x] Browser testing confirms audio works after user interaction (autoplay compliance)

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| AudioManager.play() respects enabled state | `src/managers/AudioManager.test.ts` | When audioEnabled=false, play() does not trigger sound |
| AudioManager.setEnabled() updates state | `src/managers/AudioManager.test.ts` | setEnabled(false) prevents subsequent play() calls |
| SettingsManager persistence | `src/managers/SettingsManager.test.ts` | Audio toggle state saves to/loads from localStorage correctly |
| Monster death sound mapping | `src/entities/Monster.test.ts` | Each monster type maps to correct death sound key |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| Swipe → Audio trigger | main (input → audio) | Swipe input event correctly triggers AudioManager.play('swoosh') |
| Monster defeat → Death sound | main (combat → audio) | Monster health reaching 0 triggers correct type-specific death sound |
| Combo milestone → Sound | main (combo system → audio) | Combo counter reaching milestones (5, 10, 15) triggers escalating sounds |
| Settings toggle → Audio state | main (UI → settings → audio) | Toggling audio setting updates AudioManager and persists to localStorage |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Combat Audio Flow | 1. Start game 2. Perform swipe 3. Hit monster 4. Kill monster | Swoosh plays on swipe; death sound plays on kill |
| Combo Progression | 1. Start game 2. Build combo to 5, 10, 15 | Milestone sounds play with increasing intensity/pitch |
| Audio Toggle Persistence | 1. Open settings 2. Disable audio 3. Close game 4. Reopen game 5. Swipe | Audio remains disabled; no sounds play |
| Audio Re-enable | 1. Start with audio disabled 2. Enable in settings 3. Perform swipe immediately | Sound plays without requiring page refresh |

### Browser Verification (if frontend)
| Page/Component | URL | Checks |
|----------------|-----|--------|
| Game Scene | `http://localhost:5173` | Swipe produces audible swoosh; volume is appropriate |
| Settings Menu | `http://localhost:5173` (in-game settings) | Audio toggle visible; clicking changes state; state persists |
| Combat Scene | `http://localhost:5173` (during gameplay) | Monster deaths produce distinct sounds per type |
| Combo Display | `http://localhost:5173` (during combo) | Milestone sounds escalate in intensity/pitch |
| UI Buttons | `http://localhost:5173` (menus) | All buttons produce click sound on press |

### Manual Testing Checklist
- [ ] **Browser Autoplay Compliance**: First sound plays only after user interaction (click/tap)
- [ ] **No Audio Overlap Distortion**: Multiple simultaneous sounds don't cause clipping/distortion
- [ ] **Immediate Toggle Response**: Disabling audio mid-gameplay stops sounds immediately
- [ ] **Asset Loading**: Audio files load without errors (check Network tab)
- [ ] **Console Errors**: No errors in browser console during audio playback
- [ ] **Mobile Testing**: Audio works on iOS Safari and Android Chrome (if applicable)

### QA Sign-off Requirements
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Browser verification complete (Chrome, Firefox, Safari minimum)
- [ ] Manual testing checklist 100% complete
- [ ] No regressions in existing game functionality (slashing, combos, UI still work)
- [ ] Code follows established TypeScript/Phaser patterns in codebase
- [ ] No security vulnerabilities introduced (audio files from trusted sources)
- [ ] Audio assets properly licensed and attributed (if required)
- [ ] Performance impact verified (no FPS drops during audio playback)

## Additional Implementation Guidance

### Phaser Scene Integration

The AudioManager should be initialized in the game's main scene(s):

```typescript
class GameScene extends Phaser.Scene {
  private audioManager!: AudioManager;

  preload() {
    this.audioManager = new AudioManager(this);
    this.audioManager.preload();
  }

  create() {
    this.audioManager.initialize();

    // Connect to game events
    this.events.on('player-swipe', () => {
      this.audioManager.play('swoosh');
    });
  }
}
```

### Monster Type Sound Mapping

```typescript
const MONSTER_DEATH_SOUNDS: Record<MonsterType, string> = {
  'basic': 'death_basic',
  'fast': 'death_fast',
  'tank': 'death_tank',
  // ... other types
};

class Monster {
  die() {
    const soundKey = MONSTER_DEATH_SOUNDS[this.type];
    audioManager.play(soundKey);
  }
}
```

### Combo Escalation Logic

```typescript
class ComboSystem {
  private getComboSound(comboCount: number): string {
    if (comboCount >= 15) return 'milestone_3'; // High intensity
    if (comboCount >= 10) return 'milestone_2'; // Medium intensity
    if (comboCount >= 5) return 'milestone_1';  // Low intensity
    return '';
  }

  private checkMilestone(comboCount: number) {
    if (comboCount % 5 === 0) {
      const sound = this.getComboSound(comboCount);
      if (sound) audioManager.play(sound);
    }
  }
}
```

## Risk Assessment

### Technical Risks
1. **Browser Compatibility**: Older browsers may have limited audio format support
   - Mitigation: Provide both MP3 and OGG formats; feature detection

2. **Performance Impact**: Playing many sounds simultaneously could impact frame rate
   - Mitigation: Limit concurrent sounds; use audio pooling; test on low-end devices

3. **Asset Size**: Multiple audio files could increase initial load time
   - Mitigation: Compress audio files; consider lazy loading non-critical sounds

### User Experience Risks
1. **Annoying Repetition**: Slash sound playing too frequently could irritate players
   - Mitigation: Slight randomization in pitch/volume; multiple swoosh variations

2. **Settings Discoverability**: Users may not find audio toggle
   - Mitigation: Clear settings UI; default to enabled (most users expect audio)

## Next Steps for Implementation Phase

1. **Codebase Exploration** (Priority: HIGH)
   - Locate game scene files (`src/scenes/*`)
   - Find monster entity definitions and death handling
   - Identify combo system implementation
   - Locate UI button components
   - Find or create settings manager

2. **Audio Manager Development**
   - Create `src/managers/AudioManager.ts`
   - Implement Phaser audio integration
   - Add enabled state management
   - Create sound preloading logic

3. **Event Integration**
   - Hook swipe events to swoosh sound
   - Connect monster death to type-specific sounds
   - Add combo milestone triggers
   - Bind UI button click events

4. **Settings Implementation**
   - Create/update settings UI with audio toggle
   - Implement localStorage persistence
   - Connect toggle to AudioManager state

5. **Testing & Validation**
   - Manual browser testing
   - Verify all acceptance criteria
   - Performance profiling
   - Cross-browser compatibility check
