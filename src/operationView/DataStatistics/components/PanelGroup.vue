<script setup lang="ts">
import { ElRow, ElCol, ElCard, ElSkeleton } from 'element-plus'
import { CountTo } from '@/components/CountTo'
import { useDesign } from '@/hooks/web/useDesign'
// import { useI18n } from '@/hooks/web/useI18n' // Keep if needed for other text
// import { ref, reactive } from 'vue' // Remove ref, reactive
import { computed } from 'vue'
// import { getDailyStatisticsApi } from '@/api/statistics' // Remove API import
import Icon from '@/components/Icon/src/Icon.vue'

// const { t } = useI18n() // Keep if needed

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('panel')

// Define Interface (ensure this matches the structure passed from Analysis.vue)
interface ApiStatisticsData {
  day_energy_income?: string
  total_energy_income?: string
  day_flash_change_cost?: string
  total_flash_change_cost?: string
  day_flash_change_income?: string
  total_flash_change_income?: string
  day_profit?: string
  total_profit?: string
  day_user_num?: number
  total_user_num?: number
  day_bot_income?: string
  total_bot_income?: string
  day_bot_num?: number
  total_bot_num?: number
  day_active_income?: string
  total_active_income?: string
  day_active_cost?: string
  total_active_cost?: string
  day_bandwidth_cost?: string
  total_bandwidth_cost?: string
}

// Define props
const props = defineProps<{
  statistics: Partial<ApiStatisticsData>
  isLoading: boolean
}>()

// Helper function
const parseNum = (val: string | number | undefined): number => {
  if (typeof val === 'number') return val
  return parseFloat(val || '0') || 0
}

// Update computed properties to use props.statistics
const dayEnergyIncome = computed(() => parseNum(props.statistics.day_energy_income))
const totalEnergyIncome = computed(() => parseNum(props.statistics.total_energy_income))
const dayExchangeIncome = computed(() => parseNum(props.statistics.day_flash_change_income))
const totalExchangeIncome = computed(() => parseNum(props.statistics.total_flash_change_income))
const dayExchangeCost = computed(() => parseNum(props.statistics.day_flash_change_cost))
const totalExchangeCost = computed(() => parseNum(props.statistics.total_flash_change_cost))
const dayNetProfit = computed(() => parseNum(props.statistics.day_profit))
const totalProfit = computed(() => parseNum(props.statistics.total_profit))
const dayNewAgents = computed(() => props.statistics.day_user_num ?? 0)
const totalAgents = computed(() => props.statistics.total_user_num ?? 0)
const dayBotIncome = computed(() => parseNum(props.statistics.day_bot_income))
const totalBotIncome = computed(() => parseNum(props.statistics.total_bot_income))
const dayBotNum = computed(() => props.statistics.day_bot_num ?? 0)
const totalBotNum = computed(() => props.statistics.total_bot_num ?? 0)
const dayActiveIncome = computed(() => parseNum(props.statistics.day_active_income))
const totalActiveIncome = computed(() => parseNum(props.statistics.total_active_income))
const dayActiveCost = computed(() => parseNum(props.statistics.day_active_cost))
const totalActiveCost = computed(() => parseNum(props.statistics.total_active_cost))
const dayBandwidthCost = computed(() => {
  const value = props.statistics.day_bandwidth_cost
  return value !== undefined ? String(value) : '0'
})
const totalBandwidthCost = computed(() => {
  const value = props.statistics.total_bandwidth_cost
  return value !== undefined ? String(value) : '0'
})
</script>

<template>
  <ElRow :gutter="16" justify="space-between" :class="prefixCls">
    <!-- 第一行：4个卡片 -->
    <!-- 今日能量收入 -->
    <ElCol :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
      <ElCard shadow="hover" class="mb-[20px]">
        <ElSkeleton :loading="props.isLoading" animated :rows="3">
          <template #default>
            <div class="min-h-[100px] flex justify-between">
              <div class="flex items-center">
                <div class="p-4 inline-block rounded-[6px] text-[#40c9c6] hover:bg-[#40c9c6] group">
                  <Icon
                    icon="mdi:lightning-bolt"
                    :size="50"
                    class="group-hover:text-white transition duration-300 ease-out"
                  />
                </div>
              </div>
              <div class="flex flex-col justify-between text-right break-all min-w-0">
                <div class="text-[16px] text-gray-500 mb-2"> 今日能量收入 </div>
                <div class="text-[20px] font-bold flex items-center justify-end min-w-0">
                  <CountTo
                    :start-val="0"
                    :end-val="dayEnergyIncome"
                    :duration="2600"
                    :decimals="2"
                  />
                  <span class="ml-[5px] text-[14px]">TRX</span>
                </div>
                <div class="text-[12px] text-gray-400 mt-[4px]">
                  <span>总能量收入 </span>
                  <CountTo
                    :start-val="0"
                    :end-val="totalEnergyIncome"
                    :duration="2600"
                    :decimals="2"
                  />
                  <span class="ml-[3px]">TRX</span>
                </div>
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <!-- 今日闪兑收入 -->
    <ElCol :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
      <ElCard shadow="hover" class="mb-[20px]">
        <ElSkeleton :loading="props.isLoading" animated :rows="3">
          <template #default>
            <div class="min-h-[100px] flex justify-between">
              <div class="flex items-center">
                <div class="p-4 inline-block rounded-[6px] text-[#36a3f7] hover:bg-[#36a3f7] group">
                  <Icon
                    icon="mdi:swap-horizontal"
                    :size="50"
                    class="group-hover:text-white transition duration-300 ease-out"
                  />
                </div>
              </div>
              <div class="flex flex-col justify-between text-right break-all min-w-0">
                <div class="text-[16px] text-gray-500 mb-2"> 今日闪兑收入 </div>
                <div class="text-[20px] font-bold flex items-center justify-end min-w-0">
                  <CountTo
                    :start-val="0"
                    :end-val="dayExchangeIncome"
                    :duration="2600"
                    :decimals="2"
                  />
                  <span class="ml-[5px] text-[14px]">TRX</span>
                </div>
                <div class="text-[12px] text-gray-400 mt-[4px]">
                  <span>总闪兑收入 </span>
                  <CountTo
                    :start-val="0"
                    :end-val="totalExchangeIncome"
                    :duration="2600"
                    :decimals="2"
                  />
                  <span class="ml-[3px]">TRX</span>
                </div>
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <!-- 今日闪兑支出 -->
    <ElCol :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
      <ElCard shadow="hover" class="mb-[20px]">
        <ElSkeleton :loading="props.isLoading" animated :rows="3">
          <template #default>
            <div class="min-h-[100px] flex justify-between">
              <div class="flex items-center">
                <div class="p-4 inline-block rounded-[6px] text-[#ff9900] hover:bg-[#ff9900] group">
                  <Icon
                    icon="mdi:swap-vertical"
                    :size="50"
                    class="group-hover:text-white transition duration-300 ease-out"
                  />
                </div>
              </div>
              <div class="flex flex-col justify-between text-right break-all min-w-0">
                <div class="text-[16px] text-gray-500 mb-2"> 今日闪兑支出 </div>
                <div class="text-[20px] font-bold flex items-center justify-end min-w-0">
                  <CountTo
                    :start-val="0"
                    :end-val="dayExchangeCost"
                    :duration="2600"
                    :decimals="2"
                  />
                  <span class="ml-[5px] text-[14px]">TRX</span>
                </div>
                <div class="text-[12px] text-gray-400 mt-[4px]">
                  <span>总闪兑支出 </span>
                  <CountTo
                    :start-val="0"
                    :end-val="totalExchangeCost"
                    :duration="2600"
                    :decimals="2"
                  />
                  <span class="ml-[3px]">TRX</span>
                </div>
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <!-- 今日净利润 -->
    <ElCol :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
      <ElCard shadow="hover" class="mb-[20px]">
        <ElSkeleton :loading="props.isLoading" animated :rows="3">
          <template #default>
            <div class="min-h-[100px] flex justify-between">
              <div class="flex items-center">
                <div class="p-4 inline-block rounded-[6px] text-[#9c27b0] hover:bg-[#9c27b0] group">
                  <Icon
                    icon="mdi:cash-plus"
                    :size="50"
                    class="group-hover:text-white transition duration-300 ease-out"
                  />
                </div>
              </div>
              <div class="flex flex-col justify-between text-right break-all min-w-0">
                <div class="text-[16px] text-gray-500 mb-2"> 今日净利润 </div>
                <div class="text-[20px] font-bold flex items-center justify-end min-w-0">
                  <CountTo :start-val="0" :end-val="dayNetProfit" :duration="2600" :decimals="2" />
                  <span class="ml-[5px] text-[14px]">TRX</span>
                </div>
                <div class="text-[12px] text-gray-400 mt-[4px]">
                  <span>总利润 </span>
                  <CountTo :start-val="0" :end-val="totalProfit" :duration="2600" :decimals="2" />
                  <span class="ml-[3px]">TRX</span>
                </div>
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <!-- 第二行：3个卡片 -->
    <!-- 今日新增代理 -->
    <ElCol :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
      <ElCard shadow="hover" class="mb-[20px]">
        <ElSkeleton :loading="props.isLoading" animated :rows="3">
          <template #default>
            <div class="min-h-[100px] flex justify-between">
              <div class="flex items-center">
                <div class="p-4 inline-block rounded-[6px] text-[#ffcc00] hover:bg-[#ffcc00] group">
                  <Icon
                    icon="mdi:account-group"
                    :size="50"
                    class="group-hover:text-white transition duration-300 ease-out"
                  />
                </div>
              </div>
              <div class="flex flex-col justify-between text-right break-all min-w-0">
                <div class="text-[16px] text-gray-500 mb-2"> 今日新增代理 </div>
                <div class="text-[20px] font-bold flex items-center justify-end min-w-0">
                  <CountTo :start-val="0" :end-val="dayNewAgents" :duration="2600" :decimals="0" />
                </div>
                <div class="text-[12px] text-gray-400 mt-[4px]">
                  <span>代理总数 </span>
                  <CountTo :start-val="0" :end-val="totalAgents" :duration="2600" :decimals="0" />
                </div>
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <!-- 今日机器人收入/数量 -->
    <ElCol :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
      <ElCard shadow="hover" class="mb-[20px]">
        <ElSkeleton :loading="props.isLoading" animated :rows="3">
          <template #default>
            <div class="min-h-[100px] flex justify-between">
              <div class="flex items-center">
                <div class="p-4 inline-block rounded-[6px] text-[#00bcd4] hover:bg-[#00bcd4] group">
                  <Icon
                    icon="mdi:robot"
                    :size="50"
                    class="group-hover:text-white transition duration-300 ease-out"
                  />
                </div>
              </div>
              <div class="flex flex-col justify-between text-right break-all min-w-0">
                <div class="text-[16px] text-gray-500 mb-2"> 今日机器人收入/数量 </div>
                <div class="text-[20px] font-bold flex items-center justify-end min-w-0">
                  <CountTo :start-val="0" :end-val="dayBotIncome" :duration="2600" :decimals="2" />
                  <span class="ml-[5px] text-[14px]">TRX</span>
                  <span class="ml-[5px] text-[14px]">/</span>
                  <CountTo :start-val="0" :end-val="dayBotNum" :duration="2600" :decimals="0" />
                  <span class="ml-[5px] text-[14px]">只</span>
                </div>
                <div class="text-[12px] text-gray-400 mt-[4px]">
                  <span>总收入 </span>
                  <CountTo
                    :start-val="0"
                    :end-val="totalBotIncome"
                    :duration="2600"
                    :decimals="2"
                  />
                  <span class="ml-[3px]">TRX</span>
                  <span class="mx-[3px]"> / </span>
                  <span>总数量 </span>
                  <CountTo :start-val="0" :end-val="totalBotNum" :duration="2600" :decimals="0" />
                  <span class="ml-[3px]">只</span>
                </div>
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <!-- 今日激活利润 -->
    <ElCol :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
      <ElCard shadow="hover" class="mb-[20px]">
        <ElSkeleton :loading="props.isLoading" animated :rows="3">
          <template #default>
            <div class="min-h-[100px] flex justify-between">
              <div class="flex items-center">
                <div class="p-4 inline-block rounded-[6px] text-[#34d399] hover:bg-[#34d399] group">
                  <Icon
                    icon="mdi:arrow-up-bold-circle-outline"
                    :size="50"
                    class="group-hover:text-white transition duration-300 ease-out"
                  />
                </div>
              </div>
              <div class="flex flex-col justify-between text-right break-all min-w-0">
                <div class="text-[16px] text-gray-500 mb-2"> 今日激活利润 </div>
                <div class="text-[20px] font-bold flex items-center justify-end min-w-0">
                  <CountTo
                    :start-val="0"
                    :end-val="dayActiveIncome"
                    :duration="2600"
                    :decimals="2"
                  />
                  <span class="ml-[5px] text-[14px]">TRX</span>
                </div>
                <div class="text-[12px] text-gray-400 mt-[4px]">
                  <span>总激活利润 </span>
                  <CountTo
                    :start-val="0"
                    :end-val="totalActiveIncome"
                    :duration="2600"
                    :decimals="2"
                  />
                  <span class="ml-[3px]">TRX</span>
                </div>
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>
  </ElRow>
  <!-- 新增带宽支出行：两个卡片各占一半 -->
  <ElRow :gutter="16" justify="space-between" :class="prefixCls">
    <ElCol :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
      <ElCard shadow="hover" class="mb-[20px]">
        <ElSkeleton :loading="props.isLoading" animated :rows="3">
          <template #default>
            <div class="min-h-[100px] flex justify-between">
              <div class="flex items-center">
                <div class="p-4 inline-block rounded-[6px] text-[#f44336] hover:bg-[#f44336] group">
                  <Icon
                    icon="mdi:network-outline"
                    :size="50"
                    class="group-hover:text-white transition duration-300 ease-out"
                  />
                </div>
              </div>
              <div class="flex flex-col justify-between text-right break-all min-w-0">
                <div class="text-[16px] text-gray-500 mb-2"> 今日带宽支出 </div>
                <div class="text-[20px] font-bold flex items-center justify-end min-w-0">
                  {{ dayBandwidthCost }}
                </div>
                <div class="text-[12px] text-gray-400 mt-[4px]">
                  <span>总带宽支出 </span>
                  {{ totalBandwidthCost }}
                </div>
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <ElCol :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
      <ElCard shadow="hover" class="mb-[20px]">
        <ElSkeleton :loading="props.isLoading" animated :rows="3">
          <template #default>
            <div class="min-h-[100px] flex justify-between">
              <div class="flex items-center">
                <div class="p-4 inline-block rounded-[6px] text-[#9c27b0] hover:bg-[#9c27b0] group">
                  <Icon
                    icon="mdi:chart-line-variant"
                    :size="50"
                    class="group-hover:text-white transition duration-300 ease-out"
                  />
                </div>
              </div>
              <div class="flex flex-col justify-between text-right break-all min-w-0">
                <div class="text-[16px] text-gray-500 mb-2"> 总带宽支出 </div>
                <div class="text-[20px] font-bold flex items-center justify-end min-w-0">
                  {{ totalBandwidthCost }}
                </div>
                <div class="text-[12px] text-gray-400 mt-[4px]">
                  <span>今日带宽支出 </span>
                  {{ dayBandwidthCost }}
                </div>
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>
  </ElRow>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{adminNamespace}-panel';

:deep(.el-card__body) {
  padding: 0.75rem !important; // 暂时保留，看是否能通过 ElCard prop 或其他方式替代
}
</style>
