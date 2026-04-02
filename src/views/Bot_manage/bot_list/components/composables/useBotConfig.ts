// 机器人配置管理 - 使用新接口 v1GetBotDetail
import { ref, reactive } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import {
  v1GetBotDetail,
  v1GetBotPriceConfig,
  v1GetSystemPrice,
  v1GetAddressList,
  v1UpdateBot,
  v1UpdateBotPrice,
  syncTgStatusApi,
  updateBotPaymentConfigApi
} from '@/api/botlist'

export function useBotConfig() {
  // 共享状态
  const dialogVisible = ref(false)
  const activeTab = ref('botInfo')
  const currentBot = ref<Record<string, any>>({})
  const tgStatus = ref('pending')
  const syncing = ref(false)
  const loading = ref(false)
  const submitting = ref(false)

  // 价格配置数据（每次调用接口获取，不缓存）
  const priceConfig = reactive<Record<string, any>>({})

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
      // 存储机器人ID
      currentBot.value.id = id

      // 策略模式：定义加载各种表单类型的策略
      const loadStrategies = {
        // 基本信息加载策略
        botInfo: async () => {
          try {
            // 每次切换都重新获取机器人详情
            console.log('获取机器人详情，ID:', id)
            const botDetailRes = await v1GetBotDetail(id)

            if (botDetailRes.code === '000000' && botDetailRes.data) {
              currentBot.value = botDetailRes.data
              console.log('机器人详情获取成功:', botDetailRes.data)
            } else {
              ElMessage.error('获取机器人详情失败')
              return false
            }

            // 获取系统成本价（用于显示成本价）
            console.log('获取系统成本价')
            const systemPriceRes = await v1GetSystemPrice()

            if (systemPriceRes.code === '000000' && systemPriceRes.data) {
              // 清空并更新 priceConfig.agent_price（成本价）
              if (!priceConfig.agent_price) {
                priceConfig.agent_price = {}
              }

              const systemPrice = systemPriceRes.data

              // 映射成本价字段名（用于表单显示成本价）- 将 string 转换为 number
              priceConfig.agent_price.flash_rent_price = parseFloat(systemPrice.flash)
              priceConfig.agent_price.day_1_price = parseFloat(systemPrice.time_1d)
              priceConfig.agent_price.day_3_price = parseFloat(systemPrice.time_3d)
              priceConfig.agent_price.day_7_price = parseFloat(systemPrice.time_7d)
              priceConfig.agent_price.day_15_price = parseFloat(systemPrice.time_15d)
              priceConfig.agent_price.day_30_price = parseFloat(systemPrice.time_30d)
              priceConfig.agent_price.count_price = parseFloat(systemPrice.stroke) // 笔数能量标签页使用
              priceConfig.agent_price.count_price_trx = parseFloat(systemPrice.stroke)
              priceConfig.agent_price.count_price_usdt = parseFloat(systemPrice.stroke_usdt)
              priceConfig.agent_price.manage_price_65000 = parseFloat(systemPrice.hosting_65k) // 托管模式标签页使用
              priceConfig.agent_price.manage_price_13100 = parseFloat(systemPrice.hosting_131k) // 托管模式标签页使用
              priceConfig.agent_price.price_trx_65000 = parseFloat(systemPrice.hosting_65k)
              priceConfig.agent_price.price_trx_131000 = parseFloat(systemPrice.hosting_131k)
              priceConfig.agent_price.profit_usdt_to_trx = parseFloat(systemPrice.usdt_2_trx)
              priceConfig.agent_price.profit_trx_to_usdt = parseFloat(systemPrice.trx_2_usdt)
              priceConfig.agent_price.batch_energy_price = parseFloat(systemPrice.batch_flash)
              priceConfig.agent_price.batch_active_price = parseFloat(systemPrice.active)
              priceConfig.agent_price.weal_price_trx = parseFloat(systemPrice.weal_time_1h)

              console.log('系统成本价获取成功:', priceConfig.agent_price)
            }

            // 使用获取的机器人详情数据
            const botInfo = currentBot.value

            // 设置TG同步状态
            tgStatus.value = botInfo.tgVerifyStatus || 'pending'

            formMethods.botInfo.setValues({
              tg_bot_id: botInfo.id || '',
              firstname: botInfo.first_name || '',
              name: botInfo.user_name || '',
              token: botInfo.token || '',
              api_key: botInfo.apiKey || '', // 保留数据映射，但表单中已隐藏
              tg_admin: botInfo.tg_admin || '',
              describe: botInfo.describe || '',
              status: botInfo.status || 2
            })

            return true
          } catch (error) {
            console.error('加载基本信息失败:', error)
            return false
          }
        },

        // 收款配置加载策略
        payment: async () => {
          try {
            // 1. 获取系统成本价（用于显示成本价）
            console.log('获取系统成本价')
            const systemPriceRes = await v1GetSystemPrice()

            if (systemPriceRes.code === '000000' && systemPriceRes.data) {
              if (!priceConfig.agent_price) {
                priceConfig.agent_price = {}
              }
              Object.assign(priceConfig.agent_price, systemPriceRes.data)
              console.log('系统成本价获取成功:', priceConfig.agent_price)
            }

            // 2. 获取 Address 地址列表（表单数据）
            console.log('获取 Address 地址列表，bot_id:', id)
            const addressListRes = await v1GetAddressList({
              bot_id: id,
              current_page: 1,
              page_size: 100 // 获取所有地址
            })

            console.log('Address 接口完整响应:', addressListRes)

            if (addressListRes.code === '000000' && addressListRes.data) {
              const addressList = addressListRes.data.list || []
              console.log('Address 地址列表获取成功，数量:', addressList.length)
              console.log('Address 地址列表详情:', addressList)

              if (addressList.length === 0) {
                console.warn('该机器人还未配置任何收款地址')
                ElMessage.warning('该机器人还未配置收款地址，请先添加地址')
              }

              // 打印每个地址的 kind 值
              addressList.forEach((item, index) => {
                console.log(`地址 ${index + 1}: kind=${item.kind}, address=${item.address}`)
              })

              // 根据 kind 类型提取不同的地址
              // Kind 值定义：
              // 1-代理充值, 2-用户充值, 3-兑换(TRX-USDT), 4-时间能量(闪租), 5-笔数能量,
              // 6-福利能量, 7-快速能量, 8-自动托管, 9-批量能量, 10-批量激活, 11-机器人付费

              // 注意：kind 可能是数字或字符串，需要兼容处理
              const timeEnergyAddress = addressList.find(
                (item) => item.kind === 4 || item.kind === '4'
              ) // 【1小时能量闪租】收款钱包地址
              const userDepositAddress = addressList.find(
                (item) => item.kind === 2 || item.kind === '2'
              ) // 【余额充值】收款钱包地址
              const strokeEnergyAddress = addressList.find(
                (item) => item.kind === 5 || item.kind === '5'
              ) // 【按笔数购买】TRX/USDT收款钱包地址

              console.log('找到的地址:')
              console.log('- 时间能量地址 (kind=4):', timeEnergyAddress)
              console.log('- 用户充值地址 (kind=2):', userDepositAddress)
              console.log('- 笔数能量地址 (kind=5):', strokeEnergyAddress)

              const formValues = {
                username: currentBot.value.user_name || '',
                energy_address: timeEnergyAddress?.address || '', // kind=4: 时间能量（闪租）
                receive_address: userDepositAddress?.address || '', // kind=2: 用户充值
                energy_usdt_address: strokeEnergyAddress?.address || '', // kind=5: 笔数能量
                notice_order_tg_admin: 2 // TODO: 从哪里获取？
              }

              console.log('设置表单值:', formValues)
              formMethods.payment.setValues(formValues)
            } else {
              console.error('Address 接口返回失败:', addressListRes)
            }

            return true
          } catch (error) {
            console.error('加载收款配置失败:', error)
            return false
          }
        },

        // 时间能量加载策略
        timeEnergy: async () => {
          try {
            // 1. 获取系统成本价（用于显示成本价）
            console.log('获取系统成本价')
            const systemPriceRes = await v1GetSystemPrice()

            if (systemPriceRes.code === '000000' && systemPriceRes.data) {
              if (!priceConfig.agent_price) {
                priceConfig.agent_price = {}
              }

              const systemPrice = systemPriceRes.data

              // 映射成本价字段名（用于表单显示成本价）- 将 string 转换为 number
              priceConfig.agent_price.flash_rent_price = parseFloat(systemPrice.flash)
              priceConfig.agent_price.day_1_price = parseFloat(systemPrice.time_1d)
              priceConfig.agent_price.day_3_price = parseFloat(systemPrice.time_3d)
              priceConfig.agent_price.day_7_price = parseFloat(systemPrice.time_7d)
              priceConfig.agent_price.day_15_price = parseFloat(systemPrice.time_15d)
              priceConfig.agent_price.day_30_price = parseFloat(systemPrice.time_30d)

              console.log('系统成本价获取成功:', priceConfig.agent_price)
            }

            // 2. 获取代理设置的价格（表单数据）
            console.log('获取代理设置的价格，ID:', id)
            const botPriceConfigRes = await v1GetBotPriceConfig(id)

            if (botPriceConfigRes.code === '000000' && botPriceConfigRes.data) {
              const botPriceData = botPriceConfigRes.data
              console.log('代理设置的价格获取成功:', botPriceData)

              // 从 agent_price 中提取时间能量相关字段
              const agentPrice = botPriceData.agent_price || {}

              const timeEnergyValues = {
                flash_price: agentPrice.flash || 0,
                flash_addr_price: agentPrice.flash || 0, // TODO: 确认字段映射
                flash_time_max_num: 0, // TODO: 从哪里获取？
                day_1_price: agentPrice.time_1d || 0,
                day_3_price: agentPrice.time_3d || 0,
                day_7_price: agentPrice.time_7d || 0,
                day_15_price: agentPrice.time_15d || 0,
                day_30_price: agentPrice.time_30d || 0
              }

              console.log('时间能量表单数据:', timeEnergyValues)

              // 设置表单值
              formMethods.timeEnergy.setValues(timeEnergyValues)
            }

            return true
          } catch (error) {
            console.error('加载时间能量价格配置失败:', error)
            return false
          }
        },

        // 笔数能量加载策略
        countEnergy: async () => {
          try {
            // 1. 获取系统成本价（用于显示成本价）
            console.log('获取系统成本价')
            const systemPriceRes = await v1GetSystemPrice()

            if (systemPriceRes.code === '000000' && systemPriceRes.data) {
              if (!priceConfig.agent_price) {
                priceConfig.agent_price = {}
              }

              const systemPrice = systemPriceRes.data
              priceConfig.agent_price.count_price = parseFloat(systemPrice.stroke) // 笔数能量标签页使用
              priceConfig.agent_price.count_price_trx = parseFloat(systemPrice.stroke)
              priceConfig.agent_price.count_price_usdt = parseFloat(systemPrice.stroke_usdt)

              console.log('系统成本价获取成功:', priceConfig.agent_price)
            }

            // 2. 获取代理设置的价格（表单数据）
            console.log('获取代理设置的价格，ID:', id)
            const botPriceConfigRes = await v1GetBotPriceConfig(id)

            if (botPriceConfigRes.code === '000000' && botPriceConfigRes.data) {
              const botPriceData = botPriceConfigRes.data
              console.log('代理设置的价格获取成功:', botPriceData)

              // 从 agent_price 中提取笔数能量相关字段
              const agentPrice = botPriceData.agent_price || {}

              const countEnergyValues = {
                count_pay_type: 0, // TODO: 从哪里获取？
                count_price_trx: agentPrice.stroke || 0,
                count_price_usdt: agentPrice.stroke_usdt || 0,
                notifyUser: false, // TODO: 从哪里获取？
                notifyGroupOwner: false, // TODO: 从哪里获取？
                notifyAdmin: false // TODO: 从哪里获取？
              }

              console.log('笔数能量表单数据:', countEnergyValues)

              // 设置表单值
              formMethods.countEnergy.setValues(countEnergyValues)
            }

            return true
          } catch (error) {
            console.error('加载笔数能量价格配置失败:', error)
            return false
          }
        },

        // 托管模式加载策略
        managedMode: async () => {
          try {
            // 1. 获取系统成本价（用于显示成本价）
            console.log('获取系统成本价')
            const systemPriceRes = await v1GetSystemPrice()

            if (systemPriceRes.code === '000000' && systemPriceRes.data) {
              if (!priceConfig.agent_price) {
                priceConfig.agent_price = {}
              }

              const systemPrice = systemPriceRes.data
              priceConfig.agent_price.manage_price_65000 = parseFloat(systemPrice.hosting_65k) // 托管模式标签页使用
              priceConfig.agent_price.manage_price_13100 = parseFloat(systemPrice.hosting_131k) // 托管模式标签页使用
              priceConfig.agent_price.price_trx_65000 = parseFloat(systemPrice.hosting_65k)
              priceConfig.agent_price.price_trx_131000 = parseFloat(systemPrice.hosting_131k)

              console.log('系统成本价获取成功:', priceConfig.agent_price)
            }

            // 2. 获取代理设置的价格（表单数据）
            console.log('获取代理设置的价格，ID:', id)
            const botPriceConfigRes = await v1GetBotPriceConfig(id)

            if (botPriceConfigRes.code === '000000' && botPriceConfigRes.data) {
              const botPriceData = botPriceConfigRes.data
              console.log('代理设置的价格获取成功:', botPriceData)

              // 从 agent_price 中提取托管模式相关字段
              const agentPrice = botPriceData.agent_price || {}

              const managedModeValues = {
                delegate_price_trx: 0, // TODO: 从哪里获取？
                enable_custom_delegate: false, // TODO: 从哪里获取？
                price_trx_65000: agentPrice.hosting_65k || 0,
                price_trx_131000: agentPrice.hosting_131k || 0
              }

              console.log('托管模式表单数据:', managedModeValues)

              // 设置表单值
              formMethods.managedMode.setValues(managedModeValues)
            }

            return true
          } catch (error) {
            console.error('加载托管模式价格配置失败:', error)
            return false
          }
        },

        // 批量下单加载策略
        batchOrder: async () => {
          try {
            // 1. 获取系统成本价（用于显示成本价）
            console.log('获取系统成本价')
            const systemPriceRes = await v1GetSystemPrice()

            if (systemPriceRes.code === '000000' && systemPriceRes.data) {
              if (!priceConfig.agent_price) {
                priceConfig.agent_price = {}
              }

              const systemPrice = systemPriceRes.data
              priceConfig.agent_price.batch_energy_price = parseFloat(systemPrice.batch_flash)
              priceConfig.agent_price.batch_active_price = parseFloat(systemPrice.active)

              console.log('系统成本价获取成功:', priceConfig.agent_price)
            }

            // 2. 获取代理设置的价格（表单数据）
            console.log('获取代理设置的价格，ID:', id)
            const botPriceConfigRes = await v1GetBotPriceConfig(id)

            if (botPriceConfigRes.code === '000000' && botPriceConfigRes.data) {
              const botPriceData = botPriceConfigRes.data
              console.log('代理设置的价格获取成功:', botPriceData)

              // 从 agent_price 中提取批量下单相关字段
              const agentPrice = botPriceData.agent_price || {}

              const batchOrderValues = {
                batch_energy_price: agentPrice.batch_flash || 0,
                batch_active_price: agentPrice.active || 0
              }

              console.log('批量下单表单数据:', batchOrderValues)

              // 设置表单值
              formMethods.batchOrder.setValues(batchOrderValues)
            }

            return true
          } catch (error) {
            console.error('加载批量下单价格配置失败:', error)
            return false
          }
        },

        // 闪兑加载策略
        flashExchange: async () => {
          try {
            // 1. 获取系统成本价（用于显示成本价）
            console.log('获取系统成本价')
            const systemPriceRes = await v1GetSystemPrice()

            if (systemPriceRes.code === '000000' && systemPriceRes.data) {
              if (!priceConfig.agent_price) {
                priceConfig.agent_price = {}
              }

              const systemPrice = systemPriceRes.data
              priceConfig.agent_price.profit_usdt_to_trx = parseFloat(systemPrice.usdt_2_trx)
              priceConfig.agent_price.profit_trx_to_usdt = parseFloat(systemPrice.trx_2_usdt)

              console.log('系统成本价获取成功:', priceConfig.agent_price)
            }

            // 2. 获取代理设置的价格（表单数据）
            console.log('获取代理设置的价格，ID:', id)
            const botPriceConfigRes = await v1GetBotPriceConfig(id)

            if (botPriceConfigRes.code === '000000' && botPriceConfigRes.data) {
              const botPriceData = botPriceConfigRes.data
              console.log('代理设置的价格获取成功:', botPriceData)

              // 从 agent_price 和其他字段中提取闪兑相关字段
              const agentPrice = botPriceData.agent_price || {}

              // 3. 获取闪兑收款地址（kind=3: 兑换 TRX-USDT）
              console.log('获取闪兑收款地址，bot_id:', id)
              const addressListRes = await v1GetAddressList({
                bot_id: id,
                kind: 3, // 兑换地址
                current_page: 1,
                page_size: 10
              })

              let exchangeAddress = ''
              if (addressListRes.code === '000000' && addressListRes.data) {
                const addressList = addressListRes.data.list || []
                console.log('闪兑地址列表:', addressList)

                // 查找 kind=3 的地址
                const exchangeAddressItem = addressList.find(
                  (item) => item.kind === 3 || item.kind === '3'
                )
                exchangeAddress = exchangeAddressItem?.address || ''
                console.log('找到的闪兑地址:', exchangeAddress)
              }

              const flashExchangeValues = {
                transfer_address: exchangeAddress, // kind=3: 兑换地址
                min_trx_balance: botPriceData.min_trx_balance || 0,
                profit_usdt_to_trx: agentPrice.usdt_2_trx || 0,
                max_usdt_to_trx: botPriceData.max_usdt_2_trx || 0,
                profit_trx_to_usdt: agentPrice.trx_2_usdt || 0,
                max_trx_to_usdt: botPriceData.max_trx_2_usdt || 0,
                stock_notice: false, // TODO: 从哪里获取？
                stock_notice_trx_amount: 0 // TODO: 从哪里获取？
              }

              console.log('闪兑表单数据:', flashExchangeValues)

              // 设置表单值
              formMethods.flashExchange.setValues(flashExchangeValues)
            }

            return true
          } catch (error) {
            console.error('加载闪兑配置失败:', error)
            return false
          }
        },

        // 福利价格配置加载策略
        welfarePrice: async () => {
          try {
            // 1. 获取系统成本价（用于显示成本价）
            console.log('获取系统成本价')
            const systemPriceRes = await v1GetSystemPrice()

            if (systemPriceRes.code === '000000' && systemPriceRes.data) {
              if (!priceConfig.agent_price) {
                priceConfig.agent_price = {}
              }

              const systemPrice = systemPriceRes.data
              priceConfig.agent_price.weal_price_trx = parseFloat(systemPrice.weal_time_1h)

              console.log('系统成本价获取成功:', priceConfig.agent_price)
            }

            // 2. 获取代理设置的价格（表单数据）
            console.log('获取代理设置的价格，ID:', id)
            const botPriceConfigRes = await v1GetBotPriceConfig(id)

            if (botPriceConfigRes.code === '000000' && botPriceConfigRes.data) {
              const botPriceData = botPriceConfigRes.data
              console.log('代理设置的价格获取成功:', botPriceData)

              // 从 agent_price 和其他字段中提取福利价格相关字段
              const agentPrice = botPriceData.agent_price || {}

              // 3. 获取福利收款地址（kind=6: 福利能量）
              console.log('获取福利收款地址，bot_id:', id)
              const addressListRes = await v1GetAddressList({
                bot_id: id,
                kind: 6, // 福利能量地址
                current_page: 1,
                page_size: 10
              })

              let wealAddress = ''
              if (addressListRes.code === '000000' && addressListRes.data) {
                const addressList = addressListRes.data.list || []
                console.log('福利地址列表:', addressList)

                // 查找 kind=6 的地址
                const wealAddressItem = addressList.find(
                  (item) => item.kind === 6 || item.kind === '6'
                )
                wealAddress = wealAddressItem?.address || ''
                console.log('找到的福利地址:', wealAddress)
              }

              const welfarePriceValues = {
                weal_address: wealAddress, // kind=6: 福利能量地址
                weal_price_trx: agentPrice.weal_time_1h || 0,
                hour_limit_count: botPriceData.weal_hour_limit || 0,
                total_limit_count: botPriceData.weal_total_limit || 0,
                check_resource_status: 2 // TODO: 从哪里获取？
              }

              console.log('福利价格表单数据:', welfarePriceValues)

              // 设置表单值
              formMethods.welfarePrice.setValues(welfarePriceValues)
            }

            return true
          } catch (error) {
            console.error('加载福利价格配置失败:', error)
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

            // 使用新接口 v1UpdateBot（代理只能更新自己的机器人）
            // 只传递允许更新的字段
            await v1UpdateBot({
              id: id,
              describe: botInfoData.describe,
              status: botInfoData.status,
              tg_admin: botInfoData.tg_admin
              // auto_renew 字段在表单中不存在，不传递
            })

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

            // 验证价格不能低于成本价
            const costPrices = priceConfig.agent_price || {}
            const priceChecks = [
              { field: 'flash_price', cost: costPrices.flash_rent_price, label: '闪租价格' },
              { field: 'day_1_price', cost: costPrices.day_1_price, label: '1天租赁价格' },
              { field: 'day_3_price', cost: costPrices.day_3_price, label: '3天租赁价格' },
              { field: 'day_7_price', cost: costPrices.day_7_price, label: '7天租赁价格' },
              { field: 'day_15_price', cost: costPrices.day_15_price, label: '15天租赁价格' },
              { field: 'day_30_price', cost: costPrices.day_30_price, label: '30天租赁价格' }
            ]

            for (const check of priceChecks) {
              if (timeEnergyData[check.field] < check.cost) {
                ElMessage.error(`${check.label}不能低于成本价 ${check.cost} TRX`)
                return false
              }
            }

            // 先获取当前配置
            const currentConfigRes = await v1GetBotPriceConfig(id)
            const currentConfig = currentConfigRes.data || {}
            const currentAgentPrice = currentConfig.agent_price || {}

            // 使用新接口 v1UpdateBotPrice，合并当前配置和新数据
            await v1UpdateBotPrice({
              bot_id: id,
              agent_price: {
                ...currentAgentPrice, // 保留其他字段的原值
                flash: timeEnergyData.flash_price, // 只更新时间能量相关字段
                time_1d: timeEnergyData.day_1_price,
                time_3d: timeEnergyData.day_3_price,
                time_7d: timeEnergyData.day_7_price,
                time_15d: timeEnergyData.day_15_price,
                time_30d: timeEnergyData.day_30_price
              },
              // 保留其他配置字段的原值
              allow_pledge: currentConfig.allow_pledge,
              max_trx_2_usdt: currentConfig.max_trx_2_usdt,
              max_usdt_2_trx: currentConfig.max_usdt_2_trx,
              min_trx_balance: currentConfig.min_trx_balance,
              notice_status: currentConfig.notice_status,
              weal_hour_limit: currentConfig.weal_hour_limit,
              weal_total_limit: currentConfig.weal_total_limit
            })

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

            // 验证价格不能低于成本价
            const costPrices = priceConfig.agent_price || {}
            if (countEnergyData.count_price_trx < costPrices.count_price) {
              ElMessage.error(`TRX价格不能低于成本价 ${costPrices.count_price} TRX`)
              return false
            }

            // 先获取当前配置
            const currentConfigRes = await v1GetBotPriceConfig(id)
            const currentConfig = currentConfigRes.data || {}
            const currentAgentPrice = currentConfig.agent_price || {}

            // 使用新接口 v1UpdateBotPrice，合并当前配置和新数据
            await v1UpdateBotPrice({
              bot_id: id,
              agent_price: {
                ...currentAgentPrice, // 保留其他字段的原值
                stroke: countEnergyData.count_price_trx, // 只更新笔数能量相关字段
                stroke_usdt: countEnergyData.count_price_usdt
              },
              // 保留其他配置字段的原值
              allow_pledge: currentConfig.allow_pledge,
              max_trx_2_usdt: currentConfig.max_trx_2_usdt,
              max_usdt_2_trx: currentConfig.max_usdt_2_trx,
              min_trx_balance: currentConfig.min_trx_balance,
              notice_status: currentConfig.notice_status,
              weal_hour_limit: currentConfig.weal_hour_limit,
              weal_total_limit: currentConfig.weal_total_limit
            })

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

            // 验证价格不能低于成本价
            const costPrices = priceConfig.agent_price || {}
            if (managedModeData.price_trx_65000 < costPrices.manage_price_65000) {
              ElMessage.error(`65000能量价格不能低于成本价 ${costPrices.manage_price_65000} TRX`)
              return false
            }
            if (managedModeData.price_trx_131000 < costPrices.manage_price_13100) {
              ElMessage.error(`131000能量价格不能低于成本价 ${costPrices.manage_price_13100} TRX`)
              return false
            }

            // 先获取当前配置
            const currentConfigRes = await v1GetBotPriceConfig(id)
            const currentConfig = currentConfigRes.data || {}
            const currentAgentPrice = currentConfig.agent_price || {}

            // 使用新接口 v1UpdateBotPrice，合并当前配置和新数据
            await v1UpdateBotPrice({
              bot_id: id,
              agent_price: {
                ...currentAgentPrice, // 保留其他字段的原值
                hosting_65k: managedModeData.price_trx_65000, // 只更新托管模式相关字段
                hosting_131k: managedModeData.price_trx_131000
              },
              // 保留其他配置字段的原值
              allow_pledge: currentConfig.allow_pledge,
              max_trx_2_usdt: currentConfig.max_trx_2_usdt,
              max_usdt_2_trx: currentConfig.max_usdt_2_trx,
              min_trx_balance: currentConfig.min_trx_balance,
              notice_status: currentConfig.notice_status,
              weal_hour_limit: currentConfig.weal_hour_limit,
              weal_total_limit: currentConfig.weal_total_limit
            })

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

            // 验证价格不能低于成本价
            const costPrices = priceConfig.agent_price || {}
            if (batchOrderData.batch_energy_price < costPrices.batch_energy_price) {
              ElMessage.error(`批量能量价格不能低于成本价 ${costPrices.batch_energy_price} TRX`)
              return false
            }
            if (batchOrderData.batch_active_price < costPrices.batch_active_price) {
              ElMessage.error(`批量激活价格不能低于成本价 ${costPrices.batch_active_price} TRX`)
              return false
            }

            // 先获取当前配置
            const currentConfigRes = await v1GetBotPriceConfig(id)
            const currentConfig = currentConfigRes.data || {}
            const currentAgentPrice = currentConfig.agent_price || {}

            // 使用新接口 v1UpdateBotPrice，合并当前配置和新数据
            await v1UpdateBotPrice({
              bot_id: id,
              agent_price: {
                ...currentAgentPrice, // 保留其他字段的原值
                batch_flash: batchOrderData.batch_energy_price, // 只更新批量下单相关字段
                active: batchOrderData.batch_active_price
              },
              // 保留其他配置字段的原值
              allow_pledge: currentConfig.allow_pledge,
              max_trx_2_usdt: currentConfig.max_trx_2_usdt,
              max_usdt_2_trx: currentConfig.max_usdt_2_trx,
              min_trx_balance: currentConfig.min_trx_balance,
              notice_status: currentConfig.notice_status,
              weal_hour_limit: currentConfig.weal_hour_limit,
              weal_total_limit: currentConfig.weal_total_limit
            })

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

            // 验证价格不能低于成本价
            const costPrices = priceConfig.agent_price || {}
            if (flashExchangeData.profit_usdt_to_trx < costPrices.profit_usdt_to_trx) {
              ElMessage.error(`USDT兑TRX利润不能低于成本价 ${costPrices.profit_usdt_to_trx}%`)
              return false
            }
            if (flashExchangeData.profit_trx_to_usdt < costPrices.profit_trx_to_usdt) {
              ElMessage.error(`TRX兑USDT利润不能低于成本价 ${costPrices.profit_trx_to_usdt}%`)
              return false
            }

            // 先获取当前配置
            const currentConfigRes = await v1GetBotPriceConfig(id)
            const currentConfig = currentConfigRes.data || {}
            const currentAgentPrice = currentConfig.agent_price || {}

            // 使用新接口 v1UpdateBotPrice，合并当前配置和新数据
            await v1UpdateBotPrice({
              bot_id: id,
              agent_price: {
                ...currentAgentPrice, // 保留其他字段的原值
                usdt_2_trx: flashExchangeData.profit_usdt_to_trx, // 只更新闪兑相关字段
                trx_2_usdt: flashExchangeData.profit_trx_to_usdt
              },
              // 更新闪兑配置字段
              min_trx_balance: flashExchangeData.min_trx_balance,
              max_usdt_2_trx: flashExchangeData.max_usdt_to_trx,
              max_trx_2_usdt: flashExchangeData.max_trx_to_usdt,
              // 保留其他配置字段的原值
              allow_pledge: currentConfig.allow_pledge,
              notice_status: currentConfig.notice_status,
              weal_hour_limit: currentConfig.weal_hour_limit,
              weal_total_limit: currentConfig.weal_total_limit
            })

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

            // 验证价格不能低于成本价
            const costPrices = priceConfig.agent_price || {}
            if (welfarePriceData.weal_price_trx < costPrices.flash_rent_price) {
              ElMessage.error(`福利TRX价格不能低于成本价 ${costPrices.flash_rent_price} TRX`)
              return false
            }

            // 先获取当前配置
            const currentConfigRes = await v1GetBotPriceConfig(id)
            const currentConfig = currentConfigRes.data || {}
            const currentAgentPrice = currentConfig.agent_price || {}

            // 使用新接口 v1UpdateBotPrice，合并当前配置和新数据
            await v1UpdateBotPrice({
              bot_id: id,
              agent_price: {
                ...currentAgentPrice, // 保留其他字段的原值
                weal_time_1h: welfarePriceData.weal_price_trx // 只更新福利相关字段
              },
              // 更新福利配置字段
              weal_hour_limit: welfarePriceData.hour_limit_count,
              weal_total_limit: welfarePriceData.total_limit_count,
              // 保留其他配置字段的原值
              allow_pledge: currentConfig.allow_pledge,
              max_trx_2_usdt: currentConfig.max_trx_2_usdt,
              max_usdt_2_trx: currentConfig.max_usdt_2_trx,
              min_trx_balance: currentConfig.min_trx_balance,
              notice_status: currentConfig.notice_status
            })

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
    priceConfig,
    syncTgStatus,
    loadBotAllConfigs,
    submitConfig
  }
}
