import { api } from "./client"
import type { ActiveRead, ProductRead, ProductType } from "@/types"

export async function listActives(): Promise<ActiveRead[]> {
  const { data } = await api.get<ActiveRead[]>("/catalog/actives")
  return data
}

export async function listProducts(params?: {
  product_type?: ProductType
  brand?: string
  limit?: number
  offset?: number
}): Promise<ProductRead[]> {
  const { data } = await api.get<ProductRead[]>("/catalog/products", { params })
  return data
}
