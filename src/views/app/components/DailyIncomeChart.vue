<template>
  <section class="income-chart" :class="[`income-chart--${variant}`, trendClass]">
    <header>
      <div>
        <span>{{ title }}</span>
        <strong>{{ signedAmount(latestValue) }}</strong>
      </div>
      <div class="income-chart__side">
        <div class="income-chart__stats" title="复制波动文案" @click.stop="copyStatsText">
          <span v-for="item in statItems" :key="item.label" class="income-chart__stat">
            <em>{{ item.label }}</em>
            <strong :class="item.value >= 0 ? 'is-up' : 'is-down'">{{ signedAmount(item.value) }}</strong>
          </span>
        </div>
      </div>
    </header>

    <div class="income-chart__canvas">
      <div class="income-chart__plot">
        <svg viewBox="0 0 320 112" preserveAspectRatio="none" aria-hidden="true">
          <line
            v-for="(tick, index) in rateAxisTicks"
            :key="`grid-${index}`"
            :class="['grid-line', { 'grid-line--zero': tick.isZero }]"
            :x1="0"
            :x2="320"
            :y1="tick.y"
            :y2="tick.y"
          ></line>
          <line class="axis-break" x1="160" x2="160" y1="88" y2="98"></line>
          <polyline v-if="chartPoints.length" class="chart-line" :points="chartPoints"></polyline>
        </svg>
        <span v-if="chartPoints.length" class="chart-dot" :style="lastPointStyle"></span>
      </div>
      <div class="income-chart__axis-labels" aria-hidden="true">
        <span>09:30</span>
        <span>11:30</span>
        <span>13:00</span>
        <span>15:00</span>
      </div>
      <div class="income-chart__rate-axis" aria-hidden="true">
        <span
          v-for="(tick, index) in rateAxisTicks"
          :key="`rate-${index}`"
          :style="{ top: `${((tick.y / 112) * 100).toFixed(2)}%` }"
        >{{ tick.label }}</span>
      </div>
      <div v-if="!chartPoints.length" class="income-chart__empty">{{ loading ? '曲线加载中' : '暂无曲线数据' }}</div>
    </div>
  </section>
</template>

<script>
import { signedAmount, signedPercent } from '../services/portfolio';

export default {
  props: {
    title: { type: String, required: true },
    points: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    variant: { type: String, default: 'mini' },
    baseAmount: { type: Number, default: 0 },
    includeCurrentInCopy: { type: Boolean, default: false },
  },
  computed: {
    values() {
      return this.normalizedPoints.map((point) => point.value);
    },
    normalizedPoints() {
      const points = this.points
        .map((point, index) => {
          const value = Number(point && typeof point === 'object' ? point.value : point);
          if (!Number.isFinite(value)) return null;
          return {
            value,
            minute: this.resolveTradingMinute(point, index),
          };
        })
        .filter(Boolean);
      return points.sort((prev, next) => prev.minute - next.minute);
    },
    latestValue() {
      return this.values.length ? this.values[this.values.length - 1] : 0;
    },
    maxValue() {
      return this.values.length ? Math.max(...this.values) : 0;
    },
    minValue() {
      return this.values.length ? Math.min(...this.values) : 0;
    },
    waveValue() {
      return Number((this.maxValue - this.minValue).toFixed(2));
    },
    trendClass() {
      return this.latestValue >= 0 ? 'is-up' : 'is-down';
    },
    bounds() {
      const absMax = Math.max(Math.abs(this.maxValue), Math.abs(this.minValue), 1);
      return { min: -absMax, max: absMax };
    },
    zeroY() {
      return this.toY(0);
    },
    chartPoints() {
      if (!this.normalizedPoints.length) return '';
      return this.normalizedPoints
        .map((point) => `${this.toX(point.minute).toFixed(2)},${this.toY(point.value).toFixed(2)}`)
        .join(' ');
    },
    lastPoint() {
      if (!this.normalizedPoints.length) return { x: 0, y: this.zeroY };
      const point = this.normalizedPoints[this.normalizedPoints.length - 1];
      return {
        x: this.toX(point.minute),
        y: this.toY(point.value),
      };
    },
    lastPointStyle() {
      return {
        left: `${((this.lastPoint.x / 320) * 100).toFixed(4)}%`,
        top: `${((this.lastPoint.y / 112) * 100).toFixed(4)}%`,
      };
    },
    rateAxisTicks() {
      const { max, min } = this.bounds;
      if (max === min) {
        return [{ value: 0, y: this.toY(0), isZero: true, label: this.formatRateAxis(0) }];
      }
      const steps = 4;
      return Array.from({ length: steps + 1 }, (_, i) => {
        const value = min + ((max - min) * i) / steps;
        return {
          value,
          y: this.toY(value),
          isZero: Math.abs(value) < 1e-9,
          label: this.formatRateAxis(value),
        };
      });
    },
    statItems() {
      return [
        { label: '最高', value: this.maxValue },
        { label: '最低', value: this.minValue },
        { label: '波动', value: this.waveValue },
      ];
    },
    currentRate() {
      return this.baseAmount ? (this.latestValue * 100) / this.baseAmount : 0;
    },
  },
  methods: {
    signedAmount,
    formatRateAxis(value) {
      if (!this.baseAmount) return signedPercent(0);
      return signedPercent((Number(value) * 100) / this.baseAmount);
    },
    resolveTradingMinute(point, index) {
      const time = point && typeof point === 'object' ? point.time : '';
      const minute = this.parseTradingMinute(time);
      if (minute !== null) return minute;
      const lastIndex = Math.max(this.points.length - 1, 1);
      return (index / lastIndex) * 240;
    },
    parseTradingMinute(time) {
      const match = String(time || '').match(/(\d{1,2}):(\d{2})/);
      if (!match) return null;
      const hour = Number(match[1]);
      const minute = Number(match[2]);
      const total = hour * 60 + minute;
      const morningStart = 9 * 60 + 30;
      const morningEnd = 11 * 60 + 30;
      const afternoonStart = 13 * 60;
      const afternoonEnd = 15 * 60;
      if (total <= morningStart) return 0;
      if (total <= morningEnd) return total - morningStart;
      if (total < afternoonStart) return 120;
      if (total <= afternoonEnd) return 120 + total - afternoonStart;
      return 240;
    },
    toX(minute) {
      const safeMinute = Math.min(Math.max(Number(minute) || 0, 0), 240);
      if (safeMinute <= 120) return (safeMinute / 120) * 152;
      return 168 + ((safeMinute - 120) / 120) * 152;
    },
    toY(value) {
      const range = this.bounds.max - this.bounds.min || 1;
      return 84 - ((value - this.bounds.min) / range) * 76;
    },
    copyStatsText() {
      const text = this.includeCurrentInCopy
        ? `${this.title.replace(/曲线$/, '')} ${signedAmount(this.latestValue)}（${signedPercent(this.currentRate)}），区间 ${signedAmount(this.minValue)}～${signedAmount(this.maxValue)}，波动 ${signedAmount(this.waveValue)}`
        : `${this.title}：最高 ${signedAmount(this.maxValue)}，最低 ${signedAmount(this.minValue)}，波动 ${signedAmount(this.waveValue)}`;
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
      if (this.$message) {
        this.$message({
          message: '波动文案已复制',
          type: 'success',
          center: true,
        });
      }
    },
  },
};
</script>

<style lang="less" scoped>
.income-chart {
  --rate-axis-width: 44px;
  margin-bottom: 8px;
  padding: 12px 14px;
  background: var(--app-surface, #fff);
  color: var(--app-text, #0f172a);
}

.income-chart header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.income-chart header span {
  display: block;
  color: var(--app-muted, #64748b);
  font-size: 12px;
}

.income-chart header strong {
  display: block;
  margin-top: 4px;
  font-size: 20px;
  line-height: 24px;
}

.income-chart header button {
  border: 0;
  background: transparent;
  color: var(--app-primary, #2563ff);
  font-size: 13px;
}

.income-chart__side {
  display: grid;
  justify-items: end;
  gap: 4px;
  min-width: 128px;
  text-align: right;
}

.income-chart__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px 8px;
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
}

.income-chart header .income-chart__stat {
  display: inline-flex !important;
  align-items: baseline;
  gap: 3px;
  color: var(--app-muted, #64748b);
  font-size: 11px;
  line-height: 16px;
}

.income-chart header .income-chart__stat em {
  color: var(--app-muted, #64748b);
  font-style: normal;
  font-size: 11px;
  line-height: 16px;
}

.income-chart header .income-chart__stat strong {
  display: inline;
  margin-top: 0;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
}

.income-chart__canvas {
  position: relative;
  height: 96px;
  margin-top: 8px;
}

.income-chart__plot {
  position: relative;
  width: calc(100% - var(--rate-axis-width));
  height: 100%;
  margin-left: var(--rate-axis-width);
}

.income-chart svg {
  display: block;
  width: 100%;
  height: 100%;
}

.grid-line {
  stroke: var(--app-border-soft, #eef2f7);
  stroke-width: 0.5;
}

.grid-line--zero {
  stroke: var(--app-border, #e2e8f0);
  stroke-dasharray: 4 4;
}

.axis-line,
.axis-break {
  stroke: var(--app-border-soft, #eef2f7);
  stroke-width: 0.5;
}

.axis-break {
  stroke-dasharray: 2 2;
}

.chart-line {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.1;
  vector-effect: non-scaling-stroke;
}

.chart-dot {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.income-chart__axis-labels {
  position: absolute;
  right: 0;
  bottom: 0;
  left: var(--rate-axis-width);
  height: 18px;
  color: var(--app-muted, #64748b);
  font-size: 11px;
  line-height: 18px;
  pointer-events: none;
}

.income-chart__axis-labels span {
  position: absolute;
  white-space: nowrap;
}

.income-chart__axis-labels span:nth-child(1) {
  left: 0;
}

.income-chart__axis-labels span:nth-child(2) {
  left: 47.5%;
  transform: translateX(-100%);
}

.income-chart__axis-labels span:nth-child(3) {
  left: 52.5%;
}

.income-chart__axis-labels span:nth-child(4) {
  right: 0;
}

.income-chart__rate-axis {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(var(--rate-axis-width) - 8px);
  bottom: 0;
  color: var(--app-muted, #64748b);
  font-size: 10px;
  line-height: 12px;
  pointer-events: none;
  text-align: left;
}

.income-chart__rate-axis span {
  position: absolute;
  left: 0;
  transform: translateY(-50%);
  white-space: nowrap;
}

.income-chart__empty {
  position: absolute;
  inset: 0 0 18px var(--rate-axis-width);
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--app-muted, #64748b);
  font-size: 12px;
}

.income-chart--full {
  min-height: 260px;

  .income-chart__canvas {
    height: 500px;
  }
}

.is-up {
  color: var(--app-up, #ef1f1f);
}

.is-down {
  color: var(--app-down, #139327);
}
</style>
