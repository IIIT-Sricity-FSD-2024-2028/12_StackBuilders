const expertAuthStore = window.expertAuthStore || null;
let activeExpert = expertAuthStore?.requireExpertSession({
  redirectTo: "homepage.html",
});

const manageProfileBackBtn = document.getElementById("manageProfileBackBtn");
const manageProfileStatus = document.getElementById("manageProfileStatus");
const manageProfileAvatar = document.getElementById("manageProfileAvatar");
const manageProfileHeading = document.getElementById("manageProfileHeading");
const manageProfileSubheading = document.getElementById("manageProfileSubheading");
const manageProfileUsername = document.getElementById("manageProfileUsername");
const manageProfileName = document.getElementById("manageProfileName");
const manageProfilePhoneNumber = document.getElementById("manageProfilePhoneNumber");
const manageProfileStatusValue = document.getElementById("manageProfileStatusValue");
const manageProfileSpecialization = document.getElementById("manageProfileSpecialization");
const manageProfileExperience = document.getElementById("manageProfileExperience");
const manageProfileSpecializationBadge = document.getElementById("manageProfileSpecializationBadge");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const updateProfessionalBtn = document.getElementById("updateProfessionalBtn");
const manageProfileCurrentPassword = document.getElementById("manageProfileCurrentPassword");
const manageProfileNewPassword = document.getElementById("manageProfileNewPassword");
const manageProfileConfirmPassword = document.getElementById("manageProfileConfirmPassword");
const changePasswordBtn = document.getElementById("changePasswordBtn");

function setStatus(message, isError = false) {
  if (!manageProfileStatus) return;

  manageProfileStatus.textContent = message;
  manageProfileStatus.hidden = !message;
  manageProfileStatus.style.color = isError ? "#be123c" : "#0f766e";
}

function normalizeProfileInput(value) {
  return String(value || "").trim();
}

function formatIndianPhoneNumber(value) {
  const digitsOnly = String(value || "").replace(/\D/g, "");

  if (digitsOnly.length === 10) {
    return `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+91 ${digitsOnly.slice(2, 7)} ${digitsOnly.slice(7)}`;
  }

  return null;
}

function isValidPassword(value) {
  return normalizeProfileInput(value).length >= 6;
}

function persistExpertLocally(expert) {
  if (!expert || !expertAuthStore?.readExperts || !expertAuthStore?.writeExperts) {
    return expert || null;
  }

  const normalizedId = normalizeProfileInput(expert.id);
  const remainingExperts = expertAuthStore
    .readExperts({ includeAllCompanies: true })
    .filter((record) => normalizeProfileInput(record?.id) !== normalizedId);

  expertAuthStore.writeExperts([expert, ...remainingExperts]);
  return expertAuthStore.getCurrentExpert?.() || expert;
}

async function refreshExpertFromBackend() {
  if (!activeExpert?.id || !window.appApiClient?.request) {
    return;
  }

  try {
    const expert = await window.appApiClient.request(
      `/experts/${encodeURIComponent(activeExpert.id)}`
    );
    activeExpert = persistExpertLocally(expert) || activeExpert;
    fillProfile(activeExpert);
  } catch (error) {
    console.error("Unable to refresh wellness expert profile from the backend.", error);
  }
}

async function patchExpertProfile(updates, fallbackErrorMessage) {
  if (!activeExpert) {
    return {
      ok: false,
      error: "Expert session not found.",
    };
  }

  if (window.appApiClient?.request) {
    try {
      const expert = await window.appApiClient.request(
        `/experts/${encodeURIComponent(activeExpert.id)}`,
        {
          method: "PATCH",
          json: updates || {},
        }
      );

      activeExpert = persistExpertLocally(expert) || expert;
      return {
        ok: true,
        expert: activeExpert,
      };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || fallbackErrorMessage,
      };
    }
  }

  return expertAuthStore?.updateExpert?.(activeExpert.id, updates) || {
    ok: false,
    error: fallbackErrorMessage,
  };
}

function fillProfile(expert) {
  const profile = expertAuthStore?.getExpertProfile(expert) || null;
  if (!profile) return;

  if (manageProfileAvatar) manageProfileAvatar.textContent = profile.initials;
  if (manageProfileHeading) manageProfileHeading.textContent = profile.name;
  if (manageProfileSubheading) manageProfileSubheading.textContent = `@${profile.email}`;
  if (manageProfileUsername) manageProfileUsername.value = profile.email;
  if (manageProfileName) manageProfileName.value = profile.name;
  if (manageProfilePhoneNumber) manageProfilePhoneNumber.value = profile.phoneNumber || "";
  if (manageProfileStatusValue) manageProfileStatusValue.value = profile.status || "Active";
  if (manageProfileSpecialization) {
    manageProfileSpecialization.value = profile.specialization || "";
  }
  if (manageProfileExperience) {
    manageProfileExperience.value = profile.experience || "";
  }
  if (manageProfileSpecializationBadge) {
    manageProfileSpecializationBadge.textContent =
      profile.specialization || "Wellness Expert";
  }
}

if (manageProfileBackBtn) {
  manageProfileBackBtn.addEventListener("click", () => {
    window.location.href =
      expertAuthStore?.getExpertDashboardRoute?.(activeExpert) || "Wellness_Dashboard.html";
  });
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", async () => {
    if (!activeExpert || !expertAuthStore) return;

    const name = normalizeProfileInput(manageProfileName?.value);
    const phoneNumber = normalizeProfileInput(manageProfilePhoneNumber?.value);

    if (!name) {
      setStatus("Name cannot be blank.", true);
      manageProfileName?.focus?.();
      return;
    }

    if (phoneNumber && !formatIndianPhoneNumber(phoneNumber)) {
      setStatus("Enter a valid Indian phone number.", true);
      manageProfilePhoneNumber?.focus?.();
      return;
    }

    const result = await patchExpertProfile(
      {
      name,
      phoneNumber,
      },
      "Unable to save your profile."
    );

    if (!result?.ok) {
      setStatus(result?.error || "Unable to save your profile.", true);
      return;
    }

    activeExpert = result.expert;
    fillProfile(result.expert);
    setStatus("Profile updated successfully.");
  });
}

if (updateProfessionalBtn) {
  updateProfessionalBtn.addEventListener("click", async () => {
    if (!activeExpert || !expertAuthStore) return;

    const specialization = normalizeProfileInput(manageProfileSpecialization?.value);
    const experience = normalizeProfileInput(manageProfileExperience?.value);

    if (!specialization) {
      setStatus("Specialization cannot be blank.", true);
      manageProfileSpecialization?.focus?.();
      return;
    }

    const result = await patchExpertProfile(
      {
      specialization,
      experience,
      },
      "Unable to update your professional details."
    );

    if (!result?.ok) {
      setStatus(result?.error || "Unable to update your professional details.", true);
      return;
    }

    activeExpert = result.expert;
    fillProfile(result.expert);
    setStatus("Professional details updated successfully.");
  });
}

if (changePasswordBtn) {
  changePasswordBtn.addEventListener("click", async () => {
    if (!activeExpert || !expertAuthStore) return;

    const currentPassword = manageProfileCurrentPassword?.value || "";
    const newPassword = manageProfileNewPassword?.value || "";
    const confirmPassword = manageProfileConfirmPassword?.value || "";

    if (currentPassword !== activeExpert.password) {
      setStatus("Current password is incorrect.", true);
      return;
    }

    if (!newPassword) {
      setStatus("Please enter a new password.", true);
      return;
    }

    if (!isValidPassword(newPassword)) {
      setStatus("New password must be at least 6 characters long.", true);
      manageProfileNewPassword?.focus?.();
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("New password and confirm password do not match.", true);
      return;
    }

    const result = await patchExpertProfile(
      {
      password: newPassword,
      },
      "Unable to change your password."
    );

    if (!result?.ok) {
      setStatus(result?.error || "Unable to change your password.", true);
      return;
    }

    activeExpert = result.expert;
    if (manageProfileCurrentPassword) manageProfileCurrentPassword.value = "";
    if (manageProfileNewPassword) manageProfileNewPassword.value = "";
    if (manageProfileConfirmPassword) manageProfileConfirmPassword.value = "";
    setStatus("Password changed successfully.");
  });
}

fillProfile(activeExpert);
void refreshExpertFromBackend();
