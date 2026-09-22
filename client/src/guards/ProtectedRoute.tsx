import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullScreenSpinner } from "@/components/ui/FullScreenSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * When true (default), a logged-in user who hasn't finished the
   * onboarding wizard is redirected to /onboarding before they can reach
   * this route. The onboarding route itself sets this to false.
   */
  requireOnboarded?: boolean;
}

export function ProtectedRoute({ children, requireOnboarded = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenSpinner label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (requireOnboarded && user && !user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

/** Guards /auth so an already-logged-in user gets bounced to their dashboard. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullScreenSpinner label="Loading DestinAI..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={user?.isOnboarded ? "/dashboard" : "/onboarding"} replace />;
  }

  return <>{children}</>;
}
