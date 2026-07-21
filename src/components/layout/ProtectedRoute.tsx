import { useQuery } from "@tanstack/react-query"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { getMyProfile } from "@/api/auth"
import { useAuthStore } from "@/store/auth"

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()

  const { data: profile, isLoading, isError, refetch } = useQuery({
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

  if (isError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-muted-foreground text-center">Не удалось загрузить данные профиля</p>
        <button className="text-sm text-primary underline" onClick={() => refetch()}>
          Попробовать снова
        </button>
      </div>
    )
  }

  if (profile && !profile.onboarding_done && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
