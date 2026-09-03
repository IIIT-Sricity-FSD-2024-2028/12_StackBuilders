(function () {
  const loginForm = document.getElementById("signupLoginForm");
  const errorMessage = document.getElementById("signupAuthError");

  if (!loginForm) return;

  function setError(message) {
    if (!errorMessage) return;
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function clearError() {
    if (!errorMessage) return;
    errorMessage.hidden = true;
    errorMessage.textContent = "";
  }

  function getPendingRequestMessage(username, password) {
    const pendingRequest =
      window.companyOnboardingRequestStore?.findPendingRequestByHrEmail?.(
        username
      ) || null;

    if (
      pendingRequest &&
      String(pendingRequest.hrPassword || "") === String(password || "").trim()
    ) {
      return "Your company request is still pending admin approval. You can sign in after it is accepted.";
    }

    return "";
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearError();

    const formData = new FormData(loginForm);
    const username = formData.get("username");
    const password = formData.get("password");
    const employeeResult = window.employeeAuthStore?.authenticateEmployee(
      username,
      password
    );

    if (employeeResult?.ok) {
      window.expertAuthStore?.clearCurrentExpertSession?.();
      window.hrAuthStore?.clearCurrentHrSession?.();
      window.adminAuthStore?.clearCurrentAdminSession?.();
      window.location.assign("Employee_Dashbaord.html");
      return;
    }

    const expertResult = window.expertAuthStore?.authenticateExpert(
      username,
      password
    );

    if (expertResult?.ok) {
      window.employeeAuthStore?.clearCurrentEmployeeSession?.();
      window.hrAuthStore?.clearCurrentHrSession?.();
      window.adminAuthStore?.clearCurrentAdminSession?.();
      window.location.assign(
        window.expertAuthStore?.getExpertDashboardRoute?.(expertResult.expert) ||
          "Wellness_Dashboard.html"
      );
      return;
    }

    const adminResult = window.adminAuthStore?.authenticateAdmin(
      username,
      password,
      {
        source: "homepage",
      }
    );

    if (adminResult?.ok) {
      window.employeeAuthStore?.clearCurrentEmployeeSession?.();
      window.expertAuthStore?.clearCurrentExpertSession?.();
      window.hrAuthStore?.clearCurrentHrSession?.();
      window.location.assign("dash.html");
      return;
    }

    const hrResult = window.hrAuthStore?.authenticateHr(username, password, {
      source: "homepage",
    });

    if (hrResult?.ok) {
      window.employeeAuthStore?.clearCurrentEmployeeSession?.();
      window.expertAuthStore?.clearCurrentExpertSession?.();
      window.adminAuthStore?.clearCurrentAdminSession?.();
      window.location.assign("hr_dashboard.html");
      return;
    }

    const pendingRequestMessage = getPendingRequestMessage(username, password);
    if (pendingRequestMessage) {
      setError(pendingRequestMessage);
      return;
    }

    setError(
      adminResult?.error ||
        hrResult?.error ||
        expertResult?.error ||
        "Invalid credentials. Please check your username and password."
    );
  });
})();
