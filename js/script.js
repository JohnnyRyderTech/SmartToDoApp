$(document).ready(function () {
  let tasks = loadTasks();
  let currentFilter = "all";

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
          stopAllSounds();
        }
      }

      return task;
    });

    saveTasks();
    renderTasks();
    updateStats();
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

        stopAllSounds();
        saveTasks();
        renderTasks();
        updateStats();

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
      const countdownInfo = getCountdownInfo(task);
      const remindedBadge = task.reminded
        ? `<span class="badge-custom badge-reminded">Muistutettu</span>`
        : "";

      const countdownBadge = countdownInfo.visible
        ? `<span class="badge-custom countdown-badge ${countdownInfo.className}" data-countdown-id="${task.id}">${countdownInfo.text}</span>`
        : "";

      const taskItem = `
        <li
          class="task-item priority-${task.priority} ${task.completed ? "completed" : ""} ${countdownInfo.isOverdue ? "overdue" : ""} animate__animated animate__fadeInUp"
          data-id="${task.id}"
        >
          <input
            type="checkbox"
            class="task-check"
            ${task.completed ? "checked" : ""}
            aria-label="Merkitse tehtävä valmiiksi"
          />

          <div class="task-content">
            <h3 class="task-title">${escapeHtml(task.text)}</h3>

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

  function getTaskDeadline(task) {
    if (!task.date) {
      return null;
    }

    if (task.time) {
      return dayjs(`${task.date} ${task.time}`);
    }

    // Jos kellonaikaa ei ole annettu, määräpäivän rajaksi asetetaan päivän loppu.
    return dayjs(`${task.date} 23:59:59`);
  }

  function getCountdownInfo(task) {
    const deadline = getTaskDeadline(task);

    if (!deadline || task.completed) {
      return {
        visible: false,
        text: "",
        className: "",
        isOverdue: false
      };
    }

    const now = dayjs();
    const diffMs = deadline.diff(now);
    const isOverdue = diffMs < 0;
    const absMs = Math.abs(diffMs);

    return {
      visible: true,
      text: isOverdue
        ? `Aika ylitetty ${formatDuration(absMs)}`
        : `Jäljellä ${formatDuration(absMs)}`,
      className: isOverdue ? "countdown-overdue" : "countdown-active",
      isOverdue: isOverdue
    };
  }

  function formatDuration(milliseconds) {
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

  function updateCountdownBadges() {
    let shouldRerender = false;

    tasks.forEach(function (task) {
      const countdownInfo = getCountdownInfo(task);
      const badge = $(`[data-countdown-id="${task.id}"]`);
      const taskItem = $(`.task-item[data-id="${task.id}"]`);

      if (!countdownInfo.visible) {
        return;
      }

      badge
        .text(countdownInfo.text)
        .removeClass("countdown-active countdown-overdue")
        .addClass(countdownInfo.className);

      if (countdownInfo.isOverdue) {
        taskItem.addClass("overdue");
      } else {
        taskItem.removeClass("overdue");
      }

      // Jos tehtävä menee juuri yli ajan, renderöidään kerran uudelleen, jotta varoitus näkyy varmasti.
      if (countdownInfo.isOverdue && !taskItem.hasClass("overdue-rendered")) {
        taskItem.addClass("overdue-rendered");
        shouldRerender = true;
      }
    });

    if (shouldRerender) {
      renderTasks();
    }
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
        ? dayjs(task.completedAt).format("DD.MM.YYYY HH:mm")
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

    tasks.forEach(function (task) {
      const reminderTime = getTaskDeadline(task);

      if (!reminderTime || task.completed || task.reminded) {
        return;
      }

      if (now.isAfter(reminderTime) || now.isSame(reminderTime)) {
        task.reminded = true;

        saveTasks();
        renderTasks();
        updateStats();

        playReminderSound(task.sound);

        Swal.fire({
          icon: "info",
          title: "Muistutus",
          html: `
            <strong>${escapeHtml(task.text)}</strong>
            <br><br>
            Tehtävän määräaika on nyt tai se on jo ylittynyt.
          `,
          confirmButtonText: "Selvä"
        }).then(function () {
          stopAllSounds();
        });
      }
    });
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
      return Array.isArray(savedTasks) ? savedTasks : [];
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
    updateCountdownBadges();
  }, 1000);

  setInterval(function () {
    checkReminders();
  }, 10000);
});
