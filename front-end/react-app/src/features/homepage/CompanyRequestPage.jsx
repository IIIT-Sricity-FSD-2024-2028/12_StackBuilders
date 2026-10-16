import { useState } from "react";
import { Link } from "react-router-dom";
import RouteLoadingScreen from "../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../hooks/usePageStylesheets.js";
import { submitCompanyRequest } from "./authService.js";

const initialForm = { companyName: "", companyPhone: "", companyAddress: "", companyEmail: "", hrName: "", hrPhoneNumber: "", hrEmail: "", hrPassword: "" };

function CompanyRequestPage() {
  const stylesReady = usePageStylesheets("/signup-legacy.css");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateCompanyRequest(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
    setSubmitting(true);
    try {
      const result = await submitCompanyRequest(payload);
      if (!result.ok) {
        setError(result.error || "The request could not be submitted. Please check the details and try again.");
        return;
      }
      setForm(initialForm);
      setSuccess("Your request was submitted. An administrator can approve it before the HR account signs in.");
    } catch {
      setError("The request could not be submitted. Please check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <main className="login-page">
      <section className="auth-card auth-card--request">
        <div className="brand-block"><h1>Stack Builders</h1><span className="brand-underline"></span></div>
        <div className="auth-copy"><h2>Request Company Approval</h2><p>Submit your company details and HR account details for admin review.</p></div>
        <form className="auth-form auth-form--request" onSubmit={submit} noValidate>
          <div className="auth-section"><h3>Company Details</h3><div className="auth-grid">
            <label className="field"><span>Company Name</span><div className="input-wrap"><i className="fa-solid fa-building"></i><input name="companyName" type="text" placeholder="Enter company name" required value={form.companyName} onChange={(event) => update("companyName", event.target.value)} /></div></label>
            <label className="field"><span>Company Phone</span><div className="input-wrap"><i className="fa-solid fa-phone"></i><input name="companyPhone" type="tel" placeholder="+91 98765 43210" required value={form.companyPhone} onChange={(event) => update("companyPhone", event.target.value)} /></div></label>
            <label className="field field--full"><span>Company Address</span><div className="input-wrap"><i className="fa-solid fa-location-dot"></i><input name="companyAddress" type="text" placeholder="Enter company address" required value={form.companyAddress} onChange={(event) => update("companyAddress", event.target.value)} /></div></label>
            <label className="field field--full"><span>Company Email</span><div className="input-wrap"><i className="fa-regular fa-envelope"></i><input name="companyEmail" type="email" placeholder="Enter company email" required value={form.companyEmail} onChange={(event) => update("companyEmail", event.target.value)} /></div></label>
          </div></div>
          <div className="auth-section"><h3>HR Details</h3><div className="auth-grid">
            <label className="field"><span>HR Name</span><div className="input-wrap"><i className="fa-regular fa-user"></i><input name="hrName" type="text" placeholder="Enter HR full name" required value={form.hrName} onChange={(event) => update("hrName", event.target.value)} /></div></label>
            <label className="field"><span>HR Phone</span><div className="input-wrap"><i className="fa-solid fa-phone"></i><input name="hrPhoneNumber" type="tel" placeholder="+91 98765 43210" value={form.hrPhoneNumber} onChange={(event) => update("hrPhoneNumber", event.target.value)} /></div></label>
            <label className="field field--full"><span>HR Gmail</span><div className="input-wrap"><i className="fa-regular fa-envelope"></i><input name="hrEmail" type="email" placeholder="Enter HR Gmail" required value={form.hrEmail} onChange={(event) => update("hrEmail", event.target.value)} /></div></label>
            <label className="field field--full"><span>HR Password</span><div className="input-wrap"><i className="fa-solid fa-lock"></i><input name="hrPassword" type="password" placeholder="Set the HR password" minLength="6" required value={form.hrPassword} onChange={(event) => update("hrPassword", event.target.value)} /></div></label>
          </div></div>
          <p className="auth-helper">After admin approval, use the HR Gmail and password above to sign in to the HR dashboard.</p>
          <p className="auth-error" role="alert" aria-live="polite" hidden={!error}>{error}</p><p className="auth-success" role="status" aria-live="polite" hidden={!success}>{success}</p>
          <div className="action-row"><button type="submit" className="submit-btn" disabled={submitting}>{submitting ? "Submitting…" : "Submit Request"}</button><Link to="/" className="back-btn">Back to Sign In</Link></div>
        </form>
      </section>
    </main>
  );
}

function validateCompanyRequest(form) {
  const requiredFields = [
    ["Company name", form.companyName],
    ["Company phone", form.companyPhone],
    ["Company address", form.companyAddress],
    ["Company email", form.companyEmail],
    ["HR name", form.hrName],
    ["HR Gmail", form.hrEmail],
    ["HR password", form.hrPassword],
  ];
  const missingFields = requiredFields.filter(([, value]) => !String(value || "").trim()).map(([label]) => label);
  if (missingFields.length) return `Please complete the required fields: ${missingFields.join(", ")}.`;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  if (!emailPattern.test(form.companyEmail.trim())) return "Enter a valid company email address.";
  if (!isValidIndianPhone(form.companyPhone)) return "Enter a valid Indian company phone number with 10 digits, or include the 91 country code.";
  if (form.hrPhoneNumber.trim() && !isValidIndianPhone(form.hrPhoneNumber)) return "Enter a valid Indian HR phone number with 10 digits, or include the 91 country code.";
  if (!/^[a-z0-9._%+-]+@gmail\.com$/i.test(form.hrEmail.trim())) return "Use a valid Gmail address for the HR login email.";
  if (form.hrPassword.trim().length < 6) return "HR password must be at least 6 characters long.";

  return "";
}

function isValidIndianPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
}

export default CompanyRequestPage;

