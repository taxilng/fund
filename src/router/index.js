import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)
// 不作为Main组件的子页面展示的页面单独写，如下




export const appRouter = [
    {
        path: "/app",
        component: () => import("@/views/app/components/AppShell.vue"),
        redirect: "/app/fund",
        children: [
            {
                path: "fund",
                component: () => import("@/views/app/pages/FundHome.vue")
            },
            {
                path: "stock",
                component: () => import("@/views/app/pages/StockHome.vue")
            },
            {
                path: "market",
                component: () => import("@/views/app/pages/MarketHome.vue")
            },
            {
                path: "profile",
                component: () => import("@/views/app/pages/ProfileHome.vue")
            },
            {
                path: "fund/detail/:code",
                name: "fundDetail",
                redirect: "/app/fund"
            },
            {
                path: "stock/detail/:code",
                name: "stockDetail",
                redirect: "/app/stock"
            },
            {
                path: "market/index/:code",
                name: "indexDetail",
                component: () => import("@/views/app/pages/SimplePage.vue")
            },
            {
                path: "market/flow",
                name: "marketFlow",
                component: () => import("@/views/app/pages/SimplePage.vue")
            },
            {
                path: "market/sector",
                name: "marketSector",
                component: () => import("@/views/app/pages/SimplePage.vue")
            },
            {
                path: "market/connect",
                name: "marketConnect",
                component: () => import("@/views/app/pages/SimplePage.vue")
            },
            {
                path: "returns/daily",
                name: "dailyReturns",
                component: () => import("@/views/app/pages/DailyReturnsPage.vue")
            },
            {
                path: "returns/holding",
                name: "holdingReturns",
                component: () => import("@/views/app/pages/SimplePage.vue")
            },
            {
                path: "returns/total",
                name: "totalReturns",
                component: () => import("@/views/app/pages/SimplePage.vue")
            },
            {
                path: "profile/login",
                name: "profileLogin",
                component: () => import("@/views/app/pages/SimplePage.vue")
            },
            {
                path: "profile/config",
                name: "profileConfig",
                component: () => import("@/views/app/pages/SimplePage.vue")
            },
            {
                path: "profile/changelog",
                name: "profileChangelog",
                component: () => import("@/views/app/pages/ChangeLogPage.vue")
            }
        ]
    },
    {
        path: "/",
        redirect: "/app/fund",
    },
    {
        path: "/legacy",
        access: "/legacy",
        component: () => import("@/views/home/index.vue"),
    },
    {
        path: "/option",
        component: () => import("@/views/options/index.vue")
    },
    {
        path: "/stock",
        component: () => import("@/views/stock/index.vue")
    },
    {
        path: "/totalrevenue",
        component: () => import("@/views/totalrevenue/index.vue")
    },
    {
        path: "*",
        redirect: "/app/fund"
    },
];



export const constantRouterMap = [...appRouter];

export default new Router({
    // mode: 'history',
    // base: process.env.BASE_URL,
    routes: constantRouterMap
})
