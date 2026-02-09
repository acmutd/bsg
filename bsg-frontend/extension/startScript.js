/* 
 * Runs at document_start (before DOM is loaded)
 * Is able to function at document_idle (after DOM is loaded (default))
 * Can be combined with contentScript.js (runs at document_idle)
 */

(() => {
    // Parse problem slug/name from url
    const problemSlug = location.pathname.split('/')[2];
    const problemName = problemSlug.replaceAll('-', ' ');
    console.log(problemSlug);
    console.log(problemName);

    // const problemId = fetchId(problemSlug); <- fetch id by slug from DB
    // const problemId = fetchId(problemName); <- fetch id by name from DB (MUST QUERY FOR LOWERCASE)
    const problemId = "7";
    const roomProblemIds= ["1", "2", "7"]; // pass in a list of ids

    if (!roomProblemIds.includes(problemId)) {
        console.log("Problem not in list");
        return;
    }

    const initKey = `init-${problemId}`;

    chrome.storage.local.get(initKey, async (storage) => {
        if (storage[initKey]) {
            console.log("Already initialized");
            return;
        }

        console.log("Clearing previous code");
        await deleteProblemCode(problemId);
        // Make sure to clear key in local storage at end of room
        chrome.storage.local.set({ [initKey]: true });
    });
})()

function deleteProblemCode(problemId) {
    return new Promise((resolve, reject) => {
        const DB_NAME = "LeetCode-problems";
        const STORE_NAME = "problem_code";

        const openReq = indexedDB.open(DB_NAME);

        openReq.onerror = () => {
            console.error("Failed to open DB");
        };

        openReq.onsuccess = () => {
            const codeDB = openReq.result;
            const transaction = codeDB.transaction(STORE_NAME, "readwrite");
            const cursorReq = transaction.objectStore(STORE_NAME).openCursor();

            cursorReq.onsuccess = (e) => {
                const cursor = e.target.result;
                if (!cursor) return;
                const key = cursor.key;

                // Delete all entries with matching problem id
                if (key.startsWith(`${problemId}_`)) {
                    console.log("Deleting: ", key);
                    cursor.delete();
                }

                cursor.continue();
            };

            // Prevent memory leak
            transaction.oncomplete = () => {
                codeDB.close();
                console.log("Code reset complete");
                resolve();
            };

            transaction.onerror = () => reject("Transaction failed")
        };
    });
};