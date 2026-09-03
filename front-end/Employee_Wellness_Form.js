const employeeAuthStore = window.employeeAuthStore || null;
const checkinResponseStore = window.checkinResponseStore || null;
const rolePermissionsStore = window.rolePermissionsStore || null;
const currentEmployee = employeeAuthStore?.requireEmployeeSession({
  redirectTo: "homepage.html",
});
const formTrack = document.body.dataset.checkinType || "";
const trackConfig = wellnessCheckinStore.getTrackConfig(formTrack);
const currentEmployeeName = currentEmployee?.name || "Employee";
const currentEmployeeFirstName =
  currentEmployeeName.split(/\s+/).filter(Boolean)[0] || currentEmployeeName;
const currentEmployeeCompanyContext = {
  companyId: String(currentEmployee?.companyId || "").trim(),
  companyName: String(currentEmployee?.companyName || "").trim(),
};
const employeePermissionGroup = "employee";
const canReadEmployeeClientFeatures =
  rolePermissionsStore?.hasPermission(employeePermissionGroup, "client-management-read") ?? true;
const canUpdateEmployeeClientFeatures =
  rolePermissionsStore?.hasPermission(employeePermissionGroup, "client-management-update") ?? true;

const employeeWellnessWelcomeMessage = document.getElementById(
  "employeeWellnessWelcomeMessage"
);
const wellnessFormEyebrow = document.getElementById("wellnessFormEyebrow");
const wellnessFormTitle = document.getElementById("wellnessFormTitle");
const wellnessFormIntro = document.getElementById("wellnessFormIntro");
const wellnessFormSchedule = document.getElementById("wellnessFormSchedule");
const wellnessCheckinFields = document.getElementById("wellnessCheckinFields");
const wellnessCheckinForm = document.getElementById("wellnessCheckinForm");
const wellnessFormStatus = document.getElementById("wellnessFormStatus");
const employeeTrackHistory = document.getElementById("employeeTrackHistory");
const wellnessCheckinSubmitBtn =
  wellnessCheckinForm?.querySelector('button[type="submit"]') || null;

rolePermissionsStore?.watchPermissions(employeePermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: employeePermissionGroup,
  anyOf: ["client-management-read"],
  title: "Wellness check-in access is disabled",
  message:
    "Ask the admin to enable Company Management read access for employees before opening this page.",
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character] || character;
  });
}

function setStatus(message, options = {}) {
  if (!wellnessFormStatus) {
    return;
  }

  wellnessFormStatus.hidden = !message;
  wellnessFormStatus.textContent = message || "";
  wellnessFormStatus.classList.toggle("error", Boolean(options.isError));
}

function getFieldElement(fieldName) {
  return wellnessCheckinForm?.elements?.namedItem?.(fieldName) || null;
}

function clearFieldValidation(fieldName) {
  const fieldElement = getFieldElement(fieldName);
  if (!fieldElement || typeof fieldElement.setCustomValidity !== "function") {
    return;
  }

  fieldElement.setCustomValidity("");
}

function applyFieldValidation(field, value) {
  const fieldElement = getFieldElement(field.name);
  const validation = wellnessCheckinStore.validateFieldValue(field, value);

  if (
    fieldElement &&
    typeof fieldElement.setCustomValidity === "function"
  ) {
    fieldElement.setCustomValidity(validation.ok ? "" : validation.error || "Invalid value.");
  }

  return validation;
}

function buildFieldMarkup(field) {
  const helperMarkup = field.helper
    ? `<small class="field-helper">${escapeHtml(field.helper)}</small>`
    : "";

  if (field.inputType === "select") {
    return `
      <label class="form-field">
        <span>${escapeHtml(field.label)}</span>
        <select name="${escapeHtml(field.name)}" ${field.required ? "required" : ""}>
          <option value="">Select an option</option>
          ${field.options
            .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
            .join("")}
        </select>
        ${helperMarkup}
      </label>
    `;
  }

  return `
    <label class="form-field">
      <span>${escapeHtml(field.label)}</span>
      <input
        type="${escapeHtml(field.inputType || "text")}"
        name="${escapeHtml(field.name)}"
        placeholder="${escapeHtml(field.placeholder || "")}"
        ${field.min !== undefined ? `min="${escapeHtml(field.min)}"` : ""}
        ${field.max !== undefined ? `max="${escapeHtml(field.max)}"` : ""}
        ${field.step !== undefined ? `step="${escapeHtml(field.step)}"` : ""}
        ${field.required ? "required" : ""}
      />
      ${helperMarkup}
    </label>
  `;
}

function buildHistorySummary(record) {
  return trackConfig.fields
    .slice(0, 3)
    .map((field) => {
      if (!record[field.name]) {
        return "";
      }

      return `${field.label}: ${wellnessCheckinStore.formatFieldValue(field, record[field.name])}`;
    })
    .filter(Boolean)
    .join(" | ");
}

function buildLatestExpertResponseMarkup(record) {
  const response =
    checkinResponseStore?.getLatestResponseByCheckinId?.(
      record.id,
      currentEmployeeCompanyContext
    ) || null;
  if (!response) {
    return "";
  }

  return `
    <div class="expert-response-box">
      <div class="expert-response-head">
        <strong>${escapeHtml(response.expertName)}</strong>
        <span>${escapeHtml(
          wellnessCheckinStore.formatDateTime(response.createdAt)
        )}</span>
      </div>
      <p>${escapeHtml(response.message)}</p>
    </div>
  `;
}

function renderTrackHistory() {
  if (!employeeTrackHistory || !trackConfig) {
    return;
  }

  const entries = wellnessCheckinStore.getCurrentEmployeeCheckins(trackConfig.key);

  if (!entries.length) {
    employeeTrackHistory.innerHTML = `
      <div class="history-empty">
        No ${escapeHtml(trackConfig.label.toLowerCase())} updates submitted yet.
        Save your first check-in to start building a history your
        ${escapeHtml(trackConfig.expertLabel.toLowerCase())} can review.
      </div>
    `;
    return;
  }

  employeeTrackHistory.innerHTML = entries
    .slice(0, 5)
    .map((record) => {
      const urgency = wellnessCheckinStore.getCheckinUrgency(record);
      const detailChips = trackConfig.fields
        .map((field) => {
          const value = record[field.name];
          if (!value) {
            return "";
          }

          return `<span class="detail-chip">${escapeHtml(field.label)}: ${escapeHtml(
            wellnessCheckinStore.formatFieldValue(field, value)
          )}</span>`;
        })
        .filter(Boolean)
        .join("");

      return `
        <article class="history-card">
          <div class="history-head">
            <div>
              <h3>${escapeHtml(trackConfig.label)}</h3>
              <time>${escapeHtml(
                wellnessCheckinStore.formatDateTime(record.submittedAt)
              )}</time>
            </div>
            <span class="secondary-btn">${escapeHtml(urgency.label)}</span>
          </div>
          <p>${escapeHtml(buildHistorySummary(record))}</p>
          <div class="detail-chips">${detailChips}</div>
          ${buildLatestExpertResponseMarkup(record)}
        </article>
      `;
    })
    .join("");
}

async function syncEmployeeTrackDataFromBackend() {
  const tasks = [];

  if (wellnessCheckinStore?.syncCheckinsFromBackend) {
    tasks.push(wellnessCheckinStore.syncCheckinsFromBackend(currentEmployeeCompanyContext));
  }

  if (checkinResponseStore?.syncResponsesFromBackend) {
    tasks.push(checkinResponseStore.syncResponsesFromBackend(currentEmployeeCompanyContext));
  }

  if (!tasks.length) {
    return;
  }

  await Promise.allSettled(tasks);
  renderTrackHistory();
}

if (!trackConfig) {
  window.location.replace("Employee_Wellness_Checkins.html");
}

if (employeeWellnessWelcomeMessage) {
  employeeWellnessWelcomeMessage.textContent = `Welcome back, ${currentEmployeeFirstName}!`;
}

if (wellnessFormEyebrow) {
  wellnessFormEyebrow.textContent = trackConfig.employeeEyebrow;
}

if (wellnessFormTitle) {
  wellnessFormTitle.textContent = trackConfig.employeeTitle;
}

if (wellnessFormIntro) {
  wellnessFormIntro.textContent = trackConfig.employeeIntro;
}

if (wellnessFormSchedule) {
  wellnessFormSchedule.textContent = trackConfig.schedule;
}

if (wellnessCheckinFields) {
  wellnessCheckinFields.innerHTML = trackConfig.fields.map(buildFieldMarkup).join("");
}

if (!canReadEmployeeClientFeatures) {
  rolePermissionsStore?.setElementHidden(wellnessCheckinForm, true);
}

if (!canUpdateEmployeeClientFeatures && wellnessCheckinSubmitBtn) {
  rolePermissionsStore?.disableElement(
    wellnessCheckinSubmitBtn,
    "Employee update access is disabled for wellness check-ins."
  );
}

trackConfig?.fields?.forEach((field) => {
  const fieldElement = getFieldElement(field.name);
  if (!fieldElement) {
    return;
  }

  const validateCurrentField = () => {
    applyFieldValidation(field, fieldElement.value);
  };

  fieldElement.addEventListener("input", validateCurrentField);
  fieldElement.addEventListener("change", validateCurrentField);
});

if (wellnessCheckinForm) {
  wellnessCheckinForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    if (!canUpdateEmployeeClientFeatures) {
      setStatus("Employee update access is disabled for wellness check-ins.", {
        isError: true,
      });
      return;
    }

    const formData = new FormData(wellnessCheckinForm);
    const payload = {
      checkinType: trackConfig.key,
      notes: String(formData.get("notes") || "").trim(),
    };

    trackConfig.fields.forEach((field) => {
      payload[field.name] = String(formData.get(field.name) || "").trim();
    });

    for (const field of trackConfig.fields) {
      const validation = applyFieldValidation(field, payload[field.name]);
      if (!validation.ok) {
        const fieldElement = getFieldElement(field.name);
        fieldElement?.reportValidity?.();
        setStatus(validation.error || "Please correct the invalid field values.", {
          isError: true,
        });
        return;
      }
    }

    const result = await Promise.resolve(wellnessCheckinStore.createCheckin(payload));
    if (!result?.ok) {
      setStatus(
        result?.error || "This wellness check-in could not be saved right now.",
        { isError: true }
      );
      return;
    }

    setStatus(
      `${trackConfig.label} details saved successfully. Your ${trackConfig.expertLabel.toLowerCase()} can now review this update.`,
      { isError: false }
    );
    wellnessCheckinForm.reset();
    trackConfig.fields.forEach((field) => clearFieldValidation(field.name));
    renderTrackHistory();
  });
}

window.addEventListener("storage", (event) => {
  if (
    event.key &&
    event.key !== wellnessCheckinStore.STORAGE_KEY &&
    event.key !== checkinResponseStore?.STORAGE_KEY
  ) {
    return;
  }

  renderTrackHistory();
});

renderTrackHistory();
void syncEmployeeTrackDataFromBackend();
