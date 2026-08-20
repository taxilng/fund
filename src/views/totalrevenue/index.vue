<template>
  <div id="app" class="shadow" :class="darkMode ? 'darkMode' : ''">
    <div class="content-box" v-loading="loading" element-loading-background="rgba(0, 0, 0, 0.8)">
      <div id="copyImage">
        <h5>当日总收益曲线</h5>
        <div class="subtitle">
          <span>当前收益：</span
          ><span :class="latestAmout >= 0 ? 'up' : 'down'"
            >{{ latestAmout }} ({{ latestRate }})</span
          >
          <span style="margin-left: 20px">
            波动：{{ wave.difference }}（{{ wave.differenceRate }}）</span
          >
          <div style="margin-top: 10px">
            <span>最高：</span>
            <span :class="wave.max >= 0 ? 'up' : 'down'"
              >{{ wave.max }}({{ wave.maxRate }})</span
            >
            <span style="margin-left: 20px">最低：</span>
            <span :class="wave.min >= 0 ? 'up' : 'down'"
              >{{ wave.min }}({{ wave.minRate }})</span
            >
          </div>
        </div>
        <!-- <el-tabs v-model="activeName" type="border-card" @tab-click="handleClick">
                <el-tab-pane lazy label="净值估算" name="first"> -->
        <charts
          :darkMode="darkMode"
          :fundAmount="fundAmount"
          :allAmount="allAmount"
          ref="first"
        ></charts>
        <!-- </el-tab-pane>
            </el-tabs> -->
      </div>
      <div class="tab-row">
        <input class="btn" type="button" value="返回列表" @click="close" />
        <input class="btn" type="button" value="刷新" @click="init" />
        <input
          class="btn copy"
          type="button"
          :value="isCopyPic ? '复制图片' : '复制文字'"
          @click="copy"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ClipboardJS from "clipboard";
import charts from "../common/earningsDayCharts";
import html2canvas from "html2canvas";
import { storage, chrome } from "@/untils/utils";
export default {
  components: {
    charts,
  },
  name: "fundDetail",
  data() {
    return {
      loading: false,
      fundAmount: [],
      activeName: "first",
      darkMode: false,
      allAmount: 1,
    };
  },
  computed: {
    isMobile() {
      if (
        window.navigator.userAgent.match(
          /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
        )
      ) {
        return true; // 移动端
      } else {
        return false; // PC端
      }
    },
    isCopyPic() {
      return !this.isMobile && navigator.clipboard;
    },
    latestAmout() {
      return this.fundAmount[this.fundAmount.length - 1];
    },
    latestRate() {
      return `${((this.latestAmout / this.allAmount) * 100).toFixed(2)}%`;
    },
    wave() {
      const max = Math.max.apply(Math, this.fundAmount);
      const min = Math.min.apply(Math, this.fundAmount);
      let difference = 0;
      if (isFinite(max)) {
        difference = (max - min).toFixed(2);
      }
      // console.log('difference',difference,max, this.fundAmount);
      return {
        difference,
        differenceRate: `${((difference / this.allAmount) * 100).toFixed(2)}%`,
        max,
        maxRate: `${((max / this.allAmount) * 100).toFixed(2)}%`,
        min,
        minRate: `${((min / this.allAmount) * 100).toFixed(2)}%`,
      };
    },
  },
  watch: {},
  mounted() {
    this.init();
  },
  methods: {
    init() {
      storage.get(["stockList", "fundListM", "darkMode"]).then(async (res) => {
        // console.log("获取localstorage=>", res);
        this.darkMode = res.darkMode ? res.darkMode : false;
        let list = []
        let allAmount = 0
        let lastFund = 0
        if (res.fundListM) {
         const result =  await this.queryFunds(res.fundListM);
         list = result.list.filter((v, i) => i !== 121)
         allAmount += result.all
         lastFund = list[list.length - 1]
        //  console.log('基金返回值', JSON.parse(JSON.stringify(result)));
        }
        if (res.stockList) {
          const result = await this.queryStocks(res.stockList);
          result.list.forEach((v, i) => {
            list[i] = Number(v) + Number(list[i] ?? lastFund)
          })
          allAmount += result.all
          // console.log('股票返回值', JSON.parse(JSON.stringify(result)));
        }
        this.fundAmount = list.map(v => Number(v).toFixed(1))
        this.allAmount = allAmount.toFixed(1)
        // console.log("总的当前值", list);
      });
    },
    copy() {
      const that = this;

      if (this.isCopyPic) {
        html2canvas(document.querySelector("#copyImage")).then(function (
          canvas
        ) {
          canvas.toBlob((blob) => {
            const clipboardItem = new window.ClipboardItem({
              "image/png": blob,
            });
            navigator.clipboard.write([clipboardItem]);
          }, "image/png");
          that.$notify.closeAll();
          that.$notify.success({
            title: "复制图片成功",
          });
        });
      } else {
        var clipboard = new ClipboardJS(".copy", {
          target: function () {
            return document.querySelector("#copyImage");
          },
        });
        clipboard.on("success", function (e) {
          that.$notify.closeAll();
          that.$notify.success({
            title: "复制文字成功",
          });
          console.info("Action:", e.action);
          console.info("Text:", e.text);
          console.info("Trigger:", e.trigger);
          e.clearSelection();
        });

        clipboard.on("error", function (e) {
          console.error("Action:", e.action);
          console.error("Trigger:", e.trigger);
        });
      }
    },
    handleClick(tab) {
      this.activeName = tab.name;
    },
    queryFunds(fundListM) {
      this.loading = true;
      const fundCodeList = fundListM
        .filter((v) => Number(v.num))
        .map((v) => {
          let url = `/FundMApi/FundVarietieValuationDetail.ashx?FCODE=${
            v.code
          }&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&_=${new Date().getTime()}`;
          return this.$axios.get(url);
        });
      return new Promise((resolve) => {
        return Promise.all(fundCodeList)
          .then((res) => {
            // console.log('zhja', res);
            const maxlength = Math.max.apply(
              Math,
              res.map((v) => v.Datas.length)
            );
            // console.log('maxlength', maxlength);
            let amountList = [];
            let allAmount = 0;
            res.forEach((v) => {
              const curFund = fundListM.find(
                (x) => x.code === v.Expansion.FCODE
              );
              if (curFund) {
                const num = curFund.num;
                const amount = curFund.num * v.Expansion.DWJZ;
                let dataList = v.Datas.map((item) => item.split(",")).map((y) =>
                  (y[2] * num * v.Expansion.DWJZ).toFixed(2)
                );
                allAmount += num * v.Expansion.DWJZ;
                // console.log('dia', dataList);
                // 拿不到的数据，以最新的净值来估算
                if (dataList.length < maxlength) {
                  const lastGSZZL = v.Expansion.GSZZL;
                  const estimatedRevenue = (lastGSZZL * amount).toFixed(2);
                  const extraArray = new Array(
                    maxlength - dataList.length
                  ).fill(estimatedRevenue);
                  dataList = [...dataList, ...extraArray];
                  // console.log('额外补充的', extraArray);
                }
                if (amountList.length && dataList.length) {
                  amountList = amountList.map(
                    (v, i) => Number(v) + Number(dataList[i])
                  );
                } else if (amountList.length === 0) {
                  amountList = dataList;
                }
              }
            });
            // console.log('amountList', amountList);
            amountList = amountList
              .filter((v) => !isNaN(v))
              .map((v) => (v / 100).toFixed(1));
            // console.log("fundAmount", amountList);
            resolve({ list: amountList, all: allAmount });
          })
          .finally(() => {
            this.loading = false;
          });
      });
    },
    queryStocks(stockList) {
      this.loading = true;
      const fundCodeList = stockList
        .filter((v) => Number(v.num))
        .map((v) => {
          let url = `https://push2.eastmoney.com/api/qt/stock/trends2/get?secid=${v.market}.${v.code}&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f53,f56,f58&iscr=0&iscca=0&ndays=1&forcect=1`;
          return this.$axios.get(url);
        });
      return new Promise((resolve) => {
        Promise.all(fundCodeList)
          .then((res) => {
            // console.log("股票当日曲线", res);
            // const maxlength = Math.max.apply(Math, res.map(v => v.data?.trendsTotal))
            // console.log('maxlength', maxlength);
            let amountList = [];
            let allAmount = 0;
            res.forEach((v) => {
              const curFund = stockList.find((x) => x.code === v.data.code);
              // console.log("这是", curFund);
              if (curFund) {
                const num = curFund.num;
                const prePrice = v.data.prePrice; // 昨日收盘价
                allAmount += num * prePrice;
                let dataList = v.data?.trends
                  .map((item) => item.split(","))
                  .map((y) => ((y[1] - prePrice) * num).toFixed(2));
                // console.log('dia', dataList);
                if (amountList.length && dataList.length) {
                  amountList = amountList.map(
                    (v, i) => Number(v) + Number(dataList[i])
                  );
                } else if (amountList.length === 0) {
                  amountList = dataList;
                }
              }
            });
            // console.log('amountList', amountList);
            amountList = amountList
              .filter((v) => !isNaN(v))
              .map((v) => Number(v).toFixed(1));
            // console.log("stock", amountList);
            resolve({ list: amountList, all: allAmount });
          })
          .finally(() => {
            this.loading = false;
          });
      });
    },
    close() {
      history.back(); 
    },
  },
};
</script>

<style lang="less" scoped>
.shadow {
  min-width: 300px;
  max-width: 700px;
  margin: 0 auto;
  min-height: 150px;
  overflow-y: auto;
  padding: 10px 7px;
  box-sizing: border-box;
  font-size: 12px;
  background-color: rgba(0, 0, 0, 0.7);
}

.content-box {
  background: #ffffff;
  border-radius: 15px;
  padding: 0 2px;
  margin: 0 auto;
  text-align: center;
  line-height: 1;
  vertical-align: middle;
  // #copyImage {
  //   background-color: #373737;
  // }
  .subtitle {
    text-align: left;
    margin: 0 0 10px 20px;
    .up {
      color: #f56c6c;
    }
    .down {
      color: #4eb61b;
    }
  }
  h5 {
    margin: 0;
    padding: 13px;
  }

  /deep/ .el-tabs__item {
    padding: 0 15px;
    height: 34px;
    line-height: 34px;
  }
  /deep/ .el-tabs--border-card > .el-tabs__content {
    padding: 5px;
  }
}
.main-echarts {
  width: 100%;
  height: 240px;
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
  margin: 0 5px;
  outline: none;
  border: 1px solid #dcdfe6;
}
.tab-row {
  padding: 12px 0;
}

.tab-row:after,
.tab-row:before {
  display: table;
  content: "";
}

.tab-row:after {
  clear: both;
}

.shadow.darkMode {
  color: rgba(255, 255, 255, 0.6);
  .content-box,
  #copyImage {
    background-color: #373737;
  }
  .btn {
    background-color: rgba(255, 255, 255, 0.16);
    color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.6);
  }

  /deep/ .el-tabs--border-card {
    background-color: #373737;
    border: 1px solid rgba(255, 255, 255, 0.37);
    .el-tabs__header {
      background-color: rgba(255, 255, 255, 0.16);
      border-bottom: 1px solid rgba(255, 255, 255, 0.37);

      .el-tabs__item.is-active {
        background-color: rgba(64, 158, 255, 0.6);
        color: rgba(255, 255, 255, 0.6);
        border-right-color: rgba(255, 255, 255, 0.37);
        border-left-color: rgba(255, 255, 255, 0.37);
      }
    }
  }

  /deep/ .el-radio-button--mini .el-radio-button__inner {
    background-color: rgba(255, 255, 255, 0.16);
    color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.37);
  }

  /deep/ .el-radio-button__orig-radio:checked + .el-radio-button__inner {
    background-color: rgba(64, 158, 255, 0.6);
    color: rgba(255, 255, 255, 0.6);
    border-color: rgba(64, 158, 255, 0.37);
  }
}
</style>
