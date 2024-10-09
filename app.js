const { useState, useEffect } = React;
const { Clock, Calendar, Edit, Trash } = lucide;

const DeadlineTracker = () => {
  const [deadlines, setDeadlines] = useState([]);
  const [newDeadline, setNewDeadline] = useState({
    title: "",
    date: "",
    time: "",
  });
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // Load deadlines from Chrome storage
    chrome.storage.sync.get(["deadlines"], (result) => {
      if (result.deadlines) {
        setDeadlines(
          result.deadlines.map((d) => ({ ...d, date: new Date(d.date) }))
        );
      }
    });

    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Save deadlines to Chrome storage whenever they change
    chrome.storage.sync.set({
      deadlines: deadlines.map((d) => ({ ...d, date: d.date.toISOString() })),
    });
  }, [deadlines]);

  const addDeadline = () => {
    if (newDeadline.title && newDeadline.date) {
      const deadlineDate = new Date(
        `${newDeadline.date}T${newDeadline.time || "00:00"}`
      );
      setDeadlines([
        ...deadlines,
        { ...newDeadline, id: Date.now(), date: deadlineDate },
      ]);
      setNewDeadline({ title: "", date: "", time: "" });
    }
  };

  const updateDeadline = () => {
    if (editingDeadline) {
      const updatedDeadlines = deadlines.map((d) =>
        d.id === editingDeadline.id
          ? {
              ...editingDeadline,
              date: new Date(
                `${editingDeadline.date}T${editingDeadline.time || "00:00"}`
              ),
            }
          : d
      );
      setDeadlines(updatedDeadlines);
      setEditingDeadline(null);
    }
  };

  const deleteDeadline = (id) => {
    setDeadlines(deadlines.filter((d) => d.id !== id));
  };

  const formatTimeLeft = (deadline) => {
    const diff = Math.max(
      0,
      Math.floor((deadline.date - currentDateTime) / 1000)
    );
    const days = Math.floor(diff / (3600 * 24));
    const hours = Math.floor((diff % (3600 * 24)) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-800">
          Deadline Tracker
        </h1>

        <div className="text-center mb-8">
          <p className="text-2xl font-semibold text-blue-700">
            {currentDateTime.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Deadline</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              className="flex-1 p-2 border rounded"
              value={newDeadline.title}
              onChange={(e) =>
                setNewDeadline({ ...newDeadline, title: e.target.value })
              }
              placeholder="Enter deadline title"
            />
            <input
              className="flex-1 p-2 border rounded"
              type="date"
              value={newDeadline.date}
              onChange={(e) =>
                setNewDeadline({ ...newDeadline, date: e.target.value })
              }
            />
            <input
              className="flex-1 p-2 border rounded"
              type="time"
              value={newDeadline.time}
              onChange={(e) =>
                setNewDeadline({ ...newDeadline, time: e.target.value })
              }
            />
          </div>
          <button
            onClick={addDeadline}
            className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition-colors"
          >
            Add Deadline
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {deadlines
            .sort((a, b) => a.date - b.date)
            .map((deadline) => (
              <div
                key={deadline.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {deadline.title}
                  </h3>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingDeadline(deadline)}
                      className="text-white hover:text-purple-200"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteDeadline(deadline.id)}
                      className="text-white hover:text-red-200"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <Calendar className="mr-2 text-purple-500" size={16} />
                    <span>{formatDate(deadline.date)}</span>
                  </div>
                  <div className="flex items-center mb-2">
                    <Clock className="mr-2 text-blue-500" size={16} />
                    <span>{formatTime(deadline.date)}</span>
                  </div>
                  <div className="text-xl font-bold text-purple-700">
                    {formatTimeLeft(deadline)}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {editingDeadline && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl font-semibold mb-4">Edit Deadline</h2>
              <input
                className="w-full p-2 border rounded mb-2"
                value={editingDeadline.title}
                onChange={(e) =>
                  setEditingDeadline({
                    ...editingDeadline,
                    title: e.target.value,
                  })
                }
              />
              <input
                className="w-full p-2 border rounded mb-2"
                type="date"
                value={editingDeadline.date.toISOString().split("T")[0]}
                onChange={(e) =>
                  setEditingDeadline({
                    ...editingDeadline,
                    date: new Date(e.target.value),
                  })
                }
              />
              <input
                className="w-full p-2 border rounded mb-4"
                type="time"
                value={editingDeadline.date.toTimeString().slice(0, 5)}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(":");
                  const newDate = new Date(editingDeadline.date);
                  newDate.setHours(hours);
                  newDate.setMinutes(minutes);
                  setEditingDeadline({ ...editingDeadline, date: newDate });
                }}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingDeadline(null)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={updateDeadline}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.render(<DeadlineTracker />, document.getElementById("root"));
