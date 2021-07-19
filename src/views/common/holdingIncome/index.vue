<template>
    <div v-if="boxShadow" class="shadow" :class="darkMode ? 'darkMode' : ''">
        <div class="content-box" v-loading="loading" element-loading-background="rgba(0, 0, 0, 0.8)">
            <h5>区间收益曲线(估算)</h5>
            <div class="subtitle">
                <span>持有收益</span> <span :class="allCostGains >= 0 ? 'up' : 'down'">{{allCostGains}}</span>
                <span style="margin-left: 10px;">区间收益</span> <span :class="lastProfit >= 0 ? 'up' : 'down'">{{lastProfit}}</span>
            </div>
            <div class="main-echarts" ref="mainCharts"></div>
            <div>
                <el-radio-group size="mini" v-model="sltTimeRange" @change="changeTimeRange">
                    <el-radio-button label="y">月</el-radio-button>
                    <el-radio-button label="3y">季</el-radio-button>
                    <el-radio-button label="6y">半年</el-radio-button>
                    <el-radio-button label="n">一年</el-radio-button>
                    <el-radio-button label="3n">三年</el-radio-button>
                    <el-radio-button label="5n">五年</el-radio-button>
                </el-radio-group>
            </div>
            <div class="tab-row">
                <input class="btn" type="button" value="返回列表" @click="close" />
                <input class="btn" type="button" value="刷新" @click="init" />
            </div>
        </div>
    </div>
</template>

<script>
let echarts = require("echarts/lib/echarts");

import "../js/customed.js";
import "../js/dark.js";

require("echarts/lib/chart/line");

require("echarts/lib/component/tooltip");
require("echarts/lib/component/legend");

export default {
    name: "chatrs",
    props: {
        darkMode: {
            type: Boolean,
            default: false,
        },
        earningsDayDialogShow: {
            type: Boolean,
            default: false,
        },
        fundList: {
            type: Array,
            required: true,
        },
        allCostGains: {
            type: String,
            default: '1',
        },
    },
    data () {
        return {
            boxShadow: false,
            chartEL: null,
            myChart: null,
            minVal: null,
            maxVal: null,
            interVal: null,
            sltTimeRange: "y",
            option: {},
            loading: false,
            lastProfit: 0,
        };
    },
    watch: {
        earningsDayDialogShow (val) {
            this.boxShadow = val
            if (val) {
                setTimeout(() => {
                    this.init()
                }, 0);
            }
        },
    },
    computed: {
        defaultColor () {
            return this.darkMode ? "rgba(255,255,255,0.6)" : "#ccc";
        },
    },
    mounted () {
    },
    beforeDestroy () {
        this.myChart && this.myChart.clear();
    },
    methods: {
        init () {
            this.chartEL = this.$refs.mainCharts;
            this.myChart = echarts.init(
                this.chartEL,
                this.darkMode ? "dark" : "customed"
            );
            this.option = {
                tooltip: {
                    trigger: "axis",
                    formatter: (p) => {
                        return `时间：${p[0].name}<br />收益：${p[0].value}`;
                    },
                },
                grid: {
                    top: 20,
                    left: 50,
                    right: 0,
                    bottom: 30,
                },
                xAxis: {
                    type: "category",
                    data: [],
                    axisLabel: {},
                },
                yAxis: {
                    type: "value",
                    scale: true,
                    axisLabel: {
                        color: this.defaultColor,
                        formatter: (val) => {
                            return val;
                        },
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            type: "dashed",
                            color: this.defaultColor,
                        },
                    },
                    data: [],
                },
                series: [
                    {
                        type: "line",
                        data: [],
                    },
                ],
            };
            this.getData();
        },
        changeTimeRange () {
            this.getData();
        },
        handle_num_range (data) {
            var _aa = Math.max.apply(null, data);
            var _bb = Math.min.apply(null, data);
            return [_aa, _bb];
        },
        getData () {
            this.loading = true;
            const fundCodeList = this.fundList
                .filter(v => Number(v.amount))
                .map(v => {
                    let url = `https://dataapi.1234567.com.cn/dataapi/fund/FundVPageAcc`;
                    return this.$axios.get(url, {
                        params: {
                            CODE: v.fundcode,
                            RANGE: this.sltTimeRange,
                            deviceid: 'Wap',
                            product: 'EFund'
                        }
                    })
                })
            Promise.all(fundCodeList)
                .then((res) => {
                    this.loading = false;
                    // console.log('res', res);
                    const maxlength = Math.max.apply(Math, res.map(v => v.data.length))
                    let amountList = []
                    res.forEach(v => {
                        const curFund = this.fundList.find(x => x.fundcode === v.expansion.aboutAcc[0].code)
                        if (curFund) {
                            const amount = curFund.amount
                            let dataList = v.data
                                .map(y => (y.yield * amount).toFixed(2))
                            // console.log('dataList', dataList);
                            // 拿不到的数据，就用0来估算
                            if (dataList.length < maxlength) {
                                const extraArray = new Array(maxlength - dataList.length).fill(0)
                                dataList = [...extraArray, ...dataList,]
                                // console.log('额外补充的', dataList);
                            }
                            if (amountList.length && dataList.length) {
                                amountList = amountList.map((v, i) => Number(v) + Number(dataList[i]))
                            } else if (amountList.length === 0) {
                                amountList = dataList
                            }
                        }
                    })
                    // const PriceDifference = amountList[amountList.length - 1] - this.allCostGains * 100
                    const PriceDifference = 0
                    const fundAmount = amountList.filter(v => !isNaN(v)).map(v => ((v - PriceDifference) / 100).toFixed(1))
                    this.lastProfit = fundAmount[fundAmount.length - 1]
                    // console.log('fundAmount', fundAmount, amountList);
                    this.option.series = [
                        {
                            type: "line",
                            name: "涨幅",
                            data: fundAmount,
                        },
                    ];
                    this.option.xAxis.data = res[0].data.map((item) => item.pdate);
                    this.myChart.setOption(this.option);
                }).finally(() => {
                    this.loading = false;
                });
        },
        close () {
            this.boxShadow = false;
            this.$emit("close");
        },
    },
};
</script>

<style lang="scss" scoped>
.shadow {
    position: fixed;
    width: 100%;
    height: 100%;
    padding: 20px 2px;
    box-sizing: border-box;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.7);
    .content-box {
        max-width: 600px;
        background: #ffffff;
        border-radius: 15px;
        padding: 0 2px;
        margin: 0 auto;
        text-align: center;
        line-height: 1;
        vertical-align: middle;
        .subtitle {
            text-align: left;
            margin: 0 0 0 20px;
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
}
.shadow.darkMode {
    .content-box {
        background-color: #373737;
    }
    .btn {
        background-color: rgba($color: #ffffff, $alpha: 0.16);
        color: rgba($color: #ffffff, $alpha: 0.6);
        border: 1px solid rgba($color: #ffffff, $alpha: 0.6);
    }

    /deep/ .el-tabs--border-card {
        background-color: #373737;
        border: 1px solid rgba($color: #ffffff, $alpha: 0.37);
        .el-tabs__header {
            background-color: rgba($color: #ffffff, $alpha: 0.16);
            border-bottom: 1px solid rgba($color: #ffffff, $alpha: 0.37);

            .el-tabs__item.is-active {
                background-color: rgba($color: #409eff, $alpha: 0.6);
                color: rgba($color: #ffffff, $alpha: 0.6);
                border-right-color: rgba($color: #ffffff, $alpha: 0.37);
                border-left-color: rgba($color: #ffffff, $alpha: 0.37);
            }
        }
    }

    /deep/ .el-radio-button--mini .el-radio-button__inner {
        background-color: rgba($color: #ffffff, $alpha: 0.16);
        color: rgba($color: #ffffff, $alpha: 0.6);
        border: 1px solid rgba($color: #ffffff, $alpha: 0.37);
    }

    /deep/ .el-radio-button__orig-radio:checked + .el-radio-button__inner {
        background-color: rgba($color: #409eff, $alpha: 0.6);
        color: rgba($color: #ffffff, $alpha: 0.6);
        border-color: rgba($color: #409eff, $alpha: 0.37);
    }
}
.subtitle {
    text-align: left;
    margin: 10px 0 0 20px;
    &.up {
        color: #f56c6c;
    }
    &.down {
        color: #4eb61b;
    }
}
.box {
    width: 100%;
    height: 100%;
}
.main-echarts {
    width: 100%;
    height: 232px;
}
</style>
