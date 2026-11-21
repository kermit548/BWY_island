/**
 * 清大福青社「在福青社可以學什麼？」3D 夜間嘉年華遊樂園與煙火秀模組
 * (island-carnival.js)
 *
 * 100% 純程式幾何與程序化紋理（零外部圖片／音訊／模型檔）：
 * 1. BwyChaseBulbSystem    : 單一 InstancedMesh 驅動全園數百顆動態跑馬／彩虹追逐燈泡
 * 2. BwyCarnivalUpgrade    :
 *    - 升級 Z08 桁架大摩天輪（雙層鋼構桁架、12 座恆垂直平衡吊艙、72 顆追逐彩燈）
 *    - 旋轉木馬（條紋彩棚、8 匹上下奔馳木馬與跑馬燈）
 *    - 擺盪海盜船（雙 A 字鋼塔、鐘擺物理擺盪木質海盜船與船身彩燈）
 *    - 環島立體雲霄飛車（起伏坡道、傾斜過彎、完整 360° 垂直迴圈、能量守恆變速 4 節列車與軌道追逐燈）
 *    - 嘉年華夜色氛圍（星空穹頂、漂浮薄霧、售票亭、復古路燈、垂墜燈串、遊樂園圍欄、發光小火車軌道與反光水池）
 * 3. BwyFireworksSystem    : 持續循環煙火秀（球形牡丹、雙層光環、垂柳金雨、閃爍裂爆 4 種彈型），
 *                            含上升尾跡、重力下墜淡出、漂移煙霧與 3 盞動態爆閃彩色 PointLight 照亮全園與水面
 */

window.__initBwyCarnivalModule = function (THREE) {
  'use strict';

  function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    grad.addColorStop(0.28, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.62, 'rgba(255,255,255,0.22)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  function createSmokeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
    grad.addColorStop(0.0, 'rgba(220,232,255,0.45)');
    grad.addColorStop(0.45, 'rgba(180,200,235,0.22)');
    grad.addColorStop(1.0, 'rgba(140,165,210,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  /**
   * 單一 InstancedMesh 驅動全園跑馬燈與彩色燈串
   */
  class BwyChaseBulbSystem {
    constructor(scene) {
      this.scene = scene;
      this.bulbs = [];
      this.mesh = null;
      this.dummy = new THREE.Object3D();
      this.tmpPos = new THREE.Vector3();
      this.tmpColor = new THREE.Color();
      this.brightness = 1.0;

      this.palettes = {
        ferris: ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#c77dff', '#ff9f1c'].map((c) => new THREE.Color(c)),
        carousel: ['#ffe082', '#ff8fab', '#fff3c4', '#ffd166', '#ff6b6b'].map((c) => new THREE.Color(c)),
        pirate: ['#ff9f1c', '#ff4d4d', '#ffd166', '#ff6b35'].map((c) => new THREE.Color(c)),
        coaster: ['#38bdf8', '#f472b6', '#facc15', '#34d399', '#a78bfa'].map((c) => new THREE.Color(c)),
        string: ['#ffd875', '#ff9f68', '#7fd8ff', '#ff8fb1', '#a7f375', '#ffe8a3'].map((c) => new THREE.Color(c)),
        train: ['#ffd166', '#ff7b54', '#72efdd'].map((c) => new THREE.Color(c))
      };
    }

    addStaticBulb(pos, group, seq, scale = 1.0) {
      this.bulbs.push({
        isDynamic: false,
        worldPos: pos.clone(),
        group,
        seq,
        scale
      });
    }

    addDynamicBulb(parent, localPos, group, seq, scale = 1.0) {
      this.bulbs.push({
        isDynamic: true,
        parent,
        localPos: localPos.clone(),
        group,
        seq,
        scale
      });
    }

    finalize() {
      if (this.bulbs.length === 0) return;
      const geo = new THREE.SphereGeometry(0.115, 7, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        toneMapped: false
      });
      this.mesh = new THREE.InstancedMesh(geo, mat, this.bulbs.length);
      this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.mesh.frustumCulled = false;

      for (let i = 0; i < this.bulbs.length; i++) {
        const b = this.bulbs[i];
        if (!b.isDynamic) {
          this.dummy.position.copy(b.worldPos);
        } else {
          this.dummy.position.copy(b.localPos);
        }
        this.dummy.scale.setScalar(b.scale);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        this.mesh.setColorAt(i, this.palettes.string[0]);
      }
      this.mesh.instanceMatrix.needsUpdate = true;
      if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
      this.scene.add(this.mesh);
    }

    setBrightness(val) {
      this.brightness = val;
    }

    update(elapsed, reducedMotion = false) {
      if (!this.mesh) return;
      const t = reducedMotion ? 0 : elapsed;
      let matrixDirty = false;

      for (let i = 0; i < this.bulbs.length; i++) {
        const b = this.bulbs[i];
        if (b.isDynamic) {
          this.tmpPos.copy(b.localPos).applyMatrix4(b.parent.matrixWorld);
          this.dummy.position.copy(this.tmpPos);
          this.dummy.scale.setScalar(b.scale);
          this.dummy.updateMatrix();
          this.mesh.setMatrixAt(i, this.dummy.matrix);
          matrixDirty = true;
        }

        const pal = this.palettes[b.group] || this.palettes.string;
        let pulse = 1.0;
        let colorIdx = b.seq % pal.length;

        if (b.group === 'ferris') {
          const wave = Math.floor(t * 4.5);
          colorIdx = (b.seq + wave) % pal.length;
          pulse = 0.52 + 0.48 * Math.pow(0.5 + 0.5 * Math.sin(t * 6.0 - b.seq * 0.55), 2);
        } else if (b.group === 'carousel') {
          const step = Math.floor(t * 5.0);
          colorIdx = (b.seq + Math.floor(t * 1.2)) % pal.length;
          pulse = (b.seq + step) % 3 === 0 ? 1.0 : 0.42;
        } else if (b.group === 'pirate') {
          const swingPulse = 0.55 + 0.45 * Math.sin(t * 5.2 - b.seq * 0.45);
          colorIdx = (b.seq + Math.floor(t * 3.0)) % pal.length;
          pulse = swingPulse;
        } else if (b.group === 'coaster') {
          const chase = 0.5 + 0.5 * Math.sin(t * 9.5 - b.seq * 0.42);
          colorIdx = (Math.floor(b.seq / 3) + Math.floor(t * 2.4)) % pal.length;
          pulse = 0.28 + 0.72 * Math.pow(chase, 3);
        } else {
          pulse = 0.62 + 0.38 * Math.sin(t * 3.2 + b.seq * 0.75);
        }

        const scaleColor = this.brightness * pulse;
        this.tmpColor.copy(pal[colorIdx]).multiplyScalar(scaleColor);
        this.mesh.setColorAt(i, this.tmpColor);
      }

      if (matrixDirty) this.mesh.instanceMatrix.needsUpdate = true;
      if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    }
  }

  /**
   * 持續循環夜間煙火秀引擎（4 種彈型：牡丹、雙環、垂柳金雨、閃爍裂爆 + 煙霧 + 動態照亮場景）
   */
  class BwyFireworksSystem {
    constructor(scene, glowTex, smokeTex) {
      this.scene = scene;
      this.glowTex = glowTex;
      this.smokeTex = smokeTex;
      this.enabled = true;
      this.intensityScale = 1.0;

      this.MAX_PARTICLES = 1850;
      this.particles = [];
      for (let i = 0; i < this.MAX_PARTICLES; i++) {
        this.particles.push({
          active: false,
          x: 0,
          y: -999,
          z: 0,
          vx: 0,
          vy: 0,
          vz: 0,
          r: 1,
          g: 1,
          b: 1,
          age: 0,
          life: 1,
          drag: 0.97,
          gravity: 4.5,
          crackle: false,
          isWillow: false
        });
      }
      this.particleCursor = 0;

      this.positions = new Float32Array(this.MAX_PARTICLES * 3);
      this.colors = new Float32Array(this.MAX_PARTICLES * 3);
      for (let i = 0; i < this.MAX_PARTICLES; i++) {
        this.positions[i * 3 + 1] = -999;
      }

      this.geo = new THREE.BufferGeometry();
      this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
      this.geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

      this.mat = new THREE.PointsMaterial({
        size: 1.48,
        map: this.glowTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.98,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });

      this.points = new THREE.Points(this.geo, this.mat);
      this.points.frustumCulled = false;
      this.scene.add(this.points);

      // 上升火箭清單
      this.rockets = [];
      this.nextLaunchTimer = 0.25;
      this.shellCycle = 0;

      // 爆閃動態彩色 PointLight 池（每次爆開瞬間照亮摩天輪、氣球、海盜船、煙霧與水面）
      this.burstLights = [];
      for (let i = 0; i < 3; i++) {
        const pl = new THREE.PointLight('#ffd166', 0, 82, 1.35);
        pl.position.set(0, -999, 0);
        this.scene.add(pl);
        this.burstLights.push({ light: pl, age: 10, duration: 1.4, peak: 0 });
      }
      this.lightCursor = 0;

      // 煙火爆裂漂浮煙霧池
      this.smokePuffs = [];
      for (let i = 0; i < 12; i++) {
        const smMat = new THREE.SpriteMaterial({
          map: this.smokeTex,
          color: new THREE.Color('#9ab4e8'),
          transparent: true,
          opacity: 0,
          depthWrite: false
        });
        const sp = new THREE.Sprite(smMat);
        sp.position.set(0, -999, 0);
        sp.scale.set(1, 1, 1);
        this.scene.add(sp);
        this.smokePuffs.push({ sprite: sp, age: 10, life: 4.5, vx: 0, vy: 0.45, vz: 0, baseScale: 5 });
      }
      this.smokeCursor = 0;

      this.festivePalettes = [
        ['#ff6b6b', '#ffd166'],
        ['#38bdf8', '#c084fc'],
        ['#fde047', '#fb923c'],
        ['#34d399', '#fef08a'],
        ['#f472b6', '#60a5fa'],
        ['#fff3b0', '#f59e0b']
      ];

      // 預先點燃三發初始煙火於主鏡頭視域內，讓桌機與手機載入瞬間即看見絢麗夜空煙火
      this.spawnBurst(new THREE.Vector3(-10, 16.8, -19), 'peony', this.festivePalettes[0]);
      this.spawnBurst(new THREE.Vector3(10.5, 18.2, -17), 'willow', this.festivePalettes[5]);
      this.spawnBurst(new THREE.Vector3(0.5, 19.5, -24), 'ring', this.festivePalettes[1]);
    }

    setMode(mode) {
      if (mode === 'night') {
        this.enabled = true;
        this.intensityScale = 1.0;
        this.points.visible = true;
      } else if (mode === 'dusk') {
        this.enabled = true;
        this.intensityScale = 0.62;
        this.points.visible = true;
      } else {
        this.enabled = false;
        this.intensityScale = 0.0;
        this.points.visible = false;
        this.burstLights.forEach((b) => {
          b.light.intensity = 0;
        });
        this.smokePuffs.forEach((s) => {
          s.sprite.material.opacity = 0;
        });
      }
    }

    allocParticle() {
      const p = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % this.MAX_PARTICLES;
      return p;
    }

    launchRocket() {
      const launchSites = [
        { x: -17, z: -24 },
        { x: 0, z: -27 },
        { x: 18, z: -23 },
        { x: -25, z: -6 },
        { x: 25, z: -5 }
      ];
      const site = launchSites[Math.floor(Math.random() * launchSites.length)];
      const shellTypes = ['peony', 'ring', 'willow', 'crackle'];
      const shellType = shellTypes[this.shellCycle % shellTypes.length];
      this.shellCycle++;

      const palette = this.festivePalettes[Math.floor(Math.random() * this.festivePalettes.length)];
      const targetY = 15.2 + Math.random() * 7.2;
      const vx = (Math.random() - 0.5) * 3.4;
      const vz = (Math.random() - 0.5) * 3.2;
      const vy = 13.8 + Math.random() * 3.8;

      this.rockets.push({
        x: site.x + (Math.random() - 0.5) * 4,
        y: 1.5,
        z: site.z + (Math.random() - 0.5) * 4,
        vx,
        vy,
        vz,
        targetY,
        shellType,
        palette,
        trailAcc: 0
      });
    }

    spawnBurst(center, shellType, palette) {
      const c1 = new THREE.Color(palette[0]);
      const c2 = new THREE.Color(palette[1]);

      // 1. 觸發動態彩色爆閃光源照亮遊樂園
      const bSlot = this.burstLights[this.lightCursor];
      this.lightCursor = (this.lightCursor + 1) % this.burstLights.length;
      bSlot.light.position.copy(center);
      bSlot.light.color.copy(c1).lerp(c2, 0.35);
      bSlot.age = 0;
      bSlot.duration = shellType === 'willow' ? 1.85 : 1.35;
      bSlot.peak = (shellType === 'willow' ? 24 : 30) * this.intensityScale;
      bSlot.light.intensity = bSlot.peak;

      // 2. 觸發淡彩煙霧雲團
      const sSlot = this.smokePuffs[this.smokeCursor];
      this.smokeCursor = (this.smokeCursor + 1) % this.smokePuffs.length;
      sSlot.sprite.position.copy(center);
      sSlot.sprite.material.color.copy(c1).lerp(new THREE.Color('#c7d7f5'), 0.65);
      sSlot.age = 0;
      sSlot.life = 4.6;
      sSlot.vx = (Math.random() - 0.5) * 0.7;
      sSlot.vy = 0.55 + Math.random() * 0.35;
      sSlot.vz = (Math.random() - 0.5) * 0.5;
      sSlot.baseScale = 4.5 + Math.random() * 2.8;

      // 3. 依彈型噴射火花粒子
      if (shellType === 'ring') {
        const tiltX = (Math.random() - 0.5) * 1.1;
        const tiltZ = (Math.random() - 0.5) * 1.1;
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tiltX, Math.random() * Math.PI, tiltZ));
        const dir = new THREE.Vector3();
        // 外環 64 顆
        for (let i = 0; i < 64; i++) {
          const a = (i / 64) * Math.PI * 2;
          dir.set(Math.cos(a), 0, Math.sin(a)).applyQuaternion(q);
          const speed = 9.2 + Math.random() * 1.2;
          const p = this.allocParticle();
          Object.assign(p, {
            active: true,
            x: center.x,
            y: center.y,
            z: center.z,
            vx: dir.x * speed,
            vy: dir.y * speed,
            vz: dir.z * speed,
            r: c1.r,
            g: c1.g,
            b: c1.b,
            age: 0,
            life: 1.55 + Math.random() * 0.35,
            drag: 0.962,
            gravity: 3.4,
            crackle: false,
            isWillow: false
          });
        }
        // 內核 28 顆對比色
        for (let i = 0; i < 28; i++) {
          const a = (i / 28) * Math.PI * 2;
          dir.set(Math.cos(a), 0, Math.sin(a)).applyQuaternion(q);
          const speed = 4.6 + Math.random() * 0.9;
          const p = this.allocParticle();
          Object.assign(p, {
            active: true,
            x: center.x,
            y: center.y,
            z: center.z,
            vx: dir.x * speed,
            vy: dir.y * speed,
            vz: dir.z * speed,
            r: c2.r,
            g: c2.g,
            b: c2.b,
            age: 0,
            life: 1.3 + Math.random() * 0.3,
            drag: 0.96,
            gravity: 3.2,
            crackle: false,
            isWillow: false
          });
        }
      } else if (shellType === 'willow') {
        const gold = new THREE.Color('#ffdf80');
        const warm = new THREE.Color('#ffae42');
        const count = 95;
        for (let i = 0; i < count; i++) {
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          const speed = 5.5 + Math.random() * 4.8;
          const col = i % 3 === 0 ? warm : gold;
          const p = this.allocParticle();
          Object.assign(p, {
            active: true,
            x: center.x,
            y: center.y,
            z: center.z,
            vx: Math.sin(phi) * Math.cos(theta) * speed,
            vy: Math.cos(phi) * speed + 1.2,
            vz: Math.sin(phi) * Math.sin(theta) * speed,
            r: col.r,
            g: col.g,
            b: col.b,
            age: 0,
            life: 2.35 + Math.random() * 0.65,
            drag: 0.945,
            gravity: 5.4,
            crackle: false,
            isWillow: true
          });
        }
      } else {
        // peony 或 crackle 球形綻放
        const isCrackle = shellType === 'crackle';
        const count = isCrackle ? 82 : 96;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < count; i++) {
          const yDir = 1 - (i / (count - 1)) * 2;
          const rRing = Math.sqrt(Math.max(0, 1 - yDir * yDir));
          const theta = goldenAngle * i;
          const speed = (isCrackle ? 7.8 : 8.6) + (Math.random() - 0.5) * 2.4;
          const col = i % 4 === 0 ? c2 : c1;
          const p = this.allocParticle();
          Object.assign(p, {
            active: true,
            x: center.x,
            y: center.y,
            z: center.z,
            vx: Math.cos(theta) * rRing * speed,
            vy: yDir * speed,
            vz: Math.sin(theta) * rRing * speed,
            r: col.r,
            g: col.g,
            b: col.b,
            age: 0,
            life: (isCrackle ? 1.85 : 1.65) + Math.random() * 0.45,
            drag: 0.96,
            gravity: 4.1,
            crackle: isCrackle,
            isWillow: false
          });
        }
      }
    }

    update(dt, reducedMotion = false) {
      if (!this.enabled || reducedMotion) return;

      // 1. 定期發射新煙火（有時雙發齊放）
      this.nextLaunchTimer -= dt;
      if (this.nextLaunchTimer <= 0) {
        this.launchRocket();
        if (Math.random() < 0.35) this.launchRocket();
        this.nextLaunchTimer = 0.95 + Math.random() * 0.95;
      }

      // 2. 更新上升火箭與尾跡火花
      for (let i = this.rockets.length - 1; i >= 0; i--) {
        const rk = this.rockets[i];
        rk.x += rk.vx * dt;
        rk.y += rk.vy * dt;
        rk.z += rk.vz * dt;
        rk.vy -= 4.2 * dt;
        rk.trailAcc += dt;

        if (rk.trailAcc >= 0.025) {
          rk.trailAcc = 0;
          const tp = this.allocParticle();
          Object.assign(tp, {
            active: true,
            x: rk.x + (Math.random() - 0.5) * 0.15,
            y: rk.y,
            z: rk.z + (Math.random() - 0.5) * 0.15,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -1.4,
            vz: (Math.random() - 0.5) * 0.6,
            r: 1.0,
            g: 0.86,
            b: 0.52,
            age: 0,
            life: 0.38,
            drag: 0.94,
            gravity: 2.5,
            crackle: false,
            isWillow: false
          });
        }

        if (rk.y >= rk.targetY || rk.vy <= 2.2) {
          this.spawnBurst(new THREE.Vector3(rk.x, rk.y, rk.z), rk.shellType, rk.palette);
          this.rockets.splice(i, 1);
        }
      }

      // 3. 更新粒子物理、垂柳殘影與裂爆閃爍
      const dragPow = dt * 60;
      for (let i = 0; i < this.MAX_PARTICLES; i++) {
        const p = this.particles[i];
        const idx3 = i * 3;
        if (!p.active) {
          this.positions[idx3 + 1] = -999;
          continue;
        }

        p.age += dt;
        if (p.age >= p.life) {
          p.active = false;
          this.positions[idx3 + 1] = -999;
          continue;
        }

        const df = Math.pow(p.drag, dragPow);
        p.vx *= df;
        p.vy = p.vy * df - p.gravity * dt;
        p.vz *= df;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        // 垂柳金雨拖曳細小餘燼尾跡
        if (p.isWillow && p.age < p.life * 0.72 && Math.random() < 0.18) {
          const ember = this.allocParticle();
          Object.assign(ember, {
            active: true,
            x: p.x,
            y: p.y,
            z: p.z,
            vx: p.vx * 0.12,
            vy: p.vy * 0.12 - 0.3,
            vz: p.vz * 0.12,
            r: p.r * 0.9,
            g: p.g * 0.78,
            b: p.b * 0.45,
            age: 0,
            life: 0.36,
            drag: 0.92,
            gravity: 1.8,
            crackle: false,
            isWillow: false
          });
        }

        const ratio = p.age / p.life;
        let fade = Math.max(0, 1 - ratio * ratio);
        if (p.crackle && ratio > 0.56) {
          fade *= Math.sin(p.age * 55 + i) > 0.15 ? 1.45 : 0.08;
        }

        const scale = fade * this.intensityScale;
        this.positions[idx3] = p.x;
        this.positions[idx3 + 1] = p.y;
        this.positions[idx3 + 2] = p.z;
        this.colors[idx3] = p.r * scale;
        this.colors[idx3 + 1] = p.g * scale;
        this.colors[idx3 + 2] = p.b * scale;
      }

      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.color.needsUpdate = true;

      // 4. 更新動態爆閃彩色光源衰減
      this.burstLights.forEach((b) => {
        if (b.age < b.duration) {
          b.age += dt;
          const k = Math.max(0, 1 - b.age / b.duration);
          b.light.intensity = b.peak * k * k;
        } else {
          b.light.intensity = 0;
        }
      });

      // 5. 更新煙霧漂移與淡出
      this.smokePuffs.forEach((s) => {
        if (s.age < s.life) {
          s.age += dt;
          const r = s.age / s.life;
          s.sprite.position.x += s.vx * dt;
          s.sprite.position.y += s.vy * dt;
          s.sprite.position.z += s.vz * dt;
          const sc = s.baseScale * (1 + r * 1.45);
          s.sprite.scale.set(sc, sc, 1);
          s.sprite.material.opacity = Math.sin(r * Math.PI) * 0.24 * this.intensityScale;
        } else {
          s.sprite.material.opacity = 0;
        }
      });
    }
  }

  /**
   * 夜間嘉年華升級總管（整合摩天輪升級、旋轉木馬、擺盪海盜船、立體雲霄飛車、路燈燈串、星空反光水池與煙火秀）
   */
  class BwyCarnivalUpgrade {
    constructor(engine) {
      this.engine = engine;
      this.scene = engine.scene;
      this.staticRoot = engine.staticRoot;
      this.dynamicRoot = engine.dynamicRoot;
      this.mat = (hex, opts) => engine.mat(hex, opts);

      this.glowTex = createGlowTexture();
      this.smokeTex = createSmokeTexture();
      this.bulbs = new BwyChaseBulbSystem(this.scene);
      this.fireworks = new BwyFireworksSystem(this.scene, this.glowTex, this.smokeTex);

      this.ferrisWheelGroup = null;
      this.ferrisGondolas = [];
      this.carouselRotor = null;
      this.carouselHorses = [];
      this.piratePivot = null;
      this.coasterData = null;
      this.coasterCars = [];
      this.coasterS = 0;
      this.coasterSpeed = 8.0;

      this.starsPoints = null;
      this.hazeSprites = [];
      this.pondRipple = null;
      this.parkPointLights = [];
      this.npcWalkers = [];
      this.npcGeoPool = null;
      this.npcMatPool = null;
    }

    /**
     * 1. 升級 Z08 為巨型雙層桁架摩天輪（12 座恆垂直平衡吊艙 + 72 顆跑馬彩燈）
     */
    buildUpgradedFerrisWheel(x, z) {
      const wheelZ = z - 0.6;
      const hubY = 5.65;
      const radius = 4.25;
      const steelMat = this.mat('#dbe7f3', { roughness: 0.42, metalness: 0.55 });
      const goldMat = this.mat('#f59e0b', { roughness: 0.35, metalness: 0.45 });
      const darkSteelMat = this.mat('#475569', { roughness: 0.5, metalness: 0.5 });

      // 雙側三角鋼構桁架支撐座（靜態烘焙）
      [-1.08, 1.08].forEach((sideZ) => {
        const legSpreadX = 2.45;
        const footL = new THREE.Vector3(x - legSpreadX, 0.25, wheelZ + sideZ);
        const footR = new THREE.Vector3(x + legSpreadX, 0.25, wheelZ + sideZ);
        const apex = new THREE.Vector3(x, hubY, wheelZ + sideZ);

        this.addStrut(footL, apex, 0.14, steelMat);
        this.addStrut(footR, apex, 0.14, steelMat);

        // 4 層水平橫樑與交叉斜撐桁架
        for (let lv = 1; lv <= 4; lv++) {
          const t = lv / 5;
          const pL = new THREE.Vector3().lerpVectors(footL, apex, t);
          const pR = new THREE.Vector3().lerpVectors(footR, apex, t);
          this.addStrut(pL, pR, 0.065, darkSteelMat);
          if (lv < 4) {
            const tNext = (lv + 1) / 5;
            const nL = new THREE.Vector3().lerpVectors(footL, apex, tNext);
            const nR = new THREE.Vector3().lerpVectors(footR, apex, tNext);
            this.addStrut(pL, nR, 0.045, darkSteelMat);
            this.addStrut(pR, nL, 0.045, darkSteelMat);
          }
        }

        // 基座水泥墩
        [footL, footR].forEach((fp) => {
          const pad = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.65), this.mat('#94a3b8'));
          pad.position.set(fp.x, 0.25, fp.z);
          this.staticRoot.add(pad);
        });
      });

      // 中央貫穿轉軸與輪轂
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 2.55, 14), goldMat);
      axle.rotation.x = Math.PI / 2;
      axle.position.set(x, hubY, wheelZ);
      this.staticRoot.add(axle);

      // 旋轉輪盤動態群組
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(x, hubY, wheelZ);

      // 雙層外環 + 內結構環
      [-0.52, 0.52].forEach((rz) => {
        const outerRim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.11, 10, 36), goldMat);
        outerRim.position.z = rz;
        wheelGroup.add(outerRim);

        const innerRim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.62, 0.07, 8, 28), steelMat);
        innerRim.position.z = rz;
        wheelGroup.add(innerRim);
      });

      // 中央發光星芒輪轂蓋
      [-0.64, 0.64].forEach((hz) => {
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.68, 0.68, 0.16, 16),
          this.mat('#fde68a', { emissive: '#f59e0b', emissiveIntensity: 0.85 })
        );
        cap.rotation.x = Math.PI / 2;
        cap.position.z = hz;
        wheelGroup.add(cap);
      });

      // 12 組雙輻條 + 12 座恆垂直吊艙
      const cabinColors = [
        '#e26345', '#f5c73b', '#38bdf8', '#68b645',
        '#a855f7', '#ec4899', '#14b8a6', '#fb923c',
        '#f43f5e', '#facc15', '#60a5fa', '#4ade80'
      ];
      const gondolaCount = 12;

      for (let i = 0; i < gondolaCount; i++) {
        const a = (i / gondolaCount) * Math.PI * 2;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);

        // 前後雙輻條
        [-0.52, 0.52].forEach((rz) => {
          const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, radius * 2, 6), steelMat);
          spoke.rotation.z = a;
          spoke.position.z = rz;
          wheelGroup.add(spoke);
        });

        // 輻條發光燈泡（每根 2 顆）
        this.bulbs.addDynamicBulb(wheelGroup, new THREE.Vector3(cosA * 2.15, sinA * 2.15, 0.62), 'ferris', i * 2, 0.95);
        this.bulbs.addDynamicBulb(wheelGroup, new THREE.Vector3(cosA * 3.35, sinA * 3.35, 0.62), 'ferris', i * 2 + 1, 0.95);

        // 吊艙橫桿
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.08, 8), darkSteelMat);
        bar.rotation.x = Math.PI / 2;
        bar.position.set(cosA * radius, sinA * radius, 0);
        wheelGroup.add(bar);

        // 恆垂直平衡吊艙群組（在動畫迴圈中反向旋轉 -wheelAngle）
        const pivot = new THREE.Group();
        pivot.position.set(cosA * radius, sinA * radius, 0);

        const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 6), darkSteelMat);
        hanger.position.y = -0.18;
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.24, 10), this.mat('#fff7ed'));
        roof.position.y = -0.4;
        const windowBand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.36, 0.24, 10),
          this.mat('#fef3c7', { emissive: '#fbbf24', emissiveIntensity: 0.78 })
        );
        windowBand.position.y = -0.62;
        const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.28, 0.34, 10), this.mat(cabinColors[i]));
        hull.position.y = -0.88;

        pivot.add(hanger, roof, windowBand, hull);
        wheelGroup.add(pivot);
        this.ferrisGondolas.push(pivot);
      }

      // 外環前後 36 顆跑馬燈泡
      for (let b = 0; b < 36; b++) {
        const a = (b / 36) * Math.PI * 2;
        const bx = Math.cos(a) * radius;
        const by = Math.sin(a) * radius;
        this.bulbs.addDynamicBulb(wheelGroup, new THREE.Vector3(bx, by, 0.64), 'ferris', b, 1.05);
        if (b % 2 === 0) {
          this.bulbs.addDynamicBulb(wheelGroup, new THREE.Vector3(bx, by, -0.64), 'ferris', b, 0.95);
        }
      }

      this.dynamicRoot.add(wheelGroup);
      this.ferrisWheelGroup = wheelGroup;
      this.engine.animated.ferrisWheel = wheelGroup;

      // 摩天輪夜間暖光投射燈
      const fwLight = new THREE.PointLight('#fbbf24', 3.5, 18, 1.5);
      fwLight.position.set(x, hubY, wheelZ + 2.4);
      this.scene.add(fwLight);
      this.parkPointLights.push({ light: fwLight, base: 3.5 });
    }

    /**
     * 2. 新增經典嘉年華旋轉木馬（置於東北偏東空地 (17.4, -9.8)）
     */
    buildCarousel(cx = 17.4, cz = -9.8) {
      const goldMat = this.mat('#f5c73b', { roughness: 0.3, metalness: 0.55 });
      const creamMat = this.mat('#fff8eb');
      const redMat = this.mat('#e24735');

      // 階梯圓形木作平台（靜態烘焙）
      const stepOuter = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.45, 0.26, 24), redMat);
      stepOuter.position.set(cx, 0.14, cz);
      const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.95, 3.05, 0.34, 24), this.mat('#c68642'));
      deck.position.set(cx, 0.38, cz);
      const deckTrim = new THREE.Mesh(new THREE.TorusGeometry(2.96, 0.08, 8, 28), goldMat);
      deckTrim.rotation.x = Math.PI / 2;
      deckTrim.position.set(cx, 0.55, cz);
      this.staticRoot.add(stepOuter, deck, deckTrim);

      // 旋轉轉盤群組（含中央鏡柱、條紋彩棚、8 匹上下奔馳木馬）
      const rotor = new THREE.Group();
      rotor.position.set(cx, 0.55, cz);

      const centerCol = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.72, 2.85, 14),
        this.mat('#fde68a', { roughness: 0.22, metalness: 0.6, emissive: '#d97706', emissiveIntensity: 0.35 })
      );
      centerCol.position.y = 1.42;
      rotor.add(centerCol);

      // 紅白條紋圓錐彩棚（16 片紅白相間扇片）
      const canopyGroup = new THREE.Group();
      canopyGroup.position.y = 2.85;
      const segs = 16;
      const canopyR = 3.25;
      for (let s = 0; s < segs; s++) {
        const a0 = (s / segs) * Math.PI * 2;
        const sliceGeo = new THREE.ConeGeometry(canopyR, 1.45, 2, 1, false, a0, (Math.PI * 2) / segs + 0.02);
        const slice = new THREE.Mesh(sliceGeo, s % 2 === 0 ? redMat : creamMat);
        slice.position.y = 0.72;
        canopyGroup.add(slice);
      }

      // 彩棚簷邊金飾裙擺與頂端星光尖塔
      const valance = new THREE.Mesh(new THREE.CylinderGeometry(canopyR + 0.04, canopyR + 0.04, 0.28, 24), goldMat);
      valance.position.y = -0.05;
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.14, 0.95, 8), goldMat);
      spire.position.y = 1.82;
      const spireOrb = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 10, 8),
        this.mat('#fffbeb', { emissive: '#f59e0b', emissiveIntensity: 1.0 })
      );
      spireOrb.position.y = 2.32;
      canopyGroup.add(valance, spire, spireOrb);
      rotor.add(canopyGroup);

      // 彩棚邊緣 24 顆跑馬燈泡
      for (let b = 0; b < 24; b++) {
        const a = (b / 24) * Math.PI * 2;
        this.bulbs.addDynamicBulb(
          rotor,
          new THREE.Vector3(Math.cos(a) * (canopyR + 0.1), 2.8, Math.sin(a) * (canopyR + 0.1)),
          'carousel',
          b,
          1.0
        );
      }

      // 8 匹上下奔馳的立體木馬與黃銅立桿
      const horseColors = ['#fffdf7', '#f5c73b', '#ff8fab', '#7dd3fc', '#c4b5fd', '#86efac', '#fdba74', '#fca5a5'];
      const saddleColors = ['#e24735', '#2563eb', '#9333ea', '#f59e0b'];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const hx = Math.cos(a) * 2.1;
        const hz = Math.sin(a) * 2.1;

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 2.85, 8), goldMat);
        pole.position.set(hx, 1.42, hz);
        rotor.add(pole);

        const horse = this.createProceduralHorse(horseColors[i], saddleColors[i % saddleColors.length]);
        const baseY = 1.15;
        horse.position.set(hx, baseY, hz);
        horse.rotation.y = -a + Math.PI; // 沿切線奔跑方向
        horse.userData = { baseY, phase: i * (Math.PI * 0.5) };
        rotor.add(horse);
        this.carouselHorses.push(horse);
      }

      this.dynamicRoot.add(rotor);
      this.carouselRotor = rotor;

      const cLight = new THREE.PointLight('#ffd166', 4.2, 16, 1.5);
      cLight.position.set(cx, 3.0, cz);
      this.scene.add(cLight);
      this.parkPointLights.push({ light: cLight, base: 4.2 });
    }

    createProceduralHorse(bodyHex, saddleHex) {
      const g = new THREE.Group();
      const bodyMat = this.mat(bodyHex, { roughness: 0.45 });
      const saddleMat = this.mat(saddleHex, { roughness: 0.5 });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.66), bodyMat);
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.28), saddleMat);
      saddle.position.y = 0.1;

      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.18), bodyMat);
      neck.position.set(0, 0.24, 0.28);
      neck.rotation.x = 0.45;

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.3), bodyMat);
      head.position.set(0, 0.38, 0.42);
      head.rotation.x = 0.3;

      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 6), saddleMat);
      tail.position.set(0, 0.02, -0.4);
      tail.rotation.x = -0.65;

      // 四肢（前腳微抬奔馳姿態）
      const legOffsets = [
        { x: -0.09, y: -0.18, z: 0.24, rx: -0.45 },
        { x: 0.09, y: -0.18, z: 0.24, rx: -0.25 },
        { x: -0.09, y: -0.2, z: -0.24, rx: 0.35 },
        { x: 0.09, y: -0.2, z: -0.24, rx: 0.2 }
      ];
      legOffsets.forEach((lo) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.34, 6), bodyMat);
        leg.position.set(lo.x, lo.y, lo.z);
        leg.rotation.x = lo.rx;
        g.add(leg);
      });

      g.add(torso, saddle, neck, head, tail);
      return g;
    }

    /**
     * 3. 新增鐘擺擺盪海盜船（置於西北偏西空地 (-17.4, -9.8)，與旋轉木馬左右對稱）
     */
    buildPirateShip(px = -17.4, pz = -9.8) {
      const container = new THREE.Group();
      container.position.set(px, 0, pz);
      container.rotation.y = 0.52;

      const towerMat = this.mat('#cbd5e1', { roughness: 0.45, metalness: 0.55 });
      const woodDark = this.mat('#8f5126', { roughness: 0.65 });
      const woodWarm = this.mat('#c2783d', { roughness: 0.58 });
      const goldMat = this.mat('#f5c73b', { roughness: 0.35, metalness: 0.5 });

      // 登船石木底座
      const basePad = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.55, 0.35, 20), this.mat('#e7d8c2'));
      basePad.position.y = 0.18;
      container.add(basePad);

      // 雙 A 字型鋼構支架（pivot 高於 y = 5.4）
      const pivotY = 5.45;
      [-1.05, 1.05].forEach((sz) => {
        [-1.95, 1.95].forEach((sx) => {
          const legLen = Math.hypot(sx, pivotY - 0.3);
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, legLen, 8), towerMat);
          leg.position.set(sx * 0.5, (pivotY + 0.3) * 0.5, sz);
          leg.rotation.z = sx > 0 ? Math.atan2(sx, pivotY - 0.3) : Math.atan2(sx, pivotY - 0.3);
          container.add(leg);
        });
        // 橫向補強樑
        const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), towerMat);
        brace.rotation.z = Math.PI / 2;
        brace.position.set(0, 2.7, sz);
        container.add(brace);
      });

      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.5, 12), goldMat);
      axle.rotation.x = Math.PI / 2;
      axle.position.y = pivotY;
      container.add(axle);

      // 鐘擺擺盪船體群組
      const pivot = new THREE.Group();
      pivot.position.y = pivotY;

      // 雙吊臂
      [-0.65, 0.65].forEach((az) => {
        [-0.55, 0.55].forEach((ax) => {
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 3.9, 8), towerMat);
          arm.position.set(ax * 0.55, -1.92, az);
          arm.rotation.z = ax > 0 ? 0.14 : -0.14;
          pivot.add(arm);
        });
      });

      // 木質海盜船船身（高翹船首與船尾 + 船艙座椅 + 桅杆燈籠）
      const shipY = -3.85;
      const hullMid = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.85, 1.35), woodDark);
      hullMid.position.y = shipY;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.14, 1.42), woodWarm);
      deck.position.y = shipY + 0.44;

      // 船首與船尾上翹高甲板
      [-1, 1].forEach((side) => {
        const prow = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.72, 1.18), woodWarm);
        prow.position.set(side * 2.1, shipY + 0.48, 0);
        prow.rotation.z = side * 0.42;
        const prowTip = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 6), goldMat);
        prowTip.position.set(side * 2.95, shipY + 1.05, 0);
        prowTip.rotation.z = -side * 0.95;
        const lantern = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 8),
          this.mat('#fef08a', { emissive: '#f59e0b', emissiveIntensity: 0.95 })
        );
        lantern.position.set(side * 2.65, shipY + 1.18, 0);
        pivot.add(prow, prowTip, lantern);
      });

      // 中央海盜桅杆與紅色三角旗
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.35, 8), woodWarm);
      mast.position.set(0, shipY + 1.55, 0);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 0.05), this.mat('#dc2626'));
      flag.position.set(0.45, shipY + 2.45, 0);
      pivot.add(hullMid, deck, mast, flag);

      // 船舷兩側共 24 顆追逐燈泡
      for (let i = -5; i <= 5; i++) {
        const bx = i * 0.5;
        const curveY = shipY + 0.55 + Math.pow(Math.abs(i) / 5, 2) * 0.62;
        this.bulbs.addDynamicBulb(pivot, new THREE.Vector3(bx, curveY, 0.75), 'pirate', i + 5, 0.95);
        this.bulbs.addDynamicBulb(pivot, new THREE.Vector3(bx, curveY, -0.75), 'pirate', i + 5, 0.95);
      }

      container.add(pivot);
      this.dynamicRoot.add(container);
      this.piratePivot = pivot;

      const pLight = new THREE.PointLight('#fb923c', 3.4, 15, 1.5);
      pLight.position.set(px, 3.6, pz);
      this.scene.add(pLight);
      this.parkPointLights.push({ light: pLight, base: 3.4 });
    }

    /**
     * 4. 新增環島立體雲霄飛車（起伏坡道、傾斜過彎、完整 360° 垂直迴圈、能量守恆變速 4 節列車與追逐彩燈）
     */
    buildRollerCoaster() {
      // A. 外環非迴圈段平順控制點（順時針／逆時針閉合，完整避開 Z01~Z10 與旋轉木馬、海盜船）
      const loopX0 = 24.0;
      const loopZ0 = 5.8;
      const loopR = 2.85;
      const loopCY = 3.25 + loopR; // 6.1
      const loopShiftX = 0.72;

      const outerWaypoints = [
        new THREE.Vector3(loopX0 + loopShiftX, 3.25, loopZ0 + 3.8), // 離開迴圈（朝 +Z）
        new THREE.Vector3(23.6, 2.2, 16.5),
        new THREE.Vector3(18.2, 1.35, 27.8), // 南側貼海低空掠浪，不遮擋 Z10 / Z01 正面視線
        new THREE.Vector3(0.0, 1.25, 29.8),  // 南海彎道最低點
        new THREE.Vector3(-18.2, 1.35, 27.8), // 越過 Z09 南側海域
        new THREE.Vector3(-23.8, 2.4, 16.5),
        new THREE.Vector3(-24.8, 3.6, 5.2),
        new THREE.Vector3(-24.6, 8.6, -6.5), // 西北高爬坡頂點
        new THREE.Vector3(-19.0, 9.2, -18.2), // 最高主峰
        new THREE.Vector3(-8.2, 4.6, -24.5),  // 北側俯衝谷底
        new THREE.Vector3(0.0, 4.2, -25.4),   // 繞行北側外圍
        new THREE.Vector3(10.8, 7.6, -23.4),  // 東北駝峰
        new THREE.Vector3(20.6, 5.6, -16.6),
        new THREE.Vector3(24.0, 3.45, -5.2),
        new THREE.Vector3(loopX0, 3.25, loopZ0 - 3.8) // 進入迴圈（朝 +Z）
      ];

      const outerCurve = new THREE.CatmullRomCurve3(outerWaypoints, false, 'catmullrom', 0.45);
      const outerSamples = 190;
      const loopSamples = 56;

      // 預採樣閉合軌道點與連續 Up 向量（確保過彎自然側傾、垂直迴圈 360° 零翻轉扭曲）
      const pts = [];
      const ups = [];

      // 1) 外環坡道段
      for (let i = 0; i < outerSamples; i++) {
        const u = i / outerSamples;
        pts.push(outerCurve.getPoint(u));
        ups.push(new THREE.Vector3(0, 1, 0));
      }

      // 2) 360° 螺旋偏移垂直迴圈段（入口在 z=loopZ0 朝 +Z，360° 轉完從 x+loopShiftX 朝 +Z 順出）
      // 先補短短的直線導入段 (loopZ0 - 3.8 -> loopZ0)
      const leadSteps = 6;
      for (let i = 0; i < leadSteps; i++) {
        const f = i / leadSteps;
        pts.push(new THREE.Vector3(loopX0, 3.25, loopZ0 - 3.8 + f * 3.8));
        ups.push(new THREE.Vector3(0, 1, 0));
      }

      const loopStartIdx = pts.length;
      for (let i = 0; i < loopSamples; i++) {
        const frac = i / loopSamples;
        const theta = -Math.PI * 0.5 + frac * Math.PI * 2;
        const x = loopX0 + loopShiftX * frac;
        const y = loopCY + loopR * Math.sin(theta);
        const z = loopZ0 + loopR * Math.cos(theta);
        pts.push(new THREE.Vector3(x, y, z));
        // 迴圈內側法線作為列車頭頂 Up 向量（底部 (0,1,0)，頂部 (0,-1,0) 完美倒立）
        ups.push(new THREE.Vector3(0, -Math.sin(theta), -Math.cos(theta)).normalize());
      }
      const loopEndIdx = pts.length;

      // 短直線導出段 (loopZ0 -> loopZ0 + 3.8)
      for (let i = 0; i < leadSteps; i++) {
        const f = i / leadSteps;
        pts.push(new THREE.Vector3(loopX0 + loopShiftX, 3.25, loopZ0 + f * 3.8));
        ups.push(new THREE.Vector3(0, 1, 0));
      }

      const total = pts.length;
      const tangents = [];
      const rights = [];
      const arcLens = new Float32Array(total + 1);
      arcLens[0] = 0;

      for (let i = 0; i < total; i++) {
        const prev = pts[(i - 1 + total) % total];
        const curr = pts[i];
        const next = pts[(i + 1) % total];
        const tan = new THREE.Vector3().subVectors(next, prev).normalize();
        tangents.push(tan);
        arcLens[i + 1] = arcLens[i] + curr.distanceTo(next);
      }
      const totalLen = arcLens[total];

      // 計算非迴圈段的過彎側傾（Banked Turns）與正交 Right/Up 座標系
      for (let i = 0; i < total; i++) {
        const tan = tangents[i];
        let up = ups[i].clone();

        if (i < loopStartIdx || i >= loopEndIdx) {
          const prevTan = tangents[(i - 2 + total) % total];
          const nextTan = tangents[(i + 2) % total];
          const turnCrossY = prevTan.z * nextTan.x - prevTan.x * nextTan.z; // 水平曲率方向
          const bankAngle = Math.max(-0.46, Math.min(0.46, turnCrossY * 3.2));
          const horizRight = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
          up = new THREE.Vector3(0, 1, 0).applyAxisAngle(tan, bankAngle);
          // 再與 tan 正交化
          const right = new THREE.Vector3().crossVectors(tan, up).normalize();
          up = new THREE.Vector3().crossVectors(right, tan).normalize();
          ups[i] = up;
          rights.push(right);
        } else {
          const right = new THREE.Vector3().crossVectors(tan, up).normalize();
          up = new THREE.Vector3().crossVectors(right, tan).normalize();
          ups[i] = up;
          rights.push(right);
        }
      }

      // B. 建構雙軌鋼管、主龍骨、枕木與立柱支撐架（全部加入 staticRoot 批次烘焙）
      const leftPts = [];
      const rightPts = [];
      const spinePts = [];
      for (let i = 0; i < total; i++) {
        leftPts.push(pts[i].clone().addScaledVector(rights[i], -0.26));
        rightPts.push(pts[i].clone().addScaledVector(rights[i], 0.26));
        spinePts.push(pts[i].clone().addScaledVector(ups[i], -0.22));
      }

      const railMat = this.mat('#f43f5e', { roughness: 0.35, metalness: 0.55 });
      const spineMat = this.mat('#e2e8f0', { roughness: 0.45, metalness: 0.5 });
      const pylonMat = this.mat('#64748b', { roughness: 0.55, metalness: 0.45 });

      const leftTube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftPts, true), 260, 0.065, 6, true),
        railMat
      );
      const rightTube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightPts, true), 260, 0.065, 6, true),
        railMat
      );
      const spineTube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spinePts, true), 260, 0.09, 6, true),
        spineMat
      );
      this.staticRoot.add(leftTube, rightTube, spineTube);

      // 橫向枕木、立柱與軌道跑馬彩燈
      for (let i = 0; i < total; i += 2) {
        const tie = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.1), spineMat);
        tie.position.copy(pts[i]).addScaledVector(ups[i], -0.08);
        const basis = new THREE.Matrix4().makeBasis(rights[i], ups[i], tangents[i]);
        tie.quaternion.setFromRotationMatrix(basis);
        this.staticRoot.add(tie);

        // 沿軌道每 2 步掛一顆追逐燈泡（共約 125 顆）
        const bulbPos = pts[i].clone().addScaledVector(rights[i], i % 4 === 0 ? 0.34 : -0.34);
        this.bulbs.addStaticBulb(bulbPos, 'coaster', Math.floor(i / 2), 0.9);
      }

      // 支撐鋼柱（略過垂直迴圈上半圓弧以呈現懸空迴圈張力）
      for (let i = 0; i < total; i += 8) {
        if (i >= loopStartIdx + 6 && i <= loopEndIdx - 6) continue;
        const p = pts[i];
        const floorY = -1.1;
        const h = p.y - 0.25 - floorY;
        if (h > 0.6) {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, h, 7), pylonMat);
          col.position.set(p.x, floorY + h * 0.5, p.z);
          this.staticRoot.add(col);
        }
      }

      // C. 建構 4 節發光雲霄飛車列車
      const carColors = ['#ff595e', '#ffca3a', '#38bdf8', '#c084fc'];
      for (let c = 0; c < 4; c++) {
        const car = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.66, 0.36, 0.96),
          this.mat(carColors[c], { roughness: 0.3, metalness: 0.35 })
        );
        body.position.y = 0.26;
        const trim = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.08, 0.98),
          this.mat('#fffbeb', { emissive: carColors[c], emissiveIntensity: 0.9 })
        );
        trim.position.y = 0.24;

        // 車內兩名小乘客剪影
        [-0.14, 0.14].forEach((px) => {
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), this.mat('#ffe0bd'));
          head.position.set(px, 0.56, -0.05);
          car.add(head);
        });

        // 車頭雙頭燈
        if (c === 0) {
          [-0.2, 0.2].forEach((hx) => {
            const hl = new THREE.Mesh(
              new THREE.SphereGeometry(0.08, 8, 6),
              this.mat('#ffffff', { emissive: '#fef08a', emissiveIntensity: 1.5 })
            );
            hl.position.set(hx, 0.28, 0.5);
            car.add(hl);
          });
        }

        car.add(body, trim);
        this.dynamicRoot.add(car);
        this.coasterCars.push(car);
      }

      this.coasterData = { pts, tangents, rights, ups, arcLens, total, totalLen };
    }

    sampleCoasterFrame(s) {
      const { pts, tangents, rights, ups, arcLens, total, totalLen } = this.coasterData;
      const wrapped = ((s % totalLen) + totalLen) % totalLen;

      // 二分搜尋弧長索引
      let lo = 0;
      let hi = total - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (arcLens[mid] <= wrapped) lo = mid;
        else hi = mid - 1;
      }
      const nextIdx = (lo + 1) % total;
      const segLen = Math.max(0.0001, arcLens[lo + 1] - arcLens[lo]);
      const f = (wrapped - arcLens[lo]) / segLen;

      const pos = new THREE.Vector3().lerpVectors(pts[lo], pts[nextIdx], f);
      const tan = new THREE.Vector3().lerpVectors(tangents[lo], tangents[nextIdx], f).normalize();
      const up = new THREE.Vector3().lerpVectors(ups[lo], ups[nextIdx], f).normalize();
      const right = new THREE.Vector3().crossVectors(tan, up).normalize();
      up.crossVectors(right, tan).normalize();

      return { pos, tan, right, up };
    }

    /**
     * 5. 建置全園嘉年華夜景細節（星空、漂浮薄霧、售票亭、復古路燈、垂墜燈串、圍欄、發光鐵軌、反光水池）
     */
    buildParkAtmosphere() {
      // A. 星空穹頂（950 顆繁星）
      const starCount = 950;
      const starPos = new Float32Array(starCount * 3);
      const starCol = new Float32Array(starCount * 3);
      const starPalette = [
        new THREE.Color('#ffffff'),
        new THREE.Color('#dbeafe'),
        new THREE.Color('#fef3c7'),
        new THREE.Color('#bfdbfe')
      ];
      for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(0.08 + Math.random() * 0.92); // 上半球
        const r = 125 + Math.random() * 55;
        starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPos[i * 3 + 1] = r * Math.cos(phi) + 4;
        starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        const col = starPalette[i % starPalette.length];
        const lum = 0.55 + Math.random() * 0.45;
        starCol[i * 3] = col.r * lum;
        starCol[i * 3 + 1] = col.g * lum;
        starCol[i * 3 + 2] = col.b * lum;
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
      const starMat = new THREE.PointsMaterial({
        size: 1.55,
        map: this.glowTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.starsPoints = new THREE.Points(starGeo, starMat);
      this.scene.add(this.starsPoints);

      // B. 高空淡藍漂浮夜霧（10 朵超柔和薄霧）
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const smMat = new THREE.SpriteMaterial({
          map: this.smokeTex,
          color: new THREE.Color('#64748b'),
          transparent: true,
          opacity: 0.11,
          depthWrite: false
        });
        const sp = new THREE.Sprite(smMat);
        const r = 18 + (i % 3) * 11;
        sp.position.set(Math.cos(a) * r, 15 + (i % 4) * 3.5, Math.sin(a) * r);
        sp.scale.set(22, 11, 1);
        this.scene.add(sp);
        this.hazeSprites.push({ sprite: sp, baseAngle: a, radius: r, speed: 0.014 + (i % 3) * 0.005 });
      }

      // C. 中央廣場入口「嘉年華售票亭」（位於 (-3.2, 0, 5.6)，與右側 egg-02 立牌對稱呼應）
      const tbX = -3.2;
      const tbZ = 5.6;
      const boothBody = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.75, 1.25), this.mat('#fff7ed'));
      boothBody.position.set(tbX, 0.98, tbZ);
      boothBody.rotation.y = 0.25;
      const boothWin = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 0.65, 1.28),
        this.mat('#fef3c7', { emissive: '#fbbf24', emissiveIntensity: 0.85 })
      );
      boothWin.position.set(tbX, 1.18, tbZ);
      boothWin.rotation.y = 0.25;
      const boothRoof = new THREE.Mesh(new THREE.ConeGeometry(1.12, 0.78, 8), this.mat('#e24735'));
      boothRoof.position.set(tbX, 2.25, tbZ);
      this.staticRoot.add(boothBody, boothWin, boothRoof);
      this.bulbs.addStaticBulb(new THREE.Vector3(tbX, 2.68, tbZ), 'string', 0, 1.05);

      // D. 迎賓拱門彩色跑馬燈串（沿拱門上橫樑 (0, 3.28, 5.8) 佈燈）
      for (let i = -5; i <= 5; i++) {
        this.bulbs.addStaticBulb(new THREE.Vector3(i * 0.4, 3.26, 5.8), 'string', i + 5, 1.0);
        this.bulbs.addStaticBulb(new THREE.Vector3(i * 0.4, 2.58, 6.06), 'string', i + 12, 0.9);
      }

      // E. 復古鐵藝路燈（中央廣場 8 盞 + 外環 8 盞）與廣場垂墜彩色燈串
      const lampMat = this.mat('#334155', { roughness: 0.5, metalness: 0.55 });
      const globeMat = this.mat('#fffbeb', { emissive: '#fde047', emissiveIntensity: 1.1 });
      const plazaLampTops = [];

      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const lx = Math.cos(a) * 7.35;
        const lz = Math.sin(a) * 7.35;
        this.addLampPost(lx, lz, 2.75, lampMat, globeMat);
        plazaLampTops.push(new THREE.Vector3(lx, 2.55, lz));
      }

      // 環繞廣場路燈之間的垂墜燈串（Catenary String Lights）
      let bulbSeq = 0;
      const wireMat = this.mat('#1e293b');
      for (let i = 0; i < plazaLampTops.length; i++) {
        const pA = plazaLampTops[i];
        const pB = plazaLampTops[(i + 1) % plazaLampTops.length];
        const segPts = [];
        const steps = 6;
        for (let k = 0; k <= steps; k++) {
          const f = k / steps;
          const pt = new THREE.Vector3().lerpVectors(pA, pB, f);
          pt.y -= Math.sin(f * Math.PI) * 0.45; // 自然垂墜弧度
          segPts.push(pt);
          if (k > 0 && k < steps) {
            this.bulbs.addStaticBulb(pt, 'string', bulbSeq++, 0.92);
          }
        }
        const wire = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(segPts), 12, 0.018, 4, false),
          wireMat
        );
        this.staticRoot.add(wire);
      }

      // 外環步道 8 盞復古路燈
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.32;
        const lx = Math.cos(a) * 14.2;
        const lz = Math.sin(a) * 14.2;
        this.addLampPost(lx, lz, 2.6, lampMat, globeMat);
      }

      // 4 盞廣場柔和暖光 PointLight + 1 盞中央熱氣球夜間燃燒器暖光燈（營造夜間光雕熱氣球效果）
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const pl = new THREE.PointLight('#ffd27d', 2.8, 17, 1.6);
        pl.position.set(Math.cos(a) * 7.6, 3.0, Math.sin(a) * 7.6);
        this.scene.add(pl);
        this.parkPointLights.push({ light: pl, base: 2.8 });
      }
      const burnerLight = new THREE.PointLight('#ffb347', 6.5, 22, 1.45);
      burnerLight.position.set(0, 5.2, 2.2);
      this.scene.add(burnerLight);
      this.parkPointLights.push({ light: burnerLight, base: 6.5 });

      // F. 島嶼外緣白色遊樂園木圍欄（沿半徑 25.0 環繞）
      const fenceMat = this.mat('#f8fafc', { roughness: 0.65 });
      const postCount = 64;
      for (let i = 0; i < postCount; i++) {
        const a = (i / postCount) * Math.PI * 2;
        // 避開南側 Z09/Z10 碼頭開口處
        const fx = Math.cos(a) * 25.1;
        const fz = Math.sin(a) * 25.1;
        if (fz > 17.5 && Math.abs(fx) < 16.5) continue;

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.72, 6), fenceMat);
        post.position.set(fx, 0.42, fz);
        this.staticRoot.add(post);

        const nextA = ((i + 1) / postCount) * Math.PI * 2;
        const nx = Math.cos(nextA) * 25.1;
        const nz = Math.sin(nextA) * 25.1;
        if (!(nz > 17.5 && Math.abs(nx) < 16.5)) {
          this.addStrut(new THREE.Vector3(fx, 0.58, fz), new THREE.Vector3(nx, 0.58, nz), 0.035, fenceMat);
          this.addStrut(new THREE.Vector3(fx, 0.34, fz), new THREE.Vector3(nx, 0.34, nz), 0.03, fenceMat);
        }
      }

      // G. 環島遊園小火車雙鋼軌與發光跑馬燈（半徑 11.2）
      const railMetal = this.mat('#cbd5e1', { roughness: 0.35, metalness: 0.65 });
      [10.88, 11.52].forEach((rr) => {
        const rail = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.045, 6, 84), railMetal);
        rail.rotation.x = Math.PI / 2;
        rail.position.y = 0.16;
        this.staticRoot.add(rail);
      });
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        this.bulbs.addStaticBulb(new THREE.Vector3(Math.cos(a) * 11.82, 0.24, Math.sin(a) * 11.82), 'train', i, 0.78);
      }
    }

    /**
     * 6. 配置 15 位隨機移動的校園同學 + 5 位具備高辨識度的講師（參考 island-dynmic_npc.js）
     */
    getIslandSurfaceY(x, z) {
      const r = Math.hypot(x, z);
      if (r < 7.25) return 0.225;
      const zones = this.engine.zonesData || [];
      for (let i = 0; i < zones.length; i++) {
        const zp = zones[i].position;
        if (zp && zp.z < 20.5 && Math.hypot(x - zp.x, z - zp.z) < 4.65) {
          return 0.245;
        }
      }
      return 0.13;
    }

    initNpcPools() {
      if (this.npcGeoPool) return;
      const legGeo = new THREE.CylinderGeometry(0.06, 0.055, 0.42, 8);
      legGeo.translate(0, -0.21, 0);
      const armGeo = new THREE.CylinderGeometry(0.048, 0.044, 0.36, 8);
      armGeo.translate(0, -0.18, 0);
      const shadowGeo = new THREE.CircleGeometry(0.28, 16);
      shadowGeo.rotateX(-Math.PI / 2);

      this.npcGeoPool = {
        leg: legGeo,
        arm: armGeo,
        torsoStudent: new THREE.CylinderGeometry(0.14, 0.165, 0.46, 12),
        torsoInstructor: new THREE.CylinderGeometry(0.155, 0.215, 0.54, 12),
        head: new THREE.SphereGeometry(0.135, 12, 10),
        hairCap: new THREE.SphereGeometry(0.142, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.56),
        glassesBridge: new THREE.BoxGeometry(0.18, 0.03, 0.04),
        folder: new THREE.BoxGeometry(0.04, 0.22, 0.17),
        shadow: shadowGeo
      };

      const shirtPalette = [
        0xe06a5f, 0xf2b857, 0x56a3a6, 0x7cb518,
        0x6c8dfa, 0xd972ff, 0xf78c6b, 0x3b8ea5,
        0xec4899, 0x14b8a6, 0xa855f7, 0xf59e0b
      ];
      const coatPalette = [
        0x152844, // 學院深海軍藍
        0x6a1b29, // 勃根地酒紅
        0x283618, // 森林墨綠
        0x3c1642, // 典雅深紫
        0x1f3a3d  // 沉穩黛青
      ];
      const hairPalette = [0x231b16, 0x3d281d, 0x1a1a1a, 0x4d3423];

      this.npcMatPool = {
        skin: new THREE.MeshStandardMaterial({ color: 0xf4ccb0, roughness: 0.72 }),
        pantsStudent: new THREE.MeshStandardMaterial({ color: 0x303c52, roughness: 0.85 }),
        pantsInstructor: new THREE.MeshStandardMaterial({ color: 0x1c212b, roughness: 0.85 }),
        glasses: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.25, metalness: 0.65 }),
        folder: new THREE.MeshStandardMaterial({ color: 0xf6c945, roughness: 0.55 }),
        shadow: new THREE.MeshBasicMaterial({ color: 0x0b1710, transparent: true, opacity: 0.24, depthWrite: false }),
        shirts: shirtPalette.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.74 })),
        coats: coatPalette.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.68 })),
        hairs: hairPalette.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.82 }))
      };
    }

    createCampusAvatar(isInstructor, colorIndex) {
      this.initNpcPools();
      const G = this.npcGeoPool;
      const M = this.npcMatPool;

      const root = new THREE.Group();
      root.scale.setScalar(isInstructor ? 1.12 : 0.96);

      const shadow = new THREE.Mesh(G.shadow, M.shadow);
      shadow.position.y = 0.015;
      root.add(shadow);

      const body = new THREE.Group();
      root.add(body);

      const pantsMat = isInstructor ? M.pantsInstructor : M.pantsStudent;
      const legL = new THREE.Mesh(G.leg, pantsMat);
      legL.position.set(-0.075, 0.42, 0);
      legL.castShadow = true;
      const legR = new THREE.Mesh(G.leg, pantsMat);
      legR.position.set(0.075, 0.42, 0);
      legR.castShadow = true;
      body.add(legL, legR);

      const topMat = isInstructor
        ? M.coats[colorIndex % M.coats.length]
        : M.shirts[colorIndex % M.shirts.length];
      const torso = new THREE.Mesh(isInstructor ? G.torsoInstructor : G.torsoStudent, topMat);
      torso.position.y = isInstructor ? 0.63 : 0.65;
      torso.castShadow = true;
      body.add(torso);

      const armL = new THREE.Mesh(G.arm, topMat);
      armL.position.set(-0.205, 0.84, 0);
      armL.castShadow = true;
      const armR = new THREE.Mesh(G.arm, topMat);
      armR.position.set(0.205, 0.84, 0);
      armR.castShadow = true;
      body.add(armL, armR);

      const head = new THREE.Mesh(G.head, M.skin);
      head.position.y = 1.02;
      head.castShadow = true;
      body.add(head);

      const hair = new THREE.Mesh(G.hairCap, M.hairs[colorIndex % M.hairs.length]);
      hair.position.y = 1.03;
      hair.rotation.x = -0.14;
      body.add(hair);

      if (isInstructor) {
        const glasses = new THREE.Mesh(G.glassesBridge, M.glasses);
        glasses.position.set(0, 1.02, 0.125);
        body.add(glasses);

        const folder = new THREE.Mesh(G.folder, M.folder);
        folder.position.set(0.05, -0.28, 0.06);
        folder.rotation.x = 0.25;
        armR.add(folder);
      }

      return { root, body, legL, legR, armL, armR, isInstructor };
    }

    buildParkNPCs() {
      // 15 位隨機移動校園同學巡邏路徑（涵蓋中央廣場、內環草坪步道、各學習區前庭）
      const studentCircuits = [
        // 1-4: 中央廣場環形漫步
        [[0.0, 4.4], [3.6, 3.4], [4.6, 0.0], [3.2, -3.5], [0.0, -4.6], [-3.5, -3.2], [-4.6, 0.2], [-3.2, 3.6]],
        [[4.8, 1.4], [2.4, 4.7], [-2.1, 4.8], [-4.9, 1.6], [-4.2, -2.8], [-0.8, -5.0], [3.4, -3.8]],
        [[-2.4, 3.2], [2.5, 3.2], [3.8, -0.6], [1.6, -3.8], [-2.2, -3.6], [-3.9, -0.4]],
        [[1.5, -4.4], [-3.2, -3.4], [-4.8, 0.8], [-2.0, 4.4], [2.8, 4.1], [4.7, -0.5]],
        // 5-9: 內環草坪與鵝卵石步道漫步 (r ≈ 7.8~10.2)
        [[0.0, 8.6], [6.2, 6.2], [8.8, 0.0], [6.2, -6.2], [0.0, -8.6], [-6.2, -6.2], [-8.8, 0.0], [-6.2, 6.2]],
        [[8.2, 3.5], [3.5, 8.2], [-3.5, 8.2], [-8.2, 3.5], [-8.2, -3.5], [-3.5, -8.2], [3.5, -8.2], [8.2, -3.5]],
        [[-6.8, 6.0], [0.0, 9.4], [6.8, 6.0], [9.4, -1.0], [5.8, -7.4], [-5.8, -7.4], [-9.4, -1.0]],
        [[5.4, 7.6], [9.2, 2.2], [7.8, -5.2], [1.4, -9.2], [-6.6, -6.6], [-9.2, 1.2], [-4.6, 8.0]],
        [[-1.8, 9.2], [-7.8, 5.2], [-9.0, -2.6], [-4.2, -8.4], [4.2, -8.4], [9.0, -2.6], [7.8, 5.2]],
        // 10-15: 外環各園區前庭串聯巡禮 (r ≈ 12.6~15.5)
        [[0.0, 13.4], [9.8, 9.2], [13.6, -0.8], [8.8, -10.8], [0.0, -13.4], [-8.8, -10.8], [-13.6, -0.8], [-9.8, 9.2]],
        [[10.6, 8.2], [14.0, -1.2], [9.4, -11.2], [-1.2, -13.8], [-9.6, -11.0], [-14.0, -1.0], [-10.4, 8.2], [0.0, 13.8]],
        [[-1.8, 14.4], [3.2, 14.2], [9.6, 9.4], [4.2, 6.2], [-4.2, 6.2], [-9.6, 9.4]],
        [[10.8, 7.2], [13.8, -1.0], [8.6, -6.5], [5.2, 3.8]],
        [[8.2, -11.2], [0.0, -13.8], [-8.2, -11.2], [-4.4, -6.4], [4.4, -6.4]],
        [[-13.6, -1.2], [-10.4, 7.8], [-5.5, 4.8], [-6.2, -4.6]]
      ];

      // 5 位高辨識度講師巡講路線（穿梭於中央廣場與 Z10、Z02~Z08 各學習站之間）
      const instructorCircuits = [
        // 講師 1 (深海軍藍大衣)：中央廣場 <-> Z10 天空蔬食驛站 (0, 17.5) <-> Z02 歲末溫馨團圓宴 (14.5, 10.5)
        [[0.0, 5.2], [0.0, 13.8], [5.8, 12.2], [10.8, 8.4], [5.2, 4.5]],
        // 講師 2 (勃根地酒紅大衣)：Z02 (14.5, 10.5) <-> Z03 蔚藍海岸行動灣 (18, -1.5) <-> Z04 心靈植栽溫室 (11.5, -15)
        [[10.6, 7.8], [13.8, -1.0], [9.2, -11.2], [4.8, -5.8], [6.2, 2.5]],
        // 講師 3 (森林墨綠大衣)：Z04 (11.5, -15) <-> Z05 情緒氣象屋 (0, -17.5) <-> Z06 傳心感恩郵局 (-11.5, -15)
        [[8.4, -11.2], [0.0, -13.8], [-8.4, -11.2], [-4.2, -5.6], [4.2, -5.6]],
        // 講師 4 (典雅深紫大衣)：Z06 (-11.5, -15) <-> Z07 讚頌星光音樂台 (-18, -1.5) <-> Z08 領航摩天輪 (-14.5, 10.5)
        [[-8.8, -11.0], [-13.8, -1.0], [-10.6, 7.8], [-5.8, 2.4], [-4.8, -5.6]],
        // 講師 5 (沉穩黛青大衣)：Z08 (-14.5, 10.5) <-> Z10 天空蔬食驛站 (0, 17.5) <-> 中央廣場
        [[-10.4, 8.2], [-4.8, 12.6], [0.0, 13.8], [0.0, 5.6], [-5.2, 4.4]]
      ];

      const spawnWalker = (pts, isInstructor, idx) => {
        const avatar = this.createCampusAvatar(isInstructor, idx);
        const waypoints = pts.map((p) => new THREE.Vector3(p[0], 0, p[1]));
        const startIdx = idx % waypoints.length;
        const nextIdx = (startIdx + 1) % waypoints.length;
        const p0 = waypoints[startIdx];
        const y0 = this.getIslandSurfaceY(p0.x, p0.z);
        avatar.root.position.set(p0.x, y0, p0.z);
        this.dynamicRoot.add(avatar.root);

        this.npcWalkers.push({
          avatar,
          isInstructor,
          waypoints,
          currIdx: startIdx,
          nextIdx,
          progress: (idx * 0.27) % 0.85,
          speed: isInstructor ? 1.05 + (idx % 3) * 0.1 : 1.28 + (idx % 5) * 0.12,
          phase: idx * 1.47,
          pauseTimer: 0,
          currentAngle: 0
        });
      };

      studentCircuits.forEach((circuit, i) => spawnWalker(circuit, false, i));
      instructorCircuits.forEach((circuit, i) => spawnWalker(circuit, true, i));

      window.__DYNAMIC_NPC_SYSTEM__ = {
        getStats: () => ({
          totalNPCs: this.npcWalkers.length,
          students: this.npcWalkers.filter((w) => !w.isInstructor).length,
          instructors: this.npcWalkers.filter((w) => w.isInstructor).length
        }),
        walkers: this.npcWalkers
      };
    }

    updateParkNPCs(dt, reducedMotion = false) {
      if (reducedMotion || !this.npcWalkers.length) return;
      const stepDt = Math.min(dt, 0.1);

      for (let i = 0; i < this.npcWalkers.length; i++) {
        const w = this.npcWalkers[i];
        const { avatar, waypoints } = w;

        if (w.pauseTimer > 0) {
          w.pauseTimer -= stepDt;
          w.phase += stepDt * 2.2;
          avatar.legL.rotation.x *= 0.84;
          avatar.legR.rotation.x *= 0.84;
          avatar.armL.rotation.x *= 0.84;
          avatar.armR.rotation.x = w.isInstructor ? -0.35 : avatar.armR.rotation.x * 0.84;
          avatar.body.position.y = Math.sin(w.phase) * 0.01;
          continue;
        }

        const pA = waypoints[w.currIdx];
        const pB = waypoints[w.nextIdx];
        const dx = pB.x - pA.x;
        const dz = pB.z - pA.z;
        const segDist = Math.max(0.05, Math.hypot(dx, dz));

        w.progress += (w.speed * stepDt) / segDist;
        if (w.progress >= 1) {
          w.currIdx = w.nextIdx;
          w.nextIdx = (w.nextIdx + 1) % waypoints.length;
          w.progress = 0;
          if ((w.currIdx + i) % 3 === 0) {
            w.pauseTimer = 0.45 + (i % 4) * 0.22;
          }
        }

        const curA = waypoints[w.currIdx];
        const curB = waypoints[w.nextIdx];
        const x = curA.x + (curB.x - curA.x) * w.progress;
        const z = curA.z + (curB.z - curA.z) * w.progress;
        const y = this.getIslandSurfaceY(x, z);
        avatar.root.position.set(x, y, z);

        const targetAngle = Math.atan2(curB.x - curA.x, curB.z - curA.z);
        let diff = targetAngle - w.currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        w.currentAngle += diff * Math.min(1, stepDt * 9);
        avatar.root.rotation.y = w.currentAngle;

        w.phase += stepDt * w.speed * 5.8;
        const swing = Math.sin(w.phase) * 0.52;
        avatar.legL.rotation.x = swing;
        avatar.legR.rotation.x = -swing;
        avatar.armL.rotation.x = -swing * 0.72;
        avatar.armR.rotation.x = w.isInstructor ? -0.36 + swing * 0.14 : swing * 0.72;
        avatar.body.position.y = Math.abs(Math.cos(w.phase)) * 0.032;
      }
    }

    addLampPost(x, z, height, poleMat, globeMat) {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.35, 8), poleMat);
      base.position.set(x, 0.22, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, height, 8), poleMat);
      pole.position.set(x, height * 0.5 + 0.1, z);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), globeMat);
      globe.position.set(x, height + 0.18, z);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.18, 8), poleMat);
      cap.position.set(x, height + 0.38, z);
      this.staticRoot.add(base, pole, globe, cap);
    }

    addStrut(pA, pB, radius, material) {
      const dir = new THREE.Vector3().subVectors(pB, pA);
      const len = dir.length();
      if (len < 0.001) return;
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 6), material);
      mesh.position.copy(pA).addScaledVector(dir, 0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      this.staticRoot.add(mesh);
    }

    buildAll() {
      this.buildCarousel(17.4, -9.8);
      this.buildPirateShip(-17.4, -9.8);
      this.buildRollerCoaster();
      this.buildParkAtmosphere();
      this.buildParkNPCs();
      this.bulbs.finalize();
    }

    setTimeOfDay(mode) {
      this.fireworks.setMode(mode);
      const isNight = mode === 'night';
      const isDusk = mode === 'dusk';

      if (this.starsPoints) {
        this.starsPoints.visible = isNight || isDusk;
        this.starsPoints.material.opacity = isNight ? 0.92 : 0.35;
      }

      this.hazeSprites.forEach((h) => {
        h.sprite.visible = isNight || isDusk;
        h.sprite.material.opacity = isNight ? 0.11 : 0.06;
      });

      const bulbGain = isNight ? 1.0 : isDusk ? 0.88 : mode === 'dawn' ? 0.52 : 0.36;
      this.bulbs.setBrightness(bulbGain);

      const lightGain = isNight ? 1.0 : isDusk ? 0.65 : mode === 'dawn' ? 0.25 : 0.08;
      this.parkPointLights.forEach((p) => {
        p.light.intensity = p.base * lightGain;
      });
    }

    update(dt, elapsed, reducedMotion = false) {
      if (!reducedMotion) {
        // 1. 摩天輪轉動 + 12 座吊艙恆保持垂直
        if (this.ferrisWheelGroup) {
          const angle = elapsed * 0.26;
          this.ferrisWheelGroup.rotation.z = angle;
          for (let i = 0; i < this.ferrisGondolas.length; i++) {
            this.ferrisGondolas[i].rotation.z = -angle;
          }
        }

        // 2. 旋轉木馬轉動 + 8 匹木馬上下奔馳
        if (this.carouselRotor) {
          this.carouselRotor.rotation.y = elapsed * 0.62;
          for (let i = 0; i < this.carouselHorses.length; i++) {
            const h = this.carouselHorses[i];
            h.position.y = h.userData.baseY + Math.sin(elapsed * 2.6 + h.userData.phase) * 0.3;
          }
        }

        // 3. 擺盪海盜船鐘擺運動
        if (this.piratePivot) {
          this.piratePivot.rotation.z = Math.sin(elapsed * 1.42) * 0.72;
        }

        // 4. 雲霄飛車能量守恆物理變速（上坡減速、下坡與垂直迴圈加速）
        if (this.coasterData && this.coasterCars.length > 0) {
          const leadFrame = this.sampleCoasterFrame(this.coasterS);
          const targetSpeed = Math.sqrt(Math.max(24, 152 - 2 * 10.5 * (leadFrame.pos.y - 3.0))) * 0.92;
          this.coasterSpeed += (targetSpeed - this.coasterSpeed) * Math.min(1, dt * 6);
          this.coasterS = (this.coasterS + this.coasterSpeed * dt) % this.coasterData.totalLen;

          const basis = new THREE.Matrix4();
          for (let c = 0; c < this.coasterCars.length; c++) {
            const fr = this.sampleCoasterFrame(this.coasterS - c * 1.12);
            const car = this.coasterCars[c];
            car.position.copy(fr.pos);
            basis.makeBasis(fr.right, fr.up, fr.tan);
            car.quaternion.setFromRotationMatrix(basis);
          }
        }

        // 5. 夜空薄霧緩慢飄移與 20 位校園同學／講師動態漫步
        for (let i = 0; i < this.hazeSprites.length; i++) {
          const h = this.hazeSprites[i];
          const a = h.baseAngle + elapsed * h.speed;
          h.sprite.position.x = Math.cos(a) * h.radius;
          h.sprite.position.z = Math.sin(a) * h.radius;
        }
        this.updateParkNPCs(dt, reducedMotion);
      }

      // 更新動態物件世界矩陣後再更新燈泡與煙火
      this.dynamicRoot.updateMatrixWorld(true);
      this.bulbs.update(elapsed, reducedMotion);
      this.fireworks.update(dt, reducedMotion);
    }
  }

  window.BwyCarnivalUpgrade = BwyCarnivalUpgrade;
};
