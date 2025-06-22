import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import pugPlugin from 'vue-pug-plugin'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import ElementPlus from 'unplugin-element-plus/vite'
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [
      vue({
        template: {
          preprocessOptions: {
            plugins: [pugPlugin]
          }
        }
      }),
      svgLoader(),
      ElementPlus({ useSource: false }),
      AutoImport({
        // imports: ['vue'],
        // dirs: ['src/utils'], // 👈 自动导入 notify

        imports: [
          'vue',
          {
            '@/config/api': ['$api'],
            '@/utils/notify': ['notify'],
            '@/utils/calcStorageStats': ['calcStorageStats'],
            '@/utils/index': ['$us']
          }
        ],
        // 👇 自动引入 composables 中的所有方法（包括 usePageData, useSpaceData）
        dirs: ['src/composables'],

        resolvers: [
          ElementPlusResolver(), // 自动导入图标组件
          IconsResolver({
            prefix: 'Icon'
          })
        ]
      }),
      Components({
        dirs: ['src/components'],
        deep: true,
        resolvers: [
          // 自动注册图标组件
          IconsResolver({
            enabledCollections: ['ep']
          }),
          ElementPlusResolver({ importStyle: 'sass' })
        ]
      }),
      Icons({
        autoInstall: true
      })
    ],
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "sass:color";
            @use "@/styles/element.scss" as *;
          `,
          silenceDeprecations: ['legacy-js-api'],
          api: 'modern-compiler'
        }
      }
    },
    build: {
      // 配置 Terser 以便生产构建时去除 console 和指定方法调用
      terserOptions: {
        compress: {
          drop_console: true,
          pure_funcs: ['__f__']
        }
      }
    },
    server: {
      host: '0.0.0.0', // 👈 允许用 IP / 网络访问，不限制 localhost
      port: 5173
    }
  }
})
