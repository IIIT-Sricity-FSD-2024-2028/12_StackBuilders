const hrProfileStore = window.hrProfileStore || null;
const hrAuthStore = window.hrAuthStore || null;
const HR_PROFILE_DEFAULTS = {
  department: "HR",
  designation: "HR Admin",
};
let activeHrProfile = hrAuthStore?.requireHrSession({
  redirectTo: "homepage.html",
}) || null;

const manageProfileBackBtn = document.getElementById("manageProfileBackBtn");
const manageProfileStatus = document.getElementById("manageProfileStatus");
const manageProfileAvatar = document.getElementById("manageProfileAvatar");
const manageProfileHeading = document.getElementById("manageProfileHeading");
const manageProfileSubheading = document.getElementById("manageProfileSubheading");
const manageProfileUsername = document.getElementById("manageProfileUsername");
const manageProfileName = document.getElementById("manageProfileName");
const manageProfilePhoneNumber = document.getElementById("manageProfilePhoneNumber");
const manageProfileLocation = document.getElementById("manageProfileLocation");
const manageProfileDepartment = document.getElementById("manageProfileDepartment");
const manageProfileDesignation = document.getElementById("manageProfileDesignation");
const manageProfileDepartmentBadge = document.getElementById("manageProfileDepartmentBadge");
const saveProfileBtn = document.getElementById("saveProfileBtn");
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

function getInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "HR";
}

function persistHrProfileLocally(profile) {
  if (!profile || !hrProfileStore?.writeProfile) {
    return profile || null;
  }

  const storedProfile = hrProfileStore.writeProfile(profile);
  return hrAuthStore?.getCurrentHr?.() || storedProfile || profile;
}

async function refreshHrProfileFromBackend() {
  if (!activeHrProfile?.id || !window.appApiClient?.request) {
    return;
  }

  try {
    const profile = await window.appApiClient.request(
      `/hr-profiles/${encodeURIComponent(activeHrProfile.id)}`
    );
    activeHrProfile = persistHrProfileLocally(profile) || activeHrProfile;
    fillProfile(activeHrProfile);
  } catch (error) {
    console.error("Unable to refresh HR profile from the backend.", error);
  }
}

async function patchHrProfile(updates, fallbackErrorMessage) {
  if (!activeHrProfile) {
    return null;
  }

  if (window.appApiClient?.request) {
    try {
      const profile = await window.appApiClient.request(
        `/hr-profiles/${encodeURIComponent(activeHrProfile.id)}`,
        {
          method: "PATCH",
          json: updates || {},
        }
      );

      activeHrProfile = persistHrProfileLocally(profile) || profile;
      return activeHrProfile;
    } catch (error) {
      setStatus(error?.message || fallbackErrorMessage, true);
      return null;
    }
  }

  return hrProfileStore?.updateProfile?.(activeHrProfile.id, updates) || null;
}

function fillProfile(profile) {
  if (!profile) return;

  if (manageProfileAvatar) manageProfileAvatar.textContent = getInitials(profile.name);
  if (manageProfileHeading) manageProfileHeading.textContent = profile.name;
  if (manageProfileSubheading) manageProfileSubheading.textContent = `@${profile.email}`;
  if (manageProfileUsername) manageProfileUsername.value = profile.email;
  if (manageProfileName) manageProfileName.value = profile.name;
  if (manageProfilePhoneNumber) manageProfilePhoneNumber.value = profile.phoneNumber || "";
  if (manageProfileLocation) manageProfileLocation.value = profile.location || "";
  if (manageProfileDepartment) manageProfileDepartment.value = HR_PROFILE_DEFAULTS.department;
  if (manageProfileDesignation) manageProfileDesignation.value = HR_PROFILE_DEFAULTS.designation;
  if (manageProfileDepartmentBadge) {
    manageProfileDepartmentBadge.textContent = HR_PROFILE_DEFAULTS.department;
  }
}

if (manageProfileBackBtn) {
  manageProfileBackBtn.addEventListener("click", () => {
    window.location.href = "hr_dashboard.html";
  });
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", async () => {
    if (!activeHrProfile || !hrProfileStore) return;

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

    activeHrProfile = await patchHrProfile({
      name,
      phoneNumber,
      location: normalizeProfileInput(manageProfileLocation?.value),
    }, "Unable to save your profile right now.");

    if (!activeHrProfile) {
      setStatus("Unable to save your profile right now.", true);
      return;
    }

    fillProfile(activeHrProfile);
    setStatus("Profile updated successfully.");
  });
}

if (changePasswordBtn) {
  changePasswordBtn.addEventListener("click", async () => {
    if (!activeHrProfile || !hrProfileStore) return;

    const currentPassword = manageProfileCurrentPassword?.value || "";
    const newPassword = manageProfileNewPassword?.value || "";
    const confirmPassword = manageProfileConfirmPassword?.value || "";

    if (currentPassword !== activeHrProfile.password) {
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

    activeHrProfile = await patchHrProfile({
      password: newPassword,
    }, "Unable to change your password right now.");

    if (!activeHrProfile) {
      setStatus("Unable to change your password right now.", true);
      return;
    }

    if (manageProfileCurrentPassword) manageProfileCurrentPassword.value = "";
    if (manageProfileNewPassword) manageProfileNewPassword.value = "";
    if (manageProfileConfirmPassword) manageProfileConfirmPassword.value = "";
    setStatus("Password changed successfully.");
  });
}

fillProfile(activeHrProfile);
void refreshHrProfileFromBackend();
