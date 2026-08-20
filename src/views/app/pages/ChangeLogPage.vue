<template>
  <app-page title="更新日志" eyebrow="版本记录">
    <section class="log-section">
      <article v-for="item in changelog.list" :key="item.version" class="log-item">
        <header>
          <h2>v{{ item.version }}</h2>
          <span v-if="item.type === 2">重要更新</span>
        </header>
        <ul>
          <li v-for="(content, index) in item.content" :key="index" :class="{ major: content.type === 2 }">
            {{ content.content }}
          </li>
        </ul>
      </article>
    </section>
  </app-page>
</template>

<script>
import AppPage from '../components/AppPage.vue';
import changelog from '@/views/common/changeLog.json';

export default {
  components: { AppPage },
  data() {
    return {
      changelog,
    };
  },
};
</script>

<style lang="less" scoped>
.log-section {
  background: #fff;
}

.log-item {
  padding: 13px 16px;
  border-bottom: 1px solid #eef2f7;

  header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  h2 {
    margin: 0;
    color: #0f172a;
    font-size: 17px;
    line-height: 22px;
  }

  span {
    padding: 2px 6px;
    border-radius: 5px;
    background: #eef4ff;
    color: #2563ff;
    font-size: 11px;
    font-weight: 750;
  }

  ul {
    display: grid;
    gap: 6px;
    margin: 0;
    padding-left: 18px;
    color: #475569;
    font-size: 13px;
    line-height: 19px;
  }

  .major {
    color: #0f172a;
    font-weight: 750;
  }
}
</style>
