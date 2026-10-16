// Revokes a single OAuth token (the user's grant stays, so GitHub skips the consent screen next login)
async function revokeGithubToken(accessToken) {
    const credentials = Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString('base64');

    return fetch(`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            access_token: accessToken
        })
    });
}

// GitHub repo names can't contain spaces, so "BSG Submissions" becomes BSG-Submissions
const SUBMISSION_REPO = 'BSG-Submissions';

function githubHeaders(accessToken) {
    return {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
    };
}

// Called on every GitHub login; a 422 means the repo already exists, which is fine
async function createSubmissionRepo(accessToken) {
    const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: githubHeaders(accessToken),
        body: JSON.stringify({
            name: SUBMISSION_REPO,
            description: 'Solutions submitted during BSG rounds'
        })
    });
    if (!response.ok && response.status !== 422) {
        throw new Error(`Repo creation failed: ${response.status} ${await response.text()}`);
    }
}

// Creates the file, or updates it if this problem was solved before (updating requires the current file's sha)
async function commitSolution(accessToken, owner, path, code, message) {
    const fileUrl = `https://api.github.com/repos/${owner}/${SUBMISSION_REPO}/contents/${path}`;

    const existing = await fetch(fileUrl, { headers: githubHeaders(accessToken) });
    const sha = existing.ok ? (await existing.json()).sha : undefined;

    const response = await fetch(fileUrl, {
        method: 'PUT',
        headers: githubHeaders(accessToken),
        body: JSON.stringify({
            message,
            content: Buffer.from(code).toString('base64'),
            sha
        })
    });
    if (!response.ok) {
        throw new Error(`Commit failed: ${response.status} ${await response.text()}`);
    }
}

module.exports = { revokeGithubToken, createSubmissionRepo, commitSolution };
