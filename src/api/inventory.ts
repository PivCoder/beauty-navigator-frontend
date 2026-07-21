import { api } from "./client"
import type { BagRead, BagWithItemsRead, UserProductItemRead } from "@/types"

export async function listBags(): Promise<BagRead[]> {
  const { data } = await api.get<BagRead[]>("/inventory/bags")
  return data
}

export async function getBag(bagId: string): Promise<BagWithItemsRead> {
  const { data } = await api.get<BagWithItemsRead>(`/inventory/bags/${bagId}`)
  return data
}

export async function createBag(name: string, context?: string): Promise<BagRead> {
  const { data } = await api.post<BagRead>("/inventory/bags", { name, context })
  return data
}

export async function deleteBag(bagId: string): Promise<void> {
  await api.delete(`/inventory/bags/${bagId}`)
}

export async function createItem(catalog_id: string): Promise<UserProductItemRead> {
  const { data } = await api.post<UserProductItemRead>("/inventory/items", { catalog_id })
  return data
}

export async function addItemToBag(bagId: string, item_id: string): Promise<void> {
  await api.post(`/inventory/bags/${bagId}/items`, { item_id })
}

export async function removeItemFromBag(bagId: string, bagItemId: string): Promise<void> {
  await api.delete(`/inventory/bags/${bagId}/items/${bagItemId}`)
}
