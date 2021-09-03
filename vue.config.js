var path = require("path");

function resolve (dir) {
    return path.join(__dirname, dir);
}

module.exports = {
    publicPath: process.env.NODE_ENV === 'production'
        ? ''
        : '/',

    outputDir: 'dist',

    assetsDir: 'static',

    filenameHashing: true,

    // When building in multi-pages mode, the webpack config will contain different plugins
    // (there will be multiple instances of html-webpack-plugin and preload-webpack-plugin).
    // Make sure to run vue inspect if you are trying to modify the options for those plugins.
    // pages: {
    //   index: {
    //     // page 的入口
    //     entry: 'src/main.js',
    //     // 模板来源
    //     template: 'public/index.html',
    //     // 在 dist/index.html 的输出
    //     filename: 'index.html',
    //    // 当使用 title 选项时，
    //   // template 中的 title 标签需要是 <title><%= htmlWebpackPlugin.options.title %></title>
    //     title: '首页',
    //     // 在这个页面中包含的块，默认情况下会包含
    //   // 提取出来的通用 chunk 和 vendor chunk。
    //     chunks: ['chunk-vendors', 'chunk-common', 'index']
    //   }
    //   // 当使用只有入口的字符串格式时，
    // // 模板会被推导为 `public/subpage.html`
    // // 并且如果找不到的话，就回退到 `public/index.html`。
    // // 输出文件名会被推导为 `subpage.html`。
    // // subpage: 'src/subpage/main.js'
    // },

    // eslint-loader 是否在保存的时候检查
    lintOnSave: false,

    // // 是否使用包含运行时编译器的Vue核心的构建
    runtimeCompiler: false,

    // // 默认情况下 babel-loader 忽略其中的所有文件 node_modules
    transpileDependencies: [],

    // // 生产环境 sourceMap
    productionSourceMap: false,

    // cors 相关 https://jakearchibald.com/2017/es-modules-in-browsers/#always-cors
    // corsUseCredentials: false,
    // webpack 配置，键值对象时会合并配置，为方法时会改写配置
    // https://cli.vuejs.org/guide/webpack.html#simple-configuration
    configureWebpack: config => {

        config.resolve.alias['vendor'] = path.resolve(__dirname, './src/vendor')
        config.entry = ["babel-polyfill", "./src/main.js"];
        // resolve: {
        //   alias: {
        //     'vendor': path.resolve(__dirname, './src/vendor')
        //   }
        // },
        // entry:['babel-polyfill','./src/main.js']

    },
    // webpack 链接 API，用于生成和修改 webapck 配置
    // https://github.com/mozilla-neutrino/webpack-chain
    chainWebpack: (config) => {
        console.log(process.env.NODE_ENV);
        // if(process.env.NODE_ENV === "production"){
        // config
        //     .plugin('webpack-bundle-analyzer')
        //     .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
        // }
        // 因为是多页面，所以取消 chunks，每个页面只对应一个单独的 JS / CSS
        config.optimization
            .splitChunks({
                cacheGroups: {}
            });
        config.resolve.alias
            .set("public", resolve("public"))
        // 'src/lib' 目录下为外部库文件，不参与 eslint 检测
        // config.module
        //   .rule('iview')
        //   .test(/iview.src.*?js$/)
        //   .end()
        config.module
            .rule('svg')
            .exclude.add(resolve('src/icons'))
            .end()
        config.module
            .rule('icons')
            .test(/\.svg$/)
            .include.add(resolve('src/icons'))
            .end()
            .use('svg-sprite-loader')
            .loader('svg-sprite-loader')
            .options({
                symbolId: 'icon-[name]'
            })
            .end()
    },

    // 配置高于chainWebpack中关于 css loader 的配置
    // css: {
    //   // 是否开启支持 foo.module.css 样式
    //   // modules: false,

    //   // // 是否使用 css 分离插件 ExtractTextPlugin，采用独立样式文件载入，不采用 <style> 方式内联至 html 文件中
    //   // extract: true,

    //   // 是否构建样式地图，false 将提高构建速度
    //   sourceMap: true,

    //   // css预设器配置项
    //   loaderOptions: {
    //     css: {
    //       // options here will be passed to css-loader
    //     },

    //     postcss: {
    //       // options here will be passed to postcss-loader
    //     }
    //   }
    // },

    // All options for webpack-dev-server are supported
    // https://webpack.js.org/configuration/dev-server/
    devServer: {
        open: true,
        //  host: '192.168.6.157',
        // host: '192.168.1.179',
        //   port: 3000,
        // https: true,
        hotOnly: false,
        proxy: {   //代理
            '/api/qt/': {
                target: 'http://push2.eastmoney.com/',
                changeOrigin: true,
            },
            '/FundMApi': {
                target: 'https://fundmobapi.eastmoney.com/',
                changeOrigin: true,
            },
            '/fundsuggest': {
                target: 'https://fundsuggest.eastmoney.com/',
                changeOrigin: true,
                pathRewrite: {
                    '^/fundsuggest': ''
                }
            },
            '/rabt': {
                target: 'https://x2rr.github.io/',
                changeOrigin: true,
                pathRewrite: {
                    '^/rabt': ''
                }
            },
            '/bspapp': {
                target: 'https://2955b122-0e37-42a7-a4ee-4ddd503fe6b6.bspapp.com/http/user-center/',
                changeOrigin: true,
                pathRewrite: {
                    '^/bspapp': ''
                }
            },
        },

        //   before: app => {
        //   }
    },
    // 构建时开启多进程处理 babel 编译
    // parallel: require('os').cpus().length > 1,

    // https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-pwa
    // pwa: {},

    // 第三方插件配置
    // pluginOptions: {}
}
