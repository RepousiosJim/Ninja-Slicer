# Gotchas & Pitfalls

Things to watch out for in this codebase.

## [2025-12-30 09:01]
Variable used before declaration: In TypeScript, using a variable before its const/let declaration causes a runtime error. Always declare variables before use, especially when moving code blocks around.

_Context: SlashSystem.ts checkMonsterCollisions() - monsterType was used on line 586 but declared on line 590_
