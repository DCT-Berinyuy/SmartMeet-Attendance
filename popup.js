// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadHistory();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById("capture").addEventListener("click", captureClickHandler);
  document.getElementById("clearHistory").addEventListener("click", clearHistoryHandler);
}

// Main capture handler
async function captureClickHandler() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Check if we're on a Google Meet page
  if (!tab.url.includes('meet.google.com')) {
    document.getElementById("status").textContent = "Please open a Google Meet session first!";
    document.getElementById("status").style.color = "orange";
    return;
  }
  
  // Send message to content script and handle response
  try {
    console.log("Sending message to content script...");
    const response = await chrome.tabs.sendMessage(tab.id, { action: "captureAttendance" });
    console.log("Received response:", response);
    
    if (response && response.success) {
      // Save to history
      await saveToHistory(response.count);
      // Update stats
      loadStats();
      loadHistory();
      // Show success
      showStatus(`✓ Captured ${response.count} participant(s)!`, "green");
    } else {
      showStatus("Failed to capture attendance", "red");
    }
  } catch (error) {
    console.error("Error with sendMessage, trying executeScript:", error);
    // Fallback: execute script directly
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: captureAttendanceFunction
      });
      
      if (results && results[0] && results[0].result) {
        await saveToHistory(results[0].result);
        loadStats();
        loadHistory();
        showStatus("✓ Attendance captured!", "green");
      } else {
        showStatus("Failed to capture attendance", "red");
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      showStatus("Failed to capture attendance", "red");
    }
  }
}

// Save attendance to history
async function saveToHistory(count) {
  try {
    const result = await chrome.storage.local.get(['attendanceHistory']);
    const history = result.attendanceHistory || [];
    
    const newEntry = {
      timestamp: Date.now(),
      count: count
    };
    
    history.unshift(newEntry);
    // Keep only last 20 entries
    if (history.length > 20) {
      history.pop();
    }
    
    await chrome.storage.local.set({ attendanceHistory: history });
  } catch (error) {
    console.error("Error saving to history:", error);
  }
}

// Load and display statistics
async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['attendanceHistory']);
    const history = result.attendanceHistory || [];
    
    document.getElementById('totalSessions').textContent = history.length;
    
    if (history.length > 0) {
      const lastSession = new Date(history[0].timestamp);
      const timeAgo = getTimeAgo(lastSession);
      document.getElementById('lastSession').textContent = timeAgo;
    } else {
      document.getElementById('lastSession').textContent = "N/A";
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// Load and display history
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get(['attendanceHistory']);
    const history = result.attendanceHistory || [];
    const historyList = document.getElementById('historyList');
    
    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-state">No attendance records yet</p>';
      return;
    }
    
    historyList.innerHTML = history.map(entry => {
      const date = new Date(entry.timestamp);
      const formattedDate = formatDate(date);
      return `
        <div class="history-item">
          <span class="history-item-date">${formattedDate}</span>
          <span class="history-item-count">${entry.count} participants</span>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error("Error loading history:", error);
  }
}

// Clear history
async function clearHistoryHandler() {
  if (confirm("Clear all attendance history?")) {
    await chrome.storage.local.set({ attendanceHistory: [] });
    loadStats();
    loadHistory();
  }
}

// Show status message
function showStatus(message, color) {
  const statusEl = document.getElementById("status");
  statusEl.textContent = message;
  statusEl.style.color = color;
  
  setTimeout(() => {
    statusEl.textContent = "";
  }, 3000);
}

// Format date for display
function formatDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

// Get time ago for stats
function getTimeAgo(date) {
  const diffMs = Date.now() - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

// Fallback function for executeScript
function captureAttendanceFunction() {
  // Get all text elements in the Meet participants sidebar
  const allText = Array.from(document.querySelectorAll("div[role='listitem'] span"))
    .map(el => el.innerText.trim())
    .filter(Boolean);

  // Filter out non-name phrases
  const blacklist = [
    "More actions",
    "Mute",
    "Unmute",
    "Your presentation",
    "Scroll and zoom",
    "Enter full screen",
    "Exit full screen",
    "Meeting host",
    "Organizer",
    "keep",
    "You",
    "View all",
    "Presenting",
    "Remove",
    "Unpin",
    "Pin",
  ];

  const names = allText.filter(name =>
    !blacklist.some(bad => name.includes(bad)) &&
    name.length > 1 &&
    !name.match(/[^a-zA-Z\s'.]/) &&
    name.split(' ').length <= 3
  );

  // Remove duplicates
  const uniqueNames = [...new Set(names)];

  if (uniqueNames.length === 0) {
    alert("No valid participants detected. Make sure the participants list is open and visible.");
    return null;
  }

  // Add timestamp to filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `attendance_${timestamp}.csv`;

  // Generate CSV with timestamp header
  const csvContent = "data:text/csv;charset=utf-8," 
    + "Participants Names\n" 
    + uniqueNames.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return uniqueNames.length;
}
