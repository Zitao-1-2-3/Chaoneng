import { resolve } from 'path'
import { loadEnv } from 'vite'
import type { UserConfig, ConfigEnv } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import progress from 'vite-plugin-progress'
// @ts-expect-error - vite-plugin-eslint 类型定义问题
import EslintPlugin from 'vite-plugin-eslint'
import { ViteEjsPlugin } from 'vite-plugin-ejs'
import { viteMockServe } from 'vite-plugin-mock'
// @ts-expect-error - vite-plugin-purge-icons 类型定义问题
import PurgeIcons from 'vite-plugin-purge-icons'
import ServerUrlCopy from 'vite-plugin-url-copy'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { createStyleImportPlugin, ElementPlusResolve } from 'vite-plugin-style-import'
import UnoCSS from 'unocss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { codeInspectorPlugin } from 'code-inspector-plugin'

// https://vitejs.dev/config/
const root = process.cwd()

function pathResolve(dir: string) {
  return resolve(root, '.', dir)
}

export default ({ command, mode }: ConfigEnv): UserConfig => {
  let env = {} as any
  const isBuild = command === 'build'
  if (!isBuild) {
    env = loadEnv(process.argv[3] === '--mode' ? process.argv[4] : process.argv[3], root)
  } else {
    env = loadEnv(mode, root)
  }
  console.log('Current VITE_SYSTEM_TYPE:', env.VITE_SYSTEM_TYPE)
  console.log('Current VITE_TRONSCAN_URL:', env.VITE_TRONSCAN_URL)
  return {
    base:
      env.VITE_BASE_PATH || (env.VITE_SYSTEM_TYPE === 'Management' ? '/management' : '/operation'),
    plugins: [
      codeInspectorPlugin({
        bundler: 'vite'
      }),
      Vue({
        script: {
          // 开启defineModel
          defineModel: true
        }
      }),
      VueJsx(),
      ServerUrlCopy(),
      progress(),
      env.VITE_USE_ALL_ELEMENT_PLUS_STYLE === 'false'
        ? createStyleImportPlugin({
            resolves: [ElementPlusResolve()],
            libs: [
              {
                libraryName: 'element-plus',
                esModule: true,
                resolveStyle: (name) => {
                  if (name === 'click-outside') {
                    return ''
                  }
                  return `element-plus/es/components/${name.replace(/^el-/, '')}/style/css`
                }
              }
            ]
          })
        : undefined,
      EslintPlugin({
        cache: true,
        cacheLocation: 'node_modules/.cache/eslint',
        failOnWarning: false,
        failOnError: false,
        include: ['src/**/*.vue', 'src/**/*.ts', 'src/**/*.tsx'] // 检查的文件
      }),
      VueI18nPlugin({
        runtimeOnly: true,
        compositionOnly: true,
        include: [resolve(__dirname, 'src/locales/**')]
      }),
      createSvgIconsPlugin({
        iconDirs: [pathResolve('src/assets/svgs')],
        symbolId: 'icon-[dir]-[name]',
        svgoOptions: true
      }),
      PurgeIcons(),
      env.VITE_USE_MOCK === 'true'
        ? viteMockServe({
            ignore: /^\_/,
            mockPath: 'mock',
            localEnabled: !isBuild,
            prodEnabled: isBuild,
            injectCode: `
          import { setupProdMockServer } from '../mock/_createProductionServer'

          setupProdMockServer()
          `
          })
        : undefined,
      ViteEjsPlugin({
        title:
          env.VITE_SYSTEM_TYPE === 'Management' ? env.VITE_APP_TITLE : env.VITE_APP_TITLE_OPERATION
      }),
      UnoCSS()
    ],

    css: {
      preprocessorOptions: {
        less: {
          additionalData: '@import "./src/styles/variables.module.less";',
          javascriptEnabled: true
        }
      }
    },
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.less', '.css'],
      alias: [
        {
          find: 'vue-i18n',
          replacement: 'vue-i18n/dist/vue-i18n.cjs.js'
        },
        {
          find: /\@\//,
          replacement: `${pathResolve('src')}/`
        }
      ]
    },
    esbuild: {
      pure: env.VITE_DROP_CONSOLE === 'true' ? ['console.log'] : undefined,
      drop: env.VITE_DROP_DEBUGGER === 'true' ? ['debugger'] : undefined
    },
    build: {
      target: 'es2015',
      outDir: env.VITE_SYSTEM_TYPE === 'Management' ? 'dist-management' : 'dist-operation',
      sourcemap: env.VITE_SOURCEMAP === 'true',
      // 提高chunk大小警告阈值
      chunkSizeWarningLimit: 1000,
      // brotliSize: false,
      rollupOptions: {
        plugins: env.VITE_USE_BUNDLE_ANALYZER === 'true' ? [visualizer()] : undefined,
        // 拆包
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'vue-i18n': ['vue-i18n'],
            'element-plus': ['element-plus'],
            'element-icons': ['@element-plus/icons-vue'],
            editor: ['@wangeditor/editor', '@wangeditor/editor-for-vue'],
            echarts: ['echarts'],
            'echarts-wordcloud': ['echarts-wordcloud'],
            utils: ['axios', 'qs', 'dayjs', 'lodash-es', 'nprogress']
          }
        }
      },
      cssCodeSplit: !(env.VITE_USE_CSS_SPLIT === 'false'),
      cssTarget: ['chrome31'],
      // 启用 minify 压缩
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: env.VITE_DROP_CONSOLE === 'true',
          drop_debugger: env.VITE_DROP_DEBUGGER === 'true'
        }
      }
    },
    server: {
      port: env.VITE_SYSTEM_TYPE === 'Management' ? 4010 : 4011,
      // 预热常用文件，减少首次访问延迟
      warmup: {
        clientFiles: [
          './src/main.ts',
          './src/App.vue',
          './src/router/index.ts',
          './src/store/index.ts',
          './src/views/Login/Login.vue'
        ]
      },
      proxy: {
        // 选项写法

        '/v1': {
          target: 'http://192.168.31.16:2404',
          changeOrigin: true,
          rewrite: (path) => path
        },
        '/v2': {
          target: 'http://192.168.31.16:2404',
          changeOrigin: true,
          rewrite: (path) => path
        },

        '/api': {
          target: 'http://192.168.31.16:2404',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        // 为/mock请求配置代理，确保它们不会发送到外部服务器
        '/mock': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          rewrite: (path) => path
        }
      },
      hmr: {
        overlay: false
      },
      host: '0.0.0.0'
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'vue-types',
        'pinia',
        'pinia-plugin-persistedstate',
        'element-plus/es',
        'element-plus/es/locale/lang/zh-cn',
        'element-plus/es/locale/lang/en',
        'element-plus/es/components/base/style/css',
        'element-plus/es/components/button/style/css',
        'element-plus/es/components/input/style/css',
        'element-plus/es/components/form/style/css',
        'element-plus/es/components/form-item/style/css',
        'element-plus/es/components/table/style/css',
        'element-plus/es/components/dialog/style/css',
        'element-plus/es/components/message/style/css',
        'element-plus/es/components/message-box/style/css',
        '@iconify/iconify',
        '@iconify/vue',
        '@vueuse/core',
        'axios',
        'qs',
        'echarts',
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        'echarts-wordcloud',
        'qrcode',
        '@wangeditor/editor',
        '@wangeditor/editor-for-vue',
        'vue-json-pretty',
        '@zxcvbn-ts/core',
        'dayjs',
        'dayjs/locale/zh-cn',
        'cropperjs',
        'lodash-es',
        'nprogress',
        'vue-i18n',
        'mitt',
        'crypto-es',
        'animate.css'
      ],
      // 强制预构建，避免首次访问时的延迟
      force: false
    }
  }
}
