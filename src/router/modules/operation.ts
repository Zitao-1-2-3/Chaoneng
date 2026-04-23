import { Layout } from '@/utils/routerHelper'
// import { useI18n } from '@/hooks/web/useI18n' // Assuming t() is not directly used here, otherwise uncomment

// Rely on global AppRouteRecordRaw type

// const { t } = useI18n() // Assuming t() is not directly used here, otherwise uncomment
let operationRoutes: AppRouteRecordRaw[] = []
if (import.meta.env.VITE_SYSTEM_TYPE === 'Operation') {
  operationRoutes = [
    {
      path: '/data_statistics',
      component: Layout,
      name: 'DataStatistics',
      redirect: '/data_statistics/index',
      meta: {
        title: '数据统计',
        icon: 'vi-mdi:chart-bar'
      },
      children: [
        {
          path: 'index',
          component: () => import('@/operationView/DataStatistics/Analysis.vue'),
          name: 'Analysis',
          meta: {
            title: '数据统计',
            icon: 'vi-mdi:chart-bar'
          }
        }
      ]
    },
    {
      path: '/exchange_rate',
      component: Layout,
      name: 'ExchangeRate',
      redirect: '/exchange_rate/index',
      meta: {
        title: '实时汇率监听',
        icon: 'vi-mdi:currency-usd'
      },
      children: [
        {
          path: 'index',
          component: () => import('@/operationView/ExchangeRate/index.vue'),
          name: 'ExchangeRateIndex',
          meta: {
            title: '实时汇率监听',
            icon: 'vi-mdi:currency-usd'
          }
        }
      ]
    },
    {
      path: '/operation',
      component: Layout,
      name: 'Operation',
      meta: {
        title: '运营中心',
        icon: 'vi-mdi:view-dashboard',
        alwaysShow: true
      },
      children: [
        {
          path: 'recharge_order',
          component: () => import('@/operationView/OperationCenter/RechargeOrder/index.vue'),
          name: 'RechargeOrder',
          meta: {
            title: '充值订单'
          }
        },
        {
          path: 'energy_transaction',
          component: () => import('@/operationView/OperationCenter/EnergyTransaction/index.vue'),
          name: 'EnergyTransactionList',
          meta: {
            title: '能量交易订单'
          }
        },
        {
          path: 'flash_exchange',
          component: () => import('@/operationView/OperationCenter/ExchangeTransaction/index.vue'),
          name: 'FlashExchange',
          meta: {
            title: '闪兑明细'
          }
        },
        {
          path: 'hosted_list',
          component: () => import('@/operationView/OperationCenter/HostedList/index.vue'),
          name: 'HostedList',
          meta: {
            title: '托管列表'
          }
        }
      ]
    },
    {
      path: '/marketing',
      component: Layout,
      name: 'Marketing',
      meta: {
        title: '营销管理',
        icon: 'vi-mdi:bullhorn',
        alwaysShow: true
      },
      children: [
        {
          path: 'agent_price',
          component: () => import('@/operationView/Marketing/AgentPrice.vue'),
          name: 'AgentPrice',
          meta: {
            title: '代理价格配置',
            buttonList: ['add', 'edit']
          }
        },
        {
          path: 'payment',
          component: () => import('@/operationView/Marketing/TrxAddress.vue'),
          name: 'Payment',
          meta: {
            title: '收款配置',
            buttonList: ['add', 'edit', 'delete']
          }
        },
        {
          path: 'trx_address_book',
          component: () => import('@/operationView/Marketing/TrxAddressBook.vue'),
          name: 'TrxAddressBook',
          meta: {
            hidden: true,
            title: '收款地址簿',
            buttonList: ['add', 'edit', 'delete']
          }
        }
      ]
    },
    {
      path: '/agent',
      component: Layout,
      name: 'Agent',
      meta: {
        title: '代理管理',
        icon: 'vi-mdi:account-group',
        alwaysShow: true
      },
      children: [
        {
          path: 'agent_list',
          component: () => import('@/operationView/Agent/AgentList.vue'),
          name: 'AgentList',
          meta: {
            title: '代理信息',
            buttonList: ['add', 'edit', 'delete']
          }
        },
        {
          path: 'agent_recharge',
          component: () => import('@/operationView/Agent/AgentRecharge.vue'),
          name: 'AgentRecharge',
          meta: {
            hidden: true,
            title: '代理充值明细'
          }
        },
        {
          path: 'ledger',
          component: () => import('@/operationView/Agent/Ledger.vue'),
          name: 'AgentLedger',
          meta: {
            title: '代理账本'
          }
        },
        {
          path: 'bot_list',
          component: () => import('@/operationView/Agent/BotList.vue'),
          name: 'AgentBotList',
          meta: {
            title: '机器人列表',
            buttonList: ['edit']
          }
        },
        {
          path: 'user_list',
          component: () => import('@/operationView/Agent/UserList.vue'),
          name: 'UserList',
          meta: {
            title: '用户列表'
          }
        }
      ]
    },
    // 系统管理
    {
      path: '/authorization',
      component: Layout,
      redirect: '/authorization/user',
      name: 'Authorization',
      meta: {
        title: '权限管理',
        icon: 'vi-eos-icons:role-binding',
        alwaysShow: true
      },
      children: [
        {
          path: 'user',
          component: () => import('@/operationView/Authorization/User/User.vue'),
          name: 'User',
          meta: {
            title: '用户管理',
            buttonList: ['add', 'edit', 'delete']
          }
        },
        {
          path: 'role',
          component: () => import('@/operationView/Authorization/Role/Role.vue'),
          name: 'Role',
          meta: {
            title: '角色管理',
            buttonList: ['add', 'edit', 'delete']
          }
        }
      ]
    },
    {
      path: '/customer-service',
      component: Layout,
      redirect: '/customer-service/index',
      name: 'CustomerService',
      meta: {
        title: '客服管理',
        icon: 'ant-design:customer-service-outlined' // Material Design Icons: account-headset
      },
      children: [
        {
          path: 'index',
          name: 'CustomerServicePage',
          component: () => import('@/operationView/CustomerService/index.vue'),
          meta: {
            title: '客服管理',
            icon: 'ant-design:customer-service-outlined'
          }
        }
      ]
    },
    {
      path: '/system_config',
      component: Layout,
      name: 'SystemConfig',
      meta: {
        title: '系统配置',
        icon: 'vi-mdi:wrench',
        alwaysShow: true
      },
      children: [
        {
          path: 'resource_pool',
          component: () => import('@/operationView/SystemConfig/ResourcePool.vue'),
          name: 'ResourcePool',
          meta: {
            title: '资源池账户',
            buttonList: ['add', 'edit']
          }
        }
      ]
    }
  ]
} else {
  operationRoutes = []
}

export default operationRoutes
