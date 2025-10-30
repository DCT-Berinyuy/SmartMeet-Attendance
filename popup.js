document.getElementById("capture").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: captureAttendance
  });
});

function captureAttendance() {
  const names = Array.from(
    document.querySelectorAll("[data-participant-id]")
  ).map((el) => el.innerText);

  if (names.length === 0) {
    alert("No participants detected. Try again during an active meeting.");
    return;
  }

  const csvContent = "data:text/csv;charset=utf-8," + names.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "attendance.csv");
  document.body.appendChild(link);
  link.click();
}
