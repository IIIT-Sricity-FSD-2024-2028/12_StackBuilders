(function () {
  const STORAGE_KEY = "stackbuilders.hr.profile.v1";

  const PROFILE_DEFAULTS = {
    phoneNumber: "",
    department: "",
    designation: "",
    location: "",
    companyId: "",
    companyName: "",
    status: "Active",
    createdBySuperUser: true,
  };

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeProfile(profile) {
    const name = normalizeText(profile?.name);
    const email = normalizeText(profile?.email).toLowerCase();
    const password = normalizeText(profile?.password);
    const createdBySuperUser = profile?.createdBySuperUser === true;

    if (!name || !email || !password || !createdBySuperUser) {
      return null;
    }

    const createdAt = normalizeText(profile?.createdAt) || new Date().toISOString();

    return {
      ...PROFILE_DEFAULTS,
      ...profile,
      name,
      email,
      phoneNumber: normalizeText(profile?.phoneNumber) || PROFILE_DEFAULTS.phoneNumber,
      department: normalizeText(profile?.department) || PROFILE_DEFAULTS.department,
      designation: normalizeText(profile?.designation) || PROFILE_DEFAULTS.designation,
      location: normalizeText(profile?.location) || PROFILE_DEFAULTS.location,
      companyId: normalizeText(profile?.companyId),
      companyName: normalizeText(profile?.companyName),
      status: normalizeText(profile?.status) || PROFILE_DEFAULTS.status,
      createdBySuperUser,
      password,
      createdAt,
      updatedAt: normalizeText(profile?.updatedAt) || normalizeText(profile?.createdAt) || createdAt,
    };
  }

  function getProfile() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      return normalizeProfile(parsed);
    } catch (error) {
      return null;
    }
  }

  function writeProfile(profile) {
    const normalized = normalizeProfile(profile);
    if (!normalized) {
      return null;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function updateProfile(updates) {
    const currentProfile = getProfile();
    if (!currentProfile) {
      return null;
    }

    return writeProfile({
      ...currentProfile,
      ...updates,
      email: currentProfile.email,
      status: currentProfile.status,
      password:
        updates && Object.prototype.hasOwnProperty.call(updates, "password")
          ? normalizeText(updates.password)
          : currentProfile.password,
      createdAt: currentProfile.createdAt,
      updatedAt: new Date().toISOString(),
    });
  }

  window.hrProfileStore = {
    STORAGE_KEY,
    getProfile,
    writeProfile,
    updateProfile,
  };
})();
