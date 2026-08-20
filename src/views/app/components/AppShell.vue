<template>
  <div class="h5-shell" :class="{ 'h5-shell--dark': dark }">
    <main class="h5-shell__page">
      <router-view />
    </main>
    <app-tab-bar />
  </div>
</template>

<script>
import AppTabBar from './AppTabBar.vue';
import { loadSettings } from '../services/portfolio';

export default {
  components: { AppTabBar },
  data() {
    return {
      dark: false,
    };
  },
  watch: {
    '$route.fullPath': 'loadTheme',
  },
  mounted() {
    this.loadTheme();
    window.addEventListener('app-theme-change', this.handleThemeChange);
  },
  beforeDestroy() {
    window.removeEventListener('app-theme-change', this.handleThemeChange);
  },
  methods: {
    async loadTheme() {
      const settings = await loadSettings();
      this.dark = !!settings.darkMode;
      this.applyDocumentTheme(this.dark);
    },
    handleThemeChange(event) {
      this.dark = !!(event && event.detail && event.detail.dark);
      this.applyDocumentTheme(this.dark);
    },
    applyDocumentTheme(dark) {
      document.documentElement.setAttribute('data-app-theme', dark ? 'dark' : 'light');
    },
  },
};
</script>

<style lang="less" scoped>
.h5-shell {
  --app-bg: #f6f8fb;
  --app-bg-soft: #f8fbff;
  --app-surface: #fff;
  --app-surface-soft: #fbfcff;
  --app-text: #07111f;
  --app-subtext: #334155;
  --app-muted: #64748b;
  --app-border: #e2e8f0;
  --app-border-soft: #eef2f7;
  --app-primary: #2563ff;
  --app-primary-soft: #eef4ff;
  --app-up: #ef1f1f;
  --app-down: #139327;
  --app-shadow: rgba(15, 23, 42, 0.08);
  --app-loading-bg: rgba(255, 255, 255, 0.9);
  --app-loading-text: #303133;
  position: relative;
  width: 100%;
  max-width: 430px;
  height: 100vh;
  max-height: none;
  margin: 0 auto;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% -8%, rgba(51, 113, 255, 0.05), transparent 32%),
    linear-gradient(180deg, var(--app-bg-soft) 0%, #f6f8fb 42%, var(--app-bg) 100%);
  border-right: 1px solid rgba(226, 232, 240, 0.8);
  border-left: 1px solid rgba(226, 232, 240, 0.8);
  color: #121826;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

@media (max-width: 430px) {
  .h5-shell {
    border-right: 0;
    border-left: 0;
  }
}

@media (min-width: 768px) {
  .h5-shell {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    width: calc(100vw - 48px);
    max-width: 1080px;
    height: 100vh;
    border-right: 1px solid var(--app-border, rgba(226, 232, 240, 0.8));
    border-left: 0;
  }

  .h5-shell__page {
    grid-column: 2;
    grid-row: 1;
    min-width: 0;
  }
}

.h5-shell__page {
  height: 100%;
  overflow: hidden;
}

.h5-shell--dark {
  --app-bg: #0f172a;
  --app-bg-soft: #111827;
  --app-surface: #182235;
  --app-surface-soft: #1e293b;
  --app-text: #f8fafc;
  --app-subtext: #dbeafe;
  --app-muted: #94a3b8;
  --app-border: rgba(148, 163, 184, 0.28);
  --app-border-soft: rgba(148, 163, 184, 0.18);
  --app-primary: #60a5fa;
  --app-primary-soft: rgba(96, 165, 250, 0.16);
  --app-up: #ff6b6b;
  --app-down: #22c55e;
  --app-shadow: rgba(0, 0, 0, 0.28);
  --app-loading-bg: rgba(15, 23, 42, 0.72);
  --app-loading-text: #f8fafc;
  background: linear-gradient(180deg, var(--app-bg-soft) 0%, var(--app-bg) 100%);
  color: var(--app-text);
}
</style>
