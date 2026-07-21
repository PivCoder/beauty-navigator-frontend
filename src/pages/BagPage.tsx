import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react"
import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { listProducts } from "@/api/catalog"
import { addItemToBag, createItem, getBag, removeItemFromBag } from "@/api/inventory"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProductType } from "@/types"

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  skincare_active: "Уход",
  base: "База",
  decorative: "Декоративная",
  cleanser: "Очищение",
}

export default function BagPage() {
  const { bagId } = useParams<{ bagId: string }>()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [brand, setBrand] = useState("")
  const [productType, setProductType] = useState<ProductType | "">("")
  const [searching, setSearching] = useState(false)

  const { data: bag, isLoading } = useQuery({
    queryKey: ["bag", bagId],
    queryFn: () => getBag(bagId!),
    enabled: !!bagId,
  })

  const { data: products = [], refetch: searchProducts } = useQuery({
    queryKey: ["catalog", brand, productType],
    queryFn: () => listProducts({ brand: brand || undefined, product_type: productType || undefined, limit: 30 }),
    enabled: false,
  })

  async function handleSearch() {
    setSearching(true)
    await searchProducts()
    setSearching(false)
  }

  const addMutation = useMutation({
    mutationFn: async (catalogId: string) => {
      const item = await createItem(catalogId)
      await addItemToBag(bagId!, item.id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bag", bagId] })
      setOpen(false)
    },
  })

  const removeMutation = useMutation({
    mutationFn: (bagItemId: string) => removeItemFromBag(bagId!, bagItemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bag", bagId] }),
  })

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
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">{bag.name}</h1>
        {bag.context && (
          <Badge variant="secondary" className="ml-auto">
            {bag.context}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{bag.items.length} продуктов</p>
        <Dialog open={open} onOpenChange={setOpen}>
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
              <div className="space-y-1.5">
                <Input
                  placeholder="Бренд (например: MAC, NARS)"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
                <SelectTrigger><SelectValue placeholder="Тип продукта" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRODUCT_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="w-full gap-2" onClick={handleSearch} disabled={searching}>
                <Search className="h-4 w-4" />
                {searching ? "Поиск..." : "Найти"}
              </Button>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {products.map((p) => (
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
                ))}
                {products.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    Нажмите «Найти» для поиска
                  </p>
                )}
              </div>
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
          {bag.items.map((bi) => (
            <Card key={bi.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{bi.item.catalog_id.slice(0, 8)}…</p>
                  <p className="text-xs text-muted-foreground">
                    {bi.item.opened_at ? `Открыт: ${bi.item.opened_at}` : "Не открыт"}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeMutation.mutate(bi.id)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
