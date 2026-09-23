# Admin Feature

The Admin module owns the administrator dashboard and platform-management screens.

## Folder Structure

```text
admin/
|-- AdminWorkspace.jsx
|-- adminApi.js
|-- admin.css
|-- components/
|   |-- AdminCharts.jsx
|   |-- AdminIcon.jsx
|   |-- AdminModal.jsx
|   |-- AdminSidebar.jsx
|   `-- AdminTable.jsx
`-- pages/
    |-- AdminDashboard.jsx
    |-- CompanyManagement.jsx
    |-- Reports.jsx
    |-- Revenue.jsx
    |-- RolesAccess.jsx
    |-- Settings.jsx
    `-- UserManagement.jsx
```

Keep Admin-specific work inside this feature folder. Do not modify the Supervisor feature folder.

## Progress

- Part 1: Console layout, sidebar, dashboard heading, and summary cards.
- Part 2: Quick actions and recent activity panels.
- Part 3: Connect dashboard data and add user, company, and permission management.

Keep Admin-specific components and styles in this folder. Coordinate with Person 1 before changing shared routes, layouts, or global styles.
