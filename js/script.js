$(document).ready(function () {
  let tasks = JSON.parse(localStorage.getItem("smartTodoTasks")) || [];
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
      createdAt: dayjs().format("YYYY-MM-DD HH:mm")
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
      const remindedBadge = task.reminded
        ? `<span class="badge-custom badge-reminded">Muistutettu</span>`
        : "";

      const taskItem = `
        <li 
          class="task-item priority-${task.priority} ${task.completed ? "completed" : ""} animate__animated animate__fadeInUp"
          data-id="${task.id}"
        >
          <input 
            type="checkbox" 
            class="task-check"
            ${task.completed ? "checked" : ""}
          />

          <div class="task-content">
            <h3 class="task-title">${escapeHtml(task.text)}</h3>

            <div class="task-meta">
              ${dateBadge}
              <span class="badge-custom ${priorityClass}">
                ${priorityText}
              </span>
              ${remindedBadge}
            </div>
          </div>

          <button class="delete-btn">
            Poista
          </button>
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

  function getPriorityText(priority) {
    if (priority === "low") {
      return "Matala prioriteetti";
    }

    if (priority === "high") {
      return "Korkea prioriteetti";
    }

    return "Normaali prioriteetti";
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

  function saveTasks() {
    localStorage.setItem("smartTodoTasks", JSON.stringify(tasks));
  }

  function escapeHtml(text) {
    return $("<div>").text(text).html();
  }

  setInterval(function () {
    checkReminders();
  }, 10000);

  function checkReminders() {
    const now = dayjs();

    tasks.forEach(function (task) {
      if (!task.date || !task.time || task.completed || task.reminded) {
        return;
      }

      const reminderTime = dayjs(`${task.date} ${task.time}`);

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
            Tehtävän määräaika on nyt.
          `,
          confirmButtonText: "Selvä"
        });
      }
    });
  }

  function playReminderSound(soundName) {
    if (sounds[soundName]) {
      sounds[soundName].play();
    } else {
      sounds.soft.play();
    }
  }
});