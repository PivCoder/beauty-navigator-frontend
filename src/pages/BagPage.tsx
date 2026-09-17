import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react"
import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { listProducts } from "@/api/catalog"
import { addItemToBag, createItem, deleteItem, getBag, removeItemFromBag } from "@/api/inventory"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/lib/toast"
import type { PaoStatus, ProductType } from "@/types"

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  skincare_active: "Уход",
  base: "База",
  decorative: "Декоративная",
  cleanser: "Очищение",
}

const CONTEXT_LABELS: Record<string, string> = {
  home: "Дом",
  work: "Работа",
  travel: "Путешествие",
}

// The badge is present on every card regardless of status; a uniformly bright
// badge on each one would just read as noise, so the four statuses split by
// visual weight instead: muted/neutral for 'unknown' and 'fresh', accent
// colour for the two that call for action — 'expiring' and 'expired'.
const PAO_CONFIG: Record<PaoStatus, { label: string; variant: NonNullable<BadgeProps["variant"]>; cardBorder: string }> = {
  unknown: { label: "Срок не указан", variant: "secondary", cardBorder: "" },
  fresh: { label: "Годен", variant: "secondary", cardBorder: "" },
  expiring: { label: "Истекает", variant: "warning", cardBorder: "border-yellow-200" },
  expired: { label: "Просрочен", variant: "destructive", cardBorder: "border-destructive/30" },
}

function getApiDetail(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
    if (typeof detail === "string") return detail
  }
  return fallback
}

export default function BagPage() {
  const { bagId } = useParams<{ bagId: string }>()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [brand, setBrand] = useState("")
  const [productType, setProductType] = useState<ProductType | "">("")
  const [openedAt, setOpenedAt] = useState("")
  const [searching, setSearching] = useState(false)
  const [removingItemId, setRemovingItemId] = useState<string | null>(null)

  const { data: bag, isLoading } = useQuery({
    queryKey: ["bag", bagId],
    queryFn: () => getBag(bagId!),
    enabled: !!bagId,
  })

  const { data: products = [], refetch: searchProducts } = useQuery({
    queryKey: ["catalog", brand, productType],
    queryFn: () =>
      listProducts({ brand: brand || undefined, product_type: productType || undefined, limit: 30 }),
    enabled: false,
  })

  async function handleSearch() {
    setSearching(true)
    await searchProducts()
    setSearching(false)
  }

  const addMutation = useMutation({
    mutationFn: async (catalogId: string) => {
      const item = await createItem(catalogId, openedAt || undefined)
      try {
        await addItemToBag(bagId!, item.id)
      } catch (err) {
        await deleteItem(item.id).catch(() => {})
        throw err
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bag", bagId] })
      setOpen(false)
      toast.success("Продукт добавлен")
    },
    onError: (err) => {
      toast.error(getApiDetail(err, "Не удалось добавить продукт"))
    },
  })

  const removeMutation = useMutation({
    mutationFn: (bagItemId: string) => removeItemFromBag(bagId!, bagItemId),
    onMutate: (bagItemId) => setRemovingItemId(bagItemId),
    onSettled: () => setRemovingItemId(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bag", bagId] })
      toast.success("Продукт удалён")
    },
    onError: () => toast.error("Не удалось удалить продукт"),
  })

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      setBrand("")
      setProductType("")
      setOpenedAt("")
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    )
  }

  if (!bag) return null

  const catalogIds = new Set(bag.items.map((bi) => bi.item.catalog_id))

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <Link to="/bags" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">{bag.name}</h1>
        {bag.context && (
          <Badge variant="secondary" className="ml-auto">
            {CONTEXT_LABELS[bag.context] ?? bag.context}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{bag.items.length} продуктов</p>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить продукт</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Бренд (например: MAC, NARS)"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
              <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
                <SelectTrigger><SelectValue placeholder="Тип продукта" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRODUCT_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleSearch}
                disabled={searching}
              >
                <Search className="h-4 w-4" />
                {searching ? "Поиск..." : "Найти"}
              </Button>

              <div className="max-h-56 overflow-y-auto space-y-2">
                {products.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    {searching ? "Поиск..." : "Нажмите «Найти» для поиска"}
                  </p>
                ) : (
                  products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.brand ?? "—"}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={catalogIds.has(p.id) ? "secondary" : "default"}
                        disabled={catalogIds.has(p.id) || addMutation.isPending}
                        onClick={() => addMutation.mutate(p.id)}
                      >
                        {catalogIds.has(p.id) ? "Есть" : "Добавить"}
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {products.length > 0 && (
                <div className="space-y-1.5 border-t pt-3">
                  <Label className="text-xs text-muted-foreground">
                    Дата вскрытия (для расчёта срока годности)
                  </Label>
                  <Input
                    type="date"
                    value={openedAt}
                    onChange={(e) => setOpenedAt(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {bag.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <p className="text-sm">Косметичка пуста</p>
          <p className="text-xs mt-1">Добавьте продукты из каталога</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bag.items.map((bi) => {
            const paoCfg = PAO_CONFIG[bi.item.pao_status]
            return (
              <Card key={bi.id} className={paoCfg.cardBorder}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        {bi.item.catalog_product?.name ?? bi.item.catalog_id.slice(0, 8) + "…"}
                      </p>
                      <Badge variant={paoCfg.variant} className="font-medium">
                        {paoCfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bi.item.catalog_product?.brand && (
                        <span>{bi.item.catalog_product.brand}</span>
                      )}
                      {bi.item.opened_at && (
                        <span className={bi.item.catalog_product?.brand ? " · " : ""}>
                          Открыт: {bi.item.opened_at}
                        </span>
                      )}
                      {!bi.item.catalog_product?.brand && !bi.item.opened_at && "Не открыт"}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive shrink-0 ml-2"
                    onClick={() => removeMutation.mutate(bi.id)}
                    disabled={removingItemId === bi.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
