import { defineConfig, loadEnv } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import path from 'path';
import { fileURLToPath } from 'url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

function resolve(dir) {
  return path.resolve(configDir, dir);
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const nodeEnv = mode === 'development' ? 'development' : 'production';
  const serverName = env.VUE_APP_SERVER || env.VITE_SERVER || '';

  return {
    base: mode === 'development' ? '/' : './',
    plugins: [createVuePlugin()],
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      alias: {
        '@': resolve('src'),
        public: resolve('public'),
        vendor: resolve('src/vendor'),
      },
    },
    define: {
      'process.env': JSON.stringify({
        NODE_ENV: nodeEnv,
        VUE_APP_SERVER: serverName,
      }),
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
      'process.env.VUE_APP_SERVER': JSON.stringify(serverName),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'static',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    server: {
      open: true,
      host: '0.0.0.0',
      port: 8081,
      proxy: {
        '/api/qt/': {
          target: 'http://push2.eastmoney.com/',
          changeOrigin: true,
        },
        '/FundMApi': {
          target: 'https://fundmobapi.eastmoney.com/',
          changeOrigin: true,
        },
        '/FundMNewApi': {
          target: 'https://fundmobapi.eastmoney.com/',
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader(
                'User-Agent',
                'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Mobile Safari/537.36'
              );
            });
          },
        },
        '/fundsuggest': {
          target: 'https://fundsuggest.eastmoney.com/',
          changeOrigin: true,
          rewrite: (pathname) => pathname.replace(/^\/fundsuggest/, ''),
        },
        '/fundRabtTop': {
          target: 'https://fundgz.1234567.com.cn/',
          changeOrigin: true,
          rewrite: (pathname) => pathname.replace(/^\/fundRabtTop/, ''),
        },
        '/sinaFundInfo': {
          target: 'https://stock.finance.sina.com.cn/',
          changeOrigin: true,
          rewrite: (pathname) => pathname.replace(/^\/sinaFundInfo/, '/fundInfo/api/openapi.php'),
        },
        '/bspapp': {
          target: 'https://fund-api-url.rabt.top/http/user-center',
          changeOrigin: true,
          rewrite: (pathname) => pathname.replace(/^\/bspapp/, ''),
        },
        '/searchapi': {
          target: 'https://searchapi.eastmoney.com/',
          changeOrigin: true,
          rewrite: (pathname) => pathname.replace(/^\/searchapi/, ''),
        },
      },
    },
  };
});
