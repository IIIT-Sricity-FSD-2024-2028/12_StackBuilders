(function () {
  const EMPLOYEE_STORAGE_KEY = "stackbuilders.hr.employees";
  const EMPLOYEE_SESSION_KEY = "stackbuilders.employeeSession.v1";
  const EXPERT_STORAGE_KEY = "stackbuilders.hr.experts";

  function getSessionStorage() {
    try {
      return window.sessionStorage;
    } catch (error) {
      return null;
    }
  }

  function getLegacySessionStorage() {
    try {
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
  }

  function readStoredExperts() {
    try {
      const raw = window.localStorage.getItem(EXPERT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function findStoredExpertByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;

    return (
      readStoredExperts().find(
        (expert) =>
          normalizeEmail(expert?.email || expert?.username) === normalizedEmail
      ) || null
    );
  }

  function createEmployeeId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `employee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function getInitials(name) {
    const parts = normalizeText(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    if (!parts.length) return "NA";
    return parts.map((part) => part.charAt(0).toUpperCase()).join("");
  }

  function normalizeMetricValue(value) {
    const raw = normalizeText(value);
    if (!raw) return "";

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return "";
    return String(parsed);
  }

  function normalizeEmployeeRecord(record) {
    const createdAt = normalizeText(record?.createdAt) || new Date().toISOString();

    return {
      id: normalizeText(record?.id) || createEmployeeId(),
      name: normalizeText(record?.name) || "Employee User",
      email: normalizeEmail(record?.email || record?.username),
      username: normalizeEmail(record?.username || record?.email),
      password: normalizeText(record?.password),
      department: normalizeText(record?.department) || "General",
      status: normalizeText(record?.status) || "Active",
      age: normalizeText(record?.age),
      gender: normalizeText(record?.gender),
      phoneNumber: normalizeText(record?.phoneNumber || record?.phone),
      companyId: normalizeText(record?.companyId),
      companyName: normalizeText(record?.companyName),
      heightCm: normalizeMetricValue(record?.heightCm || record?.height),
      weightKg: normalizeMetricValue(record?.weightKg || record?.weight),
      createdAt,
      updatedAt: normalizeText(record?.updatedAt) || createdAt,
    };
  }

  function readEmployees() {
    try {
      const raw = window.localStorage.getItem(EMPLOYEE_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      return Array.isArray(parsed) ? parsed.map(normalizeEmployeeRecord) : [];
    } catch (error) {
      console.error("Unable to read employee records.", error);
      return [];
    }
  }

  function writeEmployees(records) {
    const normalizedRecords = Array.isArray(records)
      ? records.map(normalizeEmployeeRecord)
      : [];

    window.localStorage.setItem(
      EMPLOYEE_STORAGE_KEY,
      JSON.stringify(normalizedRecords)
    );

    return normalizedRecords;
  }

  function findEmployeeByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;

    return (
      readEmployees().find(
        (employee) => normalizeEmail(employee.email) === normalizedEmail
      ) || null
    );
  }

  function createEmployee(payload) {
    const name = normalizeText(payload?.name);
    const department = normalizeText(payload?.department);
    const email = normalizeEmail(payload?.email);
    const password = normalizeText(payload?.password);

    if (!name || !department || !email || !password) {
      return {
        ok: false,
        error: "Please complete all employee fields before saving.",
      };
    }

    if (findStoredExpertByEmail(email)) {
      return {
        ok: false,
        error: "That email address is already assigned to a wellness expert account.",
      };
    }

    const existingEmployee = findEmployeeByEmail(email);

    if (existingEmployee) {
      if (!existingEmployee.password) {
        return updateEmployee(existingEmployee.id, {
          name,
          department,
          email,
          password,
          status: normalizeText(payload?.status) || existingEmployee.status || "Active",
        });
      }

      return {
        ok: false,
        error: "An employee with that email already exists.",
      };
    }

    const now = new Date().toISOString();
    const employee = normalizeEmployeeRecord({
      ...payload,
      id: createEmployeeId(),
      name,
      department,
      email,
      username: email,
      password,
      status: normalizeText(payload?.status) || "Active",
      createdAt: now,
      updatedAt: now,
    });

    const employees = readEmployees();
    employees.unshift(employee);
    writeEmployees(employees);

    return { ok: true, employee };
  }

  function updateEmployee(employeeId, updates) {
    const normalizedId = normalizeText(employeeId);
    if (!normalizedId) {
      return { ok: false, error: "Employee not found." };
    }

    const employees = readEmployees();
    const existingEmployee = employees.find((employee) => employee.id === normalizedId);

    if (!existingEmployee) {
      return { ok: false, error: "Employee not found." };
    }

    const nextEmail = updates && Object.prototype.hasOwnProperty.call(updates, "email")
      ? normalizeEmail(updates.email)
      : existingEmployee.email;

    if (
      nextEmail &&
      employees.some(
        (employee) =>
          employee.id !== normalizedId &&
          normalizeEmail(employee.email) === nextEmail
      )
    ) {
      return {
        ok: false,
        error: "Another employee already uses that email address.",
      };
    }

    if (nextEmail && findStoredExpertByEmail(nextEmail)) {
      return {
        ok: false,
        error: "That email address is already assigned to a wellness expert account.",
      };
    }

    const mergedEmployee = normalizeEmployeeRecord({
      ...existingEmployee,
      ...updates,
      id: existingEmployee.id,
      createdAt: existingEmployee.createdAt,
      updatedAt: new Date().toISOString(),
      email: nextEmail,
      username: nextEmail || existingEmployee.username,
      password:
        updates && Object.prototype.hasOwnProperty.call(updates, "password")
          ? normalizeText(updates.password)
          : existingEmployee.password,
    });

    const nextEmployees = employees.map((employee) =>
      employee.id === normalizedId ? mergedEmployee : employee
    );

    writeEmployees(nextEmployees);
    return { ok: true, employee: mergedEmployee };
  }

  function deleteEmployee(employeeId) {
    const normalizedId = normalizeText(employeeId);
    const nextEmployees = readEmployees().filter(
      (employee) => employee.id !== normalizedId
    );

    writeEmployees(nextEmployees);

    const currentEmployee = getCurrentEmployee();
    if (currentEmployee && currentEmployee.id === normalizedId) {
      clearCurrentEmployeeSession();
    }

    return nextEmployees;
  }

  function readCurrentEmployeeSession() {
    try {
      const sessionStorage = getSessionStorage();
      const legacyStorage = getLegacySessionStorage();
      const raw = sessionStorage?.getItem(EMPLOYEE_SESSION_KEY);

      if (!raw) {
        const legacyRaw = legacyStorage?.getItem(EMPLOYEE_SESSION_KEY);
        if (!legacyRaw) return null;

        sessionStorage?.setItem(EMPLOYEE_SESSION_KEY, legacyRaw);
        legacyStorage?.removeItem(EMPLOYEE_SESSION_KEY);

        const parsedLegacy = JSON.parse(legacyRaw);
        if (!parsedLegacy || typeof parsedLegacy !== "object") return null;

        return {
          employeeId: normalizeText(parsedLegacy.employeeId),
        };
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;

      return {
        employeeId: normalizeText(parsed.employeeId),
      };
    } catch (error) {
      return null;
    }
  }

  function setCurrentEmployeeSession(employeeId) {
    const normalizedId = normalizeText(employeeId);
    if (!normalizedId) {
      clearCurrentEmployeeSession();
      return null;
    }

    const employee = readEmployees().find((item) => item.id === normalizedId) || null;
    if (!employee) {
      clearCurrentEmployeeSession();
      return null;
    }

    getSessionStorage()?.setItem(
      EMPLOYEE_SESSION_KEY,
      JSON.stringify({ employeeId: normalizedId })
    );
    getLegacySessionStorage()?.removeItem(EMPLOYEE_SESSION_KEY);

    return employee;
  }

  function clearCurrentEmployeeSession() {
    getSessionStorage()?.removeItem(EMPLOYEE_SESSION_KEY);
    getLegacySessionStorage()?.removeItem(EMPLOYEE_SESSION_KEY);
  }

  function getCurrentEmployee() {
    const session = readCurrentEmployeeSession();
    if (!session?.employeeId) return null;

    const employee =
      readEmployees().find((item) => item.id === session.employeeId) || null;

    if (!employee) {
      clearCurrentEmployeeSession();
      return null;
    }

    return employee;
  }

  function authenticateEmployee(username, password) {
    const normalizedUsername = normalizeEmail(username);
    const normalizedPassword = normalizeText(password);
    const employee = findEmployeeByEmail(normalizedUsername);

    if (!employee || employee.password !== normalizedPassword) {
      return {
        ok: false,
        error: "Invalid credentials. Please check your username and password.",
      };
    }

    if (normalizeText(employee.status).toLowerCase() !== "active") {
      return {
        ok: false,
        error: "This employee account is inactive.",
      };
    }

    setCurrentEmployeeSession(employee.id);
    return { ok: true, employee };
  }

  function requireEmployeeSession(options = {}) {
    const redirectTo = normalizeText(options.redirectTo);
    const employee = getCurrentEmployee();

    if (!employee && redirectTo) {
      window.location.replace(redirectTo);
    }

    return employee;
  }

  function getEmployeeScopedStorageKey(baseKey, employeeId) {
    const resolvedId =
      normalizeText(employeeId) || normalizeText(getCurrentEmployee()?.id) || "guest";
    return `${baseKey}.${resolvedId}`;
  }

  function computeBmi(heightCm, weightKg) {
    const heightValue = Number(heightCm);
    const weightValue = Number(weightKg);

    if (!Number.isFinite(heightValue) || !Number.isFinite(weightValue) || heightValue <= 0 || weightValue <= 0) {
      return {
        value: "--",
        status: "Not Available",
        message: "Add your height and weight to calculate your BMI.",
      };
    }

    const heightMeters = heightValue / 100;
    const bmi = weightValue / (heightMeters * heightMeters);
    const roundedValue = bmi.toFixed(1);

    if (bmi < 18.5) {
      return {
        value: roundedValue,
        status: "Underweight",
        message: "Your BMI is below the healthy range. Consider reviewing your nutrition plan.",
      };
    }

    if (bmi < 25) {
      return {
        value: roundedValue,
        status: "Normal Range",
        message: "Your BMI is in the healthy range. Keep up the good work!",
      };
    }

    if (bmi < 30) {
      return {
        value: roundedValue,
        status: "Overweight",
        message: "Your BMI is above the healthy range. Small routine changes can help improve it.",
      };
    }

    return {
      value: roundedValue,
      status: "Obese",
      message: "Your BMI is high. Consider discussing a wellness plan with an expert.",
    };
  }

  function getEmployeeProfile(target) {
    const employee =
      typeof target === "string"
        ? readEmployees().find((item) => item.id === normalizeText(target)) || null
        : target && typeof target === "object"
          ? normalizeEmployeeRecord(target)
          : getCurrentEmployee();

    if (!employee) return null;

    const bmi = computeBmi(employee.heightCm, employee.weightKg);
    const firstName = normalizeText(employee.name).split(/\s+/)[0] || employee.name;

    return {
      ...employee,
      firstName,
      initials: getInitials(employee.name),
      ageLabel: employee.age ? `${employee.age} years` : "Not added",
      genderLabel: employee.gender || "Not added",
      phoneLabel: employee.phoneNumber || "Not added",
      heightLabel: employee.heightCm || "--",
      weightLabel: employee.weightKg || "--",
      bmi,
    };
  }

  window.employeeAuthStore = {
    EMPLOYEE_STORAGE_KEY,
    EMPLOYEE_SESSION_KEY,
    normalizeEmail,
    getInitials,
    readEmployees,
    writeEmployees,
    findEmployeeByEmail,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    authenticateEmployee,
    readCurrentEmployeeSession,
    setCurrentEmployeeSession,
    clearCurrentEmployeeSession,
    getCurrentEmployee,
    requireEmployeeSession,
    getEmployeeScopedStorageKey,
    getEmployeeProfile,
  };
})();
