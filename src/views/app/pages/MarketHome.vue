<template>
  <app-page title="市场中心" eyebrow="行情 · 资金 · 指数">
    <template #actions>
      <button class="icon-action" type="button" @click="refresh"><i class="el-icon-refresh"></i><span>刷新</span></button>
    </template>

    <section class="market-strip">
      <button v-for="item in indices" :key="item.f12 || item.f14" type="button" class="market-tile" @click="openIndex(item)">
        <span>{{ item.f14 }}</span>
        <strong :class="item.f3 >= 0 ? 'is-up' : 'is-down'">{{ item.f2 }}</strong>
        <em :class="item.f3 >= 0 ? 'is-up' : 'is-down'">{{ item.f4 }} {{ item.f3 }}%</em>
      </button>
    </section>

    <section class="feature-list">
      <button v-for="item in modules" :key="item.title" type="button" @click="$router.push(item.path)">
        <i :class="item.icon"></i>
        <span>
          <strong>{{ item.title }}</strong>
          <em>{{ item.desc }}</em>
        </span>
        <i class="el-icon-arrow-right"></i>
      </button>
    </section>
  </app-page>
</template>

<script>
import AppPage from '../components/AppPage.vue';
import { fetchMarketIndices, loadSettings } from '../services/portfolio';

export default {
  components: { AppPage },
  data() {
    return {
      indices: [],
      modules: [
        { title: '市场资金流', desc: '主力净流入、大小单资金追踪', icon: 'el-icon-s-data', path: '/app/market/flow' },
        { title: '行业与板块', desc: '查看板块热度和阶段表现', icon: 'el-icon-menu', path: '/app/market/sector' },
        { title: '南北向资金', desc: '沪深港通资金趋势', icon: 'el-icon-sort', path: '/app/market/connect' },
      ],
    };
  },
  mounted() {
    this.refresh();
  },
  methods: {
    async refresh() {
      const settings = await loadSettings();
      this.indices = await fetchMarketIndices(settings.seciList);
    },
    openIndex(item) {
      if (!item.fallback) this.$router.push(`/app/market/index/${item.f13 || 1}.${item.f12}`);
    },
  },
};
</script>

<style lang="less" scoped>
@import "../styles/page.less";

.feature-list {
  display: grid;
  gap: 10px;

  button {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) 18px;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border: 0;
    border-radius: 0;
    background: var(--app-surface, #fff);
    color: var(--app-text, #0f172a);
    text-align: left;
    box-shadow: none;

    > i:first-child {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 11px;
      background: var(--app-primary-soft, #eef4ff);
      color: var(--app-primary, #2563ff);
      font-size: 20px;
    }

    strong,
    em {
      display: block;
    }

    strong {
      font-size: 16px;
      line-height: 22px;
    }

    em {
      margin-top: 3px;
      color: var(--app-muted, #64748b);
      font-style: normal;
      font-size: 12px;
    }
  }
}
</style>
