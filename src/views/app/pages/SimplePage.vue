<template>
  <app-page :title="title" :eyebrow="eyebrow">
    <template #actions>
      <button class="icon-action" type="button" @click="$router.back()"><i class="el-icon-back"></i><span>返回</span></button>
    </template>
    <section class="simple-card">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
      <slot></slot>
    </section>
  </app-page>
</template>

<script>
import AppPage from '../components/AppPage.vue';

export default {
  components: { AppPage },
  computed: {
    title() {
      const map = {
        fundDetail: '基金详情',
        stockDetail: '股票详情',
        indexDetail: '指数详情',
        dailyReturns: '今日收益',
        holdingReturns: '持有收益',
        totalReturns: '总收益曲线',
        profileLogin: '登录/注册',
        profileConfig: '配置导入导出',
        profileChangelog: '更新日志',
        marketFlow: '市场资金流',
        marketSector: '行业与板块',
        marketConnect: '南北向资金',
      };
      return map[this.$route.name] || '详情';
    },
    eyebrow() {
      return '页面化迁移';
    },
    description() {
      const code = this.$route.params.code;
      return code ? `当前标的：${code}。该弹窗能力已迁移为 H5 二级页面入口，后续会继续接入原组件的完整图表和明细逻辑。` : '该能力已从弹窗迁移为 H5 二级页面入口，后续逐步接入原组件的完整逻辑。';
    },
  },
};
</script>

<style lang="less" scoped>
@import "../styles/page.less";

.simple-card {
  padding: 16px;
  border: 0;
  border-radius: 0;
  background: #fff;
  box-shadow: none;

  h2 {
    margin: 0 0 8px;
    color: #0f172a;
    font-size: 20px;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
    line-height: 22px;
  }
}
</style>
