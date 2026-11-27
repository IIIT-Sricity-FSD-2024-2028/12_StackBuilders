import { configureStore } from "@reduxjs/toolkit";
import admin from "../features/admin/index.js";
import employee from "../features/employee/index.js";
import expert from "../features/expert/index.js";
import hr from "../features/hr/index.js";
import supervisor from "../features/supervisor/index.js";
import auth from "../features/shared/authSlice.js";
import roleAccess from "../features/shared/roleAccessSlice.js";
import queries from "../features/shared/querySlice.js";
import companyRequest from "../features/shared/companyRequestSlice.js";

const store = configureStore({
  reducer: { auth, roleAccess, queries, companyRequest, admin, employee, expert, hr, supervisor },
});

export default store;
