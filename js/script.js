$(document).ready(function () {
  // Ladataan aiemmin tallennetut tehtävät localStoragesta.
  let tasks = loadTasks();
  // Ladataan käyttäjän itse luomat kategoriat localStoragesta.
  let categories = loadCategories();
  // Nykyinen tehtäväsuodatin: kaikki, kesken, valmiit tai tärkeät.
  let currentFilter = "all";
  // Nykyinen kategoriasuodatin.
  let currentCategoryFilter = "all";
  // Aktiiviset muistutukset estävät saman muistutuksen avautumisen monta kertaa.
  const activeReminderTaskIds = new Set();

  // Howler.js-äänet muistutuksia varten.
  const sounds = {
    soft: new Howl({
      src: ["https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"],
      volume: 0.5
    }),

    forest: new Howl({
      src: ["https://assets.mixkit.co/active_storage/sfx/2472/2472-preview.mp3"],
      volume: 0.45
    }),

    alarm: new Howl({
      src: ["https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3"],
      volume: 0.6
    })
  };

  // Alustetaan käyttöliittymä, kun sivu on latautunut.
  renderCategoryOptions();
  renderCategoryFilterOptions();
  renderTasks();
  updateStats();
  updateCountdowns();
  fetchMotivationQuote();

  /*
    Uuden tehtävän lisääminen
    Kun käyttäjä lähettää lomakkeen, luodaan uusi tehtäväolio,
    tallennetaan se taulukkoon ja päivitetään näkymä.
  */
  $("#taskForm").on("submit", function (event) {
    event.preventDefault();

    const taskText = $("#taskInput").val().trim();
    const taskDate = $("#taskDate").val();
    const taskTime = $("#taskTime").val();
    const taskPriority = $("#taskPriority").val();
    const taskSound = $("#taskSound").val();
    const taskCategory = $("#taskCategory").val();

    if (taskText === "") {
      Swal.fire({
        icon: "warning",
        title: "📝 Tehtävä puuttuu",
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
      categoryId: taskCategory || "",
      completed: false,
      reminded: false,
      subtasks: [],
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
    $("#taskCategory").val("");

    Swal.fire({
      icon: "success",
      title: "✅ Tehtävä lisätty",
      text: "Uusi tehtävä tallennettiin listaan.",
      timer: 1400,
      showConfirmButton: false
    });
  });

  /*
    Päätehtävän valmiiksi merkitseminen.
    Kun tehtävä kuitataan valmiiksi, tallennetaan valmistumisaika.
    Jos tehtävällä soi muistutusääni, se pysäytetään.
  */
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

  /*
    Alakohdan lisääminen tehtävälle.
    Käyttäjä voi lisätä yhden päätehtävän alle useita pienempiä alakohtia,
    esimerkiksi ostoslistan tuotteita.
  */
  $(document).on("submit", ".subtask-form", function (event) {
    event.preventDefault();

    const taskId = Number($(this).closest(".task-item").data("id"));
    const input = $(this).find(".subtask-input");
    const subtaskText = input.val().trim();

    if (subtaskText === "") {
      Swal.fire({
        icon: "warning",
        title: "🧩 Alakohta puuttuu",
        text: "Kirjoita ensin alakohta."
      });
      return;
    }

    tasks = tasks.map(function (task) {
      if (task.id === taskId) {
        task.subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
        task.subtasks.push({
          id: Date.now(),
          text: subtaskText,
          completed: false,
          createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
          completedAt: null
        });
      }

      return task;
    });

    saveTasks();
    renderTasks();
    updateStats();
    updateCountdowns();
  });

  // Alakohdan valmiiksi merkitseminen.
  $(document).on("change", ".subtask-check", function () {
    const taskId = Number($(this).closest(".task-item").data("id"));
    const subtaskId = Number($(this).closest(".subtask-item").data("subtask-id"));

    tasks = tasks.map(function (task) {
      if (task.id === taskId) {
        task.subtasks = task.subtasks.map(function (subtask) {
          if (subtask.id === subtaskId) {
            subtask.completed = !subtask.completed;
            subtask.completedAt = subtask.completed ? dayjs().format("YYYY-MM-DD HH:mm") : null;
          }

          return subtask;
        });
      }

      return task;
    });

    saveTasks();
    renderTasks();
    updateStats();
    updateCountdowns();
  });

  // Yksittäisen alakohdan poistaminen.
  $(document).on("click", ".subtask-delete-btn", function () {
    const taskId = Number($(this).closest(".task-item").data("id"));
    const subtaskId = Number($(this).closest(".subtask-item").data("subtask-id"));

    tasks = tasks.map(function (task) {
      if (task.id === taskId) {
        task.subtasks = task.subtasks.filter(function (subtask) {
          return subtask.id !== subtaskId;
        });
      }

      return task;
    });

    saveTasks();
    renderTasks();
    updateStats();
    updateCountdowns();
  });

  // Päätehtävän poistaminen vahvistusikkunan kautta.
  $(document).on("click", ".delete-btn", function () {
    const taskId = Number($(this).closest(".task-item").data("id"));

    Swal.fire({
      icon: "question",
      title: "🗑️ Poistetaanko tehtävä?",
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
          title: "🗑️ Poistettu",
          timer: 1000,
          showConfirmButton: false
        });
      }
    });
  });

  // Tehtävien suodatus painikkeilla: kaikki, kesken, valmiit ja tärkeät.
  $(".filter-btn").on("click", function () {
    $(".filter-btn").removeClass("active");
    $(this).addClass("active");

    currentFilter = $(this).data("filter");
    renderTasks();
    updateCountdowns();
  });

  // Avataan tehtävähistoria, jossa näytetään valmiiksi merkityt tehtävät.
  $("#showHistoryBtn").on("click", function () {
    showTaskHistory();
  });

  // Avataan omien kategorioiden hallinta.
  $("#manageCategoriesBtn").on("click", function () {
    showCategoryManager();
  });

  // Kategoriasuodatin päivittää listan valitun kategorian mukaan.
  $("#categoryFilter").on("change", function () {
    currentCategoryFilter = $(this).val();
    renderTasks();
    updateCountdowns();
  });

  // Haetaan uusi motivaatiolause Axiosin avulla.
  $("#refreshQuoteBtn").on("click", function () {
    fetchMotivationQuote();
  });

  // Poistetaan kaikki valmiiksi merkityt tehtävät kerralla.
  $("#clearCompletedBtn").on("click", function () {
    const completedCount = tasks.filter(function (task) {
      return task.completed;
    }).length;

    if (completedCount === 0) {
      Swal.fire({
        icon: "info",
        title: "🍃 Ei poistettavia tehtäviä",
        text: "Listalla ei ole valmiiksi merkittyjä tehtäviä."
      });
      return;
    }

    Swal.fire({
      icon: "question",
      title: "🧹 Poistetaanko valmiit tehtävät?",
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

  /*
    Tehtävälistan piirtäminen.
    Tämä funktio tyhjentää nykyisen listan ja rakentaa HTML:n uudelleen
    suodatettujen tehtävien perusteella.
  */
  function renderTasks() {
    $("#taskList").empty();

    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
      $("#emptyState").show();
      return;
    }

    $("#emptyState").hide();

    filteredTasks.forEach(function (task) {
      task.subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

      const priorityText = getPriorityText(task.priority);
      const priorityIcon = getPriorityIcon(task.priority);
      const priorityClass = getPriorityClass(task.priority);
      const dateBadge = getDateBadge(task);
      const countdownBadge = getCountdownBadge(task);
      const subtaskBadge = getSubtaskBadge(task);
      const category = getCategoryById(task.categoryId);
      const categoryBadge = getCategoryBadge(category);
      const categoryStyle = getCategoryStyle(category);
      const subtasksHtml = getSubtasksHtml(task);
      const isOverdue = isTaskOverdue(task);
      const overdueLabel = isOverdue && !task.completed
        ? `<span class="overdue-label">⚠ Aika ylitetty</span>`
        : "";
      const remindedBadge = task.reminded
        ? `<span class="badge-custom badge-reminded">Muistutettu</span>`
        : "";

      const taskItem = `
        <li
          class="task-item priority-${task.priority} ${category ? "has-category" : ""} ${task.completed ? "completed" : ""} ${isOverdue && !task.completed ? "overdue" : ""} animate__animated animate__fadeInUp"
          data-id="${task.id}"
          style="${categoryStyle}"
        >
          <input
            type="checkbox"
            class="task-check"
            ${task.completed ? "checked" : ""}
            aria-label="Merkitse tehtävä valmiiksi"
          />

          <div class="task-content">
            <h3 class="task-title"><span class="task-title-symbol">${getTaskIcon(task)}</span>${escapeHtml(task.text)} ${overdueLabel}</h3>

            <div class="task-meta">
              ${dateBadge}
              ${countdownBadge}
              <span class="badge-custom ${priorityClass}">${priorityIcon} ${priorityText}</span>
              ${categoryBadge}
              ${subtaskBadge}
              ${remindedBadge}
            </div>

            <div class="subtasks-box">
              <div class="subtasks-header">
                <span><span class="subtask-title-symbol">🧩</span>Alakohdat</span>
                <span>${getSubtaskProgressText(task)}</span>
              </div>

              <form class="subtask-form">
                <input
                  type="text"
                  class="subtask-input"
                  placeholder="Lisää alakohta, esim. maito"
                  aria-label="Lisää alakohta"
                />
                <button type="submit" class="subtask-add-btn">Lisää</button>
              </form>

              ${subtasksHtml}
            </div>
          </div>

          <button type="button" class="delete-btn">Poista</button>
        </li>
      `;

      $("#taskList").append(taskItem);
    });
  }

  // Palauttaa tehtävät nykyisen suodattimen ja kategoriasuodattimen perusteella.
  function getFilteredTasks() {
    let filteredTasks = tasks;

    if (currentFilter === "active") {
      filteredTasks = filteredTasks.filter(function (task) {
        return !task.completed;
      });
    }

    if (currentFilter === "completed") {
      filteredTasks = filteredTasks.filter(function (task) {
        return task.completed;
      });
    }

    if (currentFilter === "high") {
      filteredTasks = filteredTasks.filter(function (task) {
        return task.priority === "high";
      });
    }

    if (currentCategoryFilter !== "all") {
      filteredTasks = filteredTasks.filter(function (task) {
        return (task.categoryId || "") === currentCategoryFilter;
      });
    }

    return filteredTasks;
  }

  // Luo tehtäväkorttiin päivämäärämerkin.
  function getDateBadge(task) {
    if (!task.date) {
      return `<span class="badge-custom badge-date">📅 Ei määräaikaa</span>`;
    }

    let dateText = dayjs(task.date).format("DD.MM.YYYY");

    if (task.time) {
      dateText += ` klo ${task.time}`;
    }

    return `<span class="badge-custom badge-date">📅 ${dateText}</span>`;
  }

  // Luo countdown-merkin, jos tehtävällä on päivämäärä ja kellonaika.
  function getCountdownBadge(task) {
    if (!task.date || !task.time || task.completed) {
      return "";
    }

    return `<span class="badge-custom badge-countdown" data-task-id="${task.id}">⏱️ Lasketaan aikaa...</span>`;
  }

  // Näyttää alakohtien etenemisen badge-merkkinä, esimerkiksi 2/5.
  function getSubtaskBadge(task) {
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

    if (subtasks.length === 0) {
      return "";
    }

    const completedCount = subtasks.filter(function (subtask) {
      return subtask.completed;
    }).length;

    return `<span class="badge-custom badge-subtasks">🧩 Alakohdat ${completedCount}/${subtasks.length}</span>`;
  }


  // Luo kategoriabadgen käyttäjän valitsemalla värillä.
  function getCategoryBadge(category) {
    if (!category) {
      return "";
    }

    return `<span class="badge-custom badge-category" style="background-color: ${category.color};">🏷️ ${escapeHtml(category.name)}</span>`;
  }

  // Palauttaa tehtäväkortille CSS-muuttujat kategorian värin perusteella.
  function getCategoryStyle(category) {
    if (!category) {
      return "";
    }

    return `--category-color: ${category.color}; --category-bg: ${hexToRgba(category.color, 0.14)};`;
  }

  // Teksti alakohtien edistymisestä alakohdat-osion otsikkoon.
  function getSubtaskProgressText(task) {
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

    if (subtasks.length === 0) {
      return "Ei alakohtia";
    }

    const completedCount = subtasks.filter(function (subtask) {
      return subtask.completed;
    }).length;

    return `${completedCount}/${subtasks.length} valmiina`;
  }

  // Rakentaa tehtävän alakohtien HTML-listan.
  function getSubtasksHtml(task) {
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

    if (subtasks.length === 0) {
      return `<p class="subtasks-empty">Tälle tehtävälle ei ole vielä alakohtia.</p>`;
    }

    let html = `<ul class="subtask-list">`;

    subtasks.forEach(function (subtask) {
      html += `
        <li class="subtask-item ${subtask.completed ? "completed" : ""}" data-subtask-id="${subtask.id}">
          <input
            type="checkbox"
            class="subtask-check"
            ${subtask.completed ? "checked" : ""}
            aria-label="Merkitse alakohta valmiiksi"
          />
          <span class="subtask-text">${escapeHtml(subtask.text)}</span>
          <button type="button" class="subtask-delete-btn" aria-label="Poista alakohta">×</button>
        </li>
      `;
    });

    html += `</ul>`;
    return html;
  }

  // Muuttaa prioriteetin teknisen arvon käyttäjälle näkyväksi tekstiksi.
  function getPriorityText(priority) {
    if (priority === "low") {
      return "Matala";
    }

    if (priority === "high") {
      return "Korkea";
    }

    return "Normaali";
  }

  // Palauttaa prioriteettiin sopivan symbolin.
  function getPriorityIcon(priority) {
    if (priority === "low") {
      return "🌱";
    }

    if (priority === "high") {
      return "🔥";
    }

    return "🪵";
  }

  // Valitsee tehtävän otsikon symbolin tilanteen mukaan.
  function getTaskIcon(task) {
    if (task.completed) {
      return "✅";
    }

    if (isTaskOverdue(task)) {
      return "⚠️";
    }

    if (task.categoryId) {
      return "🏷️";
    }

    return "🍂";
  }

  // Palauttaa prioriteettiin sopivan CSS-luokan.
  function getPriorityClass(priority) {
    if (priority === "low") {
      return "badge-low";
    }

    if (priority === "high") {
      return "badge-high";
    }

    return "badge-normal";
  }

  // Päivittää tehtävien tilastot: yhteensä, kesken ja valmiina.
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

  /*
    Motivaatiolauseen hakeminen Axiosilla.
    Axios tekee GET-pyynnön ulkoiseen rajapintaan ja näyttää vastauksena saadun lainauksen.
  */
  function fetchMotivationQuote() {
    const quoteText = $("#quoteText");
    const quoteAuthor = $("#quoteAuthor");
    const refreshButton = $("#refreshQuoteBtn");

    if (typeof axios === "undefined") {
      quoteText.text("Axios-kirjastoa ei voitu ladata. Tarkista internet-yhteys tai CDN-linkki.");
      quoteAuthor.text("");
      return;
    }

    refreshButton.prop("disabled", true).text("⏳ Haetaan...");
    quoteText.text("Haetaan inspiraatiolausetta...");
    quoteAuthor.text("");

    axios.get("https://dummyjson.com/quotes/random")
      .then(function (response) {
        const quote = response.data && response.data.quote
          ? response.data.quote
          : "Small steps every day lead to big results.";

        const author = response.data && response.data.author
          ? response.data.author
          : "Tuntematon";

        quoteText.text(`“${quote}”`);
        quoteAuthor.text(`— ${author}`);
      })
      .catch(function (error) {
        console.error("Motivaatiolauseen hakeminen epäonnistui:", error);
        quoteText.text("Motivaatiolauseen hakeminen ei onnistunut. Yritä hetken päästä uudelleen.");
        quoteAuthor.text("");
      })
      .finally(function () {
        refreshButton.prop("disabled", false).text("🔄 Hae uusi");
      });
  }

  // Näyttää SweetAlert2-ikkunassa valmiiksi merkityt tehtävät.
  function showTaskHistory() {
    const completedTasks = tasks.filter(function (task) {
      return task.completed;
    });

    if (completedTasks.length === 0) {
      Swal.fire({
        icon: "info",
        title: "📜 Tehtävähistoria on tyhjä",
        text: "Et ole vielä merkinnyt yhtään tehtävää valmiiksi."
      });
      return;
    }

    let historyHtml = `<div class="history-list">`;

    completedTasks.forEach(function (task) {
      const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
      const dateText = task.date
        ? `${dayjs(task.date).format("DD.MM.YYYY")}${task.time ? " klo " + task.time : ""}`
        : "Ei määräaikaa";

      const completedText = task.completedAt
        ? formatStoredDate(task.completedAt)
        : "Ei tietoa";
      const category = getCategoryById(task.categoryId);
      const categoryText = category ? category.name : "Ei kategoriaa";

      const subtasksText = subtasks.length > 0
        ? `${subtasks.filter(function (subtask) { return subtask.completed; }).length}/${subtasks.length} alakohtaa valmiina`
        : "Ei alakohtia";

      historyHtml += `
        <div class="history-item priority-${task.priority}">
          <h4>${escapeHtml(task.text)}</h4>
          <p><strong>Määräaika:</strong> ${dateText}</p>
          <p><strong>Prioriteetti:</strong> ${getPriorityText(task.priority)}</p>
          <p><strong>Kategoria:</strong> ${escapeHtml(categoryText)}</p>
          <p><strong>Alakohdat:</strong> ${subtasksText}</p>
          <p><strong>Luotu:</strong> ${formatStoredDate(task.createdAt)}</p>
          <p><strong>Valmis:</strong> ${completedText}</p>
        </div>
      `;
    });

    historyHtml += `</div>`;

    Swal.fire({
      title: "📜 Valmiiden tehtävien historia",
      html: historyHtml,
      width: "700px",
      confirmButtonText: "Sulje"
    });
  }

  /*
    Muistutusten tarkistaminen.
    Tätä funktiota ajetaan ajastimella. Jos tehtävän määräaika on saavutettu,
    näytetään muistutus ja soitetaan käyttäjän valitsema ääni.
  */
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
          title: "🔔 Muistutus",
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

  /*
    Countdown-laskurin päivitys.
    Päivittää jokaisen näkyvän tehtävän jäljellä olevan ajan kerran sekunnissa.
    Jos määräaika on mennyt yli, näytetään yliaikamerkintä.
  */
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
          .text(`⚠ Aika ylitetty ${formattedTime}`)
          .addClass("badge-overdue");

        taskElement.addClass("overdue");

        if (taskTitle.find(".overdue-label").length === 0) {
          taskTitle.append(` <span class="overdue-label">⚠ Aika ylitetty</span>`);
        }
      } else {
        $(this)
          .text(`⏱️ Jäljellä ${formattedTime}`)
          .removeClass("badge-overdue");

        taskElement.removeClass("overdue");
        taskTitle.find(".overdue-label").remove();
      }
    });
  }

  // Muuttaa millisekunnit luettavaan muotoon, tyylillä "2 h 15 min 3 s".
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

  // Tarkistaa, onko tehtävän määräaika mennyt yli.
  function isTaskOverdue(task) {
    if (!task.date || !task.time || task.completed) {
      return false;
    }

    const deadline = getTaskDeadline(task);
    return deadline.isValid() && dayjs().isAfter(deadline);
  }

  // Muodostaa tehtävän päivämäärästä ja kellonajasta Day.js-aikaolion.
  function getTaskDeadline(task) {
    return dayjs(`${task.date}T${task.time}`);
  }

  // Soittaa valitun muistutusäänen. Ensin pysäytetään mahdolliset aiemmat äänet.
  function playReminderSound(soundName) {
    stopAllSounds();

    if (sounds[soundName]) {
      sounds[soundName].play();
    } else {
      sounds.soft.play();
    }
  }

  // Pysäyttää kaikki Howler.js:llä käynnistetyt muistutusäänet.
  function stopAllSounds() {
    Object.values(sounds).forEach(function (sound) {
      sound.stop();
    });
  }

  // Tallentaa tehtävät selaimen localStorageen.
  function saveTasks() {
    localStorage.setItem("smartTodoTasks", JSON.stringify(tasks));
  }

  /*
    Tehtävien lataaminen localStoragesta.
    Sisältää varmistuksia, jotta vanhat tai puutteelliset tallenteet
    eivät riko sovellusta.
  */
  function loadTasks() {
    try {
      const savedTasks = JSON.parse(localStorage.getItem("smartTodoTasks"));

      if (!Array.isArray(savedTasks)) {
        return [];
      }

      return savedTasks.map(function (task) {
        const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

        return {
          id: task.id || Date.now(),
          text: task.text || "Nimetön tehtävä",
          date: task.date || "",
          time: task.time || "",
          priority: task.priority || "normal",
          sound: task.sound || "soft",
          categoryId: task.categoryId || "",
          completed: Boolean(task.completed),
          reminded: Boolean(task.reminded),
          subtasks: subtasks.map(function (subtask) {
            return {
              id: subtask.id || Date.now(),
              text: subtask.text || "Nimetön alakohta",
              completed: Boolean(subtask.completed),
              createdAt: subtask.createdAt || dayjs().format("YYYY-MM-DD HH:mm"),
              completedAt: subtask.completedAt || null
            };
          }),
          createdAt: task.createdAt || dayjs().format("YYYY-MM-DD HH:mm"),
          completedAt: task.completedAt || null
        };
      });
    } catch (error) {
      console.error("Tehtävien lataaminen epäonnistui:", error);
      return [];
    }
  }



  // Päivittää tehtävän lisäyslomakkeen kategoriavalikon.
  function renderCategoryOptions() {
    const categorySelect = $("#taskCategory");
    categorySelect.empty();
    categorySelect.append(`<option value="">Ei kategoriaa</option>`);

    categories.forEach(function (category) {
      categorySelect.append(`<option value="${category.id}">${escapeHtml(category.name)}</option>`);
    });
  }

  // Päivittää kategoriasuodattimen vaihtoehdot.
  function renderCategoryFilterOptions() {
    const categoryFilter = $("#categoryFilter");
    const selectedValue = categoryFilter.val() || currentCategoryFilter;

    categoryFilter.empty();
    categoryFilter.append(`<option value="all">Kaikki kategoriat</option>`);
    categoryFilter.append(`<option value="">Ei kategoriaa</option>`);

    categories.forEach(function (category) {
      categoryFilter.append(`<option value="${category.id}">${escapeHtml(category.name)}</option>`);
    });

    categoryFilter.val(selectedValue);

    if (categoryFilter.val() === null) {
      currentCategoryFilter = "all";
      categoryFilter.val("all");
    }
  }

  /*
    Kategorioiden hallinta.
    Avaa SweetAlert2-ikkunan, jossa käyttäjä voi luoda uuden kategorian
    ja valita sille oman värin.
  */
  function showCategoryManager() {
    Swal.fire({
      title: "🏷️ Omat kategoriat",
      html: getCategoryManagerHtml(),
      width: "760px",
      showCancelButton: true,
      confirmButtonText: "Lisää kategoria",
      cancelButtonText: "Sulje",
      didOpen: function () {
        bindCategoryManagerEvents();
      },
      preConfirm: function () {
        const name = $("#newCategoryName").val().trim();
        const color = $("#newCategoryColor").val();

        if (name === "") {
          Swal.showValidationMessage("Kirjoita kategorian nimi.");
          return false;
        }

        const duplicate = categories.some(function (category) {
          return category.name.toLowerCase() === name.toLowerCase();
        });

        if (duplicate) {
          Swal.showValidationMessage("Tämän niminen kategoria on jo olemassa.");
          return false;
        }

        categories.push({
          id: String(Date.now()),
          name: name,
          color: color
        });

        saveCategories();
        renderCategoryOptions();
        renderCategoryFilterOptions();
        renderTasks();
        updateCountdowns();

        return true;
      }
    }).then(function (result) {
      if (result.isConfirmed) {
        Swal.fire({
          icon: "success",
          title: "✅ Kategoria lisätty",
          timer: 1100,
          showConfirmButton: false
        });
      }
    });
  }

  // Rakentaa kategorioiden hallintaikkunan HTML-sisällön.
  function getCategoryManagerHtml() {
    let html = `
      <div class="category-manager">
        <div class="category-create-row">
          <input type="text" id="newCategoryName" class="category-name-input" placeholder="Kategorian nimi, esim. Koulu" />
          <input type="color" id="newCategoryColor" class="category-color-input" value="#8fa876" />
        </div>

        <div class="category-preview-text">
          Valitse nimi ja väri. Lisääminen tapahtuu painamalla “Lisää kategoria”.
        </div>
    `;

    if (categories.length === 0) {
      html += `<p class="categories-empty">Ei vielä omia kategorioita.</p>`;
    } else {
      html += `<div class="category-list">`;

      categories.forEach(function (category) {
        const taskCount = tasks.filter(function (task) {
          return task.categoryId === category.id;
        }).length;

        html += `
          <div class="category-manager-item" data-category-id="${category.id}">
            <span class="category-color-dot" style="background-color: ${category.color};"></span>
            <div>
              <strong>${escapeHtml(category.name)}</strong>
              <p>${taskCount} tehtävää</p>
            </div>
            <button type="button" class="category-delete-btn">Poista</button>
          </div>
        `;
      });

      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  // Liittää kategorioiden hallintaikkunan painikkeisiin tapahtumat.
  function bindCategoryManagerEvents() {
    $(document).off("click", ".category-delete-btn");

    $(document).on("click", ".category-delete-btn", function () {
      const categoryId = String($(this).closest(".category-manager-item").data("category-id"));
      const category = getCategoryById(categoryId);

      if (!category) {
        return;
      }

      Swal.fire({
        icon: "warning",
        title: "🏷️ Poistetaanko kategoria?",
        text: `Kategoria "${category.name}" poistetaan tehtävistä, mutta tehtävät säilyvät.`,
        showCancelButton: true,
        confirmButtonText: "Poista",
        cancelButtonText: "Peruuta"
      }).then(function (result) {
        if (!result.isConfirmed) {
          showCategoryManager();
          return;
        }

        categories = categories.filter(function (item) {
          return item.id !== categoryId;
        });

        tasks = tasks.map(function (task) {
          if (task.categoryId === categoryId) {
            task.categoryId = "";
          }

          return task;
        });

        if (currentCategoryFilter === categoryId) {
          currentCategoryFilter = "all";
        }

        saveCategories();
        saveTasks();
        renderCategoryOptions();
        renderCategoryFilterOptions();
        renderTasks();
        updateStats();
        updateCountdowns();

        Swal.fire({
          icon: "success",
          title: "🗑️ Kategoria poistettu",
          timer: 1000,
          showConfirmButton: false
        });
      });
    });
  }

  // Etsii kategorian sen id:n perusteella.
  function getCategoryById(categoryId) {
    if (!categoryId) {
      return null;
    }

    return categories.find(function (category) {
      return category.id === String(categoryId);
    }) || null;
  }

  // Tallentaa kategoriat localStorageen.
  function saveCategories() {
    localStorage.setItem("smartTodoCategories", JSON.stringify(categories));
  }

  // Lataa kategoriat localStoragesta ja varmistaa niiden oikean rakenteen.
  function loadCategories() {
    try {
      const savedCategories = JSON.parse(localStorage.getItem("smartTodoCategories"));

      if (!Array.isArray(savedCategories)) {
        return [];
      }

      return savedCategories
        .filter(function (category) {
          return category && category.name && category.color;
        })
        .map(function (category) {
          return {
            id: String(category.id || Date.now()),
            name: category.name,
            color: normalizeHexColor(category.color)
          };
        });
    } catch (error) {
      console.error("Kategorioiden lataaminen epäonnistui:", error);
      return [];
    }
  }

  // Tarkistaa, että väri on oikeassa HEX-muodossa. Muuten palautetaan oletusväri.
  function normalizeHexColor(color) {
    if (typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      return color;
    }

    return "#8fa876";
  }

  // Muuntaa HEX-värin rgba-muotoon läpinäkyviä taustoja varten.
  function hexToRgba(hex, alpha) {
    const normalizedHex = normalizeHexColor(hex).replace("#", "");
    const red = parseInt(normalizedHex.substring(0, 2), 16);
    const green = parseInt(normalizedHex.substring(2, 4), 16);
    const blue = parseInt(normalizedHex.substring(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  // Muotoilee tallennetun päivämäärän käyttäjälle luettavaan muotoon.
  function formatStoredDate(value) {
    if (!value) {
      return "Ei tietoa";
    }

    const parsedDate = dayjs(value);
    return parsedDate.isValid() ? parsedDate.format("DD.MM.YYYY HH:mm") : value;
  }

  // Estää HTML-koodin suorittamisen käyttäjän syötteissä.
  function escapeHtml(text) {
    return $("<div>").text(text).html();
  }

  // Tarkistetaan muistutukset 10 sekunnin välein.
  setInterval(function () {
    checkReminders();
  }, 10000);

  // Päivitetään countdown-laskurit sekunnin välein.
  setInterval(function () {
    updateCountdowns();
  }, 1000);
});
