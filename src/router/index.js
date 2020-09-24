import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)
// 不作为Main组件的子页面展示的页面单独写，如下




export const appRouter = [
    {
        path: "/",
        access: "/",
        name: "首页",
        component: () => import("@/views/approvePage/mainApprove"),
    },
    {
        path: "/option",
        component: () => import("@/views/options/App")
    },
];



export const constantRouterMap = [...appRouter];

export default new Router({
    // mode: 'history',
    // base: process.env.BASE_URL,
    routes: constantRouterMap
})
