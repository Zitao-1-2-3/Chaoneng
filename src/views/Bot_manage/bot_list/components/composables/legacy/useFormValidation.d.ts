export interface ValidationResult {
  valid: boolean
  message?: string
}

export interface FormValidation {
  required: () => {
    required: boolean
    message: string
  }
  validateMinPrice: (rule: any, value: any, callback: any) => void
  validateTimeEnergyPrices: (timeEnergyData: any) => ValidationResult
}

export function useFormValidation(costPrices: Record<string, number>): FormValidation
