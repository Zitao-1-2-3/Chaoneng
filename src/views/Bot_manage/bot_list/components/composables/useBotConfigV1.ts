// 机器人配置管理 V1 - 专门管理重构后的三个标签页（使用 v1 新接口）
import { ref, reactive } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'
import {
  v1GetBotDetail,
  v1GetBotPriceConfig,
  v1GetSystemPrice,
  v1GetAddressList,
  v1UpdateBot,
  v1UpdateBotPrice,
  v1BindAddress,
  syncTgStatusApi
} from '@/api/botlist'

export function useBotConfigV1() {
  // 共享状态
  const dialogVisible = ref(false)
  const activeTab = ref('botInfo')
  const currentBot = ref<Record<string, any>>({})
  const tgStatus = ref('pending')
  const syncing = ref(false)
  const loading = ref(false)
  const submitting = ref(false)

  // 价格配置数据（成本价）
  const costPrices = reactive<Record<string, any>>({})
  // 当前价格配置数据
  const currentPrices = reactive<Record<string, any>>({})

  // TG状态同步
  const syncTgStatus = async () => {
    if (syncing.value || !currentBot.value.id) return

    try {
      syncing.value = true
      ElMessage.info('正在同步TG状态...')

      const res = await syncTgStatusApi(currentBot.value.id)
      const data = res.data || {}

      tgStatus.value = data.status || 'pending'
      ElMessage.success('TG状态同步' + (tgStatus.value === 'success' ? '成功' : '失败'))
    } catch (error) {
      ElMessage.error('TG状态同步失败，请稍后重试')
      tgStatus.value = 'error'
    } finally {
      syncing.value = false
    }
  }

  // 加载机器人基本信息
  const loadBotInfo = async (id: number, formMethods: any) => {
    try {
      console.log('开始加载机器人基本信息...')

      const [botDetailRes, systemPriceRes] = await Promise.all([
        v1GetBotDetail(id),
        v1GetSystemPrice()
      ])

      if (botDetailRes.code !== '000000' || !botDetailRes.data) {
        ElMessage.error('获取机器人详情失败')
        return false
      }

      if (systemPriceRes.code !== '000000' || !systemPriceRes.data) {
        ElMessage.error('获取系统成本价失败')
        return false
      }

      // 保存机器人信息
      currentBot.value = botDetailRes.data

      // 保存成本价数据
      const systemPrice = systemPriceRes.data
      Object.assign(costPrices, {
        flash_rent_price: parseFloat(systemPrice.flash),
        day_1_price: parseFloat(systemPrice.time_1d),
        day_3_price: parseFloat(systemPrice.time_3d),
        day_7_price: parseFloat(systemPrice.time_7d),
        day_15_price: parseFloat(systemPrice.time_15d),
        day_30_price: parseFloat(systemPrice.time_30d),
        count_price: parseFloat(systemPrice.stroke),
        manage_price_65000: parseFloat(systemPrice.hosting_65k),
        manage_price_13100: parseFloat(systemPrice.hosting_131k),
        batch_energy_price: parseFloat(systemPrice.batch_flash),
        batch_active_price: parseFloat(systemPrice.active),
        weal_price_trx: parseFloat(systemPrice.weal_time_1h)
      })

      // 设置TG同步状态
      tgStatus.value = 'pending' // BotDetail doesn't have tgVerifyStatus field

      // 设置表单值
      formMethods.setValues({
        tg_bot_id: botDetailRes.data.id || '',
        firstname: botDetailRes.data.first_name || '',
        name: botDetailRes.data.user_name || '',
        token: botDetailRes.data.token || '',
        api_key: '', // BotDetail doesn't have apiKey field
        tg_admin: botDetailRes.data.tg_admin || '',
        describe: botDetailRes.data.describe || '',
        status: botDetailRes.data.status || 2
      })

      console.log('机器人基本信息加载成功')
      return true
    } catch (error) {
      console.error('加载机器人基本信息失败:', error)
      ElMessage.error('加载机器人信息失败')
      return false
    }
  }

  // 加载收款配置
  const loadPaymentConfig = async (id: number, formMethods: any) => {
    try {
      console.log('开始加载收款配置...')

      const addressListRes = await v1GetAddressList({
        bot_id: id,
        current_page: 1,
        page_size: 100
      })

      if (addressListRes.code !== '000000' || !addressListRes.data) {
        ElMessage.error('获取收款地址失败')
        return false
      }

      const addressList = addressListRes.data.list || []

      if (addressList.length === 0) {
        ElMessage.warning('该机器人还未配置收款地址')
      }

      // 根据 kind 类型提取不同的地址
      const timeEnergyAddress = addressList.find((item) => Number(item.kind) === 4) // 时间能量
      const userDepositAddress = addressList.find((item) => Number(item.kind) === 2) // 余额充值
      const strokeEnergyAddress = addressList.find((item) => Number(item.kind) === 5) // 按笔数购买
      const exchangeAddress = addressList.find((item) => Number(item.kind) === 3) // 闪兑
      const welfareAddress = addressList.find((item) => Number(item.kind) === 6) // 福利

      formMethods.setValues({
        energy_address: timeEnergyAddress?.address || '',
        receive_address: userDepositAddress?.address || '',
        energy_usdt_address: strokeEnergyAddress?.address || '',
        transfer_address: exchangeAddress?.address || '',
        weal_address: welfareAddress?.address || '',
        notice_order_tg_admin: 2
      })

      console.log('收款配置加载成功')
      return true
    } catch (error) {
      console.error('加载收款配置失败:', error)
      ElMessage.error('加载收款配置失败')
      return false
    }
  }

  // 加载价格配置
  const loadPriceConfig = async (id: number, formMethods: any) => {
    try {
      console.log('开始加载价格配置...')

      const [systemPriceRes, botPriceRes] = await Promise.all([
        v1GetSystemPrice(),
        v1GetBotPriceConfig(id)
      ])

      if (systemPriceRes.code !== '000000' || !systemPriceRes.data) {
        ElMessage.error('获取系统成本价失败')
        return false
      }

      if (botPriceRes.code !== '000000' || !botPriceRes.data) {
        ElMessage.error('获取机器人价格配置失败')
        return false
      }

      // 保存成本价数据
      const systemPrice = systemPriceRes.data
      Object.assign(costPrices, {
        flash_rent_price: parseFloat(systemPrice.flash),
        day_1_price: parseFloat(systemPrice.time_1d),
        day_3_price: parseFloat(systemPrice.time_3d),
        day_7_price: parseFloat(systemPrice.time_7d),
        day_15_price: parseFloat(systemPrice.time_15d),
        day_30_price: parseFloat(systemPrice.time_30d),
        count_price: parseFloat(systemPrice.stroke),
        manage_price_65000: parseFloat(systemPrice.hosting_65k),
        manage_price_13100: parseFloat(systemPrice.hosting_131k),
        batch_energy_price: parseFloat(systemPrice.batch_flash),
        batch_active_price: parseFloat(systemPrice.active),
        weal_price_trx: parseFloat(systemPrice.weal_time_1h)
      })

      // 保存当前价格配置
      const botPriceData = botPriceRes.data
      const agentPrice = botPriceData.agent_price || {}
      Object.assign(currentPrices, agentPrice)

      // 设置表单值
      const formValues = {
        // 闪租能量
        flash_price: agentPrice.flash || 0,

        // 时间能量
        time_1h: agentPrice.time_1h || 0,
        day_1_price: agentPrice.time_1d || 0,
        day_3_price: agentPrice.time_3d || 0,
        day_7_price: agentPrice.time_7d || 0,
        day_15_price: agentPrice.time_15d || 0,
        day_30_price: agentPrice.time_30d || 0,

        // 笔数能量
        count_price_trx: agentPrice.stroke || 0,
        count_price_usdt: agentPrice.stroke_usdt || 0,

        // 智能托管
        price_trx_65000: agentPrice.hosting_65k || 0,
        price_trx_131000: agentPrice.hosting_131k || 0,

        // 批量下单
        batch_energy_price: agentPrice.batch_flash || 0,
        batch_active_price: agentPrice.active || 0,

        // 闪兑配置
        min_trx_balance: botPriceData.min_trx_balance || 0,
        profit_usdt_to_trx: (agentPrice.usdt_2_trx || 0) * 100,
        max_usdt_to_trx: botPriceData.max_usdt_2_trx || 0,
        profit_trx_to_usdt: (agentPrice.trx_2_usdt || 0) * 100,
        max_trx_to_usdt: botPriceData.max_trx_2_usdt || 0,

        // 福利板块
        weal_price_trx: agentPrice.weal_time_1h || 0,
        hour_limit_count: botPriceData.weal_hour_limit || 0,
        total_limit_count: botPriceData.weal_total_limit || 0
      }

      console.log('准备设置表单值:', formValues)
      console.log('agentPrice 原始数据:', agentPrice)
      formMethods.setValues(formValues)
      console.log('表单值设置完成')

      console.log('价格配置加载成功')
      console.log('成本价数据:', costPrices)
      console.log('当前价格数据:', currentPrices)
      return true
    } catch (error) {
      console.error('加载价格配置失败:', error)
      ElMessage.error('加载价格配置失败')
      return false
    }
  }

  // 统一的加载函数
  const loadTabConfig = async (id: number, tabName: string, formMethods: any) => {
    if (!id) {
      ElMessage.error('机器人ID不能为空')
      return false
    }

    const loadingInstance = ElLoading.service({
      target: '.el-dialog__body',
      text: '加载配置中...'
    })

    loading.value = true

    try {
      let success = false

      switch (tabName) {
        case 'botInfo':
          success = await loadBotInfo(id, formMethods)
          break
        case 'payment':
          success = await loadPaymentConfig(id, formMethods)
          break
        case 'priceConfig':
          success = await loadPriceConfig(id, formMethods)
          break
        default:
          ElMessage.warning(`未知的标签页: ${tabName}`)
      }

      return success
    } catch (error) {
      console.error('加载配置失败:', error)
      ElMessage.error('加载配置失败，请稍后重试')
      return false
    } finally {
      setTimeout(() => {
        loading.value = false
        loadingInstance.close()
      }, 300)
    }
  }

  // 提交机器人基本信息
  const submitBotInfo = async (formMethods: any) => {
    try {
      const botInfoData = await formMethods.getFormData()

      await v1UpdateBot({
        id: currentBot.value.id,
        describe: botInfoData.describe,
        status: botInfoData.status,
        tg_admin: botInfoData.tg_admin
      })

      ElMessage.success('保存成功')
      return true
    } catch (error) {
      console.error('保存基本信息失败:', error)
      ElMessage.error('保存失败')
      return false
    }
  }

  // 提交收款配置
  const submitPaymentConfig = async (formMethods: any) => {
    try {
      const paymentData = await formMethods.getFormData()
      const bindPromises: Promise<any>[] = []

      // 绑定各种收款地址
      if (paymentData.energy_address?.trim()) {
        bindPromises.push(
          v1BindAddress({
            address: paymentData.energy_address.trim(),
            bot_id: currentBot.value.id,
            kind: 4 // 时间能量
          })
        )
      }

      if (paymentData.receive_address?.trim()) {
        bindPromises.push(
          v1BindAddress({
            address: paymentData.receive_address.trim(),
            bot_id: currentBot.value.id,
            kind: 2 // 余额充值
          })
        )
      }

      if (paymentData.energy_usdt_address?.trim()) {
        bindPromises.push(
          v1BindAddress({
            address: paymentData.energy_usdt_address.trim(),
            bot_id: currentBot.value.id,
            kind: 5 // 笔数能量
          })
        )
      }

      if (paymentData.transfer_address?.trim()) {
        bindPromises.push(
          v1BindAddress({
            address: paymentData.transfer_address.trim(),
            bot_id: currentBot.value.id,
            kind: 3 // 闪兑
          })
        )
      }

      if (paymentData.weal_address?.trim()) {
        bindPromises.push(
          v1BindAddress({
            address: paymentData.weal_address.trim(),
            bot_id: currentBot.value.id,
            kind: 6 // 福利
          })
        )
      }

      if (bindPromises.length === 0) {
        ElMessage.warning('请至少填写一个收款地址')
        return false
      }

      await Promise.all(bindPromises)
      ElMessage.success('保存成功')
      return true
    } catch (error) {
      console.error('保存收款配置失败:', error)
      ElMessage.error('保存失败')
      return false
    }
  }

  // 提交价格配置
  const submitPriceConfig = async (formMethods: any) => {
    try {
      const priceData = await formMethods.getFormData()

      // 构建价格配置数据
      const priceConfig = {
        bot_id: currentBot.value.id,
        agent_price: {
          flash: priceData.flash_price || 0,
          time_1h: priceData.time_1h || 0,
          time_1d: priceData.day_1_price || 0,
          time_3d: priceData.day_3_price || 0,
          time_7d: priceData.day_7_price || 0,
          time_15d: priceData.day_15_price || 0,
          time_30d: priceData.day_30_price || 0,
          stroke: priceData.count_price_trx || 0,
          stroke_usdt: priceData.count_price_usdt || 0,
          hosting_65k: priceData.price_trx_65000 || 0,
          hosting_131k: priceData.price_trx_131000 || 0,
          batch_flash: priceData.batch_energy_price || 0,
          active: priceData.batch_active_price || 0,
          usdt_2_trx: (priceData.profit_usdt_to_trx || 0) / 100,
          trx_2_usdt: (priceData.profit_trx_to_usdt || 0) / 100,
          weal_time_1h: priceData.weal_price_trx || 0
        },
        min_trx_balance: priceData.min_trx_balance || 0,
        max_usdt_2_trx: priceData.max_usdt_to_trx || 0,
        max_trx_2_usdt: priceData.max_trx_to_usdt || 0,
        weal_hour_limit: priceData.hour_limit_count || 0,
        weal_total_limit: priceData.total_limit_count || 0
      }

      await v1UpdateBotPrice(priceConfig)
      ElMessage.success('保存成功')
      return true
    } catch (error) {
      console.error('保存价格配置失败:', error)
      ElMessage.error('保存失败')
      return false
    }
  }

  // 统一的提交函数
  const submitTabConfig = async (tabName: string, formMethods: any) => {
    if (submitting.value) return false

    submitting.value = true

    try {
      // 验证表单
      const currentForm = await formMethods.getElFormExpose()
      const valid = await currentForm.validate().catch(() => false)

      if (!valid) {
        ElMessage.warning('表单验证失败，请检查填写内容')
        return false
      }

      let success = false

      switch (tabName) {
        case 'botInfo':
          success = await submitBotInfo(formMethods)
          break
        case 'payment':
          success = await submitPaymentConfig(formMethods)
          break
        case 'priceConfig':
          success = await submitPriceConfig(formMethods)
          break
        default:
          ElMessage.warning(`未知的标签页: ${tabName}`)
      }

      return success
    } catch (error) {
      console.error('提交配置失败:', error)
      ElMessage.error('提交失败')
      return false
    } finally {
      submitting.value = false
    }
  }

  return {
    // 状态
    dialogVisible,
    activeTab,
    currentBot,
    tgStatus,
    syncing,
    loading,
    submitting,
    costPrices,
    currentPrices,

    // 方法
    syncTgStatus,
    loadTabConfig,
    submitTabConfig
  }
}
