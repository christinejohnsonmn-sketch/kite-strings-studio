// ==========================================================================
// Kite Strings Studio — Today room
// Persists one entry per calendar day in localStorage.
// ==========================================================================
(function () {
  const todayKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const storageKey = `ksd-entry:${todayKey()}`;

  const dateLabelEl = document.getElementById('dateLabel');
  const autoDateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  const defaultState = {
    dateLabel: autoDateLabel,
    focus: '',
    mission: '',
    bigThree: [
      { text: '', done: false },
      { text: '', done: false },
      { text: '', done: false }
    ],
    now: '',
    upcoming: [{ text: '', done: false }],
    brainDump: [''],
    eodMoved: '',
    eodTomorrow: ''
  };

  let state = JSON.parse(JSON.stringify(defaultState));

  const el = (id) => document.getElementById(id);
  const focusTag = el('focusTag');
  const missionEl = el('mission');
  const bigThreeList = el('bigThreeList');
  const nowField = el('nowField');
  const upcomingList = el('upcomingList');
  const addUpcomingBtn = el('addUpcoming');
  const brainList = el('brainList');
  const addThoughtBtn = el('addThought');
  const eodMoved = el('eodMoved');
  const eodTomorrow = el('eodTomorrow');
  const saveStatus = el('saveStatus');

  let saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 400);
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      saveStatus.textContent = 'saved';
      clearTimeout(saveStatus._fadeTimer);
      saveStatus._fadeTimer = setTimeout(() => { saveStatus.textContent = ''; }, 1500);
    } catch (err) {
      saveStatus.textContent = 'could not save';
      console.error('Storage error:', err);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const loaded = JSON.parse(raw);
        state = Object.assign(JSON.parse(JSON.stringify(defaultState)), loaded);
        if (!Array.isArray(state.bigThree) || state.bigThree.length === 0) {
          state.bigThree = JSON.parse(JSON.stringify(defaultState.bigThree));
        }
        if (!Array.isArray(state.upcoming) || state.upcoming.length === 0) {
          state.upcoming = [{ text: '', done: false }];
        }
        if (!Array.isArray(state.brainDump) || state.brainDump.length === 0) {
          state.brainDump = [''];
        }
      }
    } catch (err) {
      // No existing entry for today — start fresh.
    }
    render();
  }

  function render() {
    dateLabelEl.value = state.dateLabel;
    focusTag.value = state.focus;
    missionEl.value = state.mission;
    nowField.value = state.now;
    eodMoved.value = state.eodMoved;
    eodTomorrow.value = state.eodTomorrow;
    renderBigThree();
    renderUpcoming();
    renderBrainDump();
  }

  function renderBigThree() {
    bigThreeList.innerHTML = '';
    state.bigThree.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'b3-item' + (item.done ? ' done' : '');

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'b3-check';
      check.checked = item.done;
      check.addEventListener('change', () => {
        state.bigThree[idx].done = check.checked;
        li.classList.toggle('done', check.checked);
        scheduleSave();
      });

      const text = document.createElement('input');
      text.type = 'text';
      text.className = 'b3-text editable';
      text.placeholder = '...';
      text.value = item.text;
      text.addEventListener('input', () => {
        state.bigThree[idx].text = text.value;
        scheduleSave();
      });

      li.appendChild(check);
      li.appendChild(text);
      bigThreeList.appendChild(li);
    });
  }

  function renderUpcoming() {
    upcomingList.innerHTML = '';
    state.upcoming.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'up-item' + (item.done ? ' done' : '');

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'up-check';
      check.checked = item.done;
      check.addEventListener('change', () => {
        state.upcoming[idx].done = check.checked;
        li.classList.toggle('done', check.checked);
        scheduleSave();
      });

      const text = document.createElement('input');
      text.type = 'text';
      text.className = 'up-text editable';
      text.placeholder = 'a small task that feeds a Big Three...';
      text.value = item.text;
      text.addEventListener('input', () => {
        state.upcoming[idx].text = text.value;
        scheduleSave();
      });

      const remove = document.createElement('button');
      remove.className = 'up-remove';
      remove.setAttribute('aria-label', 'Remove task');
      remove.textContent = '✕';
      remove.addEventListener('click', () => {
        state.upcoming.splice(idx, 1);
        if (state.upcoming.length === 0) state.upcoming = [{ text: '', done: false }];
        renderUpcoming();
        scheduleSave();
        requestAnimationFrame(drawString);
      });

      li.appendChild(check);
      li.appendChild(text);
      li.appendChild(remove);
      upcomingList.appendChild(li);
    });
  }

  function renderBrainDump() {
    brainList.innerHTML = '';
    state.brainDump.forEach((thought, idx) => {
      const li = document.createElement('li');
      li.className = 'brain-item';

      const bullet = document.createElement('span');
      bullet.className = 'brain-bullet';

      const text = document.createElement('input');
      text.type = 'text';
      text.className = 'brain-text editable';
      text.placeholder = 'a stray thought...';
      text.value = thought;
      text.addEventListener('input', () => {
        state.brainDump[idx] = text.value;
        scheduleSave();
      });

      const remove = document.createElement('button');
      remove.className = 'brain-remove';
      remove.setAttribute('aria-label', 'Remove thought');
      remove.textContent = '✕';
      remove.addEventListener('click', () => {
        state.brainDump.splice(idx, 1);
        if (state.brainDump.length === 0) state.brainDump = [''];
        renderBrainDump();
        scheduleSave();
        requestAnimationFrame(drawString);
      });

      li.appendChild(bullet);
      li.appendChild(text);
      li.appendChild(remove);
      brainList.appendChild(li);
    });
  }

  addUpcomingBtn.addEventListener('click', () => {
    state.upcoming.push({ text: '', done: false });
    renderUpcoming();
    const inputs = upcomingList.querySelectorAll('.up-text');
    if (inputs.length) inputs[inputs.length - 1].focus();
    requestAnimationFrame(drawString);
  });

  addThoughtBtn.addEventListener('click', () => {
    state.brainDump.push('');
    renderBrainDump();
    const inputs = brainList.querySelectorAll('.brain-text');
    if (inputs.length) inputs[inputs.length - 1].focus();
    requestAnimationFrame(drawString);
  });

  dateLabelEl.addEventListener('input', () => { state.dateLabel = dateLabelEl.value; scheduleSave(); });
  focusTag.addEventListener('input', () => { state.focus = focusTag.value; scheduleSave(); });
  missionEl.addEventListener('input', () => { state.mission = missionEl.value; scheduleSave(); });
  nowField.addEventListener('input', () => { state.now = nowField.value; scheduleSave(); });
  eodMoved.addEventListener('input', () => { state.eodMoved = eodMoved.value; scheduleSave(); });
  eodTomorrow.addEventListener('input', () => { state.eodTomorrow = eodTomorrow.value; scheduleSave(); });

  // ---- Draw the kite string: a wandering thread through each section, knotted at anchors ----
  function drawString() {
    const svg = el('stringSvg');
    const sheet = document.querySelector('.sheet');
    const anchors = ['anchor-mission', 'anchor-big3', 'anchor-now', 'anchor-upcoming', 'anchor-brain', 'anchor-eod']
      .map((id) => el(id));

    const sheetRect = sheet.getBoundingClientRect();
    const height = sheetRect.height;
    svg.setAttribute('viewBox', `0 0 30 ${height}`);
    svg.style.height = height + 'px';

    const points = anchors.map((a) => a.getBoundingClientRect().top - sheetRect.top + 26);

    let d = `M 15 ${points[0]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const y1 = points[i];
      const y2 = points[i + 1];
      const midY = (y1 + y2) / 2;
      const sway = i % 2 === 0 ? 8 : -8;
      d += ` C ${15 + sway} ${y1 + (midY - y1) * 0.6}, ${15 + sway} ${y2 - (y2 - midY) * 0.6}, 15 ${y2}`;
    }

    svg.innerHTML = '';
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);

    points.forEach((y) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', 15);
      c.setAttribute('cy', y);
      c.setAttribute('r', 3);
      svg.appendChild(c);
    });
  }

  window.addEventListener('resize', () => requestAnimationFrame(drawString));

  load();
  requestAnimationFrame(() => {
    drawString();
    setTimeout(drawString, 150);
  });
})();