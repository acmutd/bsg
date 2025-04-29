const useDefaultPopup = () => {
    const redirectToLeetcode = () => {
        window.open("https://leetcode.com/problems/two-sum/", "_blank", "noopener,noreferrer");
    }

    return {redirectToLeetcode};
};

export default useDefaultPopup;
