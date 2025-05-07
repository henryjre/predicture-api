// Error messages configuration
const errorMessages = {
  1: {
    title: "Your session has expired",
    message: "Please click the button again to refresh access.",
  },
  2: {
    title: "Access Denied",
    message:
      "You don't have permission to view this content. Please contact support if you believe this is an error.",
  },
  3: {
    title: "System Maintenance",
    message:
      "We're currently performing scheduled maintenance. Please check back in a few minutes.",
  },
  4: {
    title: "Too Many Requests",
    message:
      "You've reached the maximum number of requests. Please try again in a few minutes.",
  },
  5: {
    title: "Invalid Link",
    message:
      "This link appears to be broken or has expired. Please request a new link.",
  },
};

// Get error code from URL query parameters
function getErrorCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const errorId = urlParams.get("id");
  return errorId && /^\d+$/.test(errorId) ? errorId : null;
}

// Update content if error code exists
const errorCode = getErrorCode();
if (errorCode && errorMessages[errorCode]) {
  const error = errorMessages[errorCode];
  document.querySelector(".error-title").textContent = error.title;
  document.querySelector(".error-message").textContent = error.message;
  document.title = `${error.title} - Predicture`;
}
