<template>
  <app-page :title="pageTitle" eyebrow="当日收益曲线">
    <template #actions>
      <button class="icon-action" type="button" @click="refresh"><i class="el-icon-refresh"></i><span>刷新</span></button>
    </template>

    <daily-income-chart :title="chartTitle" :points="chartPoints" :loading="loading" :base-amount="totalAmount" variant="full" />
  </app-page>
</template>

<script>
import AppPage from '../components/AppPage.vue';
import DailyIncomeChart from '../components/DailyIncomeChart.vue';
import {
  fetchFundDailyReturns,
  fetchFunds,
  fetchStockDailyReturns,
  fetchStocks,
  loadSettings,
} from '../services/portfolio';

export default {
  components: { AppPage, DailyIncomeChart },
  data() {
    return {
      loading: false,
      chartPoints: [],
      totalAmount: 0,
    };
  },
  computed: {
    type() {
      return this.$route.query.type === 'stock' ? 'stock' : 'fund';
    },
    pageTitle() {
      return this.type === 'stock' ? '股票收益曲线' : '基金收益曲线';
    },
    chartTitle() {
      return this.type === 'stock' ? '股票今日收益' : '基金今日收益';
    },
  },
  mounted() {
    this.refresh();
  },
  watch: {
    '$route.fullPath': 'refresh',
  },
  methods: {
    async refresh() {
      this.loading = true;
      const settings = await loadSettings();
      if (this.type === 'stock') {
        const rows = await fetchStocks(settings.stockList);
        this.totalAmount = rows.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        this.chartPoints = await fetchStockDailyReturns(rows);
      } else {
        const rows = await fetchFunds(settings.fundListM);
        this.totalAmount = rows.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        this.chartPoints = await fetchFundDailyReturns(rows);
      }
      this.loading = false;
    },
  },
};
</script>

<style lang="less" scoped>
@import "../styles/page.less";
</style>
