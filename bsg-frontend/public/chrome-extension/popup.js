document.getElementById("run-btn").addEventListener("click", function () {
    document.getElementById("test-results").innerText = "Running test cases...";
    setTimeout(() => {
        document.getElementById("test-results").innerText = "✅✅✅✅";
    }, 2000);
});

document.getElementById("submit-btn").addEventListener("click", function () {
    document.getElementById("test-results").innerText = "Submitting...";
    setTimeout(() => {
        document.getElementById("test-results").innerText = "🎉🎉🎉🎉";
    }, 2000);
});
