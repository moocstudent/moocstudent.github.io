// entities.js — 生物系统（可攻击，掉落物品）
const Entities = (() => {
  let _scene = null, _getBlock = null, _onDrop = null;
  const mobs = [];

  /* ── 材质缓存 ─────────────────────────── */
  const _mats = {};
  function mat(hex) {
    if (!_mats[hex]) _mats[hex] = new THREE.MeshLambertMaterial({ color: hex });
    return _mats[hex];
  }
  function box(w, h, d, col) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(col));
  }

  /* ── 掉落物表 ─────────────────────────── */
  const DROPS = {
    chicken: [{ type: 'raw_chicken', min: 1, max: 2 }, { type: 'feather',  min: 0, max: 2 }],
    pig:     [{ type: 'raw_porkchop',min: 1, max: 3 }],
    cow:     [{ type: 'raw_beef',    min: 1, max: 3 }, { type: 'leather',  min: 0, max: 2 }],
    sheep:   [{ type: 'mutton',      min: 1, max: 2 }, { type: 'wool',     min: 1, max: 3 }],
    horse:   [{ type: 'leather',     min: 1, max: 2 }],
    zombie:  [{ type: 'rotten_flesh',min: 0, max: 2 }],
  };

  /* ══════════════════════════════════════════
     基础生物类
  ══════════════════════════════════════════ */
  class Mob {
    constructor(x, y, z) {
      this.pos   = new THREE.Vector3(x, y, z);
      this.vel   = new THREE.Vector3();
      this.group = new THREE.Group();
      _scene.add(this.group);

      this.alive       = true;
      this.onGround    = false;
      this.walkPhase   = Math.random() * Math.PI * 2;
      this.changeDirT  = Math.random() * 2;
      this.soundT      = 4 + Math.random() * 10;
      this.flashTimer  = 0;
      this.speed       = 1.5;
      this.isZombie    = false;
      this.mobType     = 'unknown';
      this.hp          = 10;
      this.maxHp       = 10;
      this.legs        = [];
      this.hitbox      = null;
      this.flashOverlay= null;
    }

    /** 添加碰撞箱（用于射线检测）和红色闪烁覆盖层 */
    addHitbox(w, h, d, cy) {
      const hGeo = new THREE.BoxGeometry(w, h, d);
      const hMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
      this.hitbox = new THREE.Mesh(hGeo, hMat);
      this.hitbox.position.set(0, cy, 0);
      this.hitbox.userData.mob = this;
      this.group.add(this.hitbox);

      const fGeo = new THREE.BoxGeometry(w + 0.06, h + 0.06, d + 0.06);
      const fMat = new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.55 });
      this.flashOverlay = new THREE.Mesh(fGeo, fMat);
      this.flashOverlay.position.set(0, cy, 0);
      this.flashOverlay.visible = false;
      this.group.add(this.flashOverlay);
    }

    /** 受伤 — 返回 true 表示已死亡 */
    takeDamage(amount, attackerPos) {
      this.hp -= amount;
      // 红色闪烁
      this.flashTimer = 0.28;
      if (this.flashOverlay) this.flashOverlay.visible = true;
      // 击退
      if (attackerPos) {
        const dx = this.pos.x - attackerPos.x;
        const dz = this.pos.z - attackerPos.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        this.vel.x = (dx / len) * 7;
        this.vel.z = (dz / len) * 7;
        this.vel.y = 3.5;
        this.onGround = false;
      }
      if (this.hp <= 0) { this.dropItems(); this.remove(); return true; }
      return false;
    }

    /** 掉落物品 */
    dropItems() {
      if (!_onDrop) return;
      (DROPS[this.mobType] || []).forEach(({ type, min, max }) => {
        const n = min + Math.floor(Math.random() * (max - min + 1));
        if (n > 0) _onDrop(type, n);
      });
    }

    update(dt, playerPos, timeOfDay) {
      // 闪烁计时
      if (this.flashTimer > 0) {
        this.flashTimer -= dt;
        if (this.flashTimer <= 0 && this.flashOverlay) this.flashOverlay.visible = false;
      }

      this.changeDirT -= dt;
      this.soundT     -= dt;
      if (this.changeDirT <= 0) this.randomMove();
      if (this.soundT      <= 0) { this.playSound(); this.soundT = 6 + Math.random() * 12; }

      this.applyPhysics(dt);
      this.group.position.copy(this.pos);

      if (this.vel.x !== 0 || this.vel.z !== 0) {
        this.group.rotation.y = Math.atan2(this.vel.x, this.vel.z);
        this.walkPhase += dt * 7;
        this.animLegs();
      }
    }

    randomMove() {
      if (Math.random() < 0.3) {
        this.vel.x = this.vel.z = 0;
        this.changeDirT = 1 + Math.random() * 2;
      } else {
        const a = Math.random() * Math.PI * 2;
        this.vel.x = Math.sin(a) * this.speed;
        this.vel.z = Math.cos(a) * this.speed;
        this.changeDirT = 2 + Math.random() * 4;
      }
    }

    applyPhysics(dt) {
      this.vel.y -= 20 * dt;
      this.pos.x += this.vel.x * dt;
      this.pos.y += this.vel.y * dt;
      this.pos.z += this.vel.z * dt;
      this.resolveGround();
      this.avoidWall();
      this.pos.x = Math.max(0.5, Math.min(15.5, this.pos.x));
      this.pos.z = Math.max(0.5, Math.min(15.5, this.pos.z));
    }

    resolveGround() {
      this.onGround = false;
      const bx = Math.floor(this.pos.x), bz = Math.floor(this.pos.z);
      if (_getBlock(bx, Math.floor(this.pos.y - 0.05), bz)) {
        this.pos.y = Math.floor(this.pos.y - 0.05) + 1.0;
        this.vel.y = 0;
        this.onGround = true;
      }
    }

    avoidWall() {
      if (!this.onGround || (this.vel.x === 0 && this.vel.z === 0)) return;
      const len = Math.sqrt(this.vel.x ** 2 + this.vel.z ** 2);
      const fx = Math.floor(this.pos.x + (this.vel.x / len) * 0.5);
      const fz = Math.floor(this.pos.z + (this.vel.z / len) * 0.5);
      const fy = Math.floor(this.pos.y + 0.5);
      if (_getBlock(fx, fy, fz)) {
        if (!_getBlock(fx, fy + 1, fz)) this.vel.y = 5;
        else { this.vel.x *= -1; this.vel.z *= -1; this.changeDirT = 1; }
      }
    }

    animLegs() {
      if (!this.legs.length) return;
      const s = Math.sin(this.walkPhase) * 0.45;
      if (this.legs.length === 4) {
        this.legs[0].rotation.x =  s; this.legs[1].rotation.x = -s;
        this.legs[2].rotation.x = -s; this.legs[3].rotation.x =  s;
      } else {
        this.legs[0].rotation.x = s; this.legs[1].rotation.x = -s;
      }
    }

    playSound() {}
    remove() { _scene.remove(this.group); this.alive = false; }
  }

  /* ══ CHICKEN ══════════════════════════ */
  class Chicken extends Mob {
    constructor(x, y, z) {
      super(x, y, z); this.speed = 2.0; this.hp = this.maxHp = 4; this.mobType = 'chicken';
      this.buildModel();
    }
    buildModel() {
      const W = 0xf5f5f0;
      const body = box(0.5, 0.33, 0.44, W); body.position.set(0, 0.38, 0);
      const head = box(0.33, 0.33, 0.33, W); head.position.set(0, 0.64, 0.18);
      const beak = box(0.14, 0.08, 0.14, 0xff8c00); beak.position.set(0, 0.62, 0.38);
      const watt = box(0.07, 0.09, 0.07, 0xdd2222); watt.position.set(0, 0.56, 0.37);
      const comb = box(0.08, 0.1,  0.08, 0xdd2222); comb.position.set(0, 0.84, 0.16);
      const ll = box(0.09, 0.24, 0.09, 0xffaa00); ll.position.set(-0.11, 0.12, 0);
      const rl = box(0.09, 0.24, 0.09, 0xffaa00); rl.position.set( 0.11, 0.12, 0);
      const lw = box(0.07, 0.2, 0.36, W); lw.position.set(-0.28, 0.38, 0);
      const rw = box(0.07, 0.2, 0.36, W); rw.position.set( 0.28, 0.38, 0);
      this.group.add(body, head, beak, watt, comb, ll, rl, lw, rw);
      this.legs = [ll, rl];
      this.addHitbox(0.55, 0.85, 0.5, 0.42);
    }
    playSound() { if (typeof SFX !== 'undefined') SFX.chicken(); }
  }

  /* ══ PIG ══════════════════════════════ */
  class Pig extends Mob {
    constructor(x, y, z) {
      super(x, y, z); this.speed = 1.6; this.hp = this.maxHp = 10; this.mobType = 'pig';
      this.buildModel();
    }
    buildModel() {
      const pk = 0xffb6c1, dpk = 0xf48091;
      const body = box(0.9, 0.55, 0.55, pk); body.position.set(0, 0.63, 0);
      const head = box(0.55, 0.54, 0.5, pk);  head.position.set(0, 0.65, 0.52);
      const snout= box(0.28, 0.18, 0.12, dpk); snout.position.set(0, 0.6, 0.82);
      const nl = box(0.06, 0.06, 0.06, 0xcc7088); nl.position.set(-0.07, 0.6, 0.89);
      const nr = box(0.06, 0.06, 0.06, 0xcc7088); nr.position.set( 0.07, 0.6, 0.89);
      this.group.add(body, head, snout, nl, nr);
      [[-0.3,0.17,-0.18],[0.3,0.17,-0.18],[-0.3,0.17,0.18],[0.3,0.17,0.18]].forEach(([lx,ly,lz]) => {
        const l = box(0.18, 0.35, 0.18, dpk); l.position.set(lx, ly, lz);
        this.group.add(l); this.legs.push(l);
      });
      this.addHitbox(0.95, 0.98, 0.65, 0.49);
    }
    playSound() { if (typeof SFX !== 'undefined') SFX.pig(); }
  }

  /* ══ COW ══════════════════════════════ */
  class Cow extends Mob {
    constructor(x, y, z) {
      super(x, y, z); this.speed = 1.3; this.hp = this.maxHp = 10; this.mobType = 'cow';
      this.buildModel();
    }
    buildModel() {
      const br = 0x5c3317, wh = 0xf5f5f5;
      const body = box(1.1, 0.7, 0.55, br);   body.position.set(0, 0.75, 0);
      const patch= box(0.7, 0.18, 0.56, wh);  patch.position.set(0, 0.5, 0);
      const head = box(0.6, 0.6,  0.54, br);  head.position.set(0, 0.88, 0.6);
      const nose = box(0.32, 0.18, 0.12, 0xd2836e); nose.position.set(0, 0.79, 0.93);
      const lh = box(0.08, 0.18, 0.08, wh); lh.position.set(-0.24, 1.26, 0.6);
      const rh = box(0.08, 0.18, 0.08, wh); rh.position.set( 0.24, 1.26, 0.6);
      this.group.add(body, patch, head, nose, lh, rh);
      [[-0.38,0.2,-0.2],[0.38,0.2,-0.2],[-0.38,0.2,0.2],[0.38,0.2,0.2]].forEach(([lx,ly,lz]) => {
        const l = box(0.2, 0.4, 0.2, br); l.position.set(lx, ly, lz);
        this.group.add(l); this.legs.push(l);
      });
      this.addHitbox(1.15, 1.32, 0.7, 0.66);
    }
    playSound() { if (typeof SFX !== 'undefined') SFX.cow(); }
  }

  /* ══ SHEEP ════════════════════════════ */
  class Sheep extends Mob {
    constructor(x, y, z) {
      super(x, y, z); this.speed = 1.4; this.hp = this.maxHp = 8; this.mobType = 'sheep';
      this.buildModel();
    }
    buildModel() {
      const wl = 0xe8e8e0, sk = 0xd4c5a9, lg = 0x555555;
      const body = box(1.0, 0.72, 0.62, wl); body.position.set(0, 0.7, 0);
      const head = box(0.5, 0.54, 0.44, wl); head.position.set(0, 0.87, 0.52);
      const face = box(0.32, 0.28, 0.12, sk); face.position.set(0, 0.8, 0.74);
      const el = box(0.1, 0.18, 0.08, sk); el.position.set(-0.28, 0.9, 0.5);
      const er = box(0.1, 0.18, 0.08, sk); er.position.set( 0.28, 0.9, 0.5);
      this.group.add(body, head, face, el, er);
      [[-0.3,0.17,-0.17],[0.3,0.17,-0.17],[-0.3,0.17,0.17],[0.3,0.17,0.17]].forEach(([lx,ly,lz]) => {
        const l = box(0.16, 0.34, 0.16, lg); l.position.set(lx, ly, lz);
        this.group.add(l); this.legs.push(l);
      });
      this.addHitbox(1.05, 1.1, 0.68, 0.55);
    }
    playSound() { if (typeof SFX !== 'undefined') SFX.sheep(); }
  }

  /* ══ HORSE ════════════════════════════ */
  class Horse extends Mob {
    constructor(x, y, z) {
      super(x, y, z); this.speed = 2.8; this.hp = this.maxHp = 15; this.mobType = 'horse';
      this.buildModel();
    }
    buildModel() {
      const br = 0x8B4513, dk = 0x5a2d0c;
      const body = box(1.3, 0.76, 0.55, br); body.position.set(0, 1.0, 0);
      const neck = box(0.3, 0.55, 0.28, br); neck.position.set(0, 1.28, 0.44); neck.rotation.x = -0.38;
      const head = box(0.38, 0.6, 0.35, br); head.position.set(0, 1.55, 0.7);
      const snout= box(0.28, 0.18, 0.2, dk); snout.position.set(0, 1.44, 0.88);
      const mane = box(0.1, 0.42, 0.62, dk); mane.position.set(0, 1.48, 0.34);
      const tail = box(0.12, 0.52, 0.12, dk); tail.position.set(0, 0.95, -0.74);
      const el = box(0.08, 0.2, 0.08, br); el.position.set(-0.16, 1.82, 0.66);
      const er = box(0.08, 0.2, 0.08, br); er.position.set( 0.16, 1.82, 0.66);
      this.group.add(body, neck, head, snout, mane, tail, el, er);
      [[-0.38,0.28,-0.24],[0.38,0.28,-0.24],[-0.38,0.28,0.24],[0.38,0.28,0.24]].forEach(([lx,ly,lz]) => {
        const l = box(0.2, 0.56, 0.2, dk); l.position.set(lx, ly, lz);
        this.group.add(l); this.legs.push(l);
      });
      this.addHitbox(1.4, 1.9, 0.65, 0.95);
    }
    playSound() { if (typeof SFX !== 'undefined') SFX.horse(); }
  }

  /* ══ ZOMBIE ═══════════════════════════ */
  class Zombie extends Mob {
    constructor(x, y, z) {
      super(x, y, z); this.speed = 1.1; this.isZombie = true;
      this.hp = this.maxHp = 20; this.mobType = 'zombie';
      this.atkTimer = 0; this.buildModel();
    }
    buildModel() {
      const gn = 0x2d7a2d, dk = 0x1a4a1a, bl = 0x1a2d6e;
      const head = box(0.5, 0.5, 0.5, gn); head.position.set(0, 1.65, 0);
      const le = box(0.14, 0.1, 0.06, 0x111111); le.position.set(-0.12, 1.68, 0.26);
      const re = box(0.14, 0.1, 0.06, 0x111111); re.position.set( 0.12, 1.68, 0.26);
      const body = box(0.5, 0.75, 0.3, dk); body.position.set(0, 1.02, 0);
      const la = box(0.22, 0.6, 0.22, gn); la.position.set(-0.37, 1.28, 0.2); la.rotation.x = -1.0;
      const ra = box(0.22, 0.6, 0.22, gn); ra.position.set( 0.37, 1.28, 0.2); ra.rotation.x = -1.0;
      const ll = box(0.23, 0.6, 0.23, bl); ll.position.set(-0.14, 0.3, 0);
      const rl = box(0.23, 0.6, 0.23, bl); rl.position.set( 0.14, 0.3, 0);
      this.group.add(head, le, re, body, la, ra, ll, rl);
      this.legs = [ll, rl];
      this.addHitbox(0.62, 1.9, 0.62, 0.95);
    }

    update(dt, playerPos, timeOfDay) {
      // 闪烁
      if (this.flashTimer > 0) {
        this.flashTimer -= dt;
        if (this.flashTimer <= 0 && this.flashOverlay) this.flashOverlay.visible = false;
      }

      this.changeDirT -= dt;
      this.soundT     -= dt;
      this.atkTimer    = Math.max(0, this.atkTimer - dt);

      // 白天燃烧
      if (timeOfDay > 0.22 && timeOfDay < 0.78) {
        this.hp -= dt * 3;
        if (this.hp <= 0) { this.remove(); return; }
      }

      const dist = this.pos.distanceTo(playerPos);
      if (dist < 14) {
        const dx = playerPos.x - this.pos.x, dz = playerPos.z - this.pos.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        this.vel.x = (dx / len) * this.speed;
        this.vel.z = (dz / len) * this.speed;
        this.changeDirT = 0.3;
        if (dist < 1.6 && this.atkTimer <= 0) {
          this.atkTimer = 1.5;
          if (typeof SFX !== 'undefined') SFX.zombie();
        }
      } else {
        if (this.changeDirT <= 0) this.randomMove();
      }

      if (this.soundT <= 0) {
        if (dist < 22 && typeof SFX !== 'undefined') SFX.zombie();
        this.soundT = 5 + Math.random() * 8;
      }

      this.applyPhysics(dt);
      this.group.position.copy(this.pos);

      if (this.vel.x !== 0 || this.vel.z !== 0) {
        this.group.rotation.y = Math.atan2(this.vel.x, this.vel.z);
        this.walkPhase += dt * 6;
        this.animLegs();
      }
    }
    playSound() { if (typeof SFX !== 'undefined') SFX.zombie(); }
  }

  /* ── 工具函数 ─────────────────────────── */
  function findSurface(x, z) {
    const bx = Math.floor(x), bz = Math.floor(z);
    for (let y = 12; y >= -2; y--) if (_getBlock(bx, y, bz)) return y;
    return 0;
  }

  function spawn(type, x, z) {
    const y = findSurface(x, z) + 2;
    let mob;
    switch (type) {
      case 'chicken': mob = new Chicken(x, y, z); break;
      case 'pig':     mob = new Pig(x, y, z);     break;
      case 'cow':     mob = new Cow(x, y, z);     break;
      case 'sheep':   mob = new Sheep(x, y, z);   break;
      case 'horse':   mob = new Horse(x, y, z);   break;
      case 'zombie':  mob = new Zombie(x, y, z);  break;
      default: return;
    }
    mobs.push(mob);
  }

  function spawnInitial() {
    [['chicken',4],['pig',3],['cow',3],['sheep',3],['horse',2]].forEach(([type, n]) => {
      for (let i = 0; i < n; i++) spawn(type, 1.5 + Math.random() * 13, 1.5 + Math.random() * 13);
    });
  }

  /** 返回所有存活生物的碰撞箱 mesh 列表（供 game.js 射线检测用） */
  function getHitboxes() {
    return mobs.filter(m => m.alive && m.hitbox).map(m => m.hitbox);
  }

  let zombieSpawnT = 25;
  function update(dt, playerPos, timeOfDay) {
    const isNight = timeOfDay > 0.5 || timeOfDay < 0.05;
    if (isNight) {
      zombieSpawnT -= dt;
      if (zombieSpawnT <= 0 && mobs.filter(m => m.isZombie && m.alive).length < 8) {
        spawn('zombie', 1 + Math.random() * 14, 1 + Math.random() * 14);
        zombieSpawnT = 18 + Math.random() * 20;
      }
    }
    for (let i = mobs.length - 1; i >= 0; i--) {
      if (!mobs[i].alive) { mobs.splice(i, 1); continue; }
      mobs[i].update(dt, playerPos, timeOfDay);
    }
  }

  function init(scene, getBlockFn, dropCallback) {
    _scene    = scene;
    _getBlock = getBlockFn;
    _onDrop   = dropCallback;
  }

  return { init, spawnInitial, update, spawn, getHitboxes };
})();
