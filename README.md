# Know It Owl - Duolingo Word Extractor

**Know It Owl** is a Chrome Extension that helps you extract and export the list of words you have learned on Duolingo.

It works specifically on the [Duolingo Words Practice Page](https://www.duolingo.com/practice-hub/words).

## Features
- **Auto-Load Words**: Automatically clicks "Load more" until all your learned words are visible.
- **Smart Extraction**: Scrapes words and their translations from the page.
- **CSV Export**: Downloads your vocabulary list as a `.csv` file.
- **Console Logging**: View the extracted data directly in your browser console for debugging.

## Installation

1.  **Build the project** (if not already built):
    ```bash
    npm install
    npm run build
    ```
2.  **Load in Chrome**:
    -   Open Chrome and go to `chrome://extensions`.
    -   Enable **Developer mode** (toggle in the top right).
    -   Click **Load unpacked**.
    -   Select the **`dist`** folder inside this project directory.

## Usage

1.  Log in to [Duolingo](https://www.duolingo.com).
2.  Navigate to the **Words** section in the Practice Hub: [https://www.duolingo.com/practice-hub/words](https://www.duolingo.com/practice-hub/words).
3.  Click the **Know It Owl** icon in your browser toolbar.
4.  Click **Extract Words**.
    -   *Note: The extension will automatically scroll and click "Load more" buttons. This may take a few seconds.*
5.  Once extraction is complete, click **Download CSV** to save your words.

## Development

This project uses:
-   **Vite** for building.
-   **TypeScript** for type safety.
-   **Manifest V3** standard.

### specific commands
-   `npm run dev`: Start vite dev server (not typical for extension dev).
-   `npm run build`: Compile TypeScript and assets to `dist/`.
-   `npm run watch`: Watch for changes and rebuild automatically.

## Troubleshooting

-   **"No words found"**: Ensure you are on the correct Duolingo page. If Duolingo updates their site layout, the CSS selectors might need updating in `src/content/extractor.ts`.
-   **Logs**: Use the "Log to Console" button in the popup to see raw data in the web page's Developer Console (F12).

### Google Docs Export Issues
-   **"Access Denied" / "Verification Process" Error**:
    -   While the app is in "Testing" mode in Google Cloud:
    1.  Go to [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **OAuth consent screen**.
    2.  Scroll down to **Test users**.
    3.  Click **ADD USERS**.
    4.  Add your own email address (the one you are logging into Chrome with).
    5.  Save.
