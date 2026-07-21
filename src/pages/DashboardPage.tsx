import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, ShoppingBag, Sparkles } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { getMyProfile } from "@/api/auth"
import { createBag, listBags } from "@/api/inventory"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const CONTEXT_LABELS: Record<string, string> = {
  home: "Дом",
  work: "Работа",
  travel: "Путешествие",
}

export default function DashboardPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [bagName, setBagName] = useState("")
  const [bagContext, setBagContext] = useState("")
  const [createError, setCreateError] = useState("")

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: getMyProfile })
  const { data: bags = [], isLoading } = useQuery({ queryKey: ["bags"], queryFn: listBags })

  const createMutation = useMutation({
    mutationFn: () => createBag(bagName.trim(), bagContext || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bags"] })
      setBagName("")
      setBagContext("")
      setCreateError("")
      setOpen(false)
    },
    onError: () => setCreateError("Не удалось создать косметичку"),
  })

  return (
    <div className="p-4 space-y-6">
      <div className="pt-4">
        <h1 className="text-2xl font-bold">
          Привет{profile?.display_name ? `, ${profile.display_name}` : ""}! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Что сегодня создаём?</p>
      </div>

      <Link to="/generate">
        <Card className="bg-gradient-to-r from-rose-500 to-pink-400 text-white border-0 cursor-pointer hover:opacity-95 transition-opacity">
          <CardContent className="flex items-center gap-4 p-5">
            <Sparkles className="h-10 w-10 shrink-0" />
            <div>
              <p className="font-semibold text-lg">Создать образ</p>
              <p className="text-sm opacity-90">AI подберёт схему макияжа под вашу косметику</p>
            </div>
          </CardContent>
        </Card>
      </Link>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Мои косметички</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="h-4 w-4" /> Новая
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новая косметичка</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Название</Label>
                  <Input
                    value={bagName}
                    onChange={(e) => setBagName(e.target.value)}
                    placeholder="Например: Повседневная"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Контекст</Label>
                  <Select value={bagContext} onValueChange={setBagContext}>
                    <SelectTrigger><SelectValue placeholder="Где используете?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Дом</SelectItem>
                      <SelectItem value="work">Работа</SelectItem>
                      <SelectItem value="travel">Путешествие</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {createError && <p className="text-sm text-destructive">{createError}</p>}
                <Button
                  className="w-full"
                  disabled={!bagName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending ? "Создание..." : "Создать"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : bags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Нет косметичек</p>
            <p className="text-xs mt-1">Создайте первую, чтобы начать</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bags.map((bag) => (
              <Link key={bag.id} to={`/bags/${bag.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{bag.name}</CardTitle>
                      {bag.context && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {CONTEXT_LABELS[bag.context] ?? bag.context}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
