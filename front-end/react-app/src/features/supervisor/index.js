import { combineReducers } from "@reduxjs/toolkit";
import dashboard from "./dashboardSlice.js";
import users from "./usersSlice.js";
import companyManagement from "./companyManagementSlice.js";
import queries from "./queriesSlice.js";
import revenue from "./revenueSlice.js";
import activity from "./activitySlice.js";
import reports from "./reportsSlice.js";
import settings from "./settingsSlice.js";

export default combineReducers({ dashboard, users, companyManagement, queries, revenue, activity, reports, settings });
