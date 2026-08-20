import Vue from 'vue'
import axios from 'axios'
import App from './App.vue'
import router from './router'
import VueClipboard from "vue-clipboard2";

import {
    Input,
    InputNumber,
    Dialog,
    Button,
    RadioGroup,
    Tabs,
    TabPane,
    Select,
    Option,
    Switch,
    Radio,
    Loading,
    MessageBox,
    Notification,
    Message,
    RadioButton,
    Form,
    FormItem,
} from 'element-ui'
// import "./style/guiji_font/iconfont.js";
// import "./style/receptionCenterFontIcon/iconfont.js";
import 'element-ui/lib/theme-chalk/index.css';
import './style/common.less'
// import './style/iconfont.css'
import './style/element-variables.less'
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

Vue.use(VueClipboard)
Vue.use(Input)
Vue.use(InputNumber)
Vue.use(Dialog)
Vue.use(Button)
Vue.use(RadioGroup)
Vue.use(Tabs)
Vue.use(TabPane)
Vue.use(Select)
Vue.use(Option)
Vue.use(Switch)
Vue.use(Radio)
Vue.use(Loading)
Vue.use(RadioButton)
Vue.use(Form)
Vue.use(FormItem)

Vue.prototype.$notify = Notification;
Vue.prototype.$confirm = MessageBox.confirm;

Vue.prototype.$message = function (params) {
    const initParams = {
        duration: 1000
    }
    Message({...initParams, ...params})
};
// 透传 Element UI 的 success / warning / info / error 静态方法
['success', 'warning', 'info', 'error'].forEach((key) => {
    Vue.prototype.$message[key] = (params) => {
        const initParams = { duration: 1000 }
        Message[key]({...initParams, message: params})
    }
})

new Vue({
    router,
    render: h => h(App)
}).$mount('#app')
