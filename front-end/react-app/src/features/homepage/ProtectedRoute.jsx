import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { validateSession } from "../shared/authSlice.js";

function ProtectedRoute({ roles, children }) {
  const dispatch = useDispatch();
  const { session, status } = useSelector((state) => state.auth);

  useEffect(() => {
    if (session) void dispatch(validateSession());
  }, [dispatch, session?.role, session?.profile?.id, session?.profile?.email, session?.username]);

  if (!session) return <Navigate to="/" replace />;
  if (roles?.length && !roles.includes(session.role)) return <Navigate to={session.path || "/"} replace />;
  if (status === "checking") return <main aria-busy="true" aria-label="Checking account" />;
  return children;
}

export default ProtectedRoute;
