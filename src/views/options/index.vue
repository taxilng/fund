<template>
    <div id="app" class="container" :class="containerClass">
        <div>
            <ul class="setting-list">
                <li>
                    <div>账号信息</div>
                    <template v-if="userInfo.username">
                        <div class="btn-row">
                            <span>欢迎登陆，{{userInfo.username}}</span>
                            <el-button type="danger" size="mini" style="margin-left: 20px;" @click="logout" :loading="logoutLoading">退出</el-button>
                        </div>
                        <div class="btn-row">
                            <el-button type="primary" size="mini" icon="el-icon-download" @click="getUserInfo" :loading="getUserInfoLoading">从云端同步</el-button>
                            <el-button type="primary" size="mini" icon="el-icon-upload" @click="updateUser" :loading="updateUserLoading">备份到云端</el-button>
                        </div>
                        <p>
                            tips：同步与备份数据会覆盖之前的数据，考虑到网络请求压力，目前跨设备同步需要手动点击同步备份按钮。
                        </p>
                    </template>
                    <template v-else>
                        <div style="padding: 15px;">
                            <button class="btn" @click="login">登陆/注册</button>
                        </div>
                        <p>
                            tips：登录账号后可以更加方便的进行跨设备跨平台同步个人信息。
                        </p>
                    </template>
                </li>
                <li>
                    <div class="list-title">
                        节假日信息
                        <button :disabled="disabled" @click="getHoliday" title="点击更新节假日信息" class="btn">
                            更新
                        </button>
                        <button @click="goBack" class="btn">
                            返回主页
                        </button>
                        <span class="loading" v-if="disabled">更新中。。。</span>
                    </div>
                    <p>
                        <span v-if="holiday">
                            当前版本：v{{
                holiday.version
              }}&nbsp;&nbsp;&nbsp;&nbsp;最后节假日日期：{{ holiday.lastDate }}
                        </span>
                    </p>
                    <p>
                        tips：更新节假日信息，可以在节假日暂停更新估值，节假日信息会不定时更新。
                        <a href="#" @click="openHoliday">查看最新版</a>
                    </p>
                </li>
                <li>
                    <div class="list-title">
                        主题设置
                    </div>
                    <div class="select-row">
                        <el-switch v-model="darkMode" @change="changeDarkMode" active-color="#484848" inactive-color="#13ce66" inactive-text="标准模式" active-text="暗色模式">
                        </el-switch>
                    </div>
                </li>
                <li>
                    <div class="list-title">
                        角标展示设置
                    </div>
                    <div class="select-row">
                        角标开关：
                        <el-radio-group v-model="showBadge" @change="changeOption($event, 'showBadge', true)">
                            <el-radio border :label="1">打开角标</el-radio>
                            <el-radio border :label="2">关闭角标</el-radio>
                        </el-radio-group>
                    </div>
                    <div v-if="showBadge == 1" class="select-row">
                        角标内容：
                        <el-radio-group v-model="BadgeContent" @change="changeOption($event, 'BadgeContent', true)">
                            <el-radio border :label="1">单个基金</el-radio>
                            <el-radio border :label="2">所有基金</el-radio>
                        </el-radio-group>
                    </div>
                    <div v-if="showBadge == 1" class="select-row">
                        角标类型：
                        <el-radio-group v-model="BadgeType" @change="changeOption($event, 'BadgeType', true)">
                            <el-radio border :label="1">日收益率</el-radio>
                            <el-radio border :label="2">日收益额</el-radio>
                        </el-radio-group>
                    </div>
                    <p style="margin-top:5px">
                        tips：若选择单个基金，请打开编辑按钮中的特别关注选项；若要计算收益额，需要先打开显示持有金额开关，在编辑中填写基金对应的持有额。
                    </p>
                </li>

                <li>
                    <div class="list-title">
                        基金列表展示内容设置
                    </div>
                    <div class="select-row">
                        <span>显示估算净值</span>
                        <el-switch v-model="showGSZ" @change="changeOption($event, 'showGSZ')">
                        </el-switch>
                    </div>
                    <div class="select-row">
                        <span>显示持有金额</span>
                        <el-switch v-model="showAmount" @change="changeOption($event, 'showAmount')">
                        </el-switch>
                    </div>
                    <div class="select-row">
                        <span>显示估值收益</span>
                        <el-switch v-model="showGains" @change="changeOption($event, 'showGains')">
                        </el-switch>
                    </div>
                    <div class="select-row">
                        <span>显示单个持有收益</span>
                        <el-switch v-model="showCost" @change="changeOption($event, 'showCost')">
                        </el-switch>
                    </div>
                    <div class="select-row">
                        <span>显示总持有收益</span>
                        <el-switch v-model="showAllCost" @change="changeOption($event, 'showAllCost')">
                        </el-switch>
                    </div>
                    <div class="select-row">
                        <span>显示总资产</span>
                        <el-switch v-model="showTotalAssets" @change="changeOption($event, 'showTotalAssets')">
                        </el-switch>
                    </div>
                    <div class="select-row">
                        <span>显示持仓占比</span>
                        <el-switch v-model="showProportion" @change="changeOption($event, 'showProportion')">
                        </el-switch>
                    </div>
                    <div class="select-row">
                        <span>显示持有收益率</span>
                        <el-switch v-model="showCostRate" @change="changeOption($event, 'showCostRate')">
                        </el-switch>
                    </div>
                    <p>
                        tips：在编辑设置里，输入持有份额可计算当日估值收益。输入持仓成本可计算累计持有收益。
                    </p>
                </li>
                <li>
                    <div class="list-title">
                        基金配置信息导入与导出
                    </div>
                    <div style="padding:8px 0 10px">
                        <input class="btn" type="button" value="导出配置文件" @click="exportConfig" />
                        <a class="exportBtn" ref="configMsg" :href="configHref" :download="`${timer}基金配置.json`"></a>
                        <a href="javascript:;" class="uploadFile btn">导入配置文件
                            <input ref="importInput" type="file" @change="importInput" />
                        </a>
                        <input class="btn" type="button" value="导入导出文本" @click="openConfigBox" />
                    </div>
                    <p>
                        tips：插件本身支持跟随浏览器账号自动同步，若想手动同步可使用导入导出功能。
                    </p>
                </li>
                <li>
                    <div class="list-title">请作者喝杯咖啡</div>
                    <!-- <p style="line-height:34px">
                        如果你觉得此插件对你有所帮助，或者想要支持一下我
                        <input class="btn primary" type="button" title="φ(>ω<*)" value="点击打赏" @click="reward" />
                    </p> -->
                    <p style="line-height:34px">
                        或者你也可以帮忙点一个star，点击查看源码→
                        <span title="点击查看项目源码" class="black icon-btn-row" @click="openGithub">
                            <svg class="githubIcon" height="24" viewBox="0 0 16 16" version="1.1" width="24" aria-hidden="true">
                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                            </svg>
                            <input class="btn black githubText" type="button" value="源代码" />
                        </span>
                        <img @click="openGitee" class="gitee" :src="darkMode ? giteeLogo1 : giteeLogo2" alt="">
                    </p>
                    <reward :top="50" ref="reward"></reward>
                </li>
                <li>
                    <!-- <div class="list-title">
                        关于插件
                    </div>
                    <p style="line-height:34px">
                        当前版本：v{{ version }}
                        <input class="btn" type="button" value="更新日志" @click="changelog" />
                    </p> -->
                    <change-log @close="closeChangelog" :darkMode="darkMode" ref="changelog" :top="40"></change-log>
                    <config-box @success="successInput" :darkMode="darkMode" ref="configBox" :top="40">
                    </config-box>
                </li>
            </ul>
        </div>
        <login :darkMode="darkMode" :show.sync="loginDialog" @init="initOption"></login>
    </div>
</template>

<script>
import login from "./login";
import reward from "../common/reward";
import changeLog from "../common/changeLog";
import configBox from "../common/configBox";
import { storage, chrome } from '@/untils/utils';
const { version } = require("../../../package.json");
export default {
    components: {
        reward,
        changeLog,
        configBox,
        login,
    },
    data () {
        return {
            giteeLogo1: require('@/assets/img/logo.svg'),
            giteeLogo2: require('@/assets/img/logo-black.svg'),
            configHref: null,
            holiday: null,
            disabled: false,
            showGSZ: false,
            showAmount: false,
            showGains: false,
            showCost: false,
            showAllCost: false,
            showTotalAssets: false,
            showProportion: false,
            showCostRate: false,
            darkMode: false,
            showBadge: 1,
            BadgeContent: 1,
            BadgeType: 1,
            changelogShadow: false,
            version,
            timer: null,
            loginDialog: false,
            userInfo: {},
            url: "/bspapp",
            updateUserLoading: false,
            getUserInfoLoading: false,
            logoutLoading: false,
        };
    },
    mounted () {
        this.initOption();
        const date = new Date()
        const year = date.getFullYear()
        const month = `0${date.getMonth() + 1}`.slice(-2)
        const day = `0${date.getDate()}`.slice(-2)
        this.timer = `${year}${month}${day}`
        console.log(this.timer);
    },
    watch: {},
    computed: {
        containerClass () {
            if (this.darkMode) {
                return "darkMode";
            }
        },
    },
    methods: {
        logout () {
            storage.get('token').then(res => {
                this.logoutLoading = true;
                this.$axios.post(this.url, {
                    action: 'logout',
                    uniIdToken: res.token,
                }).then((res) => {
                    console.log(11, res);
                    if (res && res.code === 0) {
                        this.$message({
                            message: "退出登录成功！",
                            type: "success",
                            center: true,
                        });
                        storage.set({
                            userInfo: {},
                            token: null,
                        });
                        this.initOption()
                    }
                }).finally(() => {
                    this.logoutLoading = false;
                });
            });
        },
        getUserInfo () {
            storage.get('token').then(res => {
                this.getUserInfoLoading = true;
                this.$axios.post(this.url, {
                    action: 'getUserInfo',
                    params: {
                        field: ['config_data']
                    },
                    uniIdToken: res.token,
                }).then((res) => {
                    console.log(11, res);
                    if (res && res.code === 0) {
                        if (res.userInfo && res.userInfo.config_data) {
                            const data = JSON.parse(res.userInfo.config_data)
                            storage.set(data, () => {
                                chrome.runtime.sendMessage({ type: "refresh" });
                            })
                            this.initOption()
                            this.$message({
                                message: "获取云端数据成功！",
                                type: "success",
                                center: true,
                            });
                        } else {
                            this.$message({
                                message: "云端暂无配置信息,请先备份数据到云端！",
                                type: "warning",
                                center: true,
                            });
                        }
                    } else {
                        this.$message({
                            message: "云端暂无配置信息,请先备份数据到云端！",
                            type: "warning",
                            center: true,
                        });
                    }
                }).finally(() => {
                    this.getUserInfoLoading = false;
                });
            });
        },
        updateUser () {
            storage.get(null).then(res => {
                console.log('123', res);
                const uniIdToken = res.token
                delete res.holiday;
                delete res.token;
                delete res.userInfo;
                const config_data = JSON.stringify(res);
                this.updateUserLoading = true;
                this.$axios.post(this.url, {
                    action: 'updateUser',
                    params: {
                        config_data
                    },
                    uniIdToken,
                }).then((res) => {
                    console.log(11, res);
                    if (res && res.code === 0) {
                        this.$message({
                            message: "备份到云端成功！",
                            type: "success",
                            center: true,
                        });
                    }
                }).finally(() => {
                    this.updateUserLoading = false;
                });
            });
        },
        login () {
            this.loginDialog = true
        },
        changelog () {
            this.changelogShadow = true;
            this.$refs.changelog.init();
        },
        closeChangelog () {
            this.changelogShadow = false;
            // storage.set(
            //   {
            //     version: this.localVersion,
            //   }
            // );
        },
        changeOption (val, type, sendMessage) {
            storage.set(
                {
                    [type]: val,
                },
                () => {
                    this[type] = val;
                    if (sendMessage) {
                        chrome.runtime.sendMessage({
                            type: "refreshOption",
                            data: { type: type, value: val },
                        });
                    }
                }
            );
        },
        initOption () {
            storage.get(
                [
                    "holiday",
                    "showNum",
                    "showAmount",
                    "showGains",
                    "showCost",
                    "showAllCost",
                    "showTotalAssets",
                    "showProportion",
                    "showCostRate",
                    "showGSZ",
                    "darkMode",
                    "showBadge",
                    "BadgeContent",
                    "BadgeType",
                    "userInfo",
                ])
                .then(
                    (res) => {
                        if (res.showNum) {
                            //解决版本遗留问题，拆分属性
                            storage.set({
                                showNum: false,
                            });
                            storage.set(
                                {
                                    showAmount: true,
                                },
                                () => {
                                    this.showAmount = true;
                                }
                            );
                            storage.set(
                                {
                                    showGains: true,
                                },
                                () => {
                                    this.showGains = true;
                                }
                            );
                        } else {
                            this.showAmount = res.showAmount ? res.showAmount : false;
                            this.showGains = res.showGains ? res.showGains : false;
                        }

                        if (res.holiday) {
                            this.holiday = res.holiday;
                        } else {
                            this.getHoliday();
                        }
                        this.showGSZ = res.showGSZ ? res.showGSZ : false;
                        this.showCost = res.showCost ? res.showCost : false;
                        this.showAllCost = res.showAllCost ? res.showAllCost : false;
                        this.showTotalAssets = res.showTotalAssets ? res.showTotalAssets : false;
                        this.showProportion = res.showProportion ? res.showProportion : false;
                        this.showCostRate = res.showCostRate ? res.showCostRate : false;
                        this.darkMode = res.darkMode ? res.darkMode : false;
                        this.showBadge = res.showBadge ? res.showBadge : 1;
                        this.BadgeContent = res.BadgeContent ? res.BadgeContent : 1;
                        this.BadgeType = res.BadgeType ? res.BadgeType : 1;

                        // console.log('mi', res);
                        if (res.userInfo) {
                            this.userInfo = res.userInfo
                        }
                    }
                );
        },
        exportConfig () {
            storage.get(null).then((res) => {
                delete res.holiday;
                this.configHref = "data:text/plain," + JSON.stringify(res);
                setTimeout(() => {
                    this.$refs["configMsg"].click();
                }, 200);
            });
        },
        importInput (e) {
            let files = e.target.files;
            if (!files || !files.length) {
                throw new Error("No files");
            }

            let reader = new FileReader();
            reader.onload = (event) => {
                try {
                    let config = JSON.parse(event.target.result);
                    storage.set(config, (val) => {
                        this.initOption();
                        chrome.runtime.sendMessage({ type: "refresh" });
                        this.$message({
                            message: "恭喜,导入配置成功！",
                            type: "success",
                            center: true,
                            duration: 1000,
                        });
                        this.$refs.importInput.value = null;
                    });
                    return config;
                } catch (e) {
                    this.$message({
                        message: "导入失败！",
                        type: "error",
                        center: true,
                        duration: 1000,
                    });
                }
            };
            reader.readAsText(files[0]);
        },
        successInput () {
            this.initOption();
            chrome.runtime.sendMessage({ type: "refresh" });
        },
        openConfigBox () {
            this.$refs.configBox.init();
        },
        getHoliday () {
            this.disabled = true;
            let url = "/rabt/funds/holiday.json";
            this.$axios.get(url).then((res) => {
                console.log(11, res);
                storage.set(
                    {
                        holiday: res,
                    },
                    () => {
                        this.holiday = res;
                        this.disabled = false;
                    }
                );
            });
        },
        goBack () {
            this.$router.push('/')
        },
        openHoliday () {
            window.open("/rabt/funds/holiday.json");
        },
        openGithub () {
            window.open("https://github.com/taxilng/fund");
        },
        openGitee () {
            window.open("https://gitee.com/taxilng/fund");
        },
        openTG () {
            window.open("https://qm.qq.com/cgi-bin/qm/qr?k=IqIeXL1L8aYnNyXZJbWWTMT3x3thfxPu&jump_from=webapi");
        },
        reward (data) {
            this.$refs.reward.init();
        },
        changeDarkMode () {
            storage.set({
                darkMode: this.darkMode,
            });
        },
    },
};
</script>

<style lang="less" scoped>
.container {
    min-width: 300px;
    min-height: 520px;
    text-align: center;
    padding: 15px 0;
    font-size: 13px;
    font-family: "Helvetica Neue", Helvetica, Arial, "PingFang SC",
        "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "WenQuanYi Micro Hei",
        sans-serif;
}

.setting-list {
    // width: 600px;
    margin: 0 auto;
    text-align: left;
    padding: 0 10px 10px;
    border-radius: 8px;
    .btn-row {
        padding: 7px 30px;
    }
}

.setting-list li {
    list-style: none;
    font-size: 16px;
    border-bottom: 1px solid #dddddd;
    padding: 10px 0;
}

.setting-list li p {
    margin: 0;
    font-size: 14px;
    color: #999999;
}

.list-title {
    min-height: 34px;
    line-height: 34px;
    font-weight: bold;
}

.select-row {
    line-height: 35px;
    padding-left: 20px;
    & > span {
        display: inline-block;
        width: 130px;
        margin-right: 3px;
        text-align: right;
    }
    input,
    label {
        cursor: pointer;
    }

    .el-radio {
        margin-right: 0;
    }
}

.btn {
    display: inline-block;
    line-height: 1;
    cursor: pointer;
    background: #fff;
    padding: 6px 8px;
    border-radius: 3px;
    font-size: 14px;
    color: #000000;
    margin: 0 5px;
    outline: none;
    border: 1px solid #dcdfe6;
}

.exportBtn {
    visibility: hidden;
}

.uploadFile {
    text-decoration: none;
    display: inline-flex;
    position: relative;
    overflow: hidden;
}

.uploadFile input {
    position: absolute;
    font-size: 100px;
    cursor: pointer;
    right: 0;
    top: 0;
    opacity: 0;
}

.btn[disabled] {
    color: #aaaaaa;
}

.icon-btn-row {
    position: relative;
    cursor: pointer;
}

.githubIcon {
    position: absolute;
    top: 4px;
    left: 12px;
}
.githubText {
    padding-left: 30px;
    padding: 8px 8px 8px 36px;
}

.tips {
    font-size: 12px;
    margin: 0;
    color: #aaaaaa;
    line-height: 1.4;
    padding: 5px 15px;
}
.primary {
    color: #409eff;
    border-color: #409eff;
}

.black {
    display: inline-block;
    color: #24292e;
    border-color: #24292e;
}

//暗黑主题
.container.darkMode {
    color: rgba( 255, 255, 255,  0.6);
    background-color: #121212;
    .btn {
        background-color: rgba( 255, 255, 255,  0.16);
        color: rgba( 255, 255, 255,  0.6);
        border: 1px solid rgba( 255, 255, 255,  0.6);
    }
    .primary {
        border: 1px solid rgba(64, 158, 255, 0.6);
        background-color: rgba(64, 158, 255, 0.6);
    }

    .setting-list {
        background-color: rgba( 255, 255, 255,  0.11);
    }

    .setting-list li {
        border-bottom: 1px solid rgba( 255, 255, 255,  0.38);
    }

    /deep/ .el-switch__label.is-active {
        color: rgba(64, 158, 255, 0.87);
    }
    /deep/ .el-switch__label {
        color: rgba( 255, 255, 255,  0.6);
    }

    /deep/ .el-switch.is-checked .el-switch__core {
        border: 1px solid rgba(64, 158, 255, 0.6);
        background-color: rgba(64, 158, 255, 0.6);
    }

    /deep/ .el-radio__input.is-checked + .el-radio__label {
        color: rgba(64, 158, 255, 0.87);
    }
    /deep/ .el-radio__input.is-checked .el-radio__inner {
        background-color: rgba(64, 158, 255, 0.6);
        border: 1px solid rgba(64, 158, 255, 0.6);
    }
    /deep/ .el-radio.is-bordered.is-checked {
        border: 1px solid rgba(64, 158, 255, 0.6);
    }
    /deep/ .el-radio.is-bordered {
        border: 1px solid rgba( 255, 255, 255,  0.6);
    }
    /deep/ .el-radio {
        color: rgba( 255, 255, 255,  0.6);
    }
    .gitee {
        border: 1px solid rgba(255, 255, 255, 0.6);
    }
}

.gitee {
    width: 60px;
    border: 1px solid #000;
    padding: 5px;
    vertical-align: top;
    margin-top: 2px;
    border-radius: 3px;
    cursor: pointer;
}
</style>
