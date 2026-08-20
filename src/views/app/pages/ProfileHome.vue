<template>
  <app-page title="我的" eyebrow="设置 · 同步 · 偏好">
    <section class="profile-section account-hero">
      <div>
        <span class="section-kicker">账号信息</span>
        <h2>{{ userInfo.username ? userInfo.username : '未登录' }}</h2>
        <p>{{ userInfo.username ? '可使用云端同步与备份配置。' : '登录后可跨设备同步自选与展示偏好。' }}</p>
      </div>
      <button v-if="userInfo.username" type="button" class="ghost-button danger" :disabled="logoutLoading" @click="logout">
        {{ logoutLoading ? '退出中' : '退出' }}
      </button>
    </section>

    <section v-if="!userInfo.username" class="profile-section">
      <div class="section-title">
        <h3>{{ registerMode ? '注册账号' : '登录账号' }}</h3>
        <button type="button" class="text-button" @click="toggleRegister">{{ registerMode ? '去登录' : '去注册' }}</button>
      </div>
      <div class="form-stack">
        <el-input v-model.trim="loginForm.username" size="small" placeholder="用户名"></el-input>
        <el-input v-model.trim="loginForm.password" size="small" show-password placeholder="密码"></el-input>
        <div v-if="registerMode && captchaBase64" class="captcha-row">
          <el-input v-model.trim="loginForm.captcha" size="small" placeholder="验证码"></el-input>
          <img :src="captchaBase64" alt="验证码" @click="getVerify('refreshCaptcha')" />
        </div>
        <button type="button" class="primary-button" :disabled="loginLoading || registerLoading" @click="registerMode ? register() : login()">
          {{ registerMode ? (registerLoading ? '注册中' : '注册') : (loginLoading ? '登录中' : '登录') }}
        </button>
      </div>
    </section>

    <section v-else class="profile-section">
      <div class="section-title">
        <h3>云端同步</h3>
        <span>手动同步，避免覆盖误操作</span>
      </div>
      <div class="action-grid">
        <button type="button" class="ghost-button" :disabled="getUserInfoLoading" @click="getUserInfo">{{ getUserInfoLoading ? '同步中' : '从云端同步' }}</button>
        <button type="button" class="ghost-button" :disabled="updateUserLoading" @click="updateUser">{{ updateUserLoading ? '备份中' : '备份到云端' }}</button>
      </div>
    </section>

    <section class="profile-section">
      <div class="section-title">
        <h3>显示偏好</h3>
        <span>控制首页与收益展示</span>
      </div>
      <div class="setting-row">
        <span>暗色模式</span>
        <el-switch v-model="darkMode" @change="saveOption('darkMode', darkMode)" active-color="#2563ff"></el-switch>
      </div>
      <div class="setting-row">
        <span>历史收益</span>
        <el-input-number v-model="historicalRevenueAmount" size="small" :controls="false" @change="saveOption('historicalRevenueAmount', historicalRevenueAmount)"></el-input-number>
      </div>
    </section>

    <section class="profile-section">
      <div class="section-title">
        <h3>基金列表显示</h3>
        <span>沿用旧设置项</span>
      </div>
      <div v-for="item in fundDisplayOptions" :key="item.key" class="setting-row">
        <span>{{ item.label }}</span>
        <el-switch v-model="settings[item.key]" @change="saveOption(item.key, settings[item.key])" active-color="#2563ff"></el-switch>
      </div>
    </section>

    <section class="profile-section">
      <div class="section-title">
        <h3>底部汇总显示</h3>
        <span>控制总收益与资产汇总</span>
      </div>
      <div v-for="item in summaryOptions" :key="item.key" class="setting-row">
        <span>{{ item.label }}</span>
        <el-switch v-model="settings[item.key]" @change="saveOption(item.key, settings[item.key])" active-color="#2563ff"></el-switch>
      </div>
    </section>

    <section class="profile-section">
      <div class="section-title">
        <h3>配置导入导出</h3>
        <span>支持文件和文本</span>
      </div>
      <div class="action-grid">
        <button type="button" class="ghost-button" @click="exportConfigFile">导出文件</button>
        <label class="ghost-button file-button">
          导入文件
          <input ref="importInput" type="file" accept="application/json,.json" @change="importConfigFile" />
        </label>
      </div>
      <div class="config-textarea">
        <el-input v-model="configText" type="textarea" :rows="7" placeholder="配置文本会显示在这里，也可以粘贴配置后导入"></el-input>
      </div>
      <div class="action-grid">
        <button type="button" class="ghost-button" @click="exportConfigText">生成文本</button>
        <button type="button" class="ghost-button" @click="copyConfigText">复制文本</button>
        <button type="button" class="ghost-button danger" @click="importConfigText">导入文本</button>
      </div>
      <a ref="downloadLink" class="download-link" :href="configHref" :download="`${timer}基金配置.json`"></a>
    </section>

    <section class="profile-section">
      <button type="button" class="nav-row" @click="$router.push('/app/returns/total')"><span>总收益曲线</span><i class="el-icon-arrow-right"></i></button>
      <button type="button" class="nav-row" @click="$router.push('/app/profile/changelog')"><span>更新日志</span><i class="el-icon-arrow-right"></i></button>
      <button type="button" class="nav-row" @click="openGithub"><span>项目源码</span><i class="el-icon-arrow-right"></i></button>
      <div class="version-row">当前版本 {{ version }}</div>
    </section>
  </app-page>
</template>

<script>
import AppPage from '../components/AppPage.vue';
import { chrome, storage } from '@/untils/utils';
import packageInfo from '../../../../package.json';

const SETTING_KEYS = [
  'showAmount',
  'showGains',
  'showAllGains',
  'showCost',
  'showAllCost',
  'showTotalRevenue',
  'showTotalAssets',
  'showProportion',
  'showCostRate',
  'showGSZ',
  'darkMode',
  'userInfo',
  'historicalRevenueAmount',
  'token',
  'userId',
];

export default {
  components: { AppPage },
  data() {
    return {
      version: packageInfo.version,
      url: '/bspapp',
      timer: '',
      userInfo: {},
      darkMode: false,
      historicalRevenueAmount: 0,
      settings: {
        showAmount: false,
        showGains: false,
        showAllGains: false,
        showCost: false,
        showAllCost: false,
        showTotalRevenue: false,
        showTotalAssets: false,
        showProportion: false,
        showCostRate: false,
        showGSZ: false,
      },
      fundDisplayOptions: [
        { key: 'showGSZ', label: '显示估算净值' },
        { key: 'showAmount', label: '显示持有金额' },
        { key: 'showGains', label: '显示单个估值收益' },
        { key: 'showCost', label: '显示单个持有收益' },
        { key: 'showProportion', label: '显示持仓占比' },
        { key: 'showCostRate', label: '显示持有收益率' },
      ],
      summaryOptions: [
        { key: 'showAllGains', label: '显示总估值收益' },
        { key: 'showAllCost', label: '显示总持有收益' },
        { key: 'showTotalRevenue', label: '显示总收益' },
        { key: 'showTotalAssets', label: '显示总资产' },
      ],
      loginForm: {
        username: '',
        password: '',
        captcha: '',
      },
      registerMode: false,
      captchaBase64: '',
      configText: '',
      configHref: null,
      loginLoading: false,
      registerLoading: false,
      updateUserLoading: false,
      getUserInfoLoading: false,
      logoutLoading: false,
    };
  },
  mounted() {
    this.initTimer();
    this.load();
  },
  methods: {
    initTimer() {
      const date = new Date();
      const year = date.getFullYear();
      const month = `0${date.getMonth() + 1}`.slice(-2);
      const day = `0${date.getDate()}`.slice(-2);
      this.timer = `${year}${month}${day}`;
    },
    async load() {
      const res = await storage.get(SETTING_KEYS);
      this.userInfo = res.userInfo || {};
      this.darkMode = !!res.darkMode;
      this.historicalRevenueAmount = res.historicalRevenueAmount || 0;
      Object.keys(this.settings).forEach((key) => {
        this.settings[key] = !!res[key];
      });
    },
    saveOption(key, value) {
      storage.set({ [key]: value }, () => {
        if (key === 'darkMode') {
          window.dispatchEvent(new CustomEvent('app-theme-change', { detail: { dark: !!value } }));
        }
        chrome.runtime.sendMessage({ type: 'refreshOption', data: { type: key, value } });
      });
    },
    toggleRegister() {
      this.registerMode = !this.registerMode;
      if (this.registerMode) this.getVerify('createCaptcha');
    },
    login() {
      if (!this.loginForm.username || !this.loginForm.password) {
        this.$message.warning('请输入用户名和密码');
        return;
      }
      this.loginLoading = true;
      this.$axios
        .post(this.url, {
          action: 'login',
          params: { ...this.loginForm },
        })
        .then((res) => {
          if (res && res.code === 0) {
            storage.set({ userInfo: res.userInfo, token: res.token });
            this.$message.success('登录成功');
            this.load();
          } else {
            this.$message.error((res && res.message) || '登录失败');
          }
        })
        .finally(() => {
          this.loginLoading = false;
        });
    },
    register() {
      if (!this.loginForm.username || !this.loginForm.password || !this.loginForm.captcha) {
        this.$message.warning('请输入注册信息');
        return;
      }
      this.registerLoading = true;
      storage.get('userId').then((user) => {
        this.$axios
          .post(this.url, {
            action: 'register',
            params: {
              ...this.loginForm,
              deviceId: user.userId,
              id: user.userId,
              scene: 'register',
            },
          })
          .then((res) => {
            if (res.result && res.result.code === 0) {
              storage.set({ userInfo: res.result.userInfo, token: res.result.token });
              this.$message.success('注册成功');
              this.load();
            } else {
              const result = res.result;
              this.$message.error((result && (result.msg || result.message)) || res.message || '注册失败');
              this.getVerify('refreshCaptcha');
            }
          })
          .finally(() => {
            this.registerLoading = false;
          });
      });
    },
    getVerify(action) {
      storage.get('userId').then((user) => {
        this.$axios
          .post(this.url, {
            action,
            params: {
              deviceId: user.userId,
              scene: 'register',
            },
          })
          .then((res) => {
            this.captchaBase64 = res.captchaBase64 || '';
          });
      });
    },
    logout() {
      this.logoutLoading = true;
      storage.get('token').then((res) => {
        this.$axios
          .post(this.url, {
            action: 'logout',
            uniIdToken: res.token,
          })
          .then((result) => {
            if (result && result.code === 0) {
              storage.set({ userInfo: {}, token: null });
              this.$message.success('退出成功');
              this.load();
            }
          })
          .finally(() => {
            this.logoutLoading = false;
          });
      });
    },
    getUserInfo() {
      this.getUserInfoLoading = true;
      storage.get('token').then((res) => {
        this.$axios
          .post(this.url, {
            action: 'getUserInfo',
            params: { field: ['config_data'] },
            uniIdToken: res.token,
          })
          .then((result) => {
            if (result && result.code === 0 && result.userInfo && result.userInfo.config_data) {
              const data = JSON.parse(result.userInfo.config_data);
              storage.set(data, () => {
                chrome.runtime.sendMessage({ type: 'refreshOption' });
              });
              this.$message.success('云端同步成功');
              this.load();
            } else {
              this.$message.warning('云端暂无配置，请先备份');
            }
          })
          .finally(() => {
            this.getUserInfoLoading = false;
          });
      });
    },
    updateUser() {
      this.updateUserLoading = true;
      storage.get(null).then((res) => {
        const uniIdToken = res.token;
        delete res.holiday;
        delete res.token;
        delete res.userInfo;
        this.$axios
          .post(this.url, {
            action: 'updateUser',
            params: { config_data: JSON.stringify(res) },
            uniIdToken,
          })
          .then((result) => {
            if (result && result.code === 0) this.$message.success('备份到云端成功');
          })
          .finally(() => {
            this.updateUserLoading = false;
          });
      });
    },
    exportConfigFile() {
      storage.get(null).then((res) => {
        delete res.holiday;
        this.configHref = `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(res))}`;
        this.$nextTick(() => this.$refs.downloadLink.click());
      });
    },
    importConfigFile(e) {
      const files = e.target.files;
      if (!files || !files.length) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        this.applyConfigText(event.target.result);
        this.$refs.importInput.value = null;
      };
      reader.readAsText(files[0]);
    },
    exportConfigText() {
      storage.get(null).then((res) => {
        delete res.holiday;
        this.configText = JSON.stringify(res, null, 2);
      });
    },
    copyConfigText() {
      if (!this.configText) this.exportConfigText();
      this.$nextTick(() => {
        if (navigator.clipboard && this.configText) {
          navigator.clipboard.writeText(this.configText);
          this.$message.success('已复制配置文本');
        }
      });
    },
    importConfigText() {
      this.applyConfigText(this.configText);
    },
    applyConfigText(text) {
      try {
        const config = JSON.parse(text);
        storage.set(config, () => {
          chrome.runtime.sendMessage({ type: 'refreshOption' });
          this.$message.success('导入配置成功');
          this.load();
        });
      } catch (error) {
        this.$message.error('导入失败，配置文本格式不正确');
      }
    },
    openGithub() {
      window.open('https://github.com/taxilng/fund');
    },
  },
};
</script>

<style lang="less" scoped>
.profile-section {
  margin-bottom: 8px;
  padding: 12px 14px;
  border: 0;
  background: var(--app-surface, #fff);
  color: var(--app-text, #0f172a);
}

.account-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h2 {
    margin: 4px 0;
    color: var(--app-text, #07111f);
    font-size: 22px;
    line-height: 28px;
  }

  p {
    margin: 0;
    color: var(--app-muted, #64748b);
    font-size: 12px;
  }
}

.section-kicker,
.section-title span {
  color: var(--app-muted, #64748b);
  font-size: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;

  h3 {
    margin: 0;
    color: var(--app-text, #0f172a);
    font-size: 16px;
    line-height: 22px;
  }
}

.setting-row,
.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 42px;
  border: 0;
  border-bottom: 1px solid var(--app-border-soft, #eef2f7);
  background: transparent;
  color: var(--app-text, #0f172a);
  font: inherit;
  font-size: 14px;
  text-align: left;

  &:last-child {
    border-bottom: 0;
  }
}

.form-stack {
  display: grid;
  gap: 8px;
}

.captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 8px;
  align-items: center;

  img {
    width: 112px;
    height: 32px;
    object-fit: contain;
    border: 1px solid var(--app-border, #e2e8f0);
  }
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.action-grid:last-child {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.primary-button,
.ghost-button,
.text-button {
  border: 0;
  font: inherit;
  cursor: pointer;
}

.primary-button,
.ghost-button {
  min-height: 38px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 750;
  padding: 0 16px;
}

.primary-button {
  background: var(--app-primary, #2563ff);
  color: #fff;
}

.ghost-button {
  border: 1px solid var(--app-border, #dbe4f0);
  background: var(--app-surface, #fff);
  color: var(--app-text, #1f2937);
}

.ghost-button.danger {
  color: #ef4444;
}

.text-button {
  background: transparent;
  color: var(--app-primary, #2563ff);
  font-size: 13px;
}

.file-button {
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;

  input {
    position: absolute;
    inset: 0;
    opacity: 0;
  }
}

.config-textarea {
  margin-top: 8px;
}

.download-link {
  display: none;
}

.version-row {
  padding-top: 10px;
  color: var(--app-muted, #94a3b8);
  font-size: 12px;
  text-align: center;
}

/deep/ .el-input__inner,
/deep/ .el-textarea__inner {
  border-color: var(--app-border, #dbe4f0);
  background: var(--app-surface-soft, #fbfcff);
  color: var(--app-text, #0f172a);
}

/deep/ .el-input-number .el-input__inner {
  background: var(--app-surface-soft, #fbfcff);
}
</style>
