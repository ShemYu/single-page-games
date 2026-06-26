import { PHASE } from './config.js';

const toneClass = Object.freeze({
  info: 'info',
  good: 'good',
  bad: 'bad',
  warning: 'warning'
});

function formatStat(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export class HudController {
  constructor(director) {
    this.director = director;
    this.registry = director.registry;
    this.unsubscribers = [];
    this.toastTimer = null;
    this.lastWaveNumber = null;

    this.elements = {
      phase: document.querySelector('#phaseValue'),
      wave: document.querySelector('#waveValue'),
      gold: document.querySelector('#goldValue'),
      crystalFill: document.querySelector('#crystalFill'),
      crystalValue: document.querySelector('#crystalValue'),
      enemies: document.querySelector('#enemyValue'),
      defense: document.querySelector('#defenseValue'),
      jobs: document.querySelector('#jobCatalog'),
      buildings: document.querySelector('#buildingCatalog'),
      selectionTitle: document.querySelector('#selectionTitle'),
      selectionBody: document.querySelector('#selectionBody'),
      cancelSelection: document.querySelector('#cancelSelectionBtn'),
      start: document.querySelector('#startWaveBtn'),
      startLabel: document.querySelector('#startWaveLabel'),
      forecast: document.querySelector('#forecastList'),
      debug: document.querySelector('#debugBtn'),
      reset: document.querySelector('#resetBtn'),
      assetStatus: document.querySelector('#assetStatus'),
      toast: document.querySelector('#toast'),
      defeatPanel: document.querySelector('#defeatPanel'),
      defeatText: document.querySelector('#defeatText'),
      restart: document.querySelector('#restartBtn')
    };

    this.renderCatalogs();
    this.bindDomEvents();
    this.bindDirectorEvents();
    this.renderState(this.director.snapshot());
  }

  bindDomEvents() {
    const catalogHandler = event => {
      const button = event.target.closest('[data-kind][data-id]');
      if (!button || button.disabled) return;
      this.director.selectCatalog(button.dataset.kind, button.dataset.id);
    };
    this.elements.jobs.addEventListener('click', catalogHandler);
    this.elements.buildings.addEventListener('click', catalogHandler);
    this.catalogHandler = catalogHandler;

    this.onStart = () => this.director.startWave();
    this.onCancel = () => this.director.clearSelection();
    this.onDebug = () => this.director.toggleDebug();
    this.onReset = () => window.location.reload();

    this.elements.start.addEventListener('click', this.onStart);
    this.elements.cancelSelection.addEventListener('click', this.onCancel);
    this.elements.debug.addEventListener('click', this.onDebug);
    this.elements.reset.addEventListener('click', this.onReset);
    this.elements.restart.addEventListener('click', this.onReset);
  }

  bindDirectorEvents() {
    this.unsubscribers.push(
      this.director.events.on('state:changed', state => this.renderState(state)),
      this.director.events.on('toast', payload => this.showToast(payload)),
      this.director.events.on('assets:report', report => this.renderAssetReport(report))
    );
  }

  renderCatalogs() {
    this.elements.jobs.innerHTML = this.registry.list('jobs').map(job => {
      const asset = this.registry.get('assets', job.assetId);
      const badge = asset.type === 'directional-sprite' ? 'SPRITE' : 'TEMP';
      return `
        <button class="catalog-card" type="button" data-kind="job" data-id="${job.id}" data-cost="${job.cost}">
          <span class="catalog-icon">${asset.fallback?.glyph ?? '◇'}</span>
          <span class="catalog-copy">
            <strong>${job.name}</strong>
            <small>${job.role}</small>
          </span>
          <span class="catalog-meta"><em>${badge}</em><b>${job.cost} G</b></span>
        </button>`;
    }).join('');

    this.elements.buildings.innerHTML = this.registry.list('buildings').map(building => {
      const asset = this.registry.get('assets', building.assetId);
      return `
        <button class="catalog-card" type="button" data-kind="building" data-id="${building.id}" data-cost="${building.cost}">
          <span class="catalog-icon">${asset.fallback?.glyph ?? '▦'}</span>
          <span class="catalog-copy">
            <strong>${building.name}</strong>
            <small>${building.role}</small>
          </span>
          <span class="catalog-meta"><em>TEMP</em><b>${building.cost} G</b></span>
        </button>`;
    }).join('');
  }

  renderState(state) {
    this.elements.phase.textContent = state.phaseLabel;
    this.elements.wave.textContent = `${state.waveNumber} · ${state.waveLabel}`;
    this.elements.gold.textContent = state.gold;
    this.elements.enemies.textContent = state.enemyCount;
    this.elements.defense.textContent = `${state.defenderCount}/${state.defenderCap} + ${state.buildingCount}`;
    this.elements.crystalValue.textContent = `${state.crystalHp} / ${state.crystalMaxHp}`;
    this.elements.crystalFill.style.width = `${Math.max(0, state.crystalHp / state.crystalMaxHp) * 100}%`;

    const buildPhase = state.phase === PHASE.BUILD;
    this.elements.start.disabled = !buildPhase;
    this.elements.startLabel.textContent = buildPhase ? `開始第 ${state.waveNumber} 波` : state.phaseLabel;
    this.elements.cancelSelection.disabled = !state.selection;
    this.elements.debug.classList.toggle('active', state.debug);

    for (const button of document.querySelectorAll('.catalog-card')) {
      const selected = state.selection?.kind === button.dataset.kind && state.selection?.id === button.dataset.id;
      button.classList.toggle('selected', selected);
      button.disabled = !buildPhase || Number(button.dataset.cost) > state.gold;
    }

    this.renderSelection(state);
    if (this.lastWaveNumber !== state.waveNumber) {
      this.renderForecast();
      this.lastWaveNumber = state.waveNumber;
    }

    const defeated = state.phase === PHASE.DEFEAT;
    this.elements.defeatPanel.hidden = !defeated;
    if (defeated) this.elements.defeatText.textContent = `守到第 ${state.waveNumber} 波，水晶能量歸零。`;
  }

  renderSelection(state) {
    if (state.inspected) {
      const entity = state.inspected;
      this.elements.selectionTitle.textContent = entity.name;
      this.elements.selectionBody.innerHTML = `
        <p>${entity.kind === 'building' ? '防守建築' : '部署單位'} · HP ${Math.ceil(entity.hp)} / ${entity.maxHp}</p>
        <dl>
          <div><dt>攻擊</dt><dd>${formatStat(entity.attack)}</dd></div>
          <div><dt>護甲</dt><dd>${Math.round(entity.armor * 100)}%</dd></div>
          <div><dt>射程</dt><dd>${formatStat(entity.attackRange)}</dd></div>
          <div><dt>技能</dt><dd>${entity.skillId ? this.registry.get('skills', entity.skillId).name : '—'}</dd></div>
        </dl>
        <p class="selection-note">部署階段可在棋盤上按右鍵拆除，返還 60% 費用。</p>`;
      return;
    }

    if (state.selection) {
      const definition = state.selection.kind === 'job'
        ? this.registry.get('jobs', state.selection.id)
        : this.registry.get('buildings', state.selection.id);
      this.elements.selectionTitle.textContent = definition.name;
      this.elements.selectionBody.innerHTML = `
        <p>${definition.description}</p>
        <dl>
          <div><dt>費用</dt><dd>${definition.cost} G</dd></div>
          <div><dt>生命</dt><dd>${definition.stats.hp}</dd></div>
          <div><dt>攻擊</dt><dd>${definition.stats.attack ?? '—'}</dd></div>
          <div><dt>阻路</dt><dd>${definition.blocksPath ? '是' : '否'}</dd></div>
        </dl>
        <p class="selection-note">點擊空格部署；選擇會保留，方便連續放置。</p>`;
      return;
    }

    this.elements.selectionTitle.textContent = '尚未選擇';
    this.elements.selectionBody.innerHTML = '<p>選擇職業或建築，然後點擊棋盤。點擊已部署單位可查看數值。</p>';
  }

  renderForecast() {
    this.elements.forecast.innerHTML = this.director.waveForecast().map(group => `
      <li>
        <span class="forecast-dir">${group.direction}</span>
        <span><strong>${group.monsterName}</strong><small>${group.directionLabel}入口</small></span>
        <b>×${group.count}</b>
      </li>`).join('');
  }

  renderAssetReport(report) {
    const directional = report.filter(row => row.runtime === 'directional-sprite').length;
    const staticSprites = report.filter(row => row.runtime === 'static-sprite').length;
    const placeholders = report.filter(row => row.runtime === 'placeholder').length;
    const errors = report.filter(row => row.runtime === 'fallback').length;
    const fallback = placeholders + errors;
    this.elements.assetStatus.textContent =
      `素材 runtime：${directional} 組動畫 · ${staticSprites} 組靜態圖 · ${fallback} 組替代元素` +
      (errors ? ` · ${errors} 組載入異常` : '');
    this.elements.assetStatus.classList.toggle('warn', fallback > 0);
  }

  showToast({ message, tone = 'info' }) {
    window.clearTimeout(this.toastTimer);
    this.elements.toast.textContent = message;
    this.elements.toast.className = `toast show ${toneClass[tone] ?? 'info'}`;
    this.toastTimer = window.setTimeout(() => {
      this.elements.toast.classList.remove('show');
    }, 2600);
  }

  destroy() {
    window.clearTimeout(this.toastTimer);
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.elements.jobs.removeEventListener('click', this.catalogHandler);
    this.elements.buildings.removeEventListener('click', this.catalogHandler);
    this.elements.start.removeEventListener('click', this.onStart);
    this.elements.cancelSelection.removeEventListener('click', this.onCancel);
    this.elements.debug.removeEventListener('click', this.onDebug);
    this.elements.reset.removeEventListener('click', this.onReset);
    this.elements.restart.removeEventListener('click', this.onReset);
  }
}
