export const ROLE_ACCESS_ROLES = [
  { label: "HR", group: "hr", icon: "fa-user-shield" },
  { label: "Employee", group: "employee", icon: "fa-user" },
  { label: "Wellness Expert", group: "wellness-expert", icon: "fa-heart-pulse" },
];

export const ROLE_ACCESS_ACTIONS = ["Create", "Read", "Update", "Delete"];

export const ROLE_ACCESS_RESOURCES = {
  hr: [
    ["Employee & Expert Management", "user-management"],
    ["Challenges & Rewards", "challenge-management"],
  ],
  employee: [
    ["Consultations", "user-management"],
    ["Wellness Check-ins & Resources", "client-management"],
    ["Dashboard & Insights", "reports"],
    ["Challenges & Rewards", "challenge-management"],
  ],
  "wellness-expert": [
    ["Consultations & Employee Check-ins", "user-management"],
    ["Live Sessions & Video Library", "client-management"],
    ["Dashboard & Insights", "reports"],
    ["Challenges & Rewards", "challenge-management"],
  ],
};

export function makeDefaultRolePermissions() {
  const keys = new Set(
    Object.values(ROLE_ACCESS_RESOURCES).flatMap((resources) =>
      resources.flatMap(([, prefix]) =>
        ROLE_ACCESS_ACTIONS.map((action) => `${prefix}-${action.toLowerCase()}`),
      ),
    ),
  );

  return Object.fromEntries([...keys].map((key) => [key, true]));
}
