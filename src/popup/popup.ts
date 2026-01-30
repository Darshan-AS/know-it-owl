import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    const extractBtn = document.getElementById('extract-btn') as HTMLButtonElement;
    const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
    const statusText = document.getElementById('status-text') as HTMLElement;
    const resultArea = document.getElementById('result-area') as HTMLElement;
    const wordCountSpan = document.getElementById('word-count') as HTMLElement;

    let extractedData: any[] = [];

    extractBtn.addEventListener('click', async () => {
        statusText.innerText = 'Extracting...';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab.id) {
                statusText.innerText = 'Error: No active tab';
                return;
            }

            // Send message to content script
            chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_WORDS' }, (response) => {
                if (chrome.runtime.lastError) {
                    statusText.innerText = 'Error: Could not connect to page. Refresh?';
                    console.error(chrome.runtime.lastError);
                    return;
                }

                if (response && response.success) {
                    extractedData = response.data;
                    wordCountSpan.innerText = response.count.toString();
                    statusText.innerText = 'Extraction Complete!';
                    resultArea.classList.remove('hidden');
                } else {
                    statusText.innerText = 'Failed to extract words.';
                }
            });

        } catch (err) {
            console.error(err);
            statusText.innerText = 'Error occurred.';
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (extractedData.length === 0) return;

        const csvContent = "data:text/csv;charset=utf-8,"
            + "Word,Translation\n"
            + extractedData.map(e => `"${e.word}","${e.translation}"`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "duolingo_words.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    const logBtn = document.getElementById('log-btn') as HTMLButtonElement;
    logBtn.addEventListener('click', () => {
        if (extractedData.length === 0) {
            console.log("Know It Owl: No data to log.");
            return;
        }

        // Send to Content Script so it appears in the Main Console
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'LOG_TO_PAGE_CONSOLE',
                    data: extractedData
                });
            }
        });
    });
});
