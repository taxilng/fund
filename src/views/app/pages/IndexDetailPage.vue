<template>
  <app-page :title="quote.name || '指数详情'" eyebrow="指数行情">
    <template #actions>
      <button class="icon-action" type="button" @click="$router.back()"><i class="el-icon-back"></i><span>返回</span></button>
    </template>

    <section class="index-quote" v-loading="loading">
      <template v-if="quote.name">
        <div class="index-quote__main">
          <strong :class="upClass">{{ formatPrice(quote.price) }}</strong>
          <span :class="upClass">{{ signedAmount(quote.change) }} {{ signedPercent(quote.rate) }}</span>
        </div>
        <div class="index-quote__meta">
          <span>昨收 {{ formatPrice(quote.prePrice) }}</span>
          <span>最高 {{ formatPrice(quote.high) }}</span>
          <span>最低 {{ formatPrice(quote.low) }}</span>
        </div>
      </template>
      <p v-else class="index-quote__loading">{{ loading ? '行情加载中…' : '暂无行情数据' }}</p>
    </section>

    <section class="index-chart-card">
      <header>
        <strong>分时走势</strong>
        <span>单位：点</span>
      </header>
      <div ref="chartEl" class="index-chart"></div>
      <p v-if="!loading && !trends.length" class="index-chart__empty">暂无走势数据</p>
    </section>
  </app-page>
</template>

<script>
import echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/line';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/markLine';
import AppPage from '../components/AppPage.vue';
import { loadSettings, signedAmount, signedPercent } from '../services/portfolio';

const UP_COLOR = '#ef1f1f';
const DOWN_COLOR = '#139327';

export default {
  components: { AppPage },
  data() {
    return {
      loading: true,
      darkMode: false,
      quote: {},
      trends: [],
      prePrice: 0,
      chart: null,
    };
  },
  computed: {
    secid() {
      return this.$route.params.code || '1.000001';
    },
    upClass() {
      return this.quote.price >= this.prePrice ? 'is-up' : 'is-down';
    },
  },
  watch: {
    '$route.params.code'() {
      this.refresh();
    },
  },
  mounted() {
    this.refresh();
    window.addEventListener('resize', this.resizeChart);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeChart);
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    signedAmount,
    signedPercent,
    formatPrice(value) {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed.toFixed(2) : '--';
    },
    async refresh() {
      this.loading = true;
      this.trends = [];
      try {
        const settings = await loadSettings();
        this.darkMode = !!settings.darkMode;
        const [quoteRes, trendRes] = await Promise.all([
          fetch(`https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14,f15,f16,f18&secids=${this.secid}&_=${Date.now()}`).then((res) => res.json()),
          fetch(`https://push2.eastmoney.com/api/qt/stock/trends2/get?secid=${this.secid}&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f53,f56,f58&iscr=0&iscca=0&ndays=1&forcect=1`).then((res) => res.json()),
        ]);
        const diff = quoteRes && quoteRes.data && quoteRes.data.diff && quoteRes.data.diff[0];
        if (diff) {
          this.quote = {
            name: diff.f14,
            price: Number(diff.f2),
            change: Number(diff.f4),
            rate: Number(diff.f3),
            high: Number(diff.f15),
            low: Number(diff.f16),
            prePrice: Number(diff.f18),
          };
        } else {
          this.quote = {};
        }
        const trendData = trendRes && trendRes.data;
        this.prePrice = Number(trendData && trendData.prePrice) || this.quote.prePrice || 0;
        this.trends = (trendData && Array.isArray(trendData.trends) ? trendData.trends : [])
          .map((item) => item.split(','))
          .map((parts) => ({
            time: String(parts[0] || '').split(' ')[1] || parts[0],
            price: Number(parts[1]),
          }))
          .filter((point) => Number.isFinite(point.price));
        this.renderChart();
      } catch (error) {
        this.quote = {};
        this.trends = [];
      } finally {
        this.loading = false;
      }
    },
    renderChart() {
      if (!this.$refs.chartEl) return;
      if (!this.chart) {
        this.chart = echarts.init(this.$refs.chartEl);
      }
      if (!this.trends.length || !this.prePrice) {
        this.chart.clear();
        return;
      }
      // 以昨收为中心对称扩边：昨收线垂直居中，左右轴刻度一一对应
      const prePrice = this.prePrice;
      const dev =
        Math.max(
          ...this.trends.map((point) => Math.abs(point.price - prePrice)),
          prePrice * 0.005
        ) * 1.08;
      const step = dev / 2;
      const pctMax = (dev * 100) / prePrice;
      const color =
        this.trends[this.trends.length - 1].price >= prePrice ? UP_COLOR : DOWN_COLOR;
      const theme = this.darkMode
        ? { text: '#8b93a1', split: '#2f3743', tooltipBg: '#1f2630', tooltipBorder: '#3a4352', tooltipText: '#e2e8f0' }
        : { text: '#64748b', split: '#eef2f7', tooltipBg: '#fff', tooltipBorder: '#e2e8f0', tooltipText: '#0f172a' };
      // x 轴刻度固定到 15:00；收盘更晚的市场（如港股 16:00）按最后数据时间向后扩展
      const slots = this.buildTimeSlots(this.trends[this.trends.length - 1].time);
      const slotMap = new Map(slots.map((time, index) => [time, index]));
      const values = new Array(slots.length).fill(null);
      this.trends.forEach((point) => {
        const index = slotMap.get(point.time);
        if (index !== undefined) values[index] = point.price;
      });
      const labelAt = (index) => {
        const total = slots.length;
        if (index === 0) return '09:30';
        if (index === 60) return '10:30';
        if (index === 120) return '11:30/13:00';
        if (index === 121 || index === 120 + 1) return '';
        if (index === 181) return '14:00';
        if (index === 241) return '15:00';
        if (index === total - 1 && index > 241) return slots[index];
        return '';
      };
      this.chart.setOption({
        animation: false,
        grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
        tooltip: {
          trigger: 'axis',
          confine: true,
          backgroundColor: theme.tooltipBg,
          borderColor: theme.tooltipBorder,
          textStyle: { color: theme.tooltipText, fontSize: 12 },
          formatter: (params) => {
            const point = params[0];
            if (point.value === null || point.value === undefined) {
              return `${point.name}<br/>${point.marker}暂无数据`;
            }
            const rate = prePrice ? ((point.value - prePrice) * 100) / prePrice : 0;
            const tipColor = point.value >= prePrice ? UP_COLOR : DOWN_COLOR;
            return `${point.name}<br/>${point.marker}${point.value.toFixed(2)} <span style="color:${tipColor}">${signedPercent(rate)}</span>`;
          },
        },
        xAxis: {
          type: 'category',
          data: slots,
          boundaryGap: false,
          axisLine: { lineStyle: { color: theme.split } },
          axisTick: { show: false },
          axisLabel: {
            color: theme.text,
            fontSize: 10,
            interval: (index) => labelAt(index) !== '',
            formatter: (value, index) => labelAt(index),
          },
        },
        yAxis: [
          {
            // 左轴：点位
            type: 'value',
            min: prePrice - dev,
            max: prePrice + dev,
            interval: step,
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: theme.split, type: 'dashed' } },
            axisLabel: {
              fontSize: 10,
              formatter: (value) => `{${value >= prePrice ? 'up' : 'down'}|${value.toFixed(2)}}`,
              rich: {
                up: { color: UP_COLOR, fontSize: 10, align: 'right' },
                down: { color: DOWN_COLOR, fontSize: 10, align: 'right' },
              },
            },
          },
          {
            // 右轴：相对昨收的涨跌百分比
            type: 'value',
            min: -pctMax,
            max: pctMax,
            interval: pctMax / 2,
            splitLine: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
              fontSize: 10,
              formatter: (value) => `{${value >= 0 ? 'up' : 'down'}|${signedPercent(value)}}`,
              rich: {
                up: { color: UP_COLOR, fontSize: 10, align: 'left' },
                down: { color: DOWN_COLOR, fontSize: 10, align: 'left' },
              },
            },
          },
        ],
        series: [
          {
            name: this.quote.name || '指数',
            type: 'line',
            data: values,
            connectNulls: true,
            showSymbol: false,
            lineStyle: { color, width: 1.5 },
            itemStyle: { color },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: `${color}33` },
                { offset: 1, color: `${color}05` },
              ]),
            },
            markLine: {
              silent: true,
              symbol: 'none',
              label: { show: false },
              lineStyle: { color: '#7ba3dd', type: 'solid', width: 1 },
              data: [{ yAxis: prePrice }],
            },
          },
        ],
      });
    },
    resizeChart() {
      if (this.chart) this.chart.resize();
    },
    // 生成分时刻度：上午 09:30-11:30，下午 13:00-最晚(15:00 或最后数据时间)
    buildTimeSlots(lastTime) {
      const slots = [];
      const push = (total) => {
        slots.push(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`);
      };
      for (let total = 9 * 60 + 30; total <= 11 * 60 + 30; total += 1) push(total);
      const parts = String(lastTime || '15:00').split(':').map(Number);
      const lastTotal = Math.max(15 * 60, (parts[0] || 15) * 60 + (parts[1] || 0));
      for (let total = 13 * 60; total <= lastTotal; total += 1) push(total);
      return slots;
    },
  },
};
</script>

<style lang="less" scoped>
@import "../styles/page.less";

.index-quote {
  min-height: 86px;
  padding: 14px 16px;
  background: var(--app-surface, #fff);
}

.index-quote__main {
  display: flex;
  align-items: baseline;
  gap: 10px;

  strong {
    font-size: 28px;
    font-weight: 850;
    line-height: 34px;
  }

  span {
    font-size: 13px;
    font-weight: 700;
  }
}

.index-quote__meta {
  display: flex;
  gap: 14px;
  margin-top: 8px;
  color: var(--app-muted, #64748b);
  font-size: 12px;
}

.index-quote__loading {
  margin: 0;
  color: var(--app-muted, #64748b);
  font-size: 13px;
  line-height: 40px;
}

.index-chart-card {
  margin-top: 10px;
  padding: 12px 14px 8px;
  background: var(--app-surface, #fff);
}

.index-chart-card header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;

  strong {
    color: var(--app-text, #0f172a);
    font-size: 15px;
  }

  span {
    color: var(--app-muted, #64748b);
    font-size: 11px;
  }
}

.index-chart {
  width: 100%;
  height: 260px;
}

.index-chart__empty {
  margin: 0;
  padding: 40px 0;
  color: var(--app-muted, #64748b);
  font-size: 12px;
  text-align: center;
}

.is-up {
  color: var(--app-up, #ef1f1f) !important;
}

.is-down {
  color: var(--app-down, #139327) !important;
}
</style>
