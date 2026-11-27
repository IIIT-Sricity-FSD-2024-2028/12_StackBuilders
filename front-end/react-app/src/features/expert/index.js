import { combineReducers } from "@reduxjs/toolkit";
import dashboard from "./dashboardSlice.js";
import consultations from "./consultationsSlice.js";
import liveSessions from "./liveSessionsSlice.js";
import checkins from "./checkinsSlice.js";
import videos from "./videosSlice.js";

export default combineReducers({ dashboard, consultations, liveSessions, checkins, videos });
