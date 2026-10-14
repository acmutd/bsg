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

module.exports = { revokeGithubToken };
