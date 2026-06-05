$(document).ready(function () {
  let tasks = loadTasks();
  let currentFilter = "all";
  const activeReminderTaskIds = new Set();

  const sounds = {
    soft: new Howl({
      src: ["https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"],
      volume: 0.5
    }),

    forest: new Howl({
      src: ["https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3"],
      volume: 0.5
    }),

    alarm: new Howl({
      src: ["https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3"],
      volume: 0.6
    })
  };

  renderTasks();
  updateStats();
  updateCountdowns();

  $("#taskForm").on("submit", function (event) {
    event.preventDefault();

    const taskText = $("#taskInput").val().trim();
    const taskDate = $("#taskDate").val();
    const taskTime = $("#taskTime").val();
    const taskPriority = $("#taskPriority").val();
    const taskSound = $("#taskSound").val();

    if (taskText === "") {
      Swal.fire({
        icon: "warning",
        title: "Tehtävä puuttuu",
        text: "Kirjoita ensin tehtävän nimi."
      });
      return;
    }

    const newTask = {
      id: Date.now(),
      text: taskText,
      date: taskDate,
      time: taskTime,
      priority: taskPriority,
      sound: taskSound,
      completed: false,
      reminded: false,
      createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
      completedAt: null
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    updateStats();
    updateCountdowns();

    $("#taskForm")[0].reset();
    $("#taskPriority").val("normal");
    $("#taskSound").val("soft");

    Swal.fire({
      icon: "success",
      title: "Tehtävä lisätty",
      text: "Uusi tehtävä tallennettiin listaan.",
      timer: 1400,
      showConfirmButton: false
    });
  });

  $(document).on("change", ".task-check", function () {
    const taskId = Number($(this).closest(".task-item").data("id"));

    tasks = tasks.map(function (task) {
      if (task.id === taskId) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? dayjs().format("YYYY-MM-DD HH:mm") : null;

        if (task.completed) {
          activeReminderTaskIds.delete(task.id);
          stopAllSounds();
          Swal.close();
        }
      }

      return task;
    });

    saveTasks();
    renderTasks();
    updateStats();
    updateCountdowns();
  });

  $(document).on("click", ".delete-btn", function () {
    const taskId = Number($(this).closest(".task-item").data("id"));

    Swal.fire({
      icon: "question",
      title: "Poistetaanko tehtävä?",
      text: "Tätä toimintoa ei voi perua.",
      showCancelButton: true,
      confirmButtonText: "Poista",
      cancelButtonText: "Peruuta"
    }).then(function (result) {
      if (result.isConfirmed) {
        tasks = tasks.filter(function (task) {
          return task.id !== taskId;
        });

        activeReminderTaskIds.delete(taskId);
        stopAllSounds();
        saveTasks();
        renderTasks();
        updateStats();
        updateCountdowns();

        Swal.fire({
          icon: "success",
          title: "Poistettu",
          timer: 1000,
          showConfirmButton: false
        });
      }
    });
  });

  $(".filter-btn").on("click", function () {
    $(".filter-btn").removeClass("active");
    $(this).addClass("active");

    currentFilter = $(this).data("filter");
    renderTasks();
    updateCountdowns();
  });

  $("#showHistoryBtn").on("click", function () {
    showTaskHistory();
  });

  $("#clearCompletedBtn").on("click", function () {
    const completedCount = tasks.filter(function (task) {
      return task.completed;
    }).length;

    if (completedCount === 0) {
      Swal.fire({
        icon: "info",
        title: "Ei poistettavia tehtäviä",
        text: "Listalla ei ole valmiiksi merkittyjä tehtäviä."
      });
      return;
    }

    Swal.fire({
      icon: "question",
      title: "Poistetaanko valmiit tehtävät?",
      text: `Valmiita tehtäviä on ${completedCount}.`,
      showCancelButton: true,
      confirmButtonText: "Poista",
      cancelButtonText: "Peruuta"
    }).then(function (result) {
      if (result.isConfirmed) {
        tasks = tasks.filter(function (task) {
          return !task.completed;
        });

        stopAllSounds();
        saveTasks();
        renderTasks();
        updateStats();
        updateCountdowns();
      }
    });
  });

  function renderTasks() {
    $("#taskList").empty();

    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
      $("#emptyState").show();
      return;
    }

    $("#emptyState").hide();

    filteredTasks.forEach(function (task) {
      const priorityText = getPriorityText(task.priority);
      const priorityClass = getPriorityClass(task.priority);
      const dateBadge = getDateBadge(task);
      const countdownBadge = getCountdownBadge(task);
      const isOverdue = isTaskOverdue(task);
      const overdueLabel = isOverdue && !task.completed
        ? `<span class="overdue-label">⚠ Aika ylitetty</span>`
        : "";
      const remindedBadge = task.reminded
        ? `<span class="badge-custom badge-reminded">Muistutettu</span>`
        : "";

      const taskItem = `
        <li
          class="task-item priority-${task.priority} ${task.completed ? "completed" : ""} ${isOverdue && !task.completed ? "overdue" : ""} animate__animated animate__fadeInUp"
          data-id="${task.id}"
        >
          <input
            type="checkbox"
            class="task-check"
            ${task.completed ? "checked" : ""}
            aria-label="Merkitse tehtävä valmiiksi"
          />

          <div class="task-content">
            <h3 class="task-title">${escapeHtml(task.text)} ${overdueLabel}</h3>

            <div class="task-meta">
              ${dateBadge}
              ${countdownBadge}
              <span class="badge-custom ${priorityClass}">${priorityText}</span>
              ${remindedBadge}
            </div>
          </div>

          <button type="button" class="delete-btn">Poista</button>
        </li>
      `;

      $("#taskList").append(taskItem);
    });
  }

  function getFilteredTasks() {
    if (currentFilter === "active") {
      return tasks.filter(function (task) {
        return !task.completed;
      });
    }

    if (currentFilter === "completed") {
      return tasks.filter(function (task) {
        return task.completed;
      });
    }

    if (currentFilter === "high") {
      return tasks.filter(function (task) {
        return task.priority === "high";
      });
    }

    return tasks;
  }

  function getDateBadge(task) {
    if (!task.date) {
      return `<span class="badge-custom badge-date">Ei määräaikaa</span>`;
    }

    let dateText = dayjs(task.date).format("DD.MM.YYYY");

    if (task.time) {
      dateText += ` klo ${task.time}`;
    }

    return `<span class="badge-custom badge-date">${dateText}</span>`;
  }

  function getCountdownBadge(task) {
    if (!task.date || !task.time || task.completed) {
      return "";
    }

    return `<span class="badge-custom badge-countdown" data-task-id="${task.id}">Lasketaan aikaa...</span>`;
  }

  function getPriorityText(priority) {
    if (priority === "low") {
      return "Matala";
    }

    if (priority === "high") {
      return "Korkea";
    }

    return "Normaali";
  }

  function getPriorityClass(priority) {
    if (priority === "low") {
      return "badge-low";
    }

    if (priority === "high") {
      return "badge-high";
    }

    return "badge-normal";
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(function (task) {
      return task.completed;
    }).length;
    const active = total - completed;

    $("#totalTasks").text(total);
    $("#activeTasks").text(active);
    $("#completedTasks").text(completed);
  }

  function showTaskHistory() {
    const completedTasks = tasks.filter(function (task) {
      return task.completed;
    });

    if (completedTasks.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Tehtävähistoria on tyhjä",
        text: "Et ole vielä merkinnyt yhtään tehtävää valmiiksi."
      });
      return;
    }

    let historyHtml = `<div class="history-list">`;

    completedTasks.forEach(function (task) {
      const dateText = task.date
        ? `${dayjs(task.date).format("DD.MM.YYYY")}${task.time ? " klo " + task.time : ""}`
        : "Ei määräaikaa";

      const completedText = task.completedAt
        ? formatStoredDate(task.completedAt)
        : "Ei tietoa";

      historyHtml += `
        <div class="history-item priority-${task.priority}">
          <h4>${escapeHtml(task.text)}</h4>
          <p><strong>Määräaika:</strong> ${dateText}</p>
          <p><strong>Prioriteetti:</strong> ${getPriorityText(task.priority)}</p>
          <p><strong>Luotu:</strong> ${formatStoredDate(task.createdAt)}</p>
          <p><strong>Valmis:</strong> ${completedText}</p>
        </div>
      `;
    });

    historyHtml += `</div>`;

    Swal.fire({
      title: "Valmiiden tehtävien historia",
      html: historyHtml,
      width: "700px",
      confirmButtonText: "Sulje"
    });
  }

  function checkReminders() {
    const now = dayjs();
    let taskWasUpdated = false;

    tasks.forEach(function (task) {
      if (!task.date || !task.time || task.completed || task.reminded) {
        return;
      }

      if (activeReminderTaskIds.has(task.id)) {
        return;
      }

      const reminderTime = getTaskDeadline(task);

      if (!reminderTime.isValid()) {
        return;
      }

      if (now.isAfter(reminderTime) || now.isSame(reminderTime)) {
        task.reminded = true;
        taskWasUpdated = true;
        activeReminderTaskIds.add(task.id);

        playReminderSound(task.sound);

        Swal.fire({
          icon: "info",
          title: "Muistutus",
          html: `
            <strong>${escapeHtml(task.text)}</strong>
            <br><br>
            Tehtävän määräaika on nyt.
          `,
          confirmButtonText: "Selvä"
        }).then(function () {
          activeReminderTaskIds.delete(task.id);
          stopAllSounds();
        });
      }
    });

    if (taskWasUpdated) {
      saveTasks();
      renderTasks();
      updateStats();
      updateCountdowns();
    }
  }

  function updateCountdowns() {
    const now = dayjs();

    $(".badge-countdown").each(function () {
      const taskId = Number($(this).data("task-id"));
      const task = tasks.find(function (item) {
        return item.id === taskId;
      });

      if (!task || task.completed || !task.date || !task.time) {
        $(this).remove();
        return;
      }

      const deadline = getTaskDeadline(task);

      if (!deadline.isValid()) {
        $(this).text("Virheellinen aika");
        return;
      }

      const differenceMs = deadline.valueOf() - now.valueOf();
      const formattedTime = formatTimeDifference(Math.abs(differenceMs));
      const taskElement = $(this).closest(".task-item");
      const taskTitle = taskElement.find(".task-title");

      if (differenceMs < 0) {
        $(this)
          .text(`Aika ylitetty ${formattedTime}`)
          .addClass("badge-overdue");

        taskElement.addClass("overdue");

        if (taskTitle.find(".overdue-label").length === 0) {
          taskTitle.append(` <span class="overdue-label">⚠ Aika ylitetty</span>`);
        }
      } else {
        $(this)
          .text(`Jäljellä ${formattedTime}`)
          .removeClass("badge-overdue");

        taskElement.removeClass("overdue");
        taskTitle.find(".overdue-label").remove();
      }
    });
  }

  function formatTimeDifference(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days} pv ${hours} h ${minutes} min`;
    }

    if (hours > 0) {
      return `${hours} h ${minutes} min ${seconds} s`;
    }

    if (minutes > 0) {
      return `${minutes} min ${seconds} s`;
    }

    return `${seconds} s`;
  }

  function isTaskOverdue(task) {
    if (!task.date || !task.time || task.completed) {
      return false;
    }

    const deadline = getTaskDeadline(task);
    return deadline.isValid() && dayjs().isAfter(deadline);
  }

  function getTaskDeadline(task) {
    return dayjs(`${task.date}T${task.time}`);
  }

  function playReminderSound(soundName) {
    stopAllSounds();

    if (sounds[soundName]) {
      sounds[soundName].play();
    } else {
      sounds.soft.play();
    }
  }

  function stopAllSounds() {
    Object.values(sounds).forEach(function (sound) {
      sound.stop();
    });
  }

  function saveTasks() {
    localStorage.setItem("smartTodoTasks", JSON.stringify(tasks));
  }

  function loadTasks() {
    try {
      const savedTasks = JSON.parse(localStorage.getItem("smartTodoTasks"));

      if (!Array.isArray(savedTasks)) {
        return [];
      }

      return savedTasks.map(function (task) {
        return {
          id: task.id || Date.now(),
          text: task.text || "Nimetön tehtävä",
          date: task.date || "",
          time: task.time || "",
          priority: task.priority || "normal",
          sound: task.sound || "soft",
          completed: Boolean(task.completed),
          reminded: Boolean(task.reminded),
          createdAt: task.createdAt || dayjs().format("YYYY-MM-DD HH:mm"),
          completedAt: task.completedAt || null
        };
      });
    } catch (error) {
      console.error("Tehtävien lataaminen epäonnistui:", error);
      return [];
    }
  }

  function formatStoredDate(value) {
    if (!value) {
      return "Ei tietoa";
    }

    const parsedDate = dayjs(value);
    return parsedDate.isValid() ? parsedDate.format("DD.MM.YYYY HH:mm") : value;
  }

  function escapeHtml(text) {
    return $("<div>").text(text).html();
  }

  setInterval(function () {
    checkReminders();
  }, 10000);

  setInterval(function () {
    updateCountdowns();
  }, 1000);
});
