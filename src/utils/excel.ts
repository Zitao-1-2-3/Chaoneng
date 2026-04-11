import * as XLSX from 'xlsx'

/**
 * 列宽配置接口
 */
export interface ColumnWidth {
  wch: number // 字符宽度
}

/**
 * 导出 Excel 配置
 */
export interface ExportExcelOptions {
  data: any[] // 数据数组
  filename: string // 文件名（不含扩展名）
  sheetName?: string // 工作表名称，默认为 'Sheet1'
  columnWidths?: ColumnWidth[] // 列宽配置数组
  autoWidth?: boolean // 是否自动计算列宽，默认 true
}

/**
 * 计算列宽
 * @param data 数据数组
 * @param headers 表头数组
 * @returns 列宽配置数组
 */
function calculateColumnWidths(data: any[], headers: string[]): ColumnWidth[] {
  const widths: ColumnWidth[] = []

  headers.forEach((header) => {
    // 计算表头宽度
    let maxWidth = header.length

    // 遍历数据计算最大宽度
    data.forEach((row) => {
      const value = String(row[header] || '')
      // 中文字符按 2 个字符计算，英文按 1 个字符计算
      const length = value.replace(/[\u4e00-\u9fa5]/g, 'aa').length
      if (length > maxWidth) {
        maxWidth = length
      }
    })

    // 设置最小宽度为 10，最大宽度为 50
    widths.push({ wch: Math.min(Math.max(maxWidth + 2, 10), 50) })
  })

  return widths
}

/**
 * 导出数据到 Excel
 * @param options 导出配置
 */
export function exportToExcel(options: ExportExcelOptions): void {
  const { data, filename, sheetName = 'Sheet1', columnWidths, autoWidth = true } = options

  if (!data || data.length === 0) {
    console.warn('导出数据为空')
    return
  }

  // 获取表头
  const headers = Object.keys(data[0])

  // 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(data)

  // 设置列宽
  if (columnWidths) {
    worksheet['!cols'] = columnWidths
  } else if (autoWidth) {
    worksheet['!cols'] = calculateColumnWidths(data, headers)
  }

  // 创建工作簿
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // 导出文件
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * 导出数据到 Excel（简化版）
 * @param data 数据数组
 * @param filename 文件名
 */
export function simpleExportToExcel(data: any[], filename: string): void {
  exportToExcel({
    data,
    filename,
    autoWidth: true
  })
}
