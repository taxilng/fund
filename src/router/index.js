import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)
// 不作为Main组件的子页面展示的页面单独写，如下




export const appRouter = [
    {
        path: "/",
        access: "/",
        component: () => import("@/views/home"),
    },
    {
        path: "/option",
        component: () => import("@/views/options")
    },
];



export const constantRouterMap = [...appRouter];

export default new Router({
    // mode: 'history',
    // base: process.env.BASE_URL,
    routes: constantRouterMap
})
