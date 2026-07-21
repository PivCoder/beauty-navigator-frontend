import { api } from "./client"
import type { FaceZone, SkinProfileRead, SkinType } from "@/types"

export async function getSkinProfile(): Promise<SkinProfileRead> {
  const { data } = await api.get<SkinProfileRead>("/users/me/skin/zones")
  return data
}

export async function updateSkinZones(
  zones: Array<{ zone: FaceZone; skin_type: SkinType }>
): Promise<SkinProfileRead> {
  const { data } = await api.put<SkinProfileRead>("/users/me/skin/zones", { zones })
  return data
}
