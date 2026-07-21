import { useQuery, useMutation } from "@tanstack/react-query"
import { Sparkles, AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { listBags } from "@/api/inventory"
import { listTemplates } from "@/api/templates"
import { getGenerationRequest, requestGeneration } from "@/api/generation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/lib/toast"
import type { GenerationRequestRead } from "@/types"

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "warning" | "success" | "destructive" }> = {
    pending: { label: "В очереди", variant: "secondary" },
    processing: { label: "Генерация...", variant: "warning" },
    done: { label: "Готово", variant: "success" },
    failed: { label: "Ошибка", variant: "destructive" },
  }
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" }
  return <Badge variant={variant as never}>{label}</Badge>
}

function ResultCard({ result, idx }: { result: GenerationRequestRead["results"][0]; idx: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">Вариант {idx + 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.steps.map((step, i) => (
          <div key={i} className="border-l-2 border-primary/30 pl-3 space-y-0.5">
            {step.zone && (
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">{step.zone as string}</p>
            )}
            {step.product_name && <p className="text-sm font-medium">{step.product_name as string}</p>}
            {step.instruction && <p className="text-xs text-muted-foreground">{step.instruction as string}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function GeneratePage() {
  const [bagId, setBagId] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [activeRequest, setActiveRequest] = useState<GenerationRequestRead | null>(null)
  const [polling, setPolling] = useState(false)

  const { data: bags = [], isLoading: bagsLoading } = useQuery({ queryKey: ["bags"], queryFn: listBags })
  const { data: templates = [], isLoading: tplLoading } = useQuery({ queryKey: ["templates"], queryFn: listTemplates })

  const generateMutation = useMutation({
    mutationFn: ({ force }: { force?: boolean } = {}) =>
      requestGeneration(bagId, templateId, force),
    onSuccess: (req) => setActiveRequest(req),
    onError: () => toast.error("Не удалось отправить запрос на генерацию"),
  })

  // cancelled ref prevents stale interval callback from updating state after cleanup
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!activeRequest || activeRequest.status === "done" || activeRequest.status === "failed") {
      setPolling(false)
      return
    }

    cancelledRef.current = false
    setPolling(true)

    const timer = setInterval(async () => {
      if (cancelledRef.current) return
      try {
        const updated = await getGenerationRequest(activeRequest.id)
        if (cancelledRef.current) return
        setActiveRequest(updated)
        if (updated.status === "done" || updated.status === "failed") {
          setPolling(false)
          clearInterval(timer)
        }
      } catch {
        if (!cancelledRef.current) {
          clearInterval(timer)
          setPolling(false)
        }
      }
    }, 3000)

    return () => {
      cancelledRef.current = true
      clearInterval(timer)
    }
  }, [activeRequest?.id, activeRequest?.status])

  const canGenerate = bagId && templateId && !generateMutation.isPending && !polling

  return (
    <div className="p-4 space-y-6">
      <div className="pt-2">
        <h1 className="text-xl font-semibold">Создать образ</h1>
        <p className="text-sm text-muted-foreground mt-0.5">AI подберёт схему макияжа под вашу косметику</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Косметичка</p>
          {bagsLoading ? (
            <Skeleton className="h-9 rounded-md" />
          ) : (
            <Select value={bagId} onValueChange={setBagId}>
              <SelectTrigger><SelectValue placeholder="Выберите косметичку" /></SelectTrigger>
              <SelectContent>
                {bags.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Шаблон образа</p>
          {tplLoading ? (
            <Skeleton className="h-9 rounded-md" />
          ) : (
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Выберите шаблон" /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          className="w-full gap-2"
          disabled={!canGenerate}
          onClick={() => generateMutation.mutate({})}
        >
          {generateMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Отправка...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Сгенерировать</>
          )}
        </Button>

      </div>

      {activeRequest && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {polling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {activeRequest.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {activeRequest.status === "failed" && <AlertCircle className="h-4 w-4 text-destructive" />}
              <StatusBadge status={activeRequest.status} />
            </div>
            {activeRequest.status === "done" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => generateMutation.mutate({ force: true })}
                disabled={generateMutation.isPending || !canGenerate}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Пересоздать
              </Button>
            )}
          </div>

          {activeRequest.status === "failed" && activeRequest.error_detail && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {activeRequest.error_detail}
            </div>
          )}

          {activeRequest.status === "done" && activeRequest.results.length > 0 && (
            <div className="space-y-4">
              {activeRequest.results.map((r, i) => (
                <ResultCard key={r.id} result={r} idx={i} />
              ))}
            </div>
          )}

          {(activeRequest.status === "pending" || activeRequest.status === "processing") && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
