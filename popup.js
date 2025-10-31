document.getElementById("capture").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: captureAttendance
  });
});

function captureAttendance() {
  // Get all text elements in the Meet participants sidebar
  const allText = Array.from(document.querySelectorAll("div[role='listitem'] span"))
    .map(el => el.innerText.trim())
    .filter(Boolean);

  // Filter out non-name phrases
  const blacklist = [
    "More actions",
    "Mute",
    "Your presentation",
    "Scroll and zoom",
    "Enter full screen",
    "Meeting host",
    "keep",
    "You",
  ];

  const names = allText.filter(name =>
    !blacklist.some(bad => name.includes(bad)) &&
    name.length > 1 &&
    !name.match(/[^a-zA-Z\s'.]/) // filters out icons or symbols
  );

  // Remove duplicates
  const uniqueNames = [...new Set(names)];

  if (uniqueNames.length === 0) {
    alert("No valid participants detected. Try again when the participants list is visible.");
    return;
  }

  // Generate CSV
  const csvContent = "data:text/csv;charset=utf-8," + uniqueNames.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "attendance.csv");
  document.body.appendChild(link);
  link.click();
}

