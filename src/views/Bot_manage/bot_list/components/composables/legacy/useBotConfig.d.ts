import { Ref } from 'vue'

export interface FormMethods {
  botInfo?: any
  payment?: any
  timeEnergy?: any
  countEnergy?: any
  managedMode?: any
  batchOrder?: any
  flashExchange?: any
}

export interface BotConfig {
  dialogVisible: Ref<boolean>
  activeTab: Ref<string>
  currentBot: Ref<Record<string, any>>
  tgStatus: Ref<string>
  syncing: Ref<boolean>
  loading: Ref<boolean>
  submitting: Ref<boolean>
  costPrices: Record<string, number>
  syncTgStatus: () => Promise<void>
  loadBotAllConfigs: (id: number, formMethods: FormMethods) => Promise<void>
  submitConfig: (formMethods: FormMethods) => Promise<boolean>
}

export function useBotConfig(): BotConfig
