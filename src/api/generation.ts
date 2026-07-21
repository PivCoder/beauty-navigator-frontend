import { api } from "./client"
import type { GenerationRequestRead } from "@/types"

export async function requestGeneration(
  bag_id: string,
  template_id: string,
  force = false
): Promise<GenerationRequestRead> {
  const { data } = await api.post<GenerationRequestRead>("/generation/requests", {
    bag_id,
    template_id,
    force,
  })
  return data
}

export async function getGenerationRequest(requestId: string): Promise<GenerationRequestRead> {
  const { data } = await api.get<GenerationRequestRead>(`/generation/requests/${requestId}`)
  return data
}

export async function listGenerationRequests(): Promise<GenerationRequestRead[]> {
  const { data } = await api.get<GenerationRequestRead[]>("/generation/requests")
  return data
}
