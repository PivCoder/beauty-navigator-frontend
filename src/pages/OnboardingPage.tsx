import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { getMyProfile, updateProfile } from "@/api/auth"
import { listActives } from "@/api/catalog"
import { addAllergen, listAllergens, removeAllergen } from "@/api/profile"
import { updateSkinZones } from "@/api/skin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FaceZone, SkinType } from "@/types"

const ZONES: { id: FaceZone; label: string }[] = [
  { id: "forehead", label: "Лоб" },
  { id: "t_zone", label: "T-зона" },
  { id: "cheeks", label: "Щёки" },
  { id: "under_eye", label: "Под глазами" },
  { id: "nose", label: "Нос" },
  { id: "lips", label: "Губы" },
  { id: "brows", label: "Брови" },
]

const SKIN_TYPES: { value: SkinType; label: string }[] = [
  { value: "normal", label: "Нормальная" },
  { value: "dry", label: "Сухая" },
  { value: "oily", label: "Жирная" },
  { value: "combination", label: "Комбинированная" },
]

const COLOR_TYPES = [
  { value: "spring", label: "Весна" },
  { value: "summer", label: "Лето" },
  { value: "autumn", label: "Осень" },
  { value: "winter", label: "Зима" },
  { value: "unknown", label: "Не знаю" },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [displayName, setDisplayName] = useState("")
  const [age, setAge] = useState("")
  const [colorType, setColorType] = useState("")
  const [skinMap, setSkinMap] = useState<Partial<Record<FaceZone, SkinType>>>({})
  const [search, setSearch] = useState("")

  const { data: actives = [] } = useQuery({
    queryKey: ["actives"],
    queryFn: listActives,
    enabled: step === 3,
  })
  const { data: allergens = [], refetch: refetchAllergens } = useQuery({
    queryKey: ["allergens"],
    queryFn: listAllergens,
    enabled: step === 3,
  })

  // suppress unused warning — profile prefetch for redirect after finish
  useQuery({ queryKey: ["profile"], queryFn: getMyProfile })

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await updateProfile({
        display_name: displayName || null,
        age: age ? parseInt(age) : null,
        color_type: (colorType as never) || null,
      })
      setStep(2)
    } catch {
      setError("Ошибка сохранения профиля")
    } finally {
      setLoading(false)
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault()
    const zones = Object.entries(skinMap).map(([zone, skin_type]) => ({
      zone: zone as FaceZone,
      skin_type: skin_type as SkinType,
    }))
    setLoading(true)
    setError("")
    try {
      if (zones.length > 0) await updateSkinZones(zones)
      setStep(3)
    } catch {
      setError("Ошибка сохранения данных о коже")
    } finally {
      setLoading(false)
    }
  }

  async function handleFinish() {
    setLoading(true)
    try {
      await updateProfile({ onboarding_done: true })
      await qc.invalidateQueries({ queryKey: ["profile"] })
      navigate("/", { replace: true })
    } catch {
      setError("Ошибка завершения")
    } finally {
      setLoading(false)
    }
  }

  const filtered = actives.filter(
    (a) =>
      !allergens.find((al) => al.active_id === a.id) &&
      (a.code.toLowerCase().includes(search.toLowerCase()) ||
        (a.name ?? "").toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="min-h-screen p-6 pb-10">
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Шаг {step} из 3</p>
      </div>

      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Расскажите о себе</h2>
            <p className="text-sm text-muted-foreground mt-1">Это поможет подбирать подходящие образы</p>
          </div>
          <div className="space-y-1.5">
            <Label>Имя</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Как вас называть?" />
          </div>
          <div className="space-y-1.5">
            <Label>Возраст</Label>
            <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} min={10} max={100} placeholder="Ваш возраст" />
          </div>
          <div className="space-y-1.5">
            <Label>Цветотип</Label>
            <Select value={colorType} onValueChange={setColorType}>
              <SelectTrigger><SelectValue placeholder="Выберите цветотип" /></SelectTrigger>
              <SelectContent>
                {COLOR_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>Далее</Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Тип кожи по зонам</h2>
            <p className="text-sm text-muted-foreground mt-1">Пропустите зоны, которые не знаете</p>
          </div>
          <div className="space-y-4">
            {ZONES.map(({ id, label }) => (
              <div key={id} className="flex items-center gap-4">
                <span className="text-sm font-medium w-28 shrink-0">{label}</span>
                <Select value={skinMap[id] ?? ""} onValueChange={(v) => setSkinMap((m) => ({ ...m, [id]: v as SkinType }))}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Тип кожи" /></SelectTrigger>
                  <SelectContent>
                    {SKIN_TYPES.map((st) => (
                      <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>Далее</Button>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Аллергены</h2>
            <p className="text-sm text-muted-foreground mt-1">Ингредиенты, на которые есть реакция. Можно пропустить.</p>
          </div>

          {allergens.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allergens.map((a) => (
                <Badge
                  key={a.active_id}
                  variant="secondary"
                  className="cursor-pointer gap-1"
                  onClick={async () => { await removeAllergen(a.active_id); refetchAllergens() }}
                >
                  {a.name ?? a.code} <span className="opacity-50">×</span>
                </Badge>
              ))}
            </div>
          )}

          <Input placeholder="Поиск ингредиента..." value={search} onChange={(e) => setSearch(e.target.value)} />

          <div className="max-h-60 overflow-y-auto space-y-1 rounded-md border p-1">
            {filtered.slice(0, 30).map((a) => (
              <button
                key={a.id}
                type="button"
                className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm transition-colors"
                onClick={async () => { await addAllergen(a.id); refetchAllergens(); setSearch("") }}
              >
                <span className="font-medium">{a.name ?? a.code}</span>
                {a.name && <span className="text-muted-foreground ml-2 text-xs">{a.code}</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">Ничего не найдено</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={handleFinish} disabled={loading}>
            {loading ? "Сохранение..." : "Завершить настройку"}
          </Button>
        </div>
      )}
    </div>
  )
}
