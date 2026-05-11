/**
 * 能量交易列表 - 表格列配置
 */

import { h } from 'vue'
import { ElTag } from 'element-plus'
import type { EnergyOrder } from './types'
import { formatToDateTime } from '@/utils/dateUtil'
import { formatToWan } from '@/utils'
import { getSourceText } from '@/utils/sourceFilter'
import { getEnergyOrderKindText, calculateEnergyRentText } from '@/utils/energyOrder'
import { getStatusText, getStatusType } from '@/utils/orderStatus'

/**
 * 列配置项
 */
export interface ColumnConfig {
  field: string
  label: string
  width?: number
  minWidth?: number
  sortable?: 'custom' | boolean
  hideWhen?: number // 当来源为此值时隐藏
  formatter?: (row: EnergyOrder) => string | number
  slots?: {
    default: (data: { row: EnergyOrder }) => any
  }
}

/**
 * 获取所有列配置
 */
export function getAllColumns(): ColumnConfig[] {
  return [
    {
      field: 'id',
      label: '订单ID',
      minWidth: 180,
      formatter: (row) => row.id || '-'
    },
    {
      field: 'agent_name',
      label: '代理名称',
      width: 120,
      formatter: (row) => row.agent_name || '-'
    },
    {
      field: 'tg_user_name',
      label: 'TG用户名',
      width: 120,
      hideWhen: 2, // H5时隐藏
      formatter: (row) => row.tg_user_name || '-'
    },
    {
      field: 'tg_first_name',
      label: 'TG用户昵称',
      width: 120,
      hideWhen: 2, // H5时隐藏
      formatter: (row) => row.tg_first_name || '-'
    },
    {
      field: 'username',
      label: '用户账号',
      width: 120,
      hideWhen: 1, // 来源为机器人(1)时隐藏
      formatter: (row) => row.username || '-'
    },
    {
      field: 'email',
      label: '用户邮箱',
      minWidth: 150,
      hideWhen: 1, // 来源为机器人(1)时隐藏
      formatter: (row) => row.email || '-'
    },
    {
      field: 'origin',
      label: '来源',
      width: 100,
      formatter: (row) => getSourceText(row.origin, row.tg_user_name, row.username)
    },
    {
      field: 'kind',
      label: '订单类型',
      width: 120,
      formatter: (row) => getEnergyOrderKindText(row.kind)
    },
    {
      field: 'amount',
      label: '交易金额',
      width: 100,
      formatter: (row) => {
        const amount = row.amount ?? ''
        const unit = row.coin ?? ''
        return amount || unit ? `${amount} ${unit}`.trim() : '-'
      }
    },
    {
      field: 'energy_amount',
      label: '应发放能量',
      width: 100,
      formatter: (row) => formatToWan(row.energy_amount) || '-'
    },
    {
      field: 'energy_actual_amount',
      label: '实际发放能量',
      width: 110,
      formatter: (row) => formatToWan(row.energy_actual_amount) || '-'
    },
    {
      field: 'receive_address',
      label: '收款方式',
      minWidth: 200,
      formatter: (row) => {
        // 如果能量接收地址为空，显示横杠
        if (!row.energy_address || row.energy_address.trim() === '') {
          return '-'
        }

        // 如果能量接收地址不为空，且收款地址为空，显示"余额支付"
        if (!row.receive_address || row.receive_address.trim() === '') {
          return '余额支付'
        }

        // 其他情况显示收款地址
        return row.receive_address
      }
    },
    {
      field: 'energy_address',
      label: '能量接收地址',
      minWidth: 200,
      formatter: (row) => row.energy_address || '-'
    },
    {
      field: 'energy_count',
      label: '笔数',
      width: 100,
      formatter: (row): string | number => {
        if (row.energy_count === 0 || row.energy_count === null || row.energy_count === undefined) {
          return '-'
        }
        return row.energy_count
      }
    },
    {
      field: 'energy_rent_text',
      label: '有效时长',
      width: 100,
      formatter: (row) => calculateEnergyRentText(row.kind, row.delegated_at, row.recycled_at)
    },
    {
      field: 'recycled_at',
      label: '回收时间',
      sortable: 'custom',
      width: 160,
      formatter: (row) => {
        if (!row.recycled_at) return '-'
        try {
          return formatToDateTime(new Date(row.recycled_at).getTime())
        } catch (e) {
          return '-'
        }
      }
    },
    {
      field: 'status',
      label: '状态',
      width: 100,
      slots: {
        default: ({ row }) => {
          const type = getStatusType(row.status)
          const text = getStatusText(row.status)
          return h(ElTag, { type, size: 'small' }, () => text)
        }
      }
    },
    {
      field: 'created_at',
      label: '创建时间',
      sortable: 'custom',
      width: 160,
      formatter: (row) => (row.created_at ? formatToDateTime(row.created_at) : '-')
    },
    {
      field: 'describe',
      label: '描述',
      width: 160,
      formatter: (row) => row.describe || '-'
    }
  ]
}

/**
 * 根据来源过滤列
 * @param selectedSource 选择的来源
 * @returns 过滤后的列配置
 */
export function getFilteredColumns(selectedSource: number | string): ColumnConfig[] {
  const allCols = getAllColumns()

  return allCols.filter((col) => {
    if (!col.hideWhen) return true
    return selectedSource !== col.hideWhen
  })
}
