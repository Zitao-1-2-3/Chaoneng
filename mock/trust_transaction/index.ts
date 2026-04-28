import { MockMethod } from 'vite-plugin-mock'
import { formatToDateTime } from '@/utils/dateUtil'

// 托管类型
const TRUST_TYPES = {
  1: 'TRX托管',
  2: 'USDT托管',
  3: '能量托管'
}

// A资产单位
const ASSET_UNITS = {
  1: 'TRX',
  2: 'USDT',
  3: 'Energy'
}

// 托管状态
const TRUST_STATUS = {
  1: '托管中',
  2: '已完成',
  3: '待处理',
  4: '已取消'
}

// 取回状态
const RETRIEVE_STATUS = {
  1: '未取回',
  2: '已取回',
  3: '部分取回',
  4: '取回失败'
}

// 生成随机数据
const generateMockTrustTransactions = (count: number = 100): any[] => {
  return Array.from({ length: count }).map((_, index) => {
    // 随机生成托管类型
    const trustType = Math.floor(Math.random() * 3) + 1

    // 根据托管类型生成不同范围的资产数量
    let assetAmount = 0
    let estReturnRate = 0

    switch (trustType) {
      case 1: // TRX托管
        assetAmount = Math.floor(Math.random() * 10000) + 1000 // 1000-11000 TRX
        estReturnRate = Math.floor(Math.random() * 5) + 3 // 3-8%
        break
      case 2: // USDT托管
        assetAmount = Math.floor(Math.random() * 5000) + 100 // 100-5100 USDT
        estReturnRate = Math.floor(Math.random() * 4) + 5 // 5-9%
        break
      case 3: // 能量托管
        assetAmount = Math.floor(Math.random() * 100000) + 10000 // 10000-110000 Energy
        estReturnRate = Math.floor(Math.random() * 6) + 1 // 1-7%
        break
    }

    // 随机生成托管状态
    const status = Math.floor(Math.random() * 4) + 1

    // 计算实际收益 (只有已完成的托管才有实际收益)
    const actualReturn =
      status === 2 ? parseFloat(((assetAmount * estReturnRate) / 100).toFixed(2)) : 0

    // 生成开始和结束时间
    const now = new Date()
    const startDate = new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000) // 过去60天内
    const duration = Math.floor(Math.random() * 30) + 1 // 1-30天
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000)

    // 生成取回状态 (只有托管中或已完成的才可能有不同的取回状态)
    let retrieveStatus = 1 // 默认未取回
    if (status === 1 || status === 2) {
      retrieveStatus = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 2 : 1 // 70%是未取回，30%是其他状态
    }

    // 生成取回时间 (只有已取回或部分取回的才有取回时间)
    let retrieveTime: string | null = null
    if (retrieveStatus === 2 || retrieveStatus === 3) {
      retrieveTime = formatToDateTime(
        new Date(endDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000)
      )
    }

    return {
      id: `TT${String(index + 1).padStart(8, '0')}`,
      agentId: `AG${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
      agentName: `代理商${index + 1}`,
      trustType,
      trustTypeText: TRUST_TYPES[trustType],
      assetAmount,
      assetUnit: ASSET_UNITS[trustType],
      estReturnRate,
      actualReturn,
      actualReturnRate:
        status === 2 ? parseFloat(((actualReturn / assetAmount) * 100).toFixed(2)) : 0,
      startTime: formatToDateTime(startDate),
      endTime: formatToDateTime(endDate),
      trustDuration: `${duration}天`,
      status,
      statusText: TRUST_STATUS[status],
      retrieveStatus,
      retrieveStatusText: RETRIEVE_STATUS[retrieveStatus],
      retrieveTime,
      receivingAddress: `T${Array.from({ length: 33 })
        .map(() => 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789'[Math.floor(Math.random() * 34)])
        .join('')}`,
      returnAddress: `T${Array.from({ length: 33 })
        .map(() => 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789'[Math.floor(Math.random() * 34)])
        .join('')}`,
      platformFee: parseFloat((assetAmount * 0.01).toFixed(2)), // 平台手续费，1%
      trustTerms: `${duration}天期限托管合约`,
      creatorName: `操作员${Math.floor(Math.random() * 5) + 1}`,
      createTime: formatToDateTime(
        new Date(startDate.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000)
      ),
      remark: Math.random() > 0.7 ? '用户申请托管' : ''
    }
  })
}

// 生成托管明细列表 Mock 数据
const trustTransactionData = generateMockTrustTransactions()

export default [
  // 获取托管明细列表
  {
    url: '/mock/v1/trust/list',
    method: 'get',
    response: ({ query }) => {
      // 解析查询参数
      const { pageNo = 1, pageSize = 10, keyword = '', trustType = '', status = '' } = query

      // 筛选数据
      let filteredList = [...trustTransactionData]

      // 关键词过滤（id、代理ID、代理名称）
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase()
        filteredList = filteredList.filter(
          (item) =>
            item.id.toLowerCase().includes(lowerKeyword) ||
            item.agentId.toLowerCase().includes(lowerKeyword) ||
            item.agentName.toLowerCase().includes(lowerKeyword)
        )
      }

      // 托管类型过滤
      if (trustType) {
        filteredList = filteredList.filter((item) => String(item.trustType) === String(trustType))
      }

      // 状态过滤
      if (status) {
        filteredList = filteredList.filter((item) => String(item.status) === String(status))
      }

      // 分页处理
      const startIndex = (Number(pageNo) - 1) * Number(pageSize)
      const endIndex = startIndex + Number(pageSize)
      const pagedList = filteredList.slice(startIndex, endIndex)

      return {
        code: '000000',
        message: '获取托管明细列表成功',
        data: {
          list: pagedList,
          total: filteredList.length,
          pageNo: Number(pageNo),
          pageSize: Number(pageSize)
        }
      }
    }
  },

  // 获取托管明细详情
  {
    url: '/mock/v1/trust/detail',
    method: 'get',
    response: ({ query }) => {
      const { id } = query

      if (!id) {
        return {
          code: '100001',
          message: '缺少必要参数：id',
          data: null
        }
      }

      const transaction = trustTransactionData.find((item) => item.id === id)

      if (!transaction) {
        return {
          code: '100002',
          message: '托管明细不存在',
          data: null
        }
      }

      return {
        code: '000000',
        message: '获取托管明细详情成功',
        data: transaction
      }
    }
  },

  // 取回托管资产
  {
    url: '/mock/v1/trust/retrieve',
    method: 'post',
    response: ({ body }) => {
      const { id, retrieveAmount, calculatedReturn, returnAddress, remark } = body

      if (!id || !retrieveAmount || !returnAddress) {
        return {
          code: '100001',
          message: '缺少必要参数',
          data: null
        }
      }

      const transaction = trustTransactionData.find((item) => item.id === id)

      if (!transaction) {
        return {
          code: '100002',
          message: '托管明细不存在',
          data: null
        }
      }

      // 验证取回金额
      if (retrieveAmount <= 0 || retrieveAmount > transaction.assetAmount) {
        return {
          code: '100003',
          message: '取回金额无效',
          data: null
        }
      }

      // 验证托管状态
      if (transaction.status !== 1) {
        return {
          code: '100004',
          message: '只有托管中的资产才能取回',
          data: null
        }
      }

      // 更新交易记录
      transaction.retrieveStatus = retrieveAmount === transaction.assetAmount ? 2 : 3 // 全部取回或部分取回
      transaction.retrieveStatusText = RETRIEVE_STATUS[transaction.retrieveStatus]
      transaction.retrieveTime = formatToDateTime(new Date())
      transaction.remark = remark
        ? `${transaction.remark ? transaction.remark + '; ' : ''}取回${retrieveAmount}${transaction.assetUnit}, 收益${calculatedReturn}${transaction.assetUnit}`
        : transaction.remark

      // 如果全部取回，更新托管状态为已完成
      if (transaction.retrieveStatus === 2) {
        transaction.status = 2
        transaction.statusText = TRUST_STATUS[2]
      }

      return {
        code: '000000',
        message: '资产取回处理已提交',
        data: transaction
      }
    }
  },

  // 删除托管明细（一般仅用于管理员）
  {
    url: '/mock/v1/trust/delete',
    method: 'delete',
    response: ({ query }) => {
      const { id } = query

      if (!id) {
        return {
          code: '100001',
          message: '缺少必要参数：id',
          data: null
        }
      }

      const index = trustTransactionData.findIndex((item) => item.id === id)

      if (index === -1) {
        return {
          code: '100002',
          message: '托管明细不存在',
          data: null
        }
      }

      // 模拟删除
      trustTransactionData.splice(index, 1)

      return {
        code: '000000',
        message: '删除托管明细成功',
        data: null
      }
    }
  },

  // 回收能量
  {
    url: '/mock/v1/trust/recycle-energy',
    method: 'post',
    response: ({ body }) => {
      const { id, amount, reason, remark } = body

      if (!id || !amount || !reason) {
        return {
          code: '100001',
          message: '缺少必要参数',
          data: null
        }
      }

      const transaction = trustTransactionData.find((item) => item.id === id)

      if (!transaction) {
        return {
          code: '100002',
          message: '托管明细不存在',
          data: null
        }
      }

      // 验证状态
      if (transaction.status !== 1) {
        return {
          code: '100004',
          message: '只有托管中的能量才能回收',
          data: null
        }
      }

      // 更新交易记录
      transaction.recycleStatus = 2 // 已回收
      transaction.recycleStatusText = '已回收'
      transaction.remark = remark
        ? `${transaction.remark ? transaction.remark + '; ' : ''}回收${amount}能量, 原因: ${reason}`
        : transaction.remark

      return {
        code: '000000',
        message: '能量回收操作成功',
        data: transaction
      }
    }
  },

  // 补发能量
  {
    url: '/mock/v1/trust/resend-energy',
    method: 'post',
    response: ({ body }) => {
      const { id, amount, reason, remark } = body

      if (!id || !amount || !reason) {
        return {
          code: '100001',
          message: '缺少必要参数',
          data: null
        }
      }

      const transaction = trustTransactionData.find((item) => item.id === id)

      if (!transaction) {
        return {
          code: '100002',
          message: '托管明细不存在',
          data: null
        }
      }

      // 更新交易记录
      transaction.supplementStatus = 1 // 已补充
      transaction.supplementStatusText = '已补充'
      // 增加能量数量
      transaction.energyAmount = (transaction.energyAmount || 0) + amount
      transaction.remark = remark
        ? `${transaction.remark ? transaction.remark + '; ' : ''}补发${amount}能量, 原因: ${reason}`
        : transaction.remark

      return {
        code: '000000',
        message: '能量补发操作成功',
        data: transaction
      }
    }
  }
] as MockMethod[]
