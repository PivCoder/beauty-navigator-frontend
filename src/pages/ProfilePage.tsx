import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LogOut, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { getMe, getMyProfile, updateProfile } from "@/api/auth"
import { listAllergens, removeAllergen } from "@/api/profile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/lib/toast"
import { useAuthStore } from "@/store/auth"

const COLOR_LABEL: Record<string, string> = {
  spring: "Весна", summer: "Лето", autumn: "Осень", winter: "Зима", unknown: "Не определён",
}

export default function ProfilePage() {
  const clearToken = useAuthStore((s) => s.clearToken)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: getMyProfile })
  const { data: allergens = [], refetch } = useQuery({ queryKey: ["allergens"], queryFn: listAllergens })

  const removeAllergenMutation = useMutation({
    mutationFn: (id: string) => removeAllergen(id),
    onSuccess: () => { refetch(); toast.success("Аллерген удалён") },
    onError: () => toast.error("Не удалось удалить аллерген"),
  })

  const resetOnboarding = useMutation({
    mutationFn: () => updateProfile({ onboarding_done: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] })
      navigate("/onboarding")
    },
  })

  function handleLogout() {
    clearToken()
    qc.clear()
    navigate("/auth", { replace: true })
  }

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-semibold">Профиль</h1>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {profile?.display_name ?? "Без имени"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {profile?.age && <p>Возраст: <span className="font-medium">{profile.age}</span></p>}
              {profile?.color_type && (
                <p>Цветотип: <span className="font-medium">{COLOR_LABEL[profile.color_type] ?? profile.color_type}</span></p>
              )}
            </CardContent>
          </Card>

          {allergens.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Аллергены</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {allergens.map((a) => (
                    <Badge
                      key={a.active_id}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeAllergenMutation.mutate(a.active_id)}
                    >
                      {a.name ?? a.code} <span className="ml-1 opacity-50">×</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => resetOnboarding.mutate()}
            disabled={resetOnboarding.isPending}
          >
            Пройти настройку заново
          </Button>
        </>
      )}
    </div>
  )
}
