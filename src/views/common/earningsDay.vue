<template>
    <div v-if="boxShadow" class="shadow" :class="darkMode ? 'darkMode' : ''">
        <div class="content-box" v-loading="loading" element-loading-background="rgba(0, 0, 0, 0.8)">
            <div id="copyImage">
                <h5>当日收益曲线</h5>
                <div class="subtitle">
                    <span>当前收益：</span><span :class="latestAmout >= 0 ? 'up' : 'down'">{{latestAmout}} ({{latestRate}})</span>
                    <span style="margin-left:20px;"> 波动：{{wave.difference}}（{{wave.differenceRate}}）</span>
                    <div style="margin-top:10px;">
                        <span>最高：</span> <span :class="wave.max >= 0 ? 'up' : 'down'">{{wave.max}}({{wave.maxRate}})</span>
                        <span style="margin-left:20px;">最低：</span> <span :class="wave.min >= 0 ? 'up' : 'down'">{{wave.min}}({{wave.minRate}})</span>
                    </div>
                </div>
                <!-- <el-tabs v-model="activeName" type="border-card" @tab-click="handleClick">
                <el-tab-pane lazy label="净值估算" name="first"> -->
                <charts :darkMode="darkMode" :fundAmount="fundAmount" :allAmount="allAmount" ref="first"></charts>
                <!-- </el-tab-pane>
            </el-tabs> -->
            </div>
            <div class="tab-row">
                <input class="btn" type="button" value="返回列表" @click="close" />
                <input class="btn" type="button" value="刷新" @click="init" />
                <input class="btn" type="button" value="复制图片" @click="copy" />
            </div>
        </div>
    </div>
</template>

<script>
import charts from "./earningsDayCharts";
import html2canvas from 'html2canvas';
export default {
    components: {
        charts,
    },
    name: "fundDetail",
    props: {
        darkMode: {
            type: Boolean,
            default: false,
        },
        fundList: {
            type: Array,
            required: true,
        },
        earningsDayDialogShow: {
            type: Boolean,
            default: false,
        },
        allAmount: {
            type: String,
            default: '1',
        },
    },
    data () {
        return {
            loading: false,
            fundAmount: [],
            activeName: "first",
            boxShadow: false,
        };
    },
    computed: {
        latestAmout () {
            return this.fundAmount[this.fundAmount.length - 1]
        },
        latestRate () {
            return `${(this.latestAmout / this.allAmount * 100).toFixed(2)}%`
        },
        wave () {
            const max = Math.max.apply(Math, this.fundAmount)
            const min = Math.min.apply(Math, this.fundAmount)
            let difference = 0
            if (isFinite(max)) {
                difference = (max - min).toFixed(2)
            }
            // console.log('difference',difference,max, this.fundAmount);
            return {
                difference,
                differenceRate: `${(difference / this.allAmount * 100).toFixed(2)}%`,
                max,
                maxRate: `${(max / this.allAmount * 100).toFixed(2)}%`,
                min,
                minRate: `${(min / this.allAmount * 100).toFixed(2)}%`,
            }
        }
    },
    watch: {
        earningsDayDialogShow (val) {
            this.boxShadow = val
            if (val) {
                this.init()
            }
        },
    },
    mounted () {
        // setTimeout(() => {
        //     console.log('allAmount', this.allAmount);
        // }, 1000);
    },
    methods: {
        copy () {
            html2canvas(document.querySelector('#copyImage')).then(function (canvas) {
                console.log('can', canvas);
                canvas.toBlob((blob) => {
                    console.log('233,', blob);
                    const clipboardItem = new ClipboardItem({ 'image/png': blob });
                    navigator.clipboard.write([clipboardItem]);
                }, 'image/png');
            });
        },
        handleClick (tab, event) {
            this.activeName = tab.name;
        },
        init () {
            this.loading = true;
            // console.log('mi', this.fundList);
            const fundCodeList = this.fundList
                .filter(v => Number(v.amount))
                .map(v => {
                    let url = `/FundMApi/FundVarietieValuationDetail.ashx?FCODE=${v.fundcode}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&_=${new Date().getTime()}`;
                    return this.$axios.get(url)
                })
            Promise.all(fundCodeList).then(res => {
                // console.log('zhja', res);
                const maxlength = Math.max.apply(Math, res.map(v => v.Datas.length))
                // console.log('maxlength', maxlength);
                let amountList = []
                res.forEach(v => {
                    const curFund = this.fundList.find(x => x.fundcode === v.Expansion.FCODE)
                    if (curFund) {
                        const amount = curFund.amount
                        let dataList = v.Datas
                            .map((item) => item.split(","))
                            .map(y => (y[2] * amount).toFixed(2))
                        // console.log('dia', dataList);
                        // 拿不到的数据，以最新的净值来估算
                        if (dataList.length < maxlength) {
                            const lastGSZZL = v.Expansion.GSZZL
                            const estimatedRevenue = (lastGSZZL * amount).toFixed(2)
                            const extraArray = new Array(maxlength - dataList.length).fill(estimatedRevenue)
                            dataList = [...dataList, ...extraArray]
                            // console.log('额外补充的', extraArray);
                        }
                        if (amountList.length && dataList.length) {
                            amountList = amountList.map((v, i) => Number(v) + Number(dataList[i]))
                        } else if (amountList.length === 0) {
                            amountList = dataList
                        }
                    }
                })
                // console.log('amountList', amountList);
                this.fundAmount = amountList.filter(v => !isNaN(v)).map(v => (v / 100).toFixed(1))
                // console.log('fundAmount', this.fundAmount);
            }).finally(() => {
                this.loading = false;
            })
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
}

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
    .content-box, #copyImage {
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
</style>
