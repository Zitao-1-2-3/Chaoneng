import { Layout } from '@/utils/routerHelper'
// import { useI18n } from '@/hooks/web/useI18n' // Assuming t() is not directly used here

// Rely on global AppRouteRecordRaw type

// No longer need userInfo logic here

const managementRoutes: AppRouteRecordRaw[] = [
  {
    path: '/bot_manage',
    component: Layout,
    name: 'BotManage',
    redirect: '/bot_manage/bot_list',
    meta: {
      title: '机器人管理',
      icon: 'lucide:bot',
      alwaysShow: true
    },
    children: [
      {
        path: 'bot_list',
        component: () => import('@/views/Bot_manage/bot_list/index.vue'),
        name: 'BotList',
        meta: {
          title: '机器人列表'
        }
      },
      {
        path: 'menu_list',
        component: () => import('@/views/Bot_manage/menu_list/index.vue'),
        name: 'MenuList',
        meta: {
          title: '菜单列表'
        }
      },
      {
        path: 'reply_list',
        component: () => import('@/views/Bot_manage/reply_list/index.vue'),
        name: 'ReplyList',
        meta: {
          title: '关键词回复'
        }
      }
    ]
  },
  {
    path: '/hosted_list',
    component: Layout,
    name: 'Hosted',
    meta: {
      title: '托管列表',
      icon: 'vi-mdi:order-bool-ascending-variant',
      alwaysShow: true
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/HostedList/index.vue'),
        name: 'HostedList',
        meta: {
          title: '托管列表'
        }
      }
    ]
  },
  {
    path: '/black_list',
    component: Layout,
    name: 'Black',
    meta: {
      title: '黑名单列表',
      icon: 'vi-mdi:order-bool-ascending-variant',
      alwaysShow: true
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/BlackList/index.vue'),
        name: 'BlackList',
        meta: {
          title: '黑名单列表'
        }
      }
    ]
  },
  {
    path: '/user_group',
    component: Layout,
    name: 'UserGroup',
    meta: {
      title: '用户群组',
      icon: 'vi-ph:users-three-fill',
      alwaysShow: true
    },
    children: [
      {
        path: 'user_list',
        component: () => import('@/views/UserGroup/user_list/index.vue'),
        name: 'UserList',
        meta: {
          title: '用户列表'
        }
      }
    ]
  },
  {
    path: '/order_manage',
    component: Layout,
    name: 'OrderManage',
    meta: {
      title: '订单管理',
      icon: 'vi-mdi:order-bool-ascending-variant',
      alwaysShow: true
    },
    children: [
      {
        path: 'recharge_order',
        component: () => import('@/views/OrderManage/recharge_order/index.vue'),
        name: 'RechargeOrder',
        meta: {
          title: '充值订单'
        }
      },
      {
        path: 'energy_order',
        component: () => import('@/views/OrderManage/energy_order/index.vue'),
        name: 'EnergyOrder',
        meta: {
          title: '能量订单'
        }
      },
      // {
      //   path: 'hosted_order',
      //   component: () => import('@/views/OrderManage/hosted_order/index.vue'),
      //   name: 'HostedOrder',
      //   meta: {
      //     title: '托管订单'
      //   }
      // },
      {
        path: 'exchange_order',
        component: () => import('@/views/OrderManage/exchange_order/index.vue'),
        name: 'ExchangeOrder',
        meta: {
          title: '兑换订单'
        }
      }
    ]
  },
  {
    path: '/data_statistics',
    component: Layout,
    name: 'DataStatistics', // Note: Duplicated name with operation route, might need adjustment
    meta: {
      title: '数据统计',
      icon: 'vi-carbon:chart-area',
      alwaysShow: true
    },
    children: [
      {
        path: 'bot_summary',
        component: () => import('@/views/DataStatistics/bot_summary/index.vue'),
        name: 'BotSummary',
        meta: {
          title: '机器人汇总'
        }
      }
    ]
  },
  {
    path: '/account_manage',
    component: Layout,
    name: 'AccountManage',
    meta: {
      title: '账户管理',
      icon: 'vi-mdi:account-cog',
      alwaysShow: true
    },
    children: [
      {
        path: 'account_list',
        component: () => import('@/views/AccountManage/account_list/index.vue'),
        name: 'AccountList',
        meta: {
          title: '账户信息'
        }
      }
    ]
  }
]

export default managementRoutes
