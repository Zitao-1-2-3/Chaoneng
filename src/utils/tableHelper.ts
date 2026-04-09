/**
 * 表格工具函数
 */

/**
 * 格式化表格单元格的值，如果为空则显示 "-"
 * @param value 单元格的值
 * @returns 格式化后的值
 */
export const formatTableCell = (value: any): string => {
  // 处理 null、undefined、空字符串
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  // 处理数字 0（0 是有效值，不应该显示为 -）
  if (typeof value === 'number') {
    return String(value)
  }

  // 处理布尔值
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }

  // 处理字符串
  if (typeof value === 'string') {
    return value.trim() === '' ? '-' : value
  }

  // 其他类型直接转字符串
  return String(value)
}

/**
 * 为 TableColumn 添加默认的 formatter
 * 如果列没有定义 formatter 且没有 slots，则自动添加空值处理
 * @param columns 表格列配置数组
 * @returns 处理后的表格列配置数组
 */
export const addDefaultFormatter = (columns: any[]): any[] => {
  return columns.map((col) => {
    // 如果已经有 formatter 或 slots，不做处理
    if (col.formatter || col.slots) {
      return col
    }

    // 添加默认的 formatter
    return {
      ...col,
      formatter: (row: any) => formatTableCell(row[col.field])
    }
  })
}
