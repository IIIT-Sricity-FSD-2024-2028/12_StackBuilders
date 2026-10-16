import * as XLSX from "xlsx";
import { getAuthSession } from "../homepage/authService.js";

export function getCurrentHrCompanyContext() {
  const profile = getAuthSession()?.profile || {};
  return {
    hrName: String(profile.name || profile.username || "").trim(),
    companyId: String(profile.companyId || "").trim(),
    companyName: String(profile.companyName || "").trim(),
  };
}

export function requireHrCompanyContext() {
  const context = getCurrentHrCompanyContext();
  return context.companyId && context.companyName ? context : null;
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
