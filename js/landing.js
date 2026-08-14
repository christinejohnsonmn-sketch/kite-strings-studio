// ==========================================================================
// Kite Strings Studio — The Landing page
// Full view/edit of the shared caught-thoughts list.
// ==========================================================================
(function () {
  const el = (id) => document.getElementById(id);
  const brainList = el('brainList');
  const addThoughtBtn = el('addThought');
  const saveStatus = el('saveStatus');

  let items = window.KSDLanding.load();
  let saveTimer = null;

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 400);
  }

  function save() {
    const ok = window.KSDLanding.save(items);
    if (ok) {
      saveStatus.textContent = 'saved';
      clearTimeout(saveStatus._fadeTimer);
      saveStatus._fadeTimer = setTimeout(() => { saveStatus.textContent = ''; }, 1500);
    } else {
      saveStatus.textContent = 'could not save';
    }
  }

  function render() {
    brainList.innerHTML = '';
    items.forEach((thought, idx) => {
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
        items[idx] = text.value;
        scheduleSave();
      });

      const remove = document.createElement('button');
      remove.className = 'brain-remove';
      remove.setAttribute('aria-label', 'Remove thought');
      remove.textContent = '✕';
      remove.addEventListener('click', () => {
        items.splice(idx, 1);
        if (items.length === 0) items = [''];
        render();
        window.KSDLanding.save(items);
      });

      li.appendChild(bullet);
      li.appendChild(text);
      li.appendChild(remove);
      brainList.appendChild(li);
    });
  }

  addThoughtBtn.addEventListener('click', () => {
    items.push('');
    render();
    const inputs = brainList.querySelectorAll('.brain-text');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  render();
})();
