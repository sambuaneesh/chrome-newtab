// Time and Date
function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString();
    document.getElementById('current-date').textContent = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

setInterval(updateDateTime, 1000);
updateDateTime();

// Search functionality
document.getElementById('search-button').addEventListener('click', performSearch);
document.getElementById('search-bar').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') performSearch();
});

function performSearch() {
    const query = document.getElementById('search-bar').value;
    if (query.trim() !== '') {
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
}

// Bookmarks
document.getElementById('add-bookmark').addEventListener('click', addBookmark);

function addBookmark() {
    const url = prompt('Enter the URL for the new bookmark:');
    if (url) {
        const name = prompt('Enter a name for the bookmark:');
        if (name) {
            const bookmark = document.createElement('a');
            bookmark.href = url.startsWith('http') ? url : `https://${url}`;
            bookmark.className = 'bookmark';
            bookmark.innerHTML = `<i class="fas fa-link"></i> ${name}`;
            document.querySelector('.bookmarks').insertBefore(bookmark, document.getElementById('add-bookmark'));
            saveBookmarks();
        }
    }
}

function saveBookmarks() {
    const bookmarks = Array.from(document.querySelectorAll('.bookmark:not(#add-bookmark)'))
        .map(b => ({ name: b.textContent.trim(), url: b.href }));
    chrome.storage.sync.set({ bookmarks });
}

function loadBookmarks() {
    chrome.storage.sync.get(['bookmarks'], (result) => {
        if (result.bookmarks) {
            result.bookmarks.forEach(bookmark => {
                const bookmarkElement = document.createElement('a');
                bookmarkElement.href = bookmark.url;
                bookmarkElement.className = 'bookmark';
                bookmarkElement.innerHTML = `<i class="fas fa-link"></i> ${bookmark.name}`;
                document.querySelector('.bookmarks').insertBefore(bookmarkElement, document.getElementById('add-bookmark'));
            });
        }
    });
}

// Deadlines
let deadlines = [];

document.getElementById('add-deadline').addEventListener('click', addDeadline);

function addDeadline() {
    const title = document.getElementById('deadline-title').value;
    const date = document.getElementById('deadline-date').value;
    const time = document.getElementById('deadline-time').value || '23:59';

    if (title && date) {
        const deadline = {
            id: Date.now(),
            title,
            date: new Date(`${date}T${time}`).toISOString(),
        };
        deadlines.push(deadline);
        saveDeadlines();
        renderDeadlines();
        clearDeadlineInputs();
    }
}

function deleteDeadline(id) {
    deadlines = deadlines.filter(d => d.id !== id);
    saveDeadlines();
    renderDeadlines();
}

function editDeadline(id) {
    const deadline = deadlines.find(d => d.id === id);
    if (deadline) {
        document.getElementById('deadline-title').value = deadline.title;
        const dateObj = new Date(deadline.date);
        document.getElementById('deadline-date').value = dateObj.toISOString().split('T')[0];
        document.getElementById('deadline-time').value = dateObj.toTimeString().slice(0, 5);
        deleteDeadline(id);
    }
}

function clearDeadlineInputs() {
    document.getElementById('deadline-title').value = '';
    document.getElementById('deadline-date').value = '';
    document.getElementById('deadline-time').value = '';
}

function saveDeadlines() {
    chrome.storage.sync.set({ deadlines });
}

function loadDeadlines() {
    chrome.storage.sync.get(['deadlines'], (result) => {
        if (result.deadlines) {
            deadlines = result.deadlines;
            renderDeadlines();
        }
    });
}

function formatTimeLeft(deadline) {
    const diff = new Date(deadline.date) - new Date();
    if (diff <= 0) return 'Deadline passed';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${minutes}m`;
}

function renderDeadlines() {
    const deadlinesContainer = document.getElementById('deadlines');
    deadlinesContainer.innerHTML = '';
    deadlines.sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach(deadline => {
            const deadlineElement = document.createElement('div');
            deadlineElement.className = 'deadline-card';
            deadlineElement.innerHTML = `
                <h3>${deadline.title}</h3>
                <p>Due: ${new Date(deadline.date).toLocaleString()}</p>
                <p class="countdown">${formatTimeLeft(deadline)}</p>
                <div class="actions">
                    <button onclick="editDeadline(${deadline.id})">Edit</button>
                    <button onclick="deleteDeadline(${deadline.id})">Delete</button>
                </div>
            `;
            deadlinesContainer.appendChild(deadlineElement);
        });
}

// Todo List
let todos = [];

document.getElementById('add-todo').addEventListener('click', addTodo);

function addTodo() {
    const todoInput = document.getElementById('todo-input');
    const todoText = todoInput.value.trim();
    if (todoText) {
        todos.push({ id: Date.now(), text: todoText, completed: false });
        todoInput.value = '';
        saveTodos();
        renderT