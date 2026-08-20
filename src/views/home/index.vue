<template>
  <div id="app" class="container" :class="containerClass"
    :style="diyContainer ? { width: containerWidth + 'px', height: containerHeight + 'px' } : ''">
    <div class="main-row">
      <div class="tab-row">
        <div v-for="(el, index) in indFundData" :draggable="isEdit" class="tab-col indFund" :class="drag" :key="el.f12"
          @click.stop="!isEdit && indDetail(el)" @dragstart="handleDragStart($event, el)"
          @dragover.prevent="handleDragOver($event, el)" @dragenter="handleDragEnter($event, el, index)"
          @dragend="handleDragEnd($event, el)">
          <h5>
            {{ el.f14 }}
            <span v-if="isEdit" @click="dltIndFund(index)" class="dltBtn edit red btn">✖</span>
          </h5>
          <p :class="el.f3 >= 0 ? 'up' : 'down'">{{ el.f2 }}</p>
          <p :class="el.f3 >= 0 ? 'up' : 'down'">{{ el.f4 }}&nbsp;&nbsp;{{ el.f3 }}%</p>
        </div>
        <div v-if="isEdit && indFundData.length < 4" class="tab-col">
          <div v-if="!showAddSeciInput" class="addSeci" @click="() => (showAddSeciInput = true)">添加</div>
          <div v-else>
            <div style="padding-top: 2px">
              <el-select size="mini" :popper-append-to-body="false" v-model="sltSeci" style="width: 110px"
                placeholder="请选择">
                <el-option v-for="item in userSeciList" :key="item.value" :label="item.label"
                  :value="item.value"></el-option>
              </el-select>
            </div>
            <div style="margin-top: 4px">
              <input class="btn" type="button" value="取消" @click="() => (showAddSeciInput = false)" />
              <input class="btn" type="button" value="确定" @click="saveSeci" />
            </div>
          </div>
        </div>
      </div>
      <div v-if="isEdit" class="input-row">
        <span>添加新基金:</span>
        <!-- <input v-model="fundcode" class="btn" type="text" placeholder="请输入基金代码" /> -->
        <el-select v-model="fundcode" multiple filterable :popper-append-to-body="false" remote size="mini"
          reserve-keyword @change="selectChange" placeholder="请输入基金编码，支持按名称或编码搜索" :remote-method="remoteMethod"
          :loading="loading" style="width: 300px">
          <el-option v-for="item in searchOptions" :key="item.value" :label="item.label" :value="item.value">
            <span class="option_fund_name">{{ item.label }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px; margim-right: 20px; padding-right: 15px">{{
              item.value }}</span>
          </el-option>
        </el-select>
        <input @click="save" class="btn" type="button" value="确定" />
      </div>
      <p v-if="isEdit" class="tips center">部分新发基金或QDII基金可以搜索到，但可能无法获取估值情况</p>
      <div class="table-row" :class="tableHeight">
        <table>
          <thead>
            <tr>
              <th class="align-left">基金名称</th>
              <!-- <th v-if="isEdit">基金代码</th> -->
              <th style="min-width: 50px" v-if="showGSZ && !isEdit">估算净值</th>
              <th style="text-align: center" v-if="isEdit">成本价</th>
              <th style="text-align: center" v-if="isEdit">持有份额</th>
              <th style="min-width: 50px" @click="sortList('amount')" v-if="showAmount && !isEdit" class="pointer">
                持有额
                <span :class="sortType.amount" class="down-arrow"></span>
              </th>
              <th style="min-width: 60px" @click="sortList('amount')" v-if="showProportion && !isEdit" class="pointer">
                持仓占比
                <span :class="sortType.amount" class="down-arrow"></span>
              </th>
              <th style="min-width: 60px" @click="sortList('costGains')" v-if="showCost && !isEdit" class="pointer">
                持有收益
                <span :class="sortType.costGains" class="down-arrow"></span>
              </th>
              <th style="min-width: 72px" @click="sortList('costGainsRate')" v-if="showCostRate && !isEdit"
                class="pointer">
                持有收益率
                <span :class="sortType.costGainsRate" class="down-arrow"></span>
              </th>
              <th v-if="!isEdit" style="min-width: 60px" @click="sortList('gszzl')" class="pointer">
                涨跌幅
                <span :class="sortType.gszzl" class="down-arrow"></span>
              </th>
              <th style="min-width: 60px" @click="sortList('gains')" v-if="showGains && !isEdit" class="pointer">
                估算收益
                <span :class="sortType.gains" class="down-arrow"></span>
              </th>
              <th style="min-width: 60px" v-if="!isEdit">更新时间</th>

              <th v-if="isEdit">删除</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(el, index) in dataList" :key="el.fundcode" :draggable="isEdit" :class="drag"
              @dragstart="handleDragStart($event, el)" @dragover.prevent="handleDragOver($event, el)"
              @dragenter="handleDragEnter($event, el, index)" @dragend="handleDragEnd($event, el)">
              <td :class="isEdit ? 'fundName-noclick align-left' : 'fundName align-left'" :title="el.name"
                @click.stop="!isEdit && fundDetail(el)">
                {{ el.name }}
                <span v-if="isEdit">（{{ el.fundcode }}）</span>
              </td>
              <!-- <td v-if="isEdit">{{ el.fundcode }}</td> -->
              <td v-if="showGSZ && !isEdit">{{ el.gsz }}</td>
              <td v-if="isEdit">
                <input class="btn num" placeholder="持仓成本价" v-model="el.cost" @input="changeCost(el, index)"
                  type="text" />
              </td>
              <th v-if="isEdit">
                <input class="btn num" placeholder="输入持有份额" v-model="el.num" @input="changeNum(el, index)"
                  type="text" />
              </th>
              <td v-if="showAmount && !isEdit">{{ el.amount }}</td>
              <!-- 持仓占比 -->
              <td v-if="showProportion && !isEdit">{{ el.proportion + '%' }}</td>
              <td v-if="showCost && !isEdit" :class="el.costGains >= 0 ? 'up' : 'down'">
                {{ el.costGains }}
              </td>
              <td v-if="showCostRate && !isEdit" :class="el.costGainsRate >= 0 ? 'up' : 'down'">
                {{ el.cost > 0 ? el.costGainsRate + '%' : '' }}
              </td>
              <!-- 涨跌幅 -->
              <td v-if="!isEdit" :class="el.gszzl >= 0 ? 'up' : 'down'">{{ el.gszzl !== null && el.gszzl !== undefined ?
                `${Number(el.gszzl).toFixed(2)}%` : '--' }}</td>
              <!-- 估算收益 -->
              <td v-if="showGains && !isEdit" :class="el.gains >= 0 ? 'up' : 'down'">
                {{ el.gains }}
              </td>
              <!-- 更新时间 -->
              <td v-if="!isEdit">
                {{ renderUpdateTime(el) }}
                <span class="hasReplace-tip" v-if="el.hasReplace">✔</span>
              </td>
              <td v-if="isEdit">
                <input @click="dlt(el.fundcode)" class="btn red edit" value="✖" type="button" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <p v-if="isEdit" class="tips">特别关注功能介绍：指定一个基金，在程序图标中以角标的形式实时更新，请在设置中选择角标类型与内容。</p>

    <div v-show="isEdit" class="input-row">
      <el-switch v-model="darkMode" @change="changeDarkMode" active-color="#484848" inactive-color="#13ce66"
        inactive-text="标准模式" active-text="暗色模式"> </el-switch>
      <!-- <input v-model="containerWidth" type="number" />
      <input v-model="containerHeight" type="number" /> -->
    </div>

    <div class="input-row">
      <input class="btn" type="button" @click="goStock" value="股票" />
      <input class="btn" type="button" @click="market" value="行情中心" />
      <input class="btn" type="button" :value="isEdit ? '完成编辑' : '编辑'" @click="isEdit = !isEdit" />
      <input class="btn" type="button" value="设置" @click="option" />
      <!-- <input class="btn" type="button" value="日志" @click="changelog" /> -->
      <!-- <input class="btn primary" type="button" title="φ(>ω<*)" value="打赏" @click="reward" /> -->
      <div class="refresh" :class="{ isRefresh: isRefresh }" title="手动刷新数据" @click="refresh">
        <i class="el-icon-refresh"></i>
      </div>
    </div>
    <div class="input-row" style="position: relative">
      <input v-if="showAllGains" class="btn copy" :class="allGains >= 0 ? 'btn-up' : 'btn-down'" type="button"
        @click="earningsDayShow" :value="`日收益：${allGains}(${dailyYield})`" />
      <input v-if="showAllCost" class="btn" :class="allCostGains[0] >= 0 ? 'btn-up' : 'btn-down'" type="button"
        @click="holdingIncomeShow"
        :value="`持有收益：${parseFloat(allCostGains[0]).toLocaleString('zh', { minimumFractionDigits: 1 })}${isNaN(allCostGains[1]) ? '' : '(' + allCostGains[1] + '%)'}`" />
      <input v-if="showTotalRevenue" class="btn copyTotalRevenue" :class="totalRevenue[0] >= 0 ? 'btn-up' : 'btn-down'"
        type="button" @click="copyTotalRevenue"
        :value="`总收益：${parseFloat(totalRevenue[0]).toLocaleString('zh', { minimumFractionDigits: 1 })}${isNaN(totalRevenue[1]) ? '' : '(' + totalRevenue[1] + '%)'}`" />
      <input v-if="showTotalAssets" class="btn" type="button" :value="`总资产：${allAmount}`" />
    </div>
    <market :darkMode="darkMode" @close="closeCharts" ref="marketShadow"></market>
    <ind-detail @close="closeCharts" :darkMode="darkMode" ref="indDetail"> </ind-detail>
    <!-- <charts @close="closeCharts" ref="charts"></charts> -->
    <fund-detail @close="closeCharts" :curfund="sltFund" :fundList="dataList" :darkMode="darkMode"
      ref="charts"></fund-detail>
    <earnings-day @close="earningsDayDialogShow = false" :earningsDayDialogShow="earningsDayDialogShow"
      :fundList="dataList" :allAmount="allAmount" :darkMode="darkMode"></earnings-day>
    <holding-income @close="holdingIncomeDialogShow = false" :earningsDayDialogShow="holdingIncomeDialogShow"
      :fundList="dataList" :allCostGains="allCostGains[0]" :darkMode="darkMode"></holding-income>
    <reward @close="rewardShadow = false" ref="reward"></reward>
    <change-log @close="closeChangelog" :darkMode="darkMode" ref="changelog" :top="40"></change-log>
    <tips :addDialog.sync="addDialog"></tips>
  </div>
</template>

<script>
const { version } = require('../../../package.json');
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
      if (this.allAmount) {
        return `${((100 * this.allGains) / this.allAmount).toFixed(2)}%`;
      } else {
        return `0%`;
      }
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
    containerClass() {
      let className = '';
      if (this.darkMode) {
        className += 'darkMode ';
      }
      if (this.changelogShadow) {
        className += 'changelog-container';
      } else if (this.rewardShadow) {
        className += 'more-height';
      } else if (this.detailShadow) {
        className += 'detail-container';
      } else if (this.isEdit) {
        className += 'more-width';
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
        return 'table-drag';
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
          return el.gztime.slice(0, 5);
        }
      } else if (el.jzrq) {
        return el.jzrq;
      } else {
        return '--';
      }
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
        let url =
          // "https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?&m=9&key=" +
          '/fundsuggest/FundSearch/api/FundSearchAPI.ashx?&m=9&key=' + query + '&_=' + new Date().getTime();
        this.$axios.get(url).then((res) => {
          this.searchOptions = res.Datas.map((val) => {
            return {
              value: val.CODE,
              code: val.CODE,
              label: val.NAME,
            };
          });
          this.loading = false;
        });

        // let url = "/searchapi/api/Info/Search";
        // get(url, {
        //   appid: "el1902262",
        //   type: 14,
        //   token: "CCSDCZSDCXYMYZYYSYYXSMDDSMDHHDJT",
        //   and14: `MultiMatch/Name,Code,PinYin/${query}/true`,
        //   returnfields14:
        //     "Name,Code,PinYin,MarketType,JYS,MktNum,JYS4App,MktNum4App,ID,Classify,IsExactMatch,SecurityType,SecurityTypeName",
        //   pageIndex14: 1,
        //   pageSize14: 10,
        //   isAssociation14: "false1633883320220"
        // }).then(res => {
        //   // console.log("11", res);
        //   if (!res.Data) return;
        //   this.searchOptions = res.Data.map(val => {
        //     return {
        //       market: val.MktNum,
        //       value: val.Code,
        //       label: val.Name,
        //       code: val.Code,
        //     };
        //   });
        //   this.loading = false;
        // });
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
    // 移动端走的接口
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
            console.log('有数据啊2', data);

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
        let url = `/sinaFund/FdFundService.getEstimateNetworthPic?symbol=${v.code}&timer=${Date.now()}`;
        return this.$axios.get(url);
      });
      Promise.all(fundlist)
        .then((data) => {
          console.log(1, data, dataList, this.fundListM);
          this.isRefresh = false;
          data.forEach((v, idx) => {
            if (!v || !v.result || v.result.status.code !== 0) {
              dataList[idx] = {
                ...dataList[idx],
                hasReplace: true,
              };
              return;
            }
            let sinaData = v.result.data;
            let networthList = sinaData.networth || [];
            if (networthList.length === 0) {
              dataList[idx] = {
                ...dataList[idx],
                hasReplace: true,
              };
              return;
            }
            let latestNetworth = networthList[networthList.length - 1];
            let gsz = parseFloat(latestNetworth.pre_nav2);
            let gszzl = parseFloat(latestNetworth.nav2_pct);
            let gztime = latestNetworth.min_time || '';
            let gztimeFormatted = gztime.slice(0, 5);
            // 判断是否 获取真正的净值
            console.log('打印1', dataList[idx]?.jzrq);
            console.log('打印2', gztimeFormatted);
            if (dataList[idx]?.jzrq !== gztimeFormatted) {
              console.log('走1');

              dataList[idx] = {
                ...dataList[idx],
                gszzl: gszzl,
                gsz: gsz,
                gztime: gztime,
                gains: this.calculate({ ...dataList[idx], gsz: gsz }),
              };
            } else {
              console.log('走2');
              dataList[idx] = {
                ...dataList[idx],
                gztime: gztime,
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
      console.log('获取列表数据', this.fundListM);
      let fundlist = this.fundListM.map((v) => {
        let url = `/sinaFund/FdFundService.getEstimateNetworthPic?symbol=${v.code}&timer=${Date.now()}`;
        return this.$axios.get(url);
      });
      Promise.all(fundlist)
        .then(async (data) => {
          console.log(1, data);
          this.isRefresh = false;
          let dataList = [];
          let failedCodes = []; // 存储查询失败的基金代码

          data.forEach((v, idx) => {
            if (!v || !v.result || v.result.status.code !== 0) {
              console.log('下标', idx, this.fundListM[idx]);
              failedCodes.push({ code: this.fundListM[idx].code, market: this.fundListM[idx].market });
              return;
            }
            let sinaData = v.result.data;
            let networthList = sinaData.networth || [];
            if (networthList.length === 0) {
              console.log('下标', idx, this.fundListM[idx], '没有净值数据');
              failedCodes.push({ code: this.fundListM[idx].code, market: this.fundListM[idx].market });
              return;
            }
            let latestNetworth = networthList[networthList.length - 1];
            let data = {
              fundcode: latestNetworth.symbol,
              name: '',
              jzrq: sinaData.worth_date || '',
              dwjz: sinaData.worth || '',
              gsz: latestNetworth.pre_nav2,
              gszzl: parseFloat(latestNetworth.nav2_pct),
              gztime: latestNetworth.min_time || '',
              hasReplace: false
            };
            let slt = this.fundListM.filter((item) => item.code == data.fundcode);
            data.name = slt[0].label;
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
          () => { }
        );
      } else if (item.f12) {
        storage.set(
          {
            seciList: this.seciList,
          },
          () => { }
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
</style>
