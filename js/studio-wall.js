// ==========================================================================
// Kite Strings Studio — Studio Wall
// Five business cards. Each shows real status, not decoration:
//   - Active Projects / Waiting / Ideas: editable lists (via KSDListBlock)
//   - Last Touched: the most recent date you actually entered something
//     on that room's Today page (scanned from its saved entries)
// ==========================================================================
(function () {
  const ROOMS = [
    { slug: 'lite-run', label: 'Lite Run', day: 'Monday', icon: '🪁', file: 'room-lite-run.html' },
    { slug: 'ksd-client', label: 'KSD Client Work', day: 'Tuesday', icon: '🎨', file: 'today-ksd-client.html' },
    { slug: 'ksd-templates', label: 'KSD Templates', day: 'Wednesday', icon: '🧩', file: 'room-ksd-templates.html' },
    { slug: 'lifestyle', label: 'KSD Lifestyle', day: 'Thursday', icon: '🎁', file: 'room-lifestyle.html' },
    { slug: 'visionary', label: 'Visionary Studio', day: 'Friday', icon: '🔭', file: 'room-visionary.html' }
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

    const activeBlock = window.KSDListBlock.build('Active Projects', `ksd-active:${room.slug}`, 'a project in motion...');
    const waitingBlock = window.KSDListBlock.build('Waiting', `ksd-waiting:${room.slug}`, 'who or what are you waiting on...');
    const ideasBlock = window.KSDListBlock.build('Ideas', `ksd-ideas:${room.slug}`, 'a someday idea...');

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
