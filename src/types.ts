export type FaceZone = "forehead" | "t_zone" | "cheeks" | "under_eye" | "lips" | "nose" | "brows"
export type SkinType = "dry" | "oily" | "combination" | "normal"
export type SensitivityLevel = "low" | "medium" | "high"
export type SkinConcern = "acne" | "rosacea" | "pigmentation" | "flaking" | "redness"

export type ColorType = "spring" | "summer" | "autumn" | "winter" | "unknown"
export type Gender = "female" | "male" | "other"
export type AllergyStatus = "none" | "declared"

export type BagContext = "home" | "work" | "travel"

export type ProductType = "skincare_active" | "base" | "decorative" | "cleanser"
export type Texture = "cream" | "stick" | "liquid" | "powder" | "gel"
export type Finish = "matte" | "satin" | "shimmer" | "creamy"

export type ZoneEffect =
  | "coverage"
  | "hydration"
  | "mattifying"
  | "brightening"
  | "contouring"
  | "color"
  | "definition"
  | "priming"

export type GenStatus = "pending" | "processing" | "done" | "failed"

export interface UserRead {
  id: string
  email: string
  role: string
  created_at: string
}

export interface UserProfileRead {
  display_name: string | null
  age: number | null
  color_type: ColorType | null
  gender: Gender | null
  is_pregnant: boolean | null
  allergy_status: AllergyStatus
  onboarding_done: boolean
}

export interface AllergenRead {
  active_id: string
  code: string
  name: string | null
}

export interface ZoneSkinRead {
  zone: FaceZone
  skin_type: SkinType
  sensitivity: SensitivityLevel | null
  concerns: SkinConcern[]
}

export interface SkinProfileRead {
  zones: ZoneSkinRead[]
}

export interface BagRead {
  id: string
  name: string
  context: BagContext | null
  space_id: string | null
  created_at: string
}

export interface CatalogProductBrief {
  name: string
  brand: string | null
}

export type PaoStatus = "unknown" | "fresh" | "expiring" | "expired"

export interface UserProductItemRead {
  id: string
  catalog_id: string
  catalog_product: CatalogProductBrief | null
  opened_at: string | null
  expires_at: string | null
  pao_status: PaoStatus
  created_at: string
}

export interface BagItemRead {
  id: string
  item: UserProductItemRead
  created_at: string
}

export interface BagWithItemsRead extends BagRead {
  items: BagItemRead[]
}

export interface ActiveRead {
  id: string
  code: string
  name: string | null
}

export interface ProductRead {
  id: string
  brand: string | null
  name: string
  shade: string | null
  product_type: ProductType
  texture: Texture | null
  finish: Finish | null
  actives: ActiveRead[]
}

export interface ZoneRequirementRead {
  id: string
  zone: FaceZone
  desired_effect: ZoneEffect | null
  desired_finish: Finish | null
  color_hint: string | null
}

export interface TemplateRead {
  id: string
  owner_id: string | null
  name: string
  description: string | null
  zone_requirements: ZoneRequirementRead[]
}

export interface GenerationStep {
  zone?: string
  product_name?: string
  instruction?: string
  purpose?: string
  [key: string]: unknown
}

export interface GenerationResultRead {
  id: string
  variant_no: number
  steps: GenerationStep[]
}

export interface GenerationRequestRead {
  id: string
  bag_id: string
  template_id: string
  status: GenStatus
  error_detail: string | null
  results: GenerationResultRead[]
  created_at: string
}
