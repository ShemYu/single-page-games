# Crystal Vanguard / 琉璃城：八方守晶

A single-page pixel tactics tower-defense POC inside **Shem's Tiny Arcade**.

Play it from the arcade:

```text
https://shemyu.github.io/single-page-games/games/crystal-vanguard/
```

## What is implemented

- eight-direction enemy wave forecasting
- recruitable tactics roster
- pre-battle deployment on a grid
- auto-battler movement and combat
- unit merging from first through fourth rank
- crystal health and round progression
- shop rerolls
- rally command during battle
- keyboard, mouse, and touch controls
- lightweight procedural audio

## Controls

| Input | Action |
| --- | --- |
| Mouse / touch | Select units, buy recruits, deploy on the battlefield |
| `Space` | Start the next battle |
| `R` | Reroll the shop |
| `Q` | Rally deployed units to the crystal during battle |
| Right click | Bench the selected deployed unit |

## POC notes

This is intentionally self-contained: one HTML file with embedded CSS, JavaScript, canvas rendering, and audio. The goal is to validate the tactical loop before extracting assets or introducing a framework.
