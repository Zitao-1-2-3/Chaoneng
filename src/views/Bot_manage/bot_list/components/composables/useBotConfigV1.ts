// 机器人配置管理 V1 - 专门管理重构后的三个标签页（使用 v1 新接口）
import { ref, reactive } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'
import {
  v1GetBotDetail,
  v1GetBotPriceConfig,
  v1GetSystemPrice,
  v1GetAddressList,
  v1GetBotWealConfig,
  v1UpdateBot,
  v1UpdateBotPrice,
  v1UpdateBotWealConfig,
  v1BindAddress,
  syncTgStatusApi
} from '@/api/botlist'
import { v1UpdateSite, v1GetSiteDetail } from '@/api/site'

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

      // 保存成本价数据 - 字段名与后端保持一致
      const systemPrice = systemPriceRes.data
      Object.assign(costPrices, {
        flash: parseFloat(systemPrice.flash) || 0,
        time_1h: parseFloat(systemPrice.time_1h) || 0,
        time_1d: parseFloat(systemPrice.time_1d) || 0,
        time_3d: parseFloat(systemPrice.time_3d) || 0,
        time_7d: parseFloat(systemPrice.time_7d) || 0,
        time_15d: parseFloat(systemPrice.time_15d) || 0,
        time_30d: parseFloat(systemPrice.time_30d) || 0,
        stroke: parseFloat(systemPrice.stroke) || 0,
        hosting_65k: parseFloat(systemPrice.hosting_65k) || 0,
        hosting_131k: parseFloat(systemPrice.hosting_131k) || 0,
        batch_flash: parseFloat(systemPrice.batch_flash) || 0,
        active: parseFloat(systemPrice.active) || 0
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

      // 保存成本价数据 - 字段名与后端保持一致
      const systemPrice = systemPriceRes.data
      Object.assign(costPrices, {
        flash: parseFloat(systemPrice.flash) || 0,
        time_1h: parseFloat(systemPrice.time_1h) || 0,
        time_1d: parseFloat(systemPrice.time_1d) || 0,
        time_3d: parseFloat(systemPrice.time_3d) || 0,
        time_7d: parseFloat(systemPrice.time_7d) || 0,
        time_15d: parseFloat(systemPrice.time_15d) || 0,
        time_30d: parseFloat(systemPrice.time_30d) || 0,
        stroke: parseFloat(systemPrice.stroke) || 0,
        hosting_65k: parseFloat(systemPrice.hosting_65k) || 0,
        hosting_131k: parseFloat(systemPrice.hosting_131k) || 0,
        batch_flash: parseFloat(systemPrice.batch_flash) || 0,
        active: parseFloat(systemPrice.active) || 0
      })

      // 保存当前价格配置
      const botPriceData = botPriceRes.data
      // 注意：新接口返回的是扁平化结构，不再有 agent_price 嵌套
      Object.assign(currentPrices, botPriceData)

      // 设置表单值 - 统一使用后端字段名
      const formValues = {
        // 闪租能量
        flash: parseFloat(botPriceData.flash) || 0,

        // 时间能量
        time_1h: parseFloat(botPriceData.time_1h) || 0,
        time_1d: parseFloat(botPriceData.time_1d) || 0,
        time_3d: parseFloat(botPriceData.time_3d) || 0,
        time_7d: parseFloat(botPriceData.time_7d) || 0,
        time_15d: parseFloat(botPriceData.time_15d) || 0,
        time_30d: parseFloat(botPriceData.time_30d) || 0,

        // 笔数能量
        stroke: parseFloat(botPriceData.stroke) || 0,
        stroke_usdt: parseFloat(botPriceData.stroke_usdt) || 0,

        // 智能托管
        hosting_65k: parseFloat(botPriceData.hosting_65k) || 0,
        hosting_131k: parseFloat(botPriceData.hosting_131k) || 0,

        // 批量下单
        batch_flash: parseFloat(botPriceData.batch_flash) || 0,
        active: parseFloat(botPriceData.active) || 0,

        // 闪兑配置
        min_trx_balance: parseFloat(botPriceData.min_trx_balance) || 0,
        usdt_2_trx: (parseFloat(botPriceData.usdt_2_trx) || 0) * 100,
        max_usdt_2_trx: parseFloat(botPriceData.max_usdt_2_trx) || 0,
        trx_2_usdt: (parseFloat(botPriceData.trx_2_usdt) || 0) * 100,
        max_trx_2_usdt: parseFloat(botPriceData.max_trx_2_usdt) || 0,

        // 福利能量价格
        weal_price_trx: parseFloat(botPriceData.weal_time_1h) || 0
      }

      console.log('准备设置表单值:', formValues)
      console.log('botPriceData 原始数据:', botPriceData)
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

  // 加载福利配置
  const loadWelfareConfig = async (id: number, formMethods: any) => {
    try {
      console.log('开始加载福利配置...')

      const wealConfigRes = await v1GetBotWealConfig(id)

      if (wealConfigRes.code !== '000000' || !wealConfigRes.data) {
        ElMessage.error('获取福利配置失败')
        return false
      }

      const wealData = wealConfigRes.data

      // 设置表单值 - 注意字符串类型需要转换为数字
      const formValues = {
        max_count: wealData.max_count || 0,
        min_interval: wealData.min_interval || 0,
        max_energy: wealData.max_energy || 0,
        max_bandwidth: wealData.max_bandwidth || 0,
        min_active_day: wealData.min_active_day || 0,
        min_balance_trx: parseFloat(wealData.min_balance_trx) || 0,
        min_balance_usdt: parseFloat(wealData.min_balance_usdt) || 0,
        min_avg_transfer_trx: parseFloat(wealData.min_avg_transfer_trx) || 0,
        min_avg_transfer_usdt: parseFloat(wealData.min_avg_transfer_usdt) || 0,
        min_send_interval: wealData.min_send_interval || 0,
        same_send_max_count_trx: wealData.same_send_max_count_trx || 0,
        same_send_min_amount_trx: parseFloat(wealData.same_send_min_amount_trx) || 0
      }

      formMethods.setValues(formValues)
      console.log('福利配置加载成功')
      return true
    } catch (error) {
      console.error('加载福利配置失败:', error)
      ElMessage.error('加载福利配置失败')
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
        case 'welfareConfig':
          success = await loadWelfareConfig(id, formMethods)
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

      // 1. 更新机器人基本信息
      await v1UpdateBot({
        id: currentBot.value.id,
        describe: botInfoData.describe,
        status: botInfoData.status,
        tg_admin: botInfoData.tg_admin
      })

      // 2. 更新Site信息（客服账号和H5端开关）
      await v1UpdateSite({
        id: currentBot.value.id, // 使用机器人ID作为Site ID
        tg_admin: botInfoData.customer_service_account, // 客服账号
        status: botInfoData.h5_enable === 1 ? 1 : 2 // H5端开关：1-启用，0-禁用 → 1-启用，2-禁用
      })

      // 3. 重新获取Site详情，刷新显示数据
      try {
        const siteRes = await v1GetSiteDetail(currentBot.value.id)
        if (siteRes && siteRes.data) {
          // 更新表单中的H5配置数据
          const updatedH5Config = {
            url: siteRes.data.url || '',
            customer_service_account: siteRes.data.tg_admin || '',
            h5_enable: siteRes.data.status === 1 ? 1 : 0
          }

          // 合并当前表单数据和更新后的H5配置
          const currentFormData = await formMethods.getFormData()
          formMethods.setValues({
            ...currentFormData,
            ...updatedH5Config
          })
        }
      } catch (refreshError) {
        console.warn('刷新Site数据失败:', refreshError)
        // 刷新失败不影响保存成功的提示
      }

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

      // 构建价格配置数据 - 统一使用后端字段名
      const priceConfig = {
        id: currentPrices.id, // 使用价格配置表的ID
        // 闪租能量
        flash: priceData.flash || 0,
        // 时间能量
        time_1h: priceData.time_1h || 0,
        time_1d: priceData.time_1d || 0,
        time_3d: priceData.time_3d || 0,
        time_7d: priceData.time_7d || 0,
        time_15d: priceData.time_15d || 0,
        time_30d: priceData.time_30d || 0,
        // 笔数能量
        stroke: priceData.stroke || 0,
        stroke_usdt: priceData.stroke_usdt || 0,
        // 智能托管
        hosting_65k: priceData.hosting_65k || 0,
        hosting_131k: priceData.hosting_131k || 0,
        // 批量下单
        batch_flash: priceData.batch_flash || 0,
        active: priceData.active || 0,
        // 闪兑配置
        usdt_2_trx: (priceData.usdt_2_trx || 0) / 100,
        trx_2_usdt: (priceData.trx_2_usdt || 0) / 100,
        min_trx_balance: priceData.min_trx_balance || 0,
        max_usdt_2_trx: priceData.max_usdt_2_trx || 0,
        max_trx_2_usdt: priceData.max_trx_2_usdt || 0,
        // 福利能量价格
        weal_time_1h: priceData.weal_price_trx || 0
      }

      console.log('提交价格配置数据:', priceConfig)
      await v1UpdateBotPrice(priceConfig)
      ElMessage.success('保存成功')
      return true
    } catch (error) {
      console.error('保存价格配置失败:', error)
      ElMessage.error('保存失败')
      return false
    }
  }

  // 提交福利配置
  const submitWelfareConfig = async (formMethods: any) => {
    try {
      const welfareData = await formMethods.getFormData()

      if (!currentBot.value.id) {
        ElMessage.error('机器人ID不能为空')
        return false
      }

      // 构建福利配置数据
      const welfareConfig = {
        max_count: welfareData.max_count || 0,
        min_interval: welfareData.min_interval || 0,
        max_energy: welfareData.max_energy || 0,
        max_bandwidth: welfareData.max_bandwidth || 0,
        min_active_day: welfareData.min_active_day || 0,
        min_balance_trx: welfareData.min_balance_trx || 0,
        min_balance_usdt: welfareData.min_balance_usdt || 0,
        min_avg_transfer_trx: welfareData.min_avg_transfer_trx || 0,
        min_avg_transfer_usdt: welfareData.min_avg_transfer_usdt || 0,
        min_send_interval: welfareData.min_send_interval || 0,
        same_send_max_count_trx: welfareData.same_send_max_count_trx || 0,
        same_send_min_amount_trx: welfareData.same_send_min_amount_trx || 0
      }

      console.log('提交福利配置数据:', welfareConfig)
      await v1UpdateBotWealConfig(currentBot.value.id, welfareConfig)
      ElMessage.success('保存成功')
      return true
    } catch (error) {
      console.error('保存福利配置失败:', error)
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
        case 'welfareConfig':
          success = await submitWelfareConfig(formMethods)
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
