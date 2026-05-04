(function () {
  const revealElements = Array.from(document.querySelectorAll(".reveal"));
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  if (revealElements.length) {
    if (prefersReducedMotion.matches) {
      revealElements.forEach((element) => element.classList.add("is-visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries, currentObserver) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const element = entry.target;
            const siblings = Array.from(
              element.parentElement?.querySelectorAll(":scope > .reveal") || []
            );
            const index = Math.max(siblings.indexOf(element), 0);

            window.setTimeout(() => {
              element.classList.add("is-visible");
            }, Math.min(index * 90, 360));

            currentObserver.unobserve(element);
          });
        },
        {
          threshold: 0.18,
          rootMargin: "0px 0px -8% 0px",
        }
      );

      revealElements.forEach((element) => observer.observe(element));
    }
  }

  const signupModal = document.getElementById("signupModal");
  const openSignupButtons = Array.from(
    document.querySelectorAll("[data-open-signup]")
  );

  if (!signupModal || !openSignupButtons.length) return;

  const closeSignupButtons = Array.from(
    signupModal.querySelectorAll("[data-close-signup]")
  );
  const signinForm = document.getElementById("homepageSigninForm");
  const signinError = document.getElementById("homepageSigninError");
  let lastFocusedElement = null;

  const showSigninError = (message) => {
    if (!signinError) return;
    signinError.textContent = message;
    signinError.hidden = false;
  };

  const clearSigninError = () => {
    if (!signinError) return;
    signinError.hidden = true;
    signinError.textContent = "";
  };

  const getPendingRequestMessage = (username, password) => {
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
  };

  const openSignupModal = (event) => {
    event?.preventDefault();
    lastFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    signupModal.hidden = false;
    signupModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    clearSigninError();
    window.requestAnimationFrame(() => {
      signinForm?.querySelector("input")?.focus();
    });
  };

  const closeSignupModal = () => {
    signupModal.hidden = true;
    signupModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    lastFocusedElement?.focus?.();
  };

  openSignupButtons.forEach((button) => {
    button.addEventListener("click", openSignupModal);
  });

  closeSignupButtons.forEach((button) => {
    button.addEventListener("click", closeSignupModal);
  });

  if (signinForm) {
    signinForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearSigninError();

      const formData = new FormData(signinForm);
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
        showSigninError(pendingRequestMessage);
        return;
      }

      showSigninError(
        adminResult?.error ||
          hrResult?.error ||
          expertResult?.error ||
          "Invalid credentials. Please check your username and password."
      );
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !signupModal.hidden) {
      closeSignupModal();
    }
  });
})();
