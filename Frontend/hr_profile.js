const hrProfileStore = window.hrProfileStore || null;
const hrAuthStore = window.hrAuthStore || null;
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
const updateRoleBtn = document.getElementById("updateRoleBtn");
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

function getInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "HR";
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
  if (manageProfileDepartment) manageProfileDepartment.value = profile.department || "";
  if (manageProfileDesignation) manageProfileDesignation.value = profile.designation || "";
  if (manageProfileDepartmentBadge) {
    manageProfileDepartmentBadge.textContent = profile.department || "Not added";
  }
}

if (manageProfileBackBtn) {
  manageProfileBackBtn.addEventListener("click", () => {
    window.location.href = "hr_dashboard.html";
  });
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", () => {
    if (!activeHrProfile || !hrProfileStore) return;

    activeHrProfile = hrProfileStore.updateProfile({
      name: manageProfileName?.value.trim() || activeHrProfile.name,
      phoneNumber: manageProfilePhoneNumber?.value.trim() || "",
      location: manageProfileLocation?.value.trim() || "",
    });

    fillProfile(activeHrProfile);
    setStatus("Profile updated successfully.");
  });
}

if (updateRoleBtn) {
  updateRoleBtn.addEventListener("click", () => {
    if (!activeHrProfile || !hrProfileStore) return;

    activeHrProfile = hrProfileStore.updateProfile({
      department: manageProfileDepartment?.value.trim() || "",
      designation: manageProfileDesignation?.value.trim() || "",
    });

    fillProfile(activeHrProfile);
    setStatus("HR details updated successfully.");
  });
}

if (changePasswordBtn) {
  changePasswordBtn.addEventListener("click", () => {
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

    if (newPassword !== confirmPassword) {
      setStatus("New password and confirm password do not match.", true);
      return;
    }

    activeHrProfile = hrProfileStore.updateProfile({
      password: newPassword,
    });

    if (manageProfileCurrentPassword) manageProfileCurrentPassword.value = "";
    if (manageProfileNewPassword) manageProfileNewPassword.value = "";
    if (manageProfileConfirmPassword) manageProfileConfirmPassword.value = "";
    setStatus("Password changed successfully.");
  });
}

fillProfile(activeHrProfile);
