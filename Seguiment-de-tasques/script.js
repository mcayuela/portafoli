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

      // Drag payload per ID
      li.ondragstart = (e) => {
        e.dataTransfer.setData("application/json", JSON.stringify({
          id: tasca.id,
          text: tasca.text,
          done: tasca.done,
          description: tasca.description,
          priority: tasca.priority,
          from: selectedDate ?? UNASSIGNED_ID,
          originalIndex: realIndex
        }));
        e.dataTransfer.effectAllowed = "move";
      };

      li.classList.add(`priority-${tasca.priority ?? 3}`);

      const priorityIndicator = document.createElement("span");
      priorityIndicator.className = "priority-indicator";
      priorityIndicator.textContent = "★".repeat(tasca.priority ?? 3);

      const textSpan = document.createElement("span");
      textSpan.className = "task-text";
      textSpan.textContent = tasca.text;
      if (tasca.done) textSpan.classList.add("done");

      // Toggle done
      textSpan.onclick = async () => {
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

      actions.appendChild(assignBtn);
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

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
  wrap.querySelector("#edit-task-title").value = tasca.text;
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
addTaskButton.onclick = async () => {
  const text = newTaskInput.value.trim();
  if (!text) return;

  const docId  = selectedDate ?? UNASSIGNED_ID;
  const snap   = await db.collection("tasques").doc(docId).get();
  const tasq   = snap.exists ? snap.data().tasques : [];
  const newId  = crearId();
  const nova   = { id: newId, text, done: false, description: "", priority: 3 };

  tasq.push(nova);
  pushUndo({ type: "add", day: docId, id: newId, task: nova });
  await guardarTasques(docId, tasq);
  newTaskInput.value = "";
};

newTaskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTaskButton.click();
});

showTrashBtn.onclick = () => openTrashModal();
undoBtn.onclick      = () => doUndo();
redoBtn.onclick      = () => doRedo();
closeDayBtn.onclick  = () => mostrarTasquesPendentsSenseDia();

document.getElementById("prev-month").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
};
document.getElementById("next-month").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
};

// ==============================
// Inici
// ==============================
window.addEventListener("DOMContentLoaded", () => {
  renderCalendar();
  mostrarTasquesPendentsSenseDia(); // arrenca amb “sense dia”
  setUndoRedoDisabled();
});
