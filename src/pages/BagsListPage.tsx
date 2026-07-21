import { useQuery } from "@tanstack/react-query"
import { ShoppingBag } from "lucide-react"
import { Link } from "react-router-dom"
import { listBags } from "@/api/inventory"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const CONTEXT_LABELS: Record<string, string> = {
  home: "Дом",
  work: "Работа",
  travel: "Путешествие",
}

export default function BagsListPage() {
  const { data: bags = [], isLoading } = useQuery({ queryKey: ["bags"], queryFn: listBags })

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold pt-2">Косметички</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : bags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">Нет косметичек</p>
          <p className="text-xs mt-1">Создайте первую на главной странице</p>
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
  )
}
