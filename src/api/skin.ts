import { api } from "./client"
import type { FaceZone, SensitivityLevel, SkinConcern, SkinProfileRead, SkinType, ZoneSkinRead } from "@/types"

export async function getSkinProfile(): Promise<SkinProfileRead> {
  const { data } = await api.get<SkinProfileRead>("/users/me/skin")
  return data
}

export async function upsertSkinZone(
  zone: FaceZone,
  body: { skin_type: SkinType; sensitivity: SensitivityLevel | null; concerns: SkinConcern[] }
): Promise<ZoneSkinRead> {
  const { data } = await api.put<ZoneSkinRead>(`/users/me/skin/${zone}`, body)
  return data
}

export async function deleteSkinZone(zone: FaceZone): Promise<void> {
  await api.delete(`/users/me/skin/${zone}`)
}

// Клиентский хелпер поверх upsertSkinZone: бэк не принимает батч, поэтому шлём
// по одной зоне параллельно. sensitivity/concerns не переданы вызывающей стороной —
// отправляем null/[] явно, иначе PUT (полный upsert) затрёт ранее сохранённые значения.
export async function updateSkinZones(
  zones: Array<{ zone: FaceZone; skin_type: SkinType }>
): Promise<ZoneSkinRead[]> {
  return Promise.all(
    zones.map(({ zone, skin_type }) => upsertSkinZone(zone, { skin_type, sensitivity: null, concerns: [] }))
  )
}
