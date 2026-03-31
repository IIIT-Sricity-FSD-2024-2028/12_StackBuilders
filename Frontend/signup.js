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
      window.location.assign("Wellness_Dashboard.html");
      return;
    }

    const adminResult = window.adminAuthStore?.authenticateAdmin(username, password, {
      source: "signup",
    });

    if (adminResult?.ok) {
      window.employeeAuthStore?.clearCurrentEmployeeSession?.();
      window.expertAuthStore?.clearCurrentExpertSession?.();
      window.hrAuthStore?.clearCurrentHrSession?.();
      window.location.assign("dash.html");
      return;
    }

    const hrResult = window.hrAuthStore?.authenticateHr(username, password, {
      source: "signup",
    });

    if (hrResult?.ok) {
      window.employeeAuthStore?.clearCurrentEmployeeSession?.();
      window.expertAuthStore?.clearCurrentExpertSession?.();
      window.adminAuthStore?.clearCurrentAdminSession?.();
      window.location.assign("hr_dashboard.html");
      return;
    }

    if (!expertResult?.ok && !adminResult?.ok && !hrResult?.ok) {
      setError(
        adminResult?.error ||
        hrResult?.error ||
          expertResult?.error ||
          "Invalid credentials. Please check your username and password."
      );
      return;
    }
  });
})();
