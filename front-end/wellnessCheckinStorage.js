(function () {
  const STORAGE_KEY = "stackbuilders.wellnessCheckins.v1";
  const COMPANY_STORAGE_KEY = "stack-builders-companies";
  const employeeAuthStore = window.employeeAuthStore || null;
  const expertAuthStore = window.expertAuthStore || null;
  const hrAuthStore = window.hrAuthStore || null;

  const TRACK_CONFIG = {
    mental: {
      key: "mental",
      label: "Mental Wellness",
      employeeLabel: "Mental Wellness",
      employeeRoute: "Employee_Mental_Wellness.html",
      expertLabel: "Psychologist",
      expertRoute: "Psychologist_Dashboard.html",
      dashboardTitle: "Psychologist Dashboard",
      dashboardSubtitle:
        "Mental wellness check-ins shared by employees appear here for review and follow-up.",
      employeeEyebrow: "Psychologist Review",
      employeeTitle: "Mental Wellness Check-in",
      employeeIntro:
        "Share your stress, sleep, focus, and support needs so your psychologist can review them.",
      schedule:
        "Employees should enter details once each workday, and again after any unusually stressful day or major emotional change.",
      fields: [
        {
          name: "moodScore",
          label: "Mood score",
          inputType: "number",
          min: 1,
          max: 10,
          step: 1,
          placeholder: "1 to 10",
          helper: "1 = very low, 10 = excellent.",
          required: true,
          suffix: "/10",
        },
        {
          name: "stressScore",
          label: "Stress score",
          inputType: "number",
          min: 1,
          max: 10,
          step: 1,
          placeholder: "1 to 10",
          helper: "1 = calm, 10 = extremely stressed.",
          required: true,
          suffix: "/10",
        },
        {
          name: "sleepHours",
          label: "Sleep last night (hours)",
          inputType: "number",
          min: 0,
          max: 16,
          step: 0.5,
          placeholder: "7.5",
          helper: "Add the number of hours you slept.",
          required: true,
          suffix: " hrs",
        },
        {
          name: "focusScore",
          label: "Focus score",
          inputType: "number",
          min: 1,
          max: 10,
          step: 1,
          placeholder: "1 to 10",
          helper: "1 = distracted, 10 = deeply focused.",
          required: true,
          suffix: "/10",
        },
        {
          name: "anxietyTrigger",
          label: "Main stress trigger today",
          inputType: "text",
          placeholder: "Deadlines, conflict, workload, family, etc.",
          helper: "Mention the biggest source of stress or concern.",
          required: true,
        },
        {
          name: "supportNeeded",
          label: "Support needed",
          inputType: "select",
          options: [
            "No immediate support needed",
            "Would like a follow-up this week",
            "Need support as soon as possible",
          ],
          helper: "Tell the psychologist how urgently you want support.",
          required: true,
        },
      ],
    },
    nutrition: {
      key: "nutrition",
      label: "Diet Plan",
      employeeLabel: "Diet Plan",
      employeeRoute: "Employee_Diet_Plan.html",
      expertLabel: "Nutritionist",
      expertRoute: "Nutritionist_Dashboard.html",
      dashboardTitle: "Nutritionist Dashboard",
      dashboardSubtitle:
        "Diet plan and nutrition updates from employees are collected here for meal and hydration follow-up.",
      employeeEyebrow: "Nutrition Review",
      employeeTitle: "Diet Plan Check-in",
      employeeIntro:
        "Share your meal consistency, hydration, energy, and nutrition goals with your nutritionist.",
      schedule:
        "Employees should enter details at the end of the day or at least three times a week after meals.",
      fields: [
        {
          name: "mealConsistency",
          label: "Meal plan consistency",
          inputType: "number",
          min: 1,
          max: 10,
          step: 1,
          placeholder: "1 to 10",
          helper: "1 = fully off plan, 10 = stayed on plan.",
          required: true,
          suffix: "/10",
        },
        {
          name: "waterIntakeLiters",
          label: "Water intake today",
          inputType: "number",
          min: 0,
          max: 10,
          step: 0.1,
          placeholder: "2.5",
          helper: "Add total liters of water consumed.",
          required: true,
          suffix: " L",
        },
        {
          name: "energyScore",
          label: "Energy score",
          inputType: "number",
          min: 1,
          max: 10,
          step: 1,
          placeholder: "1 to 10",
          helper: "1 = very low, 10 = fully energized.",
          required: true,
          suffix: "/10",
        },
        {
          name: "servingsCount",
          label: "Fruit and vegetable servings",
          inputType: "number",
          min: 0,
          max: 20,
          step: 1,
          placeholder: "5",
          helper: "Add total servings for the day.",
          required: true,
          suffix: " servings",
        },
        {
          name: "nutritionGoal",
          label: "Primary nutrition goal",
          inputType: "select",
          options: [
            "Weight management",
            "More energy during work",
            "Better digestion",
            "Muscle gain or recovery",
            "Improve eating consistency",
          ],
          helper: "Choose the goal you are focusing on right now.",
          required: true,
        },
        {
          name: "dietChallenge",
          label: "Biggest diet challenge today",
          inputType: "text",
          placeholder: "Missed breakfast, sugar cravings, late dinner, etc.",
          helper: "Add the main thing that made your diet harder today.",
          required: true,
        },
      ],
    },
    physical: {
      key: "physical",
      label: "Physical Wellness",
      employeeLabel: "Physical Wellness",
      employeeRoute: "Employee_Physical_Wellness.html",
      expertLabel: "Physical Wellness Instructor",
      expertRoute: "Physical_Wellness_Dashboard.html",
      dashboardTitle: "Physical Wellness Instructor Dashboard",
      dashboardSubtitle:
        "Movement, pain, mobility, and recovery updates from employees appear here for coaching and follow-up.",
      employeeEyebrow: "Physical Coach Review",
      employeeTitle: "Physical Wellness Check-in",
      employeeIntro:
        "Share your activity, steps, pain level, mobility, and recovery details with your physical wellness instructor.",
      schedule:
        "Employees should enter details after each workout or at least three times a week.",
      fields: [
        {
          name: "activityMinutes",
          label: "Active minutes today",
          inputType: "number",
          min: 0,
          max: 1440,
          step: 1,
          placeholder: "45",
          helper: "Add total exercise or intentional movement minutes for the day (0 to 1440).",
          required: true,
          suffix: " min",
        },
        {
          name: "stepCount",
          label: "Steps today",
          inputType: "number",
          min: 0,
          max: 100000,
          step: 1,
          placeholder: "8000",
          helper: "Add your step count for the day.",
          required: true,
          suffix: " steps",
        },
        {
          name: "painScore",
          label: "Pain or soreness score",
          inputType: "number",
          min: 1,
          max: 10,
          step: 1,
          placeholder: "1 to 10",
          helper: "1 = none, 10 = severe discomfort.",
          required: true,
          suffix: "/10",
        },
        {
          name: "mobilityScore",
          label: "Mobility score",
          inputType: "number",
          min: 1,
          max: 10,
          step: 1,
          placeholder: "1 to 10",
          helper: "1 = very stiff, 10 = moving freely.",
          required: true,
          suffix: "/10",
        },
        {
          name: "recoveryScore",
          label: "Recovery score",
          inputType: "number",
          min: 1,
          max: 10,
          step: 1,
          placeholder: "1 to 10",
          helper: "1 = exhausted, 10 = fully recovered.",
          required: true,
          suffix: "/10",
        },
        {
          name: "workoutFocus",
          label: "Workout focus",
          inputType: "select",
          options: [
            "Walking or cardio",
            "Strength training",
            "Mobility or stretching",
            "Yoga or mindfulness movement",
            "Recovery day",
          ],
          helper: "Choose the main focus of your movement today.",
          required: true,
        },
      ],
    },
  };

  const FIELD_MAP = {};
  Object.keys(TRACK_CONFIG).forEach((trackKey) => {
    TRACK_CONFIG[trackKey].fields.forEach((field) => {
      FIELD_MAP[field.name] = field;
    });
  });

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeTrackKey(value) {
    const raw = normalizeText(value).toLowerCase();
    if (raw === "diet" || raw === "diet plan" || raw === "dietplan") {
      return "nutrition";
    }

    return raw;
  }

  function normalizeLookupValue(value) {
    return normalizeText(value).toLowerCase();
  }

  function createCompanyContext(companyLike) {
    return {
      companyId: normalizeText(companyLike?.companyId || companyLike?.id),
      companyName: normalizeText(companyLike?.companyName || companyLike?.name),
    };
  }

  function hasCompanyContext(companyContext) {
    return Boolean(
      normalizeText(companyContext?.companyId) || normalizeText(companyContext?.companyName)
    );
  }

  function matchesCompanyContext(record, companyContext) {
    const normalizedContext = createCompanyContext(companyContext);

    if (!hasCompanyContext(normalizedContext)) {
      return true;
    }

    const recordCompanyId = normalizeText(record?.companyId);
    const recordCompanyName = normalizeLookupValue(record?.companyName);

    if (
      normalizedContext.companyId &&
      recordCompanyId &&
      recordCompanyId === normalizedContext.companyId
    ) {
      return true;
    }

    return Boolean(
      normalizedContext.companyName &&
      recordCompanyName &&
      recordCompanyName === normalizeLookupValue(normalizedContext.companyName)
    );
  }

  function readCollection(storageKey) {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function readEmployees() {
    if (employeeAuthStore?.readEmployees) {
      return employeeAuthStore.readEmployees({ includeAllCompanies: true });
    }

    return [];
  }

  function resolveEmployeeRecord(record = {}) {
    const normalizedEmployeeId = normalizeText(record?.employeeId);
    if (!normalizedEmployeeId) {
      return null;
    }

    return (
      readEmployees().find(
        (employee) => normalizeText(employee?.id) === normalizedEmployeeId
      ) || null
    );
  }

  function getFallbackSingleCompanyContext() {
    const companies = readCollection(COMPANY_STORAGE_KEY);
    return companies.length === 1 ? createCompanyContext(companies[0]) : createCompanyContext({});
  }

  function getCurrentCompanyContext() {
    const hrCompanyContext = hrAuthStore?.getCurrentCompanyContext?.() || createCompanyContext({});
    if (hasCompanyContext(hrCompanyContext)) {
      return hrCompanyContext;
    }

    const employeeCompanyContext =
      employeeAuthStore?.getCurrentCompanyContext?.() || createCompanyContext({});
    if (hasCompanyContext(employeeCompanyContext)) {
      return employeeCompanyContext;
    }

    const expertCompanyContext =
      expertAuthStore?.getCurrentCompanyContext?.() || createCompanyContext({});
    if (hasCompanyContext(expertCompanyContext)) {
      return expertCompanyContext;
    }

    return getFallbackSingleCompanyContext();
  }

  function resolveCheckinReadOptions(options = {}) {
    if (options?.includeAllCompanies) {
      return {
        includeAllCompanies: true,
        companyContext: createCompanyContext({}),
      };
    }

    const explicitCompanyContext = createCompanyContext(options);

    return {
      includeAllCompanies: false,
      companyContext: hasCompanyContext(explicitCompanyContext)
        ? explicitCompanyContext
        : getCurrentCompanyContext(),
    };
  }

  function resolveCheckinCompanyContext(record, employeeRecord) {
    const explicitCompanyContext = createCompanyContext(record);
    if (hasCompanyContext(explicitCompanyContext)) {
      return explicitCompanyContext;
    }

    const employeeCompanyContext = createCompanyContext(employeeRecord);
    if (hasCompanyContext(employeeCompanyContext)) {
      return employeeCompanyContext;
    }

    return getFallbackSingleCompanyContext();
  }

  function createCheckinId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `checkin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function getTrackConfig(type) {
    return TRACK_CONFIG[normalizeTrackKey(type)] || null;
  }

  function normalizeFieldValue(fieldName, value) {
    const field = FIELD_MAP[fieldName];
    const raw = normalizeText(value);

    if (!raw) {
      return "";
    }

    if (field?.inputType === "number") {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        return "";
      }

      return String(parsed);
    }

    return raw;
  }

  function formatNumberForMessage(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return "";
    }

    return Number.isInteger(value) ? String(value) : String(value);
  }

  function validateFieldValue(field, value) {
    const raw = normalizeText(value);

    if (!field) {
      return { ok: true, value: raw };
    }

    if (!raw) {
      if (field.required) {
        return {
          ok: false,
          error: `Please complete the ${field.label.toLowerCase()} field before saving.`,
        };
      }

      return { ok: true, value: "" };
    }

    if (field.inputType === "select") {
      const allowedOptions = Array.isArray(field.options) ? field.options : [];
      if (!allowedOptions.includes(raw)) {
        return {
          ok: false,
          error: `Please choose a valid option for ${field.label.toLowerCase()}.`,
        };
      }

      return { ok: true, value: raw };
    }

    if (field.inputType === "number") {
      const parsed = Number(raw);

      if (!Number.isFinite(parsed)) {
        return {
          ok: false,
          error: `${field.label} must be a valid number.`,
        };
      }

      if (typeof field.min === "number" && parsed < field.min) {
        return {
          ok: false,
          error: `${field.label} must be at least ${formatNumberForMessage(field.min)}.`,
        };
      }

      if (typeof field.max === "number" && parsed > field.max) {
        return {
          ok: false,
          error: `${field.label} must be ${formatNumberForMessage(field.max)} or less.`,
        };
      }

      if (typeof field.step === "number" && field.step > 0) {
        const stepBase = typeof field.min === "number" ? field.min : 0;
        const stepDelta = (parsed - stepBase) / field.step;
        if (Math.abs(stepDelta - Math.round(stepDelta)) > 1e-9) {
          return {
            ok: false,
            error: `${field.label} must use increments of ${formatNumberForMessage(field.step)}.`,
          };
        }
      }

      return { ok: true, value: String(parsed) };
    }

    return { ok: true, value: raw };
  }

  function validateCheckinPayload(config, payload) {
    if (!config) {
      return {
        ok: false,
        error: "Unsupported check-in type.",
      };
    }

    for (const field of config.fields) {
      const validation = validateFieldValue(field, payload?.[field.name]);
      if (!validation.ok) {
        return validation;
      }
    }

    return { ok: true };
  }

  function normalizeCheckinRecord(record) {
    const track = normalizeTrackKey(record?.checkinType);
    const submittedAt = normalizeText(record?.submittedAt) || new Date().toISOString();
    const employeeRecord = resolveEmployeeRecord(record || {});
    const companyContext = resolveCheckinCompanyContext(record, employeeRecord);
    const normalizedRecord = {
      id: normalizeText(record?.id) || createCheckinId(),
      checkinType: track,
      employeeId: normalizeText(record?.employeeId),
      employeeName: normalizeText(record?.employeeName) || "Employee",
      employeeEmail: normalizeText(record?.employeeEmail),
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
      notes: normalizeText(record?.notes),
      submittedAt,
    };

    Object.keys(FIELD_MAP).forEach((fieldName) => {
      normalizedRecord[fieldName] = normalizeFieldValue(fieldName, record?.[fieldName]);
    });

    return normalizedRecord;
  }

  function readCheckins(options = {}) {
    const { includeAllCompanies, companyContext } = resolveCheckinReadOptions(options);

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const records = Array.isArray(parsed) ? parsed.map(normalizeCheckinRecord) : [];

      if (includeAllCompanies || !hasCompanyContext(companyContext)) {
        return records;
      }

      return records.filter((record) => matchesCompanyContext(record, companyContext));
    } catch (error) {
      console.error("Unable to read wellness check-ins.", error);
      return [];
    }
  }

  function writeCheckins(records) {
    const normalizedRecords = Array.isArray(records)
      ? records.map(normalizeCheckinRecord)
      : [];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedRecords));
    return normalizedRecords;
  }

  function persistCheckinLocally(record) {
    const nextCheckin = normalizeCheckinRecord(record);
    const records = readCheckins({ includeAllCompanies: true }).filter(
      (existingRecord) => normalizeText(existingRecord.id) !== normalizeText(nextCheckin.id)
    );

    records.unshift(nextCheckin);
    writeCheckins(records);
    return nextCheckin;
  }

  function mergeCompanyScopedCheckinsLocally(records, companyContext) {
    const normalizedCompanyContext = createCompanyContext(companyContext);
    const currentRecords = readCheckins({ includeAllCompanies: true });

    if (!hasCompanyContext(normalizedCompanyContext)) {
      writeCheckins(Array.isArray(records) ? records : []);
      return true;
    }

    const remainingRecords = currentRecords.filter(
      (record) => !matchesCompanyContext(record, normalizedCompanyContext)
    );

    writeCheckins([...(Array.isArray(records) ? records : []), ...remainingRecords]);
    return true;
  }

  function buildCheckinQueryString(companyContext) {
    const normalizedCompanyContext = createCompanyContext(companyContext);
    const params = new URLSearchParams();

    if (normalizedCompanyContext.companyId) {
      params.set("companyId", normalizedCompanyContext.companyId);
    } else if (normalizedCompanyContext.companyName) {
      params.set("companyName", normalizedCompanyContext.companyName);
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  }

  async function syncCheckinsFromBackend(options = {}) {
    if (!window.appApiClient?.request) {
      return {
        ok: false,
        skipped: true,
      };
    }

    const companyContext = createCompanyContext(options);
    const resolvedCompanyContext = hasCompanyContext(companyContext)
      ? companyContext
      : getCurrentCompanyContext();

    try {
      const checkins = await window.appApiClient.request(
        `/wellness-checkins${buildCheckinQueryString(resolvedCompanyContext)}`
      );

      mergeCompanyScopedCheckinsLocally(checkins, resolvedCompanyContext);
      return {
        ok: true,
      };
    } catch (error) {
      console.error("Unable to refresh wellness check-ins from the backend.", error);
      return {
        ok: false,
        error: error?.message || "The latest wellness check-ins could not be loaded right now.",
      };
    }
  }

  function sortByNewest(records) {
    return [...records].sort(
      (left, right) => new Date(right.submittedAt) - new Date(left.submittedAt)
    );
  }

  function getCheckinsByType(type, options = {}) {
    const track = normalizeTrackKey(type);
    const employeeId = normalizeText(options.employeeId);

    return sortByNewest(
      readCheckins(options)
        .filter((record) => normalizeTrackKey(record.checkinType) === track)
        .filter((record) => (employeeId ? normalizeText(record.employeeId) === employeeId : true))
    );
  }

  function getCheckinById(checkinId, options = {}) {
    const normalizedCheckinId = normalizeText(checkinId);
    if (!normalizedCheckinId) {
      return null;
    }

    return (
      readCheckins(options).find(
        (record) => normalizeText(record?.id) === normalizedCheckinId
      ) || null
    );
  }

  function getEmployeeCheckins(options = {}) {
    const employeeId = normalizeText(options.employeeId);
    return sortByNewest(
      readCheckins(options).filter((record) =>
        employeeId ? normalizeText(record.employeeId) === employeeId : true
      )
    );
  }

  function getCurrentEmployeeCheckins(type) {
    const currentEmployee = employeeAuthStore?.getCurrentEmployee?.() || null;
    if (!currentEmployee) {
      return [];
    }

    return getCheckinsByType(type, {
      employeeId: currentEmployee.id,
      companyId: currentEmployee.companyId,
      companyName: currentEmployee.companyName,
    });
  }

  function getCheckinsForExpert(target) {
    const expert =
      target && typeof target === "object"
        ? target
        : expertAuthStore?.getCurrentExpert?.() || null;

    if (!expert) {
      return [];
    }

    const track = expertAuthStore?.getExpertTrack?.(expert);
    if (!track) {
      return [];
    }

    return getCheckinsByType(track, {
      companyId: expert.companyId,
      companyName: expert.companyName,
    });
  }

  function getLatestCheckinsByEmployee(type, options = {}) {
    const grouped = new Map();

    getCheckinsByType(type, options).forEach((record) => {
      const employeeId = normalizeText(record.employeeId) || normalizeText(record.employeeName);
      if (!employeeId || grouped.has(employeeId)) {
        return;
      }

      grouped.set(employeeId, record);
    });

    return Array.from(grouped.values());
  }

  function getLatestCheckinsForExpert(target) {
    const expert =
      target && typeof target === "object"
        ? target
        : expertAuthStore?.getCurrentExpert?.() || null;

    if (!expert) {
      return [];
    }

    const track = expertAuthStore?.getExpertTrack?.(expert);
    if (!track) {
      return [];
    }

    return getLatestCheckinsByEmployee(track, {
      companyId: expert.companyId,
      companyName: expert.companyName,
    });
  }

  async function createCheckin(payload) {
    const currentEmployee = employeeAuthStore?.getCurrentEmployee?.() || null;
    const track = normalizeTrackKey(payload?.checkinType);
    const config = getTrackConfig(track);

    if (!config) {
      return {
        ok: false,
        error: "Unsupported check-in type.",
      };
    }

    if (!currentEmployee) {
      return {
        ok: false,
        error: "Employee session not found.",
      };
    }

    const payloadValidation = validateCheckinPayload(config, payload);
    if (!payloadValidation.ok) {
      return payloadValidation;
    }

    if (window.appApiClient?.request && currentEmployee) {
      try {
        const checkin = await window.appApiClient.request("/wellness-checkins", {
          method: "POST",
          json: {
            ...payload,
            checkinType: track,
            employeeId: normalizeText(payload?.employeeId) || normalizeText(currentEmployee.id),
            employeeName:
              normalizeText(payload?.employeeName) || normalizeText(currentEmployee.name),
            employeeEmail:
              normalizeText(payload?.employeeEmail) || normalizeText(currentEmployee.email),
            companyId: normalizeText(payload?.companyId) || normalizeText(currentEmployee.companyId),
            companyName:
              normalizeText(payload?.companyName) || normalizeText(currentEmployee.companyName),
          },
        });

        persistCheckinLocally(checkin);
        return {
          ok: true,
          checkin,
        };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || "This wellness check-in could not be saved right now.",
        };
      }
    }

    const records = readCheckins({ includeAllCompanies: true });
    const checkin = normalizeCheckinRecord({
      ...payload,
      checkinType: track,
      employeeId: normalizeText(payload?.employeeId) || normalizeText(currentEmployee.id),
      employeeName: normalizeText(payload?.employeeName) || normalizeText(currentEmployee.name),
      employeeEmail:
        normalizeText(payload?.employeeEmail) || normalizeText(currentEmployee.email),
      companyId: normalizeText(payload?.companyId) || normalizeText(currentEmployee.companyId),
      companyName:
        normalizeText(payload?.companyName) || normalizeText(currentEmployee.companyName),
      submittedAt: new Date().toISOString(),
    });

    records.unshift(checkin);
    writeCheckins(records);

    return {
      ok: true,
      checkin,
    };
  }

  function formatDateTime(value) {
    const raw = normalizeText(value);
    if (!raw) {
      return "";
    }

    const parsedDate = new Date(raw);
    if (Number.isNaN(parsedDate.getTime())) {
      return raw;
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatFieldValue(field, value) {
    const raw = normalizeText(value);
    if (!raw) {
      return "--";
    }

    if (field?.suffix) {
      return `${raw}${field.suffix}`;
    }

    return raw;
  }

  function getCheckinUrgency(record) {
    const track = normalizeTrackKey(record?.checkinType);
    const supportNeeded = normalizeText(record?.supportNeeded).toLowerCase();
    const moodScore = Number(record?.moodScore);
    const stressScore = Number(record?.stressScore);
    const sleepHours = Number(record?.sleepHours);
    const mealConsistency = Number(record?.mealConsistency);
    const waterIntakeLiters = Number(record?.waterIntakeLiters);
    const energyScore = Number(record?.energyScore);
    const painScore = Number(record?.painScore);
    const mobilityScore = Number(record?.mobilityScore);
    const recoveryScore = Number(record?.recoveryScore);

    if (track === "mental") {
      if (
        supportNeeded.includes("as soon as possible") ||
        stressScore >= 8 ||
        moodScore <= 3
      ) {
        return {
          level: "high",
          label: "High Priority",
          reason: "Stress is high or urgent support was requested.",
        };
      }

      if (stressScore >= 6 || moodScore <= 5 || sleepHours < 6) {
        return {
          level: "medium",
          label: "Follow-up",
          reason: "Mood, stress, or sleep shows a possible need for follow-up.",
        };
      }
    }

    if (track === "nutrition") {
      if (mealConsistency <= 3 || waterIntakeLiters < 1.2 || energyScore <= 3) {
        return {
          level: "high",
          label: "High Priority",
          reason: "Hydration, energy, or meal consistency is low.",
        };
      }

      if (mealConsistency <= 5 || waterIntakeLiters < 2 || energyScore <= 5) {
        return {
          level: "medium",
          label: "Follow-up",
          reason: "Nutrition habits may need adjustment or coaching.",
        };
      }
    }

    if (track === "physical") {
      if (painScore >= 8 || mobilityScore <= 3 || recoveryScore <= 3) {
        return {
          level: "high",
          label: "High Priority",
          reason: "Pain, mobility, or recovery suggests fast follow-up.",
        };
      }

      if (painScore >= 6 || mobilityScore <= 5 || recoveryScore <= 5) {
        return {
          level: "medium",
          label: "Follow-up",
          reason: "Movement or recovery trends may need coaching.",
        };
      }
    }

    return {
      level: "stable",
      label: "Stable",
      reason: "No immediate concern detected in the latest update.",
    };
  }

  window.wellnessCheckinStore = {
    STORAGE_KEY,
    TRACK_CONFIG,
    FIELD_MAP,
    normalizeTrackKey,
    getTrackConfig,
    validateFieldValue,
    validateCheckinPayload,
    readCheckins,
    writeCheckins,
    syncCheckinsFromBackend,
    createCheckin,
    getCheckinById,
    getEmployeeCheckins,
    getCheckinsByType,
    getCurrentEmployeeCheckins,
    getCheckinsForExpert,
    getLatestCheckinsByEmployee,
    getLatestCheckinsForExpert,
    formatDateTime,
    formatFieldValue,
    getCheckinUrgency,
  };
})();
