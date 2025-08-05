import request from '@/axios'
import { MenuItem } from './types'

// 导出类型定义
export * from './types'

// 新增的参数类型
export interface AddBotMenuParam {
  menu_name: string
  status: number
  menu_type: number
  inner_type: string
  inner_value?: string // URL链接时使用
  callback_type?: string // 回调函数时使用
  order_num?: number
}

// 更新的参数类型
export interface UpdateBotMenuParam extends AddBotMenuParam {
  id: number
}

// 获取菜单列表
export const getMenuListApi = (params: any) => {
  return request.get({ url: '/v1/bot/menu/list', params })
}

// 获取机器人回复内联按钮菜单列表 (用于发送消息时的内联按钮选择)
export const getBotReplyMenuListApi = (params: any = {}) => {
  return request.get({
    url: '/v1/bot/reply/menu_list',
    params
  })
}

// 删除菜单
export const deleteMenuApi = (id: number) => {
  return request.delete({ url: `/v1/bot/menu/delete/${id}` })
}

// 新增菜单
export const addMenuApi = (data: AddBotMenuParam) => {
  return request.post({ url: '/v1/bot/menu/add', data })
}

// 更新菜单
export const updateMenuApi = (data: UpdateBotMenuParam) => {
  return request.post({ url: '/v1/bot/menu/update', data })
}

// 保存菜单（新增或更新）- 兼容接口，内部会根据是否有ID调用不同接口
export const saveMenuApi = (data: Partial<UpdateBotMenuParam>) => {
  if (data.id) {
    return updateMenuApi(data as UpdateBotMenuParam)
  } else {
    return addMenuApi(data as AddBotMenuParam)
  }
}

// 获取内联回调操作指令列表
export const getCallBackListApi = () => {
  return request.get({ url: '/v1/bot/operate-command/list' })
}
