import { combineReducers } from "@reduxjs/toolkit";
import dashboard from "./dashboardSlice.js";
import employees from "./employeesSlice.js";
import experts from "./expertsSlice.js";
import challenges from "./challengesSlice.js";
import liveSessions from "./liveSessionsSlice.js";
import videos from "./videosSlice.js";
import pricing from "./pricingSlice.js";
import subscriptions from "./subscriptionsSlice.js";
import payments from "./paymentsSlice.js";

export default combineReducers({ dashboard, employees, experts, challenges, liveSessions, videos, pricing, subscriptions, payments });
