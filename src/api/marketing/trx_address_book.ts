import request from '@/axios'

export interface TrxAddressBookItem {
  id: number
  agentName: string
  receivingAddress: string
  bot: string
  purpose: string
  trxBalance: number
  usdtBalance: number
}

export interface TrxAddressBookQueryParams extends PageParam {
  query?: string
}

export const getTrxAddressBookListApi = (params: TrxAddressBookQueryParams) => {
  return request.get({
    url: '/market/trx_address_book/list',
    params
  })
}

export const exportTrxAddressBookApi = (params: TrxAddressBookQueryParams) => {
  return request.get({
    url: '/market/trx_address_book/export',
    params,
    responseType: 'blob'
  })
}
