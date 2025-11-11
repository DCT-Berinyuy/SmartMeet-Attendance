# SmartMeet-Attendance

Automatically record Google Meet attendance without stress — so the prefect doesn't have to manually collect proofs or track names.

## Features

- 🤖 **Automated Attendance Tracking**: One-click capture of all participants in a Google Meet session
- 📝 **CSV Export**: Downloads a clean CSV file with participant names
- 🎯 **Smart Filtering**: Automatically filters out UI elements and non-name text
- ⚡ **Easy to Use**: Simple popup interface that works instantly

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The SmartMeet Attendance icon should appear in your Chrome toolbar

## How to Use

1. **Join or host a Google Meet session**
2. **Open the participants list** (click the "People" icon in the Meet toolbar)
3. **Click the SmartMeet Attendance extension icon** in your Chrome toolbar
4. **Click "Capture Attendance"**
5. A CSV file will automatically download with all participant names

## How It Works

The extension:
- Scans the Google Meet participants sidebar
- Extracts participant names using smart filtering
- Removes duplicates and UI artifacts
- Generates a CSV file for easy tracking

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: `activeTab`, `scripting`, `storage`
- **Content Script**: Runs on `https://meet.google.com/*`
- **Browser**: Chrome/Chromium-based browsers

## File Structure

```
smartmeet-attendance/
├── manifest.json      # Extension configuration
├── content.js         # Main logic for capturing attendance
├── popup.html         # Extension popup UI
├── popup.js           # Popup event handlers
├── style.css          # Popup styling
├── icon-*.png         # Extension icons
└── README.md          # This file
```

## Future Enhancements

- [ ] Automatic timestamp tracking
- [ ] Multiple session support
- [ ] Export to Google Sheets integration
- [ ] Configurable blacklist
- [ ] Attendance history
- [ ] Email notifications

## License

MIT License