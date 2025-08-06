// Configuració de Firebase
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

// Elements del DOM
const calendar = document.getElementById('calendar');
const monthYear = document.getElementById('month-year');
const taskPanel = document.getElementById('task-panel');
const dayTitle = document.getElementById('day-title');
const taskList = document.getElementById('task-list');
const newTaskInput = document.getElementById('new-task');
const addTaskButton = document.getElementById('add-task');
const closeDayBtn = document.getElementById('close-day');
const taskDetails = document.getElementById('task-details');
const taskTitle = document.getElementById('task-title');
const taskDescription = document.getElementById('task-description');
const closeDetails = document.getElementById('close-details');
const editTaskBtn = document.getElementById('edit-task');
const deleteTaskBtn = document.getElementById('delete-task');
const trashListDiv = document.getElementById('deleted-tasks-list');
const showTrashBtn = document.getElementById('show-trash');
const emptyTrashBtn = document.getElementById('empty-trash');

let currentDate = new Date();
let selectedDate = null;
let selectedTaskIndex = null;
let taskBeingAssigned = null;
let unsubscribeTasques = null;
let tasquesEliminades = [];

function obtenirDataISO(date) {
    const any = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${any}-${mes}-${dia}`;
}

function isToday(date) {
    const avui = new Date();
    return date.toDateString() === avui.toDateString();
}

function marcarDiaSeleccionat(dataIso) {
    document.querySelectorAll('.calendar-day').forEach(d => {
        d.classList.remove('selected');
        if (d.dataset.date === dataIso) {
            d.classList.add('selected');
        }
    });
}

function renderitzarTasquesAmbLlista(tasques) {
    taskList.innerHTML = '';

    const pendents = tasques.filter(t => !t.done);
    const fetes = tasques.filter(t => t.done);

    const afegirSeccio = (titol, llista, color) => {
        if (llista.length === 0) return;
        const header = document.createElement('h3');
        header.textContent = titol;
        header.style.color = color;
        taskList.appendChild(header);

        llista.forEach((tasca, index) => {
            const li = document.createElement('li');
            li.draggable = true;
            li.ondragstart = (e) => {
                e.dataTransfer.setData("text/plain", JSON.stringify({ text: tasca.text, done: tasca.done, from: selectedDate, index }));
            };

            const textSpan = document.createElement('span');
            textSpan.className = 'task-text';
            textSpan.textContent = tasca.text;
            if (tasca.done) textSpan.classList.add('done');
            textSpan.onclick = async () => {
                tasca.done = !tasca.done;
                const docSnap = await db.collection("tasques").doc(selectedDate).get();
                const tasquesActualitzades = docSnap.exists ? docSnap.data().tasques : [];
                tasquesActualitzades[index].done = tasca.done;
                await guardarTasques(selectedDate, tasquesActualitzades);
            };

            const actions = document.createElement('div');
            actions.className = 'task-actions';

            const assignBtn = document.createElement('button');
            assignBtn.textContent = '📅';
            assignBtn.title = "Assignar a un altre dia";
            assignBtn.onclick = () => {
                taskBeingAssigned = { text: tasca.text, done: tasca.done, from: selectedDate, index };
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = "Eliminar";
            deleteBtn.onclick = async () => {
                const docSnap = await db.collection("tasques").doc(selectedDate).get();
                const tasquesActualitzades = docSnap.exists ? docSnap.data().tasques : [];
                const eliminada = tasquesActualitzades.splice(index, 1)[0];
                tasquesEliminades.push({ ...eliminada, from: selectedDate });
                await guardarTasques(selectedDate, tasquesActualitzades);
                renderitzarTasquesAmbLlista(tasquesActualitzades);
                renderitzarTasquesEliminades();
            };

            actions.appendChild(assignBtn);
            actions.appendChild(deleteBtn);
            li.appendChild(textSpan);
            li.appendChild(actions);
            taskList.appendChild(li);
        });
    };

    afegirSeccio("Tasques pendents", pendents, 'orange');
    afegirSeccio("Tasques completades", fetes, 'green');
}

function renderitzarTasquesEliminades() {
    trashListDiv.innerHTML = '';
    if (tasquesEliminades.length === 0) {
        trashListDiv.innerHTML = '<p>No hi ha tasques eliminades.</p>';
        return;
    }

    tasquesEliminades.forEach((tasca, i) => {
        const li = document.createElement('li');
        li.textContent = `${tasca.text} (${tasca.from})`;

        const btnRestaurar = document.createElement('button');
        btnRestaurar.textContent = '♻️';
        btnRestaurar.onclick = async () => {
            const docSnap = await db.collection("tasques").doc(tasca.from).get();
            const tasques = docSnap.exists ? docSnap.data().tasques : [];
            tasques.push({ text: tasca.text, done: tasca.done });
            await guardarTasques(tasca.from, tasques);
            tasquesEliminades.splice(i, 1);
            renderitzarTasquesEliminades();
        };

        li.appendChild(btnRestaurar);
        trashListDiv.appendChild(li);
    });
}

let comptadorTasques = [];

async function getTasques() {
    const snapshot = await db.collection("tasques").get();
    let tasquesTotals = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        const dia = doc.id;
        if (Array.isArray(data.tasques)) {
            data.tasques.forEach(tasca => {
                tasquesTotals.push({
                    ...tasca,
                    data: dia
                });
            });
        }
    });
    comptadorTasques = tasquesTotals;
    return tasquesTotals;
}

async function renderCalendar() {
    const dadesTasques = await getTasques();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendar.innerHTML = '';
    monthYear.textContent = firstDay.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());

    for (let i = 0; i < startDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day empty';
        calendar.appendChild(emptyDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const iso = obtenirDataISO(date);

        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.dataset.date = iso;

        if (isToday(date)) div.classList.add('today');
        if (selectedDate === iso) div.classList.add('selected');
        if (date < new Date('2025-07-09')) div.classList.add('disabled-past');

        const diaSetmana = date.getDay();
        if (diaSetmana === 0 || diaSetmana === 6) {
            div.classList.add('weekend');
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

        const pendents = comptadorTasques.filter(t => t.data === iso && !t.done).length;
        const fetes = comptadorTasques.filter(t => t.data === iso && t.done).length;

        let tasquesHtml = '';
        if (pendents === 0 && fetes === 0) {
            tasquesHtml = ''; // si no hi ha cap tasca, no mostrem res
        } else {
            tasquesHtml = `
                <div class="tasques">
                ${pendents > 0 ? `<span style="color: orange;">${pendents} Pendents</span>` : ''}
                ${fetes > 0 ? `<br><span style="color: green;">${fetes} Acabades</span>` : ''}
                </div>
                `;
        }

        div.innerHTML = `
            <div class="dia-num">${date.getDate()}</div>
            ${tasquesHtml}
        `;
        calendar.appendChild(div);
    }
}

function mostrarTasquesDelDia(data) {
    selectedDate = obtenirDataISO(data);
    dayTitle.textContent = data.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    closeDayBtn.classList.remove('hidden');
    escoltarTasques(selectedDate);
    marcarDiaSeleccionat(selectedDate);
}

function mostrarTasquesPendentsSenseDia() {
    selectedDate = 'Tasques pendents';
    dayTitle.textContent = 'Tasques sense dia assignat';
    closeDayBtn.classList.add('hidden');
    escoltarTasques('Tasques pendents');
    marcarDiaSeleccionat(null);
}

function escoltarTasques(dateStr) {
    if (unsubscribeTasques) unsubscribeTasques();
    const docRef = db.collection("tasques").doc(dateStr);
    unsubscribeTasques = docRef.onSnapshot((docSnap) => {
        const tasques = docSnap.exists ? docSnap.data().tasques : [];
        renderitzarTasquesAmbLlista(tasques);
        renderCalendar();
    });
}

async function guardarTasques(dateStr, tasques) {
    if (!dateStr) return;
    await db.collection("tasques").doc(dateStr).set({ tasques });
}

async function assignarTascaADia(taskData, nouDia) {
    const fromSnap = await db.collection("tasques").doc(taskData.from).get();
    const fromTasks = fromSnap.exists ? fromSnap.data().tasques : [];
    const task = fromTasks[taskData.index];
    fromTasks.splice(taskData.index, 1);
    await guardarTasques(taskData.from, fromTasks);

    const toSnap = await db.collection("tasques").doc(nouDia).get();
    const toTasks = toSnap.exists ? toSnap.data().tasques : [];
    toTasks.push(task);
    await guardarTasques(nouDia, toTasks);
}

addTaskButton.onclick = async () => {
    const text = newTaskInput.value.trim();
    if (text && selectedDate) {
        const docSnap = await db.collection("tasques").doc(selectedDate).get();
        const tasques = docSnap.exists ? docSnap.data().tasques : [];
        tasques.push({ text, done: false });
        await guardarTasques(selectedDate, tasques);
        newTaskInput.value = '';
    }
};

newTaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTaskButton.click();
});

closeDayBtn.onclick = () => mostrarTasquesPendentsSenseDia();
showTrashBtn.onclick = () => document.getElementById("deleted-tasks-panel").classList.toggle("hidden");
emptyTrashBtn.onclick = () => {
    if (confirm("Segur que vols buidar la paperera?")) {
        tasquesEliminades = [];
        renderitzarTasquesEliminades();
    }
};

document.getElementById('prev-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};

document.getElementById('next-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

window.addEventListener("DOMContentLoaded", () => {
    renderCalendar();
    mostrarTasquesPendentsSenseDia();
});