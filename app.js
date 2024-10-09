let deadlines = [];

function updateCurrentTime() {
  const currentTimeElement = document.getElementById("current-time");
  currentTimeElement.textContent = new Date().toLocaleString();
}

function addDeadline() {
  const title = document.getElementById("deadline-title").value;
  const date = document.getElementById("deadline-date").value;
  const time = document.getElementById("deadline-time").value || "00:00";

  if (title && date) {
    const deadline = {
      id: Date.now(),
      title,
      date: new Date(`${date}T${time}`).toISOString(),
    };
    deadlines.push(deadline);
    saveDeadlines();
    renderDeadlines();
    clearInputs();
  }
}

function deleteDeadline(id) {
  deadlines = deadlines.filter((d) => d.id !== id);
  saveDeadlines();
  renderDeadlines();
}

function editDeadline(id) {
  const deadline = deadlines.find((d) => d.id === id);
  if (deadline) {
    document.getElementById("deadline-title").value = deadline.title;
    const dateObj = new Date(deadline.date);
    document.getElementById("deadline-date").value = dateObj
      .toISOString()
      .split("T")[0];
    document.getElementById("deadline-time").value = dateObj
      .toTimeString()
      .slice(0, 5);
    deleteDeadline(id); // Remove the deadline after loading its data
  }
}

function clearInputs() {
  document.getElementById("deadline-title").value = "";
  document.getElementById("deadline-date").value = "";
  document.getElementById("deadline-time").value = "";
}

function saveDeadlines() {
  chrome.storage.sync.set({ deadlines });
}

function loadDeadlines() {
  chrome.storage.sync.get(["deadlines"], (result) => {
    if (result.deadlines) {
      deadlines = result.deadlines;
      renderDeadlines();
    }
  });
}

function formatTimeLeft(deadline) {
  const diff = new Date(deadline.date) - new Date();
  if (diff <= 0) return "Deadline passed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function renderDeadlines() {
  const deadlinesContainer = document.getElementById("deadlines");
  deadlinesContainer.innerHTML = "";
  deadlines
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((deadline) => {
      const deadlineElement = document.createElement("div");
      deadlineElement.className = "deadline-card";
      deadlineElement.innerHTML = `
            <h3>${deadline.title}</h3>
            <p>Due: ${new Date(deadline.date).toLocaleString()}</p>
            <p class="countdown">${formatTimeLeft(deadline)}</p>
            <div class="actions">
                <button class="edit-button" data-id="${
                  deadline.id
                }">Edit</button>
                <button class="delete-button" data-id="${
                  deadline.id
                }">Delete</button>
            </div>
        `;
      deadlinesContainer.appendChild(deadlineElement);
    });
}

// Event delegation for edit and delete buttons
document.getElementById("deadlines").addEventListener("click", (event) => {
  if (event.target.classList.contains("edit-button")) {
    const id = parseInt(event.target.getAttribute("data-id"));
    editDeadline(id);
  } else if (event.target.classList.contains("delete-button")) {
    const id = parseInt(event.target.getAttribute("data-id"));
    deleteDeadline(id);
  }
});

document.getElementById("add-deadline").addEventListener("click", addDeadline);

setInterval(() => {
  updateCurrentTime();
  renderDeadlines();
}, 1000);

loadDeadlines();
updateCurrentTime();
