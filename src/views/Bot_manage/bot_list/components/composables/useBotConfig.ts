import { ref, reactive } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import {
  getBotDetailApi,
  syncTgStatusApi,
  updateBotAllConfigsApi,
  getBotPaymentConfigApi,
  getBotTimeEnergyConfigApi,
  getBotCountEnergyConfigApi,
  getBotManagedModeConfigApi,
  getBotBatchOrderConfigApi,
  getBotFlashExchangeConfigApi,
  getCountEnergyConfigApi,
  updateBotApi,
  updateBotPaymentConfigApi,
  updateBotTimeEnergyConfigApi,
  updateBotCountEnergyConfigApi,
  updateBotManagedModeConfigApi,
  updateBotBatchOrderConfigApi,
  updateBotFlashExchangeConfigApi,
  updateWelfarePriceConfigApi
} from '@/api/botlist'

// 定义通用的API响应类型
type ApiResponse = Promise<{
  code: string | number
  data?: any
  message?: string
}>

// 移除假设的成本价API调用
// const getCostPricesApi = () => {
//   return fetch('/bot/cost-prices').then((res) => res.json())
// }

export function useBotConfig() {
  // 共享状态
  const dialogVisible = ref(false)
  const activeTab = ref('botInfo')
  const currentBot = ref<Record<string, any>>({})
  const tgStatus = ref('pending')
  const syncing = ref(false)
  const loading = ref(false)
  const submitting = ref(false)

  // 添加新的 agentPrices 状态来存储从 API 获取的成本价
  const agentPrices = reactive<Record<string, any>>({})

  // TG状态同步
  const syncTgStatus = async () => {
    if (syncing.value) return

    try {
      syncing.value = true
      ElMessage.info('正在同步TG状态...')

      const res = await syncTgStatusApi(currentBot.value.id)
      const data = res.data || {}

      // 更新状态
      tgStatus.value = data.status || 'pending'

      ElMessage.success('TG状态同步' + (tgStatus.value === 'success' ? '成功' : '失败'))
    } catch (error) {
      console.error('TG状态同步失败:', error)
      ElMessage.error('TG状态同步失败，请稍后重试')
      // 同步失败时设置为error状态
      tgStatus.value = 'error'
    } finally {
      syncing.value = false
    }
  }

  // 加载机器人配置
  const loadBotAllConfigs = async (id: number, formMethods: any, formType?: string) => {
    if (!id) {
      ElMessage.error('机器人ID不能为空')
      return
    }

    const loadingInstance = ElLoading.service({
      target: '.el-dialog__body',
      text: '加载配置中...'
    })

    loading.value = true

    try {
      // 策略模式：定义加载各种表单类型的策略
      const loadStrategies = {
        // 基本信息加载策略
        botInfo: async () => {
          try {
            // 1. 先加载基本信息
            const botInfoRes = await getBotPaymentConfigApi(id)
            const botInfo = botInfoRes.data || {}

            // 设置TG同步状态
            tgStatus.value = botInfo.tgVerifyStatus || 'pending'

            formMethods.botInfo.setValues({
              ...botInfo,
              id: botInfo.id || '',
              botName: botInfo.botName || '',
              botUsername: botInfo.botUsername || '',
              botToken: botInfo.botToken || '',
              apiKey: botInfo.apiKey || '',
              adminTgAccount: botInfo.adminTgAccount || '',
              remark: botInfo.remark || '',
              status: botInfo.status === undefined ? true : botInfo.status
            })

            // 更新当前机器人对象
            currentBot.value = botInfo

            // 2. --- 新增：在 botInfo 策略中获取成本价 ---
            try {
              const timeEnergyConfigRes = await getBotTimeEnergyConfigApi(id)
              const fetchedAgentPrices = timeEnergyConfigRes.data?.agent_price || {} // 获取 agent_price
              // 清空旧的 agentPrices，确保每次加载都是最新的
              for (const key in agentPrices) {
                delete agentPrices[key]
              }
              // 更新 agentPrices 状态
              Object.keys(fetchedAgentPrices).forEach((key) => {
                agentPrices[key] = fetchedAgentPrices[key]
              })
              console.log('Fetched agentPrices in botInfo strategy:', agentPrices)
            } catch (error) {
              console.error('加载成本价配置失败 (in botInfo strategy):', error)
              // 清空旧数据，即使加载失败
              for (const key in agentPrices) {
                delete agentPrices[key]
              }
              // 这里可以选择是否提示用户，或者静默失败
              // ElMessage.error('加载成本价配置失败')
            }
            // --- 结束新增 ---

            return true
          } catch (error) {
            console.error('加载基本信息失败:', error)
            // 如果基本信息加载失败，也应该清空成本价
            for (const key in agentPrices) {
              delete agentPrices[key]
            }
            return false
          }
        },

        // 收款配置加载策略
        payment: async () => {
          try {
            const paymentConfigRes = await getBotPaymentConfigApi(id)
            const paymentConfig = paymentConfigRes.data || {}
            console.log('paymentConfig', paymentConfigRes.data)
            formMethods.payment.setValues({
              username: paymentConfig.user_name || '',
              energy_address: paymentConfig.energy_address || '',
              receive_address: paymentConfig.receive_address || '',
              energy_usdt_address: paymentConfig.energy_usdt_address || '',
              notice_order_tg_admin: paymentConfig.notice_order_tg_admin || 2
            })
            return true
          } catch (error) {
            console.error('加载收款配置失败:', error)
            return false
          }
        },

        // 时间能量加载策略
        timeEnergy: async () => {
          try {
            // 这里仍然需要获取时间能量配置以设置表单
            const timeEnergyConfigRes = await getBotTimeEnergyConfigApi(id)
            const timeEnergyConfig = timeEnergyConfigRes.data || {}

            // 设置表单值 (保留)
            console.log('timeEnergyConfig', timeEnergyConfig)
            formMethods.timeEnergy.setValues({
              flash_price: timeEnergyConfig.flash_price,
              flash_addr_price: timeEnergyConfig.flash_addr_price,
              flash_time_max_num: timeEnergyConfig.flash_time_max_num,
              day_1_price: timeEnergyConfig.day_1_price,
              day_3_price: timeEnergyConfig.day_3_price,
              day_7_price: timeEnergyConfig.day_7_price,
              day_15_price: timeEnergyConfig.day_15_price
            })
            return true
          } catch (error) {
            console.error('加载时间能量价格配置失败:', error)
            return false
          }
        },

        // 笔数能量加载策略
        countEnergy: async () => {
          try {
            const countEnergyConfigRes = await getCountEnergyConfigApi(id)
            const countEnergyConfig = countEnergyConfigRes.data || {}

            const countEnergyValues = {
              count_pay_type: countEnergyConfig.count_pay_type,
              count_price_trx: countEnergyConfig.count_price_trx || 0,
              count_price_usdt: countEnergyConfig.count_price_usdt || 0,
              notifyUser: countEnergyConfig.notifyUser || false,
              notifyGroupOwner: countEnergyConfig.notifyGroupOwner || false,
              notifyAdmin: countEnergyConfig.notifyAdmin || false
            }

            // 设置表单值
            formMethods.countEnergy.setValues(countEnergyValues)
            return true
          } catch (error) {
            console.error('加载笔数能量价格配置失败:', error)
            return false
          }
        },

        // 托管模式加载策略
        managedMode: async () => {
          try {
            const managedModeConfigRes = await getCountEnergyConfigApi(id)
            const managedModeConfig = managedModeConfigRes.data || {}

            const managedModeValues = {
              delegate_price_trx: managedModeConfig.delegate_price_trx || 0,
              enable_custom_delegate: managedModeConfig.enable_custom_delegate || false,
              price_trx_65000: managedModeConfig.price_trx_65000 || 0,
              price_trx_131000: managedModeConfig.price_trx_131000 || 0
            }

            // 设置表单值
            formMethods.managedMode.setValues(managedModeValues)
            return true
          } catch (error) {
            console.error('加载托管模式价格配置失败:', error)
            return false
          }
        },

        // 批量下单加载策略
        batchOrder: async () => {
          try {
            const batchOrderConfigRes = await getCountEnergyConfigApi(id)
            const batchOrderConfig = batchOrderConfigRes.data || {}

            const batchOrderValues = {
              batch_energy_price: batchOrderConfig.batch_energy_price || 0,
              batch_active_price: batchOrderConfig.batch_active_price || 0
            }

            // 设置表单值
            formMethods.batchOrder.setValues(batchOrderValues)
            return true
          } catch (error) {
            console.error('加载批量下单价格配置失败:', error)
            return false
          }
        },

        // 闪兑加载策略
        flashExchange: async () => {
          try {
            const flashExchangeConfigRes = await getCountEnergyConfigApi(id)
            const flashExchangeConfig = flashExchangeConfigRes.data.exchange || {}

            const flashExchangeValues = {
              transfer_address: flashExchangeConfig.transfer_address || '',
              min_trx_balance: flashExchangeConfig.min_trx_balance || 0,
              profit_usdt_to_trx: flashExchangeConfig.profit_usdt_to_trx || 0,
              max_usdt_to_trx: flashExchangeConfig.max_usdt_to_trx || 0,
              stock_notice: flashExchangeConfig.stock_notice || false,
              stock_notice_trx_amount: flashExchangeConfig.stock_notice_trx_amount || 0
            }

            // 设置表单值
            formMethods.flashExchange.setValues(flashExchangeValues)
            return true
          } catch (error) {
            console.error('加载闪兑配置失败:', error)
            return false
          }
        },

        // 福利价格配置加载策略
        welfarePrice: async () => {
          try {
            // 这里仍然需要获取时间能量配置以设置表单
            const welfarePriceRes = await getBotTimeEnergyConfigApi(id)
            const welfarePriceConfig = welfarePriceRes.data || {}

            // 设置表单值 (保留)
            console.log('welfarePriceConfig', welfarePriceConfig)
            formMethods.welfarePrice.setValues({
              weal_address: currentBot.value.weal_address,
              weal_price_trx: welfarePriceConfig.weal_price_trx,
              hour_limit_count: welfarePriceConfig.hour_limit_count || 0,
              total_limit_count: welfarePriceConfig.total_limit_count || 0,
              check_resource_status: welfarePriceConfig.check_resource_status || 2
            })
            return true
          } catch (error) {
            console.error('加载时间能量价格配置失败:', error)
            return false
          }
        }
      }

      // 如果指定了表单类型，则只加载该类型的表单
      if (formType) {
        const strategy = loadStrategies[formType]

        if (!strategy) {
          ElMessage.warning(`未知的表单类型: ${formType}`)
          return
        }

        await strategy()
      }
      // 如果没有指定表单类型，则加载所有表单（兼容原有逻辑）
      else {
        const strategyNames = Object.keys(loadStrategies)

        // 执行所有可用的策略
        for (const name of strategyNames) {
          if (formMethods[name]) {
            try {
              await loadStrategies[name]()
            } catch (error) {
              console.error(`执行${name}加载策略失败:`, error)
            }
          }
        }
      }
    } catch (error) {
      console.error('加载机器人配置失败:', error)
      ElMessage.error('加载机器人配置失败，请稍后重试')
    } finally {
      // 延迟关闭loading状态，给用户更好的体验
      setTimeout(() => {
        loading.value = false
        loadingInstance.close()
      }, 500)
    }
  }

  // 提交表单
  const submitConfig = async (formMethods: any, formType?: string) => {
    if (submitting.value) return false

    submitting.value = true
    // ElMessage.info('正在保存配置...')

    try {
      if (!currentBot.value.id) {
        ElMessage.error('机器人ID不能为空')
        return false
      }

      const id = currentBot.value.id
      let hasError = false
      let result = false

      // 策略模式：定义处理各种表单类型的策略对象
      const formStrategies = {
        // 基本信息配置策略
        botInfo: async () => {
          if (!formMethods.botInfo) return false
          try {
            const botInfoData = await formMethods.botInfo.getFormData()
            await updateBotApi({ ...botInfoData, id })
            return true
          } catch (error) {
            console.error('保存基本信息配置失败:', error)
            return false
          }
        },

        // 收款配置策略
        payment: async () => {
          if (!formMethods.payment) return false
          try {
            const paymentData = await formMethods.payment.getFormData()
            await updateBotPaymentConfigApi({ ...paymentData, id })
            return true
          } catch (error) {
            console.error('保存收款配置失败:', error)
            return false
          }
        },

        // 时间能量配置策略
        timeEnergy: async () => {
          if (!formMethods.timeEnergy) return false
          try {
            const timeEnergyData = await formMethods.timeEnergy.getFormData()
            // 检查所有带有price的字段，确保它们不为0
            const hasPriceFieldWithZero = Object.keys(timeEnergyData).some((key) => {
              return (
                key.includes('price') && (timeEnergyData[key] === 0 || timeEnergyData[key] === '0')
              )
            })

            if (hasPriceFieldWithZero) {
              ElMessage.error('价格不能为0，请检查配置')
              return false
            }

            await updateBotTimeEnergyConfigApi({ ...timeEnergyData, id })
            return true
          } catch (error) {
            console.error('保存时间能量配置失败:', error)
            return false
          }
        },

        // 笔数能量配置策略
        countEnergy: async () => {
          if (!formMethods.countEnergy) return false
          try {
            const countEnergyData = await formMethods.countEnergy.getFormData()
            await updateBotCountEnergyConfigApi({ ...countEnergyData, id })
            return true
          } catch (error) {
            console.error('保存笔数能量配置失败:', error)
            return false
          }
        },

        // 托管模式配置策略
        managedMode: async () => {
          if (!formMethods.managedMode) return false
          try {
            const managedModeData = await formMethods.managedMode.getFormData()
            await updateBotManagedModeConfigApi({ ...managedModeData, id })
            return true
          } catch (error) {
            console.error('保存托管模式配置失败:', error)
            return false
          }
        },

        // 批量下单配置策略
        batchOrder: async () => {
          if (!formMethods.batchOrder) return false
          try {
            const batchOrderData = await formMethods.batchOrder.getFormData()
            await updateBotBatchOrderConfigApi({ ...batchOrderData, id })
            return true
          } catch (error) {
            console.error('保存批量下单配置失败:', error)
            return false
          }
        },

        // 闪兑配置策略
        flashExchange: async () => {
          if (!formMethods.flashExchange) return false
          try {
            const flashExchangeData = await formMethods.flashExchange.getFormData()
            await updateBotFlashExchangeConfigApi({ ...flashExchangeData, id })
            return true
          } catch (error) {
            console.error('保存闪兑配置失败:', error)
            return false
          }
        },

        welfarePrice: async () => {
          if (!formMethods.welfarePrice) return false
          try {
            const welfarePriceData = await formMethods.welfarePrice.getFormData()

            await updateWelfarePriceConfigApi({ ...welfarePriceData, id })
            // 临时返回成功，等待API接口确认
            console.log('福利价格配置数据:', welfarePriceData)
            ElMessage.success('福利价格配置已保存')
            return true
          } catch (error) {
            console.error('保存福利价格配置失败:', error)
            return false
          }
        }
      }

      // 如果指定了表单类型，则只处理该类型的表单
      if (formType) {
        const strategy = formStrategies[formType]

        if (!strategy) {
          ElMessage.warning(`未知的表单类型: ${formType}`)
          submitting.value = false
          return false
        }

        result = await strategy()
        console.log('result', result)
        if (result) {
          console.log('res>>>>>>>>>>>>>>>>>>>>>>>>ult', result)
          ElMessage.success('配置保存成功')
        } else {
          ElMessage.error('配置保存失败，请稍后重试')
          hasError = true
        }

        submitting.value = false
        return result
      }
      // 如果没有指定表单类型，则处理所有表单（兼容原有逻辑）
      else {
        const promises: ApiResponse[] = []
        const strategyNames = Object.keys(formStrategies)

        // 执行所有可用的策略
        for (const name of strategyNames) {
          if (formMethods[name]) {
            try {
              const success = await formStrategies[name]()
              if (!success) {
                hasError = true
              }
            } catch (error) {
              console.error(`执行${name}策略失败:`, error)
              hasError = true
            }
          }
        }

        if (hasError) {
          ElMessage.warning('部分配置保存失败，请检查日志')
        } else {
          ElMessage.success('配置保存成功')
        }

        submitting.value = false
        return !hasError
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      ElMessage.error('保存配置失败，请稍后重试')
      submitting.value = false
      return false
    }
  }

  return {
    dialogVisible,
    activeTab,
    currentBot,
    tgStatus,
    syncing,
    loading,
    submitting,
    agentPrices,
    syncTgStatus,
    loadBotAllConfigs,
    submitConfig
  }
}
