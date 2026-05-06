/**
 * 闪兑订单工具函数
 * 处理闪兑订单相关的业务逻辑
 */

/**
 * 闪兑订单类型枚举
 */
export enum ExchangeOrderType {
  USDT_TO_TRX = 1, // USDT 兑换 TRX
  TRX_TO_USDT = 2 // TRX 兑换 USDT
}

/**
 * 根据输入和输出币种判断闪兑订单类型
 * @param inCoin 输入币种
 * @param outCoin 输出币种
 * @returns 订单类型
 */
export function getExchangeOrderType(
  inCoin: string | undefined,
  outCoin: string | undefined
): ExchangeOrderType | null {
  if (!inCoin || !outCoin) return null

  const inCoinUpper = inCoin.toUpperCase()
  const outCoinUpper = outCoin.toUpperCase()

  if (inCoinUpper === 'USDT' && outCoinUpper === 'TRX') {
    return ExchangeOrderType.USDT_TO_TRX
  }

  if (inCoinUpper === 'TRX' && outCoinUpper === 'USDT') {
    return ExchangeOrderType.TRX_TO_USDT
  }

  return null
}

/**
 * 获取闪兑订单类型文本
 * @param inCoin 输入币种
 * @param outCoin 输出币种
 * @returns 订单类型文本
 */
export function getExchangeOrderTypeText(
  inCoin: string | undefined,
  outCoin: string | undefined
): string {
  const orderType = getExchangeOrderType(inCoin, outCoin)

  if (orderType === null) return '-'

  switch (orderType) {
    case ExchangeOrderType.USDT_TO_TRX:
      return 'USDT 兑换 TRX'
    case ExchangeOrderType.TRX_TO_USDT:
      return 'TRX 兑换 USDT'
    default:
      return '-'
  }
}

/**
 * 格式化金额显示（带币种）
 * @param amount 金额
 * @param coin 币种
 * @returns 格式化后的字符串
 */
export function formatAmountWithCoin(
  amount: string | number | undefined,
  coin: string | undefined
): string {
  if (amount === undefined || amount === null || amount === '') return '-'
  if (!coin) return String(amount)

  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '-'

  return `${num.toFixed(2)} ${coin.toUpperCase()}`
}

/**
 * 格式化汇率显示
 * @param rate 汇率
 * @returns 格式化后的字符串
 */
export function formatRate(rate: string | number | undefined): string {
  if (rate === undefined || rate === null || rate === '') return '-'

  const num = typeof rate === 'string' ? parseFloat(rate) : rate
  if (isNaN(num)) return '-'

  return num.toFixed(6)
}
