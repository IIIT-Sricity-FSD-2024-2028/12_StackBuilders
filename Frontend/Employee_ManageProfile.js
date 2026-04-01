const employeeAuthStore = window.employeeAuthStore || null;
let activeEmployee = employeeAuthStore?.requireEmployeeSession({
  redirectTo: "homepage.html",
});

const manageProfileBackBtn = document.getElementById("manageProfileBackBtn");
const manageProfileStatus = document.getElementById("manageProfileStatus");
const manageProfileAvatar = document.getElementById("manageProfileAvatar");
const manageProfileHeading = document.getElementById("manageProfileHeading");
const manageProfileSubheading = document.getElementById("manageProfileSubheading");
const manageProfileUsername = document.getElementById("manageProfileUsername");
const manageProfileName = document.getElementById("manageProfileName");
const manageProfileAge = document.getElementById("manageProfileAge");
const manageProfileGender = document.getElementById("manageProfileGender");
const manageProfileHeight = document.getElementById("manageProfileHeight");
const manageProfileWeight = document.getElementById("manageProfileWeight");
const manageProfileBmiBadge = document.getElementById("manageProfileBmiBadge");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const updateMeasurementsBtn = document.getElementById("updateMeasurementsBtn");
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

function fillProfile(employee) {
  const profile = employeeAuthStore?.getEmployeeProfile(employee) || null;
  if (!profile) return;

  if (manageProfileAvatar) manageProfileAvatar.textContent = profile.initials;
  if (manageProfileHeading) manageProfileHeading.textContent = profile.name;
  if (manageProfileSubheading) manageProfileSubheading.textContent = `@${profile.email}`;
  if (manageProfileUsername) manageProfileUsername.value = profile.email;
  if (manageProfileName) manageProfileName.value = profile.name;
  if (manageProfileAge) manageProfileAge.value = profile.age || "";
  if (manageProfileGender) manageProfileGender.value = profile.gender || "";
  if (manageProfileHeight) manageProfileHeight.value = profile.heightCm || "";
  if (manageProfileWeight) manageProfileWeight.value = profile.weightKg || "";
  if (manageProfileBmiBadge) {
    manageProfileBmiBadge.textContent = `BMI: ${profile.bmi.value}`;
  }
}

if (manageProfileBackBtn) {
  manageProfileBackBtn.addEventListener("click", () => {
    window.location.href = "Employee_Dashbaord.html";
  });
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", () => {
    if (!activeEmployee || !employeeAuthStore) return;

    const result = employeeAuthStore.updateEmployee(activeEmployee.id, {
      name: manageProfileName?.value.trim() || activeEmployee.name,
      age: manageProfileAge?.value.trim() || "",
      gender: manageProfileGender?.value.trim() || "",
    });

    if (!result?.ok) {
      setStatus(result?.error || "Unable to save your profile.", true);
      return;
    }

    activeEmployee = result.employee;
    fillProfile(result.employee);
    setStatus("Profile updated successfully.");
  });
}

if (updateMeasurementsBtn) {
  updateMeasurementsBtn.addEventListener("click", () => {
    if (!activeEmployee || !employeeAuthStore) return;

    const result = employeeAuthStore.updateEmployee(activeEmployee.id, {
      heightCm: manageProfileHeight?.value.trim() || "",
      weightKg: manageProfileWeight?.value.trim() || "",
    });

    if (!result?.ok) {
      setStatus(result?.error || "Unable to update your measurements.", true);
      return;
    }

    activeEmployee = result.employee;
    fillProfile(result.employee);
    setStatus("Measurements updated successfully.");
  });
}

if (changePasswordBtn) {
  changePasswordBtn.addEventListener("click", () => {
    if (!activeEmployee || !employeeAuthStore) return;

    const currentPassword = manageProfileCurrentPassword?.value || "";
    const newPassword = manageProfileNewPassword?.value || "";
    const confirmPassword = manageProfileConfirmPassword?.value || "";

    if (currentPassword !== activeEmployee.password) {
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

    const result = employeeAuthStore.updateEmployee(activeEmployee.id, {
      password: newPassword,
    });

    if (!result?.ok) {
      setStatus(result?.error || "Unable to change your password.", true);
      return;
    }

    activeEmployee = result.employee;
    if (manageProfileCurrentPassword) manageProfileCurrentPassword.value = "";
    if (manageProfileNewPassword) manageProfileNewPassword.value = "";
    if (manageProfileConfirmPassword) manageProfileConfirmPassword.value = "";
    setStatus("Password changed successfully.");
  });
}

fillProfile(activeEmployee);
