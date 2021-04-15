<template>
    <div v-if="boxShadow" class="shadow" :class="darkMode ? 'darkMode' : ''">
        <div class="content-box">
            <h5>当日收益曲线</h5>
            <el-tabs v-model="activeName" type="border-card" @tab-click="handleClick">
                <el-tab-pane lazy label="净值估算" name="first">
                    <charts :darkMode="darkMode" :fundAmount="fundAmount" :allAmount="allAmount" ref="first"></charts>
                </el-tab-pane>
            </el-tabs>

            <div class="tab-row">
                <input class="btn" type="button" value="返回列表" @click="close" />
            </div>
        </div>
    </div>
</template>

<script>
import charts from "./earningsDayCharts";
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
            fundAmount: [],
            activeName: "first",
            boxShadow: false,
        };
    },
    watch: {
        earningsDayDialogShow (val) {
            this.boxShadow = val
            this.init()
        },
    },
    mounted () { 
        // setTimeout(() => {
        //     console.log('allAmount', this.allAmount);
        // }, 1000);
    },
    methods: {
        handleClick (tab, event) {
            this.activeName = tab.name;
        },
        init () {
            console.log('mi', this.fundList);
            const fundCodeList = this.fundList
                .filter(v => Number(v.amount))
                .map(v => {
                    let url = `/FundMApi/FundVarietieValuationDetail.ashx?FCODE=${v.fundcode}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&_=${new Date().getTime()}`;
                    return this.$axios.get(url)
                })
            Promise.all(fundCodeList).then(res => {
                // console.log('zhja', res);
                let amountList = []
                res.forEach(v => {
                    const curFund = this.fundList.find(x => x.fundcode === v.Expansion.FCODE)
                    if (curFund) {
                        const amount = curFund.amount
                        let dataList = v.Datas
                            .map((item) => item.split(","))
                            .map(y => (y[2] * amount).toFixed(2))
                        // console.log('dia', dataList);
                        if (amountList.length && dataList.length) {
                            amountList = amountList.map((v, i) => Number(v) + Number(dataList[i]))
                        } else if(amountList.length === 0){
                            amountList = dataList
                        }
                    }
                })
                // console.log('amountList', amountList);
                this.fundAmount = amountList.filter(v => !isNaN(v)).map(v => (v / 100).toFixed(1))
                // console.log('fundAmount', this.fundAmount);
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
</style>
