// ==========================================================================
// Kite Strings Studio — KSD Client Work board
// Not a click-into-cards Kanban: every project card shows its full
// phase-by-phase checklist at once, with the current phase highlighted,
// so nothing requires a click or a scroll to the right to see.
// ==========================================================================
window.KSDClientBoard = (function () {

  // ---- Templates -----------------------------------------------------

  const PROJECT_PHASES = [
    { key: 'kickoff', label: 'Kick-off Meeting', tasks: [
      { key: 'notes-sent', label: 'Notes sent' }
    ]},
    { key: 'conceptual', label: 'Conceptual Design', tasks: [
      { key: 'font-palette', label: 'Font palette' },
      { key: 'color-palette', label: 'Color palette' },
      { key: 'presentation-deck', label: 'Presentation deck' }
    ]},
    { key: 'schematic', label: 'Schematic Design', tasks: [
      { key: 'graphic-typicals', label: 'Graphic typicals' },
      { key: 'update-presentation-deck', label: 'Update presentation deck' }
    ]},
    { key: 'preliminary', label: 'Preliminary Design', tasks: [
      { key: 'layout-graphics', label: 'Layout all graphics' },
      { key: 'create-pdfs', label: 'Create PDFs for submittal' },
      { key: 'presentation-deck', label: 'Presentation deck' },
      { key: 'graphic-spreadsheet', label: 'Create graphic spreadsheet for organization and graphic vendor' },
      { key: 'acquire-images', label: 'Start to acquire full-res images' }
    ]},
    { key: 'final', label: 'Final Design', tasks: [
      { key: 'requested-changes', label: 'Make requested changes to graphics' },
      { key: 'all-images-acquired', label: 'All images acquired' },
      { key: 'send-spreadsheet-vendor', label: 'Send spreadsheet to print vendor for estimate' },
      { key: 'submit-final-approval', label: 'Submit all graphics for final approval' }
    ]},
    { key: 'fabrication', label: 'Fabrication', tasks: [
      { key: 'final-graphic-edits', label: 'Make final graphic edits' },
      { key: 'final-image-edits', label: 'Make final image edits' },
      { key: 'package-files', label: 'Package files' },
      { key: 'outlined-files', label: 'Create outlined file versions' },
      { key: 'send-output', label: 'Send for output' },
      { key: 'install-packet', label: 'Create install packet' },
      { key: 'maintenance-packet', label: 'Create maintenance/warranty packet' },
      { key: 'upload-final', label: 'Upload all final files to client' }
    ]},
    { key: 'punchlist', label: 'Punchlist', tasks: [
      { key: 'punchlist-items', label: 'Complete any punchlist items' }
    ]}
  ];

  const PROPOSAL_TASKS = [
    { key: 'review-scope', label: 'Review scope' },
    { key: 'choose-team', label: 'Choose team' },
    { key: 'send-questions', label: 'Send questions' },
    { key: 'gather-resumes', label: 'Gather resumes' },
    { key: 'cover-letter', label: 'Cover letter' },
    { key: 'toc', label: 'ToC' },
    { key: 'sell-sheets', label: 'Sell Sheets' },
    { key: 'proposal-cover', label: 'Proposal cover' },
    { key: 'cost-proposal', label: 'Cost Proposal/Budget' },
    { key: 'design-phases', label: 'Design Phases' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'write-sections', label: 'Write sections' },
    { key: 'edit-proofread', label: 'Edit / proofread' },
    { key: 'submit', label: 'Submit' }
  ];

  const PROJECTS_KEY = 'ksd-client-projects';
  const PROPOSALS_KEY = 'ksd-client-proposals';

  // ---- Storage ---------------------------------------------------------

  function loadArray(key) {
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (err) {
      return [];
    }
  }

  function saveArray(key, arr) {
    try {
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (err) {
      // ignore
    }
  }

  function newId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function newProject() {
    const phases = {};
    PROJECT_PHASES.forEach((phase) => {
      const tasks = {};
      phase.tasks.forEach((t) => { tasks[t.key] = false; });
      phases[phase.key] = { dueDate: '', tasks: tasks };
    });
    return { id: newId('proj-'), name: '', contractAmount: '', finalDueDate: '', phases: phases };
  }

  function newProposal() {
    const tasks = {};
    PROPOSAL_TASKS.forEach((t) => { tasks[t.key] = false; });
    return { id: newId('prop-'), name: '', proposalDueDate: '', questionsDueDate: '', tasks: tasks };
  }

  // Repairs a loaded project against the current template shape, in case
  // the template changes later — never lose checked state, just fill gaps.
  function repairProject(project) {
    if (!project.phases) project.phases = {};
    PROJECT_PHASES.forEach((phase) => {
      if (!project.phases[phase.key]) project.phases[phase.key] = { dueDate: '', tasks: {} };
      if (!project.phases[phase.key].tasks) project.phases[phase.key].tasks = {};
      phase.tasks.forEach((t) => {
        if (typeof project.phases[phase.key].tasks[t.key] !== 'boolean') {
          project.phases[phase.key].tasks[t.key] = false;
        }
      });
    });
    return project;
  }

  function repairProposal(proposal) {
    if (!proposal.tasks) proposal.tasks = {};
    PROPOSAL_TASKS.forEach((t) => {
      if (typeof proposal.tasks[t.key] !== 'boolean') proposal.tasks[t.key] = false;
    });
    return proposal;
  }

  // First phase (in template order) that isn't fully checked off.
  function currentPhaseKey(project) {
    for (let i = 0; i < PROJECT_PHASES.length; i++) {
      const phase = PROJECT_PHASES[i];
      const state = project.phases[phase.key];
      const allDone = phase.tasks.every((t) => state.tasks[t.key]);
      if (!allDone) return phase.key;
    }
    return null; // every phase complete
  }

  // ---- Rendering ---------------------------------------------------------

  function fieldLabel(text) {
    const span = document.createElement('span');
    span.className = 'field-label';
    span.textContent = text;
    return span;
  }

  function renderProjectCard(project, projects, onChange) {
    const card = document.createElement('div');
    card.className = 'card project-card';

    // Name + remove
    const topRow = document.createElement('div');
    topRow.className = 'project-top-row';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'project-card-name editable';
    nameInput.placeholder = 'Project name';
    nameInput.value = project.name;
    nameInput.addEventListener('input', () => { project.name = nameInput.value; onChange(); });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-card-link';
    remove.textContent = '✕ remove';
    remove.addEventListener('click', () => {
      if (window.confirm('Remove this project card? This cannot be undone.')) {
        const idx = projects.indexOf(project);
        if (idx >= 0) projects.splice(idx, 1);
        onChange(true);
      }
    });

    topRow.appendChild(nameInput);
    topRow.appendChild(remove);
    card.appendChild(topRow);

    // Meta: contract amount + final due date
    const meta = document.createElement('div');
    meta.className = 'project-card-meta';

    const amountField = document.createElement('label');
    amountField.className = 'project-meta-field';
    amountField.appendChild(fieldLabel('Contract $'));
    const amountInput = document.createElement('input');
    amountInput.type = 'text';
    amountInput.placeholder = '$0';
    amountInput.value = project.contractAmount;
    amountInput.addEventListener('input', () => { project.contractAmount = amountInput.value; onChange(); });
    amountField.appendChild(amountInput);

    const dueField = document.createElement('label');
    dueField.className = 'project-meta-field';
    dueField.appendChild(fieldLabel('Final due date'));
    const dueInput = document.createElement('input');
    dueInput.type = 'date';
    dueInput.value = project.finalDueDate;
    dueInput.addEventListener('input', () => { project.finalDueDate = dueInput.value; onChange(); });
    dueField.appendChild(dueInput);

    meta.appendChild(amountField);
    meta.appendChild(dueField);
    card.appendChild(meta);

    // Current phase banner
    const curKey = currentPhaseKey(project);
    const banner = document.createElement('div');
    if (curKey) {
      const curPhase = PROJECT_PHASES.find((p) => p.key === curKey);
      const curDue = project.phases[curKey].dueDate;
      banner.className = 'current-phase-banner';
      banner.textContent = `▶ Current phase: ${curPhase.label}${curDue ? ' — due ' + formatDate(curDue) : ''}`;
    } else {
      banner.className = 'current-phase-banner complete';
      banner.textContent = '✅ All phases complete';
    }
    card.appendChild(banner);

    // Split phases into "active" (still has work) and "complete" (every
    // task checked) — complete phases collapse out of the main view.
    const activePhases = [];
    const completedPhases = [];
    PROJECT_PHASES.forEach((phase) => {
      const state = project.phases[phase.key];
      const allDone = phase.tasks.every((t) => state.tasks[t.key]);
      (allDone ? completedPhases : activePhases).push(phase);
    });

    activePhases.forEach((phase) => {
      const state = project.phases[phase.key];
      const block = document.createElement('div');
      block.className = 'phase-block' + (phase.key === curKey ? ' current-phase' : '');

      const header = document.createElement('div');
      header.className = 'phase-header';

      const title = document.createElement('div');
      title.className = 'phase-title';
      title.textContent = phase.label;

      const phaseDue = document.createElement('input');
      phaseDue.type = 'date';
      phaseDue.className = 'phase-due-input';
      phaseDue.value = state.dueDate;
      phaseDue.addEventListener('input', () => { state.dueDate = phaseDue.value; onChange(true); });

      header.appendChild(title);
      header.appendChild(phaseDue);
      block.appendChild(header);

      block.appendChild(buildReviewableChecklist(phase.tasks, state.tasks, onChange));
      card.appendChild(block);
    });

    if (completedPhases.length > 0) {
      const wrap = document.createElement('div');
      wrap.className = 'phase-block';

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'review-done-toggle';
      toggle.textContent = `✓ ${completedPhases.length} phase${completedPhases.length > 1 ? 's' : ''} complete — review`;

      const detail = document.createElement('div');
      detail.style.display = 'none';

      completedPhases.forEach((phase) => {
        const state = project.phases[phase.key];
        const block = document.createElement('div');
        block.className = 'phase-block';

        const header = document.createElement('div');
        header.className = 'phase-header';
        const title = document.createElement('div');
        title.className = 'phase-title';
        title.textContent = phase.label;
        const phaseDue = document.createElement('input');
        phaseDue.type = 'date';
        phaseDue.className = 'phase-due-input';
        phaseDue.value = state.dueDate;
        phaseDue.addEventListener('input', () => { state.dueDate = phaseDue.value; onChange(true); });
        header.appendChild(title);
        header.appendChild(phaseDue);
        block.appendChild(header);

        block.appendChild(buildReviewableChecklist(phase.tasks, state.tasks, onChange));
        detail.appendChild(block);
      });

      toggle.addEventListener('click', () => {
        const showing = detail.style.display !== 'none';
        detail.style.display = showing ? 'none' : '';
        toggle.classList.toggle('open', !showing);
      });

      wrap.appendChild(toggle);
      wrap.appendChild(detail);
      card.appendChild(wrap);
    }

    return card;
  }

  function renderProposalCard(proposal, proposals, onChange) {
    const card = document.createElement('div');
    card.className = 'card proposal-card';

    const topRow = document.createElement('div');
    topRow.className = 'project-top-row';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'project-card-name editable';
    nameInput.placeholder = 'Name of project';
    nameInput.value = proposal.name;
    nameInput.addEventListener('input', () => { proposal.name = nameInput.value; onChange(); });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-card-link';
    remove.textContent = '✕ remove';
    remove.addEventListener('click', () => {
      if (window.confirm('Remove this proposal card? This cannot be undone.')) {
        const idx = proposals.indexOf(proposal);
        if (idx >= 0) proposals.splice(idx, 1);
        onChange(true);
      }
    });

    topRow.appendChild(nameInput);
    topRow.appendChild(remove);
    card.appendChild(topRow);

    const meta = document.createElement('div');
    meta.className = 'project-card-meta';

    const propDueField = document.createElement('label');
    propDueField.className = 'project-meta-field';
    propDueField.appendChild(fieldLabel('Proposal due date'));
    const propDueInput = document.createElement('input');
    propDueInput.type = 'date';
    propDueInput.value = proposal.proposalDueDate;
    propDueInput.addEventListener('input', () => { proposal.proposalDueDate = propDueInput.value; onChange(); });
    propDueField.appendChild(propDueInput);

    const qDueField = document.createElement('label');
    qDueField.className = 'project-meta-field';
    qDueField.appendChild(fieldLabel('Questions due date'));
    const qDueInput = document.createElement('input');
    qDueInput.type = 'date';
    qDueInput.value = proposal.questionsDueDate;
    qDueInput.addEventListener('input', () => { proposal.questionsDueDate = qDueInput.value; onChange(); });
    qDueField.appendChild(qDueInput);

    meta.appendChild(propDueField);
    meta.appendChild(qDueField);
    card.appendChild(meta);

    card.appendChild(buildReviewableChecklist(PROPOSAL_TASKS, proposal.tasks, onChange));

    return card;
  }

  function formatDate(isoStr) {
    const parts = isoStr.split('-').map(Number);
    if (parts.length !== 3) return isoStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // Builds a checklist where checked items disappear from the default view.
  // If any are checked, a small "✓ N done — review" toggle reveals them
  // again (still checked, so they can be unchecked to bring them back).
  // onChange(true) is expected to trigger a full re-render, so unchecking
  // an item here naturally moves it back into the visible list next render.
  function buildReviewableChecklist(tasks, taskState, onChange) {
    const wrap = document.createElement('div');

    const incomplete = tasks.filter((t) => !taskState[t.key]);
    const completed = tasks.filter((t) => taskState[t.key]);

    const ul = document.createElement('ul');
    ul.className = 'tmpl-task-list';
    incomplete.forEach((t) => {
      const li = document.createElement('li');
      li.className = 'tmpl-task-item';

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'b3-check';
      check.checked = false;
      check.addEventListener('change', () => {
        taskState[t.key] = check.checked;
        onChange(true);
      });

      const label = document.createElement('span');
      label.className = 'tmpl-task-label';
      label.textContent = t.label;

      const pushBtn = document.createElement('button');
      pushBtn.type = 'button';
      pushBtn.className = 'push-today-btn';
      pushBtn.title = "Copy to today's Upcoming list";
      pushBtn.textContent = '→ Today';
      pushBtn.addEventListener('click', () => {
        window.KSDPushToToday.push('ksd-client', t.label);
      });

      li.appendChild(check);
      li.appendChild(label);
      li.appendChild(pushBtn);
      ul.appendChild(li);
    });
    wrap.appendChild(ul);

    if (completed.length > 0) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'review-done-toggle';
      toggle.textContent = `✓ ${completed.length} done — review`;

      const doneList = document.createElement('ul');
      doneList.className = 'tmpl-task-list review-done-list';
      doneList.style.display = 'none';
      completed.forEach((t) => {
        const li = document.createElement('li');
        li.className = 'tmpl-task-item done';

        const check = document.createElement('input');
        check.type = 'checkbox';
        check.className = 'b3-check';
        check.checked = true;
        check.addEventListener('change', () => {
          taskState[t.key] = check.checked;
          onChange(true);
        });

        const label = document.createElement('span');
        label.className = 'tmpl-task-label';
        label.textContent = t.label;

        li.appendChild(check);
        li.appendChild(label);
        doneList.appendChild(li);
      });

      toggle.addEventListener('click', () => {
        const showing = doneList.style.display !== 'none';
        doneList.style.display = showing ? 'none' : '';
        toggle.classList.toggle('open', !showing);
      });

      wrap.appendChild(toggle);
      wrap.appendChild(doneList);
    }

    return wrap;
  }

  // ---- Public: mounts the whole board into two container elements ----

  function mount(projectsGridEl, proposalsGridEl, addProjectBtnEl, addProposalBtnEl) {
    let projects = loadArray(PROJECTS_KEY).map(repairProject);
    let proposals = loadArray(PROPOSALS_KEY).map(repairProposal);

    let saveTimer = null;
    function scheduleSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveArray(PROJECTS_KEY, projects);
        saveArray(PROPOSALS_KEY, proposals);
      }, 400);
    }

    function renderAll() {
      projectsGridEl.innerHTML = '';
      projects.forEach((project) => {
        projectsGridEl.appendChild(renderProjectCard(project, projects, onProjectChange));
      });
      proposalsGridEl.innerHTML = '';
      proposals.forEach((proposal) => {
        proposalsGridEl.appendChild(renderProposalCard(proposal, proposals, onProposalChange));
      });
    }

    function onProjectChange(structural) {
      scheduleSave();
      if (structural) renderAll();
    }
    function onProposalChange(structural) {
      scheduleSave();
      if (structural) renderAll();
    }

    addProjectBtnEl.addEventListener('click', () => {
      projects.push(newProject());
      scheduleSave();
      renderAll();
      const inputs = projectsGridEl.querySelectorAll('.project-card-name');
      if (inputs.length) inputs[inputs.length - 1].focus();
    });

    addProposalBtnEl.addEventListener('click', () => {
      proposals.push(newProposal());
      scheduleSave();
      renderAll();
      const inputs = proposalsGridEl.querySelectorAll('.project-card-name');
      if (inputs.length) inputs[inputs.length - 1].focus();
    });

    renderAll();
  }

  return { mount };
})();
