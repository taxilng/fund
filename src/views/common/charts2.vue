<template>
    <div class="box" v-loading="loading" :element-loading-background="
      darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'
    ">
        <div class="subtitle" :class="upRate.slice(0, -1) >= 0 ? 'up' : 'down'">本基金涨幅 {{upRate}}%</div>
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
    </div>
</template>

<script>
let echarts = require("echarts/lib/echarts");

import "./js/customed.js";
import "./js/dark.js";

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
        fund: {
            type: Object,
            required: true,
        },
        chartType: {
            type: String,
            required: true,
        },
    },
    data () {
        return {
            upRate: '',
            chartEL: null,
            myChart: null,
            minVal: null,
            maxVal: null,
            interVal: null,
            sltTimeRange: "y",
            chartTypeList: {
                // DWJZ: {
                //   name: "单位净值",
                // },
                LJJZ: {
                    name: "累计净值",
                },
            },
            option: {},
            loading: false,
        };
    },
    watch: {
        fund () {
            this.init()
        }
    },
    computed: {
        defaultColor () {
            return this.darkMode ? "rgba(255,255,255,0.6)" : "#ccc";
        },
    },
    mounted () {
        this.init();
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
                legend: {
                    show: true,
                    selected: { '沪深300': false, }
                },
                tooltip: {
                    trigger: "axis",
                    formatter: (p) => {
                        return `时间：${p[0].name}<br />${this.chartTypeList[this.chartType].name
                            }：${p[0].value}`;
                    },
                },
                grid: {
                    top: 30,
                    left: 40,
                    right: 0,
                    bottom: 30,
                },
                xAxis: {
                    type: "category",
                    data: [],
                    axisLabel: {
                        showMaxLabel: false,
                    },
                },
                yAxis: {
                    type: "value",
                    scale: true,
                    axisLabel: {
                        color: this.defaultColor,
                        formatter: (val) => {
                            return val + "%";
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
        changeTimeRange (val) {
            this.getData();
        },
        handle_num_range (data) {
            var _aa = Math.max.apply(null, data);
            var _bb = Math.min.apply(null, data);
            return [_aa, _bb];
        },
        getData () {
            this.loading = true;
            const that = this
            const ljsy = () => {
                let url = `https://dataapi.1234567.com.cn/dataapi/fund/FundVPageAcc`;
                return this.$axios.get(url, {
                    params: {
                        INDEXCODE: '000300',
                        CODE: this.fund.fundcode,
                        FCODE: this.fund.fundcode,
                        RANGE: this.sltTimeRange,
                        deviceid: 'wap',
                        product: 'EFund',
                    }
                })
            }
            const ljjz = () => {
                let url = `/FundMApi/FundNetDiagram.ashx`;
                return this.$axios.get(url, {
                    params: {
                        FCODE: this.fund.fundcode,
                        RANGE: this.sltTimeRange,
                        deviceid: 'Wap',
                        plat: 'Wap',
                        product: 'EFund',
                        version: '2.0.0',
                        _: new Date().getTime(),
                    }
                })
            }
            const jzgs = () => {
                let url = `/FundMApi/FundVarietieValuationDetail.ashx`;
                return this.$axios.get(url, {
                    params: {
                        FCODE: this.fund.fundcode,
                        deviceid: 'Wap',
                        plat: 'Wap',
                        product: 'EFund',
                        version: '2.0.0',
                        _: new Date().getTime(),
                    }
                })
            }
            this.$axios.all([ljsy(), ljjz(), jzgs()]).then(
                // this.$axios.spread((res1, res2) => {
                //     console.log('xina', res1, res2);
                // })
                res => {
                    this.loading = false;
                    const [data1, data2, data3] = res
                    // console.log('xin', data1, data2, data3);
                    this.upRate = data1.expansion.syl || data1.data[data1.data.length - 1].yield
                    const result = data1.data.map(v => {
                        const { JZZZL } = data2.Datas.find(x => x.FSRQ === v.pdate) || { JZZZL: 0 }
                        return { ...v, JZZZL }
                    })
                    const flag = result.some(v => v.pdate === data3.Expansion.GZTIME.slice(0, 10))
                    if(!flag) {
                        result.push({
                            pdate: data3.Expansion.GZTIME.slice(0, 10) + '（估）',
                            JZZZL: data3.Expansion.GSZZL,
                            yield: (Number(this.upRate) + Number(data3.Expansion.GSZZL)).toFixed(2),
                        })
                    }
                    // console.log('result', result);
                    this.option.tooltip.formatter = (p) => {
                        let str =
                            p.length > 1 ? `<br />${p[1].seriesName}：${p[1].value}%` : "";
                        // console.log('提示', p);
                        return `时间：${p[0].name}<br />
                        ${p[0].seriesName}：${p[0].value}%
                        <br />日增长率：${result[p[0].dataIndex].JZZZL}%
                        ${str}`;
                    };
                    this.option.series = [
                        {
                            type: "line",
                            name: "涨幅",
                            data: result.map((item) => +item.yield),
                        },
                        {
                            type: "line",
                            name: '沪深300',
                            data: result.map((item) => +item.indexYield),
                        },
                    ];
                    this.option.xAxis.data = result.map((item) => item.pdate);
                    this.myChart.setOption(this.option);
                }
            )
        },
    },
};
</script>

<style lang="less" scoped>
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
