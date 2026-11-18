/**
 * 清大福青社「你在福青社都學什麼？」3D 溫暖玩具風主題遊樂園
 * Stage 5: 主應用控制器、Web Audio 溫暖木琴合成器與無障礙互動整合 (island-app.js)
 *
 * 資安與工程守則：
 * - 所有動態 DOM 一律透過 createElement + textContent 建構，杜絕 XSS
 * - 完整串聯原生 <dialog> (適性測驗、12 處尋寶圖鑑、四大願景)、<search> 與 <aside> 目錄
 */

(function (global) {
  'use strict';

  const {
    BWY_META,
    BWY_CATEGORIES,
    BWY_CENTRAL_HUB,
    BWY_ZONES,
    BWY_TREASURES,
    BWY_QUIZ_QUESTIONS,
    BWY_GLOBAL_CLUBS,
    BWY_SKY_ISLAND_LINK,
    getBwyLiveStatus,
    filterBwyZones,
    computeQuizRecommendation
  } = global.BWY_DATA;

const STORAGE_KEY_TREASURES = 'bwy_learning_island_treasures_v1';

/**
 * 溫暖玩具木琴音效合成器 (Web Audio API，無須外部音檔)
 */
class BwyToyAudio {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  ensureContext() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(freq = 523.25, duration = 0.16, type = 'sine', delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playSelect() {
    this.playTone(523.25, 0.14, 'triangle', 0);
    this.playTone(659.25, 0.18, 'sine', 0.06);
  }

  playTreasureFound() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      this.playTone(f, 0.2, 'triangle', idx * 0.07);
    });
  }
}

class BwyLearningIslandApp {
  constructor() {
    this.audio = new BwyToyAudio();
    this.selectedCategories = new Set();
    this.searchQuery = '';
    this.activeTargetId = BWY_CENTRAL_HUB.id;
    this.timeOrder = ['day', 'dusk', 'night', 'dawn'];
    this.timeIndex = 0;

    this.liveStatus = getBwyLiveStatus(new Date());
    this.collectedTreasures = this.loadCollectedTreasures();
    this.quizAnswers = BWY_QUIZ_QUESTIONS.map(() => 0);
    this.globalClubRegionFilter = 'all';
    this.globalClubSearchQuery = '';

    this.cacheDom();
    this.initHeaderStatus();
    this.syncHudOffset();
    this.renderThemeFilterOptions();
    this.renderDirectoryList();
    this.renderDetailPanel(BWY_CENTRAL_HUB);
    this.renderAboutDialog();
    this.renderQuizDialog();
    this.renderTreasureDialog();
    this.renderGlobalClubsDialog();

    // 行動端預設收合左側目錄抽屜與右側詳情面板，保留最大 3D 島嶼可視視野；桌機端預設展開詳情面板
    if (window.innerWidth <= 960) {
      if (this.dom.directoryDrawer) {
        this.dom.directoryDrawer.classList.add('is-collapsed');
        if (this.dom.btnToggleDirectory) {
          this.dom.btnToggleDirectory.setAttribute('aria-expanded', 'false');
        }
      }
      if (this.dom.detailDrawer) {
        this.dom.detailDrawer.classList.remove('is-open');
      }
    } else if (this.dom.detailDrawer) {
      this.dom.detailDrawer.classList.add('is-open');
    }

    this.init3DEngine();
    this.bindUiEvents();
  }

  cacheDom() {
    this.dom = {
      canvas: document.getElementById('island-canvas'),
      labelsLayer: document.getElementById('labels-layer'),
      hudHeader: document.querySelector('.hud-header'),
      liveStatusBadge: document.getElementById('live-status-badge'),
      seasonBanner: document.getElementById('season-banner'),
      searchInput: document.getElementById('zone-search-input'),
      btnThemeFilter: document.getElementById('btn-theme-filter'),
      themeFilterLabel: document.getElementById('theme-filter-label'),
      themeFilterPopover: document.getElementById('theme-filter-popover'),
      directoryDrawer: document.getElementById('directory-drawer'),
      directoryList: document.getElementById('directory-list'),
      btnToggleDirectory: document.getElementById('btn-toggle-directory'),
      btnCloseDirectory: document.getElementById('btn-close-directory'),
      detailDrawer: document.getElementById('detail-drawer'),
      btnCloseDetail: document.getElementById('btn-close-detail'),
      btnPrevZone: document.getElementById('btn-prev-zone'),
      btnNextZone: document.getElementById('btn-next-zone'),
      detailCode: document.getElementById('detail-code'),
      detailCategory: document.getElementById('detail-category'),
      detailTitle: document.getElementById('detail-title'),
      detailMetaphor: document.getElementById('detail-metaphor'),
      detailPitch: document.getElementById('detail-pitch'),
      btnCopyPitch: document.getElementById('btn-copy-pitch'),
      detailSpecialSection: document.getElementById('detail-special-section'),
      detailSkills: document.getElementById('detail-skills'),
      detailWhy: document.getElementById('detail-why'),
      detailHighlights: document.getElementById('detail-highlights'),
      detailCourses: document.getElementById('detail-courses'),
      btnOpenGlobalClubs: document.getElementById('btn-open-global-clubs'),
      btnResetView: document.getElementById('btn-reset-view'),
      btnOpenQuiz: document.getElementById('btn-open-quiz'),
      btnOpenTreasures: document.getElementById('btn-open-treasures'),
      btnMobileMore: document.getElementById('btn-mobile-more'),
      hudMoreGroup: document.getElementById('hud-more-group'),
      treasureCounterLabel: document.getElementById('treasure-counter-label'),
      btnCycleTime: document.getElementById('btn-cycle-time'),
      timeIcon: document.getElementById('time-icon'),
      timeLabel: document.getElementById('time-label'),
      btnToggleAudio: document.getElementById('btn-toggle-audio'),
      audioIcon: document.getElementById('audio-icon'),
      btnOpenAbout: document.getElementById('btn-open-about'),
      btnFollowTrain: document.getElementById('btn-follow-train'),
      btnRandomZone: document.getElementById('btn-random-zone'),
      toast: document.getElementById('toast-notification'),
      quizDialog: document.getElementById('quiz-dialog'),
      quizBody: document.getElementById('quiz-body'),
      treasureDialog: document.getElementById('treasure-dialog'),
      treasureGrid: document.getElementById('treasure-grid'),
      aboutDialog: document.getElementById('about-dialog'),
      visionsGrid: document.getElementById('visions-grid'),
      globalClubsDialog: document.getElementById('global-clubs-dialog'),
      globalClubsBody: document.getElementById('global-clubs-body')
    };
  }

  loadCollectedTreasures() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TREASURES);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set();
    }
  }

  saveCollectedTreasures() {
    try {
      localStorage.setItem(STORAGE_KEY_TREASURES, JSON.stringify([...this.collectedTreasures]));
    } catch {
      // 忽略無痕模式寫入限制
    }
  }

  initHeaderStatus() {
    if (this.dom.liveStatusBadge) {
      this.dom.liveStatusBadge.textContent = this.liveStatus.statusBadge;
    }
    if (this.dom.seasonBanner) {
      this.dom.seasonBanner.textContent = `${BWY_META.slogan} · ${this.liveStatus.seasonLabel}`;
    }
    this.updateTreasureCounterUI();
  }

  init3DEngine() {
    if (this.engine3D || typeof window.BwyIsland3DEngine !== 'function') return;
    try {
      this.engine3D = new window.BwyIsland3DEngine({
        canvas: this.dom.canvas,
        labelsLayer: this.dom.labelsLayer,
        hubData: BWY_CENTRAL_HUB,
        zonesData: BWY_ZONES,
        treasuresData: BWY_TREASURES,
        onSelectTarget: (targetId) => this.selectTargetById(targetId, true),
        onCollectTreasure: (treasureId) => this.collectTreasure(treasureId, true)
      });

      this.collectedTreasures.forEach((tid) => {
        this.engine3D.markTreasureCollectedVisual(tid, true);
      });
      this.syncFilterStateTo3D();
    } catch (err) {
      console.warn('WebGL 初始化降級為純文字導覽模式:', err);
    }
  }

  getAllTargets() {
    return [BWY_CENTRAL_HUB, ...BWY_ZONES];
  }

  findTargetById(id) {
    if (id === BWY_CENTRAL_HUB.id) return BWY_CENTRAL_HUB;
    return BWY_ZONES.find((z) => z.id === id) || BWY_CENTRAL_HUB;
  }

  selectTargetById(targetId, flyCamera = true) {
    const target = this.findTargetById(targetId);
    this.activeTargetId = target.id;
    this.audio.playSelect();

    this.renderDetailPanel(target);
    this.dom.detailDrawer.classList.add('is-open');

    if (window.innerWidth <= 960 && this.dom.directoryDrawer) {
      this.dom.directoryDrawer.classList.add('is-collapsed');
      this.dom.btnToggleDirectory.setAttribute('aria-expanded', 'false');
    }

    if (flyCamera && this.engine3D) {
      this.dom.btnFollowTrain.setAttribute('aria-pressed', 'false');
      this.engine3D.flyToTarget(target);
    }

    this.syncDirectoryActiveState();
    this.syncFilterStateTo3D();
  }

  syncHudOffset() {
    if (!this.dom.hudHeader || window.innerWidth <= 960) return;
    const rect = this.dom.hudHeader.getBoundingClientRect();
    if (rect.bottom > 0) {
      document.documentElement.style.setProperty('--hud-bottom-offset', `${Math.ceil(rect.bottom + 10)}px`);
    }
  }

  updateThemeFilterButtonLabel() {
    if (!this.dom.btnThemeFilter || !this.dom.themeFilterLabel) return;
    const count = this.selectedCategories.size;
    this.dom.themeFilterLabel.textContent = count > 0 ? `主題篩選 (${count})` : '主題篩選';
    this.dom.btnThemeFilter.classList.toggle('has-selection', count > 0);
  }

  renderThemeFilterOptions() {
    const popover = this.dom.themeFilterPopover;
    if (!popover) return;
    popover.textContent = '';

    BWY_CATEGORIES.filter((cat) => cat.id !== 'all').forEach((cat) => {
      const label = document.createElement('label');
      label.className = 'theme-option-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = cat.id;
      checkbox.checked = this.selectedCategories.has(cat.id);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          this.selectedCategories.add(cat.id);
        } else {
          this.selectedCategories.delete(cat.id);
        }
        this.updateThemeFilterButtonLabel();
        this.renderDirectoryList();
        this.syncFilterStateTo3D();
      });

      const dot = document.createElement('span');
      dot.className = 'theme-option-dot';
      dot.style.backgroundColor = cat.color;

      const text = document.createElement('span');
      text.textContent = cat.label;

      label.append(checkbox, dot, text);
      popover.appendChild(label);
    });

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'theme-option-clear';
    clearBtn.textContent = '顯示全部主題 (重設)';
    clearBtn.addEventListener('click', () => {
      this.selectedCategories.clear();
      this.renderThemeFilterOptions();
      this.renderDirectoryList();
      this.syncFilterStateTo3D();
    });
    popover.appendChild(clearBtn);

    this.updateThemeFilterButtonLabel();
  }

  renderDirectoryList() {
    const list = this.dom.directoryList;
    list.textContent = '';

    const filteredZones = filterBwyZones(this.selectedCategories, this.searchQuery);
    const items = [BWY_CENTRAL_HUB, ...filteredZones];

    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `directory-item-btn${item.id === this.activeTargetId ? ' is-active' : ''}`;
      btn.dataset.targetId = item.id;
      btn.setAttribute('role', 'listitem');

      const dot = document.createElement('span');
      dot.className = 'dir-dot';
      dot.style.backgroundColor = item.color;

      const textWrap = document.createElement('span');
      textWrap.className = 'dir-text-wrap';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'dir-item-name';
      const isFeatured = item.id === this.liveStatus.featuredZoneId;
      nameSpan.textContent = `${item.code}｜${item.name}${isFeatured ? ' ★' : ''}`;

      const subSpan = document.createElement('span');
      subSpan.className = 'dir-item-sub';
      subSpan.textContent = item.subtitle || item.categoryLabel;

      textWrap.append(nameSpan, subSpan);
      btn.append(dot, textWrap);

      btn.addEventListener('click', () => {
        this.selectTargetById(item.id, true);
      });

      list.appendChild(btn);
    });
  }

  syncDirectoryActiveState() {
    const buttons = this.dom.directoryList.querySelectorAll('.directory-item-btn');
    buttons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.targetId === this.activeTargetId);
    });
  }

  syncFilterStateTo3D() {
    if (!this.engine3D) return;
    const visibleZones = filterBwyZones(this.selectedCategories, this.searchQuery);
    const visibleIds = new Set(visibleZones.map((z) => z.id));
    this.engine3D.syncLabelStates(visibleIds, this.activeTargetId, this.liveStatus.featuredZoneId);
  }

  /**
   * 渲染右側／底部「你在福青社都學什麼？」詳情抽屜
   */
  renderDetailPanel(target) {
    this.dom.detailCode.textContent = target.code;
    this.dom.detailCode.style.backgroundColor = target.color;
    this.dom.detailCategory.textContent = target.categoryLabel;
    this.dom.detailTitle.textContent = target.name;
    this.dom.detailMetaphor.textContent = `🎠 3D 樂園場景：${target.metaphor}`;
    this.dom.detailPitch.textContent = target.elevatorPitch;

    // 渲染遊艇碼頭「全球福智青年社一覽表」或「天空之城蔬食浮島連動」專屬區塊
    this.renderSpecialSection(target);

    // 核心能力標籤
    this.dom.detailSkills.textContent = '';
    (target.coreSkills || []).forEach((skill) => {
      const chip = document.createElement('span');
      chip.className = 'skill-badge';
      chip.textContent = `# ${skill}`;
      this.dom.detailSkills.appendChild(chip);
    });

    // 為什麼我們學這個 + 亮點清單
    this.dom.detailWhy.textContent = target.whyWeLearn || '';
    this.dom.detailHighlights.textContent = '';
    (target.highlights || []).forEach((hl) => {
      const li = document.createElement('li');
      li.textContent = hl;
      this.dom.detailHighlights.appendChild(li);
    });

    // 歷年清大福青真實社課與公開相簿時間軸
    this.dom.detailCourses.textContent = '';
    (target.courses || []).forEach((course) => {
      const card = document.createElement('article');
      card.className = 'course-card';

      const meta = document.createElement('div');
      meta.className = 'course-meta';

      const semBadge = document.createElement('span');
      semBadge.className = 'course-sem-badge';
      semBadge.textContent = `${course.semester} 學期 · ${course.date}`;

      const placeSpan = document.createElement('span');
      placeSpan.textContent = `📍 ${course.place}`;

      meta.append(semBadge, placeSpan);

      const title = document.createElement('h4');
      title.className = 'course-title';
      title.textContent = course.title;

      const summary = document.createElement('p');
      summary.className = 'course-summary';
      summary.textContent = course.summary;

      card.append(meta, title, summary);

      if (course.albumUrl) {
        const link = document.createElement('a');
        link.className = 'course-album-link';
        link.href = course.albumUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = target.isSkyIslandPortal
          ? '🚀 開啟連動專案 / 開發紀錄'
          : target.isGlobalMarina
          ? '🌐 查看福智文教基金會官方公告'
          : '📷 查看活動公開相簿';
        card.appendChild(link);
      }

      this.dom.detailCourses.appendChild(card);
    });
  }

  /**
   * 渲染 Z09 遊艇碼頭（全球福智青年社一覽表）或 Z10 天空蔬食驛站（姊妹作天空之城連動）專屬面板
   */
  renderSpecialSection(target) {
    const sec = this.dom.detailSpecialSection;
    if (!sec) return;
    sec.textContent = '';

    if (target.isGlobalMarina && BWY_GLOBAL_CLUBS) {
      sec.hidden = false;

      const headerRow = document.createElement('div');
      headerRow.className = 'special-section-header';

      const h3 = document.createElement('h3');
      h3.className = 'section-subtitle';
      h3.textContent = `⛵ ${BWY_GLOBAL_CLUBS.title}（10 大區域 · 61 校）`;

      const openModalBtn = document.createElement('button');
      openModalBtn.type = 'button';
      openModalBtn.className = 'copy-chip-btn';
      openModalBtn.textContent = '🔍 全螢幕分區檢索';
      openModalBtn.addEventListener('click', () => {
        this.audio.playSelect();
        this.renderGlobalClubsDialog();
        this.dom.globalClubsDialog?.showModal();
      });

      headerRow.append(h3, openModalBtn);
      sec.appendChild(headerRow);

      const noteP = document.createElement('p');
      noteP.className = 'special-note-text';
      noteP.textContent = BWY_GLOBAL_CLUBS.note;
      sec.appendChild(noteP);

      const regionStack = document.createElement('div');
      regionStack.className = 'global-region-drawer-stack';

      BWY_GLOBAL_CLUBS.regions.forEach((reg) => {
        const card = document.createElement('div');
        card.className = 'global-region-card';

        const rHead = document.createElement('div');
        rHead.className = 'global-region-head';

        const badge = document.createElement('span');
        badge.className = 'global-region-badge';
        badge.style.backgroundColor = reg.badgeColor;
        badge.textContent = `${reg.areaGroup}｜${reg.name} (${reg.schools.length})`;

        rHead.appendChild(badge);
        card.appendChild(rHead);

        const chipsWrap = document.createElement('div');
        chipsWrap.className = 'global-school-chips';

        reg.schools.forEach((sc) => {
          const pill = document.createElement('span');
          pill.className = `school-pill${sc.isHome ? ' is-home' : ''}${sc.type === 'study-group' ? ' is-study' : ''}`;
          pill.textContent = sc.enName ? `${sc.name} (${sc.enName})` : sc.note ? `${sc.name}（${sc.note}）` : sc.name;
          chipsWrap.appendChild(pill);
        });

        card.appendChild(chipsWrap);
        regionStack.appendChild(card);
      });

      sec.appendChild(regionStack);

      const srcLink = document.createElement('a');
      srcLink.className = 'course-album-link';
      srcLink.href = BWY_GLOBAL_CLUBS.sourceUrl;
      srcLink.target = '_blank';
      srcLink.rel = 'noopener noreferrer';
      srcLink.textContent = '🌐 對照福智文教基金會「全球福智青年社一覽表」官方網頁';
      sec.appendChild(srcLink);
      return;
    }

    if (target.isSkyIslandPortal && BWY_SKY_ISLAND_LINK) {
      sec.hidden = false;

      const h3 = document.createElement('h3');
      h3.className = 'section-subtitle';
      h3.textContent = '🏝️ 雙島連動：《2026 清大福青社蔬食地圖：天空之城浮島》';
      sec.appendChild(h3);

      const portalBtns = document.createElement('div');
      portalBtns.className = 'sky-portal-btn-group';

      const linkMain = document.createElement('a');
      linkMain.className = 'hud-btn hud-btn-primary sky-portal-link';
      linkMain.href = BWY_SKY_ISLAND_LINK.localEntryUrl;
      linkMain.target = '_blank';
      linkMain.rel = 'noopener noreferrer';
      linkMain.textContent = '🚁 傳送至《天空之城蔬食地圖》3D 浮島';

      const linkFullMap = document.createElement('a');
      linkFullMap.className = 'hud-btn sky-portal-link';
      linkFullMap.href = BWY_SKY_ISLAND_LINK.fullVeggieMapUrl;
      linkFullMap.target = '_blank';
      linkFullMap.rel = 'noopener noreferrer';
      linkFullMap.textContent = '🗺️ 完整校外蔬食地圖';

      portalBtns.append(linkMain, linkFullMap);
      sec.appendChild(portalBtns);

      const eggSub = document.createElement('h4');
      eggSub.className = 'sky-sub-heading';
      eggSub.textContent = '✨ 本站微縮還原之《天空之城蔬食地圖》4 大招牌彩蛋';
      sec.appendChild(eggSub);

      const eggGrid = document.createElement('div');
      eggGrid.className = 'sky-egg-list';
      BWY_SKY_ISLAND_LINK.easterEggs.forEach((eg) => {
        const item = document.createElement('div');
        item.className = 'sky-egg-card';
        const title = document.createElement('strong');
        title.textContent = eg.name;
        const desc = document.createElement('p');
        desc.textContent = eg.desc;
        item.append(title, desc);
        eggGrid.appendChild(item);
      });
      sec.appendChild(eggGrid);

      const storeSub = document.createElement('h4');
      storeSub.className = 'sky-sub-heading';
      storeSub.textContent = '🍜 天空之城 TOP 10 必吃蔬食餐廳浮島（內環步行圈 × 外環單車圈）';
      sec.appendChild(storeSub);

      const storeGrid = document.createElement('div');
      storeGrid.className = 'sky-store-grid';
      BWY_SKY_ISLAND_LINK.top10Stores.forEach((st, idx) => {
        const pill = document.createElement('div');
        pill.className = 'sky-store-card';
        const nameRow = document.createElement('div');
        nameRow.className = 'sky-store-name';
        nameRow.textContent = `#${idx + 1} ${st.name}（${st.walk}）`;
        const dishRow = document.createElement('div');
        dishRow.className = 'sky-store-dish';
        dishRow.textContent = `${st.ring}｜招牌：${st.dish}`;
        pill.append(nameRow, dishRow);
        storeGrid.appendChild(pill);
      });
      sec.appendChild(storeGrid);
      return;
    }

    sec.hidden = true;
  }

  /**
   * 收集微縮彩蛋並更新圖鑑與 Toast
   */
  collectTreasure(treasureId, flyIfFromDialog = false) {
    const treasure = BWY_TREASURES.find((t) => t.id === treasureId);
    if (!treasure) return;

    const isNew = !this.collectedTreasures.has(treasureId);
    this.collectedTreasures.add(treasureId);
    this.saveCollectedTreasures();

    if (this.engine3D) {
      this.engine3D.markTreasureCollectedVisual(treasureId, true);
      if (flyIfFromDialog) {
        const parentTarget = this.findTargetById(treasure.zoneId);
        this.selectTargetById(parentTarget.id, true);
      }
    }

    this.audio.playTreasureFound();
    this.updateTreasureCounterUI();
    this.renderTreasureDialog();

    const prefix = isNew ? '🎉 發現福青溫暖彩蛋' : '✨ 已收集信物';
    this.showToast(`${prefix}：【${treasure.name}】${treasure.meaning}`);
  }

  updateTreasureCounterUI() {
    if (this.dom.treasureCounterLabel) {
      this.dom.treasureCounterLabel.textContent = `尋寶 (${this.collectedTreasures.size}/${BWY_TREASURES.length})`;
    }
  }

  showToast(message) {
    const el = this.dom.toast;
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 4200);
  }

  /**
   * 渲染 30 秒適性推薦測驗 (<dialog>)
   */
  renderQuizDialog() {
    const container = this.dom.quizBody;
    container.textContent = '';

    const intro = document.createElement('p');
    intro.className = 'dialog-intro';
    intro.textContent = '回答以下 3 個日常情境，立即測出最適合你第一個參加的清大福青社活動與主題園區！';
    container.appendChild(intro);

    BWY_QUIZ_QUESTIONS.forEach((q, qIdx) => {
      const block = document.createElement('div');
      block.className = 'quiz-question-block';

      const qTitle = document.createElement('h3');
      qTitle.className = 'quiz-q-title';
      qTitle.textContent = q.question;
      block.appendChild(qTitle);

      const optList = document.createElement('div');
      optList.className = 'quiz-options-list';

      q.options.forEach((opt, optIdx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `quiz-opt-btn${this.quizAnswers[qIdx] === optIdx ? ' is-selected' : ''}`;
        btn.textContent = opt.label;
        btn.addEventListener('click', () => {
          this.quizAnswers[qIdx] = optIdx;
          this.audio.playSelect();
          this.renderQuizDialog();
        });
        optList.appendChild(btn);
      });

      block.appendChild(optList);
      container.appendChild(block);
    });

    // 即時計算推薦結果
    const rec = computeQuizRecommendation(this.quizAnswers);
    const resultCard = document.createElement('div');
    resultCard.className = 'quiz-result-card';

    const rHeading = document.createElement('h3');
    rHeading.className = 'section-subtitle';
    rHeading.textContent = `🎯 最推薦你的起點：${rec.topZone.code}｜${rec.topZone.name}`;

    const rDesc = document.createElement('p');
    rDesc.className = 'detail-paragraph';
    rDesc.textContent = rec.topZone.elevatorPitch;

    const rRunner = document.createElement('p');
    rRunner.className = 'detail-paragraph';
    rRunner.textContent = `💡 次要推薦園區：${rec.runnerUp.name}（${rec.runnerUp.subtitle}）`;

    const actions = document.createElement('div');
    actions.className = 'quiz-result-actions';

    const flyBtn = document.createElement('button');
    flyBtn.type = 'button';
    flyBtn.className = 'hud-btn hud-btn-primary';
    flyBtn.textContent = `🚀 立即飛往「${rec.topZone.shortName}」`;
    flyBtn.addEventListener('click', () => {
      this.dom.quizDialog.close();
      this.selectTargetById(rec.topZone.id, true);
    });

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'hud-btn';
    copyBtn.textContent = '📋 複製測驗結果分享給朋友';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText(rec.shareText).catch(() => {});
      this.showToast('✅ 已複製測驗推薦文案！快貼給問你「在福青社學什麼」的朋友吧！');
    });

    actions.append(flyBtn, copyBtn);
    resultCard.append(rHeading, rDesc, rRunner, actions);
    container.appendChild(resultCard);
  }

  /**
   * 渲染 12 處微縮尋寶圖鑑 (<dialog>)
   */
  renderTreasureDialog() {
    const grid = this.dom.treasureGrid;
    if (!grid) return;
    grid.textContent = '';

    BWY_TREASURES.forEach((t, idx) => {
      const isCollected = this.collectedTreasures.has(t.id);
      const card = document.createElement('div');
      card.className = `treasure-card${isCollected ? ' is-collected' : ''}`;

      const head = document.createElement('div');
      head.className = 'treasure-head';

      const name = document.createElement('span');
      name.className = 'treasure-name';
      name.textContent = `#${String(idx + 1).padStart(2, '0')} ${t.name}`;

      const status = document.createElement('span');
      status.className = 'treasure-status';
      status.textContent = isCollected ? '✅ 已尋獲' : '🔒 未尋獲';

      head.append(name, status);

      const desc = document.createElement('p');
      desc.className = 'treasure-desc';
      desc.textContent = isCollected ? `${t.meaning}（位於：${t.zoneName}）` : `線索：${t.hint}`;

      const locateBtn = document.createElement('button');
      locateBtn.type = 'button';
      locateBtn.className = 'copy-chip-btn';
      locateBtn.textContent = isCollected ? '🎈 飛往查看' : '🔍 飛往尋找並點亮';
      locateBtn.addEventListener('click', () => {
        this.dom.treasureDialog.close();
        this.collectTreasure(t.id, true);
      });

      card.append(head, desc, locateBtn);
      grid.appendChild(card);
    });
  }

  /**
   * 渲染關於福青社與四大願景 (<dialog>)
   */
  renderAboutDialog() {
    const grid = this.dom.visionsGrid;
    if (!grid) return;
    grid.textContent = '';

    BWY_META.fourVisions.forEach((v) => {
      const card = document.createElement('div');
      card.className = 'vision-card';

      const h4 = document.createElement('h4');
      h4.textContent = v.title;

      const p = document.createElement('p');
      p.textContent = v.desc;

      card.append(h4, p);
      grid.appendChild(card);
    });
  }

  /**
   * 渲染遊艇碼頭「全球福智青年社一覽表」互動對話框 (<dialog>)
   */
  renderGlobalClubsDialog() {
    const body = this.dom.globalClubsBody;
    if (!body || !BWY_GLOBAL_CLUBS) return;
    body.textContent = '';

    const intro = document.createElement('p');
    intro.className = 'dialog-intro';
    intro.textContent = `${BWY_GLOBAL_CLUBS.subtitle}（${BWY_GLOBAL_CLUBS.note}）`;
    body.appendChild(intro);

    // 搜尋與區域篩選控制列
    const filterWrap = document.createElement('div');
    filterWrap.className = 'global-dialog-controls';

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'search-input';
    searchInput.placeholder = '搜尋校名或地區：清華、交通、台大、成大、USC、Columbia、SFU...';
    searchInput.value = this.globalClubSearchQuery;
    searchInput.addEventListener('input', (e) => {
      this.globalClubSearchQuery = e.target.value;
      this.renderGlobalClubsGridOnly(gridContainer);
    });
    filterWrap.appendChild(searchInput);

    const tabsRow = document.createElement('div');
    tabsRow.className = 'category-pills';

    const allTab = document.createElement('button');
    allTab.type = 'button';
    allTab.className = `category-chip${this.globalClubRegionFilter === 'all' ? ' is-active' : ''}`;
    allTab.textContent = '全部地區 (61)';
    allTab.addEventListener('click', () => {
      this.globalClubRegionFilter = 'all';
      this.renderGlobalClubsDialog();
    });
    tabsRow.appendChild(allTab);

    BWY_GLOBAL_CLUBS.regions.forEach((reg) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `category-chip${this.globalClubRegionFilter === reg.id ? ' is-active' : ''}`;
      btn.textContent = `${reg.name} (${reg.schools.length})`;
      btn.addEventListener('click', () => {
        this.globalClubRegionFilter = reg.id;
        this.renderGlobalClubsDialog();
      });
      tabsRow.appendChild(btn);
    });

    filterWrap.appendChild(tabsRow);
    body.appendChild(filterWrap);

    const gridContainer = document.createElement('div');
    gridContainer.className = 'global-regions-modal-grid';
    this.renderGlobalClubsGridOnly(gridContainer);
    body.appendChild(gridContainer);

    // 底部智者語錄與官方連結
    const quoteBox = document.createElement('div');
    quoteBox.className = 'about-info-box global-quotes-box';
    const qHeading = document.createElement('h3');
    qHeading.textContent = '✨ 全球福智青年社・師長勉勵語錄';
    quoteBox.appendChild(qHeading);

    const qList = document.createElement('ul');
    BWY_GLOBAL_CLUBS.quotes.forEach((qt) => {
      const li = document.createElement('li');
      li.textContent = `「${qt.text}」—— ${qt.author}`;
      qList.appendChild(li);
    });
    quoteBox.appendChild(qList);

    const officialLink = document.createElement('a');
    officialLink.className = 'course-album-link';
    officialLink.href = BWY_GLOBAL_CLUBS.sourceUrl;
    officialLink.target = '_blank';
    officialLink.rel = 'noopener noreferrer';
    officialLink.textContent = '🌐 開啟福智文教基金會「全球福智青年社一覽表」官方原頁';
    quoteBox.appendChild(officialLink);

    body.appendChild(quoteBox);
  }

  renderGlobalClubsGridOnly(container) {
    container.textContent = '';
    const q = String(this.globalClubSearchQuery || '').trim().toLowerCase();

    BWY_GLOBAL_CLUBS.regions.forEach((reg) => {
      if (this.globalClubRegionFilter !== 'all' && this.globalClubRegionFilter !== reg.id) return;

      const matchedSchools = reg.schools.filter((sc) => {
        if (!q) return true;
        const hay = `${reg.name} ${reg.areaGroup} ${sc.name} ${sc.enName || ''} ${sc.note || ''}`.toLowerCase();
        return hay.includes(q);
      });

      if (matchedSchools.length === 0) return;

      const card = document.createElement('div');
      card.className = 'global-region-card';

      const head = document.createElement('div');
      head.className = 'global-region-head';

      const badge = document.createElement('span');
      badge.className = 'global-region-badge';
      badge.style.backgroundColor = reg.badgeColor;
      badge.textContent = `${reg.areaGroup}｜${reg.name}（${matchedSchools.length} 校）`;

      head.appendChild(badge);
      card.appendChild(head);

      const chips = document.createElement('div');
      chips.className = 'global-school-chips';

      matchedSchools.forEach((sc) => {
        const pill = document.createElement('span');
        pill.className = `school-pill${sc.isHome ? ' is-home' : ''}${sc.type === 'study-group' ? ' is-study' : ''}`;
        pill.textContent = sc.enName
          ? `${sc.name} · ${sc.enName}`
          : sc.note
          ? `${sc.name}（${sc.note}）`
          : sc.name;
        chips.appendChild(pill);
      });

      card.appendChild(chips);
      container.appendChild(card);
    });
  }

  bindUiEvents() {
    // 搜尋框即時篩選與主題複選下拉選單
    if (this.dom.searchInput) {
      this.dom.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderDirectoryList();
        this.syncFilterStateTo3D();
      });
    }

    if (this.dom.btnThemeFilter && this.dom.themeFilterPopover) {
      this.dom.btnThemeFilter.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !this.dom.themeFilterPopover.hidden;
        this.dom.themeFilterPopover.hidden = isOpen;
        this.dom.btnThemeFilter.setAttribute('aria-expanded', String(!isOpen));
      });

      this.dom.themeFilterPopover.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      document.addEventListener('click', () => {
        if (!this.dom.themeFilterPopover.hidden) {
          this.dom.themeFilterPopover.hidden = true;
          this.dom.btnThemeFilter.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.dom.themeFilterPopover.hidden) {
          this.dom.themeFilterPopover.hidden = true;
          this.dom.btnThemeFilter.setAttribute('aria-expanded', 'false');
        }
      });
    }

    window.addEventListener('resize', () => this.syncHudOffset());
    if (typeof ResizeObserver === 'function' && this.dom.hudHeader) {
      new ResizeObserver(() => this.syncHudOffset()).observe(this.dom.hudHeader);
    }

    // 左側目錄抽屜開關
    this.dom.btnToggleDirectory.addEventListener('click', () => {
      const collapsed = this.dom.directoryDrawer.classList.toggle('is-collapsed');
      this.dom.btnToggleDirectory.setAttribute('aria-expanded', String(!collapsed));
    });

    this.dom.btnCloseDirectory.addEventListener('click', () => {
      this.dom.directoryDrawer.classList.add('is-collapsed');
      this.dom.btnToggleDirectory.setAttribute('aria-expanded', 'false');
    });

    // 右側詳情抽屜收合與上下區切換
    this.dom.btnCloseDetail.addEventListener('click', () => {
      this.dom.detailDrawer.classList.remove('is-open');
    });

    this.dom.btnPrevZone.addEventListener('click', () => this.stepTarget(-1));
    this.dom.btnNextZone.addEventListener('click', () => this.stepTarget(1));

    // 複製「你在福青社都學什麼？」回答
    this.dom.btnCopyPitch.addEventListener('click', () => {
      const target = this.findTargetById(this.activeTargetId);
      const text = `【${target.name}】${target.elevatorPitch}`;
      navigator.clipboard?.writeText(text).catch(() => {});
      this.showToast('📋 已複製這段介紹詞！可以直接貼到 LINE 或 IG 回覆朋友囉！');
    });

    // 頂部工具列與手機版更多選單
    if (this.dom.btnMobileMore && this.dom.hudMoreGroup) {
      const closeMoreMenu = () => {
        this.dom.hudMoreGroup.classList.remove('is-open');
        this.dom.btnMobileMore.setAttribute('aria-expanded', 'false');
      };

      this.dom.btnMobileMore.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.dom.hudMoreGroup.classList.toggle('is-open');
        this.dom.btnMobileMore.setAttribute('aria-expanded', String(isOpen));
      });

      this.dom.hudMoreGroup.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.closest('#btn-open-about, #btn-open-global-clubs')) {
          closeMoreMenu();
        }
      });

      document.addEventListener('click', () => {
        if (this.dom.hudMoreGroup.classList.contains('is-open')) {
          closeMoreMenu();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.dom.hudMoreGroup.classList.contains('is-open')) {
          closeMoreMenu();
        }
      });
    }

    if (this.dom.btnOpenGlobalClubs) {
      this.dom.btnOpenGlobalClubs.addEventListener('click', () => {
        this.selectTargetById('zone-yacht-marina', true);
        this.renderGlobalClubsDialog();
        this.dom.globalClubsDialog?.showModal();
      });
    }

    this.dom.btnResetView.addEventListener('click', () => {
      this.audio.playSelect();
      if (this.engine3D) this.engine3D.resetOverview();
    });

    this.dom.btnCycleTime.addEventListener('click', () => {
      this.timeIndex = (this.timeIndex + 1) % this.timeOrder.length;
      const mode = this.timeOrder[this.timeIndex];
      document.documentElement.dataset.theme = mode;
      if (this.engine3D) this.engine3D.setTimeOfDay(mode);

      const metaMap = {
        day: { icon: '☀️', label: '暖陽日' },
        dusk: { icon: '🌇', label: '黃昏燈' },
        night: { icon: '🌙', label: '星光夜' },
        dawn: { icon: '🌅', label: '晨曦光' }
      };
      this.dom.timeIcon.textContent = metaMap[mode].icon;
      this.dom.timeLabel.textContent = metaMap[mode].label;
      this.audio.playSelect();
    });

    this.dom.btnToggleAudio.addEventListener('click', () => {
      this.audio.enabled = !this.audio.enabled;
      this.dom.btnToggleAudio.setAttribute('aria-pressed', String(this.audio.enabled));
      this.dom.audioIcon.textContent = this.audio.enabled ? '🔔' : '🔕';
      if (this.audio.enabled) this.audio.playSelect();
    });

    // 底部小火車跟隨與隨機逛園區
    this.dom.btnFollowTrain.addEventListener('click', () => {
      if (!this.engine3D) return;
      const nextState = !this.engine3D.animated.followTrain;
      this.engine3D.animated.followTrain = nextState;
      this.dom.btnFollowTrain.setAttribute('aria-pressed', String(nextState));
      if (nextState) {
        this.showToast('🚂 已登上福青希望遊園小火車！拖曳畫面或點擊任一園區即可下車。');
      }
    });

    this.dom.btnRandomZone.addEventListener('click', () => {
      const candidates = BWY_ZONES.filter((z) => z.id !== this.activeTargetId);
      const pick = candidates[Math.floor(Math.random() * candidates.length)] || BWY_ZONES[0];
      this.selectTargetById(pick.id, true);
    });

    // 原生 <dialog> 開關與背景點擊關閉
    this.dom.btnOpenQuiz.addEventListener('click', () => {
      this.audio.playSelect();
      this.dom.quizDialog.showModal();
    });

    this.dom.btnOpenTreasures.addEventListener('click', () => {
      this.audio.playSelect();
      this.renderTreasureDialog();
      this.dom.treasureDialog.showModal();
    });

    this.dom.btnOpenAbout.addEventListener('click', () => {
      this.audio.playSelect();
      this.dom.aboutDialog.showModal();
    });

    document.querySelectorAll('[data-close-dialog]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dialogId = btn.getAttribute('data-close-dialog');
        const dlg = document.getElementById(dialogId);
        if (dlg && dlg.open) dlg.close();
      });
    });

    [this.dom.quizDialog, this.dom.treasureDialog, this.dom.aboutDialog, this.dom.globalClubsDialog].forEach((dlg) => {
      if (!dlg) return;
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg) dlg.close();
      });
    });
  }

  stepTarget(delta) {
    const all = this.getAllTargets();
    const idx = all.findIndex((item) => item.id === this.activeTargetId);
    const nextIdx = (idx + delta + all.length) % all.length;
    this.selectTargetById(all[nextIdx].id, true);
  }
}

  function bootBwyLearningIsland() {
    if (!global.__BWY_ISLAND_APP__) {
      global.__BWY_ISLAND_APP__ = new BwyLearningIslandApp();
    } else {
      global.__BWY_ISLAND_APP__.init3DEngine();
    }
  }

  global.bootBwyLearningIsland = bootBwyLearningIsland;
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootBwyLearningIsland);
  } else {
    bootBwyLearningIsland();
  }
})(window);
