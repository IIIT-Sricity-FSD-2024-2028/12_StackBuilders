const employeeAuthStore = window.employeeAuthStore || null;
const checkinResponseStore = window.checkinResponseStore || null;
const rolePermissionsStore = window.rolePermissionsStore || null;
const currentEmployee = employeeAuthStore?.requireEmployeeSession({
  redirectTo: "homepage.html",
});
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
const employeeCheckinWelcomeMessage = document.getElementById(
  "employeeCheckinWelcomeMessage"
);
const profileNavIcon = document.getElementById("profileNavIcon");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");

rolePermissionsStore?.watchPermissions(employeePermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: employeePermissionGroup,
  anyOf: ["client-management-read"],
  title: "Wellness check-ins are disabled",
  message:
    "Ask the admin to enable Company Management read access for employees before opening wellness check-ins.",
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

function createRecentSummary(record) {
  const config = wellnessCheckinStore.getTrackConfig(record.checkinType);
  if (!config) {
    return "Wellness update submitted.";
  }

  const visibleFields = config.fields
    .slice(0, 3)
    .map((field) => {
      const value = record[field.name];
      if (!value) {
        return "";
      }

      return `${field.label}: ${wellnessCheckinStore.formatFieldValue(field, value)}`;
    })
    .filter(Boolean);

  return visibleFields.join(" | ") || `${config.label} update submitted.`;
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

function renderTrackMeta() {
  ["mental", "physical", "nutrition"].forEach((trackKey) => {
    const config = wellnessCheckinStore.getTrackConfig(trackKey);
    const entries = wellnessCheckinStore.getCurrentEmployeeCheckins(trackKey);
    const latestEntry = entries[0] || null;
    const scheduleNode = document.getElementById(`${trackKey}Schedule`);
    const countNode = document.getElementById(`${trackKey}EntriesCount`);
    const lastUpdatedNode = document.getElementById(`${trackKey}LastUpdated`);

    if (scheduleNode) {
      scheduleNode.textContent = config?.schedule || "";
    }

    if (countNode) {
      countNode.textContent = String(entries.length);
    }

    if (lastUpdatedNode) {
      lastUpdatedNode.textContent = latestEntry
        ? wellnessCheckinStore.formatDateTime(latestEntry.submittedAt)
        : "Not submitted yet";
    }
  });
}

function renderRecentCheckins() {
  const container = document.getElementById("employeeRecentCheckins");
  if (!container) {
    return;
  }

  const allEntries = wellnessCheckinStore
    .getEmployeeCheckins({
      employeeId: currentEmployee?.id,
      companyId: currentEmployeeCompanyContext.companyId,
      companyName: currentEmployeeCompanyContext.companyName,
    })
    .slice(0, 6);

  if (!allEntries.length) {
    container.innerHTML = `
      <div class="recent-empty">
        No check-ins submitted yet. Use the cards above to add your first
        mental wellness, physical wellness, or diet plan update.
      </div>
    `;
    return;
  }

  container.innerHTML = allEntries
    .map((record) => {
      const config = wellnessCheckinStore.getTrackConfig(record.checkinType);
      const urgency = wellnessCheckinStore.getCheckinUrgency(record);
      const visibleFields = (config?.fields || [])
        .slice(0, 4)
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
        <article class="recent-card">
          <div class="recent-card-head">
            <div>
              <h3>${escapeHtml(config?.label || "Wellness")}</h3>
              <time>${escapeHtml(
                wellnessCheckinStore.formatDateTime(record.submittedAt)
              )}</time>
            </div>
            <span class="panel-pill">${escapeHtml(urgency.label)}</span>
          </div>
          <p class="recent-summary">${escapeHtml(createRecentSummary(record))}</p>
          <div class="detail-chips">${visibleFields}</div>
          ${buildLatestExpertResponseMarkup(record)}
        </article>
      `;
    })
    .join("");
}

async function syncEmployeeCheckinOverviewFromBackend() {
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
  renderTrackMeta();
  renderRecentCheckins();
}

function openProfileOverlay() {
  if (!profileOverlay) {
    return;
  }

  profileOverlay.hidden = false;
  document.body.classList.add("profile-open");
}

function closeProfileOverlay() {
  if (!profileOverlay) {
    return;
  }

  profileOverlay.hidden = true;
  document.body.classList.remove("profile-open");
}

if (employeeCheckinWelcomeMessage) {
  employeeCheckinWelcomeMessage.textContent = `Welcome back, ${currentEmployeeFirstName}!`;
}

rolePermissionsStore?.setElementHidden(document.querySelector(".track-switcher"), !canReadEmployeeClientFeatures);
rolePermissionsStore?.setElementHidden(document.querySelector(".track-grid"), !canReadEmployeeClientFeatures);

if (profileNavIcon) {
  profileNavIcon.addEventListener("click", openProfileOverlay);
}

if (profileDrawerBackBtn) {
  profileDrawerBackBtn.addEventListener("click", closeProfileOverlay);
}

if (profileOverlay) {
  profileOverlay.addEventListener("click", (event) => {
    if (event.target === profileOverlay) {
      closeProfileOverlay();
    }
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

  renderTrackMeta();
  renderRecentCheckins();
});

renderTrackMeta();
renderRecentCheckins();
void syncEmployeeCheckinOverviewFromBackend();
