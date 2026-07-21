import { useQuery } from "@tanstack/react-query"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { getMyProfile } from "@/api/auth"
import { useAuthStore } from "@/store/auth"

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
    enabled: !!token,
    retry: false,
  })

  if (!token) return <Navigate to="/auth" replace />

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (profile && !profile.onboarding_done && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
