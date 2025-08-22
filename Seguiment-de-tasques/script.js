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
    const pendents = tasquesOriginals.filter(t => !t.done).slice().sort(ordenarPerPrioritat);
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
  const pendents = tasquesOriginals.filter(t => !t.done).slice().sort(ordenarPerPrioritat);
  const fetes    = tasquesOriginals.filter(t =>  t.done).slice().sort(ordenarPerPrioritat);

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
    <div class="form-group" style="margin-bottom:10px;">
      <label>
        <input type="checkbox" id="edit-task-special-day" />
        Dia especial
      </label>
      <div id="special-day-motiu-group" style="display:none; margin-top:8px;">
        <label for="edit-task-special-motiu" style="font-weight:600;">Motiu:</label>
        <input type="text" id="edit-task-special-motiu" placeholder="Escriu el motiu..." style="width:80%;" />
      </div>
    </div>
  `;
  wrap.querySelector("#edit-task-title").value = tasca.text;
  wrap.querySelector("#edit-task-desc").value  = tasca.description ?? "";
  wrap.querySelector("#edit-task-priority").value = String(tasca.priority ?? 3);
  wrap.querySelector("#edit-task-done").value = String(!!tasca.done);

  const specialCheckbox = wrap.querySelector("#edit-task-special-day");
  const motiuGroup = wrap.querySelector("#special-day-motiu-group");
  specialCheckbox.onchange = function() {
    motiuGroup.style.display = this.checked ? "" : "none";
  };

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
          const docId = selectedDate ?? UNASSIGNED_ID;
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
    } else {
      div.onclick = () => {
        if (taskBeingAssigned) {
          assignarTascaADia(taskBeingAssigned, iso);
          taskBeingAssigned = null;
        } else {
          mostrarTasquesDelDia(date);
        }
      };
    }

    const pendents = comptadorTasques.filter((t) => t.data === iso && !t.done).length;
    const fetes    = comptadorTasques.filter((t) => t.data === iso &&  t.done).length;

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
      <label>
        <input type="checkbox" id="edit-task-special-day" />
        Dia especial
      </label>
      <div id="special-day-motiu-group" style="display:none; margin-top:8px;">
        <label for="edit-task-special-motiu" style="font-weight:600;">Motiu:</label>
        <input type="text" id="edit-task-special-motiu" placeholder="Escriu el motiu..." style="width:80%;" />
      </div>
    </div>
  `;

  wrap.querySelector("#edit-task-repeat").onchange = function() {
    wrap.querySelector("#repeat-weekday-group").style.display =
      this.value === "weekly" ? "" : "none";
  };

  // Funció per obtenir dies seleccionats (laborables)
  function getSelectedDays() {
    return Array.from(wrap.querySelectorAll("#repeat-weekday-checkboxes input:checked"))
      .map(cb => parseInt(cb.value));
  }

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
          const novaTasca = {
            id: crearId(),
            text,
            description: wrap.querySelector("#edit-task-desc").value,
            priority: parseInt(wrap.querySelector("#edit-task-priority").value),
            done: wrap.querySelector("#edit-task-done").value === "true",
          };

          // Repetició
          const repeatType = wrap.querySelector("#edit-task-repeat").value;
          const repeatDays = getSelectedDays();
          const repeatEnd = wrap.querySelector("#edit-task-repeat-end").value;
          const repeatGroupId = crearId();

          if (!repeatType) {
            await guardarTasques(docId, [...tasques, novaTasca]);
          } else {
            let date = selectedDate ? new Date(selectedDate) : new Date();
            const endDate = repeatEnd ? new Date(repeatEnd) : date;

            // Validació: si setmanal i no hi ha dies seleccionats, mostra error
            if (repeatType === "weekly" && repeatDays.length === 0) {
              alert("Selecciona almenys un dia de la setmana per la repetició setmanal.");
              return true;
            }

            while (date <= endDate) {
              const dayOfWeek = date.getDay();
              // Salta caps de setmana
              if (dayOfWeek === 0 || dayOfWeek === 6) {
                date.setDate(date.getDate() + 1);
                continue;
              }
              let shouldCreate = false;
              if (repeatType === "daily") {
                shouldCreate = true;
              } else if (repeatType === "weekly" && repeatDays.includes(dayOfWeek)) {
                shouldCreate = true;
              } else if (repeatType === "monthly") {
                // Només el mateix dia del mes que la data inicial, i laborable
                const initialDay = selectedDate ? new Date(selectedDate).getDate() : new Date().getDate();
                if (date.getDate() === initialDay) {
                  shouldCreate = true;
                }
              }
              if (shouldCreate) {
                const diaISO = obtenirDataISO(date);
                const diaSnap = await db.collection("tasques").doc(diaISO).get();
                const diaTasques = diaSnap.exists ? diaSnap.data().tasques : [];
                diaTasques.push({
                  ...novaTasca,
                  repeat: repeatType,
                  repeatDays,
                  repeatEnd,
                  repeatGroupId
                });
                await guardarTasques(diaISO, diaTasques);
              }
              date.setDate(date.getDate() + 1);
            }
          }
          escoltarTasques(selectedDate ?? UNASSIGNED_ID);
          return false;
        }
      }
    ]
  });
}

async function eliminarTasca(tasca, mode) {
  const docId = selectedDate ?? UNASSIGNED_ID;
  if (mode === "nomesAquesta") {
    // elimina només la tasca actual
    const docSnap = await db.collection("tasques").doc(docId).get();
    const tasques = docSnap.exists ? docSnap.data().tasques : [];
    const idx = tasques.findIndex(t => t.id === tasca.id);
    if (idx >= 0) {
      const eliminada = tasques.splice(idx, 1)[0];
      pushUndo({ type: "delete", day: docId, task: eliminada, position: idx });
      tasquesEliminades.push({ ...eliminada, from: docId, deletedAt: Date.now() });
      await guardarTasques(docId, tasques);
      escoltarTasques(docId); // Actualitza la vista
    }
  } else if (mode === "totesRepetides") {
    // elimina totes les tasques amb el mateix repeatGroupId
    const snapshot = await db.collection("tasques").get();
    snapshot.forEach(doc => {
      const tasques = doc.data().tasques || [];
      const noves = tasques.filter(t => t.repeatGroupId !== tasca.repeatGroupId);
      guardarTasques(doc.id, noves);
    });
    escoltarTasques(docId); // Actualitza la vista
  }
}

