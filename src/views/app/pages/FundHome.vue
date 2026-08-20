<template>
  <app-page title="自选基金" eyebrow="基金 · 收益追踪">
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

    <div class="fund-data-panel" v-loading="loadingFunds" element-loading-text="基金数据加载中">
    <section class="summary-grid">
      <button class="summary-card neutral" type="button"><span>总资产</span><strong>{{ formatMoney(total.amount) }}</strong></button>
      <button class="summary-card" :class="total.costGains >= 0 ? 'is-up' : 'is-down'" type="button" @click="$router.push('/app/returns/holding')">
        <span>持有收益</span><strong>{{ formatMoney(total.costGains) }}</strong><em>{{ formatRate(total.costGainsRate) }}</em>
      </button>
      <button class="summary-card summary-card--copyable" :class="Number(total.gains) >= 0 ? 'is-up' : 'is-down'" type="button" @click="$router.push('/app/returns/daily?type=fund')">
        <span>今日收益</span><strong>{{ total.gains }}</strong><em>{{ dailyYield }}</em>
        <i class="copy-income el-icon-document-copy" @click.stop="copyDailyIncome('基金', total.gains, dailyYield)"></i>
      </button>
    </section>

    <daily-income-chart title="基金今日收益曲线" :points="dailyReturns" :loading="dailyReturnsLoading" :base-amount="total.previousAmount" include-current-in-copy />

    <section v-if="showAdd" class="add-panel">
      <el-select v-model="selectedCodes" multiple filterable remote reserve-keyword :remote-method="search" :loading="loadingSearch" placeholder="搜索基金名称或代码" size="small">
        <el-option v-for="item in searchOptions" :key="item.code" :label="`${item.label} ${item.code}`" :value="item.code"></el-option>
      </el-select>
      <button type="button" @click="addFunds">加入自选</button>
    </section>

    <holding-list
      title="自选基金"
      :items="rows"
      :editing.sync="editing"
      @open="openFund"
      @delete="deleteFund"
      @change-cost="changeCost"
      @change-num="changeNum"
      @commit-edit="refresh"
      @reorder="reorderFunds"
    />
    </div>
  </app-page>
</template>

<script>
import AppPage from '../components/AppPage.vue';
import DailyIncomeChart from '../components/DailyIncomeChart.vue';
import HoldingList from '../components/HoldingList.vue';
import {
  fetchFundDailyReturns,
  fetchFunds,
  INDEX_FALLBACK,
  fetchMarketIndices,
  isTradingTime,
  loadSettings,
  saveFundList,
  searchSecurities,
  signedAmount,
  signedPercent,
} from '../services/portfolio';

export default {
  components: { AppPage, DailyIncomeChart, HoldingList },
  data() {
    return {
      editing: false,
      showAdd: false,
      loadingSearch: false,
      selectedCodes: [],
      searchOptions: [],
      selectedOptionMap: {},
      fundListM: [],
      rows: [],
      indices: INDEX_FALLBACK,
      dailyReturns: [],
      dailyReturnsLoading: false,
      loadingFunds: false,
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
        gains: gains.toFixed(1),
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
    signedAmount,
    signedPercent,
    autoRefresh() {
      if (isTradingTime()) this.refresh();
    },
    async refresh() {
      this.loadingFunds = true;
      try {
        const settings = await loadSettings();
        this.fundListM = settings.fundListM;
        fetchMarketIndices(settings.seciList).then((indices) => {
          this.indices = indices;
        });
        this.rows = await fetchFunds(this.fundListM);
        await this.loadDailyReturns();
      } finally {
        this.loadingFunds = false;
      }
    },
    async loadDailyReturns() {
      this.dailyReturnsLoading = true;
      try {
        this.dailyReturns = await fetchFundDailyReturns(this.rows);
      } finally {
        this.dailyReturnsLoading = false;
      }
    },
    async search(query) {
      this.loadingSearch = true;
      const options = await searchSecurities(query);
      this.searchOptions = options;
      this.selectedOptionMap = options.reduce((map, item) => {
        map[item.code] = item;
        return map;
      }, this.selectedOptionMap);
      this.loadingSearch = false;
    },
    async addFunds() {
      const existing = new Set(this.fundListM.map((item) => item.code));
      const next = this.selectedCodes
        .filter((code) => !existing.has(code))
        .map((code) => ({ ...(this.selectedOptionMap[code] || { code, label: code }), num: 0, cost: 0 }));
      this.fundListM = [...this.fundListM, ...next];
      await saveFundList(this.fundListM);
      this.selectedCodes = [];
      this.showAdd = false;
      this.refresh();
    },
    async deleteFund(item) {
      try {
        await this.$confirm(`确认删除“${item.name}”吗？`, '删除基金', {
          cancelButtonText: '取消',
          confirmButtonText: '删除',
          type: 'warning',
        });
      } catch (error) {
        return;
      }
      this.fundListM = this.fundListM.filter((fund) => fund.code !== item.code);
      await saveFundList(this.fundListM);
      this.rows = this.rows.filter((row) => row.code !== item.code);
    },
    async changeCost(item, value) {
      const target = this.fundListM.find((fund) => fund.code === item.code);
      if (target) target.cost = value;
      item.cost = value;
      await saveFundList(this.fundListM);
    },
    async changeNum(item, value) {
      const target = this.fundListM.find((fund) => fund.code === item.code);
      if (target) target.num = value;
      item.num = value;
      await saveFundList(this.fundListM);
    },
    async reorderFunds({ oldIndex, newIndex }) {
      const [fund] = this.fundListM.splice(oldIndex, 1);
      const [row] = this.rows.splice(oldIndex, 1);
      this.fundListM.splice(newIndex, 0, fund);
      this.rows.splice(newIndex, 0, row);
      await saveFundList(this.fundListM);
    },
    openFund(item) {
      this.$router.push(`/app/fund/detail/${item.code}`);
    },
    openIndex(item) {
      if (!item.fallback) this.$router.push(`/app/market/index/${item.f13 || 1}.${item.f12}`);
    },
    formatMoney(value) {
      return signedAmount(value);
    },
    formatRate(value) {
      return signedPercent(value);
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
  },
};
</script>

<style lang="less" scoped>
@import "../styles/page.less";

.fund-data-panel {
  min-height: 180px;
}

.fund-data-panel /deep/ .el-loading-mask {
  background-color: var(--app-loading-bg, rgba(255, 255, 255, 0.9));
}

.fund-data-panel /deep/ .el-loading-text,
.fund-data-panel /deep/ .el-icon-loading {
  color: var(--app-loading-text, #303133);
}
</style>
