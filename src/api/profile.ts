import { api } from "./client"
import type { AllergenRead } from "@/types"

export async function listAllergens(): Promise<AllergenRead[]> {
  const { data } = await api.get<AllergenRead[]>("/users/me/allergens")
  return data
}

export async function addAllergen(active_id: string): Promise<AllergenRead> {
  const { data } = await api.post<AllergenRead>("/users/me/allergens", { active_id })
  return data
}

export async function removeAllergen(active_id: string): Promise<void> {
  await api.delete(`/users/me/allergens/${active_id}`)
}
