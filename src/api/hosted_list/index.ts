import request from '@/axios'
import type { AutoManageAddressListParams, AutoManageAddressItem, BotOption } from './types'
// import type { ReplyItem } from '@/api/reply_list/types'; // This import may no longer be needed if getBotOptionsForHostedListApi is removed

// 获取tg用户智能托管地址列表
export const getAutoManageAddressListApi = (params: AutoManageAddressListParams) => {
  return request.get<{ list: AutoManageAddressItem[]; totalCount: number }>({
    url: '/v1/bot/tg_user/auto_manage/list',
    params
  })
}

// 取消智能托管地址
export const deleteAutoManageAddressApi = (id: number) => {
  return request.post<boolean>({
    // 假设返回boolean表示成功与否
    url: '/v1/bot/tg_user/auto_manage/delete',
    data: { id } // 通常POST删除会将ID放在body中
  })
}

// getBotOptionsForHostedListApi function removed as it's no longer used.
