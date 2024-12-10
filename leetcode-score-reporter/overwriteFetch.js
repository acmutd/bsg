function handleIntercepted(json) {
  // console.log("Intercepted:", json);

  // Check if Submit (not run) and Accepted
  if (json?.finished && json?.status_msg === "Accepted") {
    console.log("Successful Submission:", json);
  }
}

const regex = /\/submissions\/detail\/\d+\/check\//;

function overwriteFetch() {
  // Store original fetch function
  const { fetch: origFetch } = window;

  // Overwrite window.fetch
  window.fetch = async (...args) => {
    const response = await origFetch(...args);
    const resource = args[0];

    // Check if fetching from https://leetcode.com/submissions/detail/.../check/
    if (regex.test(resource)) {
      response
        .clone()
        .json()
        .then(handleIntercepted)
        .catch((err) => console.error(err));
    }

    return response;
  };
}

overwriteFetch();
