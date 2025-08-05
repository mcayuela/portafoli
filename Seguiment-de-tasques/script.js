// Variables generals
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

document.getElementById('prev-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};

document.getElementById('next-month').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

closeDayBtn.onclick = () => {
    mostrarTasquesPendentsSenseDia();
};

closeDetails.onclick = () => {
    taskDetails.classList.add('hidden');
};

editTaskBtn.onclick = () => {
    const text = prompt("Edita la tasca:", getTasques(selectedDate)[selectedTaskIndex].text);
    if (text) {
        const tasques = getTasques(selectedDate);
        tasques[selectedTaskIndex].text = text;
        guardarTasques(selectedDate, tasques);
        taskDetails.classList.add('hidden');
        renderitzarTasques();
        renderCalendar();
    }
};

deleteTaskBtn.onclick = () => {
    const tasques = getTasques(selectedDate);
    if (confirm("Vols eliminar aquesta tasca?")) {
        tasques.splice(selectedTaskIndex, 1);
        guardarTasques(selectedDate, tasques);
        taskDetails.classList.add('hidden');
        renderitzarTasques();
        renderCalendar();
    }
};

newTaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTaskButton.click();
});

function renderCalendar() {
    calendar.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastDay = new Date(year, month, daysInMonth);
    const nomMes = firstDay.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
    monthYear.textContent = nomMes.charAt(0).toUpperCase() + nomMes.slice(1);

    for (let i = 0; i < startDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calendar.appendChild(emptyDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const iso = date.toISOString().split('T')[0];
        const diaSetmana = date.getDay();
        const tasques = getTasques(iso);
        const pendents = tasques.filter(t => !t.done).length;
        const fetes = tasques.filter(t => t.done).length;

        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.dataset.date = iso;

        if (isToday(date)) div.classList.add('today');
        if (selectedDate === iso) div.classList.add('selected');

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
            div.ondrop = (e) => {
                const taskData = JSON.parse(e.dataTransfer.getData("text/plain"));
                assignarTascaADia(taskData, iso);
                renderCalendar();
                if (selectedDate) renderitzarTasques();
            };
        }

        div.innerHTML = `
            <div class="dia-num">${day}</div>
            <div class="tasques">${pendents} pendents<br>${fetes} acabades</div>
        `;
        calendar.appendChild(div);
    }

    mostrarTasquesPendentsSenseDia();
}

function isToday(date) {
    const avui = new Date();
    return date.toDateString() === avui.toDateString();
}

function mostrarTasquesDelDia(data) {
    selectedDate = data.toISOString().split('T')[0];
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const titol = data.toLocaleDateString('ca-ES', options);
    dayTitle.textContent = titol.charAt(0).toUpperCase() + titol.slice(1);
    closeDayBtn.classList.remove('hidden');
    renderitzarTasques();
}

function mostrarTasquesPendentsSenseDia() {
    selectedDate = 'pendent';
    dayTitle.textContent = 'Tasques pendents (sense dia)';
    closeDayBtn.classList.add('hidden');
    renderitzarTasques();
}

function renderitzarTasques() {
    const tasques = getTasques(selectedDate);
    taskList.innerHTML = '';

    tasques.forEach((tasca, index) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.ondragstart = (e) => {
            e.dataTransfer.setData("text/plain", JSON.stringify({ text: tasca.text, done: tasca.done, from: selectedDate, index }));
        };

        const textSpan = document.createElement('span');
        textSpan.className = 'task-text';
        textSpan.textContent = tasca.text;
        if (tasca.done) textSpan.classList.add('done');
        textSpan.onclick = () => {
            tasca.done = !tasca.done;
            guardarTasques(selectedDate, tasques);
            renderitzarTasques();
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
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm("Vols eliminar aquesta tasca?")) {
                tasques.splice(index, 1);
                guardarTasques(selectedDate, tasques);
                renderitzarTasques();
                renderCalendar();
            }
        };

        actions.appendChild(assignBtn);
        actions.appendChild(detailsBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(textSpan);
        li.appendChild(actions);
        taskList.appendChild(li);
    });
}

addTaskButton.onclick = () => {
    const text = newTaskInput.value.trim();
    if (text && selectedDate) {
        const tasques = getTasques(selectedDate);
        tasques.push({ text, done: false });
        guardarTasques(selectedDate, tasques);
        newTaskInput.value = '';
        renderitzarTasques();
        renderCalendar();
    }
};

function assignarTascaADia(taskData, nouDia) {
    const fromTasks = getTasques(taskData.from);
    const task = fromTasks[taskData.index];
    fromTasks.splice(taskData.index, 1);
    guardarTasques(taskData.from, fromTasks);

    const toTasks = getTasques(nouDia);
    toTasks.push(task);
    guardarTasques(nouDia, toTasks);
}

function getTasques(dateStr) {
    const data = JSON.parse(localStorage.getItem('tasques') || '{}');
    return data[dateStr] || [];
}

function guardarTasques(dateStr, tasques) {
    const data = JSON.parse(localStorage.getItem('tasques') || '{}');
    data[dateStr] = tasques;
    localStorage.setItem('tasques', JSON.stringify(data));
}

// Inici
renderCalendar();
