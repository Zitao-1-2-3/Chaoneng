import { ElMessage } from 'element-plus'

/**
 * 统一的消息提示工具
 * 用于在数据获取、操作等场景中提供一致的用户反馈
 */

/**
 * 处理数据列表获取的提示
 * @param list 数据列表
 * @param hasSearchCondition 是否有搜索条件
 * @param dataName 数据名称（如：机器人、订单、用户等）
 */
export const handleListMessage = (
  list: any[],
  hasSearchCondition: boolean = false,
  dataName: string = '数据'
) => {
  if (list.length === 0) {
    if (hasSearchCondition) {
      ElMessage.info(`未找到符合条件的${dataName}`)
    } else {
      ElMessage.info(`暂无${dataName}`)
    }
  }
}

/**
 * 处理请求成功的提示
 * @param message 成功消息
 */
export const handleSuccessMessage = (message: string = '操作成功') => {
  ElMessage.success(message)
}

/**
 * 处理请求失败的提示
 * @param error 错误对象或错误消息
 * @param defaultMessage 默认错误消息
 */
export const handleErrorMessage = (error: any, defaultMessage: string = '操作失败，请稍后重试') => {
  console.error(defaultMessage, error)

  // 如果error是字符串，直接使用
  if (typeof error === 'string') {
    ElMessage.error(error)
    return
  }

  // 如果error有msg或message属性
  const errorMsg = error?.msg || error?.message
  if (errorMsg) {
    ElMessage.error(`${defaultMessage.split('，')[0]}：${errorMsg}`)
    return
  }

  // 使用默认消息
  ElMessage.error(defaultMessage)
}

/**
 * 处理警告提示
 * @param message 警告消息
 */
export const handleWarningMessage = (message: string) => {
  ElMessage.warning(message)
}

/**
 * 处理数据格式错误的提示
 * @param dataName 数据名称
 */
export const handleDataFormatError = (dataName: string = '数据') => {
  ElMessage.warning(`获取${dataName}失败：数据格式错误`)
}

/**
 * 处理参数验证失败的提示
 * @param paramName 参数名称
 */
export const handleParamError = (paramName: string) => {
  ElMessage.warning(`${paramName}不能为空`)
}
