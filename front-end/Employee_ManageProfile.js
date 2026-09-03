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
const manageProfilePhoneNumber = document.getElementById("manageProfilePhoneNumber");
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

function normalizeProfileInput(value) {
  return String(value || "").trim();
}

function isOptionalNumberInRange(value, min, max) {
  const raw = normalizeProfileInput(value);
  if (!raw) {
    return true;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max;
}

function isValidPassword(value) {
  return normalizeProfileInput(value).length >= 6;
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

function persistEmployeeLocally(employee) {
  if (!employee || !employeeAuthStore?.readEmployees || !employeeAuthStore?.writeEmployees) {
    return employee || null;
  }

  const normalizedId = normalizeProfileInput(employee.id);
  const remainingEmployees = employeeAuthStore
    .readEmployees({ includeAllCompanies: true })
    .filter((record) => normalizeProfileInput(record?.id) !== normalizedId);

  employeeAuthStore.writeEmployees([employee, ...remainingEmployees]);
  return employeeAuthStore.getCurrentEmployee?.() || employee;
}

async function refreshEmployeeFromBackend() {
  if (!activeEmployee?.id || !window.appApiClient?.request) {
    return;
  }

  try {
    const employee = await window.appApiClient.request(
      `/employees/${encodeURIComponent(activeEmployee.id)}`
    );
    activeEmployee = persistEmployeeLocally(employee) || activeEmployee;
    fillProfile(activeEmployee);
  } catch (error) {
    console.error("Unable to refresh employee profile from the backend.", error);
  }
}

async function patchEmployeeProfile(updates, fallbackErrorMessage) {
  if (!activeEmployee) {
    return {
      ok: false,
      error: "Employee session not found.",
    };
  }

  if (window.appApiClient?.request) {
    try {
      const employee = await window.appApiClient.request(
        `/employees/${encodeURIComponent(activeEmployee.id)}`,
        {
          method: "PATCH",
          json: updates || {},
        }
      );

      activeEmployee = persistEmployeeLocally(employee) || employee;
      return {
        ok: true,
        employee: activeEmployee,
      };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || fallbackErrorMessage,
      };
    }
  }

  return employeeAuthStore?.updateEmployee?.(activeEmployee.id, updates) || {
    ok: false,
    error: fallbackErrorMessage,
  };
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
  if (manageProfilePhoneNumber) manageProfilePhoneNumber.value = profile.phoneNumber || "";
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
  saveProfileBtn.addEventListener("click", async () => {
    if (!activeEmployee || !employeeAuthStore) return;

    const name = normalizeProfileInput(manageProfileName?.value);
    const age = normalizeProfileInput(manageProfileAge?.value);
    const phoneNumber = normalizeProfileInput(manageProfilePhoneNumber?.value);

    if (!name) {
      setStatus("Name cannot be blank.", true);
      manageProfileName?.focus?.();
      return;
    }

    if (!isOptionalNumberInRange(age, 18, 99)) {
      setStatus("Age must be between 18 and 99.", true);
      manageProfileAge?.focus?.();
      return;
    }

    if (phoneNumber && !formatIndianPhoneNumber(phoneNumber)) {
      setStatus("Enter a valid Indian phone number.", true);
      manageProfilePhoneNumber?.focus?.();
      return;
    }

    const result = await patchEmployeeProfile(
      {
        name,
        age,
        phoneNumber,
        gender: normalizeProfileInput(manageProfileGender?.value),
      },
      "Unable to save your profile."
    );

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
  updateMeasurementsBtn.addEventListener("click", async () => {
    if (!activeEmployee || !employeeAuthStore) return;

    const heightCm = normalizeProfileInput(manageProfileHeight?.value);
    const weightKg = normalizeProfileInput(manageProfileWeight?.value);

    if (!isOptionalNumberInRange(heightCm, 80, 250)) {
      setStatus("Height must be between 80 and 250 cm.", true);
      manageProfileHeight?.focus?.();
      return;
    }

    if (!isOptionalNumberInRange(weightKg, 20, 300)) {
      setStatus("Weight must be between 20 and 300 kg.", true);
      manageProfileWeight?.focus?.();
      return;
    }

    const result = await patchEmployeeProfile(
      {
      heightCm,
      weightKg,
      },
      "Unable to update your measurements."
    );

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
  changePasswordBtn.addEventListener("click", async () => {
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

    if (!isValidPassword(newPassword)) {
      setStatus("New password must be at least 6 characters long.", true);
      manageProfileNewPassword?.focus?.();
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("New password and confirm password do not match.", true);
      return;
    }

    const result = await patchEmployeeProfile(
      {
      password: newPassword,
      },
      "Unable to change your password."
    );

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
void refreshEmployeeFromBackend();
