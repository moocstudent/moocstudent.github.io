'use strict';

// =====================================================
// 1. 物品目录
// =====================================================
const ALL_ITEMS = {
  grass:           { name: '草地',     cat: 'block', bg: 'linear-gradient(135deg,#5d9f3c 50%,#8B6914 50%)', placeable: true },
  dirt:            { name: '泥土',     cat: 'block', bg: '#8B6914',  placeable: true },
  stone:           { name: '石头',     cat: 'block', bg: '#888',     placeable: true },
  cobblestone:     { name: '圆石',     cat: 'block', bg: '#666',     placeable: true },
  wood:            { name: '木头',     cat: 'block', bg: '#6B4226',  placeable: true },
  plank:           { name: '木板',     cat: 'block', bg: '#b5892b',  placeable: true },
  leaves:          { name: '树叶',     cat: 'block', bg: '#2d7a1f',  placeable: true },
  sand:            { name: '沙子',     cat: 'block', bg: '#c2b280',  placeable: true },
  gravel:          { name: '砾石',     cat: 'block', bg: '#9e9e8e',  placeable: true },
  glass:           { name: '玻璃',     cat: 'block', bg: '#add8e6',  placeable: true },
  brick:           { name: '砖块',     cat: 'block', bg: '#8B3B2B',  placeable: true },
  snow_block:      { name: '雪块',     cat: 'block', bg: '#f0f0f0',  placeable: true },
  obsidian:        { name: '黑曜石',   cat: 'block', bg: '#1a0d2e',  placeable: true },
  bookshelf:       { name: '书架',     cat: 'block', bg: '#8B6914',  placeable: true },
  gold_block:      { name: '金块',     cat: 'block', bg: '#FFD700',  placeable: true },
  iron_block:      { name: '铁块',     cat: 'block', bg: '#d8d8d8',  placeable: true },
  diamond_block:   { name: '钻石块',   cat: 'block', bg: '#4fe2e2',  placeable: true },

  crafting_table:  { name: '工作台',   cat: 'block', bg: '#8B5e3c', placeable: true },
  furnace:         { name: '熔炉',     cat: 'block', bg: '#777',    placeable: true },
  chest:           { name: '箱子',     cat: 'block', bg: '#c49a3c', placeable: true },
  stick:           { name: '树枝',     cat: 'misc',  bg: '#8B6914', icon: '|' },

  torch:           { name: '火把',     cat: 'tool', bg: 'linear-gradient(to top,#6B3A1F 55%,#FFD700 55%)', icon: '🕯' },
  iron_pickaxe:    { name: '铁镐',     cat: 'tool', bg: '#8a8a8a',  icon: '⛏' },
  diamond_pickaxe: { name: '钻石镐',   cat: 'tool', bg: '#4db6ac',  icon: '⛏' },
  iron_axe:        { name: '铁斧',     cat: 'tool', bg: '#8a8a8a',  icon: '🪓' },
  diamond_axe:     { name: '钻石斧',   cat: 'tool', bg: '#4db6ac',  icon: '🪓' },
  iron_shovel:     { name: '铁锹',     cat: 'tool', bg: '#8a8a8a',  icon: '⚒' },
  diamond_shovel:  { name: '钻石锹',   cat: 'tool', bg: '#4db6ac',  icon: '⚒' },
  iron_sword:      { name: '铁剑',     cat: 'tool', bg: '#8a8a8a',  icon: '⚔' },
  diamond_sword:   { name: '钻石剑',   cat: 'tool', bg: '#4db6ac',  icon: '⚔' },
  bow:             { name: '弓',       cat: 'tool', bg: '#6B4226',  icon: '🏹' },
  flint_steel:     { name: '打火石',   cat: 'tool', bg: '#555',     icon: '🔥' },
  shears:          { name: '剪刀',     cat: 'tool', bg: '#aaa',     icon: '✂' },

  water_bucket:    { name: '水桶',     cat: 'misc', bg: '#1565c0',  icon: '🪣' },
  lava_bucket:     { name: '岩浆桶',   cat: 'misc', bg: '#e64a19',  icon: '🪣' },
  oak_sapling:     { name: '橡树苗',   cat: 'misc', bg: '#388e3c',  icon: '🌱' },
  birch_sapling:   { name: '白桦树苗', cat: 'misc', bg: '#66bb6a',  icon: '🌱' },
  spruce_sapling:  { name: '云杉树苗', cat: 'misc', bg: '#2e7d32',  icon: '🌲' },
  apple:           { name: '苹果',     cat: 'misc', bg: '#c62828',  icon: '🍎' },
  bread:           { name: '面包',     cat: 'misc', bg: '#a1887f',  icon: '🍞' },
  cooked_beef:     { name: '熟牛排',   cat: 'misc', bg: '#5d2e0c',  icon: '🥩' },
  coal:            { name: '煤炭',     cat: 'misc', bg: '#212121',  icon: '◆' },
  iron_ingot:      { name: '铁锭',     cat: 'misc', bg: '#bdbdbd',  icon: '▬' },
  gold_ingot:      { name: '金锭',     cat: 'misc', bg: '#ffd54f',  icon: '▬' },
  diamond:         { name: '钻石',     cat: 'misc', bg: '#26c6da',  icon: '◆' },
  arrow:           { name: '箭',       cat: 'misc', bg: '#795548',  icon: '→' },
  bone:            { name: '骨头',     cat: 'misc', bg: '#f0ede0',  icon: '◌' },
  egg:             { name: '鸡蛋',     cat: 'misc', bg: '#ffe0b2',  icon: '○' },
  fishing_rod:     { name: '钓鱼竿',   cat: 'misc', bg: '#5d4037',  icon: '🎣' },
  compass:         { name: '指南针',   cat: 'misc', bg: '#b71c1c',  icon: '🧭' },
  clock:           { name: '时钟',     cat: 'misc', bg: '#f9a825',  icon: '⏰' },
  map:             { name: '地图',     cat: 'misc', bg: '#8d6e63',  icon: '🗺' },
  seeds:           { name: '小麦种子', cat: 'misc', bg: '#558b2f',  icon: '⚬' },
  feather:         { name: '羽毛',     cat: 'misc', bg: '#f5f5f5',  icon: '🪶' },
  gunpowder:       { name: '火药',     cat: 'misc', bg: '#616161',  icon: '◉' },
  snowball:        { name: '雪球',     cat: 'misc', bg: '#e3f2fd',  icon: '⚪' },

  // ── 战斗掉落物 ──────────────────────────
  raw_chicken:     { name: '生鸡肉',   cat: 'misc', bg: '#f4a460',  icon: '🍗' },
  raw_porkchop:    { name: '生猪肉',   cat: 'misc', bg: '#e07050',  icon: '🥓' },
  raw_beef:        { name: '生牛肉',   cat: 'misc', bg: '#c0392b',  icon: '🥩' },
  mutton:          { name: '生羊肉',   cat: 'misc', bg: '#d35400',  icon: '🍖' },
  leather:         { name: '皮革',     cat: 'misc', bg: '#8B5e3c',  icon: '🟫' },
  wool:            { name: '羊毛',     cat: 'misc', bg: '#e8e8e0',  icon: '⬜' },
  rotten_flesh:    { name: '腐肉',     cat: 'misc', bg: '#3a2010',  icon: '🟫' },
};

// =====================================================
// 2. 方块颜色
// =====================================================
const BLOCK_COLORS = {
  grass:       { top: 0x5d9f3c, side: 0x8B6914, bottom: 0x8B6914 },
  dirt:        { top: 0x8B6914, side: 0x8B6914, bottom: 0x8B6914 },
  stone:       { top: 0x888888, side: 0x888888, bottom: 0x888888 },
  cobblestone: { top: 0x666666, side: 0x606060, bottom: 0x666666 },
  wood:        { top: 0x9e7c4a, side: 0x6B4226, bottom: 0x9e7c4a },
  plank:       { top: 0xc49a3c, side: 0xb5892b, bottom: 0xc49a3c },
  leaves:      { top: 0x2d7a1f, side: 0x2d7a1f, bottom: 0x2d7a1f },
  sand:        { top: 0xc2b280, side: 0xc2b280, bottom: 0xc2b280 },
  gravel:      { top: 0x9e9e8e, side: 0x9e9e8e, bottom: 0x9e9e8e },
  glass:       { top: 0xadd8e6, side: 0xadd8e6, bottom: 0xadd8e6 },
  brick:       { top: 0x8B3B2B, side: 0x8B3B2B, bottom: 0x8B3B2B },
  snow_block:  { top: 0xf0f0f0, side: 0xdcecf0, bottom: 0xf0f0f0 },
  obsidian:    { top: 0x1a0d2e, side: 0x1a0d2e, bottom: 0x1a0d2e },
  bookshelf:   { top: 0x8B6914, side: 0x7a5a1a, bottom: 0x8B6914 },
  gold_block:      { top: 0xFFD700, side: 0xf0c800, bottom: 0xFFD700 },
  iron_block:      { top: 0xd8d8d8, side: 0xcccccc, bottom: 0xd8d8d8 },
  diamond_block:   { top: 0x4fe2e2, side: 0x3ccece, bottom: 0x4fe2e2 },
  crafting_table:  { top: 0x9e7c4a, side: 0x6B4226, bottom: 0x8B5e3c },
  furnace:         { top: 0x888888, side: 0x666666, bottom: 0x888888 },
  chest:           { top: 0xd4a030, side: 0x8B6914, bottom: 0xd4a030 },
};

// =====================================================
// 3. 背包系统
// =====================================================
const HOTBAR_SIZE  = 9;
const BACKPACK_SIZE = 27;
const inv = {
  hotbar:  Array(HOTBAR_SIZE).fill(null),
  backpack: Array(BACKPACK_SIZE).fill(null),
};
let selectedSlot = 0, invOpen = false, cursor = null, cursorSrc = null, activeCat = 'block';

function addToInv(type, count = 1) {
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const s = inv.hotbar[i];
    if (s && s.type === type && s.count < 64) { s.count = Math.min(64, s.count + count); refreshHotbar(); return; }
  }
  for (let i = 0; i < BACKPACK_SIZE; i++) {
    const s = inv.backpack[i];
    if (s && s.type === type && s.count < 64) { s.count = Math.min(64, s.count + count); if (invOpen) refreshInvGrids(); return; }
  }
  for (let i = 0; i < HOTBAR_SIZE; i++)  { if (!inv.hotbar[i])  { inv.hotbar[i]  = { type, count }; refreshHotbar(); return; } }
  for (let i = 0; i < BACKPACK_SIZE; i++) { if (!inv.backpack[i]) { inv.backpack[i] = { type, count }; if (invOpen) refreshInvGrids(); return; } }
}

function getHeld() { return inv.hotbar[selectedSlot]; }

// =====================================================
// 4. Three.js 场景
// =====================================================
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.prepend(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(50, 100, 50); sun.castShadow = true;
scene.add(sun);

// =====================================================
// 5. 昼夜循环
// =====================================================
const DAY_DURATION = 480;  // 8 分钟一天
let gameTime = 0;           // 0.0 ~ 1.0，0=正午，0.5=午夜

const SKY_DAY     = new THREE.Color(0x87ceeb);
const SKY_SUNSET  = new THREE.Color(0xff8844);
const SKY_NIGHT   = new THREE.Color(0x080818);
const FOG_DAY     = new THREE.Color(0x87ceeb);
const FOG_NIGHT   = new THREE.Color(0x080818);

function updateDayNight(t) {
  // brightness: 1 = 正午, 0 = 午夜（余弦曲线）
  const b = Math.max(0, Math.cos(t * Math.PI * 2));
  // 日落区间（b ≈ 0.2 附近）添加橙红
  let sky;
  if (b > 0.3) {
    sky = SKY_DAY.clone().lerp(SKY_SUNSET, 0);
    sky = SKY_DAY.clone().multiplyScalar(b);
    sky.r = Math.min(1, sky.r + (1 - b) * 0.3);
  } else {
    sky = SKY_NIGHT.clone().lerp(SKY_DAY, b * 3);
  }
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, 28, 75);
  ambient.intensity = 0.15 + 0.65 * b;
  sun.intensity     = 0.8  * b;
}

// =====================================================
// 6. 世界
// =====================================================
const worldBlocks = new Map(), blockMeshes = new Map();
const bk = (x, y, z) => `${x},${y},${z}`;
const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const matCache = {};
function getMat(hex) { if (!matCache[hex]) matCache[hex] = new THREE.MeshLambertMaterial({ color: hex }); return matCache[hex]; }
function getBlock(x, y, z) { return worldBlocks.get(bk(x, y, z)) || null; }

function setBlock(x, y, z, type) {
  const k = bk(x, y, z);
  if (type) {
    worldBlocks.set(k, type);
    const c = BLOCK_COLORS[type] || { top: 0xaaaaaa, side: 0xaaaaaa, bottom: 0xaaaaaa };
    const mesh = new THREE.Mesh(blockGeo, [
      getMat(c.side), getMat(c.side), getMat(c.top), getMat(c.bottom), getMat(c.side), getMat(c.side),
    ]);
    mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData = { type, x, y, z };
    scene.add(mesh); blockMeshes.set(k, mesh);
  } else {
    worldBlocks.delete(k);
    const m = blockMeshes.get(k);
    if (m) { scene.remove(m); blockMeshes.delete(k); }
  }
}

function generateWorld() {
  for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) {
    const h = Math.floor(2 + Math.sin(x * 0.5) * 1.5 + Math.cos(z * 0.4) * 1.5);
    setBlock(x, h, z, 'grass'); setBlock(x, h-1, z, 'dirt'); setBlock(x, h-2, z, 'dirt');
    for (let y = h-3; y >= 0; y--) setBlock(x, y, z, 'stone');
  }
  [[3,4],[10,5],[13,3]].forEach(([tx,tz]) => {
    const base = Math.floor(2 + Math.sin(tx*0.5)*1.5 + Math.cos(tz*0.4)*1.5) + 1;
    for (let i = 0; i < 4; i++) setBlock(tx, base+i, tz, 'wood');
    for (let dx=-2; dx<=2; dx++) for (let dz=-2; dz<=2; dz++) for (let dy=3; dy<=5; dy++)
      if (!getBlock(tx+dx, base+dy, tz+dz)) setBlock(tx+dx, base+dy, tz+dz, 'leaves');
  });
}
generateWorld();

// =====================================================
// 7. 玩家
// =====================================================
const player = { pos: new THREE.Vector3(8, 8, 8), vel: new THREE.Vector3(), yaw: 0, pitch: 0, onGround: false, height: 1.7, radius: 0.3 };
camera.position.copy(player.pos);

// =====================================================
// 8. 输入
// =====================================================
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  const n = parseInt(e.key);
  if (n >= 1 && n <= 9) { selectedSlot = n - 1; refreshHotbar(); }
  if (e.code === 'KeyE') toggleInv();
  if (e.code === 'Escape' && invOpen) closeInv();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });
document.addEventListener('wheel', e => {
  if (!locked || invOpen) return;
  selectedSlot = ((selectedSlot + Math.sign(e.deltaY)) % 9 + 9) % 9;
  refreshHotbar();
});

// =====================================================
// 9. 指针锁定
// =====================================================
let locked = false, musicStarted = false;
const blocker = document.getElementById('blocker'), crosshair = document.getElementById('crosshair'), infoEl = document.getElementById('info');

blocker.addEventListener('click', () => { if (!invOpen) renderer.domElement.requestPointerLock(); });

document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === renderer.domElement;
  if (invOpen) return;
  blocker.style.display   = locked ? 'none'  : 'flex';
  crosshair.style.display = locked ? 'block' : 'none';
  infoEl.style.display    = locked ? 'block' : 'none';
  if (locked && !musicStarted) { musicStarted = true; SFX.startMusic(); }
});

document.addEventListener('mousemove', e => {
  if (locked && !invOpen) {
    player.yaw   -= e.movementX * 0.002;
    player.pitch -= e.movementY * 0.002;
    player.pitch  = Math.max(-Math.PI/2+0.01, Math.min(Math.PI/2-0.01, player.pitch));
  }
  if (cursor) {
    const el = document.getElementById('cursor-item');
    el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px';
  }
});

// =====================================================
// 10. 射线 & 方块交互
// =====================================================
const raycaster = new THREE.Raycaster(), center = new THREE.Vector2(0, 0);
const wireBox = new THREE.Mesh(new THREE.BoxGeometry(1.01, 1.01, 1.01), new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true }));
wireBox.visible = false; scene.add(wireBox);

/** 射线检测：优先命中生物（碰撞箱），其次命中方块 */
function getTarget() {
  raycaster.setFromCamera(center, camera);
  const candidates = [...blockMeshes.values(), ...Entities.getHitboxes()];
  const hits = raycaster.intersectObjects(candidates);
  return hits.length && hits[0].distance < 6 ? hits[0] : null;
}

/** 仅返回方块目标（用于准星高亮） */
function getTargetBlock() {
  raycaster.setFromCamera(center, camera);
  const hits = raycaster.intersectObjects([...blockMeshes.values()]);
  return hits.length && hits[0].distance < 6 ? hits[0] : null;
}

document.addEventListener('mousedown', e => {
  if (!locked || invOpen) return;
  const hit = getTarget(); if (!hit) return;

  if (e.button === 0) {
    if (hit.object.userData.mob) {
      // ── 攻击生物 ──────────────────────
      const mob = hit.object.userData.mob;
      const died = mob.takeDamage(5, player.pos);
      SFX.hit();
      if (died) SFX.mobDie();
    } else {
      // ── 破坏方块 ──────────────────────
      const { x, y, z, type } = hit.object.userData;
      setBlock(x, y, z, null);
      addToInv(type, 1);
      SFX.dig(type);
    }
  } else if (e.button === 2) {
    if (hit.object.userData.mob) return;
    const { x, y, z } = hit.object.userData;
    const held = getHeld();
    if (!held || !ALL_ITEMS[held.type]?.placeable) return;
    const n = hit.face.normal;
    const nx = x + Math.round(n.x), ny = y + Math.round(n.y), nz = z + Math.round(n.z);
    const px = Math.round(player.pos.x), py = Math.round(player.pos.y - player.height/2), pz = Math.round(player.pos.z);
    if (!(nx === px && (ny === py || ny === py+1) && nz === pz)) {
      setBlock(nx, ny, nz, held.type);
      SFX.place();
      held.count--;
      if (held.count <= 0) inv.hotbar[selectedSlot] = null;
      refreshHotbar();
    }
  }
});
document.addEventListener('contextmenu', e => e.preventDefault());

// =====================================================
// 11. 物品栏 UI
// =====================================================
function makeIcon(type, count, size = 32) {
  const info = ALL_ITEMS[type];
  const el = document.createElement('div');
  el.className = 'item-icon';
  el.style.cssText = `width:${size}px;height:${size}px`;
  if (info?.bg) el.style.background = info.bg;
  if (info?.icon) {
    const em = document.createElement('span'); em.className = 'item-emoji';
    em.style.fontSize = Math.floor(size * 0.48) + 'px'; em.textContent = info.icon;
    el.appendChild(em);
  }
  if (count !== undefined && count > 1) {
    const cnt = document.createElement('span'); cnt.className = 'item-count'; cnt.textContent = count; el.appendChild(cnt);
  }
  return el;
}

function refreshHotbar() {
  const wrap = document.getElementById('hotbar-slots'); if (!wrap) return;
  wrap.innerHTML = '';
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const el = document.createElement('div');
    el.className = 'slot' + (i === selectedSlot ? ' active' : '');
    const item = inv.hotbar[i];
    if (item) {
      el.appendChild(makeIcon(item.type, item.count));
      const lbl = document.createElement('span'); lbl.className = 'slot-label';
      lbl.textContent = ALL_ITEMS[item.type]?.name || item.type; el.appendChild(lbl);
    } else {
      const num = document.createElement('span'); num.className = 'slot-num'; num.textContent = i + 1; el.appendChild(num);
    }
    el.addEventListener('click', () => { selectedSlot = i; refreshHotbar(); if (invOpen) refreshInvGrids(); });
    wrap.appendChild(el);
  }
}

function buildCatalog() {
  const grid = document.getElementById('catalog-grid'); if (!grid) return;
  grid.innerHTML = '';
  Object.entries(ALL_ITEMS).filter(([, v]) => v.cat === activeCat).forEach(([type, info]) => {
    const slot = document.createElement('div'); slot.className = 'cat-slot';
    slot.appendChild(makeIcon(type, undefined, 36));
    const tip = document.createElement('div'); tip.className = 'tip'; tip.textContent = info.name; slot.appendChild(tip);
    slot.addEventListener('click', () => { addToInv(type, 64); refreshInvGrids(); });
    grid.appendChild(slot);
  });
}

function makeInvSlot(zone, idx) {
  const arr = zone === 'hotbar' ? inv.hotbar : inv.backpack, item = arr[idx];
  const slot = document.createElement('div');
  slot.className = 'inv-slot' + (zone === 'hotbar' && idx === selectedSlot ? ' active-slot' : '');
  if (item) {
    slot.appendChild(makeIcon(item.type, item.count, 36));
    const tip = document.createElement('div'); tip.className = 'tip'; tip.textContent = ALL_ITEMS[item.type]?.name || item.type; slot.appendChild(tip);
  }
  slot.addEventListener('click', () => handleInvClick(zone, idx));
  return slot;
}

function handleInvClick(zone, idx) {
  const arr = zone === 'hotbar' ? inv.hotbar : inv.backpack;
  if (cursor) {
    const prev = arr[idx]; arr[idx] = cursor; cursor = prev || null; cursorSrc = cursor ? { zone, idx } : null;
    updateCursorDisplay(); refreshHotbar(); refreshInvGrids();
  } else {
    if (arr[idx]) { cursor = arr[idx]; cursorSrc = { zone, idx }; arr[idx] = null; updateCursorDisplay(); refreshHotbar(); refreshInvGrids(); }
    else if (zone === 'hotbar') { selectedSlot = idx; refreshHotbar(); refreshInvGrids(); }
  }
}

function refreshInvGrids() {
  const bp = document.getElementById('backpack-grid'), hb = document.getElementById('inv-hotbar-grid');
  if (!bp || !hb) return;
  bp.innerHTML = ''; hb.innerHTML = '';
  for (let i = 0; i < BACKPACK_SIZE; i++) bp.appendChild(makeInvSlot('backpack', i));
  for (let i = 0; i < HOTBAR_SIZE;  i++) hb.appendChild(makeInvSlot('hotbar',  i));
}

function updateCursorDisplay() {
  const el = document.getElementById('cursor-item'); el.innerHTML = '';
  if (cursor) { el.appendChild(makeIcon(cursor.type, cursor.count, 38)); el.style.display = 'block'; }
  else el.style.display = 'none';
}

function returnCursor() {
  if (!cursor) return;
  if (cursorSrc) {
    const arr = cursorSrc.zone === 'hotbar' ? inv.hotbar : inv.backpack;
    if (!arr[cursorSrc.idx]) arr[cursorSrc.idx] = cursor; else addToInv(cursor.type, cursor.count);
  } else addToInv(cursor.type, cursor.count);
  cursor = null; cursorSrc = null; updateCursorDisplay();
}

function toggleInv() { invOpen ? closeInv() : openInv(); }

function openInv() {
  invOpen = true; document.exitPointerLock();
  blocker.style.display = crosshair.style.display = infoEl.style.display = 'none';
  document.getElementById('inv-overlay').classList.add('open');
  // 重置到物品目录 tab
  document.querySelectorAll('.main-tab').forEach(b => b.classList.remove('active'));
  document.querySelector('.main-tab[data-view="items"]').classList.add('active');
  document.getElementById('view-items').style.display = '';
  document.getElementById('view-craft').style.display = 'none';
  buildCatalog(); refreshInvGrids();
}

function closeInv() {
  returnCursor(); invOpen = false;
  document.getElementById('inv-overlay').classList.remove('open');
  refreshHotbar(); renderer.domElement.requestPointerLock();
}

// 物品分类 tab
document.querySelectorAll('.cat-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); activeCat = btn.dataset.cat; buildCatalog();
  });
});

// 顶层 tab：物品目录 / 合成
document.querySelectorAll('.main-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.main-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    document.getElementById('view-items').style.display = view === 'items' ? '' : 'none';
    document.getElementById('view-craft').style.display = view === 'craft' ? '' : 'none';
    if (view === 'craft') buildRecipeList();
    else buildCatalog();
  });
});

document.getElementById('inv-btn').addEventListener('click', openInv);
document.getElementById('inv-close').addEventListener('click', closeInv);
document.getElementById('inv-overlay').addEventListener('click', e => { if (e.target === document.getElementById('inv-overlay')) closeInv(); });

// =====================================================
// 11b. 合成配方 UI
// =====================================================

/** 统计玩家背包+热键栏中某物品总数 */
function stockCount(type) {
  let n = 0;
  inv.hotbar.forEach(s  => { if (s && s.type === type) n += s.count; });
  inv.backpack.forEach(s => { if (s && s.type === type) n += s.count; });
  return n;
}

/** 构建合成配方列表 */
function buildRecipeList() {
  const list = document.getElementById('recipe-list');
  if (!list) return;
  list.innerHTML = '';

  Crafting.RECIPES.forEach(recipe => {
    const resultInfo = ALL_ITEMS[recipe.result.type] || {};
    const craftable  = Crafting.canCraft(recipe, stockCount);

    const card = document.createElement('div');
    card.className = 'recipe-card' + (craftable ? ' craftable' : '');

    // 名称
    const nameEl = document.createElement('div');
    nameEl.className = 'recipe-name';
    nameEl.textContent = resultInfo.name || recipe.result.type;
    card.appendChild(nameEl);

    // 中间：格子 + 箭头 + 结果
    const body = document.createElement('div');
    body.className = 'recipe-body';

    const grid = document.createElement('div');
    grid.className = `recipe-grid size-${recipe.size}`;
    const cellSize = recipe.size === 3 ? 18 : 22;
    recipe.pattern.forEach(cellType => {
      const cell = document.createElement('div');
      cell.className = 'rg-cell';
      if (cellType) {
        const icon = makeIcon(cellType, undefined, cellSize);
        cell.appendChild(icon);
        const tip = document.createElement('div');
        tip.className = 'tip';
        tip.textContent = ALL_ITEMS[cellType]?.name || cellType;
        cell.appendChild(tip);
        // 红色提示：材料不足
        if (stockCount(cellType) < (Crafting.getIngredients(recipe)[cellType] || 0)) {
          cell.style.outline = '1px solid #aa2222';
        }
      }
      grid.appendChild(cell);
    });

    const arrow = document.createElement('div');
    arrow.className = 'recipe-arrow';
    arrow.textContent = '→';

    const result = document.createElement('div');
    result.className = 'recipe-result';
    result.appendChild(makeIcon(recipe.result.type, undefined, 28));
    const cntEl = document.createElement('span');
    cntEl.textContent = '×' + recipe.result.count;
    result.appendChild(cntEl);

    body.appendChild(grid); body.appendChild(arrow); body.appendChild(result);
    card.appendChild(body);

    // 底部：材料说明 + 合成按钮
    const footer = document.createElement('div');
    footer.className = 'recipe-footer';

    const desc = document.createElement('span');
    desc.className = 'recipe-desc';
    desc.textContent = Object.entries(Crafting.getIngredients(recipe))
      .map(([t, n]) => `${ALL_ITEMS[t]?.name || t}×${n}`)
      .join('  ');

    const btn = document.createElement('button');
    btn.className = 'craft-btn';
    btn.textContent = '合成';
    btn.disabled = !craftable;
    btn.addEventListener('click', () => {
      if (!Crafting.canCraft(recipe, stockCount)) return;
      Crafting.consumeIngredients(recipe, inv);
      addToInv(recipe.result.type, recipe.result.count);
      showDrop(recipe.result.type, recipe.result.count);
      // 刷新
      buildRecipeList();
      refreshHotbar();
      refreshInvGrids();
    });

    footer.appendChild(desc); footer.appendChild(btn);
    card.appendChild(footer);
    list.appendChild(card);
  });
}

// =====================================================
// 12. 碰撞
// =====================================================
const GRAVITY = -20, SPEED = 5, JUMP = 8;
function isOcc(x, y, z) { return !!getBlock(Math.floor(x), Math.floor(y), Math.floor(z)); }

function resolveCollision(pos, vel) {
  const r = player.radius, h = player.height;
  player.onGround = false;
  const fy = pos.y - h;
  if (isOcc(pos.x-r,fy,pos.z)||isOcc(pos.x+r,fy,pos.z)||isOcc(pos.x,fy,pos.z-r)||isOcc(pos.x,fy,pos.z+r)) {
    pos.y = Math.floor(fy) + h + 1; vel.y = 0; player.onGround = true;
  }
  if (isOcc(pos.x, pos.y+0.1, pos.z)) { pos.y -= 0.1; vel.y = 0; }
  const my = pos.y-h*0.5, my2 = pos.y-h*0.1;
  if (isOcc(pos.x+r,my,pos.z)||isOcc(pos.x+r,my2,pos.z)) { pos.x -= r*0.5; vel.x = 0; }
  if (isOcc(pos.x-r,my,pos.z)||isOcc(pos.x-r,my2,pos.z)) { pos.x += r*0.5; vel.x = 0; }
  if (isOcc(pos.x,my,pos.z+r)||isOcc(pos.x,my2,pos.z+r)) { pos.z -= r*0.5; vel.z = 0; }
  if (isOcc(pos.x,my,pos.z-r)||isOcc(pos.x,my2,pos.z-r)) { pos.z += r*0.5; vel.z = 0; }
}

// =====================================================
// 13. 脚步音效
// =====================================================
let stepTimer = 0;
function tryStep(dt) {
  const moving = Math.abs(player.vel.x) > 0.3 || Math.abs(player.vel.z) > 0.3;
  if (player.onGround && moving) {
    stepTimer -= dt;
    if (stepTimer <= 0) {
      const bType = getBlock(Math.floor(player.pos.x), Math.floor(player.pos.y - player.height - 0.1), Math.floor(player.pos.z)) || 'stone';
      SFX.step(bType);
      stepTimer = 0.38;
    }
  } else stepTimer = 0;
}

// =====================================================
// 14. 初始化生物 & 掉落通知
// =====================================================

/** 右侧悬浮拾取提示 */
function showDrop(type, count) {
  const log = document.getElementById('drop-log');
  if (!log) return;
  const row = document.createElement('div');
  row.className = 'drop-entry';
  const icon = ALL_ITEMS[type]?.icon || '';
  row.textContent = `${icon} +${count} ${ALL_ITEMS[type]?.name || type}`;
  log.appendChild(row);
  setTimeout(() => { row.style.opacity = '0'; setTimeout(() => row.remove(), 500); }, 1800);
}

Entities.init(scene, getBlock, (type, count) => { addToInv(type, count); showDrop(type, count); });
Entities.spawnInitial();

// =====================================================
// 15. 游戏循环
// =====================================================
let last = performance.now(), fpsCount = 0, fpsTime = 0, fps = 0;

function update(dt) {
  // 昼夜推进
  gameTime = (gameTime + dt / DAY_DURATION) % 1.0;
  updateDayNight(gameTime);

  // 生物更新（无论是否锁定都跑）
  Entities.update(dt, player.pos, gameTime);

  if (!locked || invOpen) return;

  const flat  = new THREE.Euler(0, player.yaw, 0, 'YXZ');
  const dir   = new THREE.Vector3(0, 0, -1).applyEuler(flat);
  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
  const move  = new THREE.Vector3();
  if (keys['KeyW']) move.add(dir);
  if (keys['KeyS']) move.sub(dir);
  if (keys['KeyA']) move.sub(right);
  if (keys['KeyD']) move.add(right);
  if (move.lengthSq() > 0) move.normalize().multiplyScalar(SPEED);
  player.vel.x = move.x; player.vel.z = move.z;

  if (keys['Space'] && player.onGround) { player.vel.y = JUMP; player.onGround = false; }
  player.vel.y += GRAVITY * dt;
  player.pos.addScaledVector(player.vel, dt);
  resolveCollision(player.pos, player.vel);
  tryStep(dt);

  camera.position.copy(player.pos);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  const hit = getTargetBlock();
  if (hit) { wireBox.position.copy(hit.object.position); wireBox.visible = true; }
  else wireBox.visible = false;

  // HUD
  const isNight = gameTime > 0.5;
  const p = player.pos;
  document.getElementById('pos').textContent     = `X:${p.x.toFixed(1)}  Y:${p.y.toFixed(1)}  Z:${p.z.toFixed(1)}`;
  document.getElementById('fps-disp').textContent = `FPS:${fps}  ${isNight ? '🌙 夜晚' : '☀ 白天'}`;
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  fpsCount++; fpsTime += dt;
  if (fpsTime >= 0.5) { fps = Math.round(fpsCount / fpsTime); fpsCount = fpsTime = 0; }
  update(dt);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

refreshHotbar();
requestAnimationFrame(loop);
