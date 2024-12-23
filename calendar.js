document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const modal = document.getElementById("todoModal");
  const taskInput = document.getElementById("task-input");
  const startTimeInput = document.getElementById("task-start-time");
  const endTimeInput = document.getElementById("task-end-time");
  const notificationEnabled = document.getElementById("notification-enabled");
  const notificationOffsetSelect = document.getElementById("notification-offset");
  const addButton = document.getElementById("add-button");
  const closeModalButton = document.getElementById("closeModalButton");
  const selectedDateText = document.getElementById("selectedDateText");
  const taskListEl = document.getElementById("task-list");
  const clearAllButton = document.getElementById("clearAllButton");
  let selectedDate = null;

  function loadTasks() {
    return JSON.parse(localStorage.getItem("tasks") || "[]");
  }

  function saveTasks(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function openTodoModal() {
    modal.style.display = "flex";
    taskInput.value = "";
    startTimeInput.value = "";
    endTimeInput.value = "";
    notificationEnabled.checked = false;
    notificationOffsetSelect.value = "5";
    taskInput.focus();
  }

  function closeTodoModal() {
    modal.style.display = "none";
  }

  function addTask() {
    const taskContent = taskInput.value.trim();
    const startTime = startTimeInput.value || "00:00";
    const endTime = endTimeInput.value || "23:59";
    const isNotificationEnabled = notificationEnabled.checked;
    const notificationOffset = parseInt(notificationOffsetSelect.value);

    if (!taskContent) {
      alert("할 일을 입력해주세요!");
      return;
    }

    if (startTime >= endTime) {
      alert("끝나는 시간은 시작 시간 이후여야 합니다!");
      return;
    }

    const newTask = {
      id: generateRandomID(),
      taskContent,
      date: selectedDate,
      startTime,
      endTime,
      notificationEnabled: isNotificationEnabled,
      notificationOffset,
      isComplete: false,
    };

    const tasks = loadTasks();
    tasks.push(newTask);
    saveTasks(tasks);

    calendar.addEvent({
      id: newTask.id,
      title: newTask.taskContent,
      start: `${newTask.date}T${newTask.startTime}`,
      end: `${newTask.date}T${newTask.endTime}`,
      allDay: false,
      classNames: newTask.isComplete ? ["completed-event"] : [],
    });

    if (isNotificationEnabled) {
      setReminder(newTask);
    }

    renderTasks(selectedDate);
  }

  function setReminder(task) {
    const taskStartDateTime = new Date(`${task.date}T${task.startTime}`).getTime();
    const reminderTime = taskStartDateTime - task.notificationOffset * 60 * 1000;
    const currentTime = new Date().getTime();
    const timeUntilReminder = reminderTime - currentTime;

    if (timeUntilReminder > 0) {
      setTimeout(() => {
        showNotification(task.taskContent);
      }, timeUntilReminder);
    }
  }

  function showNotification(taskContent) {
    if (Notification.permission === "granted") {
      new Notification("리마인더", {
        body: `할 일: ${taskContent}`,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("리마인더", {
            body: `할 일: ${taskContent}`,
          });
        }
      });
    } else {
      alert(`알림: ${taskContent}`);
    }
  }

  function renderTasks(date) {
    const tasks = loadTasks().filter((task) => task.date === date);
    taskListEl.innerHTML = "";

    tasks.forEach((task) => {
      const li = createTaskElement(task, tasks, date);
      taskListEl.appendChild(li);
    });
  }

  function createTaskElement(task, tasks, date) {
    const li = document.createElement("li");
    li.className = task.isComplete ? "completed" : "";

    const taskContent = document.createElement("span");
    taskContent.textContent = task.taskContent;
    if (task.isComplete) taskContent.style.textDecoration = "line-through";

    const completeButton = document.createElement("button");
    completeButton.innerHTML = task.isComplete ? "✔️" : "✅";
    completeButton.onclick = () => toggleTaskCompletion(task, tasks, date);

    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = "❌";
    deleteButton.onclick = () => deleteTask(task, tasks, date);

    li.append(taskContent, completeButton, deleteButton);
    return li;
  }

  function toggleTaskCompletion(task, tasks, date) {
    task.isComplete = !task.isComplete;
    saveTasks(tasks);

    const event = calendar.getEventById(task.id);
    if (event) {
      event.setProp("classNames", task.isComplete ? ["completed-event"] : []);
    }

    renderTasks(date);
  }

  function deleteTask(task, tasks, date) {
    const updatedTasks = tasks.filter((t) => t.id !== task.id);
    saveTasks(updatedTasks);

    const event = calendar.getEventById(task.id);
    if (event) event.remove();

    renderTasks(date);
  }

  function clearAllTasks() {
    const tasks = loadTasks().filter((task) => task.date !== selectedDate);
    saveTasks(tasks);

    calendar.getEvents().forEach((event) => {
      if (event.startStr.startsWith(selectedDate)) event.remove();
    });

    renderTasks(selectedDate);
  }

  function generateRandomID() {
    return "_" + Math.random().toString(36).substr(2, 9);
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    locale: "ko",
    headerToolbar: {
      left: "prev,next today",
      // left: "title",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    initialView: "dayGridMonth",
    dayMaxEvents: true,
    events: loadTasks().map((task) => ({
      id: task.id,
      title: task.taskContent,
      start: `${task.date}T${task.startTime || "00:00"}`,
      end: `${task.date}T${task.endTime || "23:59"}`,
      allDay: false,
      classNames: task.isComplete ? ["completed-event"] : [],
    })),
    dateClick: function (info) {
      selectedDate = info.dateStr;
      selectedDateText.textContent = `Date: ${selectedDate}`;
      openTodoModal();
      renderTasks(selectedDate);
    },
  });

  calendar.render();

  addButton.addEventListener("click", addTask);
  closeModalButton.addEventListener("click", closeTodoModal);
  clearAllButton.addEventListener("click", clearAllTasks);
});
