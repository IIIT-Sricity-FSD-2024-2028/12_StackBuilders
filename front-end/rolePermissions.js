(function () {
  const STORAGE_PREFIX = "stack-builders-permissions-";
  const STYLE_ID = "stackbuilders-role-permissions-style";

  const DEFAULT_PERMISSIONS = {
    hr: {
      "user-management-create": true,
      "user-management-read": true,
      "user-management-update": true,
      "user-management-delete": true,
      "client-management-create": true,
      "client-management-read": true,
      "client-management-update": true,
      "client-management-delete": true,
      "reports-create": true,
      "reports-read": true,
      "reports-update": true,
      "reports-delete": true,
      "challenge-management-create": true,
      "challenge-management-read": true,
      "challenge-management-update": true,
      "challenge-management-delete": true,
    },
    employee: {
      "user-management-create": true,
      "user-management-read": true,
      "user-management-update": true,
      "user-management-delete": true,
      "client-management-create": true,
      "client-management-read": true,
      "client-management-update": true,
      "client-management-delete": true,
      "reports-create": true,
      "reports-read": true,
      "reports-update": true,
      "reports-delete": true,
      "challenge-management-create": true,
      "challenge-management-read": true,
      "challenge-management-update": true,
      "challenge-management-delete": true,
    },
    "wellness-expert": {
      "user-management-create": true,
      "user-management-read": true,
      "user-management-update": true,
      "user-management-delete": true,
      "client-management-create": true,
      "client-management-read": true,
      "client-management-update": true,
      "client-management-delete": true,
      "reports-create": true,
      "reports-read": true,
      "reports-update": true,
      "reports-delete": true,
      "challenge-management-create": true,
      "challenge-management-read": true,
      "challenge-management-update": true,
      "challenge-management-delete": true,
    },
  };

  const GROUP_ALIASES = {
    hr: "hr",
    employee: "employee",
    user: "employee",
    expert: "wellness-expert",
    wellness: "wellness-expert",
    "wellness expert": "wellness-expert",
    "wellness-expert": "wellness-expert",
  };

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeGroup(group) {
    return GROUP_ALIASES[normalizeText(group)] || normalizeText(group);
  }

  function getStorageKey(group) {
    return `${STORAGE_PREFIX}${normalizeGroup(group)}`;
  }

  function getDefaultPermissions(group) {
    return { ...(DEFAULT_PERMISSIONS[normalizeGroup(group)] || {}) };
  }

  function normalizePermissionMap(group, source) {
    const defaults = getDefaultPermissions(group);
    const permissions = { ...defaults };

    if (!source || typeof source !== "object") {
      return permissions;
    }

    Object.keys(defaults).forEach((permissionKey) => {
      if (Object.prototype.hasOwnProperty.call(source, permissionKey)) {
        permissions[permissionKey] = Boolean(source[permissionKey]);
      }
    });

    return permissions;
  }

  function readStoredPermissionOverrides(group) {
    const storageKey = getStorageKey(group);

    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch (error) {
      return {};
    }
  }

  function arePermissionMapsEqual(left, right) {
    const leftKeys = Object.keys(left || {});
    const rightKeys = Object.keys(right || {});

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every((key) => Boolean(left[key]) === Boolean(right[key]));
  }

  function writePermissions(group, permissions) {
    const normalizedPermissions = normalizePermissionMap(group, permissions);

    try {
      window.localStorage.setItem(
        getStorageKey(group),
        JSON.stringify(normalizedPermissions)
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  function readPermissions(group) {
    return normalizePermissionMap(group, readStoredPermissionOverrides(group));
  }

  async function syncPermissionsFromBackend(group) {
    const normalizedGroup = normalizeGroup(group);
    if (!normalizedGroup || !window.appApiClient?.request) {
      return {
        ok: false,
        skipped: true,
      };
    }

    try {
      const payload = await window.appApiClient.request(
        `/role-permissions/${encodeURIComponent(normalizedGroup)}`
      );
      const nextPermissions = normalizePermissionMap(
        normalizedGroup,
        payload?.permissions
      );
      const currentPermissions = readPermissions(normalizedGroup);
      const changed = !arePermissionMapsEqual(currentPermissions, nextPermissions);

      if (changed && !writePermissions(normalizedGroup, nextPermissions)) {
        return {
          ok: false,
          error: "Permissions could not be cached in this browser.",
        };
      }

      return {
        ok: true,
        changed,
        permissions: nextPermissions,
      };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || "Permissions could not be loaded right now.",
      };
    }
  }

  function hasPermission(group, permissionKey) {
    const permissions = readPermissions(group);
    return Boolean(permissions[permissionKey]);
  }

  function hasAnyPermission(group, permissionKeys) {
    return (Array.isArray(permissionKeys) ? permissionKeys : [permissionKeys]).some((permissionKey) =>
      hasPermission(group, permissionKey)
    );
  }

  function hasAllPermissions(group, permissionKeys) {
    return (Array.isArray(permissionKeys) ? permissionKeys : [permissionKeys]).every((permissionKey) =>
      hasPermission(group, permissionKey)
    );
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .permission-disabled {
        opacity: 0.55 !important;
        cursor: not-allowed !important;
        pointer-events: none !important;
      }

      .role-access-shell {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 20px;
        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      }

      .role-access-card {
        width: min(560px, 100%);
        padding: 32px 28px;
        border-radius: 24px;
        background: #ffffff;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.14);
        text-align: center;
        font-family: "DM Sans", Arial, sans-serif;
      }

      .role-access-card h1 {
        margin: 0 0 12px;
        color: #0f172a;
        font-size: 2rem;
        line-height: 1.15;
      }

      .role-access-card p {
        margin: 0;
        color: #475569;
        font-size: 1rem;
        line-height: 1.6;
      }

      .role-access-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 56px;
        height: 56px;
        margin-bottom: 18px;
        border-radius: 18px;
        background: #eff6ff;
        color: #2563eb;
        font-size: 1.35rem;
      }

      .role-inline-notice {
        padding: 16px 18px;
        border: 1px dashed rgba(37, 99, 235, 0.28);
        border-radius: 18px;
        background: rgba(239, 246, 255, 0.88);
        color: #1e3a8a;
        font-weight: 600;
        line-height: 1.5;
      }
    `;

    document.head.appendChild(style);
  }

  function setElementHidden(element, shouldHide) {
    if (!element) {
      return null;
    }

    element.hidden = Boolean(shouldHide);

    if (shouldHide) {
      element.setAttribute("aria-hidden", "true");
    } else {
      element.removeAttribute("aria-hidden");
    }

    return element;
  }

  function disableElement(element, reason = "") {
    if (!element) {
      return null;
    }

    element.classList.add("permission-disabled");
    element.setAttribute("aria-disabled", "true");

    if ("disabled" in element) {
      element.disabled = true;
    }

    if (reason) {
      element.setAttribute("title", reason);
    }

    return element;
  }

  function restrictElement(element, allowed, options = {}) {
    if (!element || allowed) {
      return element || null;
    }

    const mode = options.mode || "hide";
    const reason = options.reason || "";

    if (mode === "disable") {
      return disableElement(element, reason);
    }

    if (mode === "remove") {
      element.remove();
      return null;
    }

    return setElementHidden(element, true);
  }

  function renderInlineNotice(container, message) {
    if (!container) {
      return null;
    }

    ensureStyles();
    container.innerHTML = "";

    const notice = document.createElement("div");
    notice.className = "role-inline-notice";
    notice.textContent = message;
    container.appendChild(notice);
    return notice;
  }

  function resolveTarget(target) {
    if (!target) {
      return document.body;
    }

    if (typeof target === "string") {
      return document.querySelector(target) || document.body;
    }

    return target;
  }

  function renderAccessDenied(options = {}) {
    ensureStyles();

    const target = resolveTarget(options.target);
    const title = options.title || "Access Restricted";
    const message =
      options.message || "This page is currently unavailable for your role.";
    const wrapper = document.createElement("div");

    wrapper.className = "role-access-shell";
    wrapper.innerHTML = `
      <div class="role-access-card">
        <div class="role-access-chip">
          <i class="fa-solid fa-lock"></i>
        </div>
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    `;

    if (target === document.body) {
      document.body.innerHTML = "";
      document.body.appendChild(wrapper);
      document.body.className = "";
    } else {
      target.innerHTML = "";
      target.appendChild(wrapper);
    }

    return wrapper;
  }

  function guardPageAccess(options = {}) {
    const group = options.group;
    let allowed = true;

    if (Array.isArray(options.allOf) && options.allOf.length) {
      allowed = hasAllPermissions(group, options.allOf);
    }

    if (allowed && Array.isArray(options.anyOf) && options.anyOf.length) {
      allowed = hasAnyPermission(group, options.anyOf);
    }

    if (!allowed) {
      renderAccessDenied(options);
    }

    return allowed;
  }

  function watchPermissions(group, callback) {
    const storageKey = getStorageKey(group);

    window.addEventListener("storage", (event) => {
      if (event.key !== storageKey) {
        return;
      }

      if (typeof callback === "function") {
        callback(readPermissions(group), event);
        return;
      }

      window.location.reload();
    });

    void syncPermissionsFromBackend(group).then((result) => {
      if (!result?.ok || !result.changed) {
        return;
      }

      if (typeof callback === "function") {
        callback(readPermissions(group));
        return;
      }

      window.location.reload();
    });
  }

  window.rolePermissionsStore = {
    STORAGE_PREFIX,
    DEFAULT_PERMISSIONS,
    normalizeGroup,
    getStorageKey,
    getDefaultPermissions,
    readPermissions,
    writePermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    syncPermissionsFromBackend,
    setElementHidden,
    disableElement,
    restrictElement,
    renderInlineNotice,
    renderAccessDenied,
    guardPageAccess,
    watchPermissions,
  };
})();
