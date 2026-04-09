import { Layout } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'
// 直接导入关键页面，避免懒加载导致首次访问延迟
import Login from '@/views/Login/Login.vue'
import NotFound from '@/views/Error/404.vue'

// Rely on global AppRouteRecordRaw type

const { t } = useI18n()

const baseRoutes: AppRouteRecordRaw[] = [
  // Note: Root route ('/') is kept in index.ts
  {
    path: '/redirect',
    component: Layout,
    name: 'RedirectWrap',
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/Redirect/Redirect.vue'),
        meta: {}
      }
    ],
    meta: {
      hidden: true,
      noTagsView: true
    }
  },
  {
    path: '/login',
    component: Login, // 直接使用导入的组件，避免懒加载
    name: 'Login',
    meta: {
      hidden: true,
      title: t('router.login'),
      noTagsView: true
    }
  },
  {
    path: '/reset-password',
    component: () => import('@/views/Login/ResetPassword.vue'),
    name: 'ResetPassword',
    meta: {
      hidden: true,
      title: t('router.resetPassword'),
      noTagsView: true
    }
  },
  {
    path: '/personal',
    component: Layout,
    redirect: '/personal/personal-center',
    name: 'Personal',
    meta: {
      title: t('router.personal'),
      hidden: true,
      canTo: true
    },
    children: [
      {
        path: 'personal-center',
        component: () => import('@/views/Personal/PersonalCenter/PersonalCenter.vue'),
        name: 'PersonalCenter',
        meta: {
          title: t('router.personalCenter'),
          hidden: true,
          canTo: true
        }
      }
    ]
  },
  {
    path: '/404',
    component: NotFound, // 直接使用导入的组件
    name: 'NoFind',
    meta: {
      hidden: true,
      title: '404',
      noTagsView: true
    }
  }
]

export default baseRoutes
