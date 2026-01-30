// extractor.ts
console.log('Know It Owl: Content script loaded.');

interface WordData {
    word: string;
    translation: string;
    category?: string;
}

function extractWords(): WordData[] {
    console.log('Know It Owl: Starting extraction...');

    // TODO: Update these selectors based on actual Duolingo DOM
    // Attempting to find list items.
    // Duolingo uses React, so classes are often scrambled (e.g. _3x...), but sometimes data-test attributes exist.

    const words: WordData[] = [];

    const potentialListItems = document.querySelectorAll('li, div[role="listitem"]');

    potentialListItems.forEach((item) => {
        const element = item as HTMLElement;

        // Debug info
        // console.log("Know It Owl: Inspecting item:", element.innerHTML);

        let word = '';
        let translation = '';

        // Based on user provided HTML:
        // Structure is: li > div > div > h3 (word) + p (translation)
        // We can just query selector from the list item down.
        const h3 = element.querySelector('h3');
        const p = element.querySelector('p');

        if (h3) {
            word = h3.innerText;
        }

        if (p) {
            translation = p.innerText;
        }

        // Fallback for translation if p is missing but text exists?
        // (Sometimes Duolingo puts translation in a span or just text node)
        if (!translation && word) {
            const allText = element.innerText.split('\n');
            const potentialTranslation = allText.find(t => t.trim() !== word.trim() && t.trim().length > 0);
            if (potentialTranslation) {
                translation = potentialTranslation;
            }
        }

        if (word) {
            words.push({ word, translation });
        }
    });

    console.log(`Know It Owl: Found ${words.length} potential words.`);
    return words;
}

async function loadAllWords() {
    console.log("Know It Owl: Checking for 'Load more' buttons...");

    // Safety break to prevent infinite loops (e.g. if button never disappears)
    let maxClicks = 50;

    while (maxClicks > 0) {
        // User provided HTML: <li class="_2NNqw _2g-qq" role="button"><b>Load more</b>...</li>
        // We look for any li with role button that contains "Load more" text.
        const allButtons = Array.from(document.querySelectorAll('li[role="button"]'));
        const loadMoreBtn = allButtons.find(el => el.textContent?.includes('Load more'));

        if (loadMoreBtn) {
            console.log(`Know It Owl: Clicking 'Load more' (${maxClicks} remaining)...`);
            (loadMoreBtn as HTMLElement).click();

            // Wait for content to load. 
            // 2 seconds is a safe bet for network requests.
            await new Promise(r => setTimeout(r, 2000));
            maxClicks--;
        } else {
            console.log("Know It Owl: No 'Load more' button found. Finished loading.");
            break;
        }
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'EXTRACT_WORDS') {
        // Must handle async operations by returning true and calling sendResponse later.
        (async () => {
            await loadAllWords();
            const data = extractWords();
            sendResponse({ success: true, count: data.length, data });
        })();
        return true; // Keep channel open
    } else if (message.action === 'LOG_TO_PAGE_CONSOLE') {
        console.log("Know It Owl: Extracted Words:", message.data);
    }
    return true;
});
