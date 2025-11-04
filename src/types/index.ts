/**
 * Type definitions for the API
 */

export interface CreateBuildingDto {
  name: string
  address: string
  city: string
  province: string
  owner: string
  floors: number
  totalArea: number
  floorConfiguration: FloorConfigurationDto[]
}

export interface FloorConfigurationDto {
  floor: number
  apartmentsCount: number
}

export interface UpdateBuildingDto {
  name?: string
  address?: string
  city?: string
  province?: string
  owner?: string
  floors?: number
  totalArea?: number
}

export interface CreateApartmentDto {
  uniqueId: string
  // Campos para departamentos en edificios
  buildingId?: number
  floor?: number
  apartmentLetter?: string
  nomenclature: string
  // Campos para departamentos independientes
  fullAddress?: string
  city?: string
  province?: string
  // Propietario
  ownerId?: number
  // Tipo de propiedad
  propertyType?: string
  // Información general
  area?: number
  rooms?: number
  status?: string
  saleStatus?: string
  // Especificaciones
  specifications?: string
}

export interface UpdateApartmentDto {
  // Campos para departamentos en edificios
  floor?: number
  apartmentLetter?: string
  nomenclature?: string
  // Campos para departamentos independientes
  fullAddress?: string
  city?: string
  province?: string
  // Propietario
  ownerId?: number
  // Tipo de propiedad
  propertyType?: string
  // Información general
  area?: number
  rooms?: number
  status?: string
  saleStatus?: string
  // Especificaciones
  specifications?: string
}

export interface CreateTenantDto {
  nameOrBusiness: string
  dniOrCuit: string
  address: string
  contactName: string
  contactPhone: string
  contactEmail: string
  contactAddress: string
}

export interface UpdateTenantDto {
  nameOrBusiness?: string
  dniOrCuit?: string
  address?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  contactAddress?: string
}

export interface CreateGuarantorDto {
  tenantId: number
  name: string
  dni: string
  address: string
  email: string
  phone: string
}

export interface UpdateGuarantorDto {
  name?: string
  dni?: string
  address?: string
  email?: string
  phone?: string
}

export interface UpdatePeriodDto {
  date: string
  type: string
  value?: number
  indexName?: string
}

export interface LateInterestDto {
  percent: number
  frequency: string
}

export interface UpdateRuleDto {
  updateFrequency: string
  monthlyCoefficient?: number
  lateInterest?: LateInterestDto
  updatePeriods: UpdatePeriodDto[]
}

export interface CreateContractDto {
  apartmentId: number
  tenantId: number
  startDate: string
  endDate: string
  initialAmount: number
  updateRule: UpdateRuleDto
  guarantorIds: number[]
}

export interface UpdateContractDto {
  startDate?: string
  endDate?: string
  initialAmount?: number
}

// Owner DTOs
export interface CreateOwnerDto {
  name: string
  dniOrCuit: string
  phone: string
  email: string
  address: string
  bankAccount?: string
  commissionPercentage?: number
}

export interface UpdateOwnerDto {
  name?: string
  dniOrCuit?: string
  phone?: string
  email?: string
  address?: string
  bankAccount?: string
  commissionPercentage?: number
}

// Payment DTOs
export interface CreatePaymentDto {
  contractId: number
  month: string // ISO date string
  amount: number
  commissionAmount?: number
  ownerAmount?: number
  paymentDate?: string // ISO date string
  status?: string
  notes?: string
}

export interface UpdatePaymentDto {
  amount?: number
  commissionAmount?: number
  ownerAmount?: number
  paymentDate?: string
  status?: string
  notes?: string
}

// Document DTOs
export interface CreateDocumentDto {
  type: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  description?: string
  tenantId?: number
  ownerId?: number
  contractId?: number
  apartmentId?: number
}

export interface UpdateDocumentDto {
  description?: string
}
