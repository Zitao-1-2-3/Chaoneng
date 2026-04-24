import request from '@/axios'
import type {
  MenuListParamsV1,
  MenuListResponseV1,
  AddMenuParamsV1,
  UpdateMenuParamsV1
} from './types'

// 导出类型定义
export * from './types'

// ========== 新接口 v1 ==========

const BASE_URL = '/v1/bot/menu/'

/**
 * 获取机器人菜单列表 - 新接口 v1
 * GET /v1/bot/menu/list
 */
export const v1GetMenuList = (params: MenuListParamsV1): Promise<IResponse<MenuListResponseV1>> => {
  return request.get({
    url: `${BASE_URL}list`,
    params
  })
}

/**
 * 添加机器人菜单 - 新接口 v1
 * POST /v1/bot/menu/add
 */
export const v1AddMenu = (data: AddMenuParamsV1): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}add`,
    data
  })
}

/**
 * 更新机器人菜单 - 新接口 v1
 * POST /v1/bot/menu/update
 */
export const v1UpdateMenu = (data: UpdateMenuParamsV1): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}update`,
    data
  })
}

// ========== v2 接口（运营端） ==========

const BASE_URL_V2 = '/v2/bot/menu/'

export const v2GetMenuList = (params: MenuListParamsV1): Promise<IResponse<MenuListResponseV1>> => {
  return request.get({ url: `${BASE_URL_V2}list`, params })
}

export const v2AddMenu = (data: AddMenuParamsV1): Promise<IResponse> => {
  return request.post({ url: `${BASE_URL_V2}add`, data })
}

export const v2UpdateMenu = (data: UpdateMenuParamsV1): Promise<IResponse> => {
  return request.post({ url: `${BASE_URL_V2}update`, data })
}

export const v2DeleteMenuApi = (id: number) => {
  return request.delete({ url: `/v2/bot/menu/delete/${id}` })
}

// ========== 旧接口 ==========

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

// 获取内联回调操作指令列表 - 仅管理端使用
export const getCallBackListApi = () => {
  return request.get({ url: '/v1/bot/operate-command/list' })
}
