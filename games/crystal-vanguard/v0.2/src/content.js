import { ContentRegistry } from './core.js';

export const CONTENT_VERSION = '2026-06-26.v0.2';

const sharedDirectionalActions = Object.freeze({
  idle: Object.freeze({ frames: 6, fps: 7, repeat: -1 }),
  walk: Object.freeze({ frames: 8, fps: 12, repeat: -1 }),
  attack: Object.freeze({ frames: 8, fps: 14, repeat: 0, impactFrame: 4 }),
  cast: Object.freeze({ frames: 8, fps: 12, repeat: 0, impactFrame: 4 }),
  hurt: Object.freeze({ frames: 4, fps: 12, repeat: 0 }),
  death: Object.freeze({ frames: 8, fps: 10, repeat: 0, hold: true })
});

export const ASSET_DEFINITIONS = [
  {
    id: 'unit.blade.rank1',
    type: 'directional-sprite',
    status: 'integrated',
    cell: 96,
    rows: 8,
    anchor: { x: 48, y: 82 },
    displayScale: 0.92,
    actions: {
      idle: { ...sharedDirectionalActions.idle, file: '../assets/units/blade-rank1-idle.png' },
      walk: { ...sharedDirectionalActions.walk, file: '../assets/units/blade-rank1-walk.png' },
      attack: { ...sharedDirectionalActions.attack, file: '../assets/units/blade-rank1-attack.png' },
      cast: { ...sharedDirectionalActions.cast, file: '../assets/units/blade-rank1-cast.png' },
      hurt: { ...sharedDirectionalActions.hurt, file: '../assets/units/blade-rank1-hurt.png' },
      death: { ...sharedDirectionalActions.death, file: '../assets/units/blade-rank1-death.png' }
    },
    fallback: { shape: 'shield', glyph: '⚔', primary: 0x6c93a5, secondary: 0xd8e2df }
  },
  {
    id: 'unit.bow.rank1',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'diamond', glyph: '➹', primary: 0x5f8a62, secondary: 0xb9db86 }
  },
  {
    id: 'unit.arcane.rank1',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'hex', glyph: '✦', primary: 0x765a9c, secondary: 0xd1adff }
  },
  {
    id: 'unit.light.rank1',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'circle', glyph: '✚', primary: 0xc7906d, secondary: 0xfff1b0 }
  },
  {
    id: 'unit.shade.rank1',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'diamond', glyph: '◆', primary: 0x554765, secondary: 0xb8a6d8 }
  },
  {
    id: 'unit.gel.rank1',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'blob', glyph: '●', primary: 0x4d9e7a, secondary: 0x9decb3 }
  },
  {
    id: 'monster.sprout',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'blob', glyph: '♣', primary: 0x3f7049, secondary: 0x79bb6c }
  },
  {
    id: 'monster.moth',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'wing', glyph: '⌁', primary: 0x8f7440, secondary: 0xe3c975 }
  },
  {
    id: 'monster.fungus',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'mushroom', glyph: '♠', primary: 0x754e83, secondary: 0xbc83ca }
  },
  {
    id: 'monster.golem',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'square', glyph: '■', primary: 0x666253, secondary: 0xaaa38a }
  },
  {
    id: 'monster.shaman',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'hex', glyph: '⌃', primary: 0x8d453e, secondary: 0xe28372 }
  },
  {
    id: 'monster.monarch',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'boss', glyph: '♛', primary: 0x914f28, secondary: 0xe8a166 }
  },
  {
    id: 'building.barricade',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'wall', glyph: '▥', primary: 0x6f5239, secondary: 0xc69b62 }
  },
  {
    id: 'building.arrow-tower',
    type: 'placeholder',
    status: 'missing',
    fallback: { shape: 'tower', glyph: '▲', primary: 0x4b6370, secondary: 0xa6c4cf }
  }
];

export const SKILL_DEFINITIONS = [
  {
    id: 'blade.cleave',
    name: '弧光斬',
    cooldown: 4.2,
    animation: 'attack',
    effect: { type: 'area-damage', multiplier: 1.35, radius: 82 }
  },
  {
    id: 'bow.piercing-volley',
    name: '穿心連矢',
    cooldown: 4.8,
    animation: 'attack',
    effect: { type: 'chain-damage', multiplier: 1.18, maxTargets: 3, jumpRadius: 112 }
  },
  {
    id: 'arcane.nova',
    name: '星屑震爆',
    cooldown: 5.6,
    animation: 'cast',
    effect: { type: 'area-damage', multiplier: 1.55, radius: 118 }
  },
  {
    id: 'light.mend',
    name: '聖光修復',
    cooldown: 4.4,
    animation: 'cast',
    effect: { type: 'heal', multiplier: 2.1, range: 210 }
  },
  {
    id: 'shade.execute',
    name: '影襲',
    cooldown: 3.9,
    animation: 'attack',
    effect: { type: 'execute', multiplier: 1.45, executeMultiplier: 2.45, threshold: 0.34 }
  },
  {
    id: 'gel.tidal-slow',
    name: '膠潮纏縛',
    cooldown: 5.1,
    animation: 'cast',
    effect: { type: 'slow-area', multiplier: 0.85, radius: 104, slowFactor: 0.52, duration: 2.8 }
  }
];

export const JOB_DEFINITIONS = [
  {
    id: 'blade',
    name: '劍士',
    role: '近戰守衛',
    description: '能離開部署點短距迎敵，週期性使用範圍斬擊。',
    progression: ['劍士', '騎士', '符文近衛', '龍紋領主'],
    rank: 1,
    cost: 6,
    assetId: 'unit.blade.rank1',
    skillId: 'blade.cleave',
    attackStyle: 'melee',
    stats: {
      hp: 175,
      attack: 18,
      armor: 0.18,
      moveSpeed: 72,
      attackRange: 43,
      detectionRange: 250,
      attackInterval: 0.78,
      leash: 148,
      radius: 15
    }
  },
  {
    id: 'bow',
    name: '弓手',
    role: '遠程輸出',
    description: '安全距離輸出，技能可在多個鄰近目標間連跳。',
    progression: ['弓手', '神射手', '鷹眼遊俠', '星界狙擊'],
    rank: 1,
    cost: 6,
    assetId: 'unit.bow.rank1',
    skillId: 'bow.piercing-volley',
    attackStyle: 'ranged',
    stats: {
      hp: 102,
      attack: 17,
      armor: 0.03,
      moveSpeed: 58,
      attackRange: 214,
      detectionRange: 390,
      attackInterval: 0.88,
      leash: 112,
      radius: 13
    }
  },
  {
    id: 'arcane',
    name: '法師',
    role: '範圍法術',
    description: '攻擊節奏較慢，但能對密集怪群造成大範圍傷害。',
    progression: ['法師', '巫師', '元素術士', '天象賢者'],
    rank: 1,
    cost: 7,
    assetId: 'unit.arcane.rank1',
    skillId: 'arcane.nova',
    attackStyle: 'ranged',
    stats: {
      hp: 88,
      attack: 25,
      armor: 0,
      moveSpeed: 50,
      attackRange: 184,
      detectionRange: 360,
      attackInterval: 1.24,
      leash: 104,
      radius: 13
    }
  },
  {
    id: 'light',
    name: '服事',
    role: '治療支援',
    description: '優先治療範圍內生命比例最低的友軍。',
    progression: ['服事', '祭司', '聖光主教', '神諭守護'],
    rank: 1,
    cost: 6,
    assetId: 'unit.light.rank1',
    skillId: 'light.mend',
    attackStyle: 'ranged',
    stats: {
      hp: 116,
      attack: 10,
      armor: 0.05,
      moveSpeed: 54,
      attackRange: 170,
      detectionRange: 330,
      attackInterval: 1.08,
      leash: 100,
      radius: 13
    }
  },
  {
    id: 'shade',
    name: '盜賊',
    role: '高速刺殺',
    description: '高速貼近敵人，對低生命目標造成更高技能傷害。',
    progression: ['盜賊', '刺客', '影刃', '幻影夜行'],
    rank: 1,
    cost: 6,
    assetId: 'unit.shade.rank1',
    skillId: 'shade.execute',
    attackStyle: 'melee',
    stats: {
      hp: 108,
      attack: 14,
      armor: 0.06,
      moveSpeed: 92,
      attackRange: 39,
      detectionRange: 340,
      attackInterval: 0.48,
      leash: 176,
      radius: 13,
      critChance: 0.26,
      critMultiplier: 1.75
    }
  },
  {
    id: 'gel',
    name: '嫩芽軟泥',
    role: '牽制坦克',
    description: '高生命近戰，技能造成範圍緩速，適合守住缺口。',
    progression: ['嫩芽軟泥', '彩芽靈', '王冠膠獸', '星核史萊姆'],
    rank: 1,
    cost: 7,
    assetId: 'unit.gel.rank1',
    skillId: 'gel.tidal-slow',
    attackStyle: 'melee',
    stats: {
      hp: 220,
      attack: 11,
      armor: 0.13,
      moveSpeed: 48,
      attackRange: 44,
      detectionRange: 280,
      attackInterval: 1,
      leash: 126,
      radius: 17,
      threat: 1.4
    }
  }
];

export const MONSTER_DEFINITIONS = [
  {
    id: 'sprout',
    name: '苔芽獸',
    assetId: 'monster.sprout',
    attackStyle: 'melee',
    traits: [],
    stats: { hp: 48, attack: 7, armor: 0, moveSpeed: 35, attackRange: 31, aggroRange: 92, attackInterval: 1, radius: 13, crystalDamage: 34, reward: 1 }
  },
  {
    id: 'moth',
    name: '針翅蟲',
    assetId: 'monster.moth',
    attackStyle: 'melee',
    traits: ['flying'],
    stats: { hp: 36, attack: 6, armor: 0, moveSpeed: 62, attackRange: 28, aggroRange: 72, attackInterval: 0.78, radius: 11, crystalDamage: 26, reward: 1 }
  },
  {
    id: 'fungus',
    name: '紫帽菇',
    assetId: 'monster.fungus',
    attackStyle: 'melee',
    traits: [],
    stats: { hp: 92, attack: 11, armor: 0.05, moveSpeed: 27, attackRange: 34, aggroRange: 104, attackInterval: 1.16, radius: 16, crystalDamage: 54, reward: 2 }
  },
  {
    id: 'golem',
    name: '頁岩巨像',
    assetId: 'monster.golem',
    attackStyle: 'melee',
    traits: ['siege'],
    stats: { hp: 190, attack: 16, armor: 0.16, moveSpeed: 21, attackRange: 38, aggroRange: 112, attackInterval: 1.32, radius: 21, crystalDamage: 86, reward: 3 }
  },
  {
    id: 'shaman',
    name: '燭角巫獸',
    assetId: 'monster.shaman',
    attackStyle: 'ranged',
    traits: [],
    stats: { hp: 74, attack: 10, armor: 0.02, moveSpeed: 25, attackRange: 142, aggroRange: 190, attackInterval: 1.42, radius: 14, crystalDamage: 48, reward: 3 }
  },
  {
    id: 'monarch',
    name: '荒角王獸',
    assetId: 'monster.monarch',
    attackStyle: 'melee',
    traits: ['boss', 'siege'],
    stats: { hp: 620, attack: 25, armor: 0.12, moveSpeed: 21, attackRange: 44, aggroRange: 128, attackInterval: 1.02, radius: 29, crystalDamage: 180, reward: 10 }
  }
];

export const BUILDING_DEFINITIONS = [
  {
    id: 'barricade',
    name: '木石路障',
    role: '改道／吸引',
    description: '阻擋地面怪物路徑；若會封死所有入口，系統會拒絕建造。',
    cost: 4,
    assetId: 'building.barricade',
    blocksPath: true,
    stats: {
      hp: 620,
      armor: 0.34,
      radius: 25,
      aggroRange: 78,
      threat: 3.5
    }
  },
  {
    id: 'arrow-tower',
    name: '弩箭塔',
    role: '固定遠程輸出',
    description: '不能移動，但具有穩定射程與輸出；同樣會占用路徑格。',
    cost: 8,
    assetId: 'building.arrow-tower',
    blocksPath: true,
    attackStyle: 'ranged',
    stats: {
      hp: 360,
      attack: 22,
      armor: 0.18,
      attackRange: 236,
      detectionRange: 270,
      attackInterval: 0.82,
      radius: 23,
      aggroRange: 86,
      threat: 1.8
    }
  }
];

export const WAVE_DEFINITIONS = [
  {
    id: 'wave-1',
    label: '苔芽試探',
    reward: 5,
    groups: [
      { monsterId: 'sprout', count: 5, direction: 'W', delayMs: 0, intervalMs: 720 },
      { monsterId: 'sprout', count: 5, direction: 'E', delayMs: 1300, intervalMs: 720 }
    ]
  },
  {
    id: 'wave-2',
    label: '針翅越線',
    reward: 6,
    groups: [
      { monsterId: 'sprout', count: 6, direction: 'N', delayMs: 0, intervalMs: 650 },
      { monsterId: 'moth', count: 5, direction: 'S', delayMs: 1600, intervalMs: 540 }
    ]
  },
  {
    id: 'wave-3',
    label: '紫帽包圍',
    reward: 7,
    groups: [
      { monsterId: 'fungus', count: 5, direction: 'NW', delayMs: 0, intervalMs: 820 },
      { monsterId: 'sprout', count: 7, direction: 'SE', delayMs: 1200, intervalMs: 560 },
      { monsterId: 'moth', count: 4, direction: 'NE', delayMs: 2600, intervalMs: 500 }
    ]
  },
  {
    id: 'wave-4',
    label: '巨像與巫火',
    reward: 9,
    groups: [
      { monsterId: 'golem', count: 4, direction: 'SW', delayMs: 0, intervalMs: 1100 },
      { monsterId: 'shaman', count: 5, direction: 'NE', delayMs: 900, intervalMs: 920 },
      { monsterId: 'sprout', count: 6, direction: 'E', delayMs: 2600, intervalMs: 480 }
    ]
  },
  {
    id: 'wave-5',
    label: '荒角王獸',
    reward: 12,
    groups: [
      { monsterId: 'monarch', count: 1, direction: 'N', delayMs: 0, intervalMs: 1 },
      { monsterId: 'golem', count: 3, direction: 'W', delayMs: 900, intervalMs: 1250 },
      { monsterId: 'moth', count: 8, direction: 'E', delayMs: 1300, intervalMs: 440 },
      { monsterId: 'shaman', count: 4, direction: 'S', delayMs: 2500, intervalMs: 880 }
    ]
  }
];

export function createContentRegistry() {
  const registry = new ContentRegistry()
    .register('assets', ASSET_DEFINITIONS)
    .register('skills', SKILL_DEFINITIONS)
    .register('jobs', JOB_DEFINITIONS)
    .register('monsters', MONSTER_DEFINITIONS)
    .register('buildings', BUILDING_DEFINITIONS)
    .register('waves', WAVE_DEFINITIONS);

  for (const job of registry.list('jobs')) {
    registry.assertReference('assets', job.assetId, `job:${job.id}`);
    registry.assertReference('skills', job.skillId, `job:${job.id}`);
  }
  for (const monster of registry.list('monsters')) {
    registry.assertReference('assets', monster.assetId, `monster:${monster.id}`);
  }
  for (const building of registry.list('buildings')) {
    registry.assertReference('assets', building.assetId, `building:${building.id}`);
    if (building.skillId) registry.assertReference('skills', building.skillId, `building:${building.id}`);
  }
  for (const wave of registry.list('waves')) {
    for (const group of wave.groups) {
      registry.assertReference('monsters', group.monsterId, `wave:${wave.id}`);
    }
  }

  return registry.freeze();
}
