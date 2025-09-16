// ==============================
// Configuració de Firebase
// ==============================
const firebaseConfig = {
  apiKey: "AIzaSyCam7ES3CavgOsdEwv2Dznwesds72FyJnY",
  authDomain: "calendarimarcel.firebaseapp.com",
  projectId: "calendarimarcel",
  storageBucket: "calendarimarcel.appspot.com",
  messagingSenderId: "63306452640",
  appId: "1:63306452640:web:4aded0ffccbfc8d09c83c5",
  measurementId: "G-4SFP070VFS"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Amaga loader i mostra login/contenidor segons estat d'autenticació
firebase.auth().onAuthStateChanged(function(user) {
    const loader = document.querySelector('.contenidor-loader');
    if (loader) loader.style.display = 'none';
    const loginOverlay = document.getElementById('login-overlay');
    const mainContent = document.getElementById('main-content');
    const loginContainer = document.getElementById('login-container');
    if (user) {
        // Usuari autenticat: amaga login, mostra contingut, amaga loader
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (mainContent) mainContent.style.display = '';
        document.body.classList.remove('login-mode');
        // Aquí pots cridar la teva funció principal (ex: carregarApp())
    } else {
        // No autenticat: mostra login, amaga contingut, amaga loader
        if (loginOverlay) loginOverlay.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
        document.body.classList.add('login-mode');
        loginContainer.style.display = "none";
    }
});

// ==============================
// Helpers & constants
// ==============================
const UNASSIGNED_ID = "sense-dia"; // doc per a tasques sense data

function crearId() {
  return (crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function obtenirDataISO(date) {
  const any = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${any}-${mes}-${dia}`;
}

function isToday(date) {
  const avui = new Date();
  return date.toDateString() === avui.toDateString();
}

function marcarDiaSeleccionat(dataIso) {
  document.querySelectorAll(".calendar-day").forEach((d) => {
    d.classList.remove("selected");
    if (dataIso && d.dataset.date === dataIso) d.classList.add("selected");
  });
}

// ==============================
// Elements del DOM
// ==============================
const calendar      = document.getElementById("calendar");
const monthYear     = document.getElementById("month-year");
const dayTitle      = document.getElementById("day-title");
const taskList      = document.getElementById("task-list");
const newTaskInput  = document.getElementById("new-task");
const addTaskButton = document.getElementById("add-task");
const showTrashBtn  = document.getElementById("show-trash");
const undoBtn       = document.getElementById("undo-btn");
const redoBtn       = document.getElementById("redo-btn");
const closeDayBtn   = document.getElementById("close-day");

// ==============================
// Estat
// ==============================
let currentDate        = new Date();
let selectedDate       = null; // null => "sense dia"
let taskBeingAssigned  = null;
let unsubscribeTasques = null;
let tasquesEliminades  = [];
let comptadorTasques   = [];

// Undo/Redo stacks
const undoStack = [];
const redoStack = [];

function setUndoRedoDisabled() {
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

function pushUndo(action) {
  undoStack.push(action);
  redoStack.length = 0; // qualsevol acció nova invalida redo
  setUndoRedoDisabled();
}

// ==============================
// Modal genèrica
// ==============================
function openModal({ title = "", bodyNode = null, actions = [], showClose = true }) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  const card = document.createElement("div");
  card.className = "modal-card";

  const header = document.createElement("div");
  header.className = "modal-header";
  header.innerHTML = `<span>${title}</span>`;

  if (showClose) {
    const closeX = document.createElement("button");
    closeX.className = "btn-icon";
    closeX.textContent = "✕";
    closeX.title = "Tancar";
    closeX.onclick = () => document.body.removeChild(backdrop);
    header.appendChild(closeX);
  }

  const body = document.createElement("div");
  body.className = "modal-body";
  if (bodyNode) body.appendChild(bodyNode);

  const footer = document.createElement("div");
  footer.className = "modal-actions";
  actions.forEach((a) => {
    const btn = document.createElement("button");
    btn.className = `btn ${a.primary ? "primary" : ""}`;
    btn.textContent = a.label;
    btn.disabled = !!a.disabled;
    btn.onclick = async () => {
      const keepOpen = await a.onClick?.();
      if (!keepOpen) document.body.removeChild(backdrop);
    };
    footer.appendChild(btn);
  });

  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(footer);
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);

  return { close: () => document.body.removeChild(backdrop) };
}

// ==============================
// Renderitzar llista de tasques
// ==============================
function renderitzarTasquesAmbLlista(tasquesOriginals) {
  taskList.innerHTML = "";

  // Mapa ID -> index real a Firestore
  const indexMap = new Map();
  tasquesOriginals.forEach((t, i) => indexMap.set(t.id, i));

  const ordenarPerPrioritat = (a, b) => (b.priority ?? 3) - (a.priority ?? 3);

  // Si estem a "sense dia"
  if (selectedDate == null) {
    // Només pendents, sense títol ni secció
    const pendents = tasquesOriginals.filter(t => !t.done && !t.specialDay).slice().sort(ordenarPerPrioritat);
    pendents.forEach((tasca) => {
      const realIndex = indexMap.get(tasca.id);
      if (realIndex === undefined) return;

      const li = document.createElement("li");
      li.draggable = true;
      li.classList.add(`priority-${tasca.priority ?? 3}`);

      const priorityIndicator = document.createElement("span");
      priorityIndicator.className = "priority-indicator";
      priorityIndicator.textContent = "★".repeat(tasca.priority ?? 3);

      const textSpan = document.createElement("span");
      textSpan.className = "task-text";
      textSpan.textContent = tasca.text;

      textSpan.onclick = (e) => {
        e.stopPropagation();
        openViewModal(tasca);
      };

      const descSpan = document.createElement("div");
      descSpan.className = "task-description";
      if (tasca.description) descSpan.textContent = tasca.description;

      const actions = document.createElement("div");
      actions.className = "task-actions";

      // Assignar a un altre dia
      const assignBtn = document.createElement("button");
      assignBtn.textContent = "📅";
      assignBtn.title = "Assignar a un altre dia";
      assignBtn.onclick = () => {
        taskBeingAssigned = {
          id: tasca.id,
          ...tasca,
          from: UNASSIGNED_ID,
          originalIndex: realIndex
        };
      };

      // Editar
      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️";
      editBtn.title = "Editar";
      editBtn.onclick = () => openEditModal(tasca);

      // Duplicar
      const duplicateBtn = document.createElement("button");
      duplicateBtn.textContent = "📋";
      duplicateBtn.title = "Duplicar";
      duplicateBtn.onclick = async () => {
        const docSnap = await db.collection("tasques").doc(UNASSIGNED_ID).get();
        const tasques = docSnap.exists ? docSnap.data().tasques : [];
        const idx = tasques.findIndex(t => t.id === tasca.id);
        if (idx >= 0) {
          const copia = {
            ...tasca,
            id: crearId(),
            text: tasca.text + " (còpia)"
          };
          tasques.splice(idx + 1, 0, copia);
          pushUndo({ type: "add", day: UNASSIGNED_ID, id: copia.id, task: copia });
          await guardarTasques(UNASSIGNED_ID, tasques);
        }
      };

      // Eliminar
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️";
      deleteBtn.title = "Eliminar";
      deleteBtn.onclick = async () => {
        const docSnap = await db.collection("tasques").doc(UNASSIGNED_ID).get();
        const tasques = docSnap.exists ? docSnap.data().tasques : [];
        const idx = tasques.findIndex(t => t.id === tasca.id);
        if (idx >= 0) {
          const eliminada = tasques.splice(idx, 1)[0];
          pushUndo({ type: "delete", day: UNASSIGNED_ID, task: eliminada, position: idx });
          tasquesEliminades.push({ ...eliminada, from: UNASSIGNED_ID, deletedAt: Date.now() });
          await guardarTasques(UNASSIGNED_ID, tasques);
        }
      };

      // Botó fet/pendent: mou la tasca al dia actual i la marca com a feta
      const doneBtn = document.createElement("button");
      doneBtn.title = "Marcar com a feta";
      doneBtn.innerHTML = '<span style="color:#27ae60;font-size:1.2em;">✓</span>';
      doneBtn.onclick = async (e) => {
        e.stopPropagation();
        // Treure de "sense dia"
        const docSnap = await db.collection("tasques").doc(UNASSIGNED_ID).get();
        const tasques = docSnap.exists ? docSnap.data().tasques : [];
        const idx = tasques.findIndex(t => t.id === tasca.id);
        if (idx >= 0) {
          const movedTask = tasques.splice(idx, 1)[0];
          await guardarTasques(UNASSIGNED_ID, tasques);

          // Afegir al dia actual i marcar amb a feta
          const avuiISO = obtenirDataISO(new Date());
          const diaSnap = await db.collection("tasques").doc(avuiISO).get();
          const diaTasques = diaSnap.exists ? diaSnap.data().tasques : [];
          movedTask.done = true;
          diaTasques.push(movedTask);
          await guardarTasques(avuiISO, diaTasques);

          pushUndo({
            type: "move",
            from: UNASSIGNED_ID,
            to: avuiISO,
            id: movedTask.id,
            originalPosition: idx,
            destPosition: diaTasques.length - 1
          });
        }
      };

      actions.appendChild(assignBtn);
      actions.appendChild(editBtn);
      actions.appendChild(duplicateBtn);
      actions.appendChild(deleteBtn);
      actions.appendChild(doneBtn);

      li.appendChild(priorityIndicator);
      li.appendChild(textSpan);
      li.appendChild(descSpan);
      li.appendChild(actions);
      taskList.appendChild(li);
    });
    return;
  }

  // Si NO estem a "sense dia", comportament normal
  const pendents = tasquesOriginals
    .filter(t => !t.done && !t.specialDay && !t.festaDay && t.text)
    .slice().sort(ordenarPerPrioritat);
  const fetes = tasquesOriginals
    .filter(t => t.done && !t.specialDay && !t.festaDay && t.text)
    .slice().sort(ordenarPerPrioritat);

  const afegirSeccio = (titol, llista, color) => {
    if (!llista.length) return;

    const header = document.createElement("h3");
    header.textContent = titol;
    header.style.color = color;
    taskList.appendChild(header);

    llista.forEach((tasca) => {
      const realIndex = indexMap.get(tasca.id);
      if (realIndex === undefined) return;

      const li = document.createElement("li");
      li.draggable = true;
      li.classList.add(`priority-${tasca.priority ?? 3}`);

      const priorityIndicator = document.createElement("span");
      priorityIndicator.className = "priority-indicator";
      priorityIndicator.textContent = "★".repeat(tasca.priority ?? 3);

      const textSpan = document.createElement("span");
      textSpan.className = "task-text";
      textSpan.textContent = tasca.text;
      if (tasca.done) textSpan.classList.add("done");

      textSpan.onclick = (e) => {
        e.stopPropagation();
        openViewModal(tasca);
      };

      const descSpan = document.createElement("div");
      descSpan.className = "task-description";
      if (tasca.description) descSpan.textContent = tasca.description;

      const actions = document.createElement("div");
      actions.className = "task-actions";

      // Assignar a un altre dia
      const assignBtn = document.createElement("button");
      assignBtn.textContent = "📅";
      assignBtn.title = "Assignar a un altre dia";
      assignBtn.onclick = () => {
        taskBeingAssigned = {
          id: tasca.id,
          ...tasca,
          from: selectedDate ?? UNASSIGNED_ID,
          originalIndex: realIndex
        };
      };

      // Editar
      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️";
      editBtn.title = "Editar";
      editBtn.onclick = () => openEditModal(tasca);

      // Duplicar
      const duplicateBtn = document.createElement("button");
      duplicateBtn.textContent = "📋";
      duplicateBtn.title = "Duplicar";
      duplicateBtn.onclick = async () => {
        const docId = selectedDate ?? UNASSIGNED_ID;
        const docSnap = await db.collection("tasques").doc(docId).get();
        const tasques = docSnap.exists ? docSnap.data().tasques : [];
        const idx = tasques.findIndex(t => t.id === tasca.id);
        if (idx >= 0) {
          const copia = {
            ...tasca,
            id: crearId(),
            text: tasca.text + " (còpia)"
          };
          tasques.splice(idx + 1, 0, copia);
          pushUndo({ type: "add", day: docId, id: copia.id, task: copia });
          await guardarTasques(docId, tasques);
        }
      };

      // Eliminar
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️";
      deleteBtn.title = "Eliminar";
      deleteBtn.onclick = async () => {
        const docId = selectedDate ?? UNASSIGNED_ID;
        const docSnap = await db.collection("tasques").doc(docId).get();
        const tasques = docSnap.exists ? docSnap.data().tasques : [];
        const idx = tasques.findIndex(t => t.id === tasca.id);
        if (idx >= 0) {
          const eliminada = tasques.splice(idx, 1)[0];
          pushUndo({ type: "delete", day: docId, task: eliminada, position: idx });
          tasquesEliminades.push({ ...eliminada, from: docId, deletedAt: Date.now() });
          await guardarTasques(docId, tasques);
        }
      };

      // Botó fet/pendent
      const doneBtn = document.createElement("button");
      doneBtn.title = tasca.done ? "Marcar com a pendent" : "Marcar com a feta";
      doneBtn.innerHTML = tasca.done
        ? '<span style="color:#e74c3c;font-size:1.2em;">✗</span>'
        : '<span style="color:#27ae60;font-size:1.2em;">✓</span>';
      doneBtn.onclick = async (e) => {
        e.stopPropagation();
        const docId = selectedDate ?? UNASSIGNED_ID;
        const docSnap = await db.collection("tasques").doc(docId).get();
        const tasques = docSnap.exists ? docSnap.data().tasques : [];
        const idx = tasques.findIndex(t => t.id === tasca.id);
        if (idx >= 0) {
          const previousDone = tasques[idx].done;
          tasques[idx].done = !tasques[idx].done;
          pushUndo({ type: "toggle", day: docId, id: tasca.id, previousDone });
          await guardarTasques(docId, tasques);
        }
      };

      if ((selectedDate ?? UNASSIGNED_ID) !== UNASSIGNED_ID) {
        const toNoDateBtn = document.createElement("button");
        toNoDateBtn.textContent = "⇨ Sense dia";
        toNoDateBtn.title = "Mou a Sense dia";
        toNoDateBtn.onclick = async () => {
          // Treu la tasca del dia actual
          const docId = selectedDate ?? UNASSIGNED_ID;
          const docSnap = await db.collection("tasques").doc(docId).get();
          let tasques = docSnap.exists ? docSnap.data().tasques : [];
          const idx = tasques.findIndex(t => t.id === tasca.id);
          if (idx >= 0) {
            const movedTask = tasques.splice(idx, 1)[0];
            await guardarTasques(docId, tasques);

            // Afegeix la tasca a "sense dia"
            const noDateSnap = await db.collection("tasques").doc(UNASSIGNED_ID).get();
            const noDateTasks = noDateSnap.exists ? noDateSnap.data().tasques : [];
            noDateTasks.push(movedTask);
            await guardarTasques(UNASSIGNED_ID, noDateTasks);

            pushUndo({
              type: "move",
              from: UNASSIGNED_ID,
              to: docId,
              id: movedTask.id,
              originalPosition: idx,
              destPosition: noDateTasks.length - 1
            });
          }
        };
        actions.appendChild(toNoDateBtn);
      }

      actions.appendChild(assignBtn);
      actions.appendChild(editBtn);
      actions.appendChild(duplicateBtn);
      actions.appendChild(deleteBtn);
      actions.appendChild(doneBtn);

      li.appendChild(priorityIndicator);
      li.appendChild(textSpan);
      li.appendChild(descSpan);
      li.appendChild(actions);
      taskList.appendChild(li);
    });
  };

  afegirSeccio("Tasques pendents",   pendents, "orange");
  afegirSeccio("Tasques completades", fetes,   "green");
}

// ==============================
// Modal d'edició (estils millorats)
// ==============================
function openEditModal(tasca) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="form-group">
      <label>Títol</label>
      <input type="text" id="edit-task-title" />
    </div>
    <div class="form-group">
      <label>Descripció</label>
      <textarea id="edit-task-desc"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Prioritat (1-5)</label>
        <select id="edit-task-priority">
          <option value="1">1 - Molt baixa</option>
          <option value="2">2 - Baixa</option>
          <option value="3">3 - Mitjana</option>
          <option value="4">4 - Alta</option>
          <option value="5">5 - Molt alta</option>
        </select>
      </div>
      <div class="form-group">
        <label>Marcar com a feta</label>
        <select id="edit-task-done">
          <option value="false">No</option>
          <option value="true">Sí</option>
        </select>
      </div>
    </div>
  `;
  wrap.querySelector("#edit-task-title").value = tasca.text ?? "";
  wrap.querySelector("#edit-task-desc").value  = tasca.description ?? "";
  wrap.querySelector("#edit-task-priority").value = String(tasca.priority ?? 3);
  wrap.querySelector("#edit-task-done").value = String(!!tasca.done);

  openModal({
    title: "Editar Tasca",
    bodyNode: wrap,
    showClose: true,
    actions: [
      { label: "Cancel·lar", onClick: () => false },
      {
        label: "Guardar",
        primary: true,
        onClick: async () => {
          // Troba el docId correcte
          let docId = selectedDate ?? UNASSIGNED_ID;
          // Si la tasca té la propietat data, usa-la
          if (tasca.data) docId = tasca.data;
          const docSnap = await db.collection("tasques").doc(docId).get();
          const tasques = docSnap.exists ? docSnap.data().tasques : [];
          const idx = tasques.findIndex(t => t.id === tasca.id);
          if (idx >= 0) {
            const previous = {
              text: tasques[idx].text,
              description: tasques[idx].description,
              priority: tasques[idx].priority,
              done: tasques[idx].done
            };
            const next = {
              text: wrap.querySelector("#edit-task-title").value,
              description: wrap.querySelector("#edit-task-desc").value,
              priority: parseInt(wrap.querySelector("#edit-task-priority").value),
              done: wrap.querySelector("#edit-task-done").value === "true"
            };
            pushUndo({ type: "edit", day: docId, id: tasca.id, previous, next });
            tasques[idx] = { ...tasques[idx], ...next };
            await guardarTasques(docId, tasques);
            escoltarTasques(docId); // Actualitza la llista
          }
          return false;
        }
      }
    ]
  });
}

// ==============================
// Modal de paperera (estils millorats)
// ==============================
function openTrashModal() {
  const list = document.createElement("ul");
  list.className = "trash-list";

  const render = () => {
    list.innerHTML = "";

    if (!tasquesEliminades.length) {
      const empty = document.createElement("p");
      empty.textContent = "No hi ha tasques eliminades.";
      list.appendChild(empty);
      return;
    }

    tasquesEliminades.forEach((tasca, i) => {
      const li = document.createElement("li");

      const main = document.createElement("div");
      main.className = "trash-item-main";

      const star = document.createElement("span");
      star.textContent = "★".repeat(tasca.priority ?? 3);
      star.style.color = "#f1b314";

      const title = document.createElement("span");
      title.className = "trash-item-title";
      title.textContent = tasca.text;

      const badge = document.createElement("span");
      badge.className = "badge-date";
      badge.textContent = tasca.from || "";

      main.appendChild(star);
      main.appendChild(title);
      if (tasca.from) main.appendChild(badge);

      const restore = document.createElement("button");
      restore.className = "btn-icon";
      restore.textContent = "♻️";
      restore.title = "Restaurar";
      restore.onclick = async () => {
        const docSnap = await db.collection("tasques").doc(tasca.from).get();
        const tasques = docSnap.exists ? docSnap.data().tasques : [];
        const restored = {
          id: tasca.id ?? crearId(),
          text: tasca.text,
          done: tasca.done ?? false,
          description: tasca.description ?? "",
          priority: tasca.priority ?? 3
        };
        tasques.push(restored);
        await guardarTasques(tasca.from, tasques);
        pushUndo({ type: "add", day: tasca.from, id: restored.id, task: restored });
        tasquesEliminades.splice(i, 1);
        render();
      };

      li.appendChild(main);
      li.appendChild(restore);
      list.appendChild(li);
    });
  };

  openModal({
    title: "Tasques eliminades",
    bodyNode: list,
    showClose: true,
    actions: [
      { label: "Tancar", onClick: () => false },
      {
        label: "Buida paperera",
        primary: true,
        onClick: () => {
          if (!tasquesEliminades.length) return false;
          const previousTrash = [...tasquesEliminades];
          pushUndo({ type: "emptyTrash", previousTrash });
          tasquesEliminades = [];
          render();
          return true; // mantenim oberta per veure que s'ha buidat
        }
      }
    ]
  });

  render();
}

// ==============================
// Comptadors per al calendari
// ==============================
async function getTasques() {
  const snapshot = await db.collection("tasques").get();
  const totals = [];
  snapshot.forEach((doc) => {
    const id = doc.id;
    if (id === UNASSIGNED_ID) return; // “sense dia” no es compta al calendari
    const data = doc.data();
    (data.tasques || []).forEach((t) => totals.push({ ...t, data: id }));
  });
  comptadorTasques = totals;
  return totals;
}

// ==============================
// Calendari
// ==============================
async function renderCalendar() {
  await getTasques();

  const year     = currentDate.getFullYear();
  const month    = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysIn   = new Date(year, month + 1, 0).getDate();

  calendar.innerHTML = "";
  monthYear.textContent = firstDay
    .toLocaleDateString("ca-ES", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  for (let i = 0; i < startDay; i++) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "calendar-day empty";
    calendar.appendChild(emptyDiv);
  }

  for (let day = 1; day <= daysIn; day++) {
    const date = new Date(year, month, day);
    const iso  = obtenirDataISO(date);

    const div = document.createElement("div");
    div.className = "calendar-day";
    div.dataset.date = iso;

    if (isToday(date))        div.classList.add("today");
    if (selectedDate === iso) div.classList.add("selected");
    if (date < new Date("2025-07-09")) div.classList.add("disabled-past");

    // Drag & Drop
    div.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      div.classList.add("drag-over");
    };
    div.ondragleave = () => div.classList.remove("drag-over");
    div.ondrop = async (e) => {
      e.preventDefault();
      div.classList.remove("drag-over");
      const payload = e.dataTransfer.getData("application/json");
      if (!payload) return;
      const taskData = JSON.parse(payload);
      await assignarTascaADia(taskData, iso);
    };

    const diaSetmana = date.getDay();
    if (diaSetmana === 0 || diaSetmana === 6) {
      div.classList.add("weekend");
    }
    // Ara tots els dies (inclòs especial) tenen clic!
    div.onclick = () => {
      if (taskBeingAssigned) {
        assignarTascaADia(taskBeingAssigned, iso);
        taskBeingAssigned = null;
      } else {
        mostrarTasquesDelDia(date);
      }
    };

    const pendents = comptadorTasques.filter(
      t => t.data === iso && !t.done && (!t.specialDay || t.text) && (!t.festaDay || t.text)
    ).length;
    const fetes = comptadorTasques.filter(
      t => t.data === iso && t.done && (!t.specialDay || t.text) && (!t.festaDay || t.text)
    ).length;

    let tasquesHtml = "";
    if (pendents > 0 || fetes > 0) {
      tasquesHtml = '<div class="tasques">';
      if (pendents > 0) tasquesHtml += `<span data-type="pendents">${pendents} pendents</span><br>`;
      if (fetes > 0)    tasquesHtml += `<span data-type="acabades">${fetes} acabades</span>`;
      tasquesHtml += "</div>";
    }

    div.innerHTML = `
      <div class="dia-num">${date.getDate()}</div>
      ${tasquesHtml}
    `;
    calendar.appendChild(div);

    // Comprova si el dia té una tasca especial
    const tasquesDia = comptadorTasques.filter(t => t.data === iso);
    const especial = tasquesDia.some(t => t.specialDay);
    const festa = tasquesDia.some(t => t.festaDay);

    if (especial) {
      div.classList.add("special-day");
      const motiu = tasquesDia.find(t => t.specialDay && t.specialMotiu)?.specialMotiu || "";
      if (motiu) div.setAttribute("data-motiu", motiu);
    }
    if (festa) {
      div.classList.add("festa-day");
      const motiu = tasquesDia.find(t => t.festaDay && t.festaMotiu)?.festaMotiu || "";
      if (motiu) div.setAttribute("data-festa-motiu", motiu);
    }

    // Tooltip per dies especials
    if (especial && div.getAttribute("data-motiu")) {
      div.addEventListener("mouseenter", showSpecialTooltip);
      div.addEventListener("mouseleave", removeSpecialTooltip);
      div.addEventListener("click", showSpecialTooltip);

      function showSpecialTooltip(e) {
        removeSpecialTooltip();
        let tooltip = document.createElement("div");
        tooltip.className = "special-tooltip";
        tooltip.textContent = div.getAttribute("data-motiu");
        tooltip.style.position = "absolute";
        tooltip.style.background = "rgb(252, 255, 255)";
        tooltip.style.border = "1px solid #bbbd41";
        tooltip.style.color = "#bbbd41";
        tooltip.style.padding = "6px 12px";
        tooltip.style.borderRadius = "6px";
        tooltip.style.zIndex = "1000";
        tooltip.style.left = (div.getBoundingClientRect().left + window.scrollX) + "px";
        tooltip.style.top = (div.getBoundingClientRect().bottom + window.scrollY + 2) + "px";
        tooltip.id = "special-tooltip";
        document.body.appendChild(tooltip);

        // Elimina el tooltip si cliques fora o a un altre dia
        setTimeout(() => {
          document.addEventListener("mousedown", globalTooltipRemover);
        }, 10);
      }
      function removeSpecialTooltip() {
        const tooltip = document.getElementById("special-tooltip");
        if (tooltip) tooltip.remove();
        document.removeEventListener("mousedown", globalTooltipRemover);
      }
      function globalTooltipRemover(e) {
        if (!div.contains(e.target)) removeSpecialTooltip();
      }
    }

    // Tooltip per dies de festa
    if (festa && div.getAttribute("data-festa-motiu")) {
      div.addEventListener("mouseenter", showFestaTooltip);
      div.addEventListener("mouseleave", removeFestaTooltip);
      div.addEventListener("click", showFestaTooltip);

      function showFestaTooltip(e) {
        removeFestaTooltip();
        let tooltip = document.createElement("div");
        tooltip.className = "festa-tooltip";
        tooltip.textContent = div.getAttribute("data-festa-motiu");
        tooltip.style.position = "absolute";
        tooltip.style.background = "#fff";
        tooltip.style.border = "1px solid #27ae60";
        tooltip.style.color = "#27ae60";
        tooltip.style.padding = "6px 12px";
        tooltip.style.borderRadius = "6px";
        tooltip.style.zIndex = "1000";
        tooltip.style.left = (div.getBoundingClientRect().left + window.scrollX) + "px";
        tooltip.style.top = (div.getBoundingClientRect().bottom + window.scrollY + 2) + "px";
        tooltip.id = "festa-tooltip";
        document.body.appendChild(tooltip);

        setTimeout(() => {
          document.addEventListener("mousedown", globalFestaTooltipRemover);
        }, 10);
      }
      function removeFestaTooltip() {
        const tooltip = document.getElementById("festa-tooltip");
        if (tooltip) tooltip.remove();
        document.removeEventListener("mousedown", globalFestaTooltipRemover);
      }
      function globalFestaTooltipRemover(e) {
        if (!div.contains(e.target)) removeFestaTooltip();
      }
    }

    // Menú contextual per al dia
    div.oncontextmenu = function(e) {
      e.preventDefault();
      openDayContextMenu(div, iso);
    };
  }
}

// ==============================
// Vista: dia seleccionat / sense dia
// ==============================
function mostrarTasquesDelDia(data) {
  selectedDate = obtenirDataISO(data);
  dayTitle.textContent = data
    .toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^\w/, (c) => c.toUpperCase());

  // mostra ✕
  closeDayBtn.style.display = "inline-flex";

  escoltarTasques(selectedDate);
  marcarDiaSeleccionat(selectedDate);
}

function mostrarTasquesPendentsSenseDia() {
  selectedDate = null;
  dayTitle.textContent = "Tasques pendents (sense dia)";

  // amaga ✕
  closeDayBtn.style.display = "none";

  escoltarTasques(UNASSIGNED_ID);
  marcarDiaSeleccionat(null);
}

// ==============================
// Subscripció a un doc de tasques
// ==============================
function escoltarTasques(docId) {
  if (unsubscribeTasques) unsubscribeTasques();
  const ref = db.collection("tasques").doc(docId);
  unsubscribeTasques = ref.onSnapshot((docSnap) => {
    const tasques = docSnap.exists ? (docSnap.data().tasques || []) : [];
    // Migració suau a IDs i camps
    let needsSave = false;
    tasques.forEach((t) => {
      if (!t.id) { t.id = crearId(); needsSave = true; }
      if (t.priority     === undefined) t.priority     = 3;
      if (t.description  === undefined) t.description  = "";
      if (t.done         === undefined) t.done         = false;
    });
    if (needsSave) db.collection("tasques").doc(docId).set({ tasques });
    renderitzarTasquesAmbLlista(tasques);
    renderCalendar();
  });
}

// ==============================
// CRUD helpers
// ==============================
async function guardarTasques(docId, tasques) {
  await db.collection("tasques").doc(docId).set({ tasques });
}

async function assignarTascaADia(taskData, nouDia) {
  const { id, from, originalIndex } = taskData;

  if (from) {
    // treure de l'origen
    const fromSnap = await db.collection("tasques").doc(from).get();
    let fromTasks  = fromSnap.exists ? fromSnap.data().tasques : [];
    const idx      = fromTasks.findIndex((t) => t.id === id);
    let movedTask  = null;

    if (idx >= 0) {
      movedTask = fromTasks.splice(idx, 1)[0];
      await guardarTasques(from, fromTasks);
    }

    // afegir al destí
    const toSnap   = await db.collection("tasques").doc(nouDia).get();
    const toTasks  = toSnap.exists ? toSnap.data().tasques : [];
    const toInsert = movedTask ?? {
      id: id ?? crearId(),
      text: taskData.text,
      done: taskData.done ?? false,
      description: taskData.description ?? "",
      priority: taskData.priority ?? 3
    };
    const destPosition = toTasks.length;
    toTasks.push(toInsert);
    await guardarTasques(nouDia, toTasks);

    pushUndo({
      type: "move",
      from: nouDia,
      to: from,
      id: toInsert.id,
      originalPosition: originalIndex,
      destPosition
    });
  } else {
    // afegir directe
    const toSnap  = await db.collection("tasques").doc(nouDia).get();
    const toTasks = toSnap.exists ? toSnap.data().tasques : [];
    const newId   = id ?? crearId();
    const nova    = {
      id: newId,
      text: taskData.text,
      done: taskData.done ?? false,
      description: taskData.description ?? "",
      priority: taskData.priority ?? 3
    };
    toTasks.push(nova);
    await guardarTasques(nouDia, toTasks);
    pushUndo({ type: "add", day: nouDia, id: newId, task: nova });
  }

  renderCalendar(); // <-- afegeix aquesta línia
}

// ==============================
// Undo / Redo
// ==============================
async function doUndo() {
  if (!undoStack.length) return;
  const action = undoStack.pop();
  let redoAction = null;

  switch (action.type) {
    case "toggle": {
      const { day, id, previousDone } = action;
      const docSnap = await db.collection("tasques").doc(day).get();
      const tasques = docSnap.exists ? docSnap.data().tasques : [];
      const idx = tasques.findIndex((t) => t.id === id);
      if (idx >= 0) {
        const current = tasques[idx].done;
        tasques[idx].done = previousDone;
        await guardarTasques(day, tasques);
        redoAction = { type: "toggle", day, id, previousDone: current };
      }
      break;
    }
    case "edit": {
      const { day, id, previous, next } = action;
      const docSnap = await db.collection("tasques").doc(day).get();
      const tasques = docSnap.exists ? docSnap.data().tasques : [];
      const idx = tasques.findIndex((t) => t.id === id);
      if (idx >= 0) {
        const current = {
          text: tasques[idx].text,
          description: tasques[idx].description,
          priority: tasques[idx].priority,
          done: tasques[idx].done
        };
        tasques[idx] = { ...tasques[idx], ...previous };
        await guardarTasques(day, tasques);
        redoAction = { type: "edit", day, id, previous: next, next: previous ?? current };
      }
      break;
    }
    case "add": {
      const { day, id } = action;
      const docSnap = await db.collection("tasques").doc(day).get();
      let tasques = docSnap.exists ? docSnap.data().tasques : [];
      tasques = tasques.filter((t) => t.id !== id);
      await guardarTasques(day, tasques);
      redoAction = { type: "reAdd", day, task: action.task };
      break;
    }
    case "delete": {
      const { day, task, position } = action;
      const docSnap = await db.collection("tasques").doc(day).get();
      const tasques = docSnap.exists ? docSnap.data().tasques : [];
      const pos = Number.isInteger(position) ? Math.max(0, Math.min(position, tasques.length)) : tasques.length;
      tasques.splice(pos, 0, task);
      await guardarTasques(day, tasques);
      redoAction = { type: "deleteAgain", day, id: task.id };
      break;
    }
    case "move": {
      const { from, to, id, originalPosition, destPosition } = action;
      const fromSnap = await db.collection("tasques").doc(from).get();
      let fromTasks  = fromSnap.exists ? fromSnap.data().tasques : [];
      const moved    = fromTasks.find((t) => t.id === id);
      fromTasks      = fromTasks.filter((t) => t.id !== id);
      await guardarTasques(from, fromTasks);

      if (moved) {
        const toSnap  = await db.collection("tasques").doc(to).get();
        const toTasks = toSnap.exists ? toSnap.data().tasques : [];
        const pos = Number.isInteger(originalPosition)
          ? Math.max(0, Math.min(originalPosition, toTasks.length))
          : toTasks.length;
        toTasks.splice(pos, 0, moved);
        await guardarTasques(to, toTasks);
      }
      redoAction = { type: "moveAgain", src: to, dst: from, id, dstPosition: destPosition };
      break;
    }
    case "emptyTrash": {
      const prev = action.previousTrash || [];
      tasquesEliminades = prev;
      redoAction = { type: "setTrash", value: [] };
      break;
    }
    default: break;
  }

  if (redoAction) redoStack.push(redoAction);
  setUndoRedoDisabled();
}

async function doRedo() {
  if (!redoStack.length) return;
  const action = redoStack.pop();
  let undoAction = null;

  switch (action.type) {
    case "toggle": {
      const { day, id, previousDone } = action;
      const docSnap = await db.collection("tasques").doc(day).get();
      const tasques = docSnap.exists ? docSnap.data().tasques : [];
      const idx = tasques.findIndex((t) => t.id === id);
      if (idx >= 0) {
        const before = tasques[idx].done;
        tasques[idx].done = previousDone;
        await guardarTasques(day, tasques);
        undoAction = { type: "toggle", day, id, previousDone: before };
      }
      break;
    }
    case "edit": {
      const { day, id, previous } = action;
      const docSnap = await db.collection("tasques").doc(day).get();
      const tasques = docSnap.exists ? docSnap.data().tasques : [];
      const idx = tasques.findIndex((t) => t.id === id);
      if (idx >= 0) {
        const before = {
          text: tasques[idx].text,
          description: tasques[idx].description,
          priority: tasques[idx].priority,
          done: tasques[idx].done
        };
        tasques[idx] = { ...tasques[idx], ...previous };
        await guardarTasques(day, tasques);
        undoAction = { type: "edit", day, id, previous: before, next: previous };
      }
      break;
    }
    case "reAdd": {
      const { day, task } = action;
      const docSnap = await db.collection("tasques").doc(day).get();
      const tasques = docSnap.exists ? docSnap.data().tasques : [];
      tasques.push(task);
      await guardarTasques(day, tasques);
      undoAction = { type: "add", day, id: task.id, task };
      break;
    }
    case "deleteAgain": {
      const { day, id } = action;
      const docSnap = await db.collection("tasques").doc(day).get();
      let tasques = docSnap.exists ? docSnap.data().tasques : [];
      const idx = tasques.findIndex((t) => t.id === id);
      if (idx >= 0) {
        const removed = tasques.splice(idx, 1)[0];
        await guardarTasques(day, tasques);
        undoAction = { type: "delete", day, task: removed, position: idx };
      }
      break;
    }
    case "moveAgain": {
      const { src, dst, id, dstPosition } = action;
      const srcSnap = await db.collection("tasques").doc(src).get();
      let srcTasks  = srcSnap.exists ? srcSnap.data().tasques : [];
      const moved   = srcTasks.find((t) => t.id === id);
      srcTasks      = srcTasks.filter((t) => t.id !== id);
      await guardarTasques(src, srcTasks);

      if (moved) {
        const dstSnap  = await db.collection("tasques").doc(dst).get();
        const dstTasks = dstSnap.exists ? dstSnap.data().tasques : [];
        const pos = Number.isInteger(dstPosition)
          ? Math.max(0, Math.min(dstPosition, dstTasks.length))
          : dstTasks.length;
        dstTasks.splice(pos, 0, moved);
        await guardarTasques(dst, dstTasks);
        undoAction = { type: "move", from: dst, to: src, id, originalPosition: pos, destPosition: srcTasks.length };
      }
      break;
    }
    case "setTrash": {
      const prev = [...tasquesEliminades];
      tasquesEliminades = action.value || [];
      undoAction = { type: "emptyTrash", previousTrash: prev };
      break;
    }
    default: break;
  }

  if (undoAction) undoStack.push(undoAction);
  setUndoRedoDisabled();
}

// ==============================
// Accions UI
// ==============================
showTrashBtn.onclick = () => openTrashModal();
undoBtn.onclick      = () => doUndo();
redoBtn.onclick      = () => doRedo();
closeDayBtn.onclick  = () => mostrarTasquesPendentsSenseDia();
document.getElementById('add-task-modal').addEventListener('click', function() {
  openTaskModal(); // Debes tenir una funció que abra el modal de edició/creació
});

document.getElementById("prev-month").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
};
document.getElementById("next-month").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
};

let searchTimeout = null;
document.getElementById("search-input").oninput = function() {
  const resultsList = document.getElementById("search-results");
  // Animació: esvaeix la llista
  resultsList.classList.add("fade-out");
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const term = this.value.trim().toLowerCase();
    resultsList.innerHTML = "";

    if (!term) {
      resultsList.classList.remove("fade-out");
      return;
    }

    // Cerca a tots els dies, evita duplicats per id
    const snapshot = await db.collection("tasques").get();
    const seenIds = new Set();
    const results = [];
    snapshot.forEach(doc => {
      const docId = doc.id;
      const tasques = doc.data().tasques || [];
      tasques.forEach(t => {
        if (
          (t.text.toLowerCase().includes(term) ||
          (t.description ?? "").toLowerCase().includes(term))
          && !seenIds.has(t.id)
        ) {
          seenIds.add(t.id);
          results.push({
            ...t,
            docId,
          });
        }
      });
    });

    if (!results.length) {
      resultsList.innerHTML = "<li style='color:#888;padding:8px;'>Cap resultat</li>";
    } else {
      results.forEach(tasca => {
        const li = document.createElement("li");
        li.className = "search-result-item";
        const title = document.createElement("span");
        title.className = "search-result-title";
        title.textContent = tasca.text;
        title.onclick = () => {
          if (tasca.docId === UNASSIGNED_ID) {
            mostrarTasquesPendentsSenseDia();
          } else {
            const parts = tasca.docId.split("-");
            if (parts.length === 3) {
              const data = new Date(parts[0], parts[1] - 1, parts[2]);
              mostrarTasquesDelDia(data);
            }
          }
        };
        const date = document.createElement("span");
        date.className = "search-result-date";
        if (tasca.docId === UNASSIGNED_ID) {
          date.textContent = "Sense dia";
        } else {
          const parts = tasca.docId.split("-");
          if (parts.length === 3) {
            date.textContent = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else {
            date.textContent = tasca.docId;
          }
        }
        li.appendChild(title);
        li.appendChild(date);
        li.onclick = () => title.onclick();
        resultsList.appendChild(li);
      });
    }
    // Animació: apareix la llista
    resultsList.classList.remove("fade-out");
    resultsList.classList.add("fade-in");
    setTimeout(() => resultsList.classList.remove("fade-in"), 300);
  }, 300); // 300ms de debounce
};


// ==============================
// Inici
// ==============================
window.addEventListener("DOMContentLoaded", () => {
  renderCalendar();
  mostrarTasquesPendentsSenseDia(); // arrenca amb “sense dia”
  setUndoRedoDisabled();
});

function parseLinks(text) {
  // Replace URLs in text with clickable links
  return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
}

function openViewModal(tasca) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div style="margin-bottom:8px;">
      <strong style="font-size:1.15em;color:#2596be;">${tasca.text}</strong>
    </div>
    <div style="margin-bottom:8px;">
      <span style="color:#888;">Prioritat:</span> ${tasca.priority ?? 3}
    </div>
    <div style="margin-bottom:8px;">
      <span style="color:#888;">Estat:</span> ${tasca.done ? '<span style="color:#27ae60;">Feta</span>' : '<span style="color:#e74c3c;">Pendent</span>'}
    </div>
    <div style="margin-bottom:8px;">
      <span style="color:#888;">Descripció:</span><br>
      <div style="white-space:pre-line;">${parseLinks(tasca.description ?? "")}</div>
    </div>
  `;

  openModal({
    title: "Detalls de la tasca",
    bodyNode: wrap,
    showClose: true,
    actions: [
      { label: "Tancar", onClick: () => false }
    ]
  });
}

function openTaskModal() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="form-group">
      <label>Títol</label>
      <input type="text" id="edit-task-title" />
    </div>
    <div class="form-group">
      <label>Descripció</label>
      <textarea id="edit-task-desc"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Prioritat (1-5)</label>
        <select id="edit-task-priority">
          <option value="1">1 - Molt baixa</option>
          <option value="2">2 - Baixa</option>
          <option value="3">3 - Mitjana</option>
          <option value="4">4 - Alta</option>
          <option value="5">5 - Molt alta</option>
        </select>
      </div>
      <div class="form-group">
        <label>Marcar com a feta</label>
        <select id="edit-task-done">
          <option value="false">No</option>
          <option value="true">Sí</option>
        </select>
      </div>
    </div>
    <div class="form-group" style="margin-bottom:10px;">
      <label id="edit-task-title">Repetició:</label>
      <select id="edit-task-repeat-type">
        <option value="">Cap</option>
        <option value="diaria">Diària</option>
        <option value="setmanal">Setmanal</option>
        <option value="mensual">Mensual</option>
      </select>
      <div id="repeat-options" style="margin-top:8px;display:none;">
        <!-- S'omplirà dinàmicament -->
      </div>
    </div>
  `;

  const repeatType = wrap.querySelector("#edit-task-repeat-type");
  const repeatOptions = wrap.querySelector("#repeat-options");
  repeatType.onchange = function() {
    repeatOptions.innerHTML = "";
    repeatOptions.style.display = this.value ? "" : "none";
    if (this.value === "diaria") {
      repeatOptions.innerHTML = `
        <div id="repeat-weekday-checkboxes">
          <label><input type="checkbox" value="1" /> Dilluns</label>
          <label><input type="checkbox" value="2" /> Dimarts</label>
          <label><input type="checkbox" value="3" /> Dimecres</label>
          <label><input type="checkbox" value="4" /> Dijous</label>
          <label><input type="checkbox" value="5" /> Divendres</label>
        </div>
        <label style="color:#2596be;">Data final de repetició:</label>
        <input type="text" id="edit-task-repeat-end" readonly style="width:120px; margin-right:8px;" />
        <button id="open-repeat-calendar" type="button" style="background:#2596be;color:#fff;border:none;border-radius:6px;padding:4px 12px;cursor:pointer;">Calendari</button>
        <div id="repeat-calendar-popup" style="display:none;position:absolute;z-index:1001;"></div>
      `;

      // Només aquí existeix el botó!
      const repeatEndInput = repeatOptions.querySelector("#edit-task-repeat-end");
      const calendarBtn = repeatOptions.querySelector("#open-repeat-calendar");
      const calendarPopup = repeatOptions.querySelector("#repeat-calendar-popup");

      calendarBtn.onclick = function(e) {
        calendarPopup.style.display = "";
        calendarPopup.innerHTML = `
          <input type="date" id="repeat-end-date" style="font-size:1em;padding:6px;border-radius:6px;border:1px solid #2596be;" />
          <button id="set-repeat-end" style="margin-left:8px;background:#2596be;color:#fff;border:none;border-radius:6px;padding:4px 12px;cursor:pointer;">OK</button>
        `;
        calendarPopup.style.left = calendarBtn.getBoundingClientRect().left + window.scrollX + "px";
        calendarPopup.style.top = calendarBtn.getBoundingClientRect().bottom + window.scrollY + 2 + "px";

        calendarPopup.querySelector("#set-repeat-end").onclick = function() {
          const val = calendarPopup.querySelector("#repeat-end-date").value;
          if (val) {
            repeatEndInput.value = val;
            calendarPopup.style.display = "none";
          }
        };
        setTimeout(() => {
          document.addEventListener("mousedown", function handler(ev) {
            if (!calendarPopup.contains(ev.target) && ev.target !== calendarBtn) {
              calendarPopup.style.display = "none";
              document.removeEventListener("mousedown", handler);
            }
          });
        }, 10);
      };
    }
    // No facis res per setmanal/mensual aquí!
  };

  openModal({
    title: "Afegir Tasca",
    bodyNode: wrap,
    showClose: true,
    actions: [
      { label: "Cancel·lar", onClick: () => false },
      {
        label: "Crear",
        primary: true,
        onClick: async () => {
          const text = wrap.querySelector("#edit-task-title").value.trim();
          if (!text) return true;
          const docId = selectedDate ?? UNASSIGNED_ID;
          const docSnap = await db.collection("tasques").doc(docId).get();
          const tasques = docSnap.exists ? docSnap.data().tasques : [];
          // Recull la repetició
          const repeatTypeVal = repeatType.value;
          let repeat = null;
          let tasquesACrear = [];
          if (repeatTypeVal === "diaria") {
            repeat = { type: repeatTypeVal };
            repeat.days = Array.from(wrap.querySelectorAll("#repeat-weekday-checkboxes input[type=checkbox]:checked")).map(cb => parseInt(cb.value));
            // Recupera el valor de repeatEndInput aquí!
            const repeatEndInput = wrap.querySelector("#edit-task-repeat-end");
            const endDateStr = repeatEndInput ? repeatEndInput.value : "";
            let baseDate = selectedDate ? new Date(selectedDate) : new Date();
            let dates = [];
            if (endDateStr) {
              let endDate = new Date(endDateStr);
              let d = new Date(baseDate);
              while (d <= endDate) {
                if (repeat.days.includes(d.getDay())) {
                  dates.push(obtenirDataISO(d));
                }
                d.setDate(d.getDate() + 1);
              }
            }
            // Guarda la tasca a cada dia calculat
            for (const iso of dates) {
              const docSnap = await db.collection("tasques").doc(iso).get();
              const tasques = docSnap.exists ? docSnap.data().tasques : [];
              tasques.push({
                id: crearId(),
                text,
                description: wrap.querySelector("#edit-task-desc").value,
                priority: parseInt(wrap.querySelector("#edit-task-priority").value),
                done: wrap.querySelector("#edit-task-done").value === "true",
                repeat: null
              });
              await guardarTasques(iso, tasques);
            }
          } else {
            // Tasca normal o setmanal/mensual
            const docId = selectedDate ?? UNASSIGNED_ID;
            const docSnap = await db.collection("tasques").doc(docId).get();
            const tasques = docSnap.exists ? docSnap.data().tasques : [];
            tasques.push({
              id: crearId(),
              text,
              description: wrap.querySelector("#edit-task-desc").value,
              priority: parseInt(wrap.querySelector("#edit-task-priority").value),
              done: wrap.querySelector("#edit-task-done").value === "true",
              repeat
            });
            await guardarTasques(docId, tasques);
          }
          escoltarTasques(selectedDate ?? UNASSIGNED_ID);
          return false;
        }
      }
    ]
  });
}

function openDayContextMenu(dayDiv, iso) {
  document.querySelectorAll(".calendar-context-menu").forEach(m => m.remove());

  const tasquesDia = comptadorTasques.filter(t => t.data === iso);
  const especial = tasquesDia.some(t => t.specialDay);

  const menu = document.createElement("div");
  menu.className = "calendar-context-menu";
  menu.style.position = "absolute";
  menu.style.left = (dayDiv.getBoundingClientRect().left + window.scrollX) + "px";
  menu.style.top = (dayDiv.getBoundingClientRect().bottom + window.scrollY) + "px";
  menu.style.background = "#fff";
  menu.style.border = "1px solid #ccc";
  menu.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
  menu.style.zIndex = "1000";
  menu.style.padding = "8px";
  menu.style.borderRadius = "8px";
  menu.innerHTML = `
    <div class="context-menu-item" id="toggle-special-day" style="cursor:pointer;padding:6px 12px;">
      ${especial ? "Desmarcar com a dia especial" : "Marcar com a dia especial"}
    </div>
    <div class="context-menu-item" id="toggle-festa-day" style="cursor:pointer;padding:6px 12px;">
      Marcar com a dia de Festa
    </div>
    <div class="context-menu-item" id="delete-all-tasks" style="cursor:pointer;padding:6px 12px;">
      Borrar totes les tasques del dia
    </div>
  `;
  document.body.appendChild(menu);

  // Hover blauet
  menu.querySelectorAll(".context-menu-item").forEach(item => {
    item.onmouseenter = () => item.style.background = "rgba(37,150,190,0.18)";
    item.onmouseleave = () => item.style.background = "";
  });

  setTimeout(() => {
    document.addEventListener("click", function handler(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener("click", handler);
      }
    });
  }, 10);

  menu.querySelector("#toggle-special-day").onclick = async () => {
    menu.remove();
    if (especial) {
      const docSnap = await db.collection("tasques").doc(iso).get();
      let tasques = docSnap.exists ? docSnap.data().tasques : [];
      tasques = tasques.filter(t => !t.specialDay);
      await guardarTasques(iso, tasques);
      escoltarTasques(iso);
    } else {
      openSpecialDayModal(iso);
    }
  };

  menu.querySelector("#toggle-festa-day").onclick = async () => {
    menu.remove();
    openFestaDayModal(iso);
  };

  menu.querySelector("#delete-all-tasks").onclick = async () => {
    menu.remove();
    await guardarTasques(iso, []);
    escoltarTasques(iso);
  };
}

function openSpecialDayModal(iso) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="form-group">
      <label for="special-day-motiu" style="font-weight:600;">Motiu del dia especial:</label>
      <input type="text" id="special-day-motiu" placeholder="Escriu el motiu..." style="width:90%;" />
    </div>
  `;
  openModal({
    title: "Marcar dia com a especial",
    bodyNode: wrap,
    showClose: true,
    actions: [
      { label: "Cancel·lar", onClick: () => false },
      {
        label: "Guardar",
        primary: true,
        onClick: async () => {
          const motiu = wrap.querySelector("#special-day-motiu").value.trim();
          // Guarda el dia especial a Firestore
          const docSnap = await db.collection("tasques").doc(iso).get();
          const tasques = docSnap.exists ? docSnap.data().tasques : [];
          // Marca el dia especial (guardem com una tasca especial invisible)
          let found = tasques.find(t => t.specialDay);
          if (found) {
            found.specialMotiu = motiu;
          } else {
            tasques.push({
              id: crearId(),
              text: "",
              specialDay: true,
              specialMotiu: motiu
            });
          }
          await guardarTasques(iso, tasques);
          escoltarTasques(iso);
          return false;
        }
      }
    ]
  });
}

function openFestaDayModal(iso) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="form-group">
      <label for="festa-day-motiu" style="font-weight:600;">Motiu dia de festa:</label>
      <input type="text" id="festa-day-motiu" placeholder="Escriu el motiu..." style="width:90%;" />
    </div>
  `;
  openModal({
    title: "Marcar dia com a Festa",
    bodyNode: wrap,
    showClose: true,
    actions: [
      { label: "Cancel·lar", onClick: () => false },
      {
        label: "Guardar",
        primary: true,
        onClick: async () => {
          const motiu = wrap.querySelector("#festa-day-motiu").value.trim();
          // Guarda el dia de festa a Firestore
          const docSnap = await db.collection("tasques").doc(iso).get();
          const tasques = docSnap.exists ? docSnap.data().tasques : [];
          // Marca el dia de festa (guardem com una tasca especial invisible)
          let found = tasques.find(t => t.festaDay);
          if (found) {
            found.festaMotiu = motiu;
          } else {
            tasques.push({
              id: crearId(),
              text: "",
              festaDay: true,
              festaMotiu: motiu
            });
          }
          await guardarTasques(iso, tasques);
          escoltarTasques(iso);
          return false;
        }
      }
    ]
  });
}

// Login
document.getElementById('loginBtn').onclick = async function() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const msg = document.getElementById('msg');
    msg.textContent = '';
    document.getElementById('auth-loader').style.display = 'block';
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        msg.textContent = 'Sessió iniciada!';
        msg.className = 'success';
    } catch (err) {
        msg.textContent = 'Error: ' + (err.message || 'No s\'ha pogut iniciar sessió');
        msg.className = 'error';
    }
    document.getElementById('auth-loader').style.display = 'none';
};

document.getElementById('logoutBtn').onclick = function() {
    firebase.auth().signOut();
};
