import Vue from 'vue'
import axios from 'axios'
import App from './App.vue'
import router from './router'
import Element from 'element-ui'
// import "./style/guiji_font/iconfont.js";
// import "./style/receptionCenterFontIcon/iconfont.js";
import './style/common.scss'
// import './style/iconfont.css'
import './style/element-variables.scss'
import '@/axios/request'
// 引入svg组件
// Vue.component('svg-icon', SvgIcon)

import VueRouter from 'vue-router';
if (VueRouter.version > '3.1') {
    const routerPush = VueRouter.prototype.push
    VueRouter.prototype.push = function push (location) {
        return routerPush.call(this, location).catch(error => error)
    }
}


Vue.config.productionTip = false


Vue.prototype.$axios = axios;

Vue.use(Element)


new Vue({
    router,
    render: h => h(App)
}).$mount('#app')
