// ==========================================================================
// Kite Strings Studio — Studio Wall
// Five business cards. Each shows real status, not decoration:
//   - Last Touched: the most recent date you actually entered something
//     on that room's Today page (scanned from its saved entries)
//   - Active Projects: what's actually in motion for that business
//   - Waiting: things someone else owes you for that business
//   - Ideas: someday/maybe thoughts for that business
// Active Projects, Waiting, and Ideas persist per business in localStorage,
// editable inline, same pattern as everywhere else in the app.
// ==========================================================================
(function () {
  const ROOMS = [
    { slug: 'lite-run', label: 'Lite Run', day: 'Monday', icon: '🪁', file: 'today-lite-run.html' },
    { slug: 'ksd-client', label: 'KSD Client Work', day: 'Tuesday', icon: '🎨', file: 'today-ksd-client.html' },
    { slug: 'ksd-templates', label: 'KSD Templates', day: 'Wednesday', icon: '🧩', file: 'today-ksd-templates.html' },
    { slug: 'lifestyle', label: 'KSD Lifestyle', day: 'Thursday', icon: '🎁', file: 'today-lifestyle.html' },
    { slug: 'visionary', label: 'Visionary Studio', day: 'Friday', icon: '🔭', file: 'today-visionary.html' }
  ];

  const todayDayName = new Date().toLocaleDateString(undefined, { weekday: 'long' });
  const grid = document.getElementById('wallGrid');

  function lastTouched(slug) {
    const prefix = `ksd-entry:${slug}:`;
    let latest = null;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.indexOf(prefix) === 0) {
          const dateStr = key.slice(prefix.length);
          if (!latest || dateStr > latest) latest = dateStr;
        }
      }
    } catch (err) {
      // ignore
    }
    if (!latest) return 'Not started yet';
    const parts = latest.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (isNaN(d.getTime())) return 'Not started yet';
    const isToday = latest === (() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();
    if (isToday) return 'Today';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function loadList(key) {
    try {
      const raw = localStorage.getItem(key);
      const items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items : [];
    } catch (err) {
      return [];
    }
  }

  function saveList(key, items) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (err) {
      // ignore
    }
  }

  // Builds one editable list block (Waiting or Ideas) for a card.
  function buildListBlock(label, storageKey, addPlaceholder) {
    let items = loadList(storageKey);
    const block = document.createElement('div');
    block.className = 'wall-list-block';

    const heading = document.createElement('div');
    heading.className = 'eyebrow';
    heading.textContent = label;
    block.appendChild(heading);

    const ul = document.createElement('ul');
    ul.className = 'wall-mini-list';
    block.appendChild(ul);

    function renderList() {
      ul.innerHTML = '';
      items.forEach((text, idx) => {
        const li = document.createElement('li');
        li.className = 'wall-mini-item';

        const bullet = document.createElement('span');
        bullet.className = 'brain-bullet';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'wall-mini-text editable';
        input.placeholder = addPlaceholder;
        input.value = text;
        let saveTimer = null;
        input.addEventListener('input', () => {
          items[idx] = input.value;
          clearTimeout(saveTimer);
          saveTimer = setTimeout(() => saveList(storageKey, items), 400);
        });

        const remove = document.createElement('button');
        remove.className = 'brain-remove';
        remove.type = 'button';
        remove.setAttribute('aria-label', 'Remove');
        remove.textContent = '✕';
        remove.addEventListener('click', () => {
          items.splice(idx, 1);
          renderList();
          saveList(storageKey, items);
        });

        li.appendChild(bullet);
        li.appendChild(input);
        li.appendChild(remove);
        ul.appendChild(li);
      });
    }

    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn wall-add-btn';
    addBtn.type = 'button';
    addBtn.textContent = '+ add';
    addBtn.addEventListener('click', () => {
      items.push('');
      renderList();
      saveList(storageKey, items);
      const inputs = ul.querySelectorAll('.wall-mini-text');
      if (inputs.length) inputs[inputs.length - 1].focus();
    });
    block.appendChild(addBtn);

    renderList();
    return block;
  }

  ROOMS.forEach((room) => {
    const card = document.createElement('div');
    card.className = 'card wall-card';

    const isToday = room.day === todayDayName;

    const top = document.createElement('div');
    top.className = 'wall-card-top';

    const icon = document.createElement('div');
    icon.className = 'wall-card-icon';
    icon.textContent = room.icon;
    top.appendChild(icon);

    if (isToday) {
      const badge = document.createElement('span');
      badge.className = 'today-badge';
      badge.textContent = "Today's room";
      top.appendChild(badge);
    }

    const name = document.createElement('div');
    name.className = 'wall-card-name';
    name.textContent = room.label;

    const day = document.createElement('div');
    day.className = 'wall-card-day';
    day.textContent = room.day + 's';

    const touched = document.createElement('div');
    touched.className = 'wall-card-touched';
    touched.textContent = `Last touched: ${lastTouched(room.slug)}`;

    const activeBlock = buildListBlock('Active Projects', `ksd-active:${room.slug}`, 'a project in motion...');
    const waitingBlock = buildListBlock('Waiting', `ksd-waiting:${room.slug}`, 'who or what are you waiting on...');
    const ideasBlock = buildListBlock('Ideas', `ksd-ideas:${room.slug}`, 'a someday idea...');

    const enter = document.createElement('a');
    enter.className = 'card-link wall-enter-link';
    enter.href = room.file;
    enter.textContent = 'Enter room →';

    card.appendChild(top);
    card.appendChild(name);
    card.appendChild(day);
    card.appendChild(activeBlock);
    card.appendChild(waitingBlock);
    card.appendChild(ideasBlock);
    card.appendChild(touched);
    card.appendChild(enter);
    grid.appendChild(card);
  });
})();
