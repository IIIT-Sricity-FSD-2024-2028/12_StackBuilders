import { combineReducers } from "@reduxjs/toolkit";
import dashboard from "./dashboardSlice.js";
import challenges from "./challengesSlice.js";
import experts from "./expertsSlice.js";
import consultations from "./consultationsSlice.js";
import wellnessCheckins from "./wellnessCheckinsSlice.js";
import liveSessions from "./liveSessionsSlice.js";
import videos from "./videosSlice.js";

export default combineReducers({ dashboard, challenges, experts, consultations, wellnessCheckins, liveSessions, videos });
