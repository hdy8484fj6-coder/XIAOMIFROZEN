/* XiaomiFrozen — Privatgelände Tuner (kein Firmware-Flash) */
(function () {
  'use strict';

  const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  const NUS_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
  const NUS_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
  const MAX_ECO = 25, MAX_DRIVE = 30, MAX_SPORT = 35, KICK_MIN = 2;
  const LS_RIDES = 'xiaomifrozen_rides_v1';
  const LS_DEVICE = 'xiaomifrozen_last_device_v1';
  const LS_TUNE = 'xiaomifrozen_tune_v1';

  const MODELS = [
    { id:'mi4', name:'Xiaomi Electric Scooter 4', maker:'Brightway',
      motor:'300 W Nenn / 600 W Peak (Hall, bürstenlos)', battery:'275,4 Wh (T2201-BA3A, 7650 mAh)',
      stockSpeed:'Geh 6 / D 20 / S 25 km/h (DE oft 20)', range:'ca. 35 km', weight:'ca. 17,2 kg · 10″ Tubeless · IP54 · 110 kg',
      ble:'Verschlüsselt (Brightway). Nordic-UART-Klartext-Telemetrie im Browser i. d. R. nicht möglich.',
      tuning:'Kein SHU/SHFW über BLE. Community: UART/ST-Link-CFW (bw-patcher) — nicht über XiaomiFrozen.',
      notes:'Dein Modell. Config planen + Demo; echte 55-AA-Register wie M365/Pro2 hier nicht freigegeben.',
      shu:false, shfw:false, encrypted:true, featured:true },
    { id:'m365', name:'Xiaomi M365', maker:'Ninebot', motor:'250/500 W', battery:'280 Wh', stockSpeed:'25 km/h', range:'~30 km', weight:'~12,5 kg',
      ble:'Unverschlüsseltes 55 AA / Nordic UART (ältere BLE).', tuning:'SHU ja; SHFW nach Workaround.', notes:'', shu:true, shfw:null, encrypted:false },
    { id:'1s', name:'Xiaomi Mi 1S', maker:'Ninebot', motor:'250/500 W', battery:'275–280 Wh', stockSpeed:'25 km/h', range:'~30 km', weight:'~12,5 kg',
      ble:'Nordic UART / öffentliches Protokoll.', tuning:'SHU + SHFW.', notes:'', shu:true, shfw:true, encrypted:false },
    { id:'essential', name:'Xiaomi Essential', maker:'Ninebot', motor:'250/500 W', battery:'~187 Wh', stockSpeed:'20 km/h', range:'~20 km', weight:'~12 kg',
      ble:'Nordic UART.', tuning:'SHU + SHFW.', notes:'', shu:true, shfw:true, encrypted:false },
    { id:'pro', name:'Xiaomi Pro', maker:'Ninebot', motor:'300/600 W', battery:'474 Wh', stockSpeed:'25 km/h', range:'~45 km', weight:'~14,2 kg',
      ble:'Nordic UART.', tuning:'SHU + SHFW.', notes:'', shu:true, shfw:true, encrypted:false },
    { id:'pro2', name:'Xiaomi Pro 2', maker:'Ninebot', motor:'300/600 W', battery:'474 Wh', stockSpeed:'20/25 km/h', range:'~45 km', weight:'~14,2 kg',
      ble:'Nordic UART; neuere DRV ggf. ST-Link.', tuning:'SHU + SHFW.', notes:'', shu:true, shfw:true, encrypted:false },
    { id:'mi3', name:'Xiaomi Mi 3', maker:'Ninebot', motor:'300/600 W', battery:'275 Wh', stockSpeed:'25 km/h', range:'~30 km', weight:'~13,2 kg',
      ble:'Nordic UART.', tuning:'SHU + SHFW.', notes:'', shu:true, shfw:true, encrypted:false },
    { id:'mi4pro', name:'Xiaomi Scooter 4 Pro', maker:'Ninebot', motor:'350/700 W', battery:'446 Wh', stockSpeed:'20/25 km/h', range:'~55 km', weight:'~17 kg',
      ble:'Gesichert / kein Klartext-NUS-Tuning.', tuning:'Kein SHU/SHFW. CFW via NGFW/UART.', notes:'', shu:false, shfw:false, encrypted:true },
    { id:'mi4lite', name:'Xiaomi Scooter 4 Lite', maker:'Brightway', motor:'Peak ~300 W', battery:'~187 Wh', stockSpeed:'oft 20 km/h', range:'~20 km', weight:'~15,6 kg',
      ble:'Verschlüsselt (Brightway).', tuning:'Kein SHU/SHFW; Hardware-CFW.', notes:'', shu:false, shfw:false, encrypted:true },
    { id:'mi4ultra', name:'Xiaomi Scooter 4 Ultra', maker:'Brightway', motor:'500/940 W Heck', battery:'562 Wh', stockSpeed:'regionabhängig', range:'~70 km', weight:'~24,5 kg',
      ble:'Verschlüsselt (Brightway).', tuning:'Kein SHU/SHFW; Hardware-CFW.', notes:'', shu:false, shfw:false, encrypted:true }
  ];

  const PRESETS = {
    stock: { label:'Stock', eco:15, drive:20, sport:25, currentEco:10, currentDrive:15, currentSport:22, regen:1, brake:1, cruise:false, kers:true, panic:false, zeroStart:false, kick:2 },
    eco: { label:'Eco', eco:15, drive:20, sport:22, currentEco:8, currentDrive:12, currentSport:16, regen:2, brake:2, cruise:true, kers:true, panic:false, zeroStart:false, kick:2 },
    sport: { label:'Sport', eco:20, drive:25, sport:30, currentEco:12, currentDrive:18, currentSport:25, regen:1, brake:2, cruise:true, kers:true, panic:false, zeroStart:false, kick:2 },
    max: { label:'Max Privatgelände', eco:25, drive:30, sport:35, currentEco:14, currentDrive:20, currentSport:28, regen:2, brake:2, cruise:true, kers:true, panic:false, zeroStart:false, kick:2 }
  };

  const DEMO_DEVICES = [
    { id:'demo-mi4', name:'Demo Xiaomi Scooter 4', modelId:'mi4', rssi:-58 },
    { id:'demo-pro2', name:'Demo Xiaomi Pro 2', modelId:'pro2', rssi:-47 },
    { id:'demo-1s', name:'Demo Xiaomi 1S', modelId:'1s', rssi:-62 },
    { id:'demo-m365', name:'Demo Xiaomi M365', modelId:'m365', rssi:-71 },
    { id:'demo-mi3', name:'Demo Xiaomi Mi 3', modelId:'mi3', rssi:-55 }
  ];

  function checksum(bytes) {
    let sum = 0;
    for (let i = 0; i < bytes.length; i++) sum += bytes[i] & 0xff;
    const x = (0xffff ^ (sum & 0xffff)) & 0xffff;
    return [x & 0xff, (x >> 8) & 0xff];
  }
  function buildFrame(addr, cmd, arg, payload) {
    const pl = payload ? Array.from(payload) : [];
    const len = pl.length + 2;
    const body = [len, addr, cmd, arg, ...pl];
    const ck = checksum(body);
    return new Uint8Array([0x55, 0xaa, ...body, ...ck]);
  }
  function buildRead(reg, nbytes) { return buildFrame(0x20, 0x01, reg, [nbytes & 0xff]); }
  function parseFrames(buf) {
    const out = [];
    const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let i = 0;
    while (i + 6 <= u.length) {
      if (u[i] !== 0x55 || u[i + 1] !== 0xaa) { i++; continue; }
      const len = u[i + 2];
      const size = len + 6; // 55 AA + body(L bytes starting at L) + 2 ck = L+6
      if (i + size > u.length) break;
      const slice = u.slice(i, i + size);
      const body = slice.slice(2, slice.length - 2);
      const ck = checksum(body);
      if (ck[0] === slice[slice.length - 2] && ck[1] === slice[slice.length - 1]) {
        out.push({ len, addr: slice[3], cmd: slice[4], arg: slice[5], payload: slice.slice(6, slice.length - 2), raw: slice });
      }
      i += size;
    }
    return out;
  }
  function u16(p, o) { return p[o] | (p[o + 1] << 8); }
  function u32(p, o) { return (p[o] | (p[o + 1] << 8) | (p[o + 2] << 16) | (p[o + 3] << 24)) >>> 0; }
  function parseB0(payload) {
    if (!payload || payload.length < 22) return null;
    return {
      battery: payload[8],
      speed: u16(payload, 10) / 1000,
      avgSpeed: u16(payload, 12) / 1000,
      odometer: u32(payload, 14) / 1000,
      temperature: u16(payload, 20) / 10
    };
  }
  function parseFw(payload) {
    if (!payload || payload.length < 2) return null;
    const a = payload[0], b = payload[1];
    return `${b}.${(a >> 4) & 0xf}.${a & 0xf}`;
  }
  // Voltage: not in classic B0; some builds expose nearby words — we only show when known.
  function parseVoltageFromExtra(payload) {
    // Placeholder: public B0 map does not guarantee pack voltage at a fixed offset.
    return null;
  }

  window.XiaomiFrozenProtocol = { checksum, buildFrame, buildRead, parseFrames, parseB0, parseFw, NUS_SERVICE, NUS_RX, NUS_TX };

  const state = {
    modelId: 'mi4',
    tune: { ...PRESETS.stock },
    activePreset: 'stock',
    screen: 'scan',
    tab: 'Info',
    scanning: false,
    scanTimer: null,
    found: [],
    ble: { device:null, server:null, writeChar:null, notifyChar:null, connected:false, reconnecting:false, wantConnect:false, pollTimer:null, reconnectTimer:null, backoff:1000, name:'', rssi:null },
    telemetry: { battery:null, speed:0, fw:null, odo:null, temp:null, tempMotor:null, voltage:null, power:null },
    demo: { on:false, timer:null, target:12 },
    ride: { active:false, t0:0, dist:0, maxSpd:0, sumSpd:0, samples:0, batt0:null, timer:null },
    lastTick: performance.now()
  };

  const $ = (id) => document.getElementById(id);
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const currentModel = () => MODELS.find((m) => m.id === state.modelId) || MODELS[0];

  function clampTune(t) {
    const o = { ...t };
    o.eco = Math.min(MAX_ECO, Math.max(0, +o.eco || 0));
    o.drive = Math.min(MAX_DRIVE, Math.max(0, +o.drive || 0));
    o.sport = Math.min(MAX_SPORT, Math.max(0, +o.sport || 0));
    o.kick = Math.max(KICK_MIN, Math.min(10, +o.kick || KICK_MIN));
    o.currentEco = Math.min(30, Math.max(1, +o.currentEco || 1));
    o.currentDrive = Math.min(40, Math.max(1, +o.currentDrive || 1));
    o.currentSport = Math.min(50, Math.max(1, +o.currentSport || 1));
    o.regen = Math.min(2, Math.max(0, +o.regen || 0));
    o.brake = Math.min(2, Math.max(0, +o.brake || 0));
    o.cruise = !!o.cruise; o.kers = !!o.kers; o.panic = !!o.panic; o.zeroStart = !!o.zeroStart;
    if (o.zeroStart) o.kick = 0; else if (o.kick < KICK_MIN) o.kick = KICK_MIN;
    return o;
  }

  function estimatePower(speed, batt) {
    batt = batt == null ? 80 : batt;
    return Math.round(Math.min(600, Math.max(0, speed * 14 * (0.7 + batt / 200))));
  }

  function showScreen(name) {
    state.screen = name;
    $('screenScan').hidden = name !== 'scan';
    $('screenApp').hidden = name !== 'app';
  }

  function setTab(tab) {
    state.tab = tab;
    ['Info', 'Tools', 'Flash', 'Config'].forEach((t) => {
      const pane = $('tab' + t);
      if (pane) pane.hidden = t !== tab;
    });
    document.querySelectorAll('.tabbar .tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'Flash') renderFlash();
    if (tab === 'Config') syncConfigInputs();
    if (tab === 'Tools') renderModelCard($('modelCardTools'));
  }

  function setDemoUi(on) {
    state.demo.on = on;
    $('demoBanner').hidden = !on;
    $('btnFlask').classList.toggle('active', on);
    $('btnFlask2').classList.toggle('active', on);
    $('demoControls').hidden = !on;
    $('scanSubtitle').textContent = on ? 'Demo-Modus — Scooter wählen' : 'Wähle deinen Scooter, um fortzufahren';
    updateMein();
  }

  function rssiClass(rssi) {
    if (rssi == null) return 's2';
    if (rssi > -50) return 's4';
    if (rssi > -60) return 's3';
    if (rssi > -70) return 's2';
    return 's1';
  }
  function rssiBars(rssi) {
    const c = rssiClass(rssi);
    return `<div class="rssi ${c}" title="${rssi != null ? rssi + ' dBm' : ''}"><span></span><span></span><span></span><span></span></div>`;
  }

  function renderDeviceList(list) {
    const box = $('deviceList');
    if (!list.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = list.map((d) => {
      const m = MODELS.find((x) => x.id === d.modelId) || currentModel();
      return `<button type="button" class="device-card" data-id="${d.id}">
        <div class="device-icon">🛴</div>
        <div><div class="name">${d.name}</div><div class="model">${m.name}</div></div>
        ${rssiBars(d.rssi)}
      </button>`;
    }).join('');
    box.querySelectorAll('.device-card').forEach((btn) => {
      btn.addEventListener('click', () => selectDevice(btn.dataset.id));
    });
  }

  function selectDevice(id) {
    const demo = DEMO_DEVICES.find((d) => d.id === id);
    if (demo) {
      state.modelId = demo.modelId;
      state.ble.name = demo.name;
      state.ble.rssi = demo.rssi;
      if (!state.demo.on) setDemoUi(true);
      startDemo();
      enterApp();
      return;
    }
  }

  function enterApp() {
    showScreen('app');
    $('hdrName').textContent = state.ble.name || 'Scooter';
    $('hdrModel').textContent = currentModel().name;
    $('modelSelect').value = state.modelId;
    renderModelCard($('modelCard'));
    renderFlash();
    syncConfigInputs();
    updateMein();
    setTab(state.tab || 'Info');
  }

  function renderModelCard(el) {
    if (!el) return;
    const m = currentModel();
    const b = (ok, y, n) => `<span class="badge ${ok === true ? 'ok' : ok === false ? 'no' : 'warn'}">${ok === true ? y : ok === false ? n : 'unbekannt'}</span>`;
    el.innerHTML = `<h3>${m.name}</h3>
      <div class="badge-row">
        <span class="badge">${m.maker}</span>${b(m.shu,'SHU ja','SHU nein')}${b(m.shfw,'SHFW ja','SHFW nein')}
        <span class="badge ${m.encrypted ? 'no' : 'ok'}">${m.encrypted ? 'BLE verschlüsselt' : 'BLE offen'}</span>
      </div>
      <div class="specs">
        <div><span>Motor</span>${m.motor}</div>
        <div><span>Akku</span>${m.battery}</div>
        <div><span>Serie</span>${m.stockSpeed}</div>
        <div><span>Reichweite / Bau</span>${m.range} · ${m.weight}</div>
      </div>
      <p class="tuning-note"><strong>BLE:</strong> ${m.ble}</p>
      <p class="tuning-note"><strong>Tuning:</strong> ${m.tuning}</p>
      ${m.notes ? `<p class="tuning-note"><strong>Hinweis:</strong> ${m.notes}</p>` : ''}`;
  }

  function renderFlash() {
    const m = currentModel();
    let html = '';
    if (m.encrypted || (!m.shu && !m.shfw)) {
      html = `<p><strong>${m.name}</strong> — kein sicheres Web-BLE-Flash.</p>
        <p>SHU: ${m.shu ? 'ja' : 'nein'} · SHFW: ${m.shfw ? 'ja' : 'nein'} · BLE: ${m.encrypted ? 'verschlüsselt' : 'offen'}.</p>
        <p>Nutze Community-Tools (ScooterHacking Utility / Hardware-CFW). XiaomiFrozen lädt nur Hinweise, schreibt keine Firmware.</p>`;
    } else {
      html = `<p><strong>${m.name}</strong> — Community-Flash möglich (SHU/SHFW), aber <em>nicht</em> in dieser Web-App.</p>
        <p>Exportiere deine Config und übertrage Werte manuell in ScooterHacking Utility / SHFW.</p>`;
    }
    $('flashStatus').innerHTML = html;
  }

  function renderPresets() {
    $('presets').innerHTML = Object.entries(PRESETS).map(([k, p]) =>
      `<button type="button" class="preset-btn${state.activePreset === k ? ' active' : ''}" data-preset="${k}">${p.label}</button>`
    ).join('');
    $('presets').querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activePreset = btn.dataset.preset;
        state.tune = clampTune({ ...PRESETS[state.activePreset] });
        renderPresets(); syncConfigInputs(); renderSliders(); refreshExport(); persistTune();
      });
    });
  }

  function renderSliders() {
    const t = state.tune;
    const kickDisabled = !!t.zeroStart;
    $('sliders').innerHTML = `
      <div class="slider-row"><header><span>Anfahrgeschwindigkeit (Anschieben)</span><output id="out_kick">${kickDisabled ? '0 (Zero Start)' : t.kick + ' km/h'}</output></header>
        <input type="range" id="sl_kick" min="${KICK_MIN}" max="6" step="0.5" value="${Math.max(KICK_MIN, t.kick || KICK_MIN)}" ${kickDisabled ? 'disabled' : ''}/></div>
      <div class="slider-row"><header><span>Motorstrom Eco</span><output>${t.currentEco} A</output></header>
        <input type="range" id="sl_currentEco" min="5" max="20" value="${t.currentEco}"/></div>
      <div class="slider-row"><header><span>Motorstrom Drive</span><output>${t.currentDrive} A</output></header>
        <input type="range" id="sl_currentDrive" min="5" max="30" value="${t.currentDrive}"/></div>
      <div class="slider-row"><header><span>Motorstrom Sport</span><output>${t.currentSport} A</output></header>
        <input type="range" id="sl_currentSport" min="5" max="35" value="${t.currentSport}"/></div>
      <div class="slider-row"><header><span>Rekuperation</span><output id="out_regen"></output></header>
        <input type="range" id="sl_regen" min="0" max="2" value="${t.regen}"/></div>
      <div class="slider-row"><header><span>E-Bremse</span><output id="out_brake"></output></header>
        <input type="range" id="sl_brake" min="0" max="2" value="${t.brake}"/></div>`;
    const labels = { 0:'schwach', 1:'mittel', 2:'stark' };
    $('out_regen').textContent = labels[t.regen];
    $('out_brake').textContent = labels[t.brake];
    ['kick','currentEco','currentDrive','currentSport','regen','brake'].forEach((key) => {
      const inp = $('sl_' + key);
      if (!inp) return;
      inp.addEventListener('input', () => {
        let v = parseFloat(inp.value);
        if (key === 'kick' && !state.tune.zeroStart) v = Math.max(KICK_MIN, v);
        state.tune[key] = v;
        state.tune = clampTune(state.tune);
        state.activePreset = 'custom';
        renderSliders(); refreshExport(); persistTune();
        $('dKick').textContent = state.tune.zeroStart ? '0 (Zero)' : `${state.tune.kick} km/h`;
        updateKickState(state.telemetry.speed);
      });
    });
  }

  function syncConfigInputs() {
    const t = clampTune(state.tune);
    state.tune = t;
    $('num_eco').value = t.eco;
    $('num_drive').value = t.drive;
    $('num_sport').value = t.sport;
    $('tg_panic').checked = t.panic;
    $('tg_cruise').checked = t.cruise;
    $('tg_zerostart').checked = t.zeroStart;
    $('tg_kers').checked = t.kers;
    $('dKick').textContent = t.zeroStart ? '0 (Zero)' : `${t.kick} km/h`;
    renderModelCard($('modelCard'));
    renderPresets();
    renderSliders();
    refreshExport();
    updateCfgConn();
  }

  function updateCfgConn() {
    const el = $('cfgConn');
    if (state.ble.connected) el.innerHTML = '<span class="dot on"></span> Verbunden';
    else if (state.demo.on) el.innerHTML = '<span class="dot sim"></span> Demo';
    else el.innerHTML = '<span class="dot"></span> Getrennt';
  }

  function refreshExport() {
    const m = currentModel();
    const payload = {
      app: 'XiaomiFrozen',
      purpose: 'Privatgelände-Konfiguration — kein Flash',
      legal: 'Nur Privatgelände. Nicht eKFV-konform bei >20 km/h auf öffentl. Wegen (DE).',
      model: { id: m.id, name: m.name, maker: m.maker, encryptedBle: m.encrypted },
      limits: { ecoMax: MAX_ECO, driveMax: MAX_DRIVE, sportMax: MAX_SPORT, kickMinKmh: KICK_MIN },
      config: clampTune(state.tune),
      preset: state.activePreset,
      flashHint: (m.shfw || m.shu)
        ? 'Flash extern: ScooterHacking Utility / SHFW. Diese Web-App flasht nicht.'
        : 'Kein SHFW/SHU über BLE für dieses Modell. Community-Hardware — XiaomiFrozen flasht nichts.',
      exportedAt: new Date().toISOString()
    };
    $('exportOut').textContent = JSON.stringify(payload, null, 2);
  }

  function persistTune() {
    try { localStorage.setItem(LS_TUNE, JSON.stringify({ modelId: state.modelId, tune: state.tune, preset: state.activePreset })); } catch (_) {}
  }
  function restoreTune() {
    try {
      const data = JSON.parse(localStorage.getItem(LS_TUNE) || 'null');
      if (!data) return;
      if (data.modelId) state.modelId = data.modelId;
      if (data.tune) state.tune = clampTune(data.tune);
      if (data.preset) state.activePreset = data.preset;
    } catch (_) {}
  }

  function setGauge(speed) {
    const max = MAX_SPORT;
    const s = Math.max(0, Math.min(max, speed));
    const t = s / max;
    $('gaugeArc').style.strokeDashoffset = String(251.2 * (1 - t));
    $('gaugeNeedle').setAttribute('transform', `rotate(${-90 + t * 180} 100 120)`);
    $('gaugeSpeed').textContent = s.toFixed(1);
  }

  function updateKickState(speed) {
    const el = $('kickState');
    if (state.tune.zeroStart) {
      el.textContent = 'Zero Start';
      el.style.color = 'var(--ok)';
      return;
    }
    const kick = state.tune.kick || KICK_MIN;
    if (speed < kick) {
      el.textContent = `Anschieben (< ${kick} km/h)`;
      el.style.color = 'var(--warn)';
    } else {
      el.textContent = 'Motor freigegeben';
      el.style.color = 'var(--ok)';
    }
  }

  function applyTelemetry(partial) {
    Object.assign(state.telemetry, partial);
    const t = state.telemetry;
    const spd = t.speed || 0;
    setGauge(spd);
    updateKickState(spd);
    $('dBatt').textContent = t.battery != null ? `${t.battery} %` : '—';
    $('dVolt').textContent = t.voltage != null ? `${t.voltage.toFixed(1)} V` : '—';
    $('dTemp').textContent = t.temp != null ? `${t.temp.toFixed(1)} °C` : '—';
    $('dTempMotor').textContent = t.tempMotor != null ? `${t.tempMotor.toFixed(1)} °C` : '—';
    const pwr = estimatePower(spd, t.battery);
    t.power = pwr;
    $('dPower').textContent = `${pwr} W`;
    $('tFw').textContent = t.fw || '—';
    $('tOdo').textContent = t.odo != null ? `${Number(t.odo).toFixed(1)} km` : '—';
    $('tSpeed').textContent = `${spd.toFixed(1)} km/h`;
    $('tDevice').textContent = state.ble.name || '—';
    updateMein();
    if (state.ride.active) rideSample(spd, t.battery);
  }

  function setDashMode(mode) {
    const pill = $('gaugePill'), chip = $('dashModeChip');
    pill.classList.remove('demo', 'live');
    if (mode === 'live') { pill.textContent = 'Live BLE'; pill.classList.add('live'); chip.textContent = 'Live'; }
    else if (mode === 'demo') { pill.textContent = 'Demo-Modus'; pill.classList.add('demo'); chip.textContent = 'Demo'; }
    else { pill.textContent = 'Bereit'; chip.textContent = 'Idle'; }
  }

  function updateMein() {
    let st = 'getrennt';
    if (state.ble.reconnecting) st = 'verbinde neu…';
    else if (state.ble.connected) st = 'verbunden';
    else if (state.demo.on) st = 'Demo';
    $('msState').textContent = st;
    $('msBatt').textContent = state.telemetry.battery != null ? `${state.telemetry.battery} %` : '—';
    $('msRssi').textContent = state.ble.rssi != null ? `${state.ble.rssi} dBm` : '—';
    const dot = $('bleDot');
    dot.className = 'dot' + (state.ble.connected ? ' on' : state.demo.on ? ' sim' : state.ble.reconnecting ? ' warn' : '');
    updateCfgConn();
  }

  // —— BLE ——
  function scanMsg(text, cls) {
    const el = $('scanMsg');
    el.textContent = text || '';
    el.className = 'msg' + (cls ? ' ' + cls : '');
  }

  async function startScanFlow() {
    const model = currentModel();
    if (state.demo.on) {
      $('scanTitle').textContent = 'Demo-Geräte';
      renderDeviceList(DEMO_DEVICES);
      return;
    }
    if (!navigator.bluetooth || !navigator.bluetooth.requestDevice) {
      scanMsg('Web Bluetooth fehlt. Auf dem iPhone: Bluefy öffnen.', 'error');
      return;
    }
    state.scanning = true;
    $('btnScan').classList.add('scanning');
    $('scanTitle').textContent = 'Suche nach Scootern…';
    scanMsg('Geräteauswahl öffnen…');
    try {
      let device = null;
      if (navigator.bluetooth.getDevices) {
        try {
          const remembered = await navigator.bluetooth.getDevices();
          const lastId = localStorage.getItem(LS_DEVICE);
          device = remembered.find((d) => d.id === lastId) || null;
        } catch (_) {}
      }
      if (!device) {
        // Alle Geräte anzeigen, damit auch der Scooter 4 (anderer Name/verschlüsselt) auftaucht
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [NUS_SERVICE, 'battery_service', 'device_information']
        });
      }
      await connectDevice(device);
    } catch (err) {
      if (err && err.name === 'NotFoundError') scanMsg('Keine Auswahl / Abbruch.', 'warn');
      else {
        scanMsg(`Fehler: ${err.message || err}`, 'error');
        if (model.encrypted) scanMsg('Scooter 4 / Brightway oft verschlüsselt — Demo-Modus (⚗) nutzen.', 'warn');
      }
    } finally {
      state.scanning = false;
      $('btnScan').classList.remove('scanning');
    }
  }

  async function connectDevice(device) {
    const model = currentModel();
    state.ble.wantConnect = true;
    state.ble.device = device;
    state.ble.name = device.name || 'Xiaomi/Ninebot';
    try { localStorage.setItem(LS_DEVICE, device.id || state.ble.name); } catch (_) {}
    if (!device.__xfListener) { device.addEventListener('gattserverdisconnected', onDisconnected); device.__xfListener = true; }
    scanMsg('GATT wird aufgebaut…');
    const server = await device.gatt.connect();
    state.ble.server = server;
    let service;
    try {
      service = await server.getPrimaryService(NUS_SERVICE);
    } catch (err) {
      // Kein offener Xiaomi-Datenkanal (z.B. Scooter 4): Verbindung trotzdem halten,
      // Name + Status anzeigen und Standard-Akku-Dienst versuchen.
      state.ble.connected = true;
      state.ble.reconnecting = false;
      state.ble.backoff = 1000;
      state.ble.limited = true;
      stopDemoTimersOnly();
      enterApp();
      setDashMode('live');
      updateMein();
      if (!gpsOn()) startGps();
      scanMsg(`Verbunden: ${state.ble.name}` + (model.encrypted ? ' (Scooter 4: Live-Tempo verschlüsselt, Verbindung + Status aktiv)' : ' (eingeschränkter Modus)'), 'warn');
      try {
        const bsvc = await server.getPrimaryService('battery_service');
        const bch = await bsvc.getCharacteristic('battery_level');
        const v = await bch.readValue();
        applyTelemetry({ battery: v.getUint8(0) });
        try {
          await bch.startNotifications();
          bch.addEventListener('characteristicvaluechanged', (e) => applyTelemetry({ battery: e.target.value.getUint8(0) }));
        } catch (_) {}
      } catch (_) {}
      return;
    }
    state.ble.limited = false;
    state.ble.writeChar = await service.getCharacteristic(NUS_RX);
    state.ble.notifyChar = await service.getCharacteristic(NUS_TX);
    await state.ble.notifyChar.startNotifications();
    state.ble.notifyChar.addEventListener('characteristicvaluechanged', onNotify);
    state.ble.connected = true;
    state.ble.reconnecting = false;
    state.ble.backoff = 1000;
    stopDemoTimersOnly();
    setDashMode('live');
    enterApp();
    scanMsg(`Verbunden: ${state.ble.name}`);
    await bleWrite(buildRead(0x1a, 2));
    startPoll();
  }

  async function bleWrite(frame) {
    if (!state.ble.writeChar) return;
    try {
      if (state.ble.writeChar.writeValueWithoutResponse) await state.ble.writeChar.writeValueWithoutResponse(frame);
      else await state.ble.writeChar.writeValue(frame);
    } catch (e) { console.warn('BLE write', e); }
  }

  function startPoll() {
    stopPoll();
    let tick = 0;
    state.ble.pollTimer = setInterval(() => {
      if (!state.ble.connected) return;
      if (tick % 8 === 7) bleWrite(buildRead(0x1a, 2));
      else if (tick % 5 === 4) bleWrite(buildRead(0x25, 2)); // range / related
      else bleWrite(buildRead(0xb0, 0x20));
      tick++;
    }, 500);
  }
  function stopPoll() {
    if (state.ble.pollTimer) { clearInterval(state.ble.pollTimer); state.ble.pollTimer = null; }
  }

  function onNotify(ev) {
    const frames = parseFrames(new Uint8Array(ev.target.value.buffer));
    for (const f of frames) {
      if (f.arg === 0xb0) {
        const t = parseB0(f.payload);
        if (t) {
          const volt = parseVoltageFromExtra(f.payload);
          applyTelemetry({
            battery: t.battery, speed: t.speed, odo: t.odometer, temp: t.temperature,
            tempMotor: null,
            voltage: volt
          });
        }
      } else if (f.arg === 0x1a) {
        const fw = parseFw(f.payload);
        if (fw) applyTelemetry({ fw });
      }
    }
  }

  function onDisconnected() {
    state.ble.connected = false;
    stopPoll();
    updateMein();
    if (state.ble.wantConnect) scheduleReconnect();
  }

  function scheduleReconnect() {
    if (state.ble.reconnectTimer) return;
    state.ble.reconnecting = true;
    updateMein();
    const wait = state.ble.backoff;
    state.ble.backoff = Math.min(15000, Math.round(state.ble.backoff * 1.6));
    state.ble.reconnectTimer = setTimeout(async () => {
      state.ble.reconnectTimer = null;
      if (!state.ble.wantConnect) return;
      const dev = state.ble.device;
      if (dev && dev.gatt) {
        try { await connectDevice(dev); return; } catch (_) {}
      }
      scheduleReconnect();
    }, wait);
  }

  async function safeDisconnect(clearWant = true) {
    stopPoll();
    if (clearWant) state.ble.wantConnect = false;
    state.ble.reconnecting = false;
    if (state.ble.reconnectTimer) { clearTimeout(state.ble.reconnectTimer); state.ble.reconnectTimer = null; }
    try {
      if (state.ble.notifyChar) { try { await state.ble.notifyChar.stopNotifications(); } catch (_) {} }
      if (state.ble.device && state.ble.device.gatt && state.ble.device.gatt.connected) state.ble.device.gatt.disconnect();
    } catch (_) {}
    state.ble.connected = false;
    state.ble.writeChar = null;
    state.ble.notifyChar = null;
    updateMein();
  }

  // —— Demo ——
  function startDemo() {
    setDemoUi(true);
    setDashMode('demo');
    if (state.demo.timer) clearInterval(state.demo.timer);
    let phase = 0;
    state.demo.timer = setInterval(() => {
      phase += 0.05;
      const target = parseFloat($('demoSpeed').value) || 12;
      const speed = Math.max(0, Math.min(MAX_SPORT, target + Math.sin(phase) * 1.2));
      const batt = Math.max(5, Math.round(88 - phase * 0.02));
      const temp = 28 + Math.sin(phase * 0.3) * 2;
      const tempMotor = temp + 8 + Math.sin(phase * 0.2);
      // Demo pack voltage ~36V class: 30–42 V
      const voltage = 36 + (batt - 50) * 0.08 + Math.sin(phase) * 0.05;
      applyTelemetry({
        battery: batt, speed, temp: Math.round(temp * 10) / 10,
        tempMotor: Math.round(tempMotor * 10) / 10,
        voltage: Math.round(voltage * 10) / 10,
        fw: state.telemetry.fw || 'Demo',
        odo: state.telemetry.odo != null ? state.telemetry.odo : 12.3
      });
      state.ble.rssi = state.ble.rssi != null ? state.ble.rssi : -55;
    }, 200);
  }
  function stopDemoTimersOnly() {
    if (state.demo.timer) { clearInterval(state.demo.timer); state.demo.timer = null; }
  }
  function stopDemo() {
    stopDemoTimersOnly();
    setDemoUi(false);
    if (!state.ble.connected) {
      setDashMode('idle');
      applyTelemetry({ speed: 0, battery: null, voltage: null, temp: null, tempMotor: null });
    }
    renderDeviceList([]);
    $('scanTitle').textContent = 'Suche nach Scootern…';
  }

  // —— GPS-Live-Tacho (funktioniert mit jedem Scooter, auch Scooter 4) ——
  const gps = { watch:null, last:null, smooth:0 };
  function gpsDist(a, b) {
    const R = 6371000, r = Math.PI / 180;
    const dLat = (b.latitude - a.latitude) * r, dLon = (b.longitude - a.longitude) * r;
    const x = Math.sin(dLat/2)**2 + Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function onGps(pos) {
    const c = pos.coords;
    let kmh = (c.speed != null && !isNaN(c.speed) && c.speed >= 0) ? c.speed * 3.6 : null;
    if (kmh == null && gps.last) {
      const dt = (pos.timestamp - gps.last.t) / 1000;
      if (dt > 0.5) kmh = (gpsDist(gps.last.c, c) / dt) * 3.6;
    }
    gps.last = { c, t: pos.timestamp };
    if (kmh == null) kmh = 0;
    if (kmh < 1) kmh = 0;
    gps.smooth = gps.smooth * 0.4 + kmh * 0.6;
    $('gpsInfo').textContent = `GPS aktiv · ±${Math.round(c.accuracy)} m`;
    const pill = $('gaugePill'); pill.textContent = 'Live GPS'; pill.classList.remove('demo'); pill.classList.add('live');
    $('dashModeChip').textContent = 'Live';
    applyTelemetry({ speed: Math.round(gps.smooth * 10) / 10 });
  }
  function startGps() {
    if (!navigator.geolocation) { $('gpsInfo').textContent = 'GPS nicht verfügbar'; return; }
    if (state.demo.on) { try { stopDemo(); } catch (_) { stopDemoTimersOnly(); } }
    $('gpsInfo').textContent = 'GPS sucht…';
    gps.watch = navigator.geolocation.watchPosition(onGps, (e) => {
      $('gpsInfo').textContent = e.code === 1 ? 'Standort erlauben (Einstellungen → Bluefy → Standort)' : 'GPS-Fehler, draußen besser';
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    $('btnGps').textContent = 'GPS-Tacho stoppen';
  }
  function stopGps() {
    if (gps.watch != null) navigator.geolocation.clearWatch(gps.watch);
    gps.watch = null; gps.last = null; gps.smooth = 0;
    $('btnGps').textContent = 'GPS-Tacho starten';
    $('gpsInfo').textContent = 'GPS aus';
    applyTelemetry({ speed: 0 });
  }
  function gpsOn() { return gps.watch != null; }

  // —— Rides ——
  function loadRides() { try { return JSON.parse(localStorage.getItem(LS_RIDES) || '[]'); } catch { return []; } }
  function saveRides(list) { localStorage.setItem(LS_RIDES, JSON.stringify(list.slice(0, 50))); }
  function fmtDur(ms) {
    const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }
  function rideSample(speed, batt) {
    const now = performance.now();
    const dt = Math.min(2, (now - state.lastTick) / 1000);
    state.lastTick = now;
    state.ride.dist += (speed / 3600) * dt;
    state.ride.maxSpd = Math.max(state.ride.maxSpd, speed);
    state.ride.sumSpd += speed; state.ride.samples++;
    if (state.ride.batt0 == null && batt != null) state.ride.batt0 = batt;
    renderRideLive(batt);
  }
  function renderRideLive(batt) {
    if (!state.ride.active) return;
    const elapsed = Date.now() - state.ride.t0;
    const avg = state.ride.samples ? state.ride.sumSpd / state.ride.samples : 0;
    $('rDur').textContent = fmtDur(elapsed);
    $('rDist').textContent = `${state.ride.dist.toFixed(2)} km`;
    $('rSpd').textContent = `${avg.toFixed(1)} / ${state.ride.maxSpd.toFixed(1)}`;
    if (state.ride.batt0 != null && batt != null) $('rBatt').textContent = `${Math.max(0, state.ride.batt0 - batt)} %`;
  }
  function renderHistory() {
    const list = loadRides();
    const ul = $('rideHistory');
    if (!list.length) ul.innerHTML = '<p class="empty">Noch keine Fahrten gespeichert.</p>';
    else ul.innerHTML = list.map((r) => `<li><strong>${r.date}</strong> · ${r.model}<div class="meta">${r.distanceKm.toFixed(2)} km · ${r.duration} · Ø ${r.avgSpeed.toFixed(1)} · Max ${r.maxSpeed.toFixed(1)} · −${r.batteryUsed ?? '?'}%</div></li>`).join('');
    drawChart(list);
  }
  function drawChart(list) {
    const canvas = $('rideChart'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(3,18,32,.3)'; ctx.fillRect(0, 0, w, h);
    const data = list.slice(0, 12).reverse();
    if (!data.length) {
      ctx.fillStyle = '#8fb6cc'; ctx.font = '14px sans-serif';
      ctx.fillText('Strecken-Chart nach erster Fahrt', 16, h / 2); return;
    }
    const maxD = Math.max(...data.map((d) => d.distanceKm), 0.1);
    const barW = Math.min(48, (w - 40) / data.length - 8);
    data.forEach((d, i) => {
      const bh = (d.distanceKm / maxD) * (h - 40);
      const x = 24 + i * (barW + 8), y = h - 20 - bh;
      const g = ctx.createLinearGradient(0, y, 0, h);
      g.addColorStop(0, '#67e8f9'); g.addColorStop(1, '#2563eb');
      ctx.fillStyle = g; ctx.fillRect(x, y, barW, bh);
    });
  }
  function startRide() {
    state.ride = { active:true, t0:Date.now(), dist:0, maxSpd:0, sumSpd:0, samples:0, batt0:state.telemetry.battery, timer:null };
    state.lastTick = performance.now();
    $('btnRideStart').disabled = true; $('btnRideStop').disabled = false;
    if (!state.ble.connected && !state.demo.on && !gpsOn()) startGps();
    state.ride.timer = setInterval(() => renderRideLive(state.telemetry.battery), 500);
  }
  function stopRide() {
    if (!state.ride.active) return;
    const elapsed = Date.now() - state.ride.t0;
    const avg = state.ride.samples ? state.ride.sumSpd / state.ride.samples : 0;
    const battUsed = (state.ride.batt0 != null && state.telemetry.battery != null) ? Math.max(0, state.ride.batt0 - state.telemetry.battery) : null;
    const list = loadRides();
    list.unshift({ date:new Date().toLocaleString('de-DE',{timeZone:'Europe/Berlin'}), model:currentModel().name, distanceKm:state.ride.dist, duration:fmtDur(elapsed), avgSpeed:avg, maxSpeed:state.ride.maxSpd, batteryUsed:battUsed });
    saveRides(list);
    state.ride.active = false;
    if (state.ride.timer) clearInterval(state.ride.timer);
    $('btnRideStart').disabled = false; $('btnRideStop').disabled = true;
    renderHistory();
  }

  function fillModels() {
    $('modelSelect').innerHTML = MODELS.map((m) => `<option value="${m.id}">${m.name}${m.featured ? ' ★' : ''}</option>`).join('');
    $('modelSelect').value = state.modelId;
    $('modelsSheetList').innerHTML = MODELS.map((m) =>
      `<div class="model-card" style="margin-bottom:8px"><strong>${m.name}</strong><div class="badge-row">
        <span class="badge ${m.encrypted?'no':'ok'}">${m.encrypted?'verschlüsselt':'offen'}</span>
        <span class="badge">${m.maker}</span></div>
        <p class="tuning-note">${m.tuning}</p></div>`
    ).join('');
  }

  function featureDetect() {
    const hasBt = !!(navigator.bluetooth && navigator.bluetooth.requestDevice);
    if (!hasBt) {
      $('iosHint').hidden = false;
      $('iosHint').innerHTML = isIOS()
        ? '<strong>iPhone:</strong> Safari hat kein Web Bluetooth. Öffne <strong>XiaomiFrozen</strong> in <a href="https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055" target="_blank" rel="noopener">Bluefy</a>.'
        : '<strong>Web Bluetooth nicht verfügbar.</strong> Chrome/Edge oder iPhone-<a href="https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055" target="_blank" rel="noopener">Bluefy</a>. HTTPS/localhost nötig.';
    } else if (isIOS()) {
      $('iosHint').hidden = false;
      $('iosHint').innerHTML = '<strong>iPhone + Bluefy:</strong> Web Bluetooth erkannt. Tippe den Bluetooth-Button.';
    }
  }

  function bind() {
    $('btnScan').addEventListener('click', startScanFlow);
    $('btnFlask').addEventListener('click', () => { if (state.demo.on) stopDemo(); else { setDemoUi(true); renderDeviceList(DEMO_DEVICES); $('scanTitle').textContent = 'Demo-Geräte'; } });
    $('btnFlask2').addEventListener('click', () => { if (state.demo.on) stopDemo(); else startDemo(); });
    $('btnDemoExit').addEventListener('click', stopDemo);
    $('btnGear').addEventListener('click', () => $('settingsSheet').showModal());
    $('btnGear2').addEventListener('click', () => $('settingsSheet').showModal());
    $('btnModelsLink').addEventListener('click', () => $('modelsSheet').showModal());
    $('btnCloseModels').addEventListener('click', () => $('modelsSheet').close());
    $('btnBack').addEventListener('click', async () => {
      await safeDisconnect(true);
      stopDemo();
      showScreen('scan');
      $('scanTitle').textContent = 'Suche nach Scootern…';
    });
    document.querySelectorAll('.tabbar .tab').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
    $('modelSelect').addEventListener('change', () => {
      state.modelId = $('modelSelect').value;
      $('hdrModel').textContent = currentModel().name;
      renderModelCard($('modelCard'));
      renderFlash(); refreshExport(); persistTune();
    });
    ['eco','drive','sport'].forEach((key) => {
      $(`num_${key}`).addEventListener('change', () => {
        let v = parseFloat($(`num_${key}`).value) || 0;
        if (key === 'eco') v = Math.min(MAX_ECO, v);
        if (key === 'drive') v = Math.min(MAX_DRIVE, v);
        if (key === 'sport') v = Math.min(MAX_SPORT, v);
        state.tune[key] = Math.max(0, v);
        state.tune = clampTune(state.tune);
        state.activePreset = 'custom';
        syncConfigInputs(); persistTune();
      });
    });
    ['panic','cruise','kers'].forEach((k) => {
      $('tg_' + k).addEventListener('change', (e) => {
        state.tune[k] = e.target.checked;
        state.activePreset = 'custom';
        refreshExport(); persistTune();
      });
    });
    $('tg_zerostart').addEventListener('change', (e) => {
      state.tune.zeroStart = e.target.checked;
      if (state.tune.zeroStart) state.tune.kick = 0;
      else state.tune.kick = Math.max(KICK_MIN, state.tune.kick || KICK_MIN);
      state.tune = clampTune(state.tune);
      state.activePreset = 'custom';
      syncConfigInputs(); updateKickState(state.telemetry.speed); persistTune();
    });
    $('btnCopy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText($('exportOut').textContent); scanMsg('Config kopiert.'); }
      catch { scanMsg('Kopieren fehlgeschlagen.', 'warn'); }
    });
    $('btnDownload').addEventListener('click', () => {
      const blob = new Blob([$('exportOut').textContent], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `xiaomifrozen-${state.modelId}-config.json`;
      a.click(); URL.revokeObjectURL(a.href);
    });
    $('btnExportQuick').addEventListener('click', () => { setTab('Config'); $('btnDownload').click(); });
    $('btnReconnect').addEventListener('click', () => {
      if (state.demo.on) { startDemo(); return; }
      state.ble.wantConnect = true; scheduleReconnect();
    });
    $('btnDisconnect').addEventListener('click', () => safeDisconnect(true));
    $('btnRideStart').addEventListener('click', startRide);
    $('btnGps').addEventListener('click', () => gpsOn() ? stopGps() : startGps());
    $('btnRideStop').addEventListener('click', stopRide);
    $('btnRideClear').addEventListener('click', () => { saveRides([]); renderHistory(); });
    document.querySelectorAll('[data-flash]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = currentModel();
        const kind = btn.dataset.flash;
        let msg = '';
        if (kind === 'shfw') {
          msg = m.shfw
            ? 'SHFW wird von XiaomiFrozen nicht geflasht. Öffne ScooterHacking Utility auf Android und übertrage deine exportierte Config.'
            : `${m.name}: kein SHFW über BLE. Community-Hardware-Wege (nicht in dieser App).`;
        } else if (kind === 'repo') {
          msg = 'Repo-Firmware: bitte ScooterHacking / mi-fw-info Community nutzen. Hier kein Download/Flash.';
        } else {
          msg = 'ZIP-Flash ist in XiaomiFrozen deaktiviert (Sicherheit). Nutze SHU/externe Tools nur auf Privatgelände.';
        }
        $('flashMsg').textContent = msg;
        $('flashMsg').className = 'msg warn';
      });
    });
  }

  function init() {
    restoreTune();
    fillModels();
    featureDetect();
    bind();
    renderPresets();
    syncConfigInputs();
    setGauge(0);
    updateKickState(0);
    setDashMode('idle');
    updateMein();
    renderHistory();
    applyTelemetry({ speed: 0 });
    showScreen('scan');
    if (/[?&]demo=1\b/.test(location.search)) {
      setDemoUi(true);
      state.modelId = 'mi4';
      state.ble.name = 'Demo Xiaomi Scooter 4';
      state.ble.rssi = -58;
      startDemo();
      enterApp();
      setTab('Info');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
