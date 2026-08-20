<template>
  <section class="app-page">
    <header class="app-page__header">
      <div>
        <p v-if="eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
      </div>
      <div class="app-page__actions">
        <slot name="actions"></slot>
      </div>
    </header>
    <div class="app-page__content">
      <slot></slot>
    </div>
  </section>
</template>

<script>
export default {
  props: {
    title: { type: String, required: true },
    eyebrow: { type: String, default: '' },
  },
};
</script>

<style lang="less" scoped>
.app-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.app-page__header {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 16px 8px;

  p {
    margin: 0 0 5px;
    color: var(--app-muted, #64748b);
    font-size: 12px;
    line-height: 16px;
  }

  h1 {
    margin: 0;
    color: var(--app-text, #07111f);
    font-size: 23px;
    font-weight: 850;
    line-height: 28px;
    letter-spacing: 0;
  }
}

.app-page__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.app-page__content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 0 88px;
  scrollbar-width: none;
}

.app-page__content::-webkit-scrollbar {
  display: none;
}

@media (min-width: 768px) {
  .app-page__header {
    padding: 24px 24px 12px;

    h1 {
      font-size: 28px;
      line-height: 34px;
    }
  }

  .app-page__content {
    padding: 0 0 24px;
  }
}
</style>
