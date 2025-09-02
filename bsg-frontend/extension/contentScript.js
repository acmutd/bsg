;(() => {
    const {host, pathname} = window.location;
    if (!host.includes("leetcode.com") || !pathname.startsWith("/problems/")) {
        return;
    }

    const c = document.createElement("div");
    Object.assign(c.style, {
        position: "fixed",
        bottom: "0px",
        right: "0px",
        width: "360px",
        height: "1000px",
        zIndex: "999999",
    });
    document.body.appendChild(c);

    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("logIn.html");
    iframe.style = "width:100%; height:100%; border:none;";
    c.appendChild(iframe);
})();
