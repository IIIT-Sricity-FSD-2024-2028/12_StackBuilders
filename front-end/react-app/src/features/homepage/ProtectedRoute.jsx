import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuthSession, logout, verifyServerAccount } from "./authService.js";

function ProtectedRoute({ roles, children }) {
  const session = getAuthSession();
  const [accountState, setAccountState] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    setAccountState("checking");
    verifyServerAccount(session).then((exists) => {
      if (cancelled) return;
      if (exists === false) {
        logout();
        setAccountState("missing");
      } else {
        setAccountState("valid");
      }
    });
    return () => { cancelled = true; };
  }, [session?.role, session?.profile?.id, session?.profile?.email, session?.username]);

  if (!session) return <Navigate to="/" replace />;
  if (roles?.length && !roles.includes(session.role)) return <Navigate to={session.path || "/"} replace />;
  if (accountState === "checking") return <main aria-busy="true" aria-label="Checking account" />;
  if (accountState === "missing") return <Navigate to="/" replace />;
  return children;
}

export default ProtectedRoute;
