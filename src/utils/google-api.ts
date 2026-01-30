
export interface GoogleDoc {
    id: string;
    name: string;
}

const DOCS_SCOPE = 'https://www.googleapis.com/auth/documents';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export async function getAuthToken(): Promise<string> {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                reject(chrome.runtime.lastError?.message || 'Failed to get token');
            } else {
                resolve(token);
            }
        });
    });
}

export async function searchForDoc(filename: string, token: string): Promise<GoogleDoc | null> {
    const query = `name = '${filename}' and mimeType = 'application/vnd.google-apps.document' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Know It Owl: Drive Search Failed. Status: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to search Drive: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
        return { id: data.files[0].id, name: data.files[0].name };
    }
    return null;
}

export async function createDoc(filename: string, token: string): Promise<GoogleDoc> {
    const url = 'https://www.googleapis.com/drive/v3/files';
    const metadata = {
        name: filename,
        mimeType: 'application/vnd.google-apps.document'
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
    });

    if (!response.ok) throw new Error('Failed to create Doc');
    const data = await response.json();
    return { id: data.id, name: data.name };
}

export async function appendToDoc(docId: string, text: string, token: string) {
    const url = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;

    // Insert text at the end of the document
    // We use index 1 or try to find 'endOfSegmentLocation'
    // A simple append often requires knowing the end index, but 'endOfSegmentLocation' works nicely.
    const requests = [
        {
            insertText: {
                text: text + '\n',
                endOfSegmentLocation: { segmentId: '' } // Body
            }
        }
    ];

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Failed to append to Doc: ${err.error?.message || 'Unknown error'}`);
    }
}

export async function overwriteDoc(docId: string, text: string, token: string) {
    // 1. Get Document to find its length
    const getUrl = `https://docs.googleapis.com/v1/documents/${docId}`;
    const getResponse = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!getResponse.ok) throw new Error('Failed to get Doc metadata for overwrite');
    const docMeta = await getResponse.json();

    // The body content ends at the last element's endIndex
    const content = docMeta.body.content;
    const lastIndex = content[content.length - 1].endIndex;

    const requests: any[] = [];

    // If there is content to delete (more than just the final newline, which is effectively index 1 to 2)
    // Indexes are 1-based. A strictly empty doc has body content size 2 (start 0, end 2, char at 1 is \n).
    if (lastIndex > 2) {
        requests.push({
            deleteContentRange: {
                range: {
                    startIndex: 1,
                    endIndex: lastIndex - 1
                }
            }
        });
    }

    requests.push({
        insertText: {
            text: text,
            location: { index: 1 }
        }
    });

    const updateUrl = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;
    const updateResponse = await fetch(updateUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
    });

    if (!updateResponse.ok) {
        const err = await updateResponse.json();
        throw new Error(`Failed to overwrite Doc: ${err.error?.message || 'Unknown error'}`);
    }
}
