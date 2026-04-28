import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// TG用户接口
interface TgUser {
  id: number
  tg_user_id: number
  tg_nickname: string
  bot_id: number
  bot_username: string
  trx_balance: number
  usdt_balance: number
  created_at: number
  updated_at: number
  last_active_time: number
  is_blocked: boolean
  language_code: string
}

// 群发记录接口
interface MassSendRecord {
  id: number
  bot_id: number
  bot_name: string
  send_type: 'all' | 'active' | 'new'
  message_type: 'text' | 'image' | 'video'
  content: string
  status: 'success' | 'failed'
  total_count: number
  success_count: number
  created_at: number
  sender: string
}

// 余额记录接口
interface BalanceRecord {
  id: number
  user_id: number
  tg_user_id: number
  tg_nickname: string
  amount: number
  currency_type: 'TRX' | 'USDT'
  operation_type: 'recharge' | 'consumption' | 'refund'
  before_balance: number
  after_balance: number
  created_at: number
  remark: string
}

// 机器人列表
const botList = [
  { id: 1, username: 'Bot1', name: 'TG机器人1' },
  { id: 2, username: 'Bot2', name: 'TG机器人2' },
  { id: 3, username: 'Bot3', name: 'TG机器人3' }
]

// 生成TG用户数据
const generateTgUsers = (): TgUser[] => {
  const users: TgUser[] = []

  for (let i = 1; i <= 100; i++) {
    const botIndex = i % 3
    const now = Math.floor(Date.now() / 1000) // 当前时间的秒级时间戳
    const createdAt = now - Mock.Random.integer(86400 * 7, 86400 * 365) // 7天至1年前创建
    const updatedAt = now - Mock.Random.integer(0, 86400 * 7) // 最近7天内更新
    const lastActiveTime = now - Mock.Random.integer(0, 86400 * 30) // 最近30天内活跃

    users.push({
      id: i,
      tg_user_id: 10000000 + i,
      tg_nickname: Mock.Random.name(),
      bot_id: botList[botIndex].id,
      bot_username: botList[botIndex].username,
      trx_balance: Mock.Random.float(0, 10000, 2, 2),
      usdt_balance: Mock.Random.float(0, 1000, 2, 2),
      created_at: createdAt,
      updated_at: updatedAt,
      last_active_time: lastActiveTime,
      is_blocked: Math.random() < 0.05, // 5%概率被封禁
      language_code: Mock.Random.pick(['en', 'zh', 'ru', 'es', 'fr'])
    })
  }

  return users
}

// 生成群发记录数据
const generateMassSendRecords = (): MassSendRecord[] => {
  const records: MassSendRecord[] = []

  for (let i = 1; i <= 50; i++) {
    const botIndex = i % 3
    const sendType = Mock.Random.pick(['all', 'active', 'new'])
    const messageType = Mock.Random.pick(['text', 'image', 'video'])
    const now = Math.floor(Date.now() / 1000)
    const createdAt = now - Mock.Random.integer(0, 86400 * 30) // 最近30天内发送
    const totalCount = Mock.Random.integer(50, 500)
    const successCount = totalCount - Mock.Random.integer(0, Math.floor(totalCount * 0.2)) // 成功率80%以上

    records.push({
      id: i,
      bot_id: botList[botIndex].id,
      bot_name: botList[botIndex].name,
      send_type: sendType as 'all' | 'active' | 'new',
      message_type: messageType as 'text' | 'image' | 'video',
      content:
        messageType === 'text'
          ? Mock.Random.sentence(5, 20)
          : `https://example.com/${messageType}/${Mock.Random.guid()}.${messageType === 'image' ? 'jpg' : 'mp4'}`,
      status: successCount > 0 ? 'success' : 'failed',
      total_count: totalCount,
      success_count: successCount,
      created_at: createdAt,
      sender: Mock.Random.pick(['admin', 'system', 'operator'])
    })
  }

  return records
}

// 生成余额记录数据
const generateBalanceRecords = (users: TgUser[]): BalanceRecord[] => {
  const records: BalanceRecord[] = []

  users.forEach((user) => {
    const recordCount = Mock.Random.integer(0, 10) // 每个用户0-10条记录

    for (let i = 0; i < recordCount; i++) {
      const currencyType = Mock.Random.pick(['TRX', 'USDT'])
      const operationType = Mock.Random.pick(['recharge', 'consumption', 'refund'])
      const amount =
        operationType === 'consumption'
          ? -Mock.Random.float(1, 100, 2, 2)
          : Mock.Random.float(10, 500, 2, 2)

      const beforeBalance = currencyType === 'TRX' ? user.trx_balance : user.usdt_balance
      const afterBalance = beforeBalance + amount
      const now = Math.floor(Date.now() / 1000)
      const createdAt = now - Mock.Random.integer(0, 86400 * 60) // 最近60天内

      records.push({
        id: records.length + 1,
        user_id: user.id,
        tg_user_id: user.tg_user_id,
        tg_nickname: user.tg_nickname,
        amount,
        currency_type: currencyType as 'TRX' | 'USDT',
        operation_type: operationType as 'recharge' | 'consumption' | 'refund',
        before_balance: beforeBalance,
        after_balance: afterBalance,
        created_at: createdAt,
        remark:
          operationType === 'recharge'
            ? '用户充值'
            : operationType === 'consumption'
              ? '消费'
              : '退款'
      })
    }
  })

  // 按时间排序，最新的在前面
  return records.sort((a, b) => b.created_at - a.created_at)
}

// 生成数据
const tgUsers = generateTgUsers()
const massSendRecords = generateMassSendRecords()
const balanceRecords = generateBalanceRecords(tgUsers)

export default [
  // 获取TG用户列表
  {
    url: '/mock/v1/user/bot/tg_user/list',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { bot_id, tg_user_id, pageSize = 10, currentPage = 1 } = request.query

      let list = [...tgUsers]

      // 筛选
      if (bot_id !== undefined && bot_id !== '') {
        list = list.filter((item) => item.bot_id === parseInt(bot_id))
      }

      if (tg_user_id !== undefined && tg_user_id !== '') {
        list = list.filter((item) => item.tg_user_id.toString().includes(tg_user_id.toString()))
      }

      // 分页
      const start = (currentPage - 1) * pageSize
      const end = start + parseInt(pageSize)
      const pageList = list.slice(start, end)

      return {
        code: SUCCESS_CODE,
        data: {
          list: pageList,
          total: list.length
        },
        message: '获取成功'
      }
    }
  },

  // 获取TG用户详情
  {
    url: '/mock/v1/user/bot/tg_user/detail',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { id } = request.query
      const user = tgUsers.find((item) => item.id === parseInt(id))

      if (!user) {
        return {
          code: 400,
          message: '用户不存在'
        }
      }

      return {
        code: SUCCESS_CODE,
        data: user,
        message: '获取成功'
      }
    }
  },

  // 发送消息
  {
    url: '/mock/v1/user/bot/tg_user/send_message',
    method: 'post',
    timeout,
    response: (request: any) => {
      const { tg_user_id, content } = request.body

      // 简单验证
      if (!tg_user_id || !content) {
        return {
          code: 400,
          message: '参数不完整'
        }
      }

      return {
        code: SUCCESS_CODE,
        data: {
          message_id: Mock.Random.integer(1000, 9999),
          send_time: Math.floor(Date.now() / 1000)
        },
        message: '发送成功'
      }
    }
  },

  // 群发消息
  {
    url: '/mock/v1/user/bot/tg_user/mass_send',
    method: 'post',
    timeout: 2000, // 群发消息稍微延迟久一点
    response: (request: any) => {
      const { bot_id, filter_type, message_type, content } = request.body

      // 简单验证
      if (!bot_id || !filter_type || !message_type || !content) {
        return {
          code: 400,
          message: '参数不完整'
        }
      }

      // 根据筛选条件模拟受众数量
      let targetCount = 0
      if (filter_type === 'all') {
        targetCount = Mock.Random.integer(100, 500)
      } else if (filter_type === 'active') {
        targetCount = Mock.Random.integer(50, 300)
      } else if (filter_type === 'new') {
        targetCount = Mock.Random.integer(10, 100)
      }

      return {
        code: SUCCESS_CODE,
        data: {
          task_id: Mock.Random.guid(),
          target_count: targetCount,
          estimated_time: Math.ceil(targetCount / 50) // 模拟每50人需要1秒
        },
        message: '群发任务已创建'
      }
    }
  },

  // 获取群发记录
  {
    url: '/mock/v1/user/bot/tg_user/mass_send/records',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { bot_id, start_date, end_date, pageSize = 10, currentPage = 1 } = request.query

      let list = [...massSendRecords]

      // 筛选
      if (bot_id !== undefined && bot_id !== '') {
        list = list.filter((item) => item.bot_id === parseInt(bot_id))
      }

      if (start_date && end_date) {
        const startTimestamp = new Date(start_date).getTime() / 1000
        const endTimestamp = new Date(end_date).getTime() / 1000 + 86400 // 加一天
        list = list.filter(
          (item) => item.created_at >= startTimestamp && item.created_at <= endTimestamp
        )
      }

      // 分页
      const start = (currentPage - 1) * pageSize
      const end = start + parseInt(pageSize)
      const pageList = list.slice(start, end)

      return {
        code: SUCCESS_CODE,
        data: {
          list: pageList,
          total: list.length
        },
        message: '获取成功'
      }
    }
  },

  // 获取群发记录详情
  {
    url: '/mock/v1/user/bot/tg_user/mass_send/detail',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { id } = request.query
      const record = massSendRecords.find((item) => item.id === parseInt(id))

      if (!record) {
        return {
          code: 400,
          message: '记录不存在'
        }
      }

      return {
        code: SUCCESS_CODE,
        data: record,
        message: '获取成功'
      }
    }
  },

  // 获取余额记录
  {
    url: '/mock/v1/user/bot/tg_user/balance/records',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { user_id, currency_type, pageSize = 10, currentPage = 1 } = request.query

      let list = [...balanceRecords]

      // 筛选
      if (user_id !== undefined && user_id !== '') {
        list = list.filter((item) => item.user_id === parseInt(user_id))
      }

      if (currency_type !== undefined && currency_type !== '') {
        list = list.filter((item) => item.currency_type === currency_type)
      }

      // 分页
      const start = (currentPage - 1) * pageSize
      const end = start + parseInt(pageSize)
      const pageList = list.slice(start, end)

      return {
        code: SUCCESS_CODE,
        data: {
          list: pageList,
          total: list.length
        },
        message: '获取成功'
      }
    }
  },

  // 用户充值
  {
    url: '/mock/v1/user/bot/tg_user/balance/recharge',
    method: 'post',
    timeout,
    response: (request: any) => {
      const { user_id, amount, currency_type } = request.body

      // 简单验证
      if (!user_id || !amount || !currency_type) {
        return {
          code: 400,
          message: '参数不完整'
        }
      }

      return {
        code: SUCCESS_CODE,
        data: {
          transaction_id: Mock.Random.guid(),
          user_id,
          amount,
          currency_type,
          status: 'success',
          created_at: Math.floor(Date.now() / 1000)
        },
        message: '充值成功'
      }
    }
  }
]
