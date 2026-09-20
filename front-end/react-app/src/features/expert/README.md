# Expert Feature

`ExpertWorkspace.jsx` contains the Expert single-page workspace and its five
client-side views:

- Specialist dashboard
- Consultations and availability
- Employee check-ins and follow-up messages
- Live-session creation and history
- Searchable video library

The workspace keeps demo interactions in browser storage under
`stackbuilders.react.expert.workspace.v1`, so it works without changing the
backend while the React API integration is coordinated.

## Route and component structure

The Expert workspace is registered at `/expert` as a standalone route. This
keeps the role-selection sidebar out of the Expert workspace while preserving
the Expert-specific sub-navigation for its five local views.

```jsx
import ExpertWorkspace from "./features/expert/ExpertWorkspace.jsx";

<ExpertWorkspace />
```

Reusable Expert UI is grouped under `components/`, while page composition
stays under `pages/`. The workspace intentionally uses the shared `StatCard`
and supplies only an Expert-specific sub-navigation for the five local views.
