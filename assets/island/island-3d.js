/**
 * 清大福青社「你在福青社都學什麼？」3D 溫暖玩具風主題遊樂園
 * Stage 4: Three.js 溫暖玩具模型 3D 場景引擎 (island-3d.js)
 *
 * 工程亮點：
 * 1. 中央主地標：100% 復刻 2026 第 59 屆大專營「福青希望熱氣球」（五色方格拼布球體 + 藤編籃 + 5 位紅黃營服揮手夥伴 + 3 顆伴飛小氣球）
 * 2. 八大主題遊樂園區微縮建築：西式蔬食快餐館、中式團圓飯館、陽光淨灘海灣、綠意微縮植物園、情緒氣象觀測屋、感恩卡傳郵局、天空之旅露天音樂台、生命領航摩天輪
 * 3. 環島遊園小火車 + 12 處可點擊微縮彩蛋
 * 4. bakeStaticGroup() 依材質批次合併靜態 BufferGeometry，Draw Call 縮減率 > 80%
 * 5. 支援 prefers-reduced-motion 與 visibilitychange 省電休眠
 */

window.registerBwy3DClasses = function (THREE, OrbitControls, BufferGeometryUtils) {
/**
 * 依材質將靜態 Mesh 批次烘焙合併，大幅降低 WebGL Draw Calls
 * @param {THREE.Group} rootGroup
 */
function bakeStaticGroup(rootGroup) {
  rootGroup.updateWorldMatrix(true, true);
  const buckets = new Map();
  const toRemove = [];
  let beforeCount = 0;

  rootGroup.traverse((child) => {
    if (!child.isMesh || child.userData.noBake || child.userData.interactive) return;
    if (Array.isArray(child.material) || !child.geometry) return;

    beforeCount++;
    const mat = child.material;
    const key = mat.uuid;
    if (!buckets.has(key)) {
      buckets.set(key, { material: mat, geos: [], castShadow: false, receiveShadow: false });
    }
    const bucket = buckets.get(key);

    let g = child.geometry.clone();
    if (g.index) g = g.toNonIndexed();
    g.applyMatrix4(child.matrixWorld);

    const pos = g.getAttribute('position');
    if (!pos) return;
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    const norm = g.getAttribute('normal');

    const cleanGeo = new THREE.BufferGeometry();
    cleanGeo.setAttribute('position', pos);
    cleanGeo.setAttribute('normal', norm);

    bucket.geos.push(cleanGeo);
    bucket.castShadow = bucket.castShadow || child.castShadow;
    bucket.receiveShadow = bucket.receiveShadow || child.receiveShadow;
    toRemove.push(child);
  });

  toRemove.forEach((m) => {
    if (m.parent) m.parent.remove(m);
  });

  let afterCount = 0;
  buckets.forEach(({ material, geos, castShadow, receiveShadow }) => {
    if (!geos.length) return;
    const merged = BufferGeometryUtils.mergeGeometries(geos, false);
    if (!merged) return;
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    mesh.matrixAutoUpdate = false;
    mesh.userData.baked = true;
    rootGroup.add(mesh);
    afterCount++;
  });

  const reductionPct = beforeCount > 0 ? Math.round(((beforeCount - afterCount) / beforeCount) * 1000) / 10 : 0;
  const stats = { beforeCount, afterCount, reductionPct };
  if (typeof window !== 'undefined') {
    window.__ISLAND_BAKE_STATS__ = stats;
  }
  return stats;
}

// Parallel-Transport (Bishop Frame) 零扭轉變徑圓管（供清華胖達連帽衫袖口、雙腿與 NTHU 立體刺繡使用）
function makePandaVariableTube(controlNodes, material, tubularSegs = 28, radialSegs = 14, closed = false) {
  const pts = controlNodes.map((n) => new THREE.Vector3(...n.p));
  const curve = new THREE.CatmullRomCurve3(pts, closed, 'catmullrom', 0.45);

  const radiusAt = (t) => {
    if (closed) {
      const n = controlNodes.length;
      const scaled = (t % 1) * n;
      const i0 = Math.floor(scaled) % n;
      const i1 = (i0 + 1) % n;
      const f = scaled - Math.floor(scaled);
      const s = f * f * (3 - 2 * f);
      return controlNodes[i0].r * (1 - s) + controlNodes[i1].r * s;
    }
    const scaled = t * (controlNodes.length - 1);
    const i0 = Math.min(controlNodes.length - 2, Math.max(0, Math.floor(scaled)));
    const f = scaled - i0;
    const s = f * f * (3 - 2 * f);
    return controlNodes[i0].r * (1 - s) + controlNodes[i0 + 1].r * s;
  };

  const tangents = [];
  const normals = [];
  const binormals = [];

  for (let i = 0; i <= tubularSegs; i++) {
    tangents.push(curve.getTangentAt(i / tubularSegs).normalize());
  }

  const ref = new THREE.Vector3(0, 1, 0);
  if (Math.abs(tangents[0].dot(ref)) > 0.85) ref.set(0, 0, 1);
  let nPrev = ref.clone().addScaledVector(tangents[0], -ref.dot(tangents[0])).normalize();
  normals.push(nPrev.clone());
  binormals.push(new THREE.Vector3().crossVectors(tangents[0], nPrev).normalize());

  for (let i = 1; i <= tubularSegs; i++) {
    const tPrev = tangents[i - 1];
    const tCurr = tangents[i];
    const axis = new THREE.Vector3().crossVectors(tPrev, tCurr);
    if (axis.lengthSq() > 1e-10) {
      axis.normalize();
      const angle = Math.acos(Math.min(1, Math.max(-1, tPrev.dot(tCurr))));
      nPrev = nPrev.clone().applyAxisAngle(axis, angle);
    }
    nPrev.addScaledVector(tCurr, -nPrev.dot(tCurr)).normalize();
    normals.push(nPrev.clone());
    binormals.push(new THREE.Vector3().crossVectors(tCurr, nPrev).normalize());
  }

  if (closed) {
    const nStart = normals[0];
    const nEnd = normals[tubularSegs];
    const bStart = binormals[0];
    const twistErr = Math.atan2(nEnd.dot(bStart), nEnd.dot(nStart));
    for (let i = 1; i <= tubularSegs; i++) {
      const corr = -twistErr * (i / tubularSegs);
      normals[i].applyAxisAngle(tangents[i], corr).normalize();
      binormals[i].crossVectors(tangents[i], normals[i]).normalize();
    }
  }

  const capRings = 4;
  const rings = [];

  if (!closed) {
    const c0 = curve.getPointAt(0);
    const r0 = radiusAt(0);
    const T0 = tangents[0];
    const N0 = normals[0];
    const B0 = binormals[0];
    for (let c = capRings; c >= 1; c--) {
      const phi = (c / capRings) * (Math.PI / 2);
      const center = c0.clone().addScaledVector(T0, -Math.sin(phi) * r0);
      const ringR = Math.max(0.0004, Math.cos(phi) * r0);
      rings.push({ center, N: N0, B: B0, r: ringR });
    }
  }

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    rings.push({
      center: curve.getPointAt(t),
      N: normals[i],
      B: binormals[i],
      r: radiusAt(t)
    });
  }

  if (!closed) {
    const c1 = curve.getPointAt(1);
    const r1 = radiusAt(1);
    const T1 = tangents[tubularSegs];
    const N1 = normals[tubularSegs];
    const B1 = binormals[tubularSegs];
    for (let c = 1; c <= capRings; c++) {
      const phi = (c / capRings) * (Math.PI / 2);
      const center = c1.clone().addScaledVector(T1, Math.sin(phi) * r1);
      const ringR = Math.max(0.0004, Math.cos(phi) * r1);
      rings.push({ center, N: N1, B: B1, r: ringR });
    }
  }

  const positions = [];
  const indices = [];

  for (let i = 0; i < rings.length; i++) {
    const { center, N, B, r } = rings[i];
    for (let j = 0; j <= radialSegs; j++) {
      const theta = (j / radialSegs) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      positions.push(
        center.x + r * (cos * N.x + sin * B.x),
        center.y + r * (cos * N.y + sin * B.y),
        center.z + r * (cos * N.z + sin * B.z)
      );
    }
  }

  const stride = radialSegs + 1;
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, d, b);
      indices.push(d, c, b);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makePandaEllipsoid(r, scale, pos, material, seg = 22, rot = [0, 0, 0]) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, seg, Math.round(seg * 0.8)),
    material
  );
  m.scale.set(scale[0], scale[1], scale[2]);
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot[0] || rot[1] || rot[2]) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

class BwyIsland3DEngine {
  /**
   * @param {Object} opts
   * @param {HTMLCanvasElement} opts.canvas
   * @param {HTMLElement} opts.labelsLayer
   * @param {Object} opts.hubData
   * @param {Array} opts.zonesData
   * @param {Array} opts.treasuresData
   * @param {Function} opts.onSelectTarget (targetId, type) => void
   * @param {Function} opts.onCollectTreasure (treasureId) => void
   */
  constructor(opts) {
    this.canvas = opts.canvas;
    this.labelsLayer = opts.labelsLayer;
    this.hubData = opts.hubData;
    this.zonesData = opts.zonesData;
    this.treasuresData = opts.treasuresData;
    this.onSelectTarget = opts.onSelectTarget || (() => {});
    this.onCollectTreasure = opts.onCollectTreasure || (() => {});

    this.materials = new Map();
    this.interactiveHitboxes = [];
    this.treasureMeshes = new Map();
    this.labelElements = new Map();
    this.nightLights = [];
    this.animated = {
      mainBalloon: null,
      miniBalloons: [],
      ferrisWheel: null,
      weatherVane: null,
      trainGroup: null,
      trainAngle: 0,
      followTrain: false,
      yachts: [],
      miniSkyIsland: null
    };

    this.timeMode = 'night';
    this.clock = new THREE.Clock();
    this.cameraFlight = null;
    this.pointerDownPos = { x: 0, y: 0 };
    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2();

    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = this.reducedMotionQuery.matches;
    this.reducedMotionQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
    });

    this.initScene();
    this.carnival = typeof window.BwyCarnivalUpgrade === 'function' ? new window.BwyCarnivalUpgrade(this) : null;
    this.buildBaseParkIsland();
    this.buildBwyHotAirBalloonHub();
    this.buildAllZoneDioramas();
    this.buildThemeParkTrain();
    this.buildTreasureMarkers();
    if (this.carnival) this.carnival.buildAll();

    this.bakeStats = bakeStaticGroup(this.staticRoot);
    window.__ISLAND_METRICS__ = this.bakeStats;
    this.buildDomLabels();
    this.setTimeOfDay(this.timeMode);
    this.bindEvents();
    this.startLoop();
  }

  /**
   * 取得或快取溫暖玩具風材質（共用 Material UUID 以最大化 bakeStaticGroup 合併效率）
   */
  mat(hex, opts = {}) {
    const roughness = opts.roughness ?? 0.72;
    const metalness = opts.metalness ?? 0.06;
    const emissive = opts.emissive ?? 0x000000;
    const emissiveIntensity = opts.emissiveIntensity ?? 0;
    const transparent = opts.transparent ?? false;
    const opacity = opts.opacity ?? 1.0;
    const flatShading = opts.flatShading ?? false;
    const key = `${hex}_${roughness}_${metalness}_${emissive}_${emissiveIntensity}_${transparent}_${opacity}_${flatShading}`;
    if (!this.materials.has(key)) {
      this.materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(hex),
          roughness,
          metalness,
          emissive: new THREE.Color(emissive),
          emissiveIntensity,
          transparent,
          opacity,
          flatShading
        })
      );
    }
    return this.materials.get(key);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#133a5c');
    this.scene.fog = new THREE.FogExp2('#133a5c', 0.0095);

    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.5, 320);
    this.camera.position.set(0, 21.5, 47);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI * 0.46;
    this.controls.minPolarAngle = Math.PI * 0.1;
    this.controls.minDistance = 9;
    this.controls.maxDistance = 68;
    this.controls.target.set(0, 5.4, -1);

    // 溫暖玩具風三點式打光
    this.hemiLight = new THREE.HemisphereLight('#fff9eb', '#d9a773', 1.05);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#fff2d6', 1.65);
    this.sunLight.position.set(28, 42, 24);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 110;
    const d = 34;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight('#9ad1f5', 0.45);
    this.fillLight.position.set(-24, 18, -20);
    this.scene.add(this.fillLight);

    this.staticRoot = new THREE.Group();
    this.dynamicRoot = new THREE.Group();
    this.scene.add(this.staticRoot);
    this.scene.add(this.dynamicRoot);
  }

  /**
   * 建構主題遊樂園主島嶼基座、環狀步道、小火車鐵軌與周邊玩具樹木
   */
  buildBaseParkIsland() {
    // 1. 無邊際深海平面 + 環島淺灘海灣（增強水面倒影反光，映照煙火與彩燈）
    this.deepSeaMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#09182e'),
      roughness: 0.16,
      metalness: 0.44
    });
    const deepSeaGeo = new THREE.CylinderGeometry(280, 280, 1.2, 48);
    const deepSeaMesh = new THREE.Mesh(deepSeaGeo, this.deepSeaMat);
    deepSeaMesh.position.y = -1.7;
    deepSeaMesh.receiveShadow = true;
    this.dynamicRoot.add(deepSeaMesh);

    const seaGeo = new THREE.CylinderGeometry(33.5, 36.5, 1.35, 48);
    const seaMesh = new THREE.Mesh(seaGeo, this.mat('#2b7fa3', { roughness: 0.14, metalness: 0.48 }));
    seaMesh.position.y = -1.48;
    seaMesh.receiveShadow = true;
    this.staticRoot.add(seaMesh);

    // 2. 溫暖大地岩層底座（解法 B：調降高彩度為大地質感陶褐）
    const rockGeo = new THREE.CylinderGeometry(26.5, 23.5, 2.2, 36);
    const rockMesh = new THREE.Mesh(rockGeo, this.mat('#c78d5c', { roughness: 0.78 }));
    rockMesh.position.y = -1.1;
    rockMesh.receiveShadow = true;
    this.staticRoot.add(rockMesh);

    // 3. 鼠尾草綠草坪主島面（解法 B：降彩度、提升夜間霓虹與黃銅反光對比）
    const lawnGeo = new THREE.CylinderGeometry(25.8, 26.4, 0.9, 36);
    const lawnMesh = new THREE.Mesh(lawnGeo, this.mat('#6da851', { roughness: 0.78 }));
    lawnMesh.position.y = -0.35;
    lawnMesh.receiveShadow = true;
    this.staticRoot.add(lawnMesh);

    // 4. 中央暖砂石磚圓形主廣場
    const plazaGeo = new THREE.CylinderGeometry(7.2, 7.5, 0.22, 32);
    const plazaMesh = new THREE.Mesh(plazaGeo, this.mat('#f2e5cc', { roughness: 0.76 }));
    plazaMesh.position.y = 0.11;
    plazaMesh.receiveShadow = true;
    this.staticRoot.add(plazaMesh);

    const innerRingGeo = new THREE.RingGeometry(5.6, 6.2, 32);
    innerRingGeo.rotateX(-Math.PI / 2);
    const innerRing = new THREE.Mesh(innerRingGeo, this.mat('#e26345'));
    innerRing.position.y = 0.23;
    this.staticRoot.add(innerRing);

    // 5. 連接 8 大園區的鵝卵石放射步道
    this.zonesData.forEach((zone) => {
      const dx = zone.position.x;
      const dz = zone.position.z;
      const dist = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      const steps = 7;
      for (let i = 2; i < steps; i++) {
        const t = i / steps;
        const stone = new THREE.Mesh(
          new THREE.CylinderGeometry(0.95, 1.05, 0.12, 12),
          this.mat(i % 2 === 0 ? '#ede0c7' : '#e2d0b0')
        );
        stone.position.set(dx * t, 0.08, dz * t);
        stone.rotation.y = angle;
        stone.receiveShadow = true;
        this.staticRoot.add(stone);
      }

      // 每個園區專屬底座圓盤
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(4.6, 4.9, 0.25, 24),
        this.mat('#efe2c8', { roughness: 0.76 })
      );
      pad.position.set(dx, 0.12, dz);
      pad.receiveShadow = true;
      this.staticRoot.add(pad);

      const trim = new THREE.Mesh(
        new THREE.CylinderGeometry(4.75, 4.95, 0.12, 24),
        this.mat(zone.color)
      );
      trim.position.set(dx, 0.06, dz);
      this.staticRoot.add(trim);
    });

    // 6. 環島遊園小火車枕木與鐵軌 (半徑 11.2)
    const railRadius = 11.2;
    const sleeperCount = 56;
    for (let i = 0; i < sleeperCount; i++) {
      const a = (i / sleeperCount) * Math.PI * 2;
      const sleeper = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.08, 0.24),
        this.mat('#8c5a32')
      );
      sleeper.position.set(Math.cos(a) * railRadius, 0.1, Math.sin(a) * railRadius);
      sleeper.rotation.y = -a;
      this.staticRoot.add(sleeper);
    }

    // 7. 園區外圍幾何切面低多邊形（Faceted Low-Poly）樹群
    const treeAngles = [0.22, 0.58, 1.05, 1.38, 1.85, 2.25, 2.68, 3.45, 3.88, 4.35, 4.95, 5.42, 5.95];
    treeAngles.forEach((a, idx) => {
      const r = idx % 2 === 0 ? 22.8 : 9.0;
      const tx = Math.cos(a) * r;
      const tz = Math.sin(a) * r;
      this.addToyTree(tx, tz, 0.85 + (idx % 3) * 0.2, idx % 2 === 0 ? '#4d8c40' : '#639e4c');
    });
  }

  addToyTree(x, z, scale = 1, crownColor = '#4d8c40') {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 1.22 * scale, 7),
      this.mat('#8c5c34', { flatShading: true, roughness: 0.82 })
    );
    trunk.position.set(x, 0.6 * scale, z);
    trunk.castShadow = true;
    this.staticRoot.add(trunk);

    const c1 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.94 * scale, 1),
      this.mat(crownColor, { flatShading: true, roughness: 0.78 })
    );
    c1.position.set(x, 1.65 * scale, z);
    c1.rotation.set(0.24, x * 0.35, -0.18);
    c1.castShadow = true;
    this.staticRoot.add(c1);

    const c2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.66 * scale, 1),
      this.mat('#7cb35b', { flatShading: true, roughness: 0.78 })
    );
    c2.position.set(x + 0.32 * scale, 2.24 * scale, z - 0.2 * scale);
    c2.rotation.set(-0.32, z * 0.4, 0.22);
    c2.castShadow = true;
    this.staticRoot.add(c2);

    const c3 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.54 * scale, 1),
      this.mat('#589445', { flatShading: true, roughness: 0.78 })
    );
    c3.position.set(x - 0.34 * scale, 2.02 * scale, z + 0.24 * scale);
    c3.rotation.set(0.18, (x + z) * 0.25, -0.28);
    c3.castShadow = true;
    this.staticRoot.add(c3);
  }

  /**
   * 核心地標：2026 第 59 屆大專營「福青希望熱氣球主廣場」
   * 復刻上傳圖片：珊瑚紅、暖黃、天青藍、嫩草綠、米白五色方格球體 + 藤編籃 + 5 位紅黃營服揮手夥伴 + 3 顆伴飛小氣球
   */
  buildBwyHotAirBalloonHub() {
    // 1. 地面迎賓拱門與廣場時刻表
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, 5.8);
    const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 2.8, 12), this.mat('#e26345'));
    leftPillar.position.set(-1.9, 1.4, 0);
    leftPillar.castShadow = true;
    const rightPillar = leftPillar.clone();
    rightPillar.position.set(1.9, 1.4, 0);
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.65, 0.45), this.mat('#f5c73b'));
    topBeam.position.set(0, 2.9, 0);
    topBeam.castShadow = true;
    archGroup.add(leftPillar, rightPillar, topBeam);
    this.staticRoot.add(archGroup);

    // 1B. 蒙民偉樓 315 福青社窩迎賓歡迎立牌（彩蛋 #02 本體）
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.35, 8), this.mat('#8b5a2b'));
    signPost.position.set(2.8, 0.68, 5.2);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.12), this.mat('#fff6e5'));
    signBoard.position.set(2.8, 1.28, 5.2);
    signBoard.rotation.y = -0.25;
    const signHeader = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.18, 0.14), this.mat('#e26345'));
    signHeader.position.set(2.8, 1.54, 5.2);
    signHeader.rotation.y = -0.25;
    this.staticRoot.add(signPost, signBoard, signHeader);
    this.registerTreasureHitbox('egg-02', [1.4, 1.8, 1.1], new THREE.Vector3(2.8, 0.95, 5.2), this.dynamicRoot, true);

    // 2. 浮空福青希望主熱氣球 (動態呼吸升降群組，抬高基準確保下沉不觸地)
    const balloonGroup = new THREE.Group();
    balloonGroup.position.set(0, 7.6, 0);

    // 五色方格拼布球體 (Patchwork Envelope)
    const palette = ['#e26345', '#f5c73b', '#5aa4d6', '#95cd4f', '#f8f0d8'];
    const rows = 6;
    const cols = 12;
    const radius = 3.85;

    for (let r = 0; r < rows; r++) {
      const phiStart = (r / rows) * (Math.PI * 0.82);
      const phiLength = (Math.PI * 0.82) / rows;
      for (let c = 0; c < cols; c++) {
        const thetaStart = (c / cols) * Math.PI * 2;
        const thetaLength = (Math.PI * 2) / cols;
        const colorHex = palette[(r * 2 + c) % palette.length];

        const patchGeo = new THREE.SphereGeometry(
          radius,
          4,
          4,
          thetaStart,
          thetaLength,
          phiStart,
          phiLength
        );
        // 水滴型拉伸：上半部飽滿、下半部向吊籃收攏
        const pos = patchGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const py = pos.getY(i);
          if (py < 0) {
            const factor = 1 - Math.abs(py / radius) * 0.28;
            pos.setX(i, pos.getX(i) * factor);
            pos.setZ(i, pos.getZ(i) * factor);
            pos.setY(i, py * 1.18);
          } else {
            pos.setY(i, py * 1.06);
          }
        }
        patchGeo.computeVertexNormals();

        const patchMesh = new THREE.Mesh(patchGeo, this.mat(colorHex, { roughness: 0.65 }));
        patchMesh.castShadow = true;
        balloonGroup.add(patchMesh);
      }
    }

    // 氣球底部米白收口環与支撐纜繩
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.14, 10, 24),
      this.mat('#f8f0d8')
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = -3.45;
    balloonGroup.add(collar);

    const ropeOffsets = [
      [-1.1, -1.1],
      [1.1, -1.1],
      [-1.1, 1.1],
      [1.1, 1.1]
    ];
    ropeOffsets.forEach(([rx, rz]) => {
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 2.1, 8),
        this.mat('#f8f0d8')
      );
      rope.position.set(rx * 0.85, -4.35, rz * 0.85);
      rope.rotation.z = rx * 0.14;
      rope.rotation.x = -rz * 0.14;
      balloonGroup.add(rope);
    });

    // 熱氣球燃燒器溫暖火焰燈
    const flameMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 12, 10),
      this.mat('#ffae33', { emissive: '#ff7700', emissiveIntensity: 1.5 })
    );
    flameMesh.position.y = -3.6;
    balloonGroup.add(flameMesh);

    const burnerLight = new THREE.PointLight('#ff9f43', 1.8, 18);
    burnerLight.position.set(0, -3.5, 0);
    balloonGroup.add(burnerLight);
    this.nightLights.push(burnerLight);

    // 藤編竹籃 (Wicker Basket)
    const basketGroup = new THREE.Group();
    basketGroup.position.y = -5.45;

    const basketBody = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.32, 1.35, 16),
      this.mat('#d49b4b', { roughness: 0.82 })
    );
    basketBody.castShadow = true;
    basketGroup.add(basketBody);

    const basketRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.14, 10, 24),
      this.mat('#a87028', { roughness: 0.85 })
    );
    basketRim.rotation.x = Math.PI / 2;
    basketRim.position.y = 0.68;
    basketGroup.add(basketRim);

    // 吊籃內 5 位揮手福青夥伴（重現參考圖構圖：紅黃營服、胸前名牌、眼鏡、相機、比愛心與揮手）
    const youthConfigs = [
      { x: -0.82, y: 0.85, z: 0.45, shirt: '#f5dc6b', hair: '#d4a36a', waveLeft: true, hasCamera: true },
      { x: -0.32, y: 1.02, z: 0.15, shirt: '#c83e3b', hair: '#b8623e', waveLeft: true, waveRight: true },
      { x: 0.25, y: 1.15, z: -0.25, shirt: '#f5dc6b', hair: '#6b4936', waveRight: true },
      { x: 0.32, y: 0.82, z: 0.58, shirt: '#f5dc6b', hair: '#7d4e3d', heartPose: true },
      { x: 0.88, y: 0.96, z: 0.35, shirt: '#c83e3b', hair: '#2e2927', waveRight: true, glasses: true }
    ];

    youthConfigs.forEach((cfg) => {
      const fig = this.createToyYouthFigure(cfg);
      fig.position.set(cfg.x, cfg.y, cfg.z);
      basketGroup.add(fig);
    });

    balloonGroup.add(basketGroup);
    this.dynamicRoot.add(balloonGroup);
    this.animated.mainBalloon = balloonGroup;

    // 註冊主熱氣球點擊 Hitbox
    this.registerHitbox(this.hubData.id, 'hub', new THREE.Vector3(0, 6.6, 0), 5.2, 10.5);

    // 3. 伴飛迷你熱氣球（左 1 黃白格、右 2 紫白與綠白）
    const miniSpecs = [
      { x: -6.2, y: 10.0, z: 2.2, c1: '#f5c73b', c2: '#fffdf7', phase: 0 },
      { x: 6.4, y: 9.6, z: -2.0, c1: '#8b73b4', c2: '#fffdf7', phase: 1.8 },
      { x: 7.8, y: 11.2, z: -0.4, c1: '#82c356', c2: '#fffdf7', phase: 3.4 }
    ];

    miniSpecs.forEach((spec, idx) => {
      const mini = this.createMiniBalloon(spec.c1, spec.c2);
      mini.position.set(spec.x, spec.y, spec.z);
      mini.userData.baseY = spec.y;
      mini.userData.phase = spec.phase;
      this.dynamicRoot.add(mini);
      this.animated.miniBalloons.push(mini);
      if (idx === 0) {
        this.registerTreasureHitbox('egg-01', 1.5, new THREE.Vector3(0, 0, 0), mini, false);
      }
    });
  }

  /**
   * 建立吊籃內的玩具風福青夥伴
   */
  createToyYouthFigure(cfg) {
    const g = new THREE.Group();

    // 營服上身
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.26, 0.58, 10),
      this.mat(cfg.shirt)
    );
    torso.position.y = 0.2;
    g.add(torso);

    // 胸前白色名牌吊帶
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.18, 0.04),
      this.mat('#ffffff')
    );
    badge.position.set(0, 0.18, 0.23);
    g.add(badge);

    // 頭部與頭髮
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 12, 10),
      this.mat('#ffe3c8')
    );
    head.position.y = 0.68;
    g.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.255, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
      this.mat(cfg.hair)
    );
    hair.position.y = 0.71;
    hair.rotation.x = -0.18;
    g.add(hair);

    // 圓框眼鏡（右方紅衫夥伴）
    if (cfg.glasses) {
      const glassMat = this.mat('#2a2522');
      const leftLens = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.012, 6, 12), glassMat);
      leftLens.position.set(-0.08, 0.68, 0.22);
      const rightLens = leftLens.clone();
      rightLens.position.x = 0.08;
      g.add(leftLens, rightLens);
    }

    // 相機背帶（左方黃衫夥伴）
    if (cfg.hasCamera) {
      const cam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.13, 0.12), this.mat('#2d2926'));
      cam.position.set(-0.12, 0.06, 0.26);
      g.add(cam);
    }

    // 揮舞手臂
    const armGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.45, 8);
    const skinMat = this.mat('#ffe3c8');
    if (cfg.waveLeft) {
      const leftArm = new THREE.Mesh(armGeo, skinMat);
      leftArm.position.set(-0.32, 0.55, 0.1);
      leftArm.rotation.z = 0.65;
      g.add(leftArm);
    }
    if (cfg.waveRight) {
      const rightArm = new THREE.Mesh(armGeo, skinMat);
      rightArm.position.set(0.32, 0.58, 0.1);
      rightArm.rotation.z = -0.68;
      g.add(rightArm);
    }
    if (cfg.heartPose) {
      const heart = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), this.mat('#f59e0b'));
      heart.position.set(0, 0.34, 0.28);
      g.add(heart);
    }

    return g;
  }

  /**
   * 建立伴飛迷你熱氣球
   */
  createMiniBalloon(colorA, colorB) {
    const g = new THREE.Group();
    const cols = 8;
    for (let c = 0; c < cols; c++) {
      const slice = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 4, 8, (c / cols) * Math.PI * 2, (Math.PI * 2) / cols),
        this.mat(c % 2 === 0 ? colorA : colorB)
      );
      slice.scale.set(1, 1.18, 1);
      g.add(slice);
    }
    const basket = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.3, 0.38),
      this.mat('#d49b4b')
    );
    basket.position.y = -1.15;
    g.add(basket);
    return g;
  }

  /**
   * 建構 8 大主題遊樂園區微縮建築
   */
  buildAllZoneDioramas() {
    this.zonesData.forEach((zone) => {
      const { x, z } = zone.position;
      switch (zone.id) {
        case 'zone-veggie-diner':
          this.buildVeggieDinerZone(x, z);
          break;
        case 'zone-chinese-feast':
          this.buildChineseFeastZone(x, z);
          break;
        case 'zone-beach-cleanup':
          this.buildBeachCleanupZone(x, z);
          break;
        case 'zone-botanical-garden':
          this.buildBotanicalGardenZone(x, z);
          break;
        case 'zone-emotion-weather':
          this.buildEmotionWeatherZone(x, z);
          break;
        case 'zone-gratitude-post':
          this.buildGratitudePostZone(x, z);
          break;
        case 'zone-chant-stage':
          this.buildChantStageZone(x, z);
          break;
        case 'zone-growth-wheel':
          this.buildGrowthWheelZone(x, z);
          break;
        case 'zone-yacht-marina':
          this.buildYachtMarinaZone(x, z);
          break;
        case 'zone-sky-veggie-portal':
          this.buildSkyVeggiePortalZone(x, z);
          break;
      }
      this.registerHitbox(
        zone.id,
        'zone',
        new THREE.Vector3(x, zone.id === 'zone-sky-veggie-portal' ? 3.2 : 2.4, z),
        4.6,
        zone.id === 'zone-sky-veggie-portal' ? 6.8 : 5.2
      );
    });
  }

  /**
   * Zone 01: 西式蔬食快餐館 (美式復古快餐店 + 巨型蔬食漢堡 + 黃金薯條盒 + 紅傘野餐桌)
   */
  buildVeggieDinerZone(x, z) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.3, 3.2), this.mat('#fff6e6'));
    body.position.set(x, 1.35, z - 0.3);
    body.castShadow = true;
    this.staticRoot.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.45, 3.6), this.mat('#e26345'));
    roof.position.set(x, 2.65, z - 0.3);
    roof.castShadow = true;
    this.staticRoot.add(roof);

    // 紅白條紋遮陽棚
    for (let i = -3; i <= 3; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.18, 1.1),
        this.mat(i % 2 === 0 ? '#e26345' : '#ffffff')
      );
      stripe.position.set(x + i * 0.56, 1.95, z + 1.55);
      stripe.rotation.x = 0.32;
      this.staticRoot.add(stripe);
    }

    // 屋頂巨型玩具蔬食大漢堡 (Bun -> Lettuce -> Tomato -> Veggie Patty -> Top Bun)
    const bx = x - 0.85;
    const bz = z - 0.3;
    const bottomBun = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 0.32, 16), this.mat('#e59a46'));
    bottomBun.position.set(bx, 3.05, bz);
    const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.26, 16), this.mat('#68b645'));
    patty.position.set(bx, 3.32, bz);
    const cheese = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 1.45), this.mat('#f5c73b'));
    cheese.position.set(bx, 3.48, bz);
    cheese.rotation.y = Math.PI / 4;
    const tomato = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.16, 16), this.mat('#e24735'));
    tomato.position.set(bx, 3.6, bz);
    const topBun = new THREE.Mesh(
      new THREE.SphereGeometry(0.96, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      this.mat('#e59a46')
    );
    topBun.position.set(bx, 3.65, bz);
    this.staticRoot.add(bottomBun, patty, cheese, tomato, topBun);
    this.registerTreasureHitbox('egg-03', 1.45, new THREE.Vector3(bx, 3.45, bz), this.dynamicRoot, false);

    // 屋頂黃金薯條盒
    const fryBox = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.05, 0.55), this.mat('#d93829'));
    fryBox.position.set(x + 1.15, 3.35, bz);
    this.staticRoot.add(fryBox);
    for (let f = -2; f <= 2; f++) {
      const fry = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.75, 0.14), this.mat('#f5c73b'));
      fry.position.set(x + 1.15 + f * 0.16, 4.02 + Math.abs(f) * -0.05, bz);
      fry.rotation.z = f * -0.08;
      this.staticRoot.add(fry);
    }

    // 戶外紅傘野餐桌與晶透茶香「映心凍」杯（彩蛋 #04 本體）
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.12, 12), this.mat('#f4e2c6'));
    table.position.set(x + 2.4, 0.85, z + 1.9);
    const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.65, 12), this.mat('#e26345'));
    umbrella.position.set(x + 2.4, 2.05, z + 1.9);
    const teaCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.14, 0.34, 12),
      this.mat('#b7e4c7', { transparent: true, opacity: 0.85, roughness: 0.18 })
    );
    teaCup.position.set(x + 2.4, 1.08, z + 1.9);
    const teaJelly = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.12, 0.2, 10),
      this.mat('#84cc16', { emissive: '#65a30d', emissiveIntensity: 0.35 })
    );
    teaJelly.position.set(x + 2.4, 1.06, z + 1.9);
    this.staticRoot.add(table, umbrella, teaCup, teaJelly);
    this.registerTreasureHitbox('egg-04', 1.0, new THREE.Vector3(x + 2.4, 1.1, z + 1.9), this.dynamicRoot, false);
  }

  /**
   * Zone 02: 中式團圓飯館 (飛簷餐館 + 紅燈籠 + 大圓桌蒸籠與窯烤麵包鍋)
   */
  buildChineseFeastZone(x, z) {
    const hall = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.4, 3.2), this.mat('#f7e8d0'));
    hall.position.set(x, 1.4, z - 0.5);
    hall.castShadow = true;
    this.staticRoot.add(hall);

    // 朱紅柱子
    [-1.8, 1.8].forEach((px) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.4, 10), this.mat('#c83e3b'));
      col.position.set(x + px, 1.4, z + 1.15);
      this.staticRoot.add(col);
    });

    // 中式雙層飛簷屋頂
    const roofLower = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.1, 4), this.mat('#c83e3b'));
    roofLower.position.set(x, 3.0, z - 0.5);
    roofLower.rotation.y = Math.PI / 4;
    roofLower.scale.set(1.15, 1, 0.95);
    const roofUpper = new THREE.Mesh(new THREE.ConeGeometry(2.4, 0.95, 4), this.mat('#d94e34'));
    roofUpper.position.set(x, 3.85, z - 0.5);
    roofUpper.rotation.y = Math.PI / 4;
    this.staticRoot.add(roofLower, roofUpper);

    // 雙紅燈籠
    [-1.2, 1.2].forEach((lx) => {
      const lantern = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 12, 10),
        this.mat('#ff3b2f', { emissive: '#ff4500', emissiveIntensity: 0.7 })
      );
      lantern.position.set(x + lx, 2.15, z + 1.35);
      this.staticRoot.add(lantern);
    });

    // 前庭團圓大圓桌與竹蒸籠、燉麵鍋
    const roundTable = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.16, 18), this.mat('#b8432e'));
    roundTable.position.set(x, 0.92, z + 2.3);
    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 0.8, 12), this.mat('#7a4322'));
    tableBase.position.set(x, 0.5, z + 2.3);
    const steamer1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.25, 12), this.mat('#e3b472'));
    steamer1.position.set(x - 0.35, 1.12, z + 2.2);
    const steamer2 = steamer1.clone();
    steamer2.position.y = 1.38;
    const stewPot = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.32, 12), this.mat('#e26345'));
    stewPot.position.set(x + 0.42, 1.15, z + 2.4);
    this.staticRoot.add(roundTable, tableBase, steamer1, steamer2, stewPot);
    this.registerTreasureHitbox('egg-05', 1.25, new THREE.Vector3(x + 0.05, 1.25, z + 2.3), this.dynamicRoot, false);

    for (let s = 0; s < 6; s++) {
      const sa = (s / 6) * Math.PI * 2;
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.52, 10), this.mat('#d98a4e'));
      stool.position.set(x + Math.cos(sa) * 1.85, 0.36, z + 2.3 + Math.sin(sa) * 1.85);
      this.staticRoot.add(stool);
    }
  }

  /**
   * Zone 03: 陽光淨灘海灣 (金色沙灘、蔚藍海浪、彩色沙灘傘、微笑綠蠵龜母子、淨灘竹簍)
   */
  buildBeachCleanupZone(x, z) {
    // 金色沙灘與碧藍海水灣
    const sandPad = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.6, 0.32, 24), this.mat('#f7dc94'));
    sandPad.position.set(x, 0.18, z);
    const waveCove = new THREE.Mesh(
      new THREE.CylinderGeometry(4.45, 4.55, 0.35, 24, 1, false, -Math.PI * 0.45, Math.PI * 0.9),
      this.mat('#38b6d6')
    );
    waveCove.position.set(x + 0.35, 0.19, z);
    const foam = new THREE.Mesh(
      new THREE.TorusGeometry(2.8, 0.12, 8, 20, Math.PI * 0.85),
      this.mat('#ffffff')
    );
    foam.rotation.x = Math.PI / 2;
    foam.rotation.z = -Math.PI * 0.42;
    foam.position.set(x + 0.2, 0.36, z);
    this.staticRoot.add(sandPad, waveCove, foam);

    // 彩色沙灘大陽傘
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), this.mat('#f8f0d8'));
    pole.position.set(x - 1.2, 1.5, z - 0.8);
    pole.rotation.z = 0.15;
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.65, 0.75, 12), this.mat('#e26345'));
    canopy.position.set(x - 1.4, 2.75, z - 0.8);
    canopy.rotation.z = 0.15;
    this.staticRoot.add(pole, canopy);

    // 微笑綠蠵龜母子雕像
    const turtleShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      this.mat('#4d9e45')
    );
    turtleShell.position.set(x + 1.8, 0.42, z + 1.1);
    const turtleHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), this.mat('#7ac769'));
    turtleHead.position.set(x + 1.2, 0.55, z + 1.1);
    const babyShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      this.mat('#68b645')
    );
    babyShell.position.set(x + 2.4, 0.38, z + 1.8);
    this.staticRoot.add(turtleShell, turtleHead, babyShell);
    this.registerTreasureHitbox('egg-06', 1.35, new THREE.Vector3(x + 1.8, 0.55, z + 1.35), this.dynamicRoot, false);

    // 淨灘分類竹簍
    [-0.4, 0.45].forEach((bx, idx) => {
      const basket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.32, 0.65, 12),
        this.mat(idx === 0 ? '#d49b4b' : '#5aa4d6')
      );
      basket.position.set(x - 0.8 + bx, 0.65, z + 1.5);
      this.staticRoot.add(basket);
    });
  }

  /**
   * Zone 04: 綠意微縮植物園 (圓頂玻璃溫室 + 苔苔不絕水苔球 + 海岸防風林樹苗 + 黃色澆水壺)
   */
  buildBotanicalGardenZone(x, z) {
    // 溫室木石基座與半透明玻璃圓頂
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.4, 1.1, 16), this.mat('#d9b382'));
    base.position.set(x, 0.75, z - 0.4);
    const glassDome = new THREE.Mesh(
      new THREE.SphereGeometry(2.25, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      this.mat('#d4f5e9', { transparent: true, opacity: 0.62, roughness: 0.2 })
    );
    glassDome.position.set(x, 1.3, z - 0.4);
    this.staticRoot.add(base, glassDome);

    // 溫室外部木造花架與「苔苔不絕心意球」水苔球群
    const rack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.6), this.mat('#9c6638'));
    rack.position.set(x + 2.1, 1.0, z + 1.4);
    this.staticRoot.add(rack);

    [-0.6, 0, 0.6].forEach((mx, i) => {
      const mossBall = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), this.mat('#5ca338'));
      mossBall.position.set(x + 2.1 + mx, 1.95, z + 1.4);
      const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 8), this.mat('#95cd4f'));
      sprout.position.set(x + 2.1 + mx, 2.38 + (i % 2) * 0.08, z + 1.4);
      this.staticRoot.add(mossBall, sprout);
    });
    this.registerTreasureHitbox('egg-07', [2.6, 1.9, 1.2], new THREE.Vector3(x + 2.1, 1.7, z + 1.4), this.dynamicRoot, true);

    // 海岸造林小樹苗與黃色玩具澆水壺
    this.addToyTree(x - 2.1, z + 1.3, 0.78, '#68b645');
    this.addToyTree(x - 1.2, z + 2.1, 0.62, '#95cd4f');

    const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.65, 12), this.mat('#f5c73b'));
    canBody.position.set(x + 0.3, 0.58, z + 2.5);
    this.staticRoot.add(canBody);
  }

  /**
   * Zone 05: 情緒氣象觀測屋 (晴雨太陽風向球木屋 + 日式「忍者食堂」情緒辨辨丸屋台)
   */
  buildEmotionWeatherZone(x, z) {
    // 溫暖觀測木屋
    const cabin = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 2.0, 2.2, 12), this.mat('#f5e6cc'));
    cabin.position.set(x - 0.8, 1.3, z - 0.4);
    const cabinRoof = new THREE.Mesh(new THREE.ConeGeometry(2.35, 1.35, 12), this.mat('#5aa4d6'));
    cabinRoof.position.set(x - 0.8, 3.05, z - 0.4);
    this.staticRoot.add(cabin, cabinRoof);

    // 屋頂動態「情緒氣象風向儀」（太陽 + 雲朵 + 雨傘）
    const vaneGroup = new THREE.Group();
    vaneGroup.position.set(x - 0.8, 4.15, z - 0.4);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), this.mat('#a87028'));
    const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), this.mat('#a87028'));
    crossBar.rotation.z = Math.PI / 2;
    crossBar.position.y = 0.35;
    const sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 12, 10),
      this.mat('#f5c73b', { emissive: '#f59e0b', emissiveIntensity: 0.45 })
    );
    sunOrb.position.set(-1.1, 0.35, 0);
    const cloudOrb = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), this.mat('#ffffff'));
    cloudOrb.position.set(1.1, 0.35, 0);
    vaneGroup.add(mast, crossBar, sunOrb, cloudOrb);
    this.dynamicRoot.add(vaneGroup);
    this.animated.weatherVane = vaneGroup;

    // 日式「忍者食堂」屋台與三色「情緒辨辨丸」糰子串
    const stall = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.6, 1.5), this.mat('#d49b4b'));
    stall.position.set(x + 1.85, 1.0, z + 1.4);
    const noren = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.15), this.mat('#e26345'));
    noren.position.set(x + 1.85, 1.9, z + 2.15);
    this.staticRoot.add(stall, noren);

    const dangoColors = ['#95cd4f', '#fffdf7', '#f29cb1'];
    dangoColors.forEach((dc, idx) => {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), this.mat(dc));
      ball.position.set(x + 1.85, 2.35 + idx * 0.48, z + 1.4);
      this.staticRoot.add(ball);
    });
    this.registerTreasureHitbox('egg-09', 1.2, new THREE.Vector3(x + 1.85, 2.8, z + 1.4), this.dynamicRoot, false);
  }

  /**
   * Zone 06: 感恩卡傳郵局 (復古綠郵局 + 紅綠雙郵筒 + 屋頂飛翔翅膀巨型明信片 + 果凍蠟燭桌)
   */
  buildGratitudePostZone(x, z) {
    const postHouse = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.3, 2.9), this.mat('#fbf2e3'));
    postHouse.position.set(x, 1.35, z - 0.3);
    const postRoof = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.3, 4), this.mat('#52a675'));
    postRoof.position.set(x, 3.15, z - 0.3);
    postRoof.rotation.y = Math.PI / 4;
    this.staticRoot.add(postHouse, postRoof);

    // 屋頂飛翔翅膀感恩明信片
    const card = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.15, 0.14), this.mat('#fffdf7'));
    card.position.set(x, 4.15, z - 0.2);
    card.rotation.z = 0.12;
    const stamp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.16), this.mat('#e26345'));
    stamp.position.set(x + 0.55, 4.35, z - 0.2);
    const wingLeft = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.38, 0.1), this.mat('#f5c73b'));
    wingLeft.position.set(x - 1.2, 4.25, z - 0.2);
    wingLeft.rotation.z = 0.35;
    const wingRight = wingLeft.clone();
    wingRight.position.x = x + 1.2;
    wingRight.rotation.z = -0.35;
    this.staticRoot.add(card, stamp, wingLeft, wingRight);
    this.registerTreasureHitbox('egg-10', [3.2, 1.6, 1.1], new THREE.Vector3(x, 4.2, z - 0.2), this.dynamicRoot, true);

    // 經典紅綠雙郵筒
    const redBox = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.35, 12), this.mat('#d93829'));
    redBox.position.set(x - 1.5, 0.9, z + 1.8);
    const greenBox = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.35, 12), this.mat('#3d9960'));
    greenBox.position.set(x - 0.65, 0.9, z + 1.8);
    this.staticRoot.add(redBox, greenBox);

    // 果凍蠟燭手作桌
    const candleTable = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.14, 12), this.mat('#e87a90'));
    candleTable.position.set(x + 1.65, 0.85, z + 1.75);
    const jellyCandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.42, 12),
      this.mat('#ff9eb5', { emissive: '#ff758f', emissiveIntensity: 0.6 })
    );
    jellyCandle.position.set(x + 1.65, 1.12, z + 1.75);
    this.staticRoot.add(candleTable, jellyCandle);
  }

  /**
   * Zone 07: 天空之旅露天音樂台 (金色音符拱門 + 舞台木吉他 + 星光草地懶骨頭座席)
   */
  buildChantStageZone(x, z) {
    const stageBase = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 0.55, 24), this.mat('#e8c391'));
    stageBase.position.set(x, 0.45, z);
    this.staticRoot.add(stageBase);

    // 雙層彩虹音符拱門
    const arch1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.7, 0.2, 10, 24, Math.PI),
      this.mat('#8b73b4')
    );
    arch1.position.set(x, 0.7, z - 0.8);
    const arch2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.16, 10, 24, Math.PI),
      this.mat('#f5c73b', { emissive: '#f59e0b', emissiveIntensity: 0.35 })
    );
    arch2.position.set(x, 0.7, z - 0.5);
    this.staticRoot.add(arch1, arch2);

    // 舞台右側巨型木吉他地標
    const guitarBody1 = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.28, 16), this.mat('#d98236'));
    guitarBody1.rotation.x = Math.PI / 2;
    guitarBody1.position.set(x + 1.2, 1.45, z - 0.1);
    const guitarBody2 = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.28, 16), this.mat('#d98236'));
    guitarBody2.rotation.x = Math.PI / 2;
    guitarBody2.position.set(x + 1.2, 2.25, z - 0.1);
    const guitarNeck = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.5, 0.16), this.mat('#6b4226'));
    guitarNeck.position.set(x + 1.2, 3.1, z - 0.1);
    this.staticRoot.add(guitarBody1, guitarBody2, guitarNeck);
    this.registerTreasureHitbox('egg-11', [1.7, 3.0, 1.1], new THREE.Vector3(x + 1.2, 2.2, z - 0.1), this.dynamicRoot, true);

    // 舞台左側爵士架子鼓組（大鼓 + 雙中鼓 + 小鼓 + 落地鼓 + 金色雙銅鈸與腳踏鈸）
    const dx = x - 1.15;
    const dz = z - 0.05;
    const drumRed = this.mat('#e24735');
    const drumHead = this.mat('#fff8eb');
    const drumStand = this.mat('#cbd5e1', { roughness: 0.35, metalness: 0.65 });
    const cymbalMat = this.mat('#f5c73b', { roughness: 0.25, metalness: 0.65, emissive: '#d97706', emissiveIntensity: 0.25 });

    // 1. 中央大鼓 (Bass Drum)
    const bassShell = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.48, 18), drumRed);
    bassShell.rotation.x = Math.PI / 2;
    bassShell.position.set(dx, 1.28, dz);
    const bassFace = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.52, 18), drumHead);
    bassFace.rotation.x = Math.PI / 2;
    bassFace.position.set(dx, 1.28, dz);
    this.staticRoot.add(bassShell, bassFace);

    // 2. 雙中鼓 (High & Mid Rack Toms)
    [-0.3, 0.3].forEach((tx, idx) => {
      const tomShell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.28, 14),
        idx === 0 ? drumRed : this.mat('#5aa4d6')
      );
      tomShell.position.set(dx + tx, 1.9, dz - 0.06);
      tomShell.rotation.x = 0.38;
      tomShell.rotation.z = tx > 0 ? -0.18 : 0.18;
      const tomTop = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.3, 14), drumHead);
      tomTop.position.copy(tomShell.position);
      tomTop.rotation.copy(tomShell.rotation);
      this.staticRoot.add(tomShell, tomTop);
    });

    // 3. 左側小鼓 (Snare Drum) 與右側落地鼓 (Floor Tom)
    const snareStand = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.65, 8), drumStand);
    snareStand.position.set(dx - 0.68, 1.05, dz + 0.22);
    const snareShell = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 14), this.mat('#f5c73b'));
    snareShell.position.set(dx - 0.68, 1.42, dz + 0.22);
    snareShell.rotation.x = 0.15;
    const snareTop = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.2, 14), drumHead);
    snareTop.position.copy(snareShell.position);
    snareTop.rotation.copy(snareShell.rotation);

    const floorTom = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.52, 14), drumRed);
    floorTom.position.set(dx + 0.68, 1.18, dz + 0.24);
    const floorTomTop = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.54, 14), drumHead);
    floorTomTop.position.copy(floorTom.position);
    this.staticRoot.add(snareStand, snareShell, snareTop, floorTom, floorTomTop);

    // 4. 左右金色銅鈸 (Crash & Ride Cymbals) 與腳踏鈸 (Hi-Hat)
    [
      { cx: -0.88, cy: 2.28, cz: -0.15, r: 0.44, rx: 0.28, rz: 0.22 },
      { cx: 0.86, cy: 2.18, cz: -0.12, r: 0.48, rx: 0.25, rz: -0.22 },
      { cx: -0.96, cy: 1.72, cz: 0.32, r: 0.32, rx: 0.08, rz: 0.08 }
    ].forEach((c) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, c.cy - 0.72, 8), drumStand);
      stand.position.set(dx + c.cx, 0.72 + (c.cy - 0.72) * 0.5, dz + c.cz);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(c.r, c.r + 0.02, 0.035, 16), cymbalMat);
      disc.position.set(dx + c.cx, c.cy, dz + c.cz);
      disc.rotation.set(c.rx, 0, c.rz);
      this.staticRoot.add(stand, disc);
    });

    // 草地聽眾彩色懶骨頭座席
    const seatColors = ['#e26345', '#5aa4d6', '#95cd4f', '#f5c73b'];
    [-1.6, -0.55, 0.55, 1.6].forEach((sx, idx) => {
      const beanbag = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), this.mat(seatColors[idx]));
      beanbag.scale.set(1, 0.65, 1);
      beanbag.position.set(x + sx, 0.42, z + 2.2);
      this.staticRoot.add(beanbag);
    });
  }

  /**
   * Zone 08: 生命領航摩天輪與成長車站 (動態旋轉 8 色摩天輪 + 營隊火車站 + All Pass 糖得來速亭)
   */
  buildGrowthWheelZone(x, z) {
    if (this.carnival) {
      // 使用夜間嘉年華升級版：雙層鋼構桁架、12 座恆垂直平衡吊艙與 72 顆跑馬燈泡
      this.carnival.buildUpgradedFerrisWheel(x, z);
    } else {
      // 備援簡易摩天輪
      [-0.9, 0.9].forEach((side) => {
        const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 5.2, 8), this.mat('#f8f0d8'));
        leg1.position.set(x - 1.1, 2.6, z - 0.6 + side);
        leg1.rotation.z = -0.22;
        const leg2 = leg1.clone();
        leg2.position.x = x + 1.1;
        leg2.rotation.z = 0.22;
        this.staticRoot.add(leg1, leg2);
      });
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(x, 4.8, z - 0.6);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.14, 10, 28), this.mat('#f59e0b'));
      wheelGroup.add(rim);
      this.dynamicRoot.add(wheelGroup);
      this.animated.ferrisWheel = wheelGroup;
    }

    // 旁邊的「期中 All Pass 糖關懷得來速亭」與金色歐趴糖能量禮袋（彩蛋 #12 本體）
    const booth = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.7, 1.5), this.mat('#3b82f6'));
    booth.position.set(x + 2.8, 1.05, z + 1.4);
    const candyRoof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.85, 8), this.mat('#f5c73b'));
    candyRoof.position.set(x + 2.8, 2.3, z + 1.4);
    const candyBag = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.62, 0.42),
      this.mat('#f59e0b', { emissive: '#d97706', emissiveIntensity: 0.25 })
    );
    candyBag.position.set(x + 2.8, 0.65, z + 2.32);
    const candyRibbon = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.46), this.mat('#e26345'));
    candyRibbon.position.set(x + 2.8, 0.72, z + 2.32);
    this.staticRoot.add(booth, candyRoof, candyBag, candyRibbon);
    this.registerTreasureHitbox('egg-12', [2.1, 2.2, 1.8], new THREE.Vector3(x + 2.8, 1.35, z + 1.7), this.dynamicRoot, true);
  }

  /**
   * Zone 09: 全球福青揚帆遊艇碼頭 (紅白條紋海港燈塔 + 延伸木棧碼頭 + 全球航線羅盤 + 雙揚帆遊艇)
   */
  buildYachtMarinaZone(x, z) {
    // 1. 蔚藍海灣停泊水域底盤
    const waterBay = new THREE.Mesh(
      new THREE.CylinderGeometry(4.65, 4.75, 0.24, 24),
      this.mat('#38b6d6', { roughness: 0.3 })
    );
    waterBay.position.set(x - 0.5, 0.16, z + 0.6);
    this.staticRoot.add(waterBay);

    // 2. 延伸出海的溫暖木棧道碼頭與繫船柱
    const pierMain = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.26, 6.2), this.mat('#b57c46'));
    pierMain.position.set(x + 0.2, 0.42, z + 1.2);
    pierMain.rotation.y = -0.28;
    this.staticRoot.add(pierMain);

    for (let i = -2; i <= 2; i++) {
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.95, 8), this.mat('#7a4b24'));
      postL.position.set(x - 0.85 - i * 0.28, 0.45, z + 1.0 + i * 1.05);
      const postR = postL.clone();
      postR.position.x += 1.95;
      this.staticRoot.add(postL, postR);
    }

    // 3. 紅白條紋海港領航燈塔 (象徵全球 61 校福青社彼此照亮)
    const lhX = x + 1.85;
    const lhZ = z - 1.35;
    const lhColors = ['#ffffff', '#e26345', '#ffffff', '#e26345', '#ffffff'];
    lhColors.forEach((col, idx) => {
      const rBottom = 0.92 - idx * 0.1;
      const rTop = 0.82 - idx * 0.1;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, 0.72, 14), this.mat(col));
      seg.position.set(lhX, 0.6 + idx * 0.72, lhZ);
      this.staticRoot.add(seg);
    });

    const lanternRoom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.55, 12),
      this.mat('#fde68a', { emissive: '#f59e0b', emissiveIntensity: 0.95 })
    );
    lanternRoom.position.set(lhX, 4.15, lhZ);
    const lhRoof = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.65, 12), this.mat('#2b8a9e'));
    lhRoof.position.set(lhX, 4.72, lhZ);
    this.staticRoot.add(lanternRoom, lhRoof);

    // 4. 全球航線金色羅盤地標與救生圈
    const compassRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.1, 8, 20),
      this.mat('#f5c73b', { emissive: '#f59e0b', emissiveIntensity: 0.35 })
    );
    compassRing.rotation.x = Math.PI / 2;
    compassRing.position.set(x - 1.4, 0.32, z - 1.5);
    const lifebuoy = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.1, 8, 14), this.mat('#e26345'));
    lifebuoy.position.set(x + 0.95, 0.95, z + 0.3);
    this.staticRoot.add(compassRing, lifebuoy);

    // 5. 兩艘隨波搖曳的玩具風帆遊艇（台灣航線號 & 北美航線號）
    const yachtSpecs = [
      { ox: -1.85, oz: 1.55, hull: '#ffffff', trim: '#2b8a9e', sailA: '#fffdf7', sailB: '#e26345', ry: 0.35, phase: 0 },
      { ox: 1.65, oz: 3.15, hull: '#fff8eb', trim: '#e26345', sailA: '#f5c73b', sailB: '#fffdf7', ry: -0.45, phase: 1.6 }
    ];

    yachtSpecs.forEach((ys) => {
      const yacht = new THREE.Group();
      yacht.position.set(x + ys.ox, 0.36, z + ys.oz);
      yacht.rotation.y = ys.ry;

      const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.45, 0.48, 12), this.mat(ys.hull));
      hull.scale.set(1.75, 1, 0.82);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.36, 0.68), this.mat(ys.trim));
      cabin.position.set(0, 0.36, 0);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.45, 8), this.mat('#8c5a32'));
      mast.position.set(0.1, 1.35, 0);

      // 主帆與前帆
      const mainSail = new THREE.Mesh(new THREE.ConeGeometry(0.82, 1.85, 3), this.mat(ys.sailA));
      mainSail.position.set(-0.22, 1.45, 0);
      mainSail.scale.set(0.95, 1, 0.18);
      const jibSail = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.45, 3), this.mat(ys.sailB));
      jibSail.position.set(0.52, 1.28, 0);
      jibSail.scale.set(0.85, 1, 0.16);

      yacht.add(hull, cabin, mast, mainSail, jibSail);
      yacht.userData = { baseY: 0.36, baseRy: ys.ry, phase: ys.phase };
      this.dynamicRoot.add(yacht);
      this.animated.yachts.push(yacht);
    });
  }

  /**
   * Zone 10: 天空之城・蔬食浮島飛空艇驛站
   * 完美連動姊妹企劃《2026 清大福青社蔬食地圖》：
   * 地面含「清大 75 秒橫式讀秒紅綠燈」與「紫色連帽衫清華胖達」；
   * 空中漂浮「微縮天空之城倒錐浮島」、清大公共藝術「清鏡門」（1/3 比例北京清華校門 × 外嵌包圍玻璃鏡）與「青花菜熱氣球」！
   */
  buildSkyVeggiePortalZone(x, z) {
    // 1. 地面飛空艇登機台與清大校園「75 秒橫式讀秒紅綠燈」彩蛋
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.1, 0.35, 20), this.mat('#e8dcc4'));
    platform.position.set(x, 0.3, z);
    this.staticRoot.add(platform);

    // 清大橫式三色讀秒紅綠燈
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.7, 8), this.mat('#94a3b8'));
    pole.position.set(x - 2.1, 1.55, z + 1.45);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8), this.mat('#94a3b8'));
    arm.rotation.z = Math.PI / 2;
    arm.position.set(x - 1.35, 2.75, z + 1.45);
    const lightBox = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.42, 0.36), this.mat('#1e293b'));
    lightBox.position.set(x - 1.15, 2.75, z + 1.45);
    this.staticRoot.add(pole, arm, lightBox);

    const signalColors = [
      { dx: -0.42, c: '#ef4444' },
      { dx: -0.08, c: '#f59e0b' },
      { dx: 0.26, c: '#22c55e' }
    ];
    signalColors.forEach((sig) => {
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 8),
        this.mat(sig.c, { emissive: sig.c, emissiveIntensity: 0.9 })
      );
      lamp.position.set(x - 1.15 + sig.dx, 2.75, z + 1.62);
      this.staticRoot.add(lamp);
    });

    // 地面吉祥物：身穿清大紫連帽衫（胸前白色 NTHU 立體刺繡、坐姿外八黑腿、正八字黑眼圈）的熊貓「清華胖達」
    this.buildDetailedNthuPanda(x + 1.88, 0.47, z + 1.38, -0.32, 0.82);

    // 4 朵通往空中的幾何切面低多邊形（Faceted Low-Poly）「落腳小雲朵」階梯
    const cloudSteps = [
      { dx: -1.4, dy: 1.4, dz: -0.6, s: 0.45 },
      { dx: 1.35, dy: 2.0, dz: -0.8, s: 0.52 },
      { dx: -0.85, dy: 2.65, dz: 0.7, s: 0.48 },
      { dx: 1.1, dy: 3.1, dz: 0.6, s: 0.42 }
    ];
    cloudSteps.forEach((cs, idx) => {
      const c1 = new THREE.Mesh(
        new THREE.IcosahedronGeometry(cs.s, 1),
        this.mat('#f8fafc', { flatShading: true, roughness: 0.72 })
      );
      c1.scale.set(1.32, 0.72, 1.02);
      c1.rotation.y = idx * 0.6;
      c1.position.set(x + cs.dx, cs.dy, z + cs.dz);
      this.staticRoot.add(c1);
    });

    // 2. 空中漂浮的「微縮天空之城蔬食浮島」動態群組
    const skyGroup = new THREE.Group();
    skyGroup.position.set(x, 3.85, z - 0.2);

    // 倒錐形天空之城岩石底座 + 鼠尾草綠草坪頂蓋（解法 B：幾何切面質感）
    const rockCone = new THREE.Mesh(
      new THREE.ConeGeometry(2.55, 2.2, 11),
      this.mat('#9e744d', { flatShading: true, roughness: 0.82 })
    );
    rockCone.rotation.x = Math.PI;
    rockCone.position.y = -0.85;
    const grassTop = new THREE.Mesh(
      new THREE.CylinderGeometry(2.65, 2.55, 0.36, 16),
      this.mat('#68a34d', { flatShading: true, roughness: 0.78 })
    );
    grassTop.position.y = 0.15;
    skyGroup.add(rockCone, grassTop);

    // 公共藝術「清鏡門」（1/3 比例北京清華二校門 + 外嵌大石框與四格青綠鏡面玻璃牆，往前挪與後方花椰菜氣球錯開）
    const mirrorGateGroup = new THREE.Group();
    mirrorGateGroup.position.set(0.35, 0.32, 0.58);
    mirrorGateGroup.rotation.y = 0.08; // 朝向正前方 Z10 主視角

    // 2A. 外圍厚實灰石框與青綠玻璃鏡牆
    const stoneFrameMat = this.mat('#84888e', { roughness: 0.8 });
    const frameW = 2.96;
    const frameH = 2.15;
    const frameColL = new THREE.Mesh(new THREE.BoxGeometry(0.2, frameH, 0.22), stoneFrameMat);
    frameColL.position.set(-frameW / 2 + 0.1, frameH / 2, -0.12);
    const frameColR = frameColL.clone();
    frameColR.position.x = frameW / 2 - 0.1;
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(frameW, 0.2, 0.22), stoneFrameMat);
    frameTop.position.set(0, frameH + 0.1, -0.12);
    const frameBase = new THREE.Mesh(new THREE.BoxGeometry(frameW + 0.16, 0.1, 0.32), stoneFrameMat);
    frameBase.position.set(0, 0.05, -0.04);
    mirrorGateGroup.add(frameColL, frameColR, frameTop, frameBase);

    // 鏡面玻璃面板（帶有微光反射感的青綠鏡玻璃 + 三條垂直拼接縫）
    const mirrorGlass = new THREE.Mesh(
      new THREE.BoxGeometry(frameW - 0.38, frameH - 0.06, 0.06),
      this.mat('#5d948d', {
        roughness: 0.1,
        metalness: 0.72,
        emissive: '#356660',
        emissiveIntensity: 0.32
      })
    );
    mirrorGlass.position.set(0, frameH / 2 + 0.03, -0.14);
    mirrorGateGroup.add(mirrorGlass);

    [-0.64, 0, 0.64].forEach((sx) => {
      const seam = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, frameH - 0.06, 0.07),
        this.mat('#2f4844')
      );
      seam.position.set(sx, frameH / 2 + 0.03, -0.14);
      mirrorGateGroup.add(seam);
    });

    // 2B. 前方嵌立 1/3 比例巴洛克白色「北京清華二校門」（中空拱門透出後方鏡面）
    const gateWhiteMat = this.mat('#f6f4ee', { roughness: 0.55 });
    const gateTrimMat = this.mat('#e5e0d4', { roughness: 0.6 });

    // 主門左右門墩（留出中央拱洞）
    const mainPierL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.0, 0.24), gateWhiteMat);
    mainPierL.position.set(-0.38, 0.6, 0.04);
    const mainPierR = mainPierL.clone();
    mainPierR.position.x = 0.38;
    mirrorGateGroup.add(mainPierL, mainPierR);

    // 中央半圓拱券與上楣樑
    const centerArch = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.065, 8, 14, Math.PI),
      gateWhiteMat
    );
    centerArch.position.set(0, 0.78, 0.04);
    const centerLintel = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.24, 0.26), gateWhiteMat);
    centerLintel.position.set(0, 1.12, 0.04);
    const mainCornice = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.09, 0.3), gateTrimMat);
    mainCornice.position.set(0, 1.28, 0.04);
    mirrorGateGroup.add(centerArch, centerLintel, mainCornice);

    // 「清華園」黑底金字門匾
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.05), this.mat('#1e293b'));
    plaque.position.set(0, 1.12, 0.17);
    const plaqueGold = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.06, 0.06),
      this.mat('#f5c73b', { emissive: '#f59e0b', emissiveIntensity: 0.35 })
    );
    plaqueGold.position.set(0, 1.12, 0.17);
    mirrorGateGroup.add(plaque, plaqueGold);

    // 中央門柱前方四根羅馬圓柱
    [-0.46, -0.28, 0.28, 0.46].forEach((cx) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.96, 10), gateWhiteMat);
      col.position.set(cx, 0.62, 0.16);
      mirrorGateGroup.add(col);
    });

    // 頂部三階巴洛克女兒牆山頭
    const atticCenter = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.24), gateWhiteMat);
    atticCenter.position.set(0, 1.42, 0.04);
    const atticL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.24), gateWhiteMat);
    atticL.position.set(-0.4, 1.39, 0.04);
    const atticR = atticL.clone();
    atticR.position.x = 0.4;
    mirrorGateGroup.add(atticCenter, atticL, atticR);

    // 左右對稱側翼小拱門與捲渦柱頭
    [-1, 1].forEach((side) => {
      const outerPier = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.62, 0.22), gateWhiteMat);
      outerPier.position.set(side * 0.96, 0.41, 0.04);

      const wingBeam = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.22), gateWhiteMat);
      wingBeam.position.set(side * 0.78, 0.78, 0.04);

      const wingStep = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.2), gateWhiteMat);
      wingStep.position.set(side * 0.66, 0.95, 0.04);

      const scrollCap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 10), gateWhiteMat);
      scrollCap.rotation.x = Math.PI / 2;
      scrollCap.position.set(side * 0.96, 0.88, 0.04);

      mirrorGateGroup.add(outerPier, wingBeam, wingStep, scrollCap);
    });

    // 門前矮綠籬與小紅花點綴（呼應實景花圃）
    [-0.78, 0.78].forEach((hx) => {
      const hedge = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.24), this.mat('#3f7d32'));
      hedge.position.set(hx, 0.18, 0.28);
      mirrorGateGroup.add(hedge);

      [-0.2, 0.15].forEach((fx) => {
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), this.mat('#e26345'));
        flower.position.set(hx + fx, 0.3, 0.31);
        mirrorGateGroup.add(flower);
      });
    });

    skyGroup.add(mirrorGateGroup);
    // 公共藝術「清鏡門」即為彩蛋 #08 本體，跟隨天空之城浮島上下飄浮並支援點擊觸發
    this.registerTreasureHitbox('egg-08', [3.2, 2.5, 1.3], new THREE.Vector3(0, 1.15, 0), mirrorGateGroup, true);

    // 浮島左後方的「青花菜蔬食熱氣球」（往後挪並微抬高，與前方清鏡門完全錯開不重疊；解法 B：切面低多邊形花冠）
    const brocX = -1.45;
    const brocY = 2.85;
    const brocZ = -1.15;
    const brocCrown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.68, 1),
      this.mat('#4d8c40', { flatShading: true, roughness: 0.78 })
    );
    brocCrown.position.set(brocX, brocY, brocZ);
    const brocPuff1 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 1),
      this.mat('#639e4c', { flatShading: true, roughness: 0.78 })
    );
    brocPuff1.position.set(brocX - 0.34, brocY + 0.2, brocZ + 0.18);
    const brocPuff2 = brocPuff1.clone();
    brocPuff2.position.set(brocX + 0.36, brocY + 0.16, brocZ - 0.14);
    const brocBasket = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.32, 10), this.mat('#b57c46'));
    brocBasket.position.set(brocX, brocY - 0.95, brocZ);
    skyGroup.add(brocCrown, brocPuff1, brocPuff2, brocBasket);

    skyGroup.userData = { baseY: 3.85 };
    this.dynamicRoot.add(skyGroup);
    this.animated.miniSkyIsland = skyGroup;
  }

  /**
   * 建構清大吉祥物熊貓「清華胖達」精緻坐姿模型（NTHU 清華紫連帽衫、胸前立體白字刺繡、外八黑腿、正八字黑眼圈）
   */
  buildDetailedNthuPanda(px, py, pz, rotY = -0.32, scale = 0.82) {
    const raw = new THREE.Group();
    raw.position.set(px, py, pz);
    raw.rotation.y = rotY;
    raw.scale.setScalar(scale);

    const matWhiteFur = this.mat('#f6f5f0', { roughness: 0.9, metalness: 0.01 });
    const matBlackFur = this.mat('#1c1d21', { roughness: 0.88, metalness: 0.02 });
    const matHoodie = this.mat('#5f50a3', { roughness: 0.85, metalness: 0.01 });
    const matHoodieRib = this.mat('#554696', { roughness: 0.88, metalness: 0.01 });
    const matLetter = this.mat('#fcfcfa', { roughness: 0.62, metalness: 0.02 });
    const matIris = this.mat('#753d18', { roughness: 0.28, metalness: 0.04 });
    const matPupil = this.mat('#0d0e11', { roughness: 0.12, metalness: 0.06 });
    const matHighlight = this.mat('#ffffff', { roughness: 0.1, emissive: '#ffffff', emissiveIntensity: 0.28 });

    // 1. 坐姿白色絨毛下腹臀部底座 + 背後圓滾滾白色小尾巴
    raw.add(makePandaEllipsoid(1.0, [0.335, 0.195, 0.305], [0, 0.195, -0.01], matWhiteFur, 24));
    raw.add(makePandaEllipsoid(0.072, [1.0, 0.95, 1.05], [0, 0.155, -0.305], matWhiteFur, 14));

    // 2. 坐姿向前外八字伸出的黑色圓胖雙腿與厚實微翹大腳掌
    [-1, 1].forEach((s) => {
      const legNodes = [
        { p: [s * 0.145, 0.135, 0.06], r: 0.116 },
        { p: [s * 0.205, 0.108, 0.21], r: 0.112 },
        { p: [s * 0.255, 0.102, 0.345], r: 0.106 }
      ];
      raw.add(makePandaVariableTube(legNodes, matBlackFur, 18, 14));
      raw.add(
        makePandaEllipsoid(
          0.142,
          [0.9, 1.16, 0.72],
          [s * 0.278, 0.142, 0.415],
          matBlackFur,
          18,
          [-0.24, s * 0.4, -s * 0.08]
        )
      );
    });

    // 3. 清華紫連帽衫主軀幹（LatheGeometry 一體成形 + 下擺羅紋束口）
    const hoodieProfile = [
      new THREE.Vector2(0.001, 0.175),
      new THREE.Vector2(0.315, 0.182),
      new THREE.Vector2(0.356, 0.208),
      new THREE.Vector2(0.345, 0.238),
      new THREE.Vector2(0.364, 0.315),
      new THREE.Vector2(0.354, 0.415),
      new THREE.Vector2(0.322, 0.515),
      new THREE.Vector2(0.262, 0.595),
      new THREE.Vector2(0.16, 0.64),
      new THREE.Vector2(0.001, 0.65)
    ];
    const hoodiePts = new THREE.SplineCurve(hoodieProfile).getPoints(32);
    const hScaleX = 1.07;
    const hScaleZ = 0.94;
    const hoodieMesh = new THREE.Mesh(new THREE.LatheGeometry(hoodiePts, 28), matHoodie);
    hoodieMesh.scale.set(hScaleX, 1.0, hScaleZ);
    raw.add(hoodieMesh);

    const hoodieRadiusAtY = (y) => {
      let best = hoodiePts[0].x;
      let minDiff = Infinity;
      for (const p of hoodiePts) {
        const d = Math.abs(p.y - y);
        if (d < minDiff) {
          minDiff = d;
          best = p.x;
        }
      }
      return best;
    };

    const hoodieFrontZ = (x, y) => {
      const r = hoodieRadiusAtY(y);
      const rx = r * hScaleX;
      const rz = r * hScaleZ;
      const t = 1 - (x / rx) ** 2;
      return t > 0 ? rz * Math.sqrt(t) : 0;
    };

    const hemNodes = [];
    for (let i = 0; i < 20; i++) {
      const ang = (i / 20) * Math.PI * 2;
      const r = 0.35;
      hemNodes.push({
        p: [Math.cos(ang) * r * hScaleX, 0.205, Math.sin(ang) * r * hScaleZ],
        r: 0.022
      });
    }
    raw.add(makePandaVariableTube(hemNodes, matHoodieRib, 28, 10, true));

    // 4. 厚實連帽堆疊領圈與背後連帽帽兜
    const collarNodes = [
      { p: [0.0, 0.578, 0.268], r: 0.068 },
      { p: [0.19, 0.592, 0.195], r: 0.072 },
      { p: [0.29, 0.615, 0.015], r: 0.076 },
      { p: [0.21, 0.64, -0.195], r: 0.08 },
      { p: [0.0, 0.654, -0.262], r: 0.084 },
      { p: [-0.21, 0.64, -0.195], r: 0.08 },
      { p: [-0.29, 0.615, 0.015], r: 0.076 },
      { p: [-0.19, 0.592, 0.195], r: 0.072 }
    ];
    raw.add(makePandaVariableTube(collarNodes, matHoodie, 30, 14, true));

    const hoodCurveNodes = [
      { p: [-0.18, 0.615, -0.225], r: 0.072 },
      { p: [-0.13, 0.51, -0.295], r: 0.098 },
      { p: [0.0, 0.455, -0.32], r: 0.118 },
      { p: [0.13, 0.51, -0.295], r: 0.098 },
      { p: [0.18, 0.615, -0.225], r: 0.072 }
    ];
    raw.add(makePandaVariableTube(hoodCurveNodes, matHoodie, 20, 12));
    raw.add(makePandaEllipsoid(1.0, [0.205, 0.135, 0.095], [0, 0.545, -0.268], matHoodie, 18, [0.25, 0, 0]));

    // 5. 左右微張迎賓的紫色衣袖 + 羅紋折邊袖口 + 黑色絨毛小圓手
    [-1, 1].forEach((s) => {
      const sleeveNodes = [
        { p: [s * 0.215, 0.525, 0.015], r: 0.102 },
        { p: [s * 0.352, 0.495, 0.048], r: 0.11 },
        { p: [s * 0.462, 0.436, 0.092], r: 0.102 },
        { p: [s * 0.542, 0.382, 0.132], r: 0.09 }
      ];
      raw.add(makePandaVariableTube(sleeveNodes, matHoodie, 18, 14));

      const sCurve = new THREE.CatmullRomCurve3(
        sleeveNodes.map((n) => new THREE.Vector3(...n.p)),
        false,
        'catmullrom',
        0.45
      );
      const cuffCenter = sCurve.getPointAt(0.97);
      const sleeveDir = sCurve.getTangentAt(1.0).normalize();
      const refUp = new THREE.Vector3(0, 1, 0);
      const uAxis = new THREE.Vector3().crossVectors(refUp, sleeveDir).normalize();
      const vAxis = new THREE.Vector3().crossVectors(sleeveDir, uAxis).normalize();

      const cuffRingNodes = [];
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        const rad = 0.076;
        const pt = cuffCenter
          .clone()
          .addScaledVector(uAxis, Math.cos(a) * rad)
          .addScaledVector(vAxis, Math.sin(a) * rad);
        cuffRingNodes.push({ p: [pt.x, pt.y, pt.z], r: 0.023 });
      }
      raw.add(makePandaVariableTube(cuffRingNodes, matHoodieRib, 20, 10, true));

      const pawPos = sCurve.getPointAt(1.0).addScaledVector(sleeveDir, 0.048);
      const pawMesh = new THREE.Mesh(new THREE.SphereGeometry(0.082, 16, 14), matBlackFur);
      pawMesh.position.copy(pawPos);
      pawMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sleeveDir);
      pawMesh.scale.set(0.95, 1.08, 0.92);
      raw.add(pawMesh);
    });

    // 6. 胸前立體白色「NTHU」刺繡字樣
    const addEmbroideryStroke = (pts2D, strokeR = 0.0125) => {
      const subPts = [];
      const stepsPerSeg = 4;
      for (let i = 0; i < pts2D.length - 1; i++) {
        const [x0, y0] = pts2D[i];
        const [x1, y1] = pts2D[i + 1];
        const count = i === pts2D.length - 2 ? stepsPerSeg : stepsPerSeg - 1;
        for (let k = 0; k <= count; k++) {
          const f = k / stepsPerSeg;
          const x = x0 + (x1 - x0) * f;
          const y = y0 + (y1 - y0) * f;
          const yCurved = y + x * x * 0.07;
          const z = hoodieFrontZ(x, yCurved) + strokeR * 0.55;
          subPts.push({ p: [x, yCurved, z], r: strokeR });
        }
      }
      raw.add(makePandaVariableTube(subPts, matLetter, Math.max(8, subPts.length * 2), 8));
    };

    const yTop = 0.444;
    const yBot = 0.348;
    const yMid = (yTop + yBot) * 0.5;
    addEmbroideryStroke([[-0.168, yBot], [-0.168, yTop]]);
    addEmbroideryStroke([[-0.168, yTop], [-0.104, yBot]]);
    addEmbroideryStroke([[-0.104, yBot], [-0.104, yTop]]);
    addEmbroideryStroke([[-0.074, yTop], [-0.008, yTop]]);
    addEmbroideryStroke([[-0.041, yTop], [-0.041, yBot]]);
    addEmbroideryStroke([[0.016, yBot], [0.016, yTop]]);
    addEmbroideryStroke([[0.08, yBot], [0.08, yTop]]);
    addEmbroideryStroke([[0.016, yMid], [0.08, yMid]]);

    const uPts = [[0.11, yTop], [0.11, yBot + 0.032]];
    for (let k = 1; k <= 6; k++) {
      const ang = Math.PI + (k / 7) * Math.PI;
      uPts.push([0.142 + Math.cos(ang) * 0.032, yBot + 0.032 + Math.sin(ang) * 0.032]);
    }
    uPts.push([0.174, yBot + 0.032], [0.174, yTop]);
    addEmbroideryStroke(uPts);

    // 7. 飽滿大圓白絨毛頭 + 兩隻圓滾滾黑色大耳朵
    const headCy = 0.878;
    const headCz = 0.02;
    const headRx = 0.394;
    const headRy = 0.338;
    const headRz = 0.348;
    raw.add(makePandaEllipsoid(1.0, [headRx, headRy, headRz], [0, headCy, headCz], matWhiteFur, 28));

    const headFrontZ = (x, y) => {
      const t = 1 - (x / headRx) ** 2 - ((y - headCy) / headRy) ** 2;
      return t > 0 ? headCz + headRz * Math.sqrt(t) : headCz;
    };

    const headNormal = (x, y, z) =>
      new THREE.Vector3(
        x / (headRx * headRx),
        (y - headCy) / (headRy * headRy),
        (z - headCz) / (headRz * headRz)
      ).normalize();

    [-1, 1].forEach((s) => {
      raw.add(
        makePandaEllipsoid(
          0.14,
          [1.04, 1.04, 0.84],
          [s * 0.296, 1.156, -0.012],
          matBlackFur,
          20,
          [0.06, -s * 0.14, -s * 0.45]
        )
      );
    });

    // 8. 球面曲率貼合「正八字 (/ \) 水滴黑眼圈」+ 琥珀棕邊黑眼珠 + 白高光
    const makeConformingEyePatch = (side) => {
      const cx = side * 0.158;
      const cy = 0.876;
      const tiltAngle = 0.5;
      const upX = -side * Math.sin(tiltAngle);
      const upY = Math.cos(tiltAngle);
      const rightX = Math.cos(tiltAngle);
      const rightY = side * Math.sin(tiltAngle);

      const rings = 7;
      const segs = 22;
      const positions = [];
      const indices = [];

      const zCenterBase = headFrontZ(cx, cy);
      const nCenter = headNormal(cx, cy, zCenterBase);
      const liftMax = 0.014;
      positions.push(
        cx + nCenter.x * liftMax,
        cy + nCenter.y * liftMax,
        zCenterBase + nCenter.z * liftMax
      );

      for (let ir = 1; ir <= rings; ir++) {
        const rho = ir / rings;
        const lift = liftMax * Math.cos(rho * Math.PI * 0.5) - 0.003 * rho * rho;

        for (let is = 0; is < segs; is++) {
          const theta = (is / segs) * Math.PI * 2;
          const rawU = Math.cos(theta);
          const rawV = Math.sin(theta);
          const widthFactor = 1.0 - 0.17 * rawV;
          const u = rawU * 0.088 * widthFactor * rho;
          const v = rawV * 0.122 * rho;

          const pX = cx + u * rightX + v * upX;
          const pY = cy + u * rightY + v * upY;
          const pZBase = headFrontZ(pX, pY);
          const nrm = headNormal(pX, pY, pZBase);

          positions.push(pX + nrm.x * lift, pY + nrm.y * lift, pZBase + nrm.z * lift);
        }
      }

      for (let is = 0; is < segs; is++) {
        const next = (is + 1) % segs;
        indices.push(0, 1 + is, 1 + next);
      }

      for (let ir = 1; ir < rings; ir++) {
        const startCurr = 1 + (ir - 1) * segs;
        const startNext = 1 + ir * segs;
        for (let is = 0; is < segs; is++) {
          const next = (is + 1) % segs;
          const a = startCurr + is;
          const b = startNext + is;
          const c = startNext + next;
          const d = startCurr + next;
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return new THREE.Mesh(geo, matBlackFur);
    };

    [-1, 1].forEach((s) => {
      raw.add(makeConformingEyePatch(s));

      const ex = s * 0.128;
      const ey = 0.904;
      const ez = headFrontZ(ex, ey);
      const eNorm = headNormal(ex, ey, ez);

      const irisPos = new THREE.Vector3(ex, ey, ez).addScaledVector(eNorm, 0.011);
      raw.add(
        makePandaEllipsoid(0.033, [1.0, 1.05, 0.65], [irisPos.x, irisPos.y, irisPos.z], matIris, 14, [-0.08, s * 0.32, 0])
      );

      const pupilPos = new THREE.Vector3(ex - s * 0.001, ey + 0.001, ez).addScaledVector(eNorm, 0.019);
      raw.add(
        makePandaEllipsoid(0.028, [1.0, 1.05, 0.68], [pupilPos.x, pupilPos.y, pupilPos.z], matPupil, 14, [-0.08, s * 0.32, 0])
      );

      const hiPos = pupilPos.clone().add(new THREE.Vector3(s * 0.005 + 0.007, 0.01, 0.016));
      raw.add(makePandaEllipsoid(0.008, [1, 1, 0.8], [hiPos.x, hiPos.y, hiPos.z], matHighlight, 10));
    });

    // 9. 立體圓嘟嘟白絨毛吻部 + 亮黑鼻頭 + 垂直縫線小嘴
    const muzCy = 0.79;
    const muzCz = 0.305;
    const muzRx = 0.146;
    const muzRy = 0.112;
    const muzRz = 0.112;
    raw.add(makePandaEllipsoid(1.0, [muzRx, muzRy, muzRz], [0, muzCy, muzCz], matWhiteFur, 20));

    const muzzleFrontZ = (x, y) => {
      const t = 1 - (x / muzRx) ** 2 - ((y - muzCy) / muzRy) ** 2;
      const zM = t > 0 ? muzCz + muzRz * Math.sqrt(t) : -1;
      return Math.max(zM, headFrontZ(x, y));
    };

    const noseY = 0.822;
    const noseZ = muzzleFrontZ(0, noseY) + 0.008;
    raw.add(makePandaEllipsoid(0.03, [1.32, 0.86, 0.82], [0, noseY, noseZ], matPupil, 14, [0.16, 0, 0]));

    const mouthNodes = [];
    for (let i = 0; i <= 6; i++) {
      const f = i / 6;
      const my = 0.802 - f * 0.072;
      const mz = muzzleFrontZ(0, my) + 0.003;
      mouthNodes.push({ p: [0, my, mz], r: 0.0065 });
    }
    raw.add(makePandaVariableTube(mouthNodes, matBlackFur, 12, 8));

    this.staticRoot.add(raw);
  }

  /**
   * 建構環繞中央廣場的「福青希望遊園小火車」
   */
  buildThemeParkTrain() {
    const train = new THREE.Group();

    // 蒸汽火車頭
    const locoBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.85), this.mat('#e26345'));
    locoBase.position.y = 0.42;
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.9, 12), this.mat('#3b2a1e'));
    boiler.rotation.z = Math.PI / 2;
    boiler.position.set(0.2, 0.78, 0);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.72, 0.8), this.mat('#f5c73b'));
    cab.position.set(-0.38, 0.85, 0);
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.45, 8), this.mat('#e26345'));
    chimney.position.set(0.45, 1.18, 0);
    train.add(locoBase, boiler, cab, chimney);

    // 後方兩節彩色車廂
    const car1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.62, 0.78), this.mat('#5aa4d6'));
    car1.position.set(-1.45, 0.52, 0);
    const car2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.62, 0.78), this.mat('#95cd4f'));
    car2.position.set(-2.75, 0.52, 0);
    train.add(car1, car2);

    this.dynamicRoot.add(train);
    this.animated.trainGroup = train;
  }

  /**
   * 建構 12 處可點擊尋寶微縮彩蛋信物
   */
  /**
   * 將隱藏彩蛋直接綁定於 3D 場景真實建築與道具本體（零額外飄浮遮擋物）
   */
  registerTreasureHitbox(treasureId, sizeOrRadius, localPos, parentGroup = this.dynamicRoot, isBox = false) {
    const geo = isBox
      ? new THREE.BoxGeometry(sizeOrRadius[0], sizeOrRadius[1], sizeOrRadius[2])
      : new THREE.SphereGeometry(sizeOrRadius, 10, 8);
    const mat = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(geo, mat);
    hitbox.position.copy(localPos);
    hitbox.userData = {
      interactive: true,
      type: 'treasure',
      targetId: treasureId
    };
    parentGroup.add(hitbox);
    this.interactiveHitboxes.push(hitbox);
    this.treasureMeshes.set(treasureId, hitbox);
    return hitbox;
  }

  /**
   * 彩蛋已全數自然融入既有物件本體，此處保留空鉤子以維持建構流程相容
   */
  buildTreasureMarkers() {}

  /**
   * 標記彩蛋為已收集的視覺狀態（維持本體造型清爽，不加蓋遮擋物）
   */
  markTreasureCollectedVisual(treasureId, collected = true) {
    const hitbox = this.treasureMeshes.get(treasureId);
    if (!hitbox || !collected) return;
    hitbox.userData.collected = true;
  }

  /**
   * 註冊園區或主廣場的透明點擊碰撞盒 (Hitbox)
   */
  registerHitbox(targetId, type, center, radius, height) {
    const geo = new THREE.CylinderGeometry(radius, radius, height, 12);
    const mat = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(geo, mat);
    hitbox.position.copy(center);
    hitbox.userData = { interactive: true, type, targetId };
    this.dynamicRoot.add(hitbox);
    this.interactiveHitboxes.push(hitbox);
  }

  /**
   * 建立 3D 空間投影 DOM 標籤 (使用合成器 translate3d 整數像素定位)
   */
  buildDomLabels() {
    if (!this.labelsLayer) return;
    this.labelsLayer.textContent = '';
    this.labelElements.clear();

    const allTargets = [
      {
        id: this.hubData.id,
        code: 'HUB',
        label: this.hubData.shortName,
        color: this.hubData.color,
        anchor: new THREE.Vector3(0, 12.2, 0)
      },
      ...this.zonesData.map((z) => ({
        id: z.id,
        code: z.code,
        label: z.shortName,
        color: z.color,
        anchor: new THREE.Vector3(
          z.position.x,
          z.id === 'zone-sky-veggie-portal' ? 6.8 : 4.8,
          z.position.z
        )
      }))
    ];

    allTargets.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'zone-label-pin';
      btn.dataset.targetId = item.id;
      btn.style.setProperty('--pin-color', item.color);

      const codeSpan = document.createElement('span');
      codeSpan.className = 'pin-code';
      codeSpan.textContent = item.code;

      const textSpan = document.createElement('span');
      textSpan.textContent = item.label;

      btn.append(codeSpan, textSpan);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onSelectTarget(item.id, item.id === this.hubData.id ? 'hub' : 'zone');
      });

      this.labelsLayer.appendChild(btn);
      this.labelElements.set(item.id, { el: btn, anchor: item.anchor });
    });
  }

  /**
   * 每幀同步 3D 標籤至螢幕座標 (確保先呼叫 camera.updateMatrixWorld() 並使用整數像素 translate3d)
   */
  updateDomLabels() {
    this.camera.updateMatrixWorld();
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const tempV = new THREE.Vector3();

    this.labelElements.forEach(({ el, anchor }) => {
      tempV.copy(anchor);
      tempV.project(this.camera);

      if (tempV.z > 1) {
        el.style.display = 'none';
        return;
      }

      const x = Math.round((tempV.x * 0.5 + 0.5) * w);
      const y = Math.round((-tempV.y * 0.5 + 0.5) * h);

      if (x < -80 || x > w + 80 || y < -50 || y > h + 50) {
        el.style.display = 'none';
        return;
      }

      el.style.display = 'inline-flex';
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    });
  }

  /**
   * 根據篩選結果高亮或淡化標籤
   * @param {Set<string>} visibleIds
   * @param {string} activeId
   * @param {string} featuredId
   */
  syncLabelStates(visibleIds, activeId, featuredId) {
    this.labelElements.forEach(({ el }, id) => {
      const isVisible = id === this.hubData.id || visibleIds.has(id);
      el.style.opacity = isVisible ? '1' : '0.28';
      el.classList.toggle('is-active', id === activeId);
      el.classList.toggle('is-featured', id === featuredId);
    });
  }

  /**
   * 平滑飛行相機至指定園區或主地標
   */
  flyToTarget(targetObj) {
    if (!targetObj) return;
    this.animated.followTrain = false;

    const endPos = new THREE.Vector3(
      targetObj.cameraOffset.x,
      targetObj.cameraOffset.y,
      targetObj.cameraOffset.z
    );
    const endLook = new THREE.Vector3(
      targetObj.lookAtOffset.x,
      targetObj.lookAtOffset.y,
      targetObj.lookAtOffset.z
    );

    if (this.prefersReducedMotion) {
      this.camera.position.copy(endPos);
      this.controls.target.copy(endLook);
      this.controls.update();
      return;
    }

    this.cameraFlight = {
      startPos: this.camera.position.clone(),
      endPos,
      startLook: this.controls.target.clone(),
      endLook,
      elapsed: 0,
      duration: 0.95
    };
  }

  /**
   * 重置回全島鳥瞰視角
   */
  resetOverview() {
    this.animated.followTrain = false;
    this.flyToTarget({
      cameraOffset: { x: 0, y: 21.5, z: 47 },
      lookAtOffset: { x: 0, y: 5.4, z: -1 }
    });
  }

  /**
   * 切換四時段光影（晨曦 dawn / 暖陽 day / 黃昏 dusk / 星光 night）
   */
  setTimeOfDay(mode) {
    this.timeMode = mode;
    const presets = {
      dawn: {
        bg: '#1c466d',
        fog: '#1c466d',
        deepSea: '#173d60',
        hemiSky: '#ffe4e1',
        hemiGround: '#d4a373',
        hemiInt: 0.95,
        sunColor: '#ffb482',
        sunInt: 1.35,
        sunPos: [32, 22, 18],
        nightGlow: 0.5
      },
      day: {
        bg: '#133a5c',
        fog: '#133a5c',
        deepSea: '#133a5c',
        hemiSky: '#fff9eb',
        hemiGround: '#d9a773',
        hemiInt: 1.08,
        sunColor: '#fff2d6',
        sunInt: 1.65,
        sunPos: [28, 42, 24],
        nightGlow: 0.8
      },
      dusk: {
        bg: '#1c3252',
        fog: '#1c3252',
        deepSea: '#182b47',
        hemiSky: '#ffd1a9',
        hemiGround: '#8c583a',
        hemiInt: 0.85,
        sunColor: '#ff7f50',
        sunInt: 1.25,
        sunPos: [-30, 18, 22],
        nightGlow: 1.6
      },
      night: {
        bg: '#081326',
        fog: '#081326',
        deepSea: '#09182e',
        hemiSky: '#5878c8',
        hemiGround: '#1a2335',
        hemiInt: 0.62,
        sunColor: '#93c5fd',
        sunInt: 0.56,
        sunPos: [-20, 35, -18],
        nightGlow: 2.8
      }
    };

    const p = presets[mode] || presets.night;
    this.scene.background.set(p.bg);
    this.scene.fog.color.set(p.fog);
    if (this.deepSeaMat && p.deepSea) {
      this.deepSeaMat.color.set(p.deepSea);
    }
    this.hemiLight.color.set(p.hemiSky);
    this.hemiLight.groundColor.set(p.hemiGround);
    this.hemiLight.intensity = p.hemiInt;
    this.sunLight.color.set(p.sunColor);
    this.sunLight.intensity = p.sunInt;
    this.sunLight.position.set(...p.sunPos);

    this.nightLights.forEach((l) => {
      l.intensity = p.nightGlow;
    });
    if (this.carnival) {
      this.carnival.setTimeOfDay(mode);
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.handleResize());

    // 分頁不可見時暫停時鐘避免大 dt 暴衝
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clock.stop();
      } else {
        this.clock.start();
        this.clock.getDelta();
      }
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      this.pointerDownPos.x = e.clientX;
      this.pointerDownPos.y = e.clientY;
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const rect = this.canvas.getBoundingClientRect();
      this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointerNDC, this.camera);
      const hits = this.raycaster.intersectObjects(this.interactiveHitboxes, false);
      this.canvas.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    });

    this.canvas.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (dist > 6) return; // 拖曳旋轉不觸發點擊

      const rect = this.canvas.getBoundingClientRect();
      this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointerNDC, this.camera);
      const hits = this.raycaster.intersectObjects(this.interactiveHitboxes, false);
      if (hits.length > 0) {
        // 彩蛋點擊優先判定，避免被所屬園區大碰撞盒攔截
        const treasureHit = hits.find((h) => h.object.userData && h.object.userData.type === 'treasure');
        const hit = (treasureHit || hits[0]).object;
        const { type, targetId } = hit.userData;
        if (type === 'treasure') {
          this.onCollectTreasure(targetId);
        } else {
          this.onSelectTarget(targetId, type);
        }
      }
    });
  }

  handleResize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  startLoop() {
    const tick = () => {
      requestAnimationFrame(tick);
      if (document.hidden) return;

      const dt = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.getElapsedTime();

      // 1. 相機平滑飛行插值
      if (this.cameraFlight) {
        this.cameraFlight.elapsed += dt;
        const rawT = Math.min(this.cameraFlight.elapsed / this.cameraFlight.duration, 1);
        const ease = 1 - Math.pow(1 - rawT, 3);
        this.camera.position.lerpVectors(this.cameraFlight.startPos, this.cameraFlight.endPos, ease);
        this.controls.target.lerpVectors(this.cameraFlight.startLook, this.cameraFlight.endLook, ease);
        if (rawT >= 1) this.cameraFlight = null;
      }

      // 2. 動態物件更新（尊重 prefers-reduced-motion）
      if (!this.prefersReducedMotion) {
        if (this.animated.mainBalloon) {
          this.animated.mainBalloon.position.y = 7.6 + Math.sin(elapsed * 1.3) * 0.35;
          this.animated.mainBalloon.rotation.y = Math.sin(elapsed * 0.4) * 0.12;
        }

        this.animated.miniBalloons.forEach((mb) => {
          mb.position.y = mb.userData.baseY + Math.sin(elapsed * 1.6 + mb.userData.phase) * 0.42;
        });

        if (!this.carnival && this.animated.ferrisWheel) {
          this.animated.ferrisWheel.rotation.z = elapsed * 0.32;
        }

        if (this.animated.weatherVane) {
          this.animated.weatherVane.rotation.y = elapsed * 0.85;
        }

        if (this.animated.yachts && this.animated.yachts.length > 0) {
          this.animated.yachts.forEach((yacht) => {
            const p = yacht.userData.phase || 0;
            yacht.position.y = yacht.userData.baseY + Math.sin(elapsed * 2.1 + p) * 0.08;
            yacht.rotation.z = Math.sin(elapsed * 1.7 + p) * 0.06;
            yacht.rotation.x = Math.cos(elapsed * 1.4 + p) * 0.04;
          });
        }

        if (this.animated.miniSkyIsland) {
          this.animated.miniSkyIsland.position.y =
            this.animated.miniSkyIsland.userData.baseY + Math.sin(elapsed * 1.45) * 0.28;
          this.animated.miniSkyIsland.rotation.y = Math.sin(elapsed * 0.35) * 0.14;
        }

        if (this.animated.trainGroup) {
          this.animated.trainAngle += dt * 0.28;
          const r = 11.2;
          const tx = Math.cos(this.animated.trainAngle) * r;
          const tz = Math.sin(this.animated.trainAngle) * r;
          this.animated.trainGroup.position.set(tx, 0.08, tz);
          this.animated.trainGroup.rotation.y = -this.animated.trainAngle - Math.PI / 2;

          if (this.animated.followTrain && !this.cameraFlight) {
            const camAngle = this.animated.trainAngle - 0.48;
            this.camera.position.lerp(
              new THREE.Vector3(Math.cos(camAngle) * 18.5, 6.8, Math.sin(camAngle) * 18.5),
              0.08
            );
            this.controls.target.lerp(new THREE.Vector3(tx, 1.4, tz), 0.12);
          }
        }
      }

      if (this.carnival) {
        this.carnival.update(dt, elapsed, this.prefersReducedMotion);
      }

      this.controls.update();
      this.updateDomLabels();
      this.renderer.render(this.scene, this.camera);
    };

    requestAnimationFrame(tick);
  }
}

  window.bakeStaticGroup = bakeStaticGroup;
  window.BwyIsland3DEngine = BwyIsland3DEngine;
};
