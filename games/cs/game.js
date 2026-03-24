// ═══════════════════════════════════════════
//  COUNTER STRIKE - BROWSER EDITION
//  Three.js FPS Game Engine
// ═══════════════════════════════════════════

(function () {
    'use strict';

    // ─── CONSTANTS ───────────────────────────
    const PLAYER_HEIGHT = 1.7;
    const PLAYER_SPEED = 5;
    const SPRINT_MULTIPLIER = 1.6;
    const JUMP_FORCE = 7;
    const GRAVITY = 20;
    const MOUSE_SENSITIVITY = 0.002;
    const ENEMY_DAMAGE = 8;
    const ENEMY_FIRE_RATE = 1500;
    const ENEMY_SPEED = 2;
    const ENEMY_COUNT = 6;
    const ROUND_TIME = 180;
    const MAP_SIZE = 60;
    const RECOIL_RECOVERY = 8.0;

    // ─── SMOOTH ANIMATION STATE ──────────────
    let gunTargetZ = -0.4;          // smooth gun knockback
    let gunBobTargetY = -0.2;       // smooth bob Y
    let gunBobTargetX = 0.25;       // smooth bob X
    let targetFOV = 75;             // smooth scope FOV transition

    // ─── WEAPON DEFINITIONS ─────────────────
    const WEAPONS = {
        m4a1: {
            name: 'M4A1',
            clipSize: 30,
            reserveAmmo: 90,
            fireRate: 100,
            damage: 25,
            reloadTime: 2000,
            recoilAmount: 0.005,
            maxRecoil: 0.035,
            auto: true,
            gunKnockback: 0.04,
        },
        deagle: {
            name: 'Desert Eagle',
            clipSize: 7,
            reserveAmmo: 35,
            fireRate: 320,
            damage: 55,
            reloadTime: 1800,
            recoilAmount: 0.015,
            maxRecoil: 0.06,
            auto: false,
            gunKnockback: 0.08,
        },
        awp: {
            name: 'AWP',
            clipSize: 5,
            reserveAmmo: 20,
            fireRate: 1500,
            damage: 150,
            reloadTime: 3500,
            recoilAmount: 0.025,
            maxRecoil: 0.08,
            auto: false,
            gunKnockback: 0.12,
        },
    };
    const WEAPON_KEYS = ['m4a1', 'deagle', 'awp'];
    const MAX_GRENADES = 200;
    const GRENADE_DAMAGE = 80;
    const GRENADE_RADIUS = 8;
    const GRENADE_FUSE = 2.0; // seconds
    const GRENADE_THROW_SPEED = 18;

    // ─── GAME STATE ──────────────────────────
    let scene, camera, renderer, clock;
    let isPlaying = false;
    let isPaused = false;

    const player = {
        health: 100,
        kills: 0,
        shotsFired: 0,
        shotsHit: 0,
        velocity: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        onGround: true,
        isReloading: false,
        isSprinting: false,
        isSwitching: false,
        isScoped: false, // New state
        lastFireTime: 0,
        recoil: 0,
        pitchObject: null,
        yawObject: null,
        currentWeapon: 'm4a1',
        grenades: MAX_GRENADES,
        weaponAmmo: {},  // { m4a1: { clip, reserve }, deagle: { clip, reserve }, awp: { clip, reserve } }
    };

    // Initialize ammo for each weapon
    WEAPON_KEYS.forEach(key => {
        player.weaponAmmo[key] = {
            clip: WEAPONS[key].clipSize,
            reserve: WEAPONS[key].reserveAmmo,
        };
    });

    let enemies = [];
    let colliders = [];
    let muzzleFlash = null;
    let gunGroup = null;
    let weaponModels = {};  // { m4a1: Group, deagle: Group, awp: Group }
    let grenadeObjects = [];  // active thrown grenades
    let roundTimer = ROUND_TIME;
    let gameStartTime = 0;

    const keys = {};
    const raycaster = new THREE.Raycaster();

    // Console State
    let isConsoleOpen = false;
    let autoRespawnEnabled = false;

    // ─── DOM REFS ────────────────────────────
    const startScreen = document.getElementById('startScreen');
    const startBtn = document.getElementById('startBtn');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const restartBtn = document.getElementById('restartBtn');
    const hud = document.getElementById('hud');
    const pauseMenu = document.getElementById('pauseMenu');
    const resumeBtn = document.getElementById('resumeBtn');
    const quitBtn = document.getElementById('quitBtn');
    const healthBar = document.getElementById('healthBar');
    const healthText = document.getElementById('healthText');
    const healthContainer = document.getElementById('healthContainer');
    const ammoClipEl = document.getElementById('ammoClip');
    const ammoReserveEl = document.getElementById('ammoReserve');
    const ammoContainer = document.getElementById('ammoContainer');
    const scoreText = document.getElementById('scoreText');
    const timerText = document.getElementById('timerText');
    const killFeed = document.getElementById('killFeed');
    const damageOverlay = document.getElementById('damageOverlay');
    const hitMarker = document.getElementById('hitMarker');
    const reloadIndicator = document.getElementById('reloadIndicator');
    const crosshair = document.getElementById('crosshair');
    const sniperScope = document.getElementById('sniper-scope');

    // ─── AUDIO SYSTEM (Native Web Audio API) ──
    let audioCtx;
    let audioBuffers = {}; // Stores AudioBuffer objects

    function initAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Helper to create buffers directly
    function createBuffer(duration, generator) {
        if (!audioCtx) initAudio();
        const sr = audioCtx.sampleRate;
        const length = Math.floor(sr * duration);
        const buffer = audioCtx.createBuffer(1, length, sr);
        const data = buffer.getChannelData(0);
        generator(data, length, sr); // Fill data
        return buffer;
    }

    function loadSounds() {
        if (!audioCtx) initAudio();
        const sr = audioCtx.sampleRate;

        // ── M4A1 shot ──
        audioBuffers.shoot_m4a1 = createBuffer(0.12, (buf, len) => {
            for (let i = 0; i < len; i++) {
                const t = i / sr;
                const env = Math.pow(1 - i / len, 4);
                buf[i] = ((Math.random() * 2 - 1) * 0.5 + Math.sin(t * 800) * 0.3) * env * 0.8;
            }
        });

        // ── Desert Eagle shot ──
        audioBuffers.shoot_deagle = createBuffer(0.18, (buf, len) => {
            for (let i = 0; i < len; i++) {
                const t = i / sr;
                const env = Math.pow(1 - i / len, 2.5);
                const bass = Math.sin(t * 150 * (1 - t * 3)) * 0.6;
                const crack = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6) * 0.5;
                buf[i] = (bass + crack) * env * 0.8;
            }
        });

        // ── AWP shot ──
        audioBuffers.shoot_awp = createBuffer(0.35, (buf, len) => {
            for (let i = 0; i < len; i++) {
                const t = i / sr;
                const env = Math.pow(1 - i / len, 1.8);
                buf[i] = ((Math.random() * 2 - 1) * 0.8 + Math.sin(t * 60) * 0.5) * env * 0.9;
            }
        });

        // ── Hit marker ──
        audioBuffers.hit = createBuffer(0.06, (buf, len) => {
            for (let i = 0; i < len; i++) {
                const t = i / sr;
                buf[i] = Math.sin(t * 2400 * Math.PI * 2) * 0.2 * (1 - t / 0.06);
            }
        });

        // ── Kill confirm ──
        audioBuffers.kill = createBuffer(0.18, (buf, len) => {
            for (let i = 0; i < len; i++) {
                const t = i / sr;
                const beep1 = t < 0.06 ? Math.sin(t * 3600 * Math.PI * 2) : 0;
                const beep2 = (t > 0.08 && t < 0.14) ? Math.sin((t - 0.08) * 3600 * Math.PI * 2) : 0;
                buf[i] = (beep1 + beep2) * 0.3 * (1 - i / len);
            }
        });

        // ── Hurt ──
        audioBuffers.hurt = createBuffer(0.25, (buf, len) => {
            for (let i = 0; i < len; i++) {
                const t = i / sr;
                buf[i] = (Math.random() * 2 - 1) * 0.3 * Math.pow(1 - t / 0.25, 2);
            }
        });

        // ── Reload ──
        audioBuffers.reload = createBuffer(0.6, (buf, len) => {
            const clicks = [0, 0.25, 0.45];
            for (let i = 0; i < len; i++) {
                const t = i / sr;
                let val = 0;
                clicks.forEach(ct => {
                    if (t >= ct && t < ct + 0.04) {
                        val += (Math.random() * 2 - 1) * 0.4;
                    }
                });
                buf[i] = val;
            }
        });

        // ── Empty ──
        audioBuffers.empty = createBuffer(0.04, (buf, len) => {
            for (let i = 0; i < len; i++) {
                buf[i] = (Math.random() * 2 - 1) * 0.3 * (1 - i / len);
            }
        });

        // ── Explosion ──
        audioBuffers.explosion = createBuffer(0.8, (buf, len) => {
            for (let i = 0; i < len; i++) {
                const t = i / sr;
                buf[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / 0.8, 2) * 0.8;
            }
        });

        // ── Footstep ──
        audioBuffers.footstep = createBuffer(0.08, (buf, len) => {
            for (let i = 0; i < len; i++) {
                buf[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4) * 0.3;
            }
        });

        // ── Grenade bounce ──
        audioBuffers.bounce = createBuffer(0.06, (buf, len) => {
            for (let i = 0; i < len; i++) {
                buf[i] = Math.sin(i / len * Math.PI) * (Math.random() - 0.5) * 0.5;
            }
        });

        // ── Weapon switch ──
        audioBuffers.weaponSwitch = createBuffer(0.15, (buf, len) => {
            for (let i = 0; i < len; i++) {
                buf[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * 0.3;
            }
        });

        console.log("Audio buffers generated:", Object.keys(audioBuffers));
    }

    function unlockAudio() {
        if (!audioCtx) initAudio();
        if (Object.keys(audioBuffers).length === 0) loadSounds();

        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => {
                console.log('Audio Context Resumed');
                // Play silent note
                const osc = audioCtx.createOscillator();
                osc.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.001);
            });
        }
    }

    let lastFootstepTime = 0;

    function playSound(type) {
        if (!audioCtx) return;

        let key = type;
        if (type === 'shoot') {
            key = 'shoot_' + player.currentWeapon;
        } else if (type === 'scope_toggle') {
            // Simulate scope sound using switch sound with higher pitch
            key = 'weaponSwitch';
        }

        const buffer = audioBuffers[key];
        if (!buffer) return;

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;

        // Gain (Volume)
        const gainNode = audioCtx.createGain();
        let volume = 0.5; // Default volume base

        // Adjust volume per type
        if (key.includes('shoot')) volume = 0.8;
        if (key === 'explosion') volume = 1.0;
        if (key === 'footstep') volume = 0.3;
        if (key === 'reload') volume = 0.6;
        if (key === 'hit') volume = 0.6;

        gainNode.gain.value = volume;

        // Pitch randomness
        if (type === 'footstep') {
            source.playbackRate.value = 0.8 + Math.random() * 0.4;
        } else if (type === 'scope_toggle') {
            source.playbackRate.value = 1.5;
        }

        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0);
    }

    function playFootstep() {
        const now = performance.now();
        const interval = player.isSprinting ? 280 : 400;
        if (now - lastFootstepTime > interval) {
            lastFootstepTime = now;
            playSound('footstep');
        }
    }

    // ─── STATS.JS PERFORMANCE ────────────────
    let stats;

    function initStats() {
        if (typeof Stats === 'undefined') return;
        stats = new Stats();
        stats.showPanel(0); // 0=fps, 1=ms, 2=mb
        const container = document.getElementById('statsContainer');
        if (container) container.appendChild(stats.dom);
    }

    // ─── MINIMAP / RADAR ────────────────────
    const minimapCanvas = document.getElementById('minimapCanvas');
    const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
    const MINIMAP_SIZE = 180;
    const MINIMAP_SCALE = MINIMAP_SIZE / MAP_SIZE; // pixels per world unit

    function updateMinimap() {
        if (!minimapCtx) return;
        const ctx = minimapCtx;
        const cx = MINIMAP_SIZE / 2;
        const cy = MINIMAP_SIZE / 2;

        // Clear
        ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        // Background
        ctx.fillStyle = 'rgba(10, 15, 25, 0.9)';
        ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= MINIMAP_SIZE; i += MINIMAP_SIZE / 6) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, MINIMAP_SIZE); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(MINIMAP_SIZE, i); ctx.stroke();
        }

        // Draw colliders (buildings/walls) as dark rectangles
        ctx.fillStyle = 'rgba(100, 100, 120, 0.5)';
        colliders.forEach(c => {
            const box = new THREE.Box3().setFromObject(c);
            const x = (box.min.x + MAP_SIZE / 2) * MINIMAP_SCALE;
            const z = (box.min.z + MAP_SIZE / 2) * MINIMAP_SCALE;
            const w = (box.max.x - box.min.x) * MINIMAP_SCALE;
            const h = (box.max.z - box.min.z) * MINIMAP_SCALE;
            ctx.fillRect(x, z, w, h);
        });

        // Draw enemies (red dots)
        enemies.forEach(e => {
            if (!e.alive) return;
            const ex = (e.model.position.x + MAP_SIZE / 2) * MINIMAP_SCALE;
            const ez = (e.model.position.z + MAP_SIZE / 2) * MINIMAP_SCALE;

            // Only show on minimap if within detection range or visible
            const dist = e.model.position.distanceTo(player.yawObject.position);
            if (dist < 30) {
                ctx.fillStyle = '#ff3344';
                ctx.beginPath();
                ctx.arc(ex, ez, 3, 0, Math.PI * 2);
                ctx.fill();

                // Enemy facing direction tick
                const angle = e.model.rotation.y;
                ctx.strokeStyle = '#ff3344';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(ex, ez);
                ctx.lineTo(ex + Math.sin(angle) * 6, ez + Math.cos(angle) * 6);
                ctx.stroke();
            }
        });

        // Draw grenade objects
        ctx.fillStyle = '#ffaa00';
        grenadeObjects.forEach(g => {
            const gx = (g.mesh.position.x + MAP_SIZE / 2) * MINIMAP_SCALE;
            const gz = (g.mesh.position.z + MAP_SIZE / 2) * MINIMAP_SCALE;
            ctx.beginPath();
            ctx.arc(gx, gz, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw player (green triangle showing direction)
        const px = (player.yawObject.position.x + MAP_SIZE / 2) * MINIMAP_SCALE;
        const pz = (player.yawObject.position.z + MAP_SIZE / 2) * MINIMAP_SCALE;
        const yaw = player.yawObject.rotation.y;

        ctx.save();
        ctx.translate(px, pz);
        ctx.rotate(-yaw);

        // Player FOV cone
        ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-15, -30);
        ctx.lineTo(15, -30);
        ctx.closePath();
        ctx.fill();

        // Player dot
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(-3.5, 3);
        ctx.lineTo(3.5, 3);
        ctx.closePath();
        ctx.fill();

        // Glow
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();

        // Border
        ctx.strokeStyle = 'rgba(255, 170, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
    }

    // ─── CANNON-ES PHYSICS WORLD ─────────────
    let physicsWorld;
    let grenadePhysicsBodies = [];  // paired with grenadeObjects
    let groundBody;
    let wallBodies = [];

    function initPhysics() {
        if (typeof CANNON === 'undefined') return;

        physicsWorld = new CANNON.World();
        physicsWorld.gravity.set(0, -GRAVITY, 0);
        physicsWorld.broadphase = new CANNON.NaiveBroadphase();
        physicsWorld.solver.iterations = 5;

        // Default contact material — bounce + friction
        const defaultMat = new CANNON.Material('default');
        const contactMat = new CANNON.ContactMaterial(defaultMat, defaultMat, {
            friction: 0.4,
            restitution: 0.3,
        });
        physicsWorld.addContactMaterial(contactMat);
        physicsWorld.defaultContactMaterial = contactMat;

        // Ground plane
        groundBody = new CANNON.Body({ mass: 0, material: defaultMat });
        groundBody.addShape(new CANNON.Plane());
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        physicsWorld.addBody(groundBody);

        // Add wall bodies for colliders
        colliders.forEach(c => {
            const box = new THREE.Box3().setFromObject(c);
            const size = new THREE.Vector3();
            box.getSize(size);
            const center = new THREE.Vector3();
            box.getCenter(center);

            const wallBody = new CANNON.Body({ mass: 0, material: defaultMat });
            wallBody.addShape(new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)));
            wallBody.position.set(center.x, center.y, center.z);
            physicsWorld.addBody(wallBody);
            wallBodies.push(wallBody);
        });
    }

    // ─── INIT ────────────────────────────────
    function init() {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x9ab0c8);
        scene.fog = new THREE.Fog(0x9ab0c8, 40, 110);

        // Camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        document.getElementById('gameContainer').appendChild(renderer.domElement);

        // Clock
        clock = new THREE.Clock();

        // Player camera rig
        player.pitchObject = new THREE.Object3D();
        player.pitchObject.add(camera);

        player.yawObject = new THREE.Object3D();
        player.yawObject.position.y = PLAYER_HEIGHT;
        player.yawObject.add(player.pitchObject);
        scene.add(player.yawObject);

        // Lighting
        createLighting();

        // Map
        buildMap();

        // Gun
        createGun();

        // Enemies
        // spawnEnemy(0); // Start with 0 enemies

        // Events
        setupEvents();

        // Resize
        window.addEventListener('resize', onResize);

        // Stats.js performance monitor
        initStats();

        // Initialize cannon-es physics world
        initPhysics();

        // Start render loop
        animate();
    }

    // ─── LIGHTING ────────────────────────────
    function createLighting() {
        // Ambient — warm sandy tone like CS outdoor
        const ambient = new THREE.AmbientLight(0x886644, 0.55);
        scene.add(ambient);

        // Main directional (sun) — bright warm Middle-Eastern sun
        const sun = new THREE.DirectionalLight(0xffe8b0, 1.35);
        sun.position.set(25, 40, 15);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 120;
        sun.shadow.camera.left = -45;
        sun.shadow.camera.right = 45;
        sun.shadow.camera.top = 45;
        sun.shadow.camera.bottom = -45;
        sun.shadow.bias = -0.0003;
        scene.add(sun);

        // Fill light — cool sky fill from opposite side
        const fill = new THREE.DirectionalLight(0xaabbd4, 0.25);
        fill.position.set(-15, 12, -15);
        scene.add(fill);

        // Hemisphere — sky blue above, sandy ground below
        const hemi = new THREE.HemisphereLight(0x9ab0c8, 0x8b6a2a, 0.5);
        scene.add(hemi);
    }

    // ─── MAP BUILDING ────────────────────────
    function buildMap() {
        const textureLoader = new THREE.TextureLoader();

        // Sky dome — renders behind everything
        const skyGeo = new THREE.SphereGeometry(195, 32, 16);
        const skyMat = new THREE.MeshBasicMaterial({ color: 0x9ab0c8, side: THREE.BackSide });
        scene.add(new THREE.Mesh(skyGeo, skyMat));

        // Ground — sandy CS de_dust2 color
        const groundGeo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0xb89458,
            roughness: 0.97,
            metalness: 0.0,
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Subtle grid — nearly invisible on sandy ground
        const gridHelper = new THREE.GridHelper(MAP_SIZE, 30, 0x9a7a3a, 0x8a6a2a);
        gridHelper.position.y = 0.01;
        gridHelper.material.opacity = 0.15;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        // Materials — warm adobe/stone palette (CS de_dust2 style)
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xa07848, roughness: 0.9, metalness: 0.03 });
        const concreteMat = new THREE.MeshStandardMaterial({ color: 0x9a8a70, roughness: 0.92, metalness: 0.03 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.85, metalness: 0.05 });
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x7a5a1a, roughness: 0.78, metalness: 0.03 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x7a6a52, roughness: 0.45, metalness: 0.75 });

        // Helper to create a box collider
        function addBox(w, h, d, x, y, z, mat, castShadow = true) {
            const geo = new THREE.BoxGeometry(w, h, d);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            mesh.castShadow = castShadow;
            mesh.receiveShadow = true;
            scene.add(mesh);
            colliders.push(mesh);
            return mesh;
        }

        // ── Boundary Walls ──
        const wallH = 5;
        const half = MAP_SIZE / 2;
        addBox(MAP_SIZE, wallH, 1, 0, wallH / 2, -half, concreteMat);
        addBox(MAP_SIZE, wallH, 1, 0, wallH / 2, half, concreteMat);
        addBox(1, wallH, MAP_SIZE, -half, wallH / 2, 0, concreteMat);
        addBox(1, wallH, MAP_SIZE, half, wallH / 2, 0, concreteMat);

        // ── Central Building (large) ──
        addBox(10, 4, 8, 0, 2, 0, wallMat);
        // Roof
        addBox(12, 0.3, 10, 0, 4.15, 0, darkMat);

        // ── Left Buildings ──
        addBox(8, 3.5, 6, -18, 1.75, -12, wallMat);
        addBox(6, 3, 8, -20, 1.5, 8, wallMat);

        // ── Right Buildings ──
        addBox(7, 4.5, 7, 16, 2.25, -10, wallMat);
        addBox(9, 3, 5, 18, 1.5, 12, wallMat);

        // ── Cover: Crates ──
        const cratePositions = [
            [6, 0.6, 1.2, -8, 5], [6, 0.6, 1.2, 10, -5],
            [8, 0.6, 1.2, -5, 15], [8, 0.6, 1.2, 5, -15],
            [-12, 0.6, 1.2, 0, 18], [12, 0.6, 1.2, 0, -18],
            [-8, 0.5, 1, 1, -10], [7, 0.5, 1, 1, 10],
            [15, 0.75, 1.5, 1.5, 0], [-15, 0.75, 1.5, 1.5, 0],
        ];
        cratePositions.forEach(([x, yh, s, z]) => {
            addBox(s, s, s, x, yh, z || 0, crateMat);
        });

        // ── Tall walls for lanes ──
        addBox(1, 3.5, 14, -8, 1.75, 0, concreteMat);
        addBox(1, 3.5, 14, 8, 1.75, 0, concreteMat);

        // ── Low cover walls ──
        addBox(5, 1.2, 0.5, -3, 0.6, 20, concreteMat);
        addBox(5, 1.2, 0.5, 3, 0.6, -20, concreteMat);
        addBox(0.5, 1.2, 5, -22, 0.6, 0, concreteMat);
        addBox(0.5, 1.2, 5, 22, 0.6, 0, concreteMat);

        // ── Metal barrels ──
        const barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
        const barrelPositions = [
            [-6, 0.6, -18], [14, 0.6, 18], [-14, 0.6, 5],
            [5, 0.6, 22], [-22, 0.6, -10], [20, 0.6, -5]
        ];
        barrelPositions.forEach(([x, y, z]) => {
            const barrel = new THREE.Mesh(barrelGeo, metalMat);
            barrel.position.set(x, y, z);
            barrel.castShadow = true;
            barrel.receiveShadow = true;
            scene.add(barrel);
            colliders.push(barrel);
        });

        // ── Subtle warm fill lights — no colored disco lights ──
        const lightPositions = [
            [-18, 4, -12, 0xffe0a0], [16, 5, -10, 0xffd580],
            [0, 4.5, 0, 0xffecc0], [18, 3.5, 12, 0xffe8a0],
        ];
        lightPositions.forEach(([x, y, z, color]) => {
            const pl = new THREE.PointLight(color, 0.35, 18);
            pl.position.set(x, y, z);
            scene.add(pl);
        });

        // Place player at spawn
        player.yawObject.position.set(0, PLAYER_HEIGHT, 25);
    }

    // ─── GUN MODELS ──────────────────────────
    function addMuzzleFlash(group, pos) {
        const flashGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0 });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(pos);
        group.add(flash);
        const flashLight = new THREE.PointLight(0xffaa33, 0, 5);
        flashLight.position.copy(pos);
        group.add(flashLight);
        flash.userData.light = flashLight;
        return flash;
    }

    // ─── HIGH QUALITY WEAPON MODELS ────────
    function createM4Model() {
        const g = new THREE.Group();
        const metalDark = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.4, metalness: 0.8 });
        const metalGrey = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.7 });
        const plasticBlack = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.8, metalness: 0.1 }); // Matte parts

        // 1. Receiver (Main Body) - more complex shape
        const upperRec = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.25), metalGrey);
        upperRec.position.set(0, 0.02, -0.15);
        g.add(upperRec);

        const lowerRec = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.05, 0.24), metalDark);
        lowerRec.position.set(0, -0.03, -0.15);
        g.add(lowerRec);

        // 2. Handguard (Rail System)
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.06, 0.28), metalDark);
        handguard.position.set(0, 0.015, -0.42);
        // Create "rails" texture via geometry strips? Or just simple geometry distinct from barrel
        g.add(handguard);

        // Quad Rails details (top/bottom/sides)
        const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.28), metalGrey);
        railTop.position.set(0, 0.05, -0.42);
        g.add(railTop);

        // 3. Barrel & Flash Hider
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 12), metalGrey);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.015, -0.6);
        g.add(barrel);

        const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.04, 0.02), metalDark);
        frontSight.position.set(0, 0.05, -0.55);
        g.add(frontSight);

        // 4. Magazine (Curved look simulated with rotation)
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.065), metalGrey);
        mag.position.set(0, -0.12, -0.15);
        mag.rotation.x = 0.15; // Angled forward slightly
        g.add(mag);

        // 5. Grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, 0.05), plasticBlack);
        grip.position.set(0, -0.1, 0); // Back near stock
        grip.rotation.x = -0.25;
        g.add(grip);

        // 6. Stock (Buffer tube + Stock)
        const bufferTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), metalDark);
        bufferTube.rotation.x = Math.PI / 2;
        bufferTube.position.set(0, 0.015, 0.05);
        g.add(bufferTube);

        const stockBody = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.12), plasticBlack);
        stockBody.position.set(0, -0.01, 0.12);
        g.add(stockBody);

        const stockButt = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.02), plasticBlack);
        stockButt.position.set(0, -0.02, 0.18);
        g.add(stockButt);

        // 7. Carry Handle / Rear Sight
        const carryHandleBase = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.15), metalDark);
        carryHandleBase.position.set(0, 0.06, -0.15);
        g.add(carryHandleBase);

        g.userData.flash = addMuzzleFlash(g, new THREE.Vector3(0, 0.015, -0.7));
        return g;
    }

    function createDeagleModel() {
        const g = new THREE.Group();
        const silver = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.2, metalness: 1.0 });
        const gripRubber = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 });
        const blackMetal = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.8 });

        // 1. Slide (Massive, triangular top profile)
        // Main block
        const slide = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.055, 0.26), silver);
        slide.position.set(0, 0.02, -0.08); // Offset forward
        g.add(slide);

        // Triangular top barrel cut (simulated with a smaller box on top or just shape)
        // Let's add the barrel tip explicitly
        const barrelTip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.055, 0.02), blackMetal);
        barrelTip.position.set(0, 0.02, -0.215);
        g.add(barrelTip);

        // 2. Frame (Lower body)
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.22), silver);
        frame.position.set(0, -0.025, -0.06);
        g.add(frame);

        // 3. Grip (Thick, rubberized)
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.11, 0.06), gripRubber);
        grip.position.set(0, -0.09, 0.04);
        grip.rotation.x = -0.15;
        g.add(grip);

        // 4. Trigger Guard
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.04, 0.08), silver);
        guard.position.set(0, -0.06, -0.04);
        g.add(guard);

        // 5. Hammer
        const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.02), blackMetal);
        hammer.position.set(0, 0.03, 0.06);
        hammer.rotation.x = -0.5;
        g.add(hammer);

        // 6. Sights
        const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.01), blackMetal);
        rearSight.position.set(0, 0.05, 0.04);
        g.add(rearSight);

        const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 0.01), blackMetal);
        frontSight.position.set(0, 0.05, -0.2);
        g.add(frontSight);

        g.userData.flash = addMuzzleFlash(g, new THREE.Vector3(0, 0.02, -0.3));
        return g;
    }

    function createAWPModel() {
        const g = new THREE.Group();
        const bodyGreen = new THREE.MeshStandardMaterial({ color: 0x3e4a30, roughness: 0.6, metalness: 0.2 });
        const barrelMetal = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.8 });
        const scopeBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.6 });
        const lensGlass = new THREE.MeshStandardMaterial({ color: 0x4466aa, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.8 });

        // 1. Main Stock/Body (One piece feel)
        const stockMain = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, 0.4), bodyGreen);
        stockMain.position.set(0, -0.02, 0);
        g.add(stockMain);

        const stockRear = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.2), bodyGreen);
        stockRear.position.set(0, -0.03, 0.25);
        g.add(stockRear);

        // Thumbhole stock connection
        const thumbBridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.1), bodyGreen);
        thumbBridge.position.set(0, 0.01, 0.15); // Connects top
        g.add(thumbBridge);

        // 2. Barrel (Long, heavy floating barrel)
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.8, 16), barrelMetal);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.03, -0.6);
        g.add(barrel);

        // Bolt mechanism handle
        const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.08), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
        bolt.position.set(0.03, 0.03, -0.05);
        bolt.rotation.y = 0.5;
        g.add(bolt);

        // 3. Scope (Large, detailed)
        // Scope Mounts
        const mount1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.02), scopeBlack);
        mount1.position.set(0, 0.06, -0.1);
        g.add(mount1);

        const mount2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.02), scopeBlack);
        mount2.position.set(0, 0.06, 0.05);
        g.add(mount2);

        // Scope Tube
        const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 12), scopeBlack);
        scopeTube.rotation.x = Math.PI / 2;
        scopeTube.position.set(0, 0.08, -0.05);
        g.add(scopeTube);

        // Lens bells (Front/Rear)
        const frontBell = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.05, 12), scopeBlack);
        frontBell.rotation.x = Math.PI / 2;
        frontBell.position.set(0, 0.08, -0.22);
        g.add(frontBell);

        // Lens glass
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), lensGlass);
        lens.position.set(0, 0.08, -0.25);
        // Circle geometry faces +Z, rotate to face camera? No, face forward (-Z)
        lens.rotation.x = Math.PI;
        g.add(lens);

        const rearBell = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.05, 12), scopeBlack);
        rearBell.rotation.x = Math.PI / 2;
        rearBell.position.set(0, 0.08, 0.12);
        g.add(rearBell);

        // 4. Bipod (Folded)
        const bipodBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), barrelMetal);
        bipodBase.position.set(0, -0.04, -0.45);
        g.add(bipodBase);

        const bipodLegL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.3), barrelMetal);
        bipodLegL.position.set(-0.025, -0.04, -0.35);
        bipodLegL.rotation.x = -0.1;
        g.add(bipodLegL);

        const bipodLegR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.3), barrelMetal);
        bipodLegR.position.set(0.025, -0.04, -0.35);
        bipodLegR.rotation.x = -0.1;
        g.add(bipodLegR);

        // 5. Magazine
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.08), bodyGreen);
        mag.position.set(0, -0.08, -0.15);
        g.add(mag);

        g.userData.flash = addMuzzleFlash(g, new THREE.Vector3(0, 0.03, -1.05));
        return g;
    }

    // First-person forearms + detailed hands (children of gunGroup, bob with weapon)
    function createFPArms() {
        const g = new THREE.Group();
        const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x4a5530, roughness: 0.87 });
        const skinMat   = new THREE.MeshStandardMaterial({ color: 0xd4a060, roughness: 0.75 });

        // Right forearm (trigger hand side) — comes from bottom-right of screen
        const ra = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.36, 0.09), sleeveMat);
        ra.position.set(0.08, -0.36, 0.16);
        ra.rotation.set(-0.52, 0.10, -0.10);
        g.add(ra);

        // Right hand gripping pistol grip area (z≈0 in gunGroup)
        const rh = buildFingerHand(skinMat, true);
        rh.position.set(0.01, -0.10, 0.04);
        rh.rotation.set(1.15, 0.12, 0.05);
        rh.scale.setScalar(0.88);
        g.add(rh);

        // Left forearm (support side) — comes from bottom-left, reaches forward
        const la = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.08), sleeveMat);
        la.position.set(-0.06, -0.33, -0.22);
        la.rotation.set(-0.48, -0.12, 0.08);
        g.add(la);

        // Left support hand gripping handguard area (z≈-0.4 in gunGroup)
        const lh = buildFingerHand(skinMat, false);
        lh.position.set(-0.03, -0.08, -0.36);
        lh.rotation.set(1.08, -0.12, -0.04);
        lh.scale.setScalar(0.88);
        g.add(lh);

        return g;
    }

    function createGun() {
        gunGroup = new THREE.Group();

        weaponModels.m4a1 = createM4Model();
        weaponModels.deagle = createDeagleModel();
        weaponModels.awp = createAWPModel();

        // Add all models, hide non-active
        WEAPON_KEYS.forEach(key => {
            weaponModels[key].visible = (key === player.currentWeapon);
            gunGroup.add(weaponModels[key]);
        });

        // First-person arms — bob and sway with the weapon
        gunGroup.add(createFPArms());

        // Set current flash
        muzzleFlash = weaponModels[player.currentWeapon].userData.flash;

        gunGroup.position.set(0.25, -0.2, -0.4);
        camera.add(gunGroup);
    }

    function switchWeapon(weaponKey) {
        if (player.currentWeapon === weaponKey || player.isSwitching || player.isReloading) return;

        // Unscope immediately if needed
        if (player.isScoped) toggleScope();

        player.isSwitching = true;
        playSound('weaponSwitch');

        // Hide current
        weaponModels[player.currentWeapon].visible = false;

        // Animate weapon down then up
        gunGroup.position.y = -0.5;

        setTimeout(() => {
            player.currentWeapon = weaponKey;
            weaponModels[weaponKey].visible = true;
            muzzleFlash = weaponModels[weaponKey].userData.flash;

            // Animate weapon back up
            gunGroup.position.y = -0.2;
            player.isSwitching = false;
            player.lastFireTime = 0;
            updateHUD();
        }, 300);
    }

    function toggleScope() {
        // Only AWP can scope
        if (player.currentWeapon !== 'awp') return;

        player.isScoped = !player.isScoped;

        playSound('scope_toggle'); // Play scope sound (fallback to weapon switch sound if missing)

        if (player.isScoped) {
            targetFOV = 20;
            sniperScope.style.display = 'block';
            crosshair.style.display = 'none';
            weaponModels.awp.visible = false;
        } else {
            targetFOV = 75;
            sniperScope.style.display = 'none';
            crosshair.style.display = 'block';
            weaponModels.awp.visible = true;
        }
    }

    // ─── GRENADE SYSTEM (cannon-es physics) ──
    function throwGrenade() {
        if (player.grenades <= 0 || player.isSwitching || player.isReloading) return;
        player.grenades--;

        playSound('empty'); // throw sound

        // Get throw direction from camera
        const throwDir = new THREE.Vector3(0, 0, -1);
        throwDir.applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
        throwDir.y += 0.3; // arc upward
        throwDir.normalize();

        // Create grenade mesh
        const grenadeGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const grenadeMat = new THREE.MeshStandardMaterial({ color: 0x3a5a2a, roughness: 0.6, metalness: 0.3 });
        const grenade = new THREE.Mesh(grenadeGeo, grenadeMat);
        grenade.castShadow = true;

        // Spawn at player position
        const worldPos = new THREE.Vector3();
        camera.getWorldPosition(worldPos);
        grenade.position.copy(worldPos).add(throwDir.clone().multiplyScalar(0.5));

        scene.add(grenade);

        // Create cannon-es physics body if available
        let physBody = null;
        if (physicsWorld && typeof CANNON !== 'undefined') {
            physBody = new CANNON.Body({
                mass: 0.4,
                shape: new CANNON.Sphere(0.12),
                material: physicsWorld.defaultContactMaterial.materials[0] || new CANNON.Material(),
                linearDamping: 0.1,
                angularDamping: 0.3,
            });
            physBody.position.set(grenade.position.x, grenade.position.y, grenade.position.z);
            physBody.velocity.set(
                throwDir.x * GRENADE_THROW_SPEED,
                throwDir.y * GRENADE_THROW_SPEED,
                throwDir.z * GRENADE_THROW_SPEED
            );
            physicsWorld.addBody(physBody);

            // Play bounce sound on collision
            physBody.addEventListener('collide', function () {
                if (howlerSounds.bounce) {
                    howlerSounds.bounce.rate(0.8 + Math.random() * 0.4);
                    howlerSounds.bounce.play();
                }
            });
        }

        grenadeObjects.push({
            mesh: grenade,
            velocity: throwDir.clone().multiplyScalar(GRENADE_THROW_SPEED),
            fuseTimer: GRENADE_FUSE,
            physBody: physBody,
        });

        updateHUD();
    }

    function updateGrenades(dt) {
        // Step cannon-es physics world
        if (physicsWorld) {
            physicsWorld.step(1 / 60, dt, 3);
        }

        for (let i = grenadeObjects.length - 1; i >= 0; i--) {
            const g = grenadeObjects[i];
            g.fuseTimer -= dt;

            if (g.physBody) {
                // Sync Three.js mesh from cannon-es body
                g.mesh.position.set(g.physBody.position.x, g.physBody.position.y, g.physBody.position.z);
                g.mesh.quaternion.set(g.physBody.quaternion.x, g.physBody.quaternion.y, g.physBody.quaternion.z, g.physBody.quaternion.w);
            } else {
                // Fallback simple physics
                g.velocity.y -= GRAVITY * dt;
                g.mesh.position.add(g.velocity.clone().multiplyScalar(dt));

                // Bounce off ground
                if (g.mesh.position.y < 0.12) {
                    g.mesh.position.y = 0.12;
                    g.velocity.y = Math.abs(g.velocity.y) * 0.3;
                    g.velocity.x *= 0.7;
                    g.velocity.z *= 0.7;
                    if (Math.abs(g.velocity.y) > 0.5) playSound('bounce');
                }

                // Spin the grenade
                g.mesh.rotation.x += dt * 5;
            }

            // Explode
            if (g.fuseTimer <= 0) {
                explodeGrenade(g);
                scene.remove(g.mesh);
                if (g.physBody && physicsWorld) physicsWorld.removeBody(g.physBody);
                grenadeObjects.splice(i, 1);
            }
        }
    }

    function explodeGrenade(g) {
        const pos = g.mesh.position.clone();

        // Use explosion sound via Howler
        playSound('explosion');

        // Visual: expanding fiery sphere
        const explGeo = new THREE.SphereGeometry(0.3, 12, 12);
        const explMat = new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, opacity: 1 });
        const explosion = new THREE.Mesh(explGeo, explMat);
        explosion.position.copy(pos);
        scene.add(explosion);

        // Secondary inner glow
        const innerGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const innerMat = new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.8 });
        const innerGlow = new THREE.Mesh(innerGeo, innerMat);
        innerGlow.position.copy(pos);
        scene.add(innerGlow);

        // Expanding flash light
        const explLight = new THREE.PointLight(0xff6622, 5, 15);
        explLight.position.copy(pos);
        scene.add(explLight);

        // Smoke particles
        const smokeParticles = [];
        for (let s = 0; s < 6; s++) {
            const smokeGeo = new THREE.SphereGeometry(0.15 + Math.random() * 0.2, 6, 6);
            const smokeMat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.5 });
            const smoke = new THREE.Mesh(smokeGeo, smokeMat);
            smoke.position.copy(pos);
            scene.add(smoke);
            smokeParticles.push({
                mesh: smoke, mat: smokeMat,
                vel: new THREE.Vector3((Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 3),
                life: 1,
            });
        }

        // Animate expansion
        let t = 0;
        const expandInterval = setInterval(() => {
            t += 0.03;
            const scale = 1 + t * 20;
            explosion.scale.set(scale, scale, scale);
            explMat.opacity = Math.max(0, 1 - t * 2);

            const innerScale = 1 + t * 15;
            innerGlow.scale.set(innerScale, innerScale, innerScale);
            innerMat.opacity = Math.max(0, 0.8 - t * 2.5);

            explLight.intensity = Math.max(0, 5 - t * 10);

            // Animate smoke
            smokeParticles.forEach(sp => {
                if (sp.life <= 0) return;
                sp.life -= 0.04;
                sp.mesh.position.add(sp.vel.clone().multiplyScalar(0.02));
                sp.vel.y *= 0.97;
                sp.mesh.scale.multiplyScalar(1.03);
                sp.mat.opacity = Math.max(0, sp.life * 0.4);
                if (sp.life <= 0) scene.remove(sp.mesh);
            });

            if (t > 0.5) {
                clearInterval(expandInterval);
                scene.remove(explosion);
                scene.remove(innerGlow);
                scene.remove(explLight);
                smokeParticles.forEach(sp => { if (sp.mesh.parent) scene.remove(sp.mesh); });
            }
        }, 16);

        // Damage enemies in radius
        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            const dist = enemy.model.position.distanceTo(pos);
            if (dist < GRENADE_RADIUS) {
                const dmg = GRENADE_DAMAGE * (1 - dist / GRENADE_RADIUS);
                enemy.health -= dmg;
                createBloodParticles(enemy.model.position.clone().add(new THREE.Vector3(0, 1, 0)));
                if (enemy.health <= 0) {
                    killEnemy(enemy);
                }
            }
        });

        // Damage player in radius
        const playerDist = player.yawObject.position.distanceTo(pos);
        if (playerDist < GRENADE_RADIUS) {
            const dmg = Math.round(GRENADE_DAMAGE * 0.5 * (1 - playerDist / GRENADE_RADIUS));
            if (dmg > 0) damagePlayer(dmg);
        }
    }

    // ─── ENEMIES ─────────────────────────────

    // Builds a detailed hand with 5 fingers (3 phalanges each + thumb)
    function buildFingerHand(skinMat, isTriggerHand) {
        const g = new THREE.Group();
        const nailMat = new THREE.MeshStandardMaterial({ color: 0xbf9870, roughness: 0.4 });

        // Palm
        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.06, 0.12), skinMat);
        palm.castShadow = true;
        g.add(palm);

        // 4 main fingers: index, middle, ring, pinky
        const fd = [
            { dx: -0.036, segLen: 0.038, w: 0.019 },
            { dx: -0.012, segLen: 0.043, w: 0.021 },
            { dx:  0.012, segLen: 0.038, w: 0.019 },
            { dx:  0.034, segLen: 0.031, w: 0.016 },
        ];
        const baseCurl = isTriggerHand ? 0.55 : 0.22;

        fd.forEach(({ dx, segLen, w }) => {
            // Knuckle ridge
            const kn = new THREE.Mesh(new THREE.BoxGeometry(w * 1.1, 0.009, w), skinMat);
            kn.position.set(dx, 0.037, 0.012);
            g.add(kn);

            for (let s = 0; s < 3; s++) {
                const sLen = segLen * (s === 0 ? 1.0 : s === 1 ? 0.84 : 0.68);
                const seg = new THREE.Mesh(new THREE.BoxGeometry(w, sLen, w * 0.98), skinMat);
                seg.position.set(dx, 0.035 + sLen * 0.5 + segLen * s * 0.82, 0);
                seg.rotation.x = baseCurl * (s === 0 ? 0.28 : s === 1 ? 0.72 : 1.0);
                if (s === 2) {
                    const nail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.70, sLen * 0.36, 0.006), nailMat);
                    nail.position.set(0, sLen * 0.26, w * 0.44);
                    seg.add(nail);
                }
                g.add(seg);
            }
        });

        // Thumb
        const ts = isTriggerHand ? -1 : 1;
        const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.021, 0.031, 0.023), skinMat);
        t1.position.set(ts * 0.060, 0.004, 0.008);
        t1.rotation.z = ts * -0.55;
        t1.castShadow = true;
        g.add(t1);

        const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.026, 0.020), skinMat);
        t2.position.set(ts * 0.079, 0.032, 0.007);
        t2.rotation.z = ts * -0.44;
        const tNail = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.009, 0.006), nailMat);
        tNail.position.set(0, 0.011, 0.011);
        t2.add(tNail);
        g.add(t2);

        return g;
    }

    function createEnemyModel() {
        const group = new THREE.Group();

        // ── Materials ──────────────────────────
        const skinMat   = new THREE.MeshStandardMaterial({ color: 0xd4a060, roughness: 0.75 });
        const vestMat   = new THREE.MeshStandardMaterial({ color: 0x3e4e28, roughness: 0.88, metalness: 0.04 });
        const panMat    = new THREE.MeshStandardMaterial({ color: 0x2d3a1e, roughness: 0.90, metalness: 0.02 });
        const plateMat  = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.70, metalness: 0.15 });
        const bootMat   = new THREE.MeshStandardMaterial({ color: 0x1a1a10, roughness: 0.92, metalness: 0.04 });
        const helmetMat = new THREE.MeshStandardMaterial({ color: 0x383838, roughness: 0.65, metalness: 0.20 });
        const lensMat   = new THREE.MeshStandardMaterial({ color: 0x1a3040, roughness: 0.08, metalness: 0.85, transparent: true, opacity: 0.80 });
        const maskMat   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.70 });
        const gunBody   = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.40, metalness: 0.80 });
        const gunDark   = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.30, metalness: 0.90 });
        const woodMat   = new THREE.MeshStandardMaterial({ color: 0x5a3a18, roughness: 0.85, metalness: 0.02 });
        const pouchMat  = new THREE.MeshStandardMaterial({ color: 0x323d20, roughness: 0.90 });

        function m(geo, mat, x, y, z, rx, ry, rz, shadow = true) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x || 0, y || 0, z || 0);
            if (rx) mesh.rotation.x = rx;
            if (ry) mesh.rotation.y = ry;
            if (rz) mesh.rotation.z = rz;
            if (shadow) mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
            return mesh;
        }
        function bx(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
        function cy(rt, rb, h, s) { return new THREE.CylinderGeometry(rt, rb, h, s); }

        // ── BOOTS ──────────────────────────────
        [-0.14, 0.14].forEach(x => {
            m(bx(0.22, 0.04, 0.28), bootMat, x, 0.02, 0.02);          // sole
            m(bx(0.19, 0.16, 0.22), bootMat, x, 0.10, 0);              // upper
            m(bx(0.18, 0.10, 0.08), plateMat, x, 0.07, 0.13);          // toe cap
        });

        // ── CALVES + KNEEPADS ─────────────────
        [-0.14, 0.14].forEach(x => {
            m(bx(0.19, 0.44, 0.22), panMat, x, 0.40, 0);               // calf
            m(bx(0.20, 0.12, 0.07), plateMat, x, 0.61, 0.13);          // kneepad
        });

        // ── THIGHS ────────────────────────────
        [-0.14, 0.14].forEach(x => {
            m(bx(0.22, 0.38, 0.24), panMat, x, 0.82, 0);               // thigh
            m(bx(0.07, 0.10, 0.06), pouchMat, x > 0 ? x + 0.10 : x - 0.10, 0.80, 0); // side pouch
        });

        // ── PELVIS / BELT ─────────────────────
        m(bx(0.44, 0.13, 0.26), panMat, 0, 1.03, 0);
        m(bx(0.06, 0.04, 0.03), plateMat, 0, 1.03, 0.14);              // buckle

        // ── TORSO / TACTICAL VEST ─────────────
        m(bx(0.58, 0.52, 0.35), vestMat, 0, 1.31, 0);                  // torso
        m(bx(0.38, 0.30, 0.05), plateMat, 0, 1.31, 0.19);              // chest plate
        [-0.13, 0, 0.13].forEach(px => {
            m(bx(0.09, 0.10, 0.07), pouchMat, px, 1.12, 0.20);         // vest pouches
        });
        [-0.22, 0.22].forEach(sx => {
            m(bx(0.07, 0.13, 0.08), vestMat, sx, 1.51, 0.12);          // shoulder straps
        });
        m(bx(0.12, 0.08, 0.05), pouchMat, -0.20, 1.40, 0.20);         // side radio pouch
        m(bx(0.06, 0.06, 0.04), plateMat, 0.20, 1.48, 0.20);          // clip/badge

        // ── NECK ──────────────────────────────
        m(bx(0.17, 0.11, 0.17), skinMat, 0, 1.63, 0);

        // ── HEAD ──────────────────────────────
        m(bx(0.29, 0.28, 0.28), skinMat, 0, 1.83, 0);                  // head base
        m(bx(0.28, 0.11, 0.06), maskMat, 0, 1.73, 0.15);               // lower face mask/balaclava
        m(bx(0.05, 0.06, 0.05), skinMat, 0, 1.83, 0.16);               // nose bridge
        m(bx(0.015, 0.04, 0.03), skinMat, 0, 1.80, 0.18);              // nose tip
        [-0.16, 0.16].forEach(ex => {
            m(bx(0.04, 0.06, 0.05), skinMat, ex, 1.84, 0.01);          // ears
        });

        // Goggles
        m(bx(0.30, 0.08, 0.04), plateMat, 0, 1.90, 0.156);            // frame
        [-0.09, 0.09].forEach(gx => {
            m(bx(0.10, 0.07, 0.03), lensMat, gx, 1.90, 0.172, 0, 0, 0, false); // lenses
        });

        // Helmet
        m(bx(0.33, 0.10, 0.33), helmetMat, 0, 2.00, 0);               // dome
        m(bx(0.34, 0.04, 0.08), helmetMat, 0, 1.96, 0.18);            // front brim
        m(bx(0.26, 0.05, 0.05), helmetMat, 0, 1.98, -0.17);           // nape guard
        m(bx(0.04, 0.04, 0.04), plateMat, 0.14, 2.00, 0.16);          // NVG mount stub

        // ── SHOULDER PADS ─────────────────────
        [-0.34, 0.34].forEach(sx => {
            m(bx(0.10, 0.08, 0.22), plateMat, sx, 1.53, 0);
        });

        // ── LEFT ARM (supporting handguard) ───
        m(bx(0.17, 0.28, 0.18), vestMat, -0.41, 1.33, 0);             // upper arm
        m(bx(0.15, 0.26, 0.16), panMat,  -0.41, 1.04, 0.05, 0.2);    // forearm
        // Left hand gripping handguard
        const leftHand = buildFingerHand(skinMat, false);
        leftHand.position.set(0.28, 1.10, -0.72);
        leftHand.rotation.set(-0.20, -Math.PI / 2, 0);
        leftHand.scale.setScalar(1.05);
        group.add(leftHand);

        // ── RIGHT ARM (trigger arm) ────────────
        m(bx(0.17, 0.26, 0.18), vestMat, 0.41, 1.33, 0);              // upper arm
        m(bx(0.15, 0.18, 0.48), panMat,  0.38, 1.09, -0.32);          // forearm (extended forward)
        // Right trigger hand gripping pistol grip
        const rightHand = buildFingerHand(skinMat, true);
        rightHand.position.set(0.38, 0.97, -0.10);
        rightHand.rotation.set(-0.22,  Math.PI / 2, 0);
        rightHand.scale.setScalar(1.05);
        group.add(rightHand);

        // ── AK-47 STYLE RIFLE ─────────────────
        // Stock (wooden)
        m(bx(0.07, 0.07, 0.22), woodMat, 0.30, 1.12,  0.08);
        m(bx(0.07, 0.11, 0.03), woodMat, 0.30, 1.09,  0.20);          // butt plate

        // Receiver body
        m(bx(0.09, 0.09, 0.60), gunBody, 0.30, 1.12, -0.48);
        m(bx(0.08, 0.038, 0.44), gunDark, 0.30, 1.175, -0.38);        // top cover / dust cover
        m(bx(0.025, 0.020, 0.030), gunDark, 0.32, 1.170, -0.14);      // charging handle

        // Pistol grip
        m(bx(0.046, 0.11, 0.048), maskMat, 0.30, 1.04, -0.12, -0.25);
        m(bx(0.020, 0.052, 0.068), gunDark, 0.30, 1.065, -0.20);      // trigger guard

        // Magazine (banana mag)
        m(bx(0.054, 0.14, 0.074), gunDark, 0.30, 0.99, -0.45, 0.18);
        m(bx(0.054, 0.06, 0.055), gunDark, 0.30, 0.90, -0.48, -0.28); // bottom curve

        // Handguard (wood)
        m(bx(0.088, 0.072, 0.30), woodMat, 0.30, 1.12, -0.78);
        // Handguard lower rail
        m(bx(0.060, 0.025, 0.28), gunDark, 0.30, 1.08, -0.78);

        // Front + rear sights
        m(bx(0.015, 0.068, 0.015), gunDark, 0.30, 1.175, -0.94);      // front post
        m(bx(0.040, 0.028, 0.015), gunDark, 0.30, 1.165, -0.22);      // rear notch

        // Barrel + muzzle
        const barMesh = new THREE.Mesh(cy(0.022, 0.026, 0.42, 10), gunDark);
        barMesh.rotation.x = Math.PI / 2;
        barMesh.position.set(0.30, 1.135, -1.04);
        barMesh.castShadow = true;
        group.add(barMesh);

        const muzzleMesh = new THREE.Mesh(cy(0.028, 0.022, 0.055, 10), gunDark);
        muzzleMesh.rotation.x = Math.PI / 2;
        muzzleMesh.position.set(0.30, 1.135, -1.285);
        group.add(muzzleMesh);

        // ── Muzzle flash ──────────────────────
        const efMat = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0 });
        const enemyFlash = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 8), efMat);
        enemyFlash.position.set(0.30, 1.135, -1.36);
        group.add(enemyFlash);

        const enemyFlashLight = new THREE.PointLight(0xffaa33, 0, 6);
        enemyFlashLight.position.copy(enemyFlash.position);
        group.add(enemyFlashLight);

        group.userData.muzzleFlash = enemyFlash;
        group.userData.muzzleLight = enemyFlashLight;

        return group;
    }

    // Find nearest open position that doesn't overlap any collider
    function findSafeSpawnPos(candidate) {
        const half = MAP_SIZE / 2 - 3;
        const pos = candidate.clone();
        pos.x = Math.max(-half, Math.min(half, pos.x));
        pos.z = Math.max(-half, Math.min(half, pos.z));
        pos.y = 0;
        if (!checkEnemyCollision(pos, 0.7)) return pos;
        // Try expanding rings of offsets until a clear spot is found
        for (let dist = 1.5; dist <= 8; dist += 1.5) {
            for (let a = 0; a < 8; a++) {
                const ang = a * Math.PI / 4;
                const t = pos.clone();
                t.x = Math.max(-half, Math.min(half, pos.x + Math.cos(ang) * dist));
                t.z = Math.max(-half, Math.min(half, pos.z + Math.sin(ang) * dist));
                if (!checkEnemyCollision(t, 0.7)) return t;
            }
        }
        return new THREE.Vector3(0, 0, -18); // absolute fallback
    }

    function spawnEnemy(count = 1) {
        const spawnPoints = [
            new THREE.Vector3(-15, 0, -15),
            new THREE.Vector3(15, 0, -15),
            new THREE.Vector3(-15, 0, 10),
            new THREE.Vector3(15, 0, 10),
            new THREE.Vector3(0, 0, -20),
            new THREE.Vector3(-20, 0, 0),
            new THREE.Vector3(20, 0, 0),
            new THREE.Vector3(0, 0, -8),
        ];

        for (let i = 0; i < count; i++) {
            const model = createEnemyModel();
            // Random spawn point, validated to not be inside a wall
            const rawPos = spawnPoints[Math.floor(Math.random() * spawnPoints.length)].clone();
            rawPos.x += (Math.random() - 0.5) * 2;
            rawPos.z += (Math.random() - 0.5) * 2;
            const spawnPos = findSafeSpawnPos(rawPos);

            model.position.copy(spawnPos);

            // Random waypoints for patrol
            const waypoints = [];
            for (let w = 0; w < 4; w++) {
                waypoints.push(new THREE.Vector3(
                    spawnPos.x + (Math.random() - 0.5) * 16,
                    0,
                    spawnPos.z + (Math.random() - 0.5) * 16
                ));
            }

            const enemy = {
                model,
                health: 100,
                alive: true,
                waypoints,
                waypointIndex: 0,
                lastFireTime: 0,
                respawnTimer: 0,
                spawnPos: spawnPos.clone(),
                detectionRange: 25,
                name: 'BOT-' + String.fromCharCode(65 + (enemies.length % 26)) + (Math.floor(enemies.length / 26) || ''),
            };

            enemies.push(enemy);
            scene.add(model);
        }
    }

    // ─── EVENTS ──────────────────────────────
    function setupEvents() {
        // Pointer lock setup
        startBtn.addEventListener('click', () => {
            unlockAudio();
            startGame();
        });
        restartBtn.addEventListener('click', restartGame);

        resumeBtn.addEventListener('click', () => {
            renderer.domElement.requestPointerLock();
            // Do not hide menu here; wait for pointerlockchange to confirm success
        });

        quitBtn.addEventListener('click', () => {
            pauseMenu.style.display = 'none';
            hud.style.display = 'none';
            startScreen.style.display = 'flex';
            isPlaying = false;
            isPaused = false;

            // Cleanup
            enemies.forEach(e => scene.remove(e.model));
            enemies = [];
            document.exitPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === renderer.domElement) {
                isPaused = false;
                pauseMenu.style.display = 'none';
            } else {
                // If console open, or start/gameover visible, don't show pause menu
                if (isConsoleOpen || startScreen.style.display !== 'none' || gameOverScreen.style.display !== 'none') {
                    isPaused = true;
                } else {
                    // Regular pause
                    isPaused = true;
                    pauseMenu.style.display = 'flex';
                }
            }
        });

        // Mouse
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mousedown', onMouseDown);

        // Keys
        document.addEventListener('keydown', (e) => {
            keys[e.code] = true;

            // Console toggle
            if (e.code === 'Backquote') {
                e.preventDefault();
                toggleConsole();
                return;
            }
            // Enter key for console
            if (e.code === 'Enter' && isConsoleOpen) {
                const input = document.getElementById('console-input');
                if (input) processCommand(input.value);
                return;
            }

            if (!isPlaying || isPaused) return;
            if (e.code === 'KeyR') reload();
            if (e.code === 'Digit1') switchWeapon('m4a1');
            if (e.code === 'Digit2') switchWeapon('deagle');
            if (e.code === 'Digit3') switchWeapon('awp');
            if (e.code === 'Digit4' || e.code === 'KeyG') throwGrenade();
            if (e.code === 'KeyF' || e.code === 'KeyE') toggleScope();
        });
        document.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });

        // Prevent context menu (right click)
        document.addEventListener('contextmenu', event => event.preventDefault());
    }

    function startGame() {
        initAudio();
        startScreen.style.display = 'none';
        hud.style.display = 'block';
        renderer.domElement.requestPointerLock();
        isPlaying = true;
        gameStartTime = Date.now();
        roundTimer = ROUND_TIME;
        spawnEnemy(5);
    }

    function restartGame() {
        // camera.fov = 20;
        // sniperScope.style.display = 'block';
        // crosshair.style.display = 'none';
        // // Hide weapon model
        // weaponModels.awp.visible = false;
        // Reset player
        player.health = 100;
        player.kills = 0;
        player.shotsFired = 0;
        player.shotsHit = 0;
        player.grenades = MAX_GRENADES;
        // Reset ammo for all weapons
        WEAPON_KEYS.forEach(key => {
            player.weaponAmmo[key] = { clip: WEAPONS[key].clipSize, reserve: WEAPONS[key].reserveAmmo };
        });
        player.currentWeapon = 'm4a1';
        WEAPON_KEYS.forEach(key => { weaponModels[key].visible = (key === 'm4a1'); });
        muzzleFlash = weaponModels.m4a1.userData.flash;
        player.isReloading = false;
        player.recoil = 0;
        player.velocity.set(0, 0, 0);
        player.yawObject.position.set(0, PLAYER_HEIGHT, 25);
        player.yawObject.rotation.y = 0;
        player.pitchObject.rotation.x = 0;

        // Clear existing enemies
        enemies.forEach(e => scene.remove(e.model));
        enemies = [];

        // spawnEnemies(); // Disable auto spawn


        roundTimer = ROUND_TIME;
        gameStartTime = Date.now();

        gameOverScreen.style.display = 'none';
        hud.style.display = 'block';
        renderer.domElement.requestPointerLock();
        isPlaying = true;

        updateHUD();
        spawnEnemy(10);
    }

    function gameOver() {
        isPlaying = false;
        hud.style.display = 'none';
        document.exitPointerLock();

        // Stats
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        document.getElementById('finalKills').textContent = player.kills;
        document.getElementById('finalAccuracy').textContent =
            player.shotsFired > 0 ? Math.round((player.shotsHit / player.shotsFired) * 100) + '%' : '0%';
        document.getElementById('finalTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        gameOverScreen.style.display = 'flex';
    }

    // ─── INPUT HANDLERS ──────────────────────
    function onMouseMove(e) {
        if (!isPlaying || isPaused) return;

        const sensitivity = player.isScoped ? MOUSE_SENSITIVITY * 0.15 : MOUSE_SENSITIVITY;

        player.yawObject.rotation.y -= e.movementX * sensitivity;
        player.pitchObject.rotation.x -= e.movementY * sensitivity;
        player.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.pitchObject.rotation.x));
    }

    function onMouseDown(e) {
        if (!isPlaying || isPaused) return;
        if (e.button === 0) shoot();
        if (e.button === 2) toggleScope();

        // Ensure audio context is resume on user interaction
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }

    // ─── SHOOTING ────────────────────────────
    function shoot() {
        if (player.isReloading || player.isSwitching) return;

        const w = WEAPONS[player.currentWeapon];
        const ammo = player.weaponAmmo[player.currentWeapon];
        const now = Date.now();
        if (now - player.lastFireTime < w.fireRate) return;

        if (ammo.clip <= 0) {
            playSound('empty');
            if (ammo.reserve > 0) reload();
            return;
        }

        player.lastFireTime = now;
        ammo.clip--;
        player.shotsFired++;

        playSound('shoot');

        // Muzzle flash
        muzzleFlash.material.opacity = 1;
        muzzleFlash.userData.light.intensity = 3;
        setTimeout(() => {
            muzzleFlash.material.opacity = 0;
            muzzleFlash.userData.light.intensity = 0;
        }, 50);

        // Recoil — per-weapon
        player.recoil = Math.min(player.recoil + w.recoilAmount, w.maxRecoil);
        player.pitchObject.rotation.x += w.recoilAmount;
        // Instant kickback, smooth lerp recovery handled in updatePlayer
        gunTargetZ = -0.4 + w.gunKnockback;

        // Raycast from camera center
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

        // Check enemy hits
        const enemyMeshes = [];
        enemies.forEach(e => {
            if (e.alive) {
                e.model.traverse(child => {
                    if (child.isMesh) enemyMeshes.push(child);
                });
            }
        });

        const hits = raycaster.intersectObjects(enemyMeshes, false);
        if (hits.length > 0) {
            const hitMesh = hits[0].object;
            for (const enemy of enemies) {
                if (!enemy.alive) continue;
                let belongs = false;
                enemy.model.traverse(child => {
                    if (child === hitMesh) belongs = true;
                });
                if (belongs) {
                    player.shotsHit++;
                    enemy.health -= w.damage;
                    playSound('hit');
                    showHitMarker();
                    createBloodParticles(hits[0].point);

                    if (enemy.health <= 0) {
                        killEnemy(enemy);
                    }
                    break;
                }
            }
        }

        // Bullet impact on walls
        const wallHits = raycaster.intersectObjects(colliders, false);
        if (wallHits.length > 0 && (hits.length === 0 || wallHits[0].distance < hits[0].distance)) {
            createBulletHole(wallHits[0].point, wallHits[0].face.normal);
        }

        // Auto-reload when empty
        if (ammo.clip === 0 && ammo.reserve > 0) {
            setTimeout(() => reload(), 300);
        }

        updateHUD();
    }

    function reload() {
        const w = WEAPONS[player.currentWeapon];
        const ammo = player.weaponAmmo[player.currentWeapon];
        if (player.isReloading || player.isSwitching || ammo.clip === w.clipSize || ammo.reserve <= 0) return;

        if (player.isScoped) toggleScope(); // Unscope on reload

        player.isReloading = true;
        reloadIndicator.style.display = 'flex';
        playSound('reload');

        setTimeout(() => {
            const needed = w.clipSize - ammo.clip;
            const available = Math.min(needed, ammo.reserve);
            ammo.clip += available;
            ammo.reserve -= available;
            player.isReloading = false;
            reloadIndicator.style.display = 'none';
            updateHUD();
        }, w.reloadTime);
    }

    // ─── ENEMY COLLISION HELPER ────────────────
    function checkEnemyCollision(pos, radius) {
        for (const c of colliders) {
            const box = new THREE.Box3().setFromObject(c);
            box.min.x -= radius;
            box.min.z -= radius;
            box.max.x += radius;
            box.max.z += radius;

            if (pos.x >= box.min.x && pos.x <= box.max.x &&
                pos.z >= box.min.z && pos.z <= box.max.z &&
                pos.y < box.max.y && pos.y >= box.min.y) {
                return true;
            }
        }
        return false;
    }

    // ─── ENEMY AI ────────────────────────────
    function hasLineOfSight(fromPos, toPos) {
        const eyeFrom = fromPos.clone().add(new THREE.Vector3(0, 1.5, 0));
        const eyeTo = toPos.clone();
        const dir = new THREE.Vector3().subVectors(eyeTo, eyeFrom).normalize();
        const dist = eyeFrom.distanceTo(eyeTo);
        const ray = new THREE.Raycaster(eyeFrom, dir, 0, dist);
        const hits = ray.intersectObjects(colliders);
        return hits.length === 0;
    }

    function updateEnemies(dt) {
        const playerPos = player.yawObject.position;
        const now = Date.now();

        enemies.forEach(enemy => {
            if (!enemy.alive) {
                enemy.respawnTimer -= dt;
                if (enemy.respawnTimer <= 0) {
                    respawnEnemy(enemy);
                }
                return;
            }

            // Push out any enemy that spawned or moved into a wall
            if (checkEnemyCollision(enemy.model.position, 0.5)) {
                const safe = findSafeSpawnPos(enemy.model.position);
                enemy.model.position.copy(safe);
            }

            const distToPlayer = enemy.model.position.distanceTo(playerPos);
            const canSeePlayer = distToPlayer < enemy.detectionRange && hasLineOfSight(enemy.model.position, playerPos);

            if (canSeePlayer) {
                // Face player — add PI because the gun model extends in -Z
                const dir = new THREE.Vector3();
                dir.subVectors(playerPos, enemy.model.position);
                dir.y = 0;
                dir.normalize();
                const angle = Math.atan2(dir.x, dir.z) + Math.PI;
                enemy.model.rotation.y = angle;

                // Move toward player (but keep distance) with collision check
                const moveDir = new THREE.Vector3();
                if (distToPlayer > 8) {
                    moveDir.set(dir.x * ENEMY_SPEED * dt, 0, dir.z * ENEMY_SPEED * dt);
                } else if (distToPlayer < 5) {
                    moveDir.set(-dir.x * ENEMY_SPEED * 0.5 * dt, 0, -dir.z * ENEMY_SPEED * 0.5 * dt);
                }

                if (moveDir.lengthSq() > 0) {
                    const newPos = enemy.model.position.clone().add(moveDir);
                    if (!checkEnemyCollision(newPos, 0.5)) {
                        enemy.model.position.copy(newPos);
                    } else {
                        const slideX = enemy.model.position.clone();
                        slideX.x += moveDir.x;
                        if (!checkEnemyCollision(slideX, 0.5)) {
                            enemy.model.position.x = slideX.x;
                        }
                        const slideZ = enemy.model.position.clone();
                        slideZ.z += moveDir.z;
                        if (!checkEnemyCollision(slideZ, 0.5)) {
                            enemy.model.position.z = slideZ.z;
                        }
                    }
                }

                // Shoot at player (only if has LOS and in range)
                if (now - enemy.lastFireTime > ENEMY_FIRE_RATE && distToPlayer < 20) {
                    enemy.lastFireTime = now;

                    // Show muzzle flash on enemy gun
                    const flash = enemy.model.userData.muzzleFlash;
                    const flashLight = enemy.model.userData.muzzleLight;
                    if (flash && flashLight) {
                        flash.material.opacity = 1;
                        flashLight.intensity = 4;
                        setTimeout(() => {
                            flash.material.opacity = 0;
                            flashLight.intensity = 0;
                        }, 80);
                    }

                    // Hit player with accuracy based on distance
                    const accuracy = Math.max(0.25, 1 - distToPlayer / 22);
                    if (Math.random() < accuracy) {
                        damagePlayer(ENEMY_DAMAGE);
                    }
                }
            } else {
                // Patrol — no LOS to player, patrol waypoints
                const wp = enemy.waypoints[enemy.waypointIndex];
                const toWP = new THREE.Vector3();
                toWP.subVectors(wp, enemy.model.position);
                toWP.y = 0;

                if (toWP.length() < 1) {
                    enemy.waypointIndex = (enemy.waypointIndex + 1) % enemy.waypoints.length;
                } else {
                    toWP.normalize();
                    const angle = Math.atan2(toWP.x, toWP.z) + Math.PI;
                    enemy.model.rotation.y = angle;

                    const moveX = toWP.x * ENEMY_SPEED * 0.5 * dt;
                    const moveZ = toWP.z * ENEMY_SPEED * 0.5 * dt;
                    const newPos = enemy.model.position.clone();
                    newPos.x += moveX;
                    newPos.z += moveZ;

                    if (!checkEnemyCollision(newPos, 0.5)) {
                        enemy.model.position.copy(newPos);
                    } else {
                        enemy.waypointIndex = (enemy.waypointIndex + 1) % enemy.waypoints.length;
                    }
                }
            }

            // Keep within bounds
            const half = MAP_SIZE / 2 - 2;
            enemy.model.position.x = Math.max(-half, Math.min(half, enemy.model.position.x));
            enemy.model.position.z = Math.max(-half, Math.min(half, enemy.model.position.z));
        });
    }

    function killEnemy(enemy) {
        enemy.alive = false;
        // Only set positive timer if auto-respawn is enabled
        enemy.respawnTimer = autoRespawnEnabled ? 5 : -1;
        player.kills++;

        playSound('kill');
        addKillFeedEntry(enemy.name);

        // Death animation — tip over
        const tween = { progress: 0 };
        const startRot = enemy.model.rotation.x;
        const animInterval = setInterval(() => {
            tween.progress += 0.05;
            enemy.model.rotation.x = startRot + tween.progress * (Math.PI / 2);
            enemy.model.position.y = Math.max(-0.5, -tween.progress * 1.0);
            if (tween.progress >= 1) {
                clearInterval(animInterval);
                enemy.model.visible = false;
            }
        }, 16);

        updateHUD();
    }

    function respawnEnemy(enemy) {
        enemy.health = 100;
        enemy.alive = true;
        enemy.model.visible = true;
        const candidate = enemy.spawnPos.clone();
        candidate.x += (Math.random() - 0.5) * 6;
        candidate.z += (Math.random() - 0.5) * 6;
        const safePos = findSafeSpawnPos(candidate);
        enemy.model.position.copy(safePos);
        enemy.model.position.y = 0;
        enemy.model.rotation.set(0, 0, 0);
    }

    // ─── PLAYER DAMAGE ───────────────────────
    function damagePlayer(amount) {
        player.health -= amount;
        playSound('hurt');

        // Flash damage overlay
        damageOverlay.classList.add('active');
        setTimeout(() => damageOverlay.classList.remove('active'), 400);

        if (player.health <= 0) {
            player.health = 0;
            updateHUD();
            gameOver();
        } else {
            updateHUD();
        }
    }

    // ─── VISUAL EFFECTS ──────────────────────
    function showHitMarker() {
        hitMarker.classList.remove('active');
        void hitMarker.offsetWidth; // Force reflow
        hitMarker.classList.add('active');
        setTimeout(() => hitMarker.classList.remove('active'), 200);
    }

    function createBloodParticles(position) {
        const count = 8;
        const particles = [];
        const geo = new THREE.SphereGeometry(0.04, 4, 4);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff2222 });

        for (let i = 0; i < count; i++) {
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(position);
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 3,
                (Math.random() - 0.5) * 3
            );
            scene.add(p);
            particles.push({ mesh: p, velocity: vel, life: 1 });
        }

        // Animate particles
        const interval = setInterval(() => {
            let allDead = true;
            particles.forEach(pt => {
                if (pt.life <= 0) return;
                allDead = false;
                pt.life -= 0.05;
                pt.velocity.y -= 0.15;
                pt.mesh.position.add(pt.velocity.clone().multiplyScalar(0.016));
                pt.mesh.material.opacity = pt.life;
                pt.mesh.material.transparent = true;
                if (pt.life <= 0) {
                    scene.remove(pt.mesh);
                }
            });
            if (allDead) clearInterval(interval);
        }, 16);
    }

    function createBulletHole(position, normal) {
        const holeGeo = new THREE.CircleGeometry(0.05, 8);
        const holeMat = new THREE.MeshBasicMaterial({
            color: 0x111111,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
        });
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.copy(position).add(normal.clone().multiplyScalar(0.01));
        hole.lookAt(position.clone().add(normal));
        scene.add(hole);

        // Remove after 10 seconds
        setTimeout(() => scene.remove(hole), 10000);
    }

    // ─── HUD UPDATE ──────────────────────────
    function updateHUD() {
        // Health
        healthBar.style.width = player.health + '%';
        healthText.textContent = Math.max(0, player.health);

        healthContainer.classList.remove('health-warning', 'health-critical');
        if (player.health <= 25) {
            healthContainer.classList.add('health-critical');
            healthContainer.style.borderLeftColor = '#ff3344';
        } else if (player.health <= 50) {
            healthContainer.classList.add('health-warning');
            healthContainer.style.borderLeftColor = '#ffcc00';
        } else {
            healthContainer.style.borderLeftColor = '#00ff88';
        }

        // Ammo (from current weapon)
        const ammo = player.weaponAmmo[player.currentWeapon];
        ammoClipEl.textContent = ammo.clip;
        ammoReserveEl.textContent = ammo.reserve;
        ammoContainer.classList.toggle('ammo-low', ammo.clip <= 3);

        // Score
        scoreText.textContent = player.kills;

        // Weapon name + grenade count
        const weaponNameEl = document.getElementById('weaponName');
        const grenadeCountEl = document.getElementById('grenadeCount');
        if (weaponNameEl) weaponNameEl.textContent = WEAPONS[player.currentWeapon].name;
        if (grenadeCountEl) grenadeCountEl.textContent = '🧨 ' + player.grenades;

        // Highlight active weapon slot
        const slotMap = { m4a1: '1', deagle: '2', awp: '3' };
        document.querySelectorAll('.weapon-slot').forEach(slot => {
            slot.classList.toggle('active', slot.dataset.slot === slotMap[player.currentWeapon]);
        });
    }

    function updateTimer() {
        if (!isPlaying) return;

        const elapsed = (Date.now() - gameStartTime) / 1000;
        const remaining = Math.max(0, ROUND_TIME - elapsed);
        roundTimer = remaining;

        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        timerText.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (remaining <= 30) {
            timerText.style.color = '#ff3344';
        } else {
            timerText.style.color = '';
        }

        if (remaining <= 0) {
            gameOver();
        }
    }

    function addKillFeedEntry(victimName) {
        const entry = document.createElement('div');
        entry.className = 'kill-entry';
        entry.innerHTML = `YOU ► <span class="victim">${victimName}</span>`;
        killFeed.insertBefore(entry, killFeed.firstChild);

        // Remove old entries
        while (killFeed.children.length > 5) {
            killFeed.removeChild(killFeed.lastChild);
        }

        // Auto-remove after 4s
        setTimeout(() => {
            if (entry.parentNode) entry.parentNode.removeChild(entry);
        }, 4000);
    }

    // ─── PLAYER MOVEMENT ─────────────────────
    function updatePlayer(dt) {
        if (!isPlaying || isPaused) return;

        // Sprint
        player.isSprinting = keys['ShiftLeft'] || keys['ShiftRight'];
        const speed = PLAYER_SPEED * (player.isSprinting ? SPRINT_MULTIPLIER : 1);

        // Movement direction
        const moveForward = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
        const moveRight = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);

        player.direction.set(moveRight, 0, -moveForward);
        player.direction.normalize();

        // Apply yaw rotation to direction
        const yaw = player.yawObject.rotation.y;
        const dx = player.direction.x * Math.cos(yaw) + player.direction.z * Math.sin(yaw);
        const dz = -player.direction.x * Math.sin(yaw) + player.direction.z * Math.cos(yaw);

        // Smooth acceleration — snappy but not instant (CS-like feel)
        const accel = player.onGround ? dt * 22 : dt * 6;
        player.velocity.x += (dx * speed - player.velocity.x) * Math.min(1, accel);
        player.velocity.z += (dz * speed - player.velocity.z) * Math.min(1, accel);

        // Jump
        if (keys['Space'] && player.onGround) {
            player.velocity.y = JUMP_FORCE;
            player.onGround = false;
        }

        // Gravity
        if (!player.onGround) {
            player.velocity.y -= GRAVITY * dt;
        }

        // New position
        const newPos = player.yawObject.position.clone();
        newPos.x += player.velocity.x * dt;
        newPos.y += player.velocity.y * dt;
        newPos.z += player.velocity.z * dt;

        // Simple collision detection with bounds
        const half = MAP_SIZE / 2 - 1;
        newPos.x = Math.max(-half, Math.min(half, newPos.x));
        newPos.z = Math.max(-half, Math.min(half, newPos.z));

        // Simple box collision with colliders
        const playerRadius = 0.4;
        for (const c of colliders) {
            const box = new THREE.Box3().setFromObject(c);
            // Expand for player radius
            box.min.x -= playerRadius;
            box.min.z -= playerRadius;
            box.max.x += playerRadius;
            box.max.z += playerRadius;

            if (newPos.x >= box.min.x && newPos.x <= box.max.x &&
                newPos.z >= box.min.z && newPos.z <= box.max.z &&
                newPos.y - PLAYER_HEIGHT < box.max.y && newPos.y > box.min.y) {

                // Find the smallest penetration axis and push out
                const pushes = [
                    { axis: 'x', dist: newPos.x - box.min.x, dir: -1 },
                    { axis: 'x', dist: box.max.x - newPos.x, dir: 1 },
                    { axis: 'z', dist: newPos.z - box.min.z, dir: -1 },
                    { axis: 'z', dist: box.max.z - newPos.z, dir: 1 },
                ];
                pushes.sort((a, b) => a.dist - b.dist);
                const push = pushes[0];
                if (push.axis === 'x') {
                    newPos.x = push.dir === -1 ? box.min.x - 0.01 : box.max.x + 0.01;
                    player.velocity.x = 0;
                } else {
                    newPos.z = push.dir === -1 ? box.min.z - 0.01 : box.max.z + 0.01;
                    player.velocity.z = 0;
                }
            }
        }

        // Ground check
        if (newPos.y <= PLAYER_HEIGHT) {
            newPos.y = PLAYER_HEIGHT;
            player.velocity.y = 0;
            player.onGround = true;
        }

        player.yawObject.position.copy(newPos);

        // Recoil recovery (fast multiplicative decay, no continuous camera push)
        if (player.recoil > 0.0001) {
            player.recoil *= Math.pow(0.01, dt * (RECOIL_RECOVERY / 8));
        } else {
            player.recoil = 0;
        }

        // Gun bob + footsteps — lerp-based for smooth transitions
        const isMoving = (moveForward !== 0 || moveRight !== 0) && player.onGround;
        const t = performance.now() / 1000;
        if (isMoving) {
            const bobSpeed = player.isSprinting ? 12 : 8;
            const bobAmount = player.isSprinting ? 0.013 : 0.007;
            gunBobTargetY = -0.2 + Math.sin(t * bobSpeed) * bobAmount;
            gunBobTargetX = 0.25 + Math.cos(t * bobSpeed * 0.5) * bobAmount * 0.5;
            playFootstep();
        } else {
            // Idle sway
            gunBobTargetY = -0.2 + Math.sin(t * 1.5) * 0.0015;
            gunBobTargetX = 0.25 + Math.cos(t * 1.0) * 0.001;
        }
        // Smooth lerp toward bob targets
        gunGroup.position.y += (gunBobTargetY - gunGroup.position.y) * Math.min(1, dt * 12);
        gunGroup.position.x += (gunBobTargetX - gunGroup.position.x) * Math.min(1, dt * 12);

        // Smooth gun knockback Z recovery
        gunTargetZ += (-0.4 - gunTargetZ) * Math.min(1, dt * 18);
        gunGroup.position.z = gunTargetZ;

        // Continuous fire (hold mouse) — only for auto weapons
        if (WEAPONS[player.currentWeapon].auto && (keys['mouse0'] || (typeof mouseDown !== 'undefined' && mouseDown))) {
            shoot();
        }

        // Update grenades
        updateGrenades(dt);
    }

    // Track mouse held down for continuous fire
    document.addEventListener('mousedown', (e) => {
        if (e.button === 0) keys['mouse0'] = true;
    });
    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) keys['mouse0'] = false;
    });

    // ─── CONSOLE ─────────────────────────────
    const consoleEl = document.getElementById('console');
    const consoleOutput = document.getElementById('console-output');
    const consoleInput = document.getElementById('console-input');

    function toggleConsole() {
        if (!consoleEl) return;
        isConsoleOpen = !isConsoleOpen;
        if (isConsoleOpen) {
            consoleEl.style.display = 'flex';
            document.exitPointerLock();
            isPaused = true;
            setTimeout(() => consoleInput.focus(), 10);
        } else {
            consoleEl.style.display = 'none';
            renderer.domElement.requestPointerLock();
            isPaused = false;
            consoleInput.value = '';
        }
    }

    function processCommand(cmd) {
        if (!cmd) return;

        logToConsole('> ' + cmd);
        consoleInput.value = '';

        const lowerCmd = cmd.toLowerCase().trim();

        if (lowerCmd === 'add bad bot') {
            spawnEnemy(1);
            logToConsole('Enemy spawned.');
            playSound('reload');
        } else if (lowerCmd === 'add ten bot'){
            spawnEnemy(10);
            logToConsole('10 Enemy spawned.');
            playSound('reload');
        }else if (lowerCmd === 'clear') {
            consoleOutput.textContent = '';
            logToConsole('Console cleared.');
        } else if (lowerCmd === 'restart') {
            logToConsole('Restarting game...');
            restartGame();
            toggleConsole();
        } else {
            logToConsole('Unknown command: ' + cmd);
        }
    }

    function logToConsole(text) {
        if (!consoleOutput) return;
        const line = document.createElement('div');
        line.textContent = text;
        consoleOutput.appendChild(line);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    // ─── CROSSHAIR SPREAD ────────────────────
    function updateCrosshair() {
        const w = WEAPONS[player.currentWeapon];
        const baseSpread = player.currentWeapon === 'awp' ? 2 : 0;
        const spread = player.isSprinting ? 12 : (player.recoil > 0 ? 8 : baseSpread);
        const lines = crosshair.querySelectorAll('.cross-line');
        const base = 6;
        lines[0].style.top = `${-(18 + spread)}px`;
        lines[1].style.top = `${base + spread}px`;
        lines[2].style.left = `${-(18 + spread)}px`;
        lines[3].style.left = `${base + spread}px`;
    }

    // ─── MAIN LOOP ───────────────────────────
    function animate() {
        requestAnimationFrame(animate);
        if (stats) stats.begin();

        const dt = Math.min(clock.getDelta(), 0.05);

        if (isPlaying && !isPaused) {
            updatePlayer(dt);
            updateEnemies(dt);
            updateTimer();
            updateCrosshair();
            updateMinimap();
        }

        // Smooth FOV transition (scope zoom in/out)
        if (Math.abs(camera.fov - targetFOV) > 0.1) {
            camera.fov += (targetFOV - camera.fov) * Math.min(1, dt * 14);
            camera.updateProjectionMatrix();
        }

        renderer.render(scene, camera);
        if (stats) stats.end();
    }

    // ─── RESIZE ──────────────────────────────
    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // ─── BOOT ────────────────────────────────
    init();

})();
