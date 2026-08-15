// ==========================================================================
// Kite Strings Studio — shared editable list block
// Builds a labeled, add/remove editable list backed by localStorage.
// Used by Studio Wall (Active Projects / Waiting / Ideas) and Room pages
// (Website / Social Media / Misc, etc.) — one implementation, reused.
// ==========================================================================
window.KSDListBlock = (function () {
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

  function build(label, storageKey, addPlaceholder) {
    let items = loadList(storageKey);
    const block = document.createElement('div');
    block.className = 'list-block';

    const heading = document.createElement('div');
    heading.className = 'eyebrow';
    heading.textContent = label;
    block.appendChild(heading);

    const ul = document.createElement('ul');
    ul.className = 'mini-list';
    block.appendChild(ul);

    function renderList() {
      ul.innerHTML = '';
      items.forEach((text, idx) => {
        const li = document.createElement('li');
        li.className = 'mini-item';

        const bullet = document.createElement('span');
        bullet.className = 'brain-bullet';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'mini-text editable';
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
    addBtn.className = 'add-btn mini-add-btn';
    addBtn.type = 'button';
    addBtn.textContent = '+ add';
    addBtn.addEventListener('click', () => {
      items.push('');
      renderList();
      saveList(storageKey, items);
      const inputs = ul.querySelectorAll('.mini-text');
      if (inputs.length) inputs[inputs.length - 1].focus();
    });
    block.appendChild(addBtn);

    renderList();
    return block;
  }

  return { build };
})();

// ==========================================================================
// KSDTaskList — checkbox + reorder-arrow list, matching Big Three / Upcoming.
// Optionally supports a per-item due date: when set, dated items float to
// the top sorted soonest-first; undated items stay below in manual order
// (reorder arrows only apply to undated items — a dated item's position is
// date-driven, not manual). The soonest 3 dated items get a yellow dot.
// ==========================================================================
window.KSDTaskList = (function () {
  function loadItems(key) {
    try {
      const raw = localStorage.getItem(key);
      const items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items : [];
    } catch (err) {
      return [];
    }
  }

  function saveItems(key, items) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (err) {
      // ignore
    }
  }

  function build(label, storageKey, options) {
    const opts = options || {};
    const placeholder = opts.placeholder || '...';
    const allowDue = !!opts.allowDue;

    let items = loadItems(storageKey);

    const wrap = document.createElement('div');
    wrap.className = 'list-block';

    const heading = document.createElement('div');
    heading.className = 'eyebrow';
    heading.textContent = label;
    wrap.appendChild(heading);

    const ul = document.createElement('ul');
    ul.className = 'task-list';
    wrap.appendChild(ul);

    let saveTimer = null;
    function scheduleSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveItems(storageKey, items), 400);
    }

    // Returns [{ item, idx }] in display order: dated items first (soonest
    // due date on top), then undated items in their stored order.
    function displayOrder() {
      const withIdx = items.map((item, idx) => ({ item, idx }));
      const dated = withIdx.filter((x) => x.item.due);
      const undated = withIdx.filter((x) => !x.item.due);
      dated.sort((a, b) => (a.item.due < b.item.due ? -1 : a.item.due > b.item.due ? 1 : 0));
      return dated.concat(undated);
    }

    // Moves an undated item up/down within the undated group only, by
    // swapping storage-array contents (keeps dated items' slots untouched).
    function moveUndated(arrIdx, dir) {
      const undatedIndices = items.map((it, i) => (it.due ? -1 : i)).filter((i) => i >= 0);
      const pos = undatedIndices.indexOf(arrIdx);
      const targetPos = pos + dir;
      if (pos < 0 || targetPos < 0 || targetPos >= undatedIndices.length) return;
      const otherIdx = undatedIndices[targetPos];
      const tmp = items[arrIdx];
      items[arrIdx] = items[otherIdx];
      items[otherIdx] = tmp;
    }

    function render() {
      ul.innerHTML = '';
      const order = displayOrder();
      const datedCount = order.filter((x) => x.item.due).length;
      const urgentCutoff = Math.min(3, datedCount);

      order.forEach((entry, displayPos) => {
        const { item, idx } = entry;
        const li = document.createElement('li');
        li.className = 'task-item' + (item.done ? ' done' : '');

        if (!item.due) {
          const pos = items.map((it, i) => (it.due ? -1 : i)).filter((i) => i >= 0).indexOf(idx);
          const undatedCount = items.filter((it) => !it.due).length;
          const reorder = document.createElement('span');
          reorder.className = 'reorder-group';

          const up = document.createElement('button');
          up.type = 'button';
          up.className = 'reorder-btn';
          up.textContent = '▲';
          up.setAttribute('aria-label', 'Move up');
          up.disabled = pos === 0;
          up.addEventListener('click', () => { moveUndated(idx, -1); scheduleSave(); render(); });

          const down = document.createElement('button');
          down.type = 'button';
          down.className = 'reorder-btn';
          down.textContent = '▼';
          down.setAttribute('aria-label', 'Move down');
          down.disabled = pos === undatedCount - 1;
          down.addEventListener('click', () => { moveUndated(idx, 1); scheduleSave(); render(); });

          reorder.appendChild(up);
          reorder.appendChild(down);
          li.appendChild(reorder);
        } else {
          const spacer = document.createElement('span');
          spacer.className = 'reorder-group';
          spacer.style.visibility = 'hidden';
          spacer.innerHTML = '<button class="reorder-btn" tabindex="-1" disabled>▲</button><button class="reorder-btn" tabindex="-1" disabled>▼</button>';
          li.appendChild(spacer);
        }

        const check = document.createElement('input');
        check.type = 'checkbox';
        check.className = 'b3-check';
        check.checked = !!item.done;
        check.addEventListener('change', () => {
          items[idx].done = check.checked;
          scheduleSave();
          render();
        });
        li.appendChild(check);

        if (item.due && displayPos < urgentCutoff) {
          const dot = document.createElement('span');
          dot.className = 'task-urgent-dot';
          dot.title = 'Coming up soon';
          li.appendChild(dot);
        }

        const text = document.createElement('input');
        text.type = 'text';
        text.className = 'b3-text editable';
        text.placeholder = placeholder;
        text.value = item.text || '';
        text.addEventListener('input', () => {
          items[idx].text = text.value;
          scheduleSave();
        });
        li.appendChild(text);

        if (allowDue) {
          const due = document.createElement('input');
          due.type = 'date';
          due.className = 'task-due';
          due.value = item.due || '';
          due.addEventListener('change', () => {
            items[idx].due = due.value || '';
            scheduleSave();
            render();
          });
          li.appendChild(due);
        }

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'brain-remove';
        remove.setAttribute('aria-label', 'Remove');
        remove.textContent = '✕';
        remove.addEventListener('click', () => {
          items.splice(idx, 1);
          scheduleSave();
          render();
        });
        li.appendChild(remove);

        ul.appendChild(li);
      });
    }

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-btn mini-add-btn';
    addBtn.textContent = '+ add';
    addBtn.addEventListener('click', () => {
      items.push({ text: '', done: false, due: '' });
      scheduleSave();
      render();
      const inputs = ul.querySelectorAll('.b3-text');
      if (inputs.length) inputs[inputs.length - 1].focus();
    });
    wrap.appendChild(addBtn);

    render();
    return wrap;
  }

  return { build };
})();
