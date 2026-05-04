(function () {
  const STORAGE_KEY = "stackbuilders.hr.profiles.v2";
  const LEGACY_STORAGE_KEY = "stackbuilders.hr.profile.v1";

  const PROFILE_DEFAULTS = {
    phoneNumber: "",
    department: "HR",
    designation: "HR Admin",
    location: "",
    companyId: "",
    companyName: "",
    status: "Active",
    createdBySuperUser: true,
  };

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
  }

  function createProfileId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `hr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function readLegacyProfile() {
    try {
      const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : null;
    } catch (error) {
      return null;
    }
  }

  function normalizeProfile(profile) {
    const name = normalizeText(profile?.name);
    const email = normalizeEmail(profile?.email);
    const password = normalizeText(profile?.password);

    if (!name || !email || !password) {
      return null;
    }

    const createdAt = normalizeText(profile?.createdAt) || new Date().toISOString();

    return {
      ...PROFILE_DEFAULTS,
      ...profile,
      id: normalizeText(profile?.id) || createProfileId(),
      name,
      email,
      username: normalizeEmail(profile?.username || email),
      phoneNumber: normalizeText(profile?.phoneNumber) || PROFILE_DEFAULTS.phoneNumber,
      department: PROFILE_DEFAULTS.department,
      designation: PROFILE_DEFAULTS.designation,
      location: normalizeText(profile?.location) || PROFILE_DEFAULTS.location,
      companyId: normalizeText(profile?.companyId),
      companyName: normalizeText(profile?.companyName),
      status: normalizeText(profile?.status) || PROFILE_DEFAULTS.status,
      createdBySuperUser: profile?.createdBySuperUser !== false,
      password,
      createdAt,
      updatedAt:
        normalizeText(profile?.updatedAt)
        || normalizeText(profile?.createdAt)
        || createdAt,
    };
  }

  function writeProfiles(profiles) {
    const normalizedProfiles = Array.isArray(profiles)
      ? profiles.map(normalizeProfile).filter(Boolean)
      : [];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedProfiles));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return normalizedProfiles;
  }

  function migrateLegacyProfileIfNeeded() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;

      if (Array.isArray(parsed)) {
        return parsed.map(normalizeProfile).filter(Boolean);
      }
    } catch (error) {
      // Fall through to migration.
    }

    const legacyProfile = normalizeProfile(readLegacyProfile());
    if (!legacyProfile) {
      return [];
    }

    return writeProfiles([legacyProfile]);
  }

  function readProfiles() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;

      if (Array.isArray(parsed)) {
        return parsed.map(normalizeProfile).filter(Boolean);
      }
    } catch (error) {
      // Fall through to migration.
    }

    return migrateLegacyProfileIfNeeded();
  }

  function getSessionHrId() {
    try {
      const session = window.hrAuthStore?.readCurrentHrSession?.();
      return normalizeText(session?.hrId);
    } catch (error) {
      return "";
    }
  }

  function getProfile(target) {
    const profiles = readProfiles();
    const normalizedTarget = normalizeText(target);
    const normalizedEmailTarget = normalizeEmail(target);

    if (normalizedTarget) {
      return (
        profiles.find((profile) => profile.id === normalizedTarget)
        || profiles.find((profile) => profile.email === normalizedEmailTarget)
        || null
      );
    }

    const currentSessionHrId = getSessionHrId();
    if (currentSessionHrId) {
      return profiles.find((profile) => profile.id === currentSessionHrId) || null;
    }

    return profiles[0] || null;
  }

  function findProfileById(profileId) {
    const normalizedProfileId = normalizeText(profileId);
    if (!normalizedProfileId) {
      return null;
    }

    return readProfiles().find((profile) => profile.id === normalizedProfileId) || null;
  }

  function findProfileByEmail(email) {
    const normalizedEmailValue = normalizeEmail(email);
    if (!normalizedEmailValue) {
      return null;
    }

    return readProfiles().find((profile) => profile.email === normalizedEmailValue) || null;
  }

  function createProfile(profile) {
    const normalizedProfile = normalizeProfile(profile);
    if (!normalizedProfile) {
      return null;
    }

    if (findProfileByEmail(normalizedProfile.email)) {
      return null;
    }

    const nextProfiles = [normalizedProfile, ...readProfiles()];
    writeProfiles(nextProfiles);
    return normalizedProfile;
  }

  function writeProfile(profile) {
    const normalizedProfile = normalizeProfile(profile);
    if (!normalizedProfile) {
      return null;
    }

    const currentProfiles = readProfiles();
    const nextProfiles = [];
    let hasMatch = false;

    currentProfiles.forEach((currentProfile) => {
      const isSameRecord =
        currentProfile.id === normalizedProfile.id
        || currentProfile.email === normalizedProfile.email;

      if (isSameRecord) {
        hasMatch = true;
        nextProfiles.push(normalizedProfile);
        return;
      }

      nextProfiles.push(currentProfile);
    });

    if (!hasMatch) {
      nextProfiles.unshift(normalizedProfile);
    }

    writeProfiles(nextProfiles);
    return normalizedProfile;
  }

  function updateProfile(profileIdOrUpdates, maybeUpdates) {
    const currentProfiles = readProfiles();
    const explicitProfileId =
      typeof profileIdOrUpdates === "string"
        ? normalizeText(profileIdOrUpdates)
        : normalizeText(profileIdOrUpdates?.id);
    const profileId = explicitProfileId || getSessionHrId() || normalizeText(currentProfiles[0]?.id);
    const updates =
      typeof profileIdOrUpdates === "string"
        ? maybeUpdates
        : profileIdOrUpdates;

    if (!profileId) {
      return null;
    }

    const currentProfile = currentProfiles.find((profile) => profile.id === profileId) || null;
    if (!currentProfile) {
      return null;
    }

    const nextEmail = Object.prototype.hasOwnProperty.call(updates || {}, "email")
      ? normalizeEmail(updates?.email)
      : currentProfile.email;

    if (
      nextEmail
      && currentProfiles.some(
        (profile) => profile.id !== profileId && profile.email === nextEmail
      )
    ) {
      return null;
    }

    const nextProfile = normalizeProfile({
      ...currentProfile,
      ...updates,
      id: currentProfile.id,
      email: nextEmail,
      username: nextEmail || currentProfile.username,
      password:
        updates && Object.prototype.hasOwnProperty.call(updates, "password")
          ? normalizeText(updates.password)
          : currentProfile.password,
      createdAt: currentProfile.createdAt,
      updatedAt: new Date().toISOString(),
    });

    if (!nextProfile) {
      return null;
    }

    writeProfiles(
      currentProfiles.map((profile) =>
        profile.id === profileId ? nextProfile : profile
      )
    );

    return nextProfile;
  }

  function deleteProfile(profileId) {
    const normalizedProfileId = normalizeText(profileId);
    if (!normalizedProfileId) {
      return readProfiles();
    }

    const nextProfiles = readProfiles().filter(
      (profile) => profile.id !== normalizedProfileId
    );

    writeProfiles(nextProfiles);
    return nextProfiles;
  }

  window.hrProfileStore = {
    STORAGE_KEY,
    LEGACY_STORAGE_KEY,
    normalizeEmail,
    readProfiles,
    writeProfiles,
    getProfile,
    findProfileById,
    findProfileByEmail,
    createProfile,
    writeProfile,
    updateProfile,
    deleteProfile,
  };
})();
