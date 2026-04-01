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
    window.location.href = "Wellness_Dashboard.html";
  });
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", () => {
    if (!activeExpert || !expertAuthStore) return;

    const result = expertAuthStore.updateExpert(activeExpert.id, {
      name: manageProfileName?.value.trim() || activeExpert.name,
      phoneNumber: manageProfilePhoneNumber?.value.trim() || "",
    });

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
  updateProfessionalBtn.addEventListener("click", () => {
    if (!activeExpert || !expertAuthStore) return;

    const result = expertAuthStore.updateExpert(activeExpert.id, {
      specialization: manageProfileSpecialization?.value.trim() || "",
      experience: manageProfileExperience?.value.trim() || "",
    });

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
  changePasswordBtn.addEventListener("click", () => {
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

    if (newPassword !== confirmPassword) {
      setStatus("New password and confirm password do not match.", true);
      return;
    }

    const result = expertAuthStore.updateExpert(activeExpert.id, {
      password: newPassword,
    });

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
