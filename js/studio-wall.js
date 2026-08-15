// ==========================================================================
// Kite Strings Studio — Studio Wall
// Five business cards, each with an editable one-line "orientation panel"
// mission that persists in localStorage (same pattern as everything else).
// ==========================================================================
(function () {
  const ROOMS = [
    { slug: 'lite-run', label: 'Lite Run', day: 'Monday', icon: '🪁', file: 'today-lite-run.html' },
    { slug: 'ksd-client', label: 'KSD Client Work', day: 'Tuesday', icon: '🎨', file: 'today-ksd-client.html' },
    { slug: 'ksd-templates', label: 'KSD Templates', day: 'Wednesday', icon: '🧩', file: 'today-ksd-templates.html' },
    { slug: 'lifestyle', label: 'KSD Lifestyle', day: 'Thursday', icon: '🎁', file: 'today-lifestyle.html' },
    { slug: 'visionary', label: 'Visionary Studio', day: 'Friday', icon: '🔭', file: 'today-visionary.html' }
  ];

  const MISSION_KEY = (slug) => `ksd-mission:${slug}`;
  const todayDayName = new Date().toLocaleDateString(undefined, { weekday: 'long' });

  const grid = document.getElementById('wallGrid');

  ROOMS.forEach((room) => {
    const card = document.createElement('div');
    card.className = 'card wall-card';

    const isToday = room.day === todayDayName;

    const top = document.createElement('div');
    top.className = 'wall-card-top';

    const icon = document.createElement('div');
    icon.className = 'wall-card-icon';
    icon.textContent = room.icon;

    if (isToday) {
      const badge = document.createElement('span');
      badge.className = 'today-badge';
      badge.textContent = "Today's room";
      top.appendChild(icon);
      top.appendChild(badge);
    } else {
      top.appendChild(icon);
    }

    const name = document.createElement('div');
    name.className = 'wall-card-name';
    name.textContent = room.label;

    const day = document.createElement('div');
    day.className = 'wall-card-day';
    day.textContent = room.day + 's';

    const mission = document.createElement('textarea');
    mission.className = 'wall-card-mission editable';
    mission.placeholder = 'What is this room for? Write your one-line orientation here...';
    mission.rows = 2;

    let saveTimer = null;
    try {
      mission.value = localStorage.getItem(MISSION_KEY(room.slug)) || '';
    } catch (err) {
      // ignore
    }
    mission.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        try { localStorage.setItem(MISSION_KEY(room.slug), mission.value); } catch (err) { /* ignore */ }
      }, 400);
    });

    const enter = document.createElement('a');
    enter.className = 'card-link wall-enter-link';
    enter.href = room.file;
    enter.textContent = 'Enter room →';

    card.appendChild(top);
    card.appendChild(name);
    card.appendChild(day);
    card.appendChild(mission);
    card.appendChild(enter);
    grid.appendChild(card);
  });
})();
