// ==========================================================================
// Kite Strings Studio — Today room (generic, parameterized per business)
// Expects window.KSD_BUSINESS = { slug, label, defaultFocus } to be set
// by an inline <script> in the page before this file loads.
// Persists one planner entry per business per calendar day in localStorage.
// The brain-dump / "Parking Lot" list is shared across every business and day.
// ==========================================================================
(function () {
  const business = window.KSD_BUSINESS || { slug: 'today', label: 'Today', defaultFocus: '' };

  const todayKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const storageKey = `ksd-entry:${business.slug}:${todayKey()}`;

  const dateLabelEl = document.getElementById('dateLabel');
  const autoDateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  function buildDefaultTimeBlocks() {
    const labels = [
      '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
      '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
      '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
      '5:00 PM', '5:30 PM', '6:00 PM'
    ];
    return labels.map((time) => ({ time, text: '' }));
  }

  const defaultState = {
    dateLabel: autoDateLabel,
    focus: business.defaultFocus || '',
    bigThree: [
      { text: '', done: false },
      { text: '', done: false },
      { text: '', done: false }
    ],
    now: '',
    timeBlocks: buildDefaultTimeBlocks(),
    upcoming: [{ text: '', done: false }],
    eodMoved: '',
    eodTomorrow: ''
  };

  let state = JSON.parse(JSON.stringify(defaultState));
  let parkingLot = [];

  const el = (id) => document.getElementById(id);
  const focusTag = el('focusTag');
  const bigThreeList = el('bigThreeList');
  const nowField = el('nowField');
  const nowCheck = el('nowCheck');
  const timeBlockList = el('timeBlockList');
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
        if (!Array.isArray(state.timeBlocks) || state.timeBlocks.length === 0) {
          state.timeBlocks = JSON.parse(JSON.stringify(defaultState.timeBlocks));
        }
        if (!Array.isArray(state.upcoming) || state.upcoming.length === 0) {
          state.upcoming = [{ text: '', done: false }];
        }
      }
    } catch (err) {
      // No existing entry for today — start fresh.
    }
    parkingLot = window.KSDParkingLot.load();
    render();
  }

  function render() {
    dateLabelEl.value = state.dateLabel;
    focusTag.value = state.focus;
    nowField.value = state.now;
    nowCheck.checked = false;
    eodMoved.value = state.eodMoved;
    eodTomorrow.value = state.eodTomorrow;
    renderBigThree();
    renderTimeBlocks();
    renderUpcoming();
    renderBrainDump();
  }

  function moveItem(arr, from, to) {
    if (to < 0 || to >= arr.length) return;
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
  }

  function makeReorderGroup(arr, idx, onMoved) {
    const group = document.createElement('span');
    group.className = 'reorder-group';

    const up = document.createElement('button');
    up.className = 'reorder-btn';
    up.type = 'button';
    up.textContent = '▲';
    up.setAttribute('aria-label', 'Move up');
    up.disabled = idx === 0;
    up.addEventListener('click', () => {
      moveItem(arr, idx, idx - 1);
      onMoved();
      scheduleSave();
    });

    const down = document.createElement('button');
    down.className = 'reorder-btn';
    down.type = 'button';
    down.textContent = '▼';
    down.setAttribute('aria-label', 'Move down');
    down.disabled = idx === arr.length - 1;
    down.addEventListener('click', () => {
      moveItem(arr, idx, idx + 1);
      onMoved();
      scheduleSave();
    });

    group.appendChild(up);
    group.appendChild(down);
    return group;
  }

  function renderBigThree() {
    bigThreeList.innerHTML = '';
    state.bigThree.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'b3-item' + (item.done ? ' done' : '');

      const reorder = makeReorderGroup(state.bigThree, idx, renderBigThree);

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

      li.appendChild(reorder);
      li.appendChild(check);
      li.appendChild(text);
      bigThreeList.appendChild(li);
    });
  }

  function renderTimeBlocks() {
    timeBlockList.innerHTML = '';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    state.timeBlocks.forEach((block, idx) => {
      const li = document.createElement('li');
      const blockStart = toMinutes(block.time);
      const isCurrent = blockStart >= 0 && currentMinutes >= blockStart && currentMinutes < blockStart + 30;
      li.className = 'tb-item' + (isCurrent ? ' current' : '');

      const time = document.createElement('span');
      time.className = 'tb-time';
      time.textContent = block.time;

      const text = document.createElement('input');
      text.type = 'text';
      text.className = 'tb-text editable';
      text.placeholder = '...';
      text.value = block.text;
      text.addEventListener('input', () => {
        state.timeBlocks[idx].text = text.value;
        scheduleSave();
      });

      li.appendChild(time);
      li.appendChild(text);
      timeBlockList.appendChild(li);
    });
  }

  function toMinutes(label) {
    const match = label.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return -1;
    let hour = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'AM' && hour === 12) hour = 0;
    if (period === 'PM' && hour !== 12) hour += 12;
    return hour * 60 + minutes;
  }

  function renderUpcoming() {
    upcomingList.innerHTML = '';
    state.upcoming.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'up-item' + (item.done ? ' done' : '');

      const reorder = makeReorderGroup(state.upcoming, idx, renderUpcoming);

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

      li.appendChild(reorder);
      li.appendChild(check);
      li.appendChild(text);
      li.appendChild(remove);
      upcomingList.appendChild(li);
    });
  }

  // Brain dump reads/writes the SHARED Parking Lot list, not per-day state.
  function renderBrainDump() {
    brainList.innerHTML = '';
    parkingLot.forEach((thought, idx) => {
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
        parkingLot[idx] = text.value;
        scheduleSaveParkingLot();
      });

      const remove = document.createElement('button');
      remove.className = 'brain-remove';
      remove.setAttribute('aria-label', 'Remove thought');
      remove.textContent = '✕';
      remove.addEventListener('click', () => {
        parkingLot.splice(idx, 1);
        if (parkingLot.length === 0) parkingLot = [''];
        renderBrainDump();
        window.KSDParkingLot.save(parkingLot);
        requestAnimationFrame(drawString);
      });

      li.appendChild(bullet);
      li.appendChild(text);
      li.appendChild(remove);
      brainList.appendChild(li);
    });
  }

  let parkingLotSaveTimer = null;
  function scheduleSaveParkingLot() {
    clearTimeout(parkingLotSaveTimer);
    parkingLotSaveTimer = setTimeout(() => window.KSDParkingLot.save(parkingLot), 400);
  }

  // ---- Now checkbox: check it to clear the current item and pull the next Upcoming item up ----
  nowCheck.addEventListener('change', () => {
    if (!nowCheck.checked) return;
    const next = state.upcoming.shift();
    state.now = next && next.text ? next.text : '';
    if (state.upcoming.length === 0) state.upcoming = [{ text: '', done: false }];
    nowField.value = state.now;
    nowCheck.checked = false;
    renderUpcoming();
    scheduleSave();
    requestAnimationFrame(drawString);
  });

  addUpcomingBtn.addEventListener('click', () => {
    state.upcoming.push({ text: '', done: false });
    renderUpcoming();
    const inputs = upcomingList.querySelectorAll('.up-text');
    if (inputs.length) inputs[inputs.length - 1].focus();
    requestAnimationFrame(drawString);
  });

  addThoughtBtn.addEventListener('click', () => {
    parkingLot.push('');
    renderBrainDump();
    window.KSDParkingLot.save(parkingLot);
    const inputs = brainList.querySelectorAll('.brain-text');
    if (inputs.length) inputs[inputs.length - 1].focus();
    requestAnimationFrame(drawString);
  });

  dateLabelEl.addEventListener('input', () => { state.dateLabel = dateLabelEl.value; scheduleSave(); });
  focusTag.addEventListener('input', () => { state.focus = focusTag.value; scheduleSave(); });
  nowField.addEventListener('input', () => { state.now = nowField.value; scheduleSave(); });
  eodMoved.addEventListener('input', () => { state.eodMoved = eodMoved.value; scheduleSave(); });
  eodTomorrow.addEventListener('input', () => { state.eodTomorrow = eodTomorrow.value; scheduleSave(); });

  // ---- Draw the kite string: a wandering thread through each section, knotted at anchors ----
  function drawString() {
    const svg = el('stringSvg');
    const sheet = document.querySelector('.sheet');
    const anchors = ['anchor-big3', 'anchor-timeblocks', 'anchor-now', 'anchor-upcoming', 'anchor-brain', 'anchor-eod']
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
