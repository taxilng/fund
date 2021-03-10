<template>
    <el-dialog title="" :custom-class="darkMode ? 'config-box darkMode' : 'config-box'" :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false" :visible="show" :before-close="close" width="400px" left>
        <div class="content" v-loading="loading" :element-loading-background="
        darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'
      ">
            <el-form :model="addForm" :rules="rules" ref="addForm" label-width="80px">
                <el-form-item label="用户名" prop="username">
                    <el-input v-model.trim="addForm.username" auto-complete="off" placeholder="" size="small"></el-input>
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input v-model.trim="addForm.password" show-password auto-complete="off" placeholder="" size="small"></el-input>
                </el-form-item>
                <el-form-item label="验证码" prop="captcha" v-if="captchaBase64">
                    <el-input v-model.trim="addForm.captcha" auto-complete="off" placeholder="" size="small" style="width: 180px;"></el-input>
                    <img style="vertical-align: middle;" :src="captchaBase64" @click="getVerify('refreshCaptcha')" alt="验证码">
                </el-form-item>
            </el-form>
        </div>

        <span slot="footer" class="dialog-footer">
            <div v-if="captchaBase64" style="text-align: center;">
                <el-button class="btn" type="primary" size="mini" @click="register" :loading="registerLoading">点击注册</el-button>
                <el-button class="btn" size="mini" @click="captchaBase64 = ''">去登录</el-button>
            </div>
            <div v-else style="text-align: center;">
                <el-button class="primary" type="primary" size="mini" @click="login" :loading="loginLoading">点击登录</el-button>
                <el-button class="btn" size="mini" @click="toregister">去注册</el-button>
            </div>
            <div style="text-align: center;margin-top: 10px;">
                <el-button class="primary" type="primary" size="mini" @click="close">返回</el-button>
            </div>
        </span>
    </el-dialog>
</template>

<script>

import { storage } from '@/untils/utils';
export default {
    props: {
        show: {
            type: Boolean,
            default: false,
        },
        top: {
            type: Number,
            default: 0,
        },
        darkMode: {
            type: Boolean,
            default: false,
        },
    },
    components: {
    },
    data () {
        return {
            addForm: {
                username: '',
                password: '',
                captcha: '',
            },
            rules: {
                username: [
                    { required: true, message: '用户名不能为空', trigger: 'onbur' }
                ],
                password: [
                    { required: true, message: '密码不能为空', trigger: 'onbur' }
                ],
                captcha: [
                    { required: true, message: '验证码不能为空', trigger: 'onbur' }
                ],
            },
            url: "https://2955b122-0e37-42a7-a4ee-4ddd503fe6b6.bspapp.com/http/user-center",
            loading: false,
            registerLoading: false,
            loginLoading: false,
            userId: null,
            captchaBase64: "",
        };
    },
    mounted () {
        storage.get('userId').then(res => {
            console.log('dai', res);
            this.userId = res.userId
        })
    },
    methods: {
        login () {
            this.$refs.addForm.validate((valid) => {
                if (valid) {
                    this.loginLoading = true
                    this.$axios.post(this.url, {
                        action: "login",
                        params: {
                            ...this.addForm,
                        }
                    }).then((res) => {
                        console.log('登录成功', res);
                        if (res && res.code === 0) {
                            this.$message({
                                message: "登录成功！",
                                type: "success",
                                center: true,
                            });
                            storage.set({
                                userInfo: res.userInfo,
                                token: res.token,
                            });
                            this.close('refresh')
                        } else {
                            this.$message({
                                message: res.message,
                                type: "error",
                                center: true,
                            });
                        }
                    }).finally(() => {
                        this.loginLoading = false
                    });
                } else {
                    // console.log('error submit!!');
                    return false;
                }

            })
        },
        register () {
            this.$refs.addForm.validate((valid) => {
                if (valid) {
                    this.registerLoading = true
                    this.$axios.post(this.url, {
                        action: "register",
                        params: {
                            ...this.addForm,
                            deviceId: this.userId,
                            scene: "register"
                        }
                    }).then((res) => {
                        console.log('注册成功', res);
                        if (res.success && res.result && res.result.code === 0) {
                            this.$notify.success({
                                title: res.result.msg
                            });
                            storage.set({
                                userInfo: res.result.userInfo,
                                token: res.result.token,
                            });
                            this.close('refresh')
                        } else if (res.success && res.result) {
                            let msg = ''
                            if (typeof res.result === 'object') {
                                msg = res.result.msg
                            } else {
                                msg = res.result
                            }
                            this.$notify.error({
                                title: msg
                            });
                            this.getVerify('refreshCaptcha')
                        } else {
                            this.$notify.error({
                                title: res.message
                            });
                            this.getVerify('refreshCaptcha')
                        }
                    }).finally(() => {
                        this.registerLoading = false
                    });
                } else {
                    // console.log('error submit!!');
                    return false;
                }

            })
        },
        toregister () {
            this.getVerify('createCaptcha')
        },
        getVerify (action) {
            this.$axios.post(this.url, {
                action,
                params: {
                    deviceId: this.userId,
                    scene: "register"
                }
            }).then((res) => {
                // console.log(11, res);
                this.captchaBase64 = res.captchaBase64;
            });
        },

        close (type) {
            this.$emit("update:show", false);
            if (type === 'refresh') {
                this.$emit("init");
            }
        },
    },
};
</script>

<style lang="scss" scoped>
/deep/.el-dialog__body {
    padding: 0px 20px;
}
/deep/.config-box.darkMode {
    color: rgba(255, 255, 255, 0.6);
    background-color: #373737;
    .el-form-item__label {
        color: rgba(255, 255, 255, 0.6);
    }
    .el-input__inner {
        background-color: rgba(255, 255, 255, 0.16);
        color: rgba(255, 255, 255, 0.6);
    }
    .btn {
        background-color: rgba(255, 255, 255, 0.16);
        color: rgba(255, 255, 255, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.6);
    }
    .primary {
        border: 1px solid rgba(64, 158, 255, 0.6);
        background-color: rgba(64, 158, 255, 0.6);
        color: rgba(255, 255, 255, 0.6);
    }
}
@media screen and (max-width: 500px) {
    /deep/.config-box {
        width: 100vw !important;
    }
}
</style>
