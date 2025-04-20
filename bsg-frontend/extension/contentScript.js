;(() => {
    const {host, pathname} = window.location;
    if (!host.includes("leetcode.com") || !pathname.startsWith("/problems/")) {
        return;   // bail out unless we’re on a problem detail page
    }

    const c = document.createElement("div");
    Object.assign(c.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "360px",
        height: "600px",
        zIndex: "999999",
        border: "1px solid #ccc",
        background: "white",
    });
    document.body.appendChild(c);

    // 2) an <iframe> pointing at your exported index.html
    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("defaultPopup.html");
    iframe.style = "width:100%; height:100%; border:none;";
    c.appendChild(iframe);
})();
