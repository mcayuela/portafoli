// Configuració de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCam7ES3CavgOsdEwv2Dznwesds72FyJnY",
    authDomain: "calendarimarcel.firebaseapp.com",
    projectId: "calendarimarcel",
    storageBucket: "calendarimarcel.firebasestorage.app",
    messagingSenderId: "63306452640",
    appId: "1:63306452640:web:4aded0ffccbfc8d09c83c5",
    measurementId: "G-4SFP070VFS"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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

let currentDate = new Date();
let selectedDate = null;
let selectedTaskIndex = null;
let taskBeingAssigned = null;
let unsubscribeTasques = null;

async function guardarTasques(dateStr, tasques) {
    if (!dateStr) return;
    await db.collection("tasques").doc(dateStr).set({ tasques });
}

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

function mostrarTasquesPendentsSenseDia() {
    selectedDate = 'Tasques pendents';
    dayTitle.textContent = 'Tasques sense dia assignat';
    closeDayBtn.classList.add('hidden');
    escoltarTasques('Tasques pendents');
    marcarDiaSeleccionat(null);
}

function mostrarTasquesDelDia(data) {
    data.setHours(0, 0, 0, 0); // Elimina hores per evitar errors de zona horària
    selectedDate = obtenirDataISO(data);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const titol = data.toLocaleDateString('ca-ES', options);
    dayTitle.textContent = titol.charAt(0).toUpperCase() + titol.slice(1);
    closeDayBtn.classList.remove('hidden');
    escoltarTasques(selectedDate);
    marcarDiaSeleccionat(selectedDate);
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
                renderitzarTasquesAmbLlista(tasquesActualitzades);
                renderCalendar();
            };

            const actions = document.createElement('div');
            actions.className = 'task-actions';

            const assignBtn = document.createElement('button');
            assignBtn.className = 'icon-button';
            assignBtn.textContent = '📅';
            assignBtn.title = "Assignar a un altre dia";
            assignBtn.onclick = (e) => {
                e.stopPropagation();
                taskBeingAssigned = { text: tasca.text, done: tasca.done, from: selectedDate, index };
                alert("Selecciona un dia al calendari per assignar la tasca.");
            };

            const detailsBtn = document.createElement('button');
            detailsBtn.className = 'icon-button';
            detailsBtn.textContent = 'ℹ️';
            detailsBtn.title = "Detalls";
            detailsBtn.onclick = (e) => {
                e.stopPropagation();
                selectedTaskIndex = index;
                taskTitle.textContent = "Tasca";
                taskDescription.textContent = tasca.text;
                taskDetails.classList.remove('hidden');
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'icon-button';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = "Eliminar";
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                const docSnap = await db.collection("tasques").doc(selectedDate).get();
                const tasquesActualitzades = docSnap.exists ? docSnap.data().tasques : [];
                tasquesActualitzades.splice(index, 1);
                await guardarTasques(selectedDate, tasquesActualitzades);
            };

            actions.appendChild(assignBtn);
            actions.appendChild(detailsBtn);
            actions.appendChild(deleteBtn);

            li.appendChild(textSpan);
            li.appendChild(actions);
            taskList.appendChild(li);
        });
    };

    afegirSeccio("Tasques pendents", pendents, 'orange');
    afegirSeccio("Tasques completades", fetes, 'green');
}

async function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const nomMes = firstDay.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
    monthYear.textContent = nomMes.charAt(0).toUpperCase() + nomMes.slice(1);

    // Guardem el contingut actual per fer actualització suau
    const existingDays = {};
    document.querySelectorAll('.calendar-day[data-date]').forEach(day => {
        existingDays[day.dataset.date] = day;
    });

    const fetchPromises = [];
    const dates = [];
    const dataIniciTreball = new Date('2025-07-09');

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const iso = obtenirDataISO(date);
        dates.push({ date, iso });
        fetchPromises.push(db.collection("tasques").doc(iso).get());
    }

    const snapshots = await Promise.all(fetchPromises);

    calendar.innerHTML = '';

    for (let i = 0; i < startDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calendar.appendChild(emptyDiv);
    }

    for (let i = 0; i < dates.length; i++) {
        const { date, iso } = dates[i];
        const diaSetmana = date.getDay();
        const tasques = snapshots[i].exists ? snapshots[i].data().tasques : [];
        const pendents = tasques.filter(t => !t.done).length;
        const fetes = tasques.filter(t => t.done).length;

        let div = existingDays[iso];
        if (!div) {
            div = document.createElement('div');
            div.className = 'calendar-day';
            div.dataset.date = iso;
        }

        div.classList.remove('today', 'selected', 'disabled-past', 'weekend');

        if (isToday(date)) div.classList.add('today');
        if (selectedDate === iso) div.classList.add('selected');
        if (date < dataIniciTreball) div.classList.add('disabled-past');

        if (diaSetmana === 0 || diaSetmana === 6) {
            div.classList.add('weekend');
        } else {
            div.onclick = () => {
                if (taskBeingAssigned) {
                    assignarTascaADia(taskBeingAssigned, iso);
                    taskBeingAssigned = null;
                    alert("Tasca assignada correctament!");
                } else {
                    mostrarTasquesDelDia(date);
                }
            };

            div.ondragover = (e) => e.preventDefault();
            div.ondrop = async (e) => {
                const taskData = JSON.parse(e.dataTransfer.getData("text/plain"));
                await assignarTascaADia(taskData, iso);
            };
        }

        let tasquesHtml = '';
        if (pendents === 0 && fetes === 0) {
            tasquesHtml = '<div class="tasques">0 pendents<br>0 acabades</div>';
        } else {
            tasquesHtml = `
            <div class="tasques">
                ${pendents > 0 ? `<span style="color: orange">${pendents} pendents</span>` : '0 pendents'}<br>
                ${fetes > 0 ? `<span style="color: green">${fetes} acabades</span>` : '0 acabades'}
            </div>`;
        }

        div.innerHTML = `
            <div class="dia-num">${date.getDate()}</div>
            ${tasquesHtml}
        `;

        calendar.appendChild(div);
    }
}


document.getElementById('prev-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};

document.getElementById('next-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

closeDayBtn.onclick = () => mostrarTasquesPendentsSenseDia();
closeDetails.onclick = () => taskDetails.classList.add('hidden');

editTaskBtn.onclick = async () => {
    const docRef = db.collection("tasques").doc(selectedDate);
    const docSnap = await docRef.get();
    const tasques = docSnap.exists ? docSnap.data().tasques : [];
    const text = prompt("Edita la tasca:", tasques[selectedTaskIndex].text);
    if (text) {
        tasques[selectedTaskIndex].text = text;
        await guardarTasques(selectedDate, tasques);
        taskDetails.classList.add('hidden');
    }
};

deleteTaskBtn.onclick = async () => {
    const docRef = db.collection("tasques").doc(selectedDate);
    const docSnap = await docRef.get();
    const tasques = docSnap.exists ? docSnap.data().tasques : [];
    tasques.splice(selectedTaskIndex, 1);
    await guardarTasques(selectedDate, tasques);
    taskDetails.classList.add('hidden');
};

newTaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTaskButton.click();
});

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

window.addEventListener("DOMContentLoaded", () => {
    renderCalendar();
    mostrarTasquesPendentsSenseDia();
});
