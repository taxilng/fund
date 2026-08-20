<template>
  <div id="app" class="portfolio-shell" :class="containerClass" :style="diyContainer ? { width: containerWidth + 'px', height: containerHeight + 'px' } : ''">
    <div class="portfolio-header">
      <div>
        <h2>自选基金与股票助手</h2>
      </div>
      <div class="portfolio-header__actions">
        <button class="portfolio-icon-action" type="button" title="刷新" @click="refresh">
          <i class="el-icon-refresh" :class="{ isRefresh: isRefresh }"></i>
          <span>刷新</span>
        </button>
        <button class="portfolio-icon-action" type="button" title="设置" @click="option">
          <i class="el-icon-setting"></i>
          <span>设置</span>
        </button>
      </div>
    </div>
    <main class="portfolio-content">
      <div class="market-board">
        <div
          v-for="(el, index) in displayIndFundData"
          :draggable="isEdit && !el.isFallback"
          class="market-card"
          :class="drag"
          :key="el.f12 || el.f14"
          @click.stop="!isEdit && !el.isFallback && indDetail(el)"
          @dragstart="handleDragStart($event, el)"
          @dragover.prevent="handleDragOver($event, el)"
          @dragenter="handleDragEnter($event, el, index)"
          @dragend="handleDragEnd($event, el)"
        >
          <h5>
            {{ el.f14 }}
            <span v-if="isEdit && !el.isFallback" @click="dltIndFund(index)" class="market-card__remove">✖</span>
          </h5>
          <p :class="el.f3 >= 0 ? 'trend-up' : 'trend-down'">{{ el.f2 }}</p>
          <p class="market-card__change" :class="el.f3 >= 0 ? 'trend-up' : 'trend-down'">{{ el.f4 }}&nbsp;&nbsp;{{ el.f3 }}%</p>
          <span class="market-card__sparkline" aria-hidden="true"></span>
        </div>
        <div v-if="isEdit && indFundData.length < 4" class="market-card">
          <div v-if="!showAddSeciInput" class="addSeci" @click="() => (showAddSeciInput = true)">添加</div>
          <div v-else>
            <div style="padding-top: 2px">
              <el-select size="mini" :popper-append-to-body="false" v-model="sltSeci" style="width: 110px" placeholder="请选择">
                <el-option v-for="item in userSeciList" :key="item.value" :label="item.label" :value="item.value"></el-option>
              </el-select>
            </div>
            <div style="margin-top: 4px">
              <input class="btn" type="button" value="取消" @click="() => (showAddSeciInput = false)" />
              <input class="btn" type="button" value="确定" @click="saveSeci" />
            </div>
          </div>
        </div>
      </div>
      <div v-if="isEdit" class="portfolio-edit-panel">
        <span>添加新基金:</span>
        <!-- <input v-model="fundcode" class="btn" type="text" placeholder="请输入基金代码" /> -->
        <el-select
          v-model="fundcode"
          multiple
          filterable
          :popper-append-to-body="false"
          remote
          size="mini"
          reserve-keyword
          @change="selectChange"
          placeholder="请输入基金编码，支持按名称或编码搜索"
          :remote-method="remoteMethod"
          :loading="loading"
          style="width: 300px"
        >
          <el-option v-for="item in searchOptions" :key="item.value" :label="item.label" :value="item.value">
            <span class="option_fund_name">{{ item.label }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px; margim-right: 20px; padding-right: 15px">{{ item.value }}</span>
          </el-option>
        </el-select>
        <input @click="save" class="btn" type="button" value="确定" />
      </div>
      <p v-if="isEdit" class="portfolio-tip portfolio-tip--center">部分新发基金或QDII基金可以搜索到，但可能无法获取估值情况</p>
      <div class="asset-board">
        <button class="asset-card copy" :class="allGains >= 0 ? 'asset-card--up' : 'asset-card--down'" type="button" @click="earningsDayShow">
          <span class="asset-card__label">今日收益(元)</span>
          <strong>{{ allGains }}</strong>
          <em>{{ dailyYield }}</em>
        </button>
        <button class="asset-card" :class="allCostGains[0] >= 0 ? 'asset-card--up' : 'asset-card--down'" type="button" @click="holdingIncomeShow">
          <span class="asset-card__label">持有收益(元)</span>
          <strong>{{ parseFloat(allCostGains[0]).toLocaleString('zh', { minimumFractionDigits: 1 }) }}</strong>
          <em>{{ isNaN(allCostGains[1]) ? '' : allCostGains[1] + '%' }}</em>
        </button>
        <button class="asset-card copyTotalRevenue" :class="totalRevenue[0] >= 0 ? 'asset-card--up' : 'asset-card--down'" type="button" @click="copyTotalRevenue">
          <span class="asset-card__label">累计收益(元)</span>
          <strong>{{ parseFloat(totalRevenue[0]).toLocaleString('zh', { minimumFractionDigits: 1 }) }}</strong>
          <em>{{ isNaN(totalRevenue[1]) ? '' : totalRevenue[1] + '%' }}</em>
        </button>
        <button class="asset-card asset-card--neutral" type="button">
          <span class="asset-card__label">总资产(元)</span>
          <strong>{{ allAmount }}</strong>
        </button>
      </div>
      <div class="holdings-heading">
        <div class="holdings-heading__title">
          <h3>自选基金 <span>({{ dataList.length }})</span></h3>
          <span class="holdings-heading__badge">当日更新</span>
        </div>
        <div class="holdings-heading__actions">
          <span>编辑模式</span>
          <el-switch v-model="isEdit" active-color="#2563ff" inactive-color="#d8dee9"></el-switch>
          <button class="holdings-heading__add" type="button" @click="isEdit = true">添加</button>
        </div>
      </div>
      <div class="holdings-panel" :class="{ 'holdings-panel--editing': isEdit, 'holdings-panel--scroll': isEdit }">
        <div class="holdings-header" :class="{ 'holdings-header--editing': isEdit }">
          <div class="holdings-cell holdings-cell--name">基金名称/代码</div>
          <template v-if="isEdit">
            <div class="holdings-cell holdings-cell--edit-head">成本价</div>
            <div class="holdings-cell holdings-cell--edit-head">持有份额</div>
            <div class="holdings-cell holdings-cell--edit-head">删除</div>
          </template>
          <template v-else>
            <div class="holdings-cell holdings-cell--nav">净值</div>
            <button class="holdings-cell holdings-sort" type="button" @click="sortList('gszzl')">
              日涨跌幅
              <span :class="sortType.gszzl" class="down-arrow"></span>
            </button>
            <button class="holdings-cell holdings-sort" type="button" @click="sortList('costGains')">
              持有收益
              <span :class="sortType.costGains" class="down-arrow"></span>
            </button>
            <button class="holdings-cell holdings-sort" type="button" @click="sortList('costGainsRate')">
              持有收益率
              <span :class="sortType.costGainsRate" class="down-arrow"></span>
            </button>
            <div class="holdings-cell holdings-cell--detail"></div>
          </template>
        </div>
        <div class="holdings-list">
          <div
            v-for="(el, index) in dataList"
            :key="el.fundcode"
            class="holding-row"
            :class="[drag, { 'holding-row--editing': isEdit }]"
            :draggable="isEdit"
            @dragstart="handleDragStart($event, el)"
            @dragover.prevent="handleDragOver($event, el)"
            @dragenter="handleDragEnter($event, el, index)"
            @dragend="handleDragEnd($event, el)"
          >
            <div class="holdings-cell holding-identity" :class="{ 'holding-identity--readonly': isEdit }" :title="el.name" @click.stop="!isEdit && fundDetail(el)">
              <div class="holding-identity__name">{{ el.name }}</div>
              <div class="holding-identity__meta">
                <span>{{ el.fundcode }}</span>
                <span v-if="!isEdit" class="holding-tag">持有</span>
                <span v-else>持有</span>
              </div>
            </div>
            <template v-if="isEdit">
              <div class="holdings-cell holding-edit-cell">
                <input class="btn num" placeholder="成本价" v-model="el.cost" @input="changeCost(el, index)" type="text" />
              </div>
              <div class="holdings-cell holding-edit-cell">
                <input class="btn num" placeholder="份额" v-model="el.num" @input="changeNum(el, index)" type="text" />
              </div>
              <div class="holdings-cell holding-edit-cell holding-edit-cell--remove">
                <button @click="dlt(el.fundcode)" class="btn red edit" type="button">✖</button>
              </div>
            </template>
            <template v-else>
              <div class="holdings-cell holding-nav-value">{{ formatNav(el.gsz || el.dwjz) }}</div>
              <div class="holdings-cell holding-metric" :class="el.gszzl >= 0 ? 'trend-up' : 'trend-down'">{{ formatPercent(el.gszzl) }}</div>
              <div class="holdings-cell holding-metric" :class="el.costGains >= 0 ? 'trend-up' : 'trend-down'">
                {{ formatSignedNumber(el.costGains) }}
              </div>
              <div class="holdings-cell holding-metric" :class="el.costGainsRate >= 0 ? 'trend-up' : 'trend-down'">
                {{ el.cost > 0 ? formatPercent(el.costGainsRate) : '--' }}
              </div>
              <button class="holdings-cell holding-detail-action" type="button" @click.stop="fundDetail(el)">
                <i class="el-icon-arrow-right"></i>
              </button>
            </template>
          </div>
        </div>
        <div class="holdings-footer">已显示全部{{ dataList.length }}只基金</div>
      </div>
      <p class="portfolio-risk-note">数据仅供参考，不构成投资建议。市场有风险，投资需谨慎。</p>
    </main>
    <p v-if="isEdit" class="portfolio-tip">特别关注功能介绍：指定一个基金，在程序图标中以角标的形式实时更新，请在设置中选择角标类型与内容。</p>

    <div v-show="isEdit" class="portfolio-mode-panel">
      <el-switch v-model="darkMode" @change="changeDarkMode" active-color="#484848" inactive-color="#13ce66" inactive-text="标准模式" active-text="暗色模式"> </el-switch>
      <!-- <input v-model="containerWidth" type="number" />
      <input v-model="containerHeight" type="number" /> -->
    </div>

    <div class="app-nav">
      <button class="app-nav__item app-nav__item--active" type="button" @click="goStock">
        <i class="el-icon-data-line"></i>
        <span>股票</span>
      </button>
      <button class="app-nav__item" type="button" @click="market">
        <i class="el-icon-position"></i>
        <span>市场中心</span>
      </button>
      <button class="app-nav__item app-nav__item--primary" type="button" @click="isEdit = !isEdit">
        <i :class="isEdit ? 'el-icon-check' : 'el-icon-plus'"></i>
        <span>{{ isEdit ? '完成' : '编辑' }}</span>
      </button>
      <button class="app-nav__item" type="button" @click="goTotalRevenue">
        <i class="el-icon-document"></i>
        <span>汇总</span>
      </button>
      <button class="app-nav__item" type="button" @click="option">
        <i class="el-icon-menu"></i>
        <span>更多</span>
      </button>
    </div>
    <market :darkMode="darkMode" @close="closeCharts" ref="marketShadow"></market>
    <ind-detail @close="closeCharts" :darkMode="darkMode" ref="indDetail"> </ind-detail>
    <!-- <charts @close="closeCharts" ref="charts"></charts> -->
    <fund-detail @close="closeCharts" :curfund="sltFund" :fundList="dataList" :darkMode="darkMode" ref="charts"></fund-detail>
    <earnings-day @close="earningsDayDialogShow = false" :earningsDayDialogShow="earningsDayDialogShow" :fundList="dataList" :allAmount="allAmount" :darkMode="darkMode"></earnings-day>
    <holding-income
      @close="holdingIncomeDialogShow = false"
      :earningsDayDialogShow="holdingIncomeDialogShow"
      :fundList="dataList"
      :allCostGains="allCostGains[0]"
      :darkMode="darkMode"
    ></holding-income>
    <reward @close="rewardShadow = false" ref="reward"></reward>
    <change-log @close="closeChangelog" :darkMode="darkMode" ref="changelog" :top="40"></change-log>
    <tips :addDialog.sync="addDialog"></tips>
  </div>
</template>

<script>
import packageInfo from '../../../package.json';
import reward from '../common/reward';
import indDetail from '../common/indDetail';
import fundDetail from '../common/fundDetail';
import earningsDay from '../common/earningsDay';
import holdingIncome from '../common/holdingIncome';
import changeLog from '../common/changeLog';
import { storage, chrome } from '@/untils/utils';
import market from '../common/market';
import ClipboardJS from 'clipboard';
import tips from './tips';
import { get } from "@/axios/request";

const { version } = packageInfo;

//防抖
let timeout = null;
function debounce(fn, wait = 700) {
  if (timeout !== null) clearTimeout(timeout);
  timeout = setTimeout(fn, wait);
}

export default {
  components: {
    reward,
    fundDetail,
    earningsDay,
    holdingIncome,
    indDetail,
    changeLog,
    market,
    tips,
  },
  data() {
    return {
      isHttp: process.env.VUE_APP_SERVER === 'tencent',
      addDialog: false,
      earningsDayDialogShow: false,
      holdingIncomeDialogShow: false,
      isEdit: false,
      fundcode: '',
      isAdd: false,
      indFundData: [],
      isDuringDate: false,
      RealtimeFundcode: null,
      dataList: [],
      myVar: null,
      myVar1: null,
      rewardShadow: false,
      checked: 'wepay',
      showGains: false,
      showAllGains: false,
      showTotalRevenue: false,
      historicalRevenueAmount: 0,
      showAmount: false,
      showProportion: false,
      showCost: false,
      showAllCost: false,
      showTotalAssets: false,
      showCostRate: false,
      showGSZ: false,
      fundList: ['001618'],
      fundListM: [],
      sortType: {
        gszzl: 'none',
        amount: 'none',
        gains: 'none',
        costGains: 'none',
        costGainsRate: 'none',
      },
      searchOptions: [],
      searchChangeOptions: [],
      value: [],
      list: [],
      loading: false,
      dragging: null,
      showAddSeciInput: false,
      seciList: ['1.000001', '1.000300', '0.399001', '0.399006'],
      allSeciList: [
        {
          value: '1.000001',
          label: '上证指数',
        },
        {
          value: '1.000300',
          label: '沪深300',
        },
        {
          value: '0.399001',
          label: '深证成指',
        },
        {
          value: '1.000688',
          label: '科创50',
        },
        {
          value: '0.399006',
          label: '创业板指',
        },
        {
          value: '0.399005',
          label: '中小板指',
        },
        {
          value: '100.HSI',
          label: '恒生指数',
        },
        {
          value: '100.DJIA',
          label: '道琼斯',
        },
        {
          value: '100.NDX',
          label: '纳斯达克',
        },
        {
          value: '100.SPX',
          label: '标普500',
        },
      ],
      sltSeci: '',
      darkMode: false,
      diyContainer: false,
      containerWidth: 790,
      containerHeight: 590,
      detailShadow: false,
      changelogShadow: false,
      sltFund: {},
      localVersion: version,
      userId: null,
      isRefresh: false,
    };
  },
  mounted() {
    // if(Date.now() > localStorage.getItem('popupTimeout')) {
    //     this.addDialog = true
    // }
    // if (process.env.NODE_ENV === "development") {
    //     const script = document.createElement('script');
    //     script.type = 'text/javascript';
    //     script.src = "http://wechatfe.github.io/vconsole/lib/vconsole.min.js?v=3.2.0";
    //     document.body.appendChild(script);
    //     script.onload = function () {
    //         var vConsole = new VConsole();
    //     }
    // }
    // console.log('home mounted');
    // storage.set({c:3},()=>{ console.log(444);})
    storage
      .get([
        'RealtimeFundcode',
        'fundListM',
        'showAmount',
        'showProportion',
        'showGains',
        'showAllGains',
        'showTotalRevenue',
        'historicalRevenueAmount',
        'fundList',
        'seciList',
        'darkMode',
        'showCost',
        'showAllCost',
        'showTotalAssets',
        'showCostRate',
        'showGSZ',
        'version',
        'userId',
      ])
      .then((res) => {
        this.fundList = res.fundList ? res.fundList : this.fundList;
        if (res.fundListM) {
          this.fundListM = res.fundListM;
        } else {
          for (const fund of this.fundList) {
            let val = {
              code: fund,
              num: 0,
            };
            this.fundListM.push(val);
          }
          storage.set({
            fundListM: this.fundListM,
          });
        }
        if (res.userId) {
          this.userId = res.userId;
        } else {
          this.userId = this.getGuid();
          storage.set({
            userId: this.userId,
          });
        }
        this.darkMode = res.darkMode ? res.darkMode : false;
        this.seciList = res.seciList ? res.seciList : this.seciList;
        this.showAmount = res.showAmount ? res.showAmount : false;
        this.showProportion = res.showProportion ? res.showProportion : false;
        this.showGains = res.showGains ? res.showGains : false;
        this.showAllGains = res.showAllGains ? res.showAllGains : false;
        this.historicalRevenueAmount = res.historicalRevenueAmount ?? 0;
        this.showTotalRevenue = res.showTotalRevenue ?? false;
        this.RealtimeFundcode = res.RealtimeFundcode;
        this.showCost = res.showCost ? res.showCost : false;
        this.showAllCost = res.showAllCost ? res.showAllCost : false;
        this.showTotalAssets = res.showTotalAssets ? res.showTotalAssets : false;
        this.showCostRate = res.showCostRate ? res.showCostRate : false;
        this.showGSZ = res.showGSZ ? res.showGSZ : false;

        this.getIndFundData();
        this.getData();
        this.checkInterval(true);

        let ver = res.version ? res.version : '1.0.0';
        // console.log(22, ver, this.localVersion);
        if (ver != this.localVersion) {
          this.changelog();
        }
      });
  },
  computed: {
    allGains() {
      let allGains = 0;
      this.dataList.forEach((val) => {
        allGains += parseFloat(val.gains);
      });
      allGains = allGains.toFixed(1);
      return allGains;
    },
    allAmount() {
      let allAmount = 0;
      this.dataList.forEach((val) => {
        allAmount += parseFloat(val.amount);
      });
      allAmount = allAmount.toFixed(1);
      return allAmount;
    },
    dailyYield() {
      const amount = Number(this.allAmount);
      if (amount > 0) {
        return `${((100 * Number(this.allGains)) / amount).toFixed(2)}%`;
      }
      return `0%`;
    },
    allCostGains() {
      let allCostGains = 0;
      let allNum = 0;
      this.dataList.forEach((val) => {
        allCostGains += parseFloat(val.costGains);
        allNum += parseFloat(val.amount);
      });
      allCostGains = allCostGains.toFixed(2);
      let allCostGainsRate = ((allCostGains * 100) / (allNum - allCostGains)).toFixed(2);
      return [allCostGains, allCostGainsRate];
    },
    totalRevenue() {
      let allCost = 0;
      let allNum = 0;
      this.dataList.forEach((val) => {
        allCost += parseFloat(val.costGains);
        allNum += parseFloat(val.amount);
      });
      allCost = (allCost + this.historicalRevenueAmount).toFixed(2);
      let allCostRate = ((allCost * 100) / (allNum - allCost)).toFixed(2);
      return [allCost, allCostRate];
    },
    displayIndFundData() {
      if (this.indFundData.length) {
        return this.indFundData;
      }
      return [
        { f14: '上证指数', f2: '3,186.81', f4: '+18.74', f3: '0.59', isFallback: true },
        { f14: '深证成指', f2: '9,747.16', f4: '+60.21', f3: '0.62', isFallback: true },
        { f14: '创业板指', f2: '1,881.76', f4: '+13.27', f3: '0.71', isFallback: true },
        { f14: '沪深300', f2: '3,645.12', f4: '+21.45', f3: '0.59', isFallback: true },
      ];
    },
    containerClass() {
      let className = '';
      if (this.darkMode) {
        className += 'portfolio-shell--dark ';
      }
      if (this.changelogShadow) {
        className += 'portfolio-shell--changelog';
      } else if (this.rewardShadow) {
        className += 'portfolio-shell--tall';
      } else if (this.detailShadow) {
        className += 'portfolio-shell--detail';
      } else if (this.isEdit) {
        className += 'portfolio-shell--editing';
      }
      return className;
    },
    userSeciList() {
      return this.allSeciList.filter((val) => {
        return this.seciList.indexOf(val.value) == -1;
      });
    },
    tableHeight() {
      if (this.isEdit) {
        return 'table-more-height';
      }
      return '';
    },
    drag() {
      if (this.isEdit) {
        return 'is-draggable';
      } else {
        return '';
      }
    },
  },
  watch: {
    //编辑状态停止更新
    isEdit(val) {
      if (val) {
        clearInterval(this.myVar);
        clearInterval(this.myVar1);
      } else {
        this.checkInterval();
      }
    },
  },
  methods: {
    // 更新时间
    renderUpdateTime(el) {
      if (el.gztime) {
        if (el.hasReplace) {
          return el.gztime.substr(5, 5);
        } else {
          return el.gztime.substr(-5);
        }
      } else if (el.jzrq) {
        return el.jzrq;
      } else {
        return '--';
      }
    },
    formatNav(value) {
      const normalized = Number(value);
      return Number.isFinite(normalized) ? normalized.toFixed(4) : '--';
    },
    formatPercent(value) {
      const normalized = Number(value);
      if (!Number.isFinite(normalized)) {
        return '--';
      }
      return `${normalized > 0 ? '+' : ''}${normalized.toFixed(2)}%`;
    },
    formatSignedNumber(value) {
      const normalized = Number(value);
      if (!Number.isFinite(normalized)) {
        return '--';
      }
      const amount = normalized.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${normalized > 0 ? '+' : ''}${amount}`;
    },
    refresh() {
      this.getData();
      this.getIndFundData();
      this.isRefresh = true;
      // setTimeout(() => {
      //   this.isRefresh = false;
      // }, 1500);
    },
    getGuid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
    indDetail(val) {
      // this.sltIndCode = val.f13 + "." + val.f12;
      this.detailShadow = true;
      this.$refs.indDetail.init(val);
    },
    fundDetail(val) {
      this.sltFund = val;
      this.detailShadow = true;
      this.$refs.charts.init();
    },
    earningsDayShow() {
      const that = this;
      // this.earningsDayDialogShow = true
      console.log('日志', this.dataList);
      const newList = this.dataList.map((v) => {
        const showTime = this.renderUpdateTime(v);
        return { ...v, showTime };
      });
      const nnewList = newList.sort((a, b) => a.gztime < b.gztime);
      const timer = nnewList[0]?.showTime;
      var clipboard = new ClipboardJS('.copy', {
        text: function () {
          return `${timer} 基金收益：${that.allGains}(${that.dailyYield})`;
        },
        // target: function () {
        //   return document.querySelector('#copyImage')
        // }
      });
      clipboard.on('success', function (e) {
        that.$notify.closeAll();
        that.$notify.success({
          title: '复制文字成功',
        });
        console.info('Action:', e.action);
        console.info('Text:', e.text);
        console.info('Trigger:', e.trigger);
        e.clearSelection();
      });

      clipboard.on('error', function (e) {
        console.error('Action:', e.action);
        console.error('Trigger:', e.trigger);
      });
    },
    copyTotalRevenue() {
      const that = this;
      // this.earningsDayDialogShow = true
      console.log('日志', this.dataList);
     
      var clipboard = new ClipboardJS('.copyTotalRevenue', {
        text: function () {
          return `基金总收益：${parseFloat(that.totalRevenue[0]).toLocaleString('zh', { minimumFractionDigits: 1 })}${isNaN(that.totalRevenue[1]) ? '' : '(' + that.totalRevenue[1] + '%)'}`;
        },
        // target: function () {
        //   return document.querySelector('#copyImage')
        // }
      });
      clipboard.on('success', function (e) {
        that.$notify.closeAll();
        that.$notify.success({
          title: '复制文字成功',
        });
        console.info('Action:', e.action);
        console.info('Text:', e.text);
        console.info('Trigger:', e.trigger);
        e.clearSelection();
      });

      clipboard.on('error', function (e) {
        console.error('Action:', e.action);
        console.error('Trigger:', e.trigger);
      });
    },
    holdingIncomeShow() {
      this.holdingIncomeDialogShow = true;
    },
    closeCharts() {
      this.detailShadow = false;
    },
    market() {
      this.detailShadow = true;
      this.$refs.marketShadow.init();
    },
    checkInterval(isFirst) {
      clearInterval(this.myVar);
      clearInterval(this.myVar1);
      chrome.runtime.sendMessage({ type: 'DuringDate' }, (response) => {
        // debugger
        this.isDuringDate = response.farewell;
        if (this.isDuringDate) {
          if (!isFirst) {
            this.getIndFundData();
            this.getData();
          }
          this.myVar = setInterval(() => {
            this.getIndFundData();
          }, 5 * 1000);
          this.myVar1 = setInterval(() => {
            this.getData();
          }, 60 * 1000);
        } else {
          clearInterval(this.myVar);
          clearInterval(this.myVar1);
        }
      });
    },
    selectChange(val) {
      const result = this.searchOptions.filter((v) => {
        return v.value == val;
      });
      this.searchChangeOptions.push(...result);
      console.log('选中', this.searchChangeOptions);
      
      // this.searchOptions = [];
    },
    remoteMethod(query) {
      if (query !== '') {
        this.loading = true;
        // let url =
        //   // "https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?&m=9&key=" +
        //   '/fundsuggest/FundSearch/api/FundSearchAPI.ashx?&m=9&key=' + query + '&_=' + new Date().getTime();
        // this.$axios.get(url).then((res) => {
        //   this.searchOptions = res.Datas.map((val) => {
        //     return {
        //       value: val.CODE,
        //       label: val.NAME,
        //     };
        //   });
        //   this.loading = false;
        // });

           let url = "/searchapi/api/Info/Search";
        get(url, {
          appid: "el1902262",
          type: 14,
          token: "CCSDCZSDCXYMYZYYSYYXSMDDSMDHHDJT",
          and14: `MultiMatch/Name,Code,PinYin/${query}/true`,
          returnfields14:
            "Name,Code,PinYin,MarketType,JYS,MktNum,JYS4App,MktNum4App,ID,Classify,IsExactMatch,SecurityType,SecurityTypeName",
          pageIndex14: 1,
          pageSize14: 10,
          isAssociation14: "false1633883320220"
        }).then(res => {
          // console.log("11", res);
          if (!res.Data) return;
          this.searchOptions = res.Data.map(val => {
            return {
              market: val.MktNum,
              value: val.Code,
              label: val.Name,
              code: val.Code,
            };
          });
          this.loading = false;
        });
      } else {
        this.searchOptions = [];
      }
    },
    option() {
      this.$router.push('/option');
    },
    goStock() {
      this.$router.push('/stock');
    },
    goTotalRevenue() {
      this.$router.push('/totalRevenue');
    },
    reward() {
      this.rewardShadow = true;
      this.$refs.reward.init();
    },
    changelog() {
      // this.changelogShadow = true;
      // this.$refs.changelog.init();
    },
    closeChangelog() {
      this.changelogShadow = false;
      storage.set({
        version: this.localVersion,
      });
    },
    sortList(type) {
      for (const key in this.sortType) {
        if (this.sortType.hasOwnProperty(key)) {
          if (key != type) {
            this.sortType[key] = 'none';
          }
        }
      }
      this.sortType[type] = this.sortType[type] == 'desc' ? 'asc' : 'desc';
      this.dataList = this.dataList.sort(this.compare(type, this.sortType[type]));
    },
    compare(property, type) {
      return function (obj1, obj2) {
        var val1 = obj1[property];
        var val2 = obj2[property];
        if (type == 'asc') {
          return val1 - val2;
        } else {
          return val2 - val1;
        }
      };
    },

    changeDarkMode() {
      storage.set({
        darkMode: this.darkMode,
      });
    },
    saveSeci() {
      this.seciList.push(this.sltSeci);
      storage.set(
        {
          seciList: this.seciList,
        },
        () => {
          this.sltSeci = '';
          this.getIndFundData();
        }
      );
    },
    dltIndFund(ind) {
      this.seciList.splice(ind, 1);
      storage.set(
        {
          seciList: this.seciList,
        },
        () => {
          this.getIndFundData();
        }
      );
    },
    getIndFundData() {
      let seciListStr = this.seciList.join(',');
      let url = 'https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14&secids=' + seciListStr + '&_=' + new Date().getTime();
      this.$axios.get(url).then((res) => {
        this.indFundData = res.data.diff;
      });
    },
    getStockData(stockList) {
      console.log('股票列表', stockList);
      
      let seciListStr = stockList?.map(v => `${v.market}.${v.code}`).join(',');
      let url = 'https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14&secids=' + seciListStr + '&_=' + new Date().getTime();
      return this.$axios.get(url).then((res) => {
        return res.data.diff;
      });
    },
    getData() {
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Mobile') || process.env.VUE_APP_SERVER === 'tencent') {
        this.getData1();
      } else {
        this.getData2();
      }
    },
    getData1() {
      console.log('获取列表数据', this.fundListM);
      let fundlist = this.fundListM.map((val) => val.code).join(',');
      let url = '/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=50&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=' + this.userId + '&Fcodes=' + fundlist;
      this.$axios
        .get(url)
        .then((res) => {
          let data = res.Datas;
          // console.log(1, data);
          if (!data) {
            this.$message({
              message: '接口查询失败，切换到移动端再试试',
              type: 'error',
              center: true,
            });
            this.isRefresh = false;
            return Promise.reject(new Error('接口查询失败'));
          }
          let dataList = [];
          function calculateMoney(data) {
            console.log('有数据啊', data);
            
            return (data.num * data.gsz * data.gszzl / (100 + Number(data.gszzl))).toFixed(1);
          }
          data.forEach((val) => {
            let data = {
              fundcode: val.FCODE,
              name: val.SHORTNAME,
              jzrq: val.PDATE?.slice(-5),
              dwjz: val.NAV,
              gsz: val.NEWPRICE ? val.NEWPRICE : val.NAV,
              gszzl: val.CHANGERATIO ? val.CHANGERATIO : val.NAVCHGRT,
              gztime: val.GZTIME,
            };
            let slt = this.fundListM.filter((item) => item.code == data.fundcode);
            data.num = slt[0].num;
            data.cost = slt[0].cost;
            data.amount = this.calculateMoney(data);
            data.gains = calculateMoney(data);
            data.costGains = this.calculateCost(data);
            data.costGainsRate = this.calculateCostRate(data);

            dataList.push(data);
          });
          //总额
          let allAmount = dataList.reduce((total, cur) => {
            return total + parseFloat(cur.amount);
          }, 0);
          allAmount = allAmount.toFixed(1);
          // console.log('ming', allAmount);
          const dataList1 = dataList.map((v) => ({ ...v, proportion: ((v.amount / allAmount) * 100).toFixed(2) }));
          console.log(5, this.dataList);
          // this.dataList = dataList1;
          return dataList1;
        })
        .then((dataList) => {
          this.getEstimateRevenue(dataList);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    /**
     * 名词解释
     * gsz 估算净值
     * NAV 实际净值
     * gszzl 估算涨跌幅
     * NAVCHGRT 实际涨跌幅
     * dwjz 单位净值
     * gztime 更新时间
     * jzrq 净值更新时间
     * PDATE 净值更新时间
     * HQDATE 无用数据
     *  
     * jsonpgz({
        "fundcode": "519674",
        "name": "银河创新成长混合A",
        "jzrq": "2024-10-08",
        "dwjz": "5.5690",
        "gsz": "5.6764",
        "gszzl": "1.93",
        "gztime": "2024-10-09 10:02"
      });

      {
        "FCODE": "519674",
        "SHORTNAME": "银河创新成长混合A",
        "PDATE": "2024-10-08",
        "NAV": "5.5690",
        "ACCNAV": "5.5690",
        "NAVCHGRT": "15.32",
        "GSZ": null,
        "GSZZL": null,
        "GZTIME": null,
        "NEWPRICE": null,
        "CHANGERATIO": null,
        "ZJL": null,
        "HQDATE": null,
        "ISHAVEREDPACKET": false
        }
     * 
     **/
    // 获取实时的估算收益
    getEstimateRevenue(dataList) {
      console.log('真不真', dataList);

      // console.log('获取列表数据', this.fundListM);
      let fundlist = this.fundListM.map((v) => {
        let url = `/fundRabtTop/js/${v.code}.js?timer=${Date.now()}`;
        return this.$axios.get(url);
      });
      Promise.all(fundlist)
        .then((data) => {
          console.log(1, data, dataList, this.fundListM);
          this.isRefresh = false;
          data.forEach((v, idx) => {
            const valStr = v.replace('jsonpgz(', '').replace(');', '');
            if (!valStr) {
              dataList[idx] = {
                ...dataList[idx],
                hasReplace: true,
              };
              return;
            }
            let data = JSON.parse(valStr);
            // 判断是否 获取真正的净值
            if (dataList[idx]?.jzrq !== data.gztime?.slice(5, 10)) {
              dataList[idx] = {
                ...dataList[idx],
                gszzl: data.gszzl,
                gsz: data.gsz,
                gztime: data.gztime,
                gains: this.calculate({ ...dataList[idx], gsz: data.gsz }),
              };
            } else {
              dataList[idx] = {
                ...dataList[idx],
                gztime: data.gztime,
                gains: this.calculate(dataList[idx], true),
                hasReplace: true,
              };
            }
          });

          this.dataList = [...dataList];
        })
        .catch((error) => {
          this.isRefresh = false;
          console.log(error);
        });
    },
    getData2() {
      // console.log('获取列表数据', this.fundListM);
      let fundlist = this.fundListM.map((v) => {
        let url = `/fundRabtTop/js/${v.code}.js?timer=${Date.now()}`;
        return this.$axios.get(url);
      });
      Promise.all(fundlist)
        .then(async (data) => {
          console.log(1, data);
          this.isRefresh = false;
          let dataList = [];
          let failedCodes = []; // 存储查询失败的基金代码

          data.forEach((v, idx) => {
            const valStr = v.replace('jsonpgz(', '').replace(');', '');
            if (!valStr) {
              console.log('下标', idx, this.fundListM[idx]);
              failedCodes.push({ code: this.fundListM[idx].code, market: this.fundListM[idx].market });
              return;
            }
            let data = JSON.parse(valStr);
            let slt = this.fundListM.filter((item) => item.code == data.fundcode);
            data.num = slt[0].num;
            data.cost = slt[0].cost;
            data.amount = this.calculateMoney(data);
            data.gains = this.calculate(data, data.hasReplace);
            data.costGains = this.calculateCost(data);
            data.costGainsRate = this.calculateCostRate(data);

            dataList.push(data);
          });

          // 如果有查询失败的基金，调用股票接口重新查询
          if (failedCodes.length > 0) {
            try {
              const stockData = await this.getStockData(failedCodes);
              stockData.forEach((stockItem) => {
                // 将股票代码转换为基金代码格式进行匹配
                const fundCode = stockItem.f12 || stockItem.f13;
                const slt = this.fundListM.filter((item) => item.code == fundCode);
                if (slt.length > 0) {
                  const data = {
                    fundcode: fundCode,
                    name: stockItem.f14,
                    jzrq: '',
                    dwjz: stockItem.f2 - stockItem.f4,
                    gsz: stockItem.f2,
                    gszzl: stockItem.f3,
                    gztime: '',
                  };
                  data.num = slt[0].num;
                  data.cost = slt[0].cost;
                  data.amount = this.calculateMoney(data);
                  data.gains = this.calculate(data, data.hasReplace);
                  data.costGains = this.calculateCost(data);
                  data.costGainsRate = this.calculateCostRate(data);
                  dataList.push(data);
                }
              });
            } catch (error) {
              console.error('获取失败基金数据失败:', error);
            }
          }

          //总额
          let allAmount = dataList.reduce((total, cur) => {
            return total + parseFloat(cur.amount);
          }, 0);
          allAmount = allAmount.toFixed(1);
          // console.log('ming', allAmount);
          this.dataList = dataList.map((v) => ({ ...v, proportion: ((v.amount / allAmount) * 100).toFixed(2) }));
          // console.log(5, this.dataList);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    changeNum(item) {
      debounce(() => {
        for (let fund of this.fundListM) {
          if (fund.code == item.fundcode) {
            fund.num = item.num;
          }
        }
        storage.set(
          {
            fundListM: this.fundListM,
          },
          () => {
            item.amount = this.calculateMoney(item);
            item.gains = this.calculate(item, item.hasReplace);
            item.costGains = this.calculateCost(item);
            chrome.runtime.sendMessage({ type: 'refreshOption' });
          }
        );
      });
    },
    changeCost(item) {
      debounce(() => {
        for (let fund of this.fundListM) {
          if (fund.code == item.fundcode) {
            fund.cost = item.cost;
          }
        }
        storage.set(
          {
            fundListM: this.fundListM,
          },
          () => {
            item.costGains = this.calculateCost(item);
            item.costGainsRate = this.calculateCostRate(item);
          }
        );
      });
    },
    calculateMoney(val) {
      let sum = (val.dwjz * val.num).toFixed(1);
      return sum;
    },
    calculate(val, hasReplace) {
      var sum = 0;
      let num = val.num ? val.num : 0;
      if (hasReplace) {
        sum = ((val.dwjz - val.dwjz / (1 + val.gszzl * 0.01)) * num).toFixed(1);
      } else {
        if (val.gsz) {
          sum = ((val.gsz - val.dwjz) * num).toFixed(1);
        }
      }
      return sum;
    },
    calculateCost(val) {
      if (val.cost) {
        let sum = ((val.dwjz - val.cost) * val.num).toFixed(1);
        return sum;
      } else {
        return 0;
      }
    },
    calculateCostRate(val) {
      if (val.cost && val.cost != 0) {
        let sum = (((val.dwjz - val.cost) / val.cost) * 100).toFixed(2);
        return sum;
      } else {
        return 0;
      }
    },
    save() {
      // console.log('searchOptions搜索下拉框', this.searchOptions);

      const result = this.searchChangeOptions.filter((v) => {
        return this.fundcode.includes(v.value);
      }).map(v => ({ ...v, num: 0 }));

      console.log('有结果', result);
      
      this.fundListM.push(...result);      
      // this.fundcode.forEach((code) => {
      //   let val = {
      //     code: code,
      //     num: 0,
      //   };
      //   this.fundListM.push(val);
      // });

      storage.set(
        {
          fundListM: this.fundListM,
        },
        () => {
          this.fundcode = [];
          this.getData();
          chrome.runtime.sendMessage({ type: 'refreshOption' });
        }
      );
    },
    dlt(id) {
      this.fundListM = this.fundListM.filter(function (ele) {
        return ele.code != id;
      });

      if (id == this.RealtimeFundcode) {
        storage.set(
          {
            RealtimeFundcode: null,
          },
          () => {
            this.RealtimeFundcode = null;
          }
        );
      }
      storage.set(
        {
          fundListM: this.fundListM,
        },
        () => {
          this.dataList = this.dataList.filter(function (ele) {
            return ele.fundcode != id;
          });
        }
      );
    },
    handleDragStart(e, item) {
      this.dragging = item;
    },
    handleDragOver(e) {
      e.dataTransfer.dropEffect = 'move';
    },
    handleDragEnd(e, item) {
      this.dragging = null;
      if (item.fundcode) {
        storage.set(
          {
            fundListM: this.fundListM,
          },
          () => {}
        );
      } else if (item.f12) {
        storage.set(
          {
            seciList: this.seciList,
          },
          () => {}
        );
      }
    },
    handleDragEnter(e, item) {
      // 基金排序
      if (this.dragging && this.dragging.fundcode && item.fundcode) {
        e.dataTransfer.effectAllowed = 'move';
        if (item.fundcode === this.dragging.fundcode) {
          return;
        }
        const newItems = [...this.fundListM];
        const src = newItems.findIndex((n) => n.code == this.dragging.fundcode);
        const dst = newItems.findIndex((n) => n.code == item.fundcode);
        // // 替换
        newItems.splice(dst, 0, ...newItems.splice(src, 1));

        this.fundListM = newItems;

        //数据列表也同步更新
        const newDataItems = [...this.dataList];
        const dataSrc = newDataItems.findIndex((n) => n.fundcode == this.dragging.fundcode);
        const dataDst = newDataItems.findIndex((n) => n.fundcode == item.fundcode);
        newDataItems.splice(dataDst, 0, ...newDataItems.splice(dataSrc, 1));
        this.dataList = newDataItems;
      } else if (this.dragging && this.dragging.f12 && item.f12) {
        e.dataTransfer.effectAllowed = 'move';
        if (item.f12 === this.dragging.f12) {
          return;
        }
        const newIndItems = [...this.seciList];
        const indSrc = newIndItems.findIndex((n) => n.split('.')[1] == this.dragging.f12);
        const indDst = newIndItems.findIndex((n) => n.split('.')[1] == item.f12);
        newIndItems.splice(indDst, 0, ...newIndItems.splice(indSrc, 1));
        this.seciList = newIndItems;

        const newIndDataItems = [...this.indFundData];
        const indDataSrc = newIndDataItems.findIndex((n) => n.f12 == this.dragging.f12);
        const indDataDst = newIndDataItems.findIndex((n) => n.f12 == item.f12);
        newIndDataItems.splice(indDataDst, 0, ...newIndDataItems.splice(indDataSrc, 1));
        this.indFundData = newIndDataItems;
      }
    },
  },
  destroyed() {
    clearInterval(this.myVar);
    clearInterval(this.myVar1);
  },
};
</script>

<style lang="less" scoped>
.option_fund_name {
  float: left;
  max-width: 175px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.container {
  min-width: 300px;
  max-width: 700px;
  margin: 0 auto;
  min-height: 150px;
  overflow-y: auto;
  padding: 10px 7px;
  box-sizing: border-box;
  font-size: 12px;
  font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang SC', 'Hiragino Sans GB', 'Heiti SC', 'Microsoft YaHei', 'WenQuanYi Micro Hei', sans-serif;
}

.refresh {
  // position: absolute;
  display: inline-block;
  vertical-align: middle;
  margin-left: 10px;
  cursor: pointer;

  i {
    color: #409eff;
    font-size: 18px;
    font-weight: bold;
  }
}

.refresh.isRefresh {
  animation: changDeg 1.5s linear 0s infinite;
}

@keyframes changDeg {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(-360deg);
  }
}

.detail-container {
  min-height: 450px;
  min-width: 300px;
}

.more-height {
  height: 450px;
}

.more-width {
  width: 785px;
}

.changelog-container {
  min-height: 550px;
  min-width: 300px;
}

.table-row.table-more-height {
  min-height: 160px;
  max-height: calc(100vh - 330px);
}

.table-drag {
  cursor: move;
}

.num-all-width {
  min-width: 520px;
}

.num-width-1 {
  min-width: 420px;
}

.num-width-2 {
  min-width: 480px;
}

.num-width-3 {
  min-width: 540px;
}

.num-width-4 {
  min-width: 610px;
}

.num-width-5 {
  // min-width: 680px;
  min-width: 100%;
}

.table-row {
  max-height: calc(100vh - 165px);
  overflow-y: auto;
}

@media screen and (max-width: 500px) {
  .table-row {
    height: calc(100vh - 165px);
  }
}

.hasReplace {
  background-color: #409eff;
}

.hasReplace-tip {
  display: inline-block;
  padding: 0 2px;
  margin-left: 2px;
  border-radius: 2px;
  line-height: 12px;
  color: #409eff;
  border: 1px solid #409eff;
}

table {
  margin: 10px auto 0;
  width: 100%;
  border-collapse: collapse;
  text-align: right;
}

.align-left {
  text-align: left;
}

.center {
  text-align: center;
}

table th {
  padding: 8px 6px;
}

table td {
  padding: 6px 6px 5px;
}

.up {
  color: #f56c6c;
  font-weight: bold;
}

.down {
  color: #4eb61b;
  font-weight: bold;
}

tbody tr:hover {
  background: #f5fafe;
}

.btn {
  display: inline-block;
  line-height: 1;
  cursor: pointer;
  background: #fff;
  padding: 5px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #000000;
  margin: 0 3px 3px;
  outline: none;
  border: 1px solid #dcdfe6;
}

.btn.edit {
  padding: 2px 5px;
  margin: 0;
}

.btn.red {
  color: #f56c6c;
}

.btn.num {
  width: 75px;
}

.btn-up {
  color: #f56c6c;
  border-color: #f56c6c;
}

.btn-down {
  color: #4eb61b;
  border-color: #4eb61b;
}

.slt {
  color: #fff;
  background-color: #67c23a;
  border-color: #67c23a;
}

.input-row {
  text-align: center;
  margin-top: 10px;
}

.tab-col {
  flex: 1;
  margin: 0 4px;
  text-align: center;

  h5 {
    margin: 4px 0;
    font-size: 12px;

    .dltBtn {
      margin-left: 3px;
    }
  }

  p {
    margin: 4px 0;
  }

  .addSeci {
    margin: 10px auto;
    width: 40px;
    height: 40px;
    cursor: pointer;
    line-height: 40px;
    border: 1px solid #dcdfe6;
    border-radius: 50%;
  }
}

.indFund {
  cursor: pointer;
}

.tab-row:after,
.tab-row:before {
  display: table;
  content: '';
}

.tab-row:after {
  clear: both;
}

.tab-row {
  padding: 6px 0;
  display: flex;
  margin: 0 -3px;
}

.primary {
  color: #409eff;
  border-color: #409eff;
}

.tips {
  font-size: 12px;
  margin: 0;
  color: #aaaaaa;
  line-height: 1.4;
  padding: 5px 15px;
}

.fundName {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

.fundName-noclick {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fundName:hover {
  color: #409eff;
}

.down-arrow {
  display: inline-block;
  position: relative;
  width: 8px;
  height: 0;
}

.down-arrow::after {
  display: inline-block;
  content: ' ';
  height: 6px;
  width: 6px;
  border-width: 0 1px 1px 0;
  border-color: #666;
  border-style: solid;
  transform-origin: center;
  transition: all 0.3s;
  position: absolute;
  right: 0;
}

.down-arrow.desc::after {
  transform-origin: center;
  transform: rotate(45deg);
  top: -10px;
}

.down-arrow.asc::after {
  transform-origin: center;
  transform: rotate(-135deg);
  top: -6px;
}

.down-arrow.none {
  display: none;
}

.pointer {
  cursor: pointer;
  user-select: none;
}

//暗黑主题
.container.darkMode {
  color: rgba(255, 255, 255, 0.6);
  background-color: #121212;

  .refresh {
    color: rgba(64, 158, 255, 0.6);
  }

  .btn {
    background-color: rgba(255, 255, 255, 0.16);
    color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.6);
  }

  .primary {
    border: 1px solid rgba(64, 158, 255, 0.6);
    background-color: rgba(64, 158, 255, 0.6);
  }

  /deep/ .el-input__inner {
    background-color: rgba(255, 255, 255, 0.16);
    color: rgba(255, 255, 255, 0.6);
  }

  /deep/ .el-select__input {
    color: rgba(255, 255, 255, 0.6);
  }

  /deep/ tbody tr:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }

  .slt {
    border: 1px solid rgba(103, 194, 58, 0.6);
    background-color: rgba(103, 194, 58, 0.6);
  }

  .btn.red {
    border: 1px solid rgba(245, 108, 108, 0.6);
    background-color: rgba(245, 108, 108, 0.6);
  }

  .btn-up {
    border: 1px solid rgba(245, 108, 108, 0.6);
    background-color: rgba(245, 108, 108, 0.6);
  }

  .btn-down {
    border: 1px solid rgba(78, 182, 27, 0.6);
    background-color: rgba(78, 182, 27, 0.6);
  }

  .tab-col {
    background-color: rgba(255, 255, 255, 0.09);
    border-radius: 5px;
  }

  table {
    background-color: rgba(255, 255, 255, 0.12);
    border-radius: 5px;
  }

  ::placeholder {
    color: rgba(255, 255, 255, 0.38);
  }

  /deep/ .el-select .el-input.is-focus .el-input__inner {
    border-color: rgba(64, 158, 255, 0.6);
  }

  /deep/ .el-select .el-tag {
    background-color: rgba(255, 255, 255, 0.14);
    color: rgba(255, 255, 255, 0.6);
  }

  /deep/ .el-select-dropdown {
    background-color: #383838;
    border: 1px solid rgba(255, 255, 255, 0.38);

    .popper__arrow::after {
      border-bottom-color: #383838;
    }

    .el-scrollbar {
      background-color: rgba(255, 255, 255, 0.16);
    }

    .el-select-dropdown__item {
      color: rgba(255, 255, 255, 0.6);
    }

    .el-select-dropdown__item.hover,
    .el-select-dropdown__item:hover {
      background-color: rgba(255, 255, 255, 0.08);
    }

    .el-select-dropdown__item.selected {
      color: rgba(64, 158, 255, 0.6);
      background-color: rgba(255, 255, 255, 0.08);
    }

    .el-select-dropdown__item.selected::after {
      color: rgba(64, 158, 255, 0.6);
    }
  }

  /deep/ .el-switch__label.is-active {
    color: rgba(64, 158, 255, 0.87);
  }

  /deep/ .el-switch__label {
    color: rgba(255, 255, 255, 0.6);
  }

  /deep/ .hasReplace-tip {
    color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(64, 158, 255, 0.6);
    background-color: rgba(64, 158, 255, 0.6);
  }
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 3px 14px;

  h2 {
    margin: 0;
    color: #101828;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
  }

  p {
    margin-top: 6px;
    color: #667085;
    font-size: 12px;
    letter-spacing: 0;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.icon-btn {
  min-width: 42px;
  padding: 2px 4px;
  border: 0;
  background: transparent;
  color: #344054;
  cursor: pointer;
  text-align: center;

  i {
    display: block;
    color: #1d2939;
    font-size: 22px;
    font-weight: 600;
    line-height: 24px;
  }

  span {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    line-height: 16px;
  }

  .isRefresh {
    animation: changDeg 1.5s linear 0s infinite;
  }
}

.main-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.container {
  min-height: 100vh;
  width: 100%;
  max-width: 430px;
  padding: 18px 14px 82px;
  background: #f6f8fb;
}

.market-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid #e4e9f2;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(16, 24, 40, 0.05);
}

.market-strip .tab-col {
  min-width: 0;
  margin: 0;
  padding: 12px 10px 11px;
  border-right: 1px solid #edf1f7;
  background: #fff;

  &:last-child {
    border-right: 0;
  }

  h5 {
    margin: 0 0 8px;
    color: #344054;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
  }

  p {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    line-height: 21px;
  }

  .market-change {
    margin-top: 6px;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
  }
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 10px;
}

.summary-btn.btn {
  width: 100%;
  min-height: 54px;
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 22px rgba(16, 24, 40, 0.04);
  font-size: 14px;
  font-weight: 700;
  text-align: left;
}

.summary-btn.neutral {
  color: #101828;
  border-color: #e4e9f2;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;

  h3 {
    display: inline-block;
    margin-right: 8px;
    color: #101828;
    font-size: 20px;
    font-weight: 700;
    line-height: 28px;
  }

  span {
    color: #667085;
    font-size: 12px;
  }
}

.old-summary-row {
  display: none;
}

.table-row {
  border: 1px solid #e4e9f2;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(16, 24, 40, 0.05);
}

.fund-list-card {
  overflow: hidden;
  border: 1px solid #e4e9f2;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(16, 24, 40, 0.05);
}

.fund-list-card.table-more-height {
  min-height: 160px;
  max-height: calc(100vh - 330px);
  overflow: auto;
}

.fund-list-header,
.fund-list-item {
  display: grid;
  grid-template-columns: 34% 13% 14% 17% 17% 5%;
  align-items: center;
}

.fund-list-header.is-editing,
.fund-list-item.is-editing {
  grid-template-columns: minmax(160px, 1fr) 96px 108px 54px;
}

.fund-list-header {
  min-height: 44px;
  border-bottom: 1px solid #edf1f7;
  background: #fbfcfe;
  color: #667085;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.fund-list-body {
  background: #fff;
}

.fund-list-item {
  min-height: 92px;
  border-bottom: 1px solid #edf1f7;
  color: #1d2939;
  font-size: 13px;
}

.fund-list-item:last-child {
  border-bottom: 0;
}

.fund-list-item:hover {
  background: #f8fbff;
}

.fund-list-cell {
  min-width: 0;
  box-sizing: border-box;
  padding: 0 10px;
  text-align: right;
}

.fund-name-head,
.fund-identity {
  text-align: left;
}

.fund-identity {
  cursor: pointer;
}

.fund-list-item.is-editing .fund-identity {
  cursor: move;
}

.sortable-head,
.detail-action {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.sortable-head {
  text-align: right;
}

.nav-value {
  color: #101828;
  font-weight: 500;
  text-align: right;
}

.metric-value {
  text-align: right;
}

.detail-head,
.detail-action {
  padding-right: 10px;
}

.detail-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: #8a95a5;
}

.detail-action i {
  color: inherit;
  font-size: 18px;
}

.edit-head,
.edit-cell {
  text-align: center;
}

.edit-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-cell .num {
  width: 86px;
  min-width: 0;
}

.edit-remove {
  justify-content: flex-end;
}

.edit-remove .edit {
  min-width: 32px;
  padding: 7px 9px;
}

table {
  margin-top: 0;
  table-layout: auto;
}

table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 8px;
  background: #fbfcfe;
  color: #667085;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

table td {
  padding: 12px 8px 11px;
  border-top: 1px solid #edf1f7;
  color: #1d2939;
  font-size: 13px;
}

tbody tr:hover {
  background: #f8fbff;
}

.fundName {
  max-width: 180px;
  color: #101828;
  font-weight: 700;
}

.fundName-noclick {
  max-width: 200px;
  color: #101828;
  font-weight: 700;
}

.btn {
  border-color: #d8e0eb;
  border-radius: 8px;
  color: #344054;
  transition: border-color 0.2s, color 0.2s, background-color 0.2s, box-shadow 0.2s;
}

.btn:hover {
  border-color: #98a2b3;
  box-shadow: 0 3px 10px rgba(16, 24, 40, 0.08);
}

.btn-up {
  background: #fff7f7;
  color: #e32323;
  border-color: #ffd7d7;
}

.btn-down {
  background: #f4fbf4;
  color: #159127;
  border-color: #cfeecf;
}

.up {
  color: #e32323;
}

.down {
  color: #159127;
}

.input-row {
  margin-top: 12px;
}

.container > .input-row {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-wrap: nowrap;
  gap: 0;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  padding: 8px 12px 10px;
  border-top: 1px solid #e4e9f2;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -12px 28px rgba(16, 24, 40, 0.08);
  backdrop-filter: blur(12px);
}

.container > .input-row .refresh {
  display: none;
}

.container > .input-row > .btn {
  min-width: 74px;
  margin: 0;
  padding: 9px 10px;
  border-color: transparent;
  background: transparent;
  box-shadow: none;
  color: #344054;
  font-size: 13px;
  font-weight: 600;
}

.container > .input-row > .btn:nth-child(3) {
  color: #1d5cff;
  border-color: #c9d7ff;
  background: #f5f8ff;
}

.container > .input-row {
  position: static;
  z-index: auto;
  width: auto;
  max-width: none;
  margin-top: 12px;
  padding: 0;
  border-top: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.container > .input-row:nth-of-type(4) {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-wrap: nowrap;
  gap: 0;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  padding: 8px 12px 10px;
  border-top: 1px solid #e4e9f2;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -12px 28px rgba(16, 24, 40, 0.08);
  backdrop-filter: blur(12px);
}

.container > .input-row:nth-of-type(4) > .btn {
  min-width: 74px;
  margin: 0;
  padding: 9px 10px;
  border-color: transparent;
  background: transparent;
  box-shadow: none;
  color: #344054;
  font-size: 13px;
  font-weight: 600;
}

.tips {
  color: #98a2b3;
}

.container.darkMode {
  background: #111827;

  .page-header h2 {
    color: rgba(255, 255, 255, 0.92);
  }

  .page-header p,
  .section-title span {
    color: rgba(255, 255, 255, 0.5);
  }

  .icon-btn {
    color: rgba(255, 255, 255, 0.68);

    i {
      color: rgba(255, 255, 255, 0.86);
    }
  }

  .market-strip,
  .fund-list-card,
  .table-row,
  .summary-btn.btn {
    border-color: rgba(255, 255, 255, 0.1);
    background: #1f2937;
    box-shadow: none;
  }

  .market-strip .tab-col {
    border-color: rgba(255, 255, 255, 0.08);
    background: #1f2937;

    h5 {
      color: rgba(255, 255, 255, 0.68);
    }
  }

  .section-title h3,
  .fundName,
  .fundName-noclick,
  .fund-list-item,
  .nav-value,
  table td {
    color: rgba(255, 255, 255, 0.86);
  }

  .fund-list-header,
  table th {
    background: #172033;
    color: rgba(255, 255, 255, 0.5);
  }

  .fund-list-body {
    background: #1f2937;
  }

  .fund-list-item,
  table td {
    border-top-color: rgba(255, 255, 255, 0.08);
  }

  .fund-list-item:hover,
  tbody tr:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  > .input-row > .btn {
    background: rgba(255, 255, 255, 0.08);
  }
}

@media screen and (max-width: 500px) {
  .container {
    padding: 16px 10px 76px;
  }

  .page-header {
    padding-bottom: 12px;

    h2 {
      font-size: 22px;
    }
  }

  .market-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .market-strip .tab-col {
    border-bottom: 1px solid #edf1f7;

    &:nth-child(2n) {
      border-right: 0;
    }

    &:nth-last-child(-n + 2) {
      border-bottom: 0;
    }
  }

  .summary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-btn.btn {
    min-height: 50px;
    font-size: 12px;
  }

  .section-title h3 {
    font-size: 18px;
  }

  table th,
  table td {
    padding-left: 7px;
    padding-right: 7px;
  }

  .fundName {
    max-width: 120px;
  }
}

@media screen and (max-width: 500px) {
  .market-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .market-strip .tab-col {
    border-right: 1px solid #edf1f7;
    border-bottom: 0;
    padding: 10px 8px;

    &:nth-child(2n) {
      border-right: 1px solid #edf1f7;
    }

    &:last-child {
      border-right: 0;
    }

    h5 {
      font-size: 11px;
    }

    p {
      font-size: 15px;
      line-height: 19px;
    }

    .market-change {
      font-size: 11px;
    }
  }
}

.page-header {
  padding: 10px 14px 18px;

  h2 {
    font-size: 29px;
    font-weight: 800;
    letter-spacing: 0;
  }
}

.header-actions {
  gap: 18px;
}

.icon-btn {
  min-width: 38px;

  i {
    font-size: 26px;
    line-height: 28px;
  }

  span {
    color: #1d2939;
    font-size: 12px;
    font-weight: 500;
  }
}

.container {
  max-width: 390px;
  padding: 18px 10px 86px;
}

.main-row {
  gap: 12px;
}

.market-strip,
.fund-list-card,
.table-row {
  border-radius: 7px;
}

.market-strip .tab-col {
  padding: 13px 11px 14px;

  h5 {
    margin-bottom: 8px;
    color: #1d2939;
    font-size: 12px;
    font-weight: 700;
  }

  p {
    font-size: 17px;
    font-weight: 800;
  }

  .market-change {
    margin-top: 7px;
    font-size: 11px;
    white-space: nowrap;
  }
}

.summary-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  overflow: hidden;
  border: 1px solid #e4e9f2;
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(16, 24, 40, 0.05);
}

.summary-btn.btn {
  min-height: 68px;
  padding: 12px 10px;
  border: 0;
  border-right: 1px solid #edf1f7;
  border-radius: 0;
  box-shadow: none;
  font-size: 12px;
  line-height: 1.35;
  text-align: left;

  &:last-child {
    border-right: 0;
  }
}

.section-title {
  margin-top: 4px;
  padding: 0 12px;

  h3 {
    font-size: 22px;
    font-weight: 800;
  }

  span {
    font-size: 12px;
  }
}

.fund-list-card,
.table-row {
  height: auto !important;
  max-height: none;
  overflow-x: auto;
  overflow-y: visible;
}

.fund-list-header,
.fund-list-item {
  grid-template-columns: 34% 13% 14% 17% 17% 5%;
}

.fund-list-header.is-editing,
.fund-list-item.is-editing {
  grid-template-columns: minmax(145px, 1fr) 82px 88px 42px;
}

.fund-list-cell {
  padding: 0 9px;
}

table {
  min-width: 100%;
}

table th {
  padding: 13px 10px;
  font-size: 12px;
}

table td {
  padding: 15px 10px;
  font-size: 13px;
}

.fundName {
  max-width: 148px;
  font-size: 14px;
}

.bottom-toolbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  max-width: 390px;
  margin: 0 auto;
  padding: 7px 10px 9px;
  border-top: 1px solid #e4e9f2;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -12px 28px rgba(16, 24, 40, 0.08);
}

.toolbar-btn {
  min-width: 52px;
  padding: 2px 4px;
  border: 0;
  background: transparent;
  color: #1d2939;
  cursor: pointer;
  text-align: center;

  i {
    display: block;
    font-size: 24px;
    line-height: 28px;
  }

  span {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
  }
}

.toolbar-btn.is-active {
  color: #1d5cff;
}

.toolbar-main {
  width: 58px;
  height: 58px;
  margin-top: -26px;
  border-radius: 50%;
  background: #1d5cff;
  color: #fff;
  box-shadow: 0 10px 24px rgba(29, 92, 255, 0.34);

  i {
    font-size: 30px;
    line-height: 38px;
  }

  span {
    margin-top: -3px;
    color: #1d2939;
    transform: translateY(18px);
  }
}

.container.darkMode {
  .bottom-toolbar {
    border-top-color: rgba(255, 255, 255, 0.1);
    background: rgba(17, 24, 39, 0.98);
  }

  .toolbar-btn {
    color: rgba(255, 255, 255, 0.72);
  }

  .toolbar-btn.is-active {
    color: #76a7ff;
  }

  .toolbar-main {
    color: #fff;

    span {
      color: rgba(255, 255, 255, 0.78);
    }
  }
}

.page-header {
  padding: 16px 12px 16px;

  > div:first-child {
    flex: 1;
    min-width: 0;
  }

  h2 {
    overflow: hidden;
    font-size: 25px;
    line-height: 1.18;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.market-strip {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
}

.market-strip .tab-col {
  flex: none !important;
  width: auto !important;
  padding: 12px 8px 13px;
  text-align: left;

  h5 {
    margin-bottom: 8px;
    overflow: hidden;
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  p {
    overflow: hidden;
    font-size: 15px;
    line-height: 19px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .market-change {
    font-size: 11px;
  }
}

.summary-btn {
  display: flex;
  min-width: 0;
  min-height: 76px;
  padding: 13px 9px 11px;
  border: 0;
  border-right: 1px solid #edf1f7;
  background: #fff;
  cursor: pointer;
  text-align: left;

  &:last-child {
    border-right: 0;
  }

  .summary-label {
    overflow: hidden;
    color: #344054;
    font-size: 11px;
    font-weight: 600;
    line-height: 15px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  strong {
    display: block;
    margin-top: 8px;
    overflow: hidden;
    font-size: 17px;
    font-weight: 800;
    line-height: 21px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  em {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    font-size: 11px;
    line-height: 14px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.summary-btn.btn-up,
.summary-btn.btn-down {
  border-top: 0;
  border-bottom: 0;
  border-left: 0;
}

.summary-btn.neutral {
  strong {
    color: #101828;
  }
}

.container.darkMode {
  .summary-btn {
    border-right-color: rgba(255, 255, 255, 0.08);
    background: #1f2937;

    .summary-label {
      color: rgba(255, 255, 255, 0.68);
    }
  }
}

.page-header {
  padding: 16px 18px 14px;
  gap: 14px;

  h2 {
    overflow: visible;
    color: #030712;
    font-size: 24px;
    font-weight: 800;
    line-height: 1.18;
    white-space: nowrap;
    text-overflow: clip;
  }
}

.header-actions {
  gap: 16px;
}

.icon-btn {
  min-width: 38px;

  i {
    font-size: 28px;
    line-height: 30px;
  }
}

.market-strip.tab-row {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 0;
  padding: 0;
}

.market-strip.tab-row .tab-col {
  flex: none !important;
  min-width: 0;
  width: auto !important;
  padding: 13px 16px 14px;
  text-align: left;

  h5,
  p {
    overflow: visible;
    white-space: nowrap;
    text-overflow: clip;
  }

  h5 {
    margin-bottom: 8px;
    color: #111827;
    font-size: 14px;
    font-weight: 700;
  }

  p {
    color: #ef1f1f;
    font-size: 22px;
    font-weight: 800;
    line-height: 27px;
  }

  .market-change {
    margin-top: 7px;
    color: #ef1f1f;
    font-size: 13px;
    font-weight: 500;
  }
}

.sparkline {
  display: block;
  width: 92%;
  height: 18px;
  margin-top: 11px;
  background: url("data:image/svg+xml,%3Csvg width='90' height='22' viewBox='0 0 90 22' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 16 L8 9 L14 13 L20 7 L27 11 L34 6 L43 5 L51 10 L59 12 L67 9 L75 8 L82 4 L89 6' fill='none' stroke='%23ff3b3b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M1 16 L8 9 L14 13 L20 7 L27 11 L34 6 L43 5 L51 10 L59 12 L67 9 L75 8 L82 4 L89 6 L89 22 L1 22 Z' fill='%23ff3b3b' fill-opacity='.08'/%3E%3C/svg%3E") center / 100% 100% no-repeat;
  border-radius: 2px;
}

.summary-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
}

.summary-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  min-width: 0;
  min-height: 74px;
  margin: 0;
  padding: 14px 14px 12px;

  .summary-label {
    color: #111827;
    font-size: 14px;
    font-weight: 600;
  }

  strong {
    margin-top: 10px;
    color: #ef1f1f;
    font-size: 22px;
    font-weight: 800;
    line-height: 27px;
  }

  em {
    margin-top: 5px;
    color: #ef1f1f;
    font-style: normal;
    font-size: 14px;
  }
}

.summary-btn.neutral strong {
  color: #030712;
}

.section-title {
  align-items: center;
  margin-top: 4px;
  padding: 0 14px;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  h3 {
    margin: 0;
    color: #030712;
    font-size: 24px;
    font-weight: 800;
    line-height: 32px;

    span {
      color: inherit;
      font-size: inherit;
    }
  }
}

.update-chip,
.hold-tag {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border-radius: 4px;
  background: #eaf1ff;
  color: #2563ff;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  white-space: nowrap;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  color: #111827;
  font-size: 14px;
  white-space: nowrap;
}

.text-action {
  border: 0;
  background: transparent;
  color: #2563ff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.table-row {
  overflow: hidden;
}

table {
  table-layout: fixed;
}

table th {
  padding: 13px 12px;
  color: #697586;
  font-size: 14px;
  font-weight: 600;
}

table td {
  padding: 15px 12px;
  font-size: 15px;
  line-height: 1.35;
}

.fund-col {
  width: 33%;
}

.nav-col {
  width: 14%;
}

.rate-col {
  width: 15%;
}

.gain-col {
  width: 17%;
}

.detail-col {
  width: 6%;
  padding-left: 0;
  text-align: right;
  color: #8a95a5;
  cursor: pointer;
}

.fundName,
.fundName-noclick {
  max-width: none;
  overflow: visible;
  color: #0f172a;
  white-space: normal;
}

.fund-title {
  overflow: hidden;
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
  line-height: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.fund-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  color: #667085;
  font-size: 13px;
  font-weight: 500;
}

.nav-cell {
  color: #111827;
  font-weight: 500;
}

.up,
.down {
  font-size: 16px;
  font-weight: 500;
}

.list-footer {
  padding: 15px 12px 18px;
  border-top: 1px solid #edf1f7;
  color: #98a2b3;
  font-size: 14px;
  text-align: center;
}

.risk-note {
  margin: 8px 0 0;
  color: #98a2b3;
  font-size: 13px;
  line-height: 20px;
  text-align: center;
}

@media screen and (max-width: 500px) {
  .container {
    padding-right: 10px;
    padding-left: 10px;
  }

  .page-header {
    padding-right: 16px;
    padding-left: 16px;

    h2 {
      font-size: 22px;
    }
  }

  .header-actions {
    gap: 12px;
  }

  .market-strip.tab-row .tab-col {
    padding-right: 12px;
    padding-left: 12px;

    h5 {
      font-size: 12px;
    }

    p {
      font-size: 17px;
    }

    .market-change {
      font-size: 11px;
    }
  }

  .summary-btn {
    min-height: 68px;
    padding-right: 10px;
    padding-left: 10px;

    .summary-label {
      font-size: 12px;
    }

    strong {
      font-size: 18px;
    }

    em {
      font-size: 12px;
    }
  }

  .section-title {
    padding-right: 12px;
    padding-left: 12px;
  }

  .section-heading h3 {
    font-size: 21px;
  }

  .section-actions {
    gap: 7px;
    font-size: 12px;
  }

  table th {
    padding-right: 8px;
    padding-left: 8px;
    font-size: 12px;
  }

  table td {
    padding-right: 8px;
    padding-left: 8px;
    font-size: 13px;
  }

  .fund-title {
    font-size: 13px;
  }

  .fund-meta {
    font-size: 12px;
  }

  .up,
  .down {
    font-size: 14px;
  }
}

.portfolio-shell {
  min-height: 100vh;
  width: 100%;
  max-width: 390px;
  box-sizing: border-box;
  padding: 18px 10px 86px;
  background: #f6f8fb;
  color: #101828;
}

.portfolio-shell--detail {
  min-height: 450px;
  min-width: 300px;
}

.portfolio-shell--tall {
  height: 450px;
}

.portfolio-shell--editing {
  width: 785px;
}

.portfolio-shell--changelog {
  min-height: 550px;
  min-width: 300px;
}

.portfolio-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px 14px;

  > div:first-child {
    flex: 1;
    min-width: 0;
  }

  h2 {
    margin: 0;
    overflow: visible;
    color: #030712;
    font-size: 24px;
    font-weight: 800;
    line-height: 1.18;
    letter-spacing: 0;
    white-space: nowrap;
  }
}

.portfolio-header__actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.portfolio-icon-action {
  min-width: 38px;
  padding: 2px 4px;
  border: 0;
  background: transparent;
  color: #1d2939;
  cursor: pointer;
  text-align: center;

  i {
    display: block;
    color: #1d2939;
    font-size: 28px;
    font-weight: 600;
    line-height: 30px;
  }

  span {
    display: block;
    margin-top: 2px;
    color: #1d2939;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
  }

  .isRefresh {
    animation: changDeg 1.5s linear 0s infinite;
  }
}

.portfolio-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.market-board,
.asset-board,
.holdings-panel {
  overflow: hidden;
  border: 1px solid #e4e9f2;
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(16, 24, 40, 0.05);
}

.market-board {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
}

.market-card {
  min-width: 0;
  box-sizing: border-box;
  padding: 13px 16px 14px;
  border-right: 1px solid #edf1f7;
  background: #fff;
  cursor: pointer;
  text-align: left;

  &:last-child {
    border-right: 0;
  }

  h5 {
    margin: 0 0 8px;
    overflow: visible;
    color: #111827;
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
    white-space: nowrap;
  }

  p {
    margin: 0;
    overflow: visible;
    font-size: 22px;
    font-weight: 800;
    line-height: 27px;
    white-space: nowrap;
  }
}

.market-card__change {
  margin-top: 7px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  line-height: 18px !important;
}

.market-card__sparkline {
  display: block;
  width: 92%;
  height: 18px;
  margin-top: 11px;
  background: url("data:image/svg+xml,%3Csvg width='90' height='22' viewBox='0 0 90 22' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 16 L8 9 L14 13 L20 7 L27 11 L34 6 L43 5 L51 10 L59 12 L67 9 L75 8 L82 4 L89 6' fill='none' stroke='%23ff3b3b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M1 16 L8 9 L14 13 L20 7 L27 11 L34 6 L43 5 L51 10 L59 12 L67 9 L75 8 L82 4 L89 6 L89 22 L1 22 Z' fill='%23ff3b3b' fill-opacity='.08'/%3E%3C/svg%3E")
    center / 100% 100% no-repeat;
}

.market-card__remove {
  color: #e32323;
  cursor: pointer;
}

.asset-board {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
}

.asset-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  min-width: 0;
  min-height: 74px;
  box-sizing: border-box;
  margin: 0;
  padding: 14px 14px 12px;
  border: 0;
  border-right: 1px solid #edf1f7;
  background: #fff;
  cursor: pointer;
  text-align: left;

  &:last-child {
    border-right: 0;
  }

  strong,
  em,
  .asset-card__label {
    display: block;
    overflow: hidden;
    max-width: 100%;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .asset-card__label {
    color: #111827;
    font-size: 14px;
    font-weight: 600;
    line-height: 18px;
  }

  strong {
    margin-top: 10px;
    font-size: 22px;
    font-weight: 800;
    line-height: 27px;
  }

  em {
    margin-top: 5px;
    font-style: normal;
    font-size: 14px;
    line-height: 18px;
  }
}

.asset-card--up,
.trend-up {
  color: #ef1f1f;
}

.asset-card--down,
.trend-down {
  color: #159127;
}

.asset-card--neutral strong {
  color: #030712;
}

.holdings-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
  padding: 0 14px;
}

.holdings-heading__title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  h3 {
    margin: 0;
    color: #030712;
    font-size: 24px;
    font-weight: 800;
    line-height: 32px;

    span {
      color: inherit;
      font-size: inherit;
    }
  }
}

.holdings-heading__badge,
.holding-tag {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border-radius: 4px;
  background: #eaf1ff;
  color: #2563ff;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  white-space: nowrap;
}

.holdings-heading__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  color: #111827;
  font-size: 14px;
  white-space: nowrap;
}

.holdings-heading__add {
  border: 0;
  background: transparent;
  color: #2563ff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.holdings-panel--scroll {
  min-height: 160px;
  max-height: calc(100vh - 330px);
  overflow: auto;
}

.holdings-header,
.holding-row {
  display: grid;
  grid-template-columns: 34% 13% 14% 17% 17% 5%;
  align-items: center;
}

.holdings-header--editing,
.holding-row--editing {
  grid-template-columns: minmax(145px, 1fr) 82px 88px 42px;
}

.holdings-header {
  min-height: 44px;
  border-bottom: 1px solid #edf1f7;
  background: #fbfcfe;
  color: #697586;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.holdings-list {
  background: #fff;
}

.holding-row {
  min-height: 92px;
  border-bottom: 1px solid #edf1f7;
  color: #1d2939;
  font-size: 13px;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: #f8fbff;
  }
}

.holdings-cell {
  min-width: 0;
  box-sizing: border-box;
  padding: 0 10px;
  text-align: right;
}

.holdings-cell--name,
.holding-identity {
  text-align: left;
}

.holding-identity {
  cursor: pointer;
}

.holding-row--editing .holding-identity {
  cursor: move;
}

.holding-identity__name {
  overflow: hidden;
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
  line-height: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.holding-identity__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  color: #667085;
  font-size: 13px;
  font-weight: 500;
}

.holdings-sort,
.holding-detail-action {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.holdings-sort,
.holding-metric,
.holding-nav-value {
  text-align: right;
}

.holding-nav-value {
  color: #111827;
  font-weight: 500;
}

.holding-metric {
  font-size: 16px;
  font-weight: 500;
}

.holding-detail-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  color: #8a95a5;

  i {
    color: inherit;
    font-size: 18px;
  }
}

.holding-edit-cell {
  display: flex;
  align-items: center;
  justify-content: center;

  .num {
    width: 86px;
    min-width: 0;
  }
}

.holding-edit-cell--remove {
  justify-content: flex-end;
}

.holdings-footer {
  padding: 15px 12px 18px;
  border-top: 1px solid #edf1f7;
  color: #98a2b3;
  font-size: 14px;
  text-align: center;
}

.portfolio-risk-note,
.portfolio-tip {
  color: #98a2b3;
  font-size: 13px;
  line-height: 20px;
}

.portfolio-risk-note {
  margin: 8px 0 0;
  text-align: center;
}

.portfolio-tip {
  margin: 12px 0 0;
}

.portfolio-tip--center {
  text-align: center;
}

.portfolio-edit-panel,
.portfolio-mode-panel {
  margin-top: 12px;
}

.app-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  max-width: 390px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 7px 10px 9px;
  border-top: 1px solid #e4e9f2;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -12px 28px rgba(16, 24, 40, 0.08);
}

.app-nav__item {
  min-width: 52px;
  padding: 2px 4px;
  border: 0;
  background: transparent;
  color: #1d2939;
  cursor: pointer;
  text-align: center;

  i {
    display: block;
    font-size: 24px;
    line-height: 28px;
  }

  span {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
  }
}

.app-nav__item--active {
  color: #1d5cff;
}

.app-nav__item--primary {
  width: 58px;
  height: 58px;
  margin-top: -26px;
  border-radius: 50%;
  background: #1d5cff;
  color: #fff;
  box-shadow: 0 10px 24px rgba(29, 92, 255, 0.34);

  i {
    font-size: 30px;
    line-height: 38px;
  }

  span {
    margin-top: -3px;
    color: #1d2939;
    transform: translateY(18px);
  }
}

.is-draggable {
  cursor: move;
}

.portfolio-shell--dark {
  background: #111827;

  .portfolio-header h2 {
    color: rgba(255, 255, 255, 0.92);
  }

  .portfolio-icon-action {
    color: rgba(255, 255, 255, 0.68);

    i,
    span {
      color: rgba(255, 255, 255, 0.86);
    }
  }

  .market-board,
  .asset-board,
  .holdings-panel {
    border-color: rgba(255, 255, 255, 0.1);
    background: #1f2937;
    box-shadow: none;
  }

  .market-card,
  .asset-card,
  .holdings-list {
    border-color: rgba(255, 255, 255, 0.08);
    background: #1f2937;
  }

  .market-card h5,
  .asset-card__label,
  .holdings-heading__actions,
  .holding-nav-value,
  .holding-identity__name {
    color: rgba(255, 255, 255, 0.86);
  }

  .holdings-heading__title h3 {
    color: rgba(255, 255, 255, 0.92);
  }

  .holdings-header {
    border-color: rgba(255, 255, 255, 0.08);
    background: #172033;
    color: rgba(255, 255, 255, 0.5);
  }

  .holding-row,
  .holdings-footer {
    border-color: rgba(255, 255, 255, 0.08);
  }

  .holding-row:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .app-nav {
    border-top-color: rgba(255, 255, 255, 0.1);
    background: rgba(17, 24, 39, 0.98);
  }

  .app-nav__item {
    color: rgba(255, 255, 255, 0.72);
  }

  .app-nav__item--active {
    color: #76a7ff;
  }

  .app-nav__item--primary {
    color: #fff;

    span {
      color: rgba(255, 255, 255, 0.78);
    }
  }
}

@media screen and (max-width: 500px) {
  .portfolio-shell {
    padding-right: 10px;
    padding-left: 10px;
  }

  .portfolio-header {
    padding-right: 16px;
    padding-left: 16px;

    h2 {
      font-size: 22px;
    }
  }

  .portfolio-header__actions {
    gap: 12px;
  }

  .market-card {
    padding-right: 12px;
    padding-left: 12px;

    h5 {
      font-size: 12px;
    }

    p {
      font-size: 17px;
    }
  }

  .market-card__change {
    font-size: 11px !important;
  }

  .asset-card {
    min-height: 68px;
    padding-right: 10px;
    padding-left: 10px;

    .asset-card__label {
      font-size: 12px;
    }

    strong {
      font-size: 18px;
    }

    em {
      font-size: 12px;
    }
  }

  .holdings-heading {
    padding-right: 12px;
    padding-left: 12px;
  }

  .holdings-heading__title h3 {
    font-size: 21px;
  }

  .holdings-heading__actions {
    gap: 7px;
    font-size: 12px;
  }

  .holdings-cell {
    padding-right: 8px;
    padding-left: 8px;
  }

  .holding-identity__name {
    font-size: 13px;
  }

  .holding-identity__meta {
    font-size: 12px;
  }

  .holding-metric {
    font-size: 14px;
  }
}

/* H5 app shell rewrite: keep the page, scroll layer, and tab bar in one mobile coordinate system. */
.portfolio-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100% !important;
  max-width: 430px !important;
  height: 100vh;
  min-height: 0;
  margin: 0 auto;
  overflow: hidden;
  padding: 0 !important;
  background: #f6f8fb;
  color: #0b1220;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.portfolio-header {
  flex: 0 0 auto;
  min-height: 96px;
  box-sizing: border-box;
  padding: 30px 18px 14px !important;
  background: linear-gradient(180deg, #f8fbff 0%, #f6f8fb 100%);
}

.portfolio-header h2 {
  color: #050b18 !important;
  font-size: 25px !important;
  font-weight: 800 !important;
  line-height: 1.15 !important;
  white-space: normal !important;
}

.portfolio-header__actions {
  align-self: flex-start;
  gap: 18px !important;
}

.portfolio-icon-action {
  width: 38px;
  min-width: 38px !important;
  padding: 0 !important;
}

.portfolio-icon-action i {
  font-size: 29px !important;
  line-height: 30px !important;
}

.portfolio-icon-action span {
  margin-top: 3px !important;
  font-size: 12px !important;
  line-height: 16px !important;
}

.portfolio-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 0 10px 104px;
  scrollbar-width: none;
}

.portfolio-content::-webkit-scrollbar {
  display: none;
}

.market-board,
.asset-board,
.holdings-panel {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #e1e7f0 !important;
  border-radius: 7px !important;
  background: #fff !important;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.045) !important;
}

.market-board {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  min-height: 104px;
}

.market-card {
  padding: 14px 12px 13px !important;
  border-right: 1px solid #edf1f7 !important;
  text-align: left !important;
}

.market-card h5 {
  margin-bottom: 8px !important;
  overflow: hidden !important;
  color: #121826 !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  line-height: 18px !important;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.market-card p {
  overflow: hidden !important;
  font-size: 20px !important;
  font-weight: 800 !important;
  line-height: 25px !important;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.market-card__change {
  margin-top: 6px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  line-height: 16px !important;
}

.market-card__sparkline {
  height: 17px !important;
  margin-top: 9px !important;
}

.asset-board {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  margin-top: 12px;
}

.asset-card {
  min-height: 76px !important;
  padding: 15px 14px 12px !important;
  border-right: 1px solid #edf1f7 !important;
  background: #fff !important;
}

.asset-card__label {
  color: #111827 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  line-height: 18px !important;
}

.asset-card strong {
  margin-top: 10px !important;
  font-size: 22px !important;
  font-weight: 800 !important;
  line-height: 27px !important;
}

.asset-card em {
  margin-top: 4px !important;
  font-size: 14px !important;
  line-height: 18px !important;
}

.holdings-heading {
  min-height: 44px;
  margin-top: 14px !important;
  padding: 0 12px !important;
  gap: 6px !important;
}

.holdings-heading__title h3 {
  font-size: 22px !important;
  line-height: 32px !important;
  white-space: nowrap !important;
}

.holdings-heading__badge,
.holding-tag {
  height: 18px !important;
  padding: 0 6px !important;
  border-radius: 4px !important;
  background: #eaf1ff !important;
  color: #2563ff !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}

.holdings-heading__actions {
  gap: 6px !important;
  font-size: 12px !important;
}

.holdings-heading__add {
  color: #2563ff !important;
  font-size: 14px !important;
  font-weight: 600 !important;
}

.holdings-panel {
  margin-top: 0;
  overflow: hidden !important;
}

.holdings-header,
.holding-row {
  display: grid !important;
  grid-template-columns: 33% 14% 16% 18% 15% 4% !important;
  align-items: center;
}

.holdings-header {
  min-height: 45px !important;
  border-bottom: 1px solid #edf1f7 !important;
  background: #fff !important;
  color: #697586 !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}

.holdings-cell {
  min-width: 0;
  padding: 0 5px !important;
  box-sizing: border-box;
}

.holdings-cell--name,
.holding-identity {
  padding-left: 12px !important;
}

.holdings-sort {
  font-size: 12px !important;
  line-height: 16px !important;
}

.holding-row {
  min-height: 96px !important;
  border-bottom: 1px solid #edf1f7 !important;
}

.holding-identity__name {
  color: #0f172a !important;
  font-size: 14px !important;
  font-weight: 800 !important;
  line-height: 20px !important;
}

.holding-identity__meta {
  margin-top: 5px !important;
  color: #667085 !important;
  font-size: 12px !important;
  line-height: 18px !important;
}

.holding-nav-value {
  color: #111827 !important;
  font-size: 15px !important;
  font-weight: 500 !important;
}

.holding-metric {
  font-size: 15px !important;
  font-weight: 500 !important;
  line-height: 20px !important;
}

.holding-detail-action {
  justify-content: center !important;
  padding: 0 !important;
}

.holding-detail-action i {
  color: #7b8494 !important;
  font-size: 17px !important;
}

.holdings-footer {
  padding: 16px 12px 18px !important;
  color: #98a2b3 !important;
  font-size: 14px !important;
  text-align: center !important;
}

.portfolio-risk-note {
  margin: 12px 0 16px !important;
  color: #98a2b3 !important;
  font-size: 13px !important;
  line-height: 20px !important;
}

.app-nav {
  position: absolute !important;
  right: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  z-index: 30;
  display: grid !important;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: end;
  width: 100% !important;
  max-width: none !important;
  min-height: 74px;
  box-sizing: border-box;
  margin: 0 !important;
  padding: 7px 8px calc(9px + env(safe-area-inset-bottom)) !important;
  border-top: 1px solid #e4e9f2 !important;
  background: rgba(255, 255, 255, 0.98) !important;
  box-shadow: 0 -12px 28px rgba(16, 24, 40, 0.08) !important;
}

.app-nav__item {
  position: relative;
  min-width: 0 !important;
  height: 54px;
  padding: 0 !important;
  border: 0;
  background: transparent;
  color: #1d2939;
  cursor: pointer;
  text-align: center;
}

.app-nav__item i {
  display: block;
  font-size: 25px !important;
  line-height: 29px !important;
}

.app-nav__item span {
  display: block;
  margin-top: 3px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  line-height: 16px !important;
}

.app-nav__item--active {
  color: #1d5cff !important;
}

.app-nav__item--primary {
  align-self: start;
  width: 58px !important;
  height: 58px !important;
  margin: -26px auto 0 !important;
  border-radius: 50% !important;
  background: #1d5cff !important;
  color: #fff !important;
  box-shadow: 0 10px 24px rgba(29, 92, 255, 0.34) !important;
}

.app-nav__item--primary i {
  color: #fff !important;
  font-size: 32px !important;
  line-height: 56px !important;
}

.app-nav__item--primary span {
  position: absolute;
  top: 61px;
  left: 50%;
  margin: 0 !important;
  color: #1d2939 !important;
  transform: translateX(-50%);
}

@media screen and (max-width: 395px) {
  .portfolio-header {
    padding-right: 14px !important;
    padding-left: 14px !important;
  }

  .portfolio-header h2 {
    font-size: 23px !important;
  }

  .market-card {
    padding-right: 9px !important;
    padding-left: 9px !important;
  }

  .market-card h5 {
    font-size: 12px !important;
  }

  .market-card p,
  .asset-card strong {
    font-size: 18px !important;
  }

  .asset-card {
    padding-right: 10px !important;
    padding-left: 10px !important;
  }

  .asset-card__label {
    font-size: 12px !important;
  }

  .holdings-header,
  .holding-row {
    grid-template-columns: 33% 14% 16% 18% 15% 4% !important;
  }

  .holding-metric,
  .holding-nav-value {
    font-size: 14px !important;
  }
}
</style>
