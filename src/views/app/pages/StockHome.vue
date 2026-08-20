<template>
  <app-page title="自选股票" eyebrow="股票 · 持仓追踪">
    <template #actions>
      <button class="icon-action" type="button" @click="refresh"><i class="el-icon-refresh"></i><span>刷新</span></button>
      <button class="icon-action primary" type="button" @click="showAdd = !showAdd"><i class="el-icon-plus"></i><span>添加</span></button>
    </template>

    <section class="market-strip">
      <button v-for="item in indices" :key="item.f12 || item.f14" type="button" class="market-tile" @click="openIndex(item)">
        <span>{{ item.f14 }}</span>
        <strong :class="item.f3 >= 0 ? 'is-up' : 'is-down'">{{ item.f2 }}</strong>
        <div class="market-change" :class="item.f3 >= 0 ? 'is-up' : 'is-down'">
          <em>{{ item.f3 }}%</em>
          <b>{{ item.f4 }}</b>
        </div>
      </button>
    </section>

    <section class="summary-grid">
      <button class="summary-card neutral" type="button"><span>总资产</span><strong>{{ formatMoney(total.amount) }}</strong></button>
      <button class="summary-card" :class="total.costGains >= 0 ? 'is-up' : 'is-down'" type="button">
        <span>持有收益</span><strong>{{ formatMoney(total.costGains) }}</strong><em>{{ formatRate(total.costGainsRate) }}</em>
      </button>
      <button class="summary-card summary-card--copyable" :class="total.gains >= 0 ? 'is-up' : 'is-down'" type="button" @click="$router.push('/app/returns/daily?type=stock')">
        <span>今日收益</span><strong>{{ formatMoney(total.gains) }}</strong><em>{{ dailyYield }}</em>
        <i class="copy-income el-icon-document-copy" @click.stop="copyDailyIncome('股票', formatMoney(total.gains), dailyYield)"></i>
      </button>
    </section>

    <daily-income-chart title="股票今日收益曲线" :points="dailyReturns" :loading="dailyReturnsLoading" :base-amount="total.previousAmount" include-current-in-copy />

    <section v-if="showAdd" class="add-panel">
      <el-select v-model="selectedCodes" multiple filterable remote reserve-keyword value-key="code" :remote-method="search" :loading="loadingSearch" placeholder="搜索股票名称或代码" size="small">
        <el-option v-for="item in searchOptions" :key="item.code" :label="`${item.label} ${item.code}`" :value="item"></el-option>
      </el-select>
      <button type="button" @click="addStocks">加入自选</button>
    </section>

    <holding-list
      title="自选股票"
      :items="rows"
      :editing.sync="editing"
      show-position-amount
      @open="openStock"
      @delete="deleteStock"
      @change-cost="changeCost"
      @change-num="changeNum"
      @commit-edit="refresh"
      @reorder="reorderStocks"
    />
  </app-page>
</template>

<script>
import AppPage from '../components/AppPage.vue';
import DailyIncomeChart from '../components/DailyIncomeChart.vue';
import HoldingList from '../components/HoldingList.vue';
import { INDEX_FALLBACK, fetchMarketIndices, fetchStockDailyReturns, fetchStocks, isTradingTime, loadSettings, saveStockList, searchSecurities, signedAmount, signedPercent } from '../services/portfolio';

export default {
  components: { AppPage, DailyIncomeChart, HoldingList },
  data() {
    return {
      editing: false,
      showAdd: false,
      loadingSearch: false,
      selectedCodes: [],
      searchOptions: [],
      stockList: [],
      rows: [],
      indices: INDEX_FALLBACK,
      dailyReturns: [],
      dailyReturnsLoading: false,
      refreshTimer: null,
    };
  },
  computed: {
    total() {
      const amount = this.rows.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const previousAmount = this.rows.reduce((sum, item) => sum + Number(item.previousAmount || 0), 0);
      const gains = this.rows.reduce((sum, item) => sum + Number(item.gains || 0), 0);
      const costGains = this.rows.reduce((sum, item) => sum + Number(item.costGains || 0), 0);
      const costAmount = this.rows.reduce((sum, item) => {
        const cost = Number(item.cost || 0);
        const num = Number(item.num || 0);
        return cost > 0 && num > 0 ? sum + cost * num : sum;
      }, 0);
      return {
        amount,
        previousAmount,
        gains,
        costGains,
        costGainsRate: costAmount ? (costGains * 100) / costAmount : 0,
      };
    },
    dailyYield() {
      return this.total.previousAmount ? `${((Number(this.total.gains) * 100) / this.total.previousAmount).toFixed(2)}%` : '0%';
    },
  },
  mounted() {
    this.refresh();
    this.refreshTimer = window.setInterval(this.autoRefresh, 30000);
  },
  beforeDestroy() {
    if (this.refreshTimer) window.clearInterval(this.refreshTimer);
  },
  methods: {
    autoRefresh() {
      if (isTradingTime()) this.refresh();
    },
    async refresh() {
      const settings = await loadSettings();
      this.stockList = settings.stockList;
      fetchMarketIndices(settings.seciList).then((indices) => {
        this.indices = indices;
      });
      this.rows = await fetchStocks(this.stockList);
      this.loadDailyReturns();
    },
    async loadDailyReturns() {
      this.dailyReturnsLoading = true;
      this.dailyReturns = await fetchStockDailyReturns(this.rows);
      this.dailyReturnsLoading = false;
    },
    async search(query) {
      this.loadingSearch = true;
      const existing = new Set(this.stockList.map((item) => item.code));
      this.searchOptions = (await searchSecurities(query)).filter((item) => !existing.has(item.code));
      this.loadingSearch = false;
    },
    async addStocks() {
      const next = this.selectedCodes.map((item) => ({ ...item, num: 0, cost: 0 }));
      this.stockList = [...this.stockList, ...next];
      await saveStockList(this.stockList);
      this.selectedCodes = [];
      this.showAdd = false;
      this.refresh();
    },
    async deleteStock(item) {
      try {
        await this.$confirm(`确认删除“${item.name}”吗？`, '删除股票', {
          cancelButtonText: '取消',
          confirmButtonText: '删除',
          type: 'warning',
        });
      } catch (error) {
        return;
      }
      this.stockList = this.stockList.filter((stock) => stock.code !== item.code);
      await saveStockList(this.stockList);
      this.rows = this.rows.filter((row) => row.code !== item.code);
    },
    async changeCost(item, value) {
      const target = this.stockList.find((stock) => stock.code === item.code);
      if (target) target.cost = value;
      item.cost = value;
      await saveStockList(this.stockList);
    },
    async changeNum(item, value) {
      const target = this.stockList.find((stock) => stock.code === item.code);
      if (target) target.num = value;
      item.num = value;
      await saveStockList(this.stockList);
    },
    async reorderStocks({ oldIndex, newIndex }) {
      const [stock] = this.stockList.splice(oldIndex, 1);
      const [row] = this.rows.splice(oldIndex, 1);
      this.stockList.splice(newIndex, 0, stock);
      this.rows.splice(newIndex, 0, row);
      await saveStockList(this.stockList);
    },
    openStock(item) {
      this.$router.push(`/app/stock/detail/${item.code}`);
    },
    openIndex(item) {
      if (!item.fallback) this.$router.push(`/app/market/index/${item.f13 || 1}.${item.f12}`);
    },
    copyDailyIncome(type, amount, rate) {
      const text = `${type}今日收益：${amount}（${rate}）`;
      this.copyText(text);
    },
    copyText(text) {
      const fallbackCopy = () => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.showCopySuccess();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => this.showCopySuccess()).catch(fallbackCopy);
        return;
      }
      fallbackCopy();
    },
    showCopySuccess() {
      this.$message({
        message: '收益文案已复制',
        type: 'success',
        center: true,
      });
    },
    formatMoney: signedAmount,
    formatRate: signedPercent,
  },
};
</script>

<style lang="less" scoped>
@import "../styles/page.less";
</style>
