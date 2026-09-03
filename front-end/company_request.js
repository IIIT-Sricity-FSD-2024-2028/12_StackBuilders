(function () {
  const requestForm = document.getElementById("companyRequestForm");
  const errorMessage = document.getElementById("companyRequestError");
  const successMessage = document.getElementById("companyRequestSuccess");
  const firstField = document.getElementById("companyName");

  if (!requestForm) {
    return;
  }

  const setError = (message) => {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.hidden = false;
    }

    if (successMessage) {
      successMessage.hidden = true;
      successMessage.textContent = "";
    }
  };

  const setSuccess = (message) => {
    if (successMessage) {
      successMessage.textContent = message;
      successMessage.hidden = false;
    }

    if (errorMessage) {
      errorMessage.hidden = true;
      errorMessage.textContent = "";
    }
  };

  window.requestAnimationFrame(() => {
    firstField?.focus();
  });

  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!requestForm.reportValidity()) {
      return;
    }

    const formData = new FormData(requestForm);
    const result = await window.companyOnboardingRequestStore?.createRequest?.({
      companyName: formData.get("companyName"),
      companyPhone: formData.get("companyPhone"),
      companyAddress: formData.get("companyAddress"),
      companyEmail: formData.get("companyEmail"),
      hrName: formData.get("hrName"),
      hrPhoneNumber: formData.get("hrPhoneNumber"),
      hrEmail: formData.get("hrEmail"),
      hrPassword: formData.get("hrPassword"),
    });

    if (!result?.ok) {
      setError(
        result?.error ||
          "Your company request could not be submitted right now."
      );
      return;
    }

    requestForm.reset();
    setSuccess(
      "Request submitted successfully. After admin approval, sign in with the HR Gmail and password you entered."
    );
    firstField?.focus();
  });
})();
