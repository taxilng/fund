<template>
    <el-dialog title="提示" :visible.sync="addDialog" width="300px" :before-close="handleClose">
        <div>
            因为本人阿里云于2021年11月6日到期。所以我重新找了个免费的服务器用部署。大家可以点击 <a href="https://fundsforweb.netlify.app" target="_blank" style="color: red;">新基金网页版</a> 来访问。因为是国外服务器，速度较慢。<br /><br />大家的基金数据可以通过设置中的账号同步，导出配置文件，导出文本三种方式来同步到新的网站上。
<br/><br />补充一个新的链接，布置在阿里云上，速度较快<a href="http://120.26.91.101:8088/" target="_blank" style="color: red;">新基金网页版2</a>
        </div>
        <span slot="footer" class="dialog-footer">
            <el-button size="small" @click="day = 7;handleClose();">7天内不再提示</el-button>
            <el-button size="small" type="primary" @click="handleClose">确 定</el-button>
        </span>
    </el-dialog>
</template>

<script>
export default {
    props: {
        addDialog: {
            type: Boolean,
            default: false
        },
    },
    data () {
        return {
            day: 1
        };
    },
    methods: {
        handleClose () {
            console.log('我的天', this.day);
            const timer = Date.now() + this.day * 24 * 3600 * 1000
            localStorage.setItem('popupTimeout', timer)
            this.$emit("update:addDialog", false);
        }
    }
};
</script>

<style>
</style>