import { api } from "./client"
import type { TemplateRead } from "@/types"

export async function listTemplates(): Promise<TemplateRead[]> {
  const { data } = await api.get<TemplateRead[]>("/templates")
  return data
}
