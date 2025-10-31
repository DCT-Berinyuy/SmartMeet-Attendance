// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);
  if (request.action === "captureAttendance") {
    try {
      const result = captureAttendance();
      console.log("Capture result:", result);
      sendResponse({ success: result.success, count: result.count });
      return false; // Indicates we handled it synchronously
    } catch (error) {
      console.error("Error capturing attendance:", error);
      sendResponse({ success: false, count: 0, error: error.message });
      return false;
    }
  }
  return false;
});

function captureAttendance() {
  // Try multiple selectors to find participant names
  // Google Meet has updated their UI multiple times, so we try different patterns
  const selectors = [
    "div[role='listitem'] span",
    "[data-participant-id] span",
    "[jsname='yDbNre']",
    "div[data-self-name]",
  ];

  let allText = [];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      allText = Array.from(elements)
        .map(el => el.innerText.trim())
        .filter(Boolean);
      break;
    }
  }

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
    !name.match(/[^a-zA-Z\s'.]/) && // filters out icons or symbols
    name.split(' ').length <= 3 // reasonable limit on words per name
  );

  // Remove duplicates
  const uniqueNames = [...new Set(names)];

  if (uniqueNames.length === 0) {
    alert("No valid participants detected. Make sure the participants list is open and visible.");
    return { success: false, count: 0 };
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

  return { success: true, count: uniqueNames.length };
}

