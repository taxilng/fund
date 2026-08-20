<template>
  <section class="holding-card">
    <div class="holding-card__head">
      <div>
        <h2>{{ title }} <span>({{ items.length }})</span></h2>
        <p>{{ subtitle }}</p>
      </div>
      <div class="holding-card__tools">
        <button class="holding-edit-toggle" type="button" @click="$emit('update:editing', !editing)">
          {{ editing ? '取消编辑' : '编辑' }}
        </button>
      </div>
    </div>

    <div class="holding-table-wrap">
      <table class="holding-table" :class="{ 'holding-table--with-amount': showPositionAmount }">
        <thead>
          <tr v-if="editing">
            <th class="holding-table__name">名称/代码</th>
            <th>成本</th>
            <th>份额</th>
            <th class="holding-table__action">操作</th>
            <th class="holding-table__drag">排序</th>
          </tr>
          <tr v-else>
            <th class="holding-table__name">名称/代码</th>
            <th v-if="showPositionAmount">持仓总额</th>
            <th>成本/现价</th>
            <th>日收益/率</th>
            <th>持有收益/率</th>
          </tr>
        </thead>
        <tbody ref="holdingBody">
          <tr v-if="!items.length" class="holding-empty-row">
            <td :colspan="editing ? 5 : 4">
              <div class="holding-empty">
                <strong>暂无{{ emptyName }}</strong>
                <span>点击右上角添加，开始跟踪收益。</span>
              </div>
            </td>
          </tr>
          <tr v-for="item in items" :key="item.code" class="holding-row">
            <td class="holding-table__name">
              <strong>{{ item.name }}</strong>
              <span>{{ item.code }} <em>持有</em></span>
            </td>
            <template v-if="editing">
              <td>
                <input class="holding-input" type="text" inputmode="decimal" placeholder="成本" :value="item.cost" @input="$emit('change-cost', item, $event.target.value)" @blur="$emit('commit-edit')" @click.stop />
              </td>
              <td>
                <input class="holding-input" type="text" inputmode="decimal" placeholder="份额" :value="item.num" @input="$emit('change-num', item, $event.target.value)" @blur="$emit('commit-edit')" @click.stop />
              </td>
              <td class="holding-table__action">
                <button class="holding-delete" type="button" @click.stop="$emit('delete', item)">删除</button>
              </td>
              <td class="holding-table__drag">
                <button class="holding-drag" type="button" aria-label="拖动排序"><i class="el-icon-rank"></i></button>
              </td>
            </template>
            <template v-else>
              <td v-if="showPositionAmount" class="holding-number">
                <strong>{{ formatAmount(item.amount) }}</strong>
              </td>
              <td class="holding-number holding-price">
                <strong>{{ formatCost(item.cost) }}</strong>
                <span>{{ formatPrice(item) }}</span>
              </td>
              <td class="holding-number" :class="dailyChangeClass(item)">
                <strong>{{ signedAmount(item.gains) }}</strong>
                <span>{{ signedPercent(item.rate) }}</span>
              </td>
              <td class="holding-number" :class="item.costGains >= 0 ? 'is-up' : 'is-down'">
                <strong>{{ signedAmount(item.costGains) }}</strong>
                <span>{{ signedPercent(item.costGainsRate) }}</span>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script>
import Sortable from 'sortablejs';
import { signedAmount, signedPercent } from '../services/portfolio';

export default {
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '当日更新' },
    items: { type: Array, default: () => [] },
    editing: { type: Boolean, default: false },
    showPositionAmount: { type: Boolean, default: false },
  },
  computed: {
    emptyName() {
      return this.title.replace(/^自选/, '');
    },
  },
  watch: {
    editing(value) {
      if (this.sortable) this.sortable.option('disabled', !value);
    },
  },
  mounted() {
    this.sortable = Sortable.create(this.$refs.holdingBody, {
      animation: 150,
      delay: 120,
      delayOnTouchOnly: true,
      disabled: !this.editing,
      draggable: '.holding-row',
      ghostClass: 'holding-row--dragging',
      handle: '.holding-drag',
      chosenClass: 'holding-row--chosen',
      touchStartThreshold: 3,
      onEnd: ({ oldIndex, newIndex }) => {
        if (oldIndex !== newIndex && oldIndex !== undefined && newIndex !== undefined) {
          this.$emit('reorder', { oldIndex, newIndex });
        }
      },
    });
  },
  beforeDestroy() {
    if (this.sortable) this.sortable.destroy();
  },
  methods: {
    signedAmount,
    signedPercent,
    dailyChangeClass(item) {
      const base = Number(item.num || item.amount) ? Number(item.gains) : Number(item.rate);
      return base >= 0 ? 'is-up' : 'is-down';
    },
    formatNav(value) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed.toFixed(4) : '--';
    },
    formatCost(value) {
      const parsed = Number(value);
      return parsed > 0 ? parsed.toFixed(4) : '--';
    },
    formatPrice(item) {
      const price = Number(item.price);
      return price > 0 ? price.toFixed(4) : this.formatNav(item.nav);
    },
    formatAmount(value) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) : '--';
    },
  },
};
</script>

<style lang="less" scoped>
.holding-card {
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: var(--app-surface, #fff);
  box-shadow: none;
}

.holding-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--app-border-soft, #eef2f7);

  h2 {
    margin: 0;
    color: var(--app-text, #0f172a);
    font-size: 19px;
    font-weight: 850;
    line-height: 26px;

    span {
      font-size: 15px;
    }
  }

  p {
    display: inline-block;
    margin: 5px 0 0;
    padding: 2px 6px;
    border-radius: 5px;
    background: var(--app-primary-soft, #eef4ff);
    color: var(--app-primary, #2563ff);
    font-size: 11px;
  }
}

.holding-card__tools {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.holding-edit-toggle {
  padding: 5px 8px;
  border: 1px solid var(--app-primary, #2563ff);
  border-radius: 4px;
  background: var(--app-primary, #2563ff);
  color: #fff;
  font-size: 12px;
  line-height: 16px;
}

.holding-table-wrap {
  width: 100%;
  overflow-x: auto;
  background: var(--app-surface, #fff);
}

.holding-table {
  width: 100%;
  min-width: 390px;
  border-collapse: collapse;
  table-layout: fixed;
}

.holding-table--with-amount {
  min-width: 460px;
}

.holding-table th {
  height: 34px;
  padding: 0 5px;
  border-bottom: 1px solid var(--app-border-soft, #eef2f7);
  background: var(--app-surface-soft, #fbfcff);
  color: var(--app-muted, #64748b);
  font-size: 11px;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
}

.holding-table td {
  height: 62px;
  padding: 7px 5px;
  border-bottom: 1px solid var(--app-border-soft, #eef2f7);
  color: var(--app-text, #111827);
  font-size: 12px;
  vertical-align: middle;
}

.holding-table tbody tr {
  cursor: pointer;
}

.holding-table tbody tr:last-child td {
  border-bottom: 0;
}

.holding-row--chosen td {
  background: var(--app-primary-soft, #eef4ff);
}

.holding-row--dragging {
  opacity: 0.55;
}

.holding-table__name {
  width: 34%;
  padding-left: 12px !important;
  text-align: left !important;
}

.holding-drag {
  width: 20px;
  height: 28px;
  margin-left: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-muted, #64748b);
  cursor: grab;
  font-size: 16px;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
}

.holding-table__name strong {
  display: -webkit-box;
  overflow: hidden;
  color: var(--app-text, #0f172a);
  font-size: 13px;
  font-weight: 800;
  line-height: 18px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.holding-table__name span {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  color: var(--app-muted, #64748b);
  font-size: 11px;
}

.holding-table__name em {
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--app-primary-soft, #eef4ff);
  color: var(--app-primary, #2563ff);
  font-style: normal;
  font-weight: 700;
}

.holding-table__action {
  width: 44px;
  text-align: center !important;
}

.holding-table__drag {
  width: 36px;
  text-align: center !important;
}

.holding-number {
  font-weight: 650;
  text-align: right;
  white-space: nowrap;
}

.holding-number strong,
.holding-number span {
  display: block;
}

.holding-number strong {
  font-size: 13px;
  line-height: 18px;
}

.holding-number span {
  margin-top: 3px;
  font-size: 11px;
  line-height: 14px;
}

.is-up {
  color: var(--app-up, #ef1f1f) !important;
}

.is-down {
  color: var(--app-down, #139327) !important;
}

.holding-input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 7px 5px;
  border: 1px solid var(--app-border, #d9e2ef);
  background: var(--app-surface, #fff);
  color: var(--app-text, #111827);
  border-radius: 7px;
  outline: none;
}

.holding-delete {
  border: 0;
  background: transparent;
  color: #ef4444;
  font-size: 12px;
}

.holding-empty-row td {
  height: auto;
  padding: 0;
}

.holding-empty {
  display: grid;
  gap: 6px;
  padding: 24px 16px;
  color: var(--app-muted, #64748b);
  text-align: center;

  strong {
    color: var(--app-text, #0f172a);
    font-size: 15px;
  }
}
</style>
