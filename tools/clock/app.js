/* vClock App JS - masalma tools/clock */
(function () {
  'use strict';

  // --- Audio Synthesizer (Web Audio API) ---
  let audioCtx = null;
  let alarmInterval = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, delay = 0) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

    gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  function playSoundPreset(soundType) {
    const ctx = getAudioContext();
    if (!ctx) return;

    switch (soundType) {
      case 'chime':
        playTone(523.25, 'sine', 0.8, 0);   // C5
        playTone(659.25, 'sine', 0.8, 0.25); // E5
        playTone(783.99, 'sine', 0.8, 0.5);  // G5
        playTone(1046.50, 'sine', 1.2, 0.75); // C6
        break;
      case 'bell':
        playTone(880, 'triangle', 1.5, 0);
        playTone(1760, 'sine', 1.0, 0.05);
        break;
      case 'marimba':
        playTone(440, 'sine', 0.3, 0);
        playTone(554.37, 'sine', 0.3, 0.15);
        playTone(659.25, 'sine', 0.4, 0.3);
        break;
      case 'digital':
      default:
        // Classic alarm beep pattern
        playTone(1000, 'square', 0.15, 0);
        playTone(1000, 'square', 0.15, 0.2);
        playTone(1000, 'square', 0.15, 0.4);
        break;
    }
  }

  function startAlarmLoop(soundType) {
    stopAlarmLoop();
    playSoundPreset(soundType);
    alarmInterval = setInterval(() => {
      playSoundPreset(soundType);
    }, 1500);
  }

  function stopAlarmLoop() {
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
  }

  // --- App State & Options ---
  const state = {
    activeTab: 'alarm',
    settings: {
      digitalFont: false,
      is12Hour: true,
      showDate: true,
      nightMode: false,
      color: '#0d6efd', // Default primary blue
    },
    alarms: [], // [{ id, hours, minutes, enabled, title, sound, repeatSound }]
    activeAlarmRinging: null,

    // Timer state
    timer: {
      durationSeconds: 300,
      remainingSeconds: 300,
      isRunning: false,
      intervalId: null,
      title: 'Timer'
    },

    // Stopwatch state
    stopwatch: {
      elapsedMs: 0,
      isRunning: false,
      intervalId: null,
      startTime: 0,
      laps: []
    }
  };

  // --- Load & Save Settings ---
  function loadSettings() {
    try {
      const storedSettings = localStorage.getItem('vclock_settings');
      if (storedSettings) {
        Object.assign(state.settings, JSON.parse(storedSettings));
      }
      const storedAlarms = localStorage.getItem('vclock_alarms');
      if (storedAlarms) {
        state.alarms = JSON.parse(storedAlarms);
      } else {
        // Default alarm at 7:00 AM
        state.alarms = [
          { id: '1', hours: 7, minutes: 0, enabled: false, title: 'Alarm', sound: 'digital', repeatSound: true }
        ];
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem('vclock_settings', JSON.stringify(state.settings));
      localStorage.setItem('vclock_alarms', JSON.stringify(state.alarms));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }

  function applySettingsUI() {
    // Night Mode
    if (state.settings.nightMode) {
      document.body.classList.add('night-mode');
    } else {
      document.body.classList.remove('night-mode');
    }

    // Digital Font
    if (state.settings.digitalFont) {
      document.body.classList.add('digital-font-active');
    } else {
      document.body.classList.remove('digital-font-active');
    }

    // Color Accent
    document.documentElement.style.setProperty('--clock-color', state.settings.color);
    document.documentElement.style.setProperty('--accent-color', state.settings.color);

    // Form controls in Settings modal
    const fontCheck = document.getElementById('settingDigitalFont');
    if (fontCheck) fontCheck.checked = state.settings.digitalFont;

    const formatCheck = document.getElementById('setting12Hour');
    if (formatCheck) formatCheck.checked = state.settings.is12Hour;

    const dateCheck = document.getElementById('settingShowDate');
    if (dateCheck) dateCheck.checked = state.settings.showDate;

    const nightCheck = document.getElementById('settingNightMode');
    if (nightCheck) nightCheck.checked = state.settings.nightMode;

    // Update active color dot in modal
    document.querySelectorAll('.color-dot').forEach(dot => {
      if (dot.getAttribute('data-color') === state.settings.color) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // --- Formatting Helpers ---
  function pad2(num) {
    return String(num).padStart(2, '0');
  }

  function formatTime(dateObj, showSeconds = true) {
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const seconds = dateObj.getSeconds();
    let ampm = '';

    if (state.settings.is12Hour) {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
    }

    const timeStr = `${pad2(hours)}:${pad2(minutes)}` + (showSeconds ? `:${pad2(seconds)}` : '') + ampm;
    return timeStr;
  }

  function formatDate(dateObj) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString(undefined, options);
  }

  function formatSeconds(secTotal) {
    const hrs = Math.floor(secTotal / 3600);
    const mins = Math.floor((secTotal % 3600) / 60);
    const secs = secTotal % 60;

    if (hrs > 0) {
      return `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}`;
    }
    return `${pad2(mins)}:${pad2(secs)}`;
  }

  function formatMs(msTotal) {
    const mins = Math.floor(msTotal / 60000);
    const secs = Math.floor((msTotal % 60000) / 1000);
    const hundredths = Math.floor((msTotal % 1000) / 10);
    return `${pad2(mins)}:${pad2(secs)}.<small style="font-size: 0.6em">${pad2(hundredths)}</small>`;
  }

  // --- Clock Loop & Alarm Checks ---
  function updateClockDisplays() {
    const now = new Date();

    // Main Clock Tab Display
    const clockDisplay = document.getElementById('mainClockDisplay');
    const clockDate = document.getElementById('mainClockDate');
    if (clockDisplay) clockDisplay.innerHTML = formatTime(now);
    if (clockDate) {
      clockDate.style.display = state.settings.showDate ? 'block' : 'none';
      clockDate.textContent = formatDate(now);
    }

    // Top Header Mini Time Display
    const headerTime = document.getElementById('headerMiniClock');
    if (headerTime) headerTime.textContent = formatTime(now, true);

    // Alarm Check
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentSec = now.getSeconds();

    if (currentSec === 0) {
      state.alarms.forEach(alarm => {
        if (alarm.enabled && alarm.hours === currentHour && alarm.minutes === currentMin) {
          triggerAlarm(alarm);
        }
      });
    }
  }

  function triggerAlarm(alarm) {
    state.activeAlarmRinging = alarm;
    startAlarmLoop(alarm.sound || 'digital');
    const modalEl = document.getElementById('alarmRingingModal');
    if (modalEl) {
      document.getElementById('alarmRingingTitle').textContent = alarm.title || 'Alarm';
      document.getElementById('alarmRingingTime').textContent = formatAlarmTimeStr(alarm.hours, alarm.minutes);
      const bsModal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
      bsModal.show();
    }
  }

  function formatAlarmTimeStr(h, m) {
    let ampm = '';
    let displayH = h;
    if (state.settings.is12Hour) {
      ampm = h >= 12 ? ' PM' : ' AM';
      displayH = h % 12;
      if (displayH === 0) displayH = 12;
    }
    return `${pad2(displayH)}:${pad2(m)}${ampm}`;
  }

  // --- Alarm UI Render ---
  function renderAlarms() {
    const container = document.getElementById('alarmListContainer');
    if (!container) return;

    if (state.alarms.length === 0) {
      container.innerHTML = '<div class="text-center text-muted py-4">No alarms configured. Click "Set Alarm" to add one.</div>';
      return;
    }

    container.innerHTML = state.alarms.map(alarm => `
      <div class="vclock-card d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div>
          <div class="h2 mb-0 fw-bold">${formatAlarmTimeStr(alarm.hours, alarm.minutes)}</div>
          <div class="text-muted small">${alarm.title || 'Alarm'} ${alarm.enabled ? '<span class="badge bg-success ms-2">Active</span>' : ''}</div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div class="form-check form-switch fs-4 mb-0 me-3">
            <input class="form-check-input alarm-toggle-btn" type="checkbox" data-id="${alarm.id}" ${alarm.enabled ? 'checked' : ''}>
          </div>
          <button class="btn btn-outline-secondary btn-sm edit-alarm-btn" data-id="${alarm.id}">Edit</button>
          <button class="btn btn-outline-danger btn-sm delete-alarm-btn" data-id="${alarm.id}">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function renderPresetTimes() {
    const container = document.getElementById('alarmPresetsGrid');
    if (!container) return;

    const presets = [
      { h: 4, m: 0, label: '4:00 AM' },
      { h: 4, m: 30, label: '4:30 AM' },
      { h: 5, m: 0, label: '5:00 AM' },
      { h: 5, m: 15, label: '5:15 AM' },
      { h: 5, m: 30, label: '5:30 AM' },
      { h: 5, m: 45, label: '5:45 AM' },
      { h: 6, m: 0, label: '6:00 AM' },
      { h: 6, m: 15, label: '6:15 AM' },
      { h: 6, m: 30, label: '6:30 AM' },
      { h: 6, m: 45, label: '6:45 AM' },
      { h: 7, m: 0, label: '7:00 AM' },
      { h: 7, m: 15, label: '7:15 AM' },
      { h: 7, m: 30, label: '7:30 AM' },
      { h: 7, m: 45, label: '7:45 AM' },
      { h: 8, m: 0, label: '8:00 AM' },
      { h: 8, m: 30, label: '8:30 AM' },
      { h: 9, m: 0, label: '9:00 AM' },
      { h: 10, m: 0, label: '10:00 AM' },
      { h: 12, m: 0, label: '12:00 PM' },
      { h: 13, m: 0, label: '1:00 PM' },
      { h: 14, m: 0, label: '2:00 PM' },
    ];

    container.innerHTML = presets.map(p => `
      <button class="preset-btn quick-preset-alarm" data-h="${p.h}" data-m="${p.m}">${p.label}</button>
    `).join('');
  }

  // --- Timer Logic ---
  function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
      timerDisplay.textContent = formatSeconds(state.timer.remainingSeconds);
    }
  }

  function startTimer() {
    if (state.timer.isRunning) return;
    if (state.timer.remainingSeconds <= 0) return;

    state.timer.isRunning = true;
    document.getElementById('timerStartBtn').classList.add('d-none');
    document.getElementById('timerPauseBtn').classList.remove('d-none');

    state.timer.intervalId = setInterval(() => {
      state.timer.remainingSeconds--;
      updateTimerDisplay();

      if (state.timer.remainingSeconds <= 0) {
        pauseTimer();
        triggerAlarm({ title: state.timer.title || 'Timer', hours: new Date().getHours(), minutes: new Date().getMinutes(), sound: 'chime' });
      }
    }, 1000);
  }

  function pauseTimer() {
    state.timer.isRunning = false;
    if (state.timer.intervalId) {
      clearInterval(state.timer.intervalId);
      state.timer.intervalId = null;
    }
    const startBtn = document.getElementById('timerStartBtn');
    const pauseBtn = document.getElementById('timerPauseBtn');
    if (startBtn) startBtn.classList.remove('d-none');
    if (pauseBtn) pauseBtn.classList.add('d-none');
  }

  function resetTimer() {
    pauseTimer();
    state.timer.remainingSeconds = state.timer.durationSeconds;
    updateTimerDisplay();
  }

  function setTimerDuration(seconds, title = 'Timer') {
    pauseTimer();
    state.timer.durationSeconds = seconds;
    state.timer.remainingSeconds = seconds;
    state.timer.title = title;
    const titleInput = document.getElementById('timerTitleInput');
    if (titleInput) titleInput.value = title;
    updateTimerDisplay();
  }

  // --- Stopwatch Logic ---
  function updateStopwatchDisplay() {
    const display = document.getElementById('stopwatchDisplay');
    if (display) {
      display.innerHTML = formatMs(state.stopwatch.elapsedMs);
    }
  }

  function startStopwatch() {
    if (state.stopwatch.isRunning) return;

    state.stopwatch.isRunning = true;
    document.getElementById('stopwatchStartBtn').classList.add('d-none');
    document.getElementById('stopwatchPauseBtn').classList.remove('d-none');
    document.getElementById('stopwatchLapBtn').disabled = false;

    const startTime = Date.now() - state.stopwatch.elapsedMs;
    state.stopwatch.intervalId = setInterval(() => {
      state.stopwatch.elapsedMs = Date.now() - startTime;
      updateStopwatchDisplay();
    }, 10);
  }

  function pauseStopwatch() {
    state.stopwatch.isRunning = false;
    if (state.stopwatch.intervalId) {
      clearInterval(state.stopwatch.intervalId);
      state.stopwatch.intervalId = null;
    }
    document.getElementById('stopwatchStartBtn').classList.remove('d-none');
    document.getElementById('stopwatchPauseBtn').classList.add('d-none');
  }

  function resetStopwatch() {
    pauseStopwatch();
    state.stopwatch.elapsedMs = 0;
    state.stopwatch.laps = [];
    document.getElementById('stopwatchLapBtn').disabled = true;
    updateStopwatchDisplay();
    renderLaps();
  }

  function lapStopwatch() {
    if (!state.stopwatch.isRunning && state.stopwatch.elapsedMs === 0) return;
    state.stopwatch.laps.unshift(state.stopwatch.elapsedMs);
    renderLaps();
  }

  function renderLaps() {
    const tbody = document.getElementById('stopwatchLapsBody');
    if (!tbody) return;

    if (state.stopwatch.laps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted py-3">No laps recorded</td></tr>';
      return;
    }

    tbody.innerHTML = state.stopwatch.laps.map((lapMs, idx) => `
      <tr>
        <td>Lap ${state.stopwatch.laps.length - idx}</td>
        <td class="text-end font-monospace">${formatMs(lapMs)}</td>
      </tr>
    `).join('');
  }

  // --- Navigation / Tabs ---
  function switchTab(tabName) {
    state.activeTab = tabName;
    document.querySelectorAll('.clock-nav-link').forEach(link => {
      if (link.getAttribute('data-tab') === tabName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    document.querySelectorAll('.tab-pane-content').forEach(pane => {
      if (pane.id === `tab-${tabName}`) {
        pane.classList.remove('d-none');
      } else {
        pane.classList.add('d-none');
      }
    });
  }

  // --- URL Query Params ---
  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);

    // Check for tab parameter e.g., ?tab=timer
    const tabParam = params.get('tab');
    if (tabParam && ['alarm', 'timer', 'stopwatch', 'clock'].includes(tabParam)) {
      switchTab(tabParam);
    }

    // Check for alarm preset e.g., ?alarm=07:30
    const alarmParam = params.get('alarm');
    if (alarmParam) {
      const parts = alarmParam.split(':');
      if (parts.length === 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(h) && !isNaN(m)) {
          // Add or replace alarm
          const existing = state.alarms.find(a => a.hours === h && a.minutes === m);
          if (existing) {
            existing.enabled = true;
          } else {
            state.alarms.push({
              id: Date.now().toString(),
              hours: h,
              minutes: m,
              enabled: true,
              title: 'Alarm',
              sound: 'digital',
              repeatSound: true
            });
          }
          saveSettings();
          renderAlarms();
          switchTab('alarm');
        }
      }
    }

    // Check for timer preset e.g., ?timer=300 or ?timer=5m
    const timerParam = params.get('timer');
    if (timerParam) {
      let sec = 0;
      if (timerParam.endsWith('m')) {
        sec = parseInt(timerParam.slice(0, -1), 10) * 60;
      } else if (timerParam.endsWith('h')) {
        sec = parseInt(timerParam.slice(0, -1), 10) * 3600;
      } else {
        sec = parseInt(timerParam, 10);
      }

      if (!isNaN(sec) && sec > 0) {
        setTimerDuration(sec, 'Timer');
        switchTab('timer');
      }
    }
  }

  // --- Fullscreen Toggle ---
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // --- Event Listeners Setup ---
  function initEvents() {
    // Navigation tabs
    document.querySelectorAll('.clock-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });

    // Night mode toggle button in header
    const nightToggleBtn = document.getElementById('nightModeToggleBtn');
    if (nightToggleBtn) {
      nightToggleBtn.addEventListener('click', () => {
        state.settings.nightMode = !state.settings.nightMode;
        applySettingsUI();
        saveSettings();
      });
    }

    // Fullscreen toggle button
    const fsBtn = document.getElementById('fullscreenBtn');
    if (fsBtn) {
      fsBtn.addEventListener('click', toggleFullscreen);
    }

    // Test Sound buttons
    document.querySelectorAll('.test-sound-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const soundSelect = document.getElementById('editAlarmSound');
        const soundType = soundSelect ? soundSelect.value : 'digital';
        playSoundPreset(soundType);
      });
    });

    // Open Add/Edit Alarm Modal
    let editingAlarmId = null;
    const alarmModalEl = document.getElementById('editAlarmModal');
    let alarmModalInstance = null;
    if (alarmModalEl) {
      alarmModalInstance = new bootstrap.Modal(alarmModalEl);
    }

    const openNewAlarmBtn = document.getElementById('openAddAlarmBtn');
    if (openNewAlarmBtn) {
      openNewAlarmBtn.addEventListener('click', () => {
        editingAlarmId = null;
        document.getElementById('editAlarmModalTitle').textContent = 'Set Alarm';
        document.getElementById('editAlarmHours').value = '7';
        document.getElementById('editAlarmMinutes').value = '0';
        document.getElementById('editAlarmAmpm').value = 'AM';
        document.getElementById('editAlarmTitle').value = 'Alarm';
        document.getElementById('editAlarmSound').value = 'digital';
        if (alarmModalInstance) alarmModalInstance.show();
      });
    }

    // Save Alarm submit
    const saveAlarmBtn = document.getElementById('saveAlarmModalBtn');
    if (saveAlarmBtn) {
      saveAlarmBtn.addEventListener('click', () => {
        let h = parseInt(document.getElementById('editAlarmHours').value, 10) || 0;
        const m = parseInt(document.getElementById('editAlarmMinutes').value, 10) || 0;
        const ampm = document.getElementById('editAlarmAmpm').value;
        const title = document.getElementById('editAlarmTitle').value || 'Alarm';
        const sound = document.getElementById('editAlarmSound').value || 'digital';

        if (state.settings.is12Hour) {
          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
        }

        if (editingAlarmId) {
          const alarm = state.alarms.find(a => a.id === editingAlarmId);
          if (alarm) {
            alarm.hours = h;
            alarm.minutes = m;
            alarm.title = title;
            alarm.sound = sound;
            alarm.enabled = true;
          }
        } else {
          state.alarms.push({
            id: Date.now().toString(),
            hours: h,
            minutes: m,
            enabled: true,
            title,
            sound,
            repeatSound: true
          });
        }

        saveSettings();
        renderAlarms();
        if (alarmModalInstance) alarmModalInstance.hide();
      });
    }

    // Delegated Alarm list actions (Toggle, Edit, Delete)
    const alarmContainer = document.getElementById('alarmListContainer');
    if (alarmContainer) {
      alarmContainer.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.alarm-toggle-btn');
        if (toggleBtn) {
          const id = toggleBtn.getAttribute('data-id');
          const alarm = state.alarms.find(a => a.id === id);
          if (alarm) {
            alarm.enabled = toggleBtn.checked;
            saveSettings();
            renderAlarms();
          }
          return;
        }

        const editBtn = e.target.closest('.edit-alarm-btn');
        if (editBtn) {
          const id = editBtn.getAttribute('data-id');
          const alarm = state.alarms.find(a => a.id === id);
          if (alarm) {
            editingAlarmId = id;
            document.getElementById('editAlarmModalTitle').textContent = 'Edit Alarm';
            let displayH = alarm.hours;
            let ampm = 'AM';
            if (state.settings.is12Hour) {
              ampm = alarm.hours >= 12 ? 'PM' : 'AM';
              displayH = alarm.hours % 12;
              if (displayH === 0) displayH = 12;
            }
            document.getElementById('editAlarmHours').value = displayH;
            document.getElementById('editAlarmMinutes').value = alarm.minutes;
            document.getElementById('editAlarmAmpm').value = ampm;
            document.getElementById('editAlarmTitle').value = alarm.title || 'Alarm';
            document.getElementById('editAlarmSound').value = alarm.sound || 'digital';
            if (alarmModalInstance) alarmModalInstance.show();
          }
          return;
        }

        const deleteBtn = e.target.closest('.delete-alarm-btn');
        if (deleteBtn) {
          const id = deleteBtn.getAttribute('data-id');
          state.alarms = state.alarms.filter(a => a.id !== id);
          saveSettings();
          renderAlarms();
          return;
        }
      });
    }

    // Quick preset alarms
    const presetsGrid = document.getElementById('alarmPresetsGrid');
    if (presetsGrid) {
      presetsGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-preset-alarm');
        if (btn) {
          const h = parseInt(btn.getAttribute('data-h'), 10);
          const m = parseInt(btn.getAttribute('data-m'), 10);
          const existing = state.alarms.find(a => a.hours === h && a.minutes === m);
          if (existing) {
            existing.enabled = true;
          } else {
            state.alarms.push({
              id: Date.now().toString(),
              hours: h,
              minutes: m,
              enabled: true,
              title: 'Alarm',
              sound: 'digital',
              repeatSound: true
            });
          }
          saveSettings();
          renderAlarms();
        }
      });
    }

    // Stop ringing alarm
    const stopAlarmBtn = document.getElementById('stopAlarmBtn');
    if (stopAlarmBtn) {
      stopAlarmBtn.addEventListener('click', () => {
        stopAlarmLoop();
        const modalEl = document.getElementById('alarmRingingModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
      });
    }

    // Timer controls
    const timerStartBtn = document.getElementById('timerStartBtn');
    if (timerStartBtn) timerStartBtn.addEventListener('click', startTimer);

    const timerPauseBtn = document.getElementById('timerPauseBtn');
    if (timerPauseBtn) timerPauseBtn.addEventListener('click', pauseTimer);

    const timerResetBtn = document.getElementById('timerResetBtn');
    if (timerResetBtn) timerResetBtn.addEventListener('click', resetTimer);

    const timerTitleInput = document.getElementById('timerTitleInput');
    if (timerTitleInput) {
      timerTitleInput.addEventListener('change', (e) => {
        state.timer.title = e.target.value;
      });
    }

    // Quick timer preset buttons
    document.querySelectorAll('.quick-timer-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = parseInt(btn.getAttribute('data-sec'), 10);
        const title = btn.getAttribute('data-title') || 'Timer';
        if (sec) setTimerDuration(sec, title);
      });
    });

    // Custom Timer Set Modal Save
    const saveCustomTimerBtn = document.getElementById('saveCustomTimerBtn');
    if (saveCustomTimerBtn) {
      saveCustomTimerBtn.addEventListener('click', () => {
        const h = parseInt(document.getElementById('customTimerHours').value, 10) || 0;
        const m = parseInt(document.getElementById('customTimerMins').value, 10) || 0;
        const s = parseInt(document.getElementById('customTimerSecs').value, 10) || 0;
        const title = document.getElementById('customTimerTitle').value || 'Timer';
        const totalSec = h * 3600 + m * 60 + s;
        if (totalSec > 0) {
          setTimerDuration(totalSec, title);
          const modalEl = document.getElementById('customTimerModal');
          const instance = bootstrap.Modal.getInstance(modalEl);
          if (instance) instance.hide();
        }
      });
    }

    // Stopwatch controls
    const swStartBtn = document.getElementById('stopwatchStartBtn');
    if (swStartBtn) swStartBtn.addEventListener('click', startStopwatch);

    const swPauseBtn = document.getElementById('stopwatchPauseBtn');
    if (swPauseBtn) swPauseBtn.addEventListener('click', pauseStopwatch);

    const swResetBtn = document.getElementById('stopwatchResetBtn');
    if (swResetBtn) swResetBtn.addEventListener('click', resetStopwatch);

    const swLapBtn = document.getElementById('stopwatchLapBtn');
    if (swLapBtn) swLapBtn.addEventListener('click', lapStopwatch);

    // Settings Modal Inputs
    const setFont = document.getElementById('settingDigitalFont');
    if (setFont) {
      setFont.addEventListener('change', (e) => {
        state.settings.digitalFont = e.target.checked;
        applySettingsUI();
        saveSettings();
      });
    }

    const set12H = document.getElementById('setting12Hour');
    if (set12H) {
      set12H.addEventListener('change', (e) => {
        state.settings.is12Hour = e.target.checked;
        applySettingsUI();
        saveSettings();
        renderAlarms();
        updateClockDisplays();
      });
    }

    const setDate = document.getElementById('settingShowDate');
    if (setDate) {
      setDate.addEventListener('change', (e) => {
        state.settings.showDate = e.target.checked;
        applySettingsUI();
        saveSettings();
        updateClockDisplays();
      });
    }

    const setNight = document.getElementById('settingNightMode');
    if (setNight) {
      setNight.addEventListener('change', (e) => {
        state.settings.nightMode = e.target.checked;
        applySettingsUI();
        saveSettings();
      });
    }

    // Color palette selection
    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const chosenColor = dot.getAttribute('data-color');
        if (chosenColor) {
          state.settings.color = chosenColor;
          applySettingsUI();
          saveSettings();
        }
      });
    });
  }

  // --- Initialization ---
  function init() {
    loadSettings();
    applySettingsUI();
    renderAlarms();
    renderPresetTimes();
    updateTimerDisplay();
    updateStopwatchDisplay();
    renderLaps();
    initEvents();
    parseUrlParams();

    // Start clock interval
    updateClockDisplays();
    setInterval(updateClockDisplays, 1000);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
