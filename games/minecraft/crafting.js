// crafting.js — 合成配方系统
const Crafting = (() => {

  // pattern: 扁平数组，2×2=4格 / 3×3=9格，null 表示空格
  const RECIPES = [
    // ════ 基础合成（2×2，无需工作台）════
    {
      id: 'plank',
      size: 2,
      pattern: ['wood',  null,
                null,    null],
      result: { type: 'plank', count: 4 },
    },
    {
      id: 'stick',
      size: 2,
      pattern: ['plank', null,
                'plank', null],
      result: { type: 'stick', count: 4 },
    },
    {
      id: 'crafting_table',
      size: 2,
      pattern: ['plank', 'plank',
                'plank', 'plank'],
      result: { type: 'crafting_table', count: 1 },
    },

    // ════ 工作台合成（3×3）════
    {
      id: 'chest',
      size: 3,
      pattern: ['plank', 'plank', 'plank',
                'plank',  null,   'plank',
                'plank', 'plank', 'plank'],
      result: { type: 'chest', count: 1 },
    },
    {
      id: 'furnace',
      size: 3,
      pattern: ['cobblestone', 'cobblestone', 'cobblestone',
                'cobblestone',  null,          'cobblestone',
                'cobblestone', 'cobblestone', 'cobblestone'],
      result: { type: 'furnace', count: 1 },
    },
    {
      id: 'torch',
      size: 3,
      pattern: [null,   'coal',  null,
                null,   'stick', null,
                null,    null,   null],
      result: { type: 'torch', count: 4 },
    },
    {
      id: 'iron_pickaxe',
      size: 3,
      pattern: ['iron_ingot', 'iron_ingot', 'iron_ingot',
                null,          'stick',      null,
                null,          'stick',      null],
      result: { type: 'iron_pickaxe', count: 1 },
    },
    {
      id: 'diamond_pickaxe',
      size: 3,
      pattern: ['diamond', 'diamond', 'diamond',
                null,       'stick',   null,
                null,       'stick',   null],
      result: { type: 'diamond_pickaxe', count: 1 },
    },
    {
      id: 'iron_axe',
      size: 3,
      pattern: ['iron_ingot', 'iron_ingot', null,
                'iron_ingot', 'stick',       null,
                null,          'stick',      null],
      result: { type: 'iron_axe', count: 1 },
    },
    {
      id: 'diamond_axe',
      size: 3,
      pattern: ['diamond', 'diamond', null,
                'diamond',  'stick',  null,
                null,        'stick', null],
      result: { type: 'diamond_axe', count: 1 },
    },
    {
      id: 'iron_sword',
      size: 3,
      pattern: [null, 'iron_ingot', null,
                null, 'iron_ingot', null,
                null,  'stick',     null],
      result: { type: 'iron_sword', count: 1 },
    },
    {
      id: 'diamond_sword',
      size: 3,
      pattern: [null, 'diamond', null,
                null, 'diamond', null,
                null,  'stick',  null],
      result: { type: 'diamond_sword', count: 1 },
    },
    {
      id: 'iron_shovel',
      size: 3,
      pattern: [null, 'iron_ingot', null,
                null,  'stick',     null,
                null,  'stick',     null],
      result: { type: 'iron_shovel', count: 1 },
    },
    {
      id: 'bow',
      size: 3,
      pattern: [null,    'stick',  'string',
                'stick',  null,    'string',
                null,    'stick',  'string'],
      result: { type: 'bow', count: 1 },
    },
    {
      id: 'fishing_rod',
      size: 3,
      pattern: [null,    null,     'stick',
                null,   'stick',  'string',
                'stick', null,    'string'],
      result: { type: 'fishing_rod', count: 1 },
    },
    {
      id: 'bread',
      size: 3,
      pattern: [null,    null,    null,
                'seeds', 'seeds', 'seeds',
                null,    null,    null],
      result: { type: 'bread', count: 1 },
    },
    {
      id: 'iron_block',
      size: 3,
      pattern: ['iron_ingot', 'iron_ingot', 'iron_ingot',
                'iron_ingot', 'iron_ingot', 'iron_ingot',
                'iron_ingot', 'iron_ingot', 'iron_ingot'],
      result: { type: 'iron_block', count: 1 },
    },
    {
      id: 'gold_block',
      size: 3,
      pattern: ['gold_ingot', 'gold_ingot', 'gold_ingot',
                'gold_ingot', 'gold_ingot', 'gold_ingot',
                'gold_ingot', 'gold_ingot', 'gold_ingot'],
      result: { type: 'gold_block', count: 1 },
    },
    {
      id: 'diamond_block',
      size: 3,
      pattern: ['diamond', 'diamond', 'diamond',
                'diamond', 'diamond', 'diamond',
                'diamond', 'diamond', 'diamond'],
      result: { type: 'diamond_block', count: 1 },
    },
  ];

  /** 统计配方所需材料 → { itemType: count } */
  function getIngredients(recipe) {
    const c = {};
    recipe.pattern.forEach(t => { if (t) c[t] = (c[t] || 0) + 1; });
    return c;
  }

  /** stockFn(type) 返回玩家持有数量，判断是否可合成 */
  function canCraft(recipe, stockFn) {
    return Object.entries(getIngredients(recipe)).every(([t, n]) => stockFn(t) >= n);
  }

  /** 从 inv 中扣除所需材料（先扣背包，再扣热键栏） */
  function consumeIngredients(recipe, inv) {
    Object.entries(getIngredients(recipe)).forEach(([type, needed]) => {
      let rem = needed;
      for (const arr of [inv.backpack, inv.hotbar]) {
        for (let i = 0; i < arr.length && rem > 0; i++) {
          const s = arr[i];
          if (s && s.type === type) {
            const take = Math.min(s.count, rem);
            s.count -= take; rem -= take;
            if (s.count <= 0) arr[i] = null;
          }
        }
      }
    });
  }

  return { RECIPES, getIngredients, canCraft, consumeIngredients };
})();
