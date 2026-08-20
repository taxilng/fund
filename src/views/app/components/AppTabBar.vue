<template>
  <nav class="app-tabbar">
    <button v-for="item in tabs" :key="item.path" class="app-tabbar__item" :class="{ 'is-active': isActive(item) }" type="button" @click="$router.push(item.path)">
      <i :class="item.icon"></i>
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      tabs: [
        { label: '基金', path: '/app/fund', icon: 'el-icon-pie-chart' },
        { label: '股票', path: '/app/stock', icon: 'el-icon-data-line' },
        { label: '市场中心', path: '/app/market', icon: 'el-icon-discover' },
        { label: '我的', path: '/app/profile', icon: 'el-icon-user' },
      ],
    };
  },
  methods: {
    isActive(item) {
      return this.$route.path === item.path || this.$route.path.indexOf(`${item.path}/`) === 0;
    },
  },
};
</script>

<style lang="less" scoped>
.app-tabbar {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  min-height: 64px;
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--app-border, rgba(226, 232, 240, 0.96));
  background: var(--app-surface, rgba(255, 255, 255, 0.96));
  box-shadow: 0 -14px 30px var(--app-shadow, rgba(15, 23, 42, 0.08));
  backdrop-filter: blur(14px);
}

.app-tabbar__item {
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--app-muted, #64748b);
  cursor: pointer;
  font: inherit;
  text-align: center;

  i {
    display: block;
    font-size: 21px;
    line-height: 25px;
  }

  span {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    line-height: 16px;
  }
}

.app-tabbar__item.is-active {
  color: var(--app-primary, #2563ff);
  font-weight: 700;
}

@media (min-width: 768px) {
  .app-tabbar {
    position: relative;
    right: auto;
    bottom: auto;
    left: auto;
    grid-column: 1;
    grid-row: 1;
    grid-template-columns: 1fr;
    grid-auto-rows: 78px;
    align-content: start;
    min-height: 100%;
    padding: 18px 10px;
    border-top: 0;
    border-right: 1px solid var(--app-border, rgba(226, 232, 240, 0.96));
    background: var(--app-surface, rgba(255, 255, 255, 0.96));
    box-shadow: none;
  }

  .app-tabbar__item {
    display: grid;
    place-items: center;
    border-radius: 12px;

    i {
      font-size: 24px;
      line-height: 28px;
    }

    span {
      margin-top: 4px;
      font-size: 13px;
      line-height: 18px;
    }
  }

  .app-tabbar__item.is-active {
    background: var(--app-primary-soft, #eef4ff);
  }
}
</style>
