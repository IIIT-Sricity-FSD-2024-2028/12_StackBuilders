import { combineReducers } from "@reduxjs/toolkit";
import dashboard from "./dashboardSlice.js";
import users from "./usersSlice.js";
import companyManagement from "./companyManagementSlice.js";
import reports from "./reportsSlice.js";
import revenue from "./revenueSlice.js";
import settings from "./settingsSlice.js";

const adminReducer = combineReducers({ dashboard, users, companyManagement, reports, revenue, settings });
export default adminReducer;
