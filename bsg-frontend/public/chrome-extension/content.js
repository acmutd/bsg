(() => {
    if (document.getElementById("bsg-sidebar")) return;

    let mainContent = document.querySelector("main") || document.body;

    // blacked
    let blackBackground = document.createElement("div");
    blackBackground.id = "bsg-black-background";
    Object.assign(blackBackground.style, {
        position: "absolute",
        right: "10px", // adjusted to avoid touching the right side
        top: "10px", // adjusted to avoid touching the top side
        width: "322.5px", // smaller width
        height: "97.5vh", // smaller height
        backgroundColor: "black", 
        zIndex: "11", 
        transition: "width 0.1s ease", 
        borderRadius: "10px", 
    });

    // makin dat bar
    let sidebar = document.createElement("div");
    sidebar.id = "bsg-sidebar";
    sidebar.innerHTML = ` 
        <div id="bsg-header">
            <span>BSG</span>
            <button id="bsg-close">✖</button>
        </div>
        <div id="bsg-code"> Room Code: </div>
        <div id="bsg-content">
            <span>Pla-qVH2L6</span>
        </div>
        <div id="bsg-resizer">
            <div id="bsg-grip"></div>
        </div>
        <input type="text" id="bsg-message" placeholder="Type a message..." />
    `;

    // stylish bar
    Object.assign(sidebar.style, {
        position: "absolute",
        right: "10px", // adjusted to avoid touching the right side
        top: "10px", // adjusted to avoid touching the top side
        width: "300px", // smaller width
        height: "95vh", // smaller height
        backgroundColor: "#1E1E1E",
        borderLeft: "none",
        display: "flex",
        flexDirection: "column",
        padding: "10px",
        color: "white",
        zIndex: "12", 
        transition: "width 0.1s ease", 
        boxShadow: "-2px 0 5px rgba(0, 0, 0, 0.2)",
        marginBottom: "10px",
        marginTop: "10px",
        marginRight: "10px",
        borderRadius: "10px", 
    });

    // no overlap?!
    Object.assign(mainContent.style, {
        marginRight: "270px", // adjusted to match new sidebar width
        transition: "margin-right 0.3s ease",
    });

    let header = sidebar.querySelector("#bsg-header");
    Object.assign(header.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px",
        borderRadius: "10px",
        backgroundColor: "rgba(100, 100, 100, 0.3)",
        color: "white",
        cursor: "grab",
        marginBottom: "10px"
    });

    let codeHeader = sidebar.querySelector("#bsg-code");
    Object.assign(codeHeader.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "grey",
        cursor: "grab",
    });

    let content = sidebar.querySelector("#bsg-content");
    Object.assign(content.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px",
        borderRadius: "10px",
        backgroundColor: "rgba(60, 60, 60, 0.3)", 
        color: "white",
        cursor: "grab",
        marginRight: "auto",
    });

    let messageInput = sidebar.querySelector("#bsg-message");
    Object.assign(messageInput.style, {
        marginTop: "auto",
        padding: "10px",
        borderRadius: "10px",
        border: "none",
        backgroundColor: "#333",
        color: "white",
    });

    let closeButton = sidebar.querySelector("#bsg-close");
    closeButton.style.background = "none";
    closeButton.style.border = "none";
    closeButton.style.color = "white";
    closeButton.style.cursor = "pointer";
    closeButton.onclick = () => {
        sidebar.remove();
        blackBackground.remove(); 
        mainContent.style.marginRight = "0";
    };

    // grab me
    let resizer = sidebar.querySelector("#bsg-resizer");
    Object.assign(resizer.style, {
        width: "12px",
        height: "100%",
        backgroundColor: "rgba(30, 30, 30, 0.2)",
        cursor: "ew-resize",
        position: "absolute",
        left: "-12px",
        top: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "-2px 0 5px rgba(0, 0, 0, 0.2)",
        borderRadius: "10px", 
    });

    // grippy
    let grip = resizer.querySelector("#bsg-grip");
    Object.assign(grip.style, {
        width: "6px",
        height: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        opacity: "0.3",
    });

    for (let i = 0; i < 3; i++) {
        let dot = document.createElement("div");
        Object.assign(dot.style, {
            width: "4px",
            height: "4px",
            backgroundColor: "white",
            borderRadius: "50%"
        });
        grip.appendChild(dot);
    }

    // drag-deez nuts across your face
    resizer.addEventListener("mousedown", (event) => {
        event.preventDefault();
        document.addEventListener("mousemove", resizeSidebar);
        document.addEventListener("mouseup", stopResizing);
    });

    function resizeSidebar(event) {
        let newWidth = window.innerWidth - event.clientX;
        if (newWidth > 300 && newWidth < 450) { 
            sidebar.style.width = `${newWidth}px`;
            blackBackground.style.width = `${newWidth + 22.5}px`;
            mainContent.style.marginRight = `${newWidth + 20}px`;
        }
    }

    function stopResizing() {
        document.removeEventListener("mousemove", resizeSidebar);
        document.removeEventListener("mouseup", stopResizing);
    }

    // finally
    mainContent.parentNode.appendChild(blackBackground);
    mainContent.parentNode.appendChild(sidebar);
})();
