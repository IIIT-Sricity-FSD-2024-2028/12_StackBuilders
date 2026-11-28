import * as XLSX from "xlsx";
import { getAuthSession } from "../homepage/authService.js";

export function getHrCompanyContext(profile = null) {
  const source = profile || {};
  return {
    hrName: String(source.name || source.username || "").trim(),
    companyId: String(source.companyId || "").trim(),
    companyName: String(source.companyName || "").trim(),
  };
}

export function hasHrCompanyContext(context) {
  return Boolean(context?.companyId && context?.companyName);
}

export function getCurrentHrCompanyContext() {
  return getHrCompanyContext(getAuthSession()?.profile || null);
}

export function requireHrCompanyContext(profile) {
  const context =
    profile === undefined ? getCurrentHrCompanyContext() : getHrCompanyContext(profile);
  return hasHrCompanyContext(context) ? context : null;
}

export function isSameHrCompany(record, company) {
  const recordCompanyId = String(record?.companyId || "").trim();
  const companyId = String(company?.companyId || "").trim();
  if (companyId && recordCompanyId) return recordCompanyId === companyId;
  const companyName = String(company?.companyName || "").trim().toLowerCase();
  return Boolean(
    companyName &&
      String(record?.companyName || "").trim().toLowerCase() === companyName,
  );
}

export function findActiveCompanySubscription(subscriptions, company) {
  return (subscriptions || []).find(
    (item) =>
      String(item?.status || "").trim().toLowerCase() === "active" &&
      isSameHrCompany(item, company),
  );
}

export function filterHrRecords(records, searchTerm, fields) {
  const query = String(searchTerm || "").trim().toLowerCase();
  if (!query) return records;

  return (records || []).filter((record) =>
    fields.some((field) =>
      String(record[field] || "")
        .toLowerCase()
        .includes(query),
    ),
  );
}

export function buildCompanyQuery(context) {
  const params = new URLSearchParams();
  if (context?.companyId) params.set("companyId", context.companyId);
  else if (context?.companyName) params.set("companyName", context.companyName);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function normalizeColumn(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[()[\]{}:]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function valueForAliases(row, aliases) {
  const values = new Map(
    Object.entries(row || []).map(([key, value]) => [normalizeColumn(key), String(value ?? "").trim()]),
  );
  for (const alias of aliases) {
    const value = values.get(normalizeColumn(alias));
    if (value) return value;
  }
  return "";
}

export function normalizeImportedEmployee(row) {
  return {
    name: valueForAliases(row, ["employee name", "name", "employee"]),
    department: valueForAliases(row, ["department", "dept", "team"]),
    email: valueForAliases(row, ["gmail address", "email", "employee email", "gmail", "mail"]),
    password: valueForAliases(row, ["password", "temporary password", "login password"]),
    age: valueForAliases(row, ["age"]),
    gender: valueForAliases(row, ["gender"]),
    phoneNumber: valueForAliases(row, ["phone number", "phone", "mobile", "mobile number"]),
    heightCm: valueForAliases(row, ["height cm", "height", "height cm value"]),
    weightKg: valueForAliases(row, ["weight kg", "weight", "weight kg value"]),
    status: valueForAliases(row, ["status"]),
  };
}

export function normalizeImportedExpert(row) {
  return {
    name: valueForAliases(row, ["full name", "expert name", "wellness expert name", "name"]),
    specialization: valueForAliases(row, ["specialization", "specialisation", "role", "expert type"]),
    experience: valueForAliases(row, ["experience years", "experience year", "experience", "years of experience"]),
    email: valueForAliases(row, ["gmail address", "email", "expert email", "gmail", "mail"]),
    password: valueForAliases(row, ["password", "temporary password", "login password"]),
    phoneNumber: valueForAliases(row, ["phone number", "phone", "mobile", "mobile number"]),
    status: valueForAliases(row, ["status"]),
  };
}

export function isEmptyImportedRecord(record) {
  return !Object.values(record || {}).some((value) => String(value || "").trim());
}

export async function readSpreadsheetRows(file) {
  if (!file) throw new Error("Choose an Excel or CSV file first.");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheetName = workbook.SheetNames?.[0];
  if (!firstSheetName) throw new Error("The selected sheet is empty.");
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    defval: "",
    raw: false,
  });
  if (!rows.length) throw new Error("No rows were found in the first sheet.");
  return rows;
}

export function summarizeImportFailures(failures) {
  if (!failures.length) return "";
  const visible = failures.slice(0, 3).join(" ");
  return failures.length > 3 ? `${visible} ${failures.length - 3} more row(s) also failed.` : visible;
}

const DIRECTORY_IMPORT_CONFIG = {
  employee: {
    singular: "employee",
    plural: "employees",
    normalize: normalizeImportedEmployee,
    requiredFields: (record) => [
      ["Employee Name", record.name],
      ["Department", record.department],
      ["Gmail Address", record.email],
      ["Password", record.password],
    ],
    limitMessage: (rowNumber, limit) => `Row ${rowNumber}: employee limit reached (${limit}).`,
  },
  expert: {
    singular: "wellness expert",
    plural: "wellness experts",
    normalize: normalizeImportedExpert,
    requiredFields: (record) => [
      ["Full Name", record.name],
      ["Specialization", record.specialization],
      ["Experience (Years)", record.experience],
      ["Gmail Address", record.email],
      ["Password", record.password],
    ],
    limitMessage: (rowNumber, limit) =>
      `Row ${rowNumber}: wellness expert limit reached (${limit}).`,
  },
};

export async function importHrDirectoryRecords({
  kind,
  file,
  company,
  currentCount,
  checkCapacity,
  createRecord,
  onProgress,
}) {
  const config = DIRECTORY_IMPORT_CONFIG[kind];
  if (!config) {
    return { message: "Unsupported import type.", type: "error" };
  }
  if (!hasHrCompanyContext(company)) {
    return {
      message:
        "Your HR account is not linked to a company. Ask an administrator to assign one first.",
      type: "error",
    };
  }

  onProgress?.({
    message: `Importing ${config.singular} spreadsheet…`,
    type: "success",
  });

  try {
    const rows = await readSpreadsheetRows(file);
    const capacity = await checkCapacity();
    if (!capacity.allowed) throw new Error(capacity.reason);

    let importedCount = 0;
    let skippedCount = 0;
    const failures = [];

    for (const [index, row] of rows.entries()) {
      const record = config.normalize(row);
      const rowNumber = index + 2;
      if (isEmptyImportedRecord(record)) {
        skippedCount += 1;
        continue;
      }

      const missingFields = config
        .requiredFields(record)
        .filter(([, value]) => !value)
        .map(([label]) => label);
      if (missingFields.length) {
        failures.push(`Row ${rowNumber}: missing ${missingFields.join(", ")}.`);
        continue;
      }

      if (currentCount + importedCount >= capacity.limit) {
        failures.push(config.limitMessage(rowNumber, capacity.limit));
        continue;
      }

      try {
        await createRecord({
          ...record,
          status: record.status || "Active",
          companyId: company.companyId,
          companyName: company.companyName,
        });
        importedCount += 1;
      } catch (createError) {
        failures.push(
          `Row ${rowNumber}: ${createError.message || "Unable to create record."}`,
        );
      }
    }

    const summary = [
      `${importedCount} ${importedCount === 1 ? config.singular : config.plural} imported successfully.`,
    ];
    if (skippedCount) {
      summary.push(
        `${skippedCount} empty row${skippedCount === 1 ? "" : "s"} skipped.`,
      );
    }
    if (failures.length) summary.push(summarizeImportFailures(failures));
    return {
      message: summary.join(" "),
      type: failures.length && !importedCount ? "error" : "success",
    };
  } catch (importError) {
    return {
      message: importError.message || "Unable to import the spreadsheet.",
      type: "error",
    };
  }
}
