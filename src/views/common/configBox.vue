<template>
  <div v-if="configShadow" class="shadow">
    <div class="config-box" :style="{ marginTop: top + 'px' }">
      <div class="tab-row">
        <button
          @click="checked = 'export'"
          :class="checked == 'export' ? 'checked' : ''"
        >
          导出
        </button>
        <button
          @click="checked = 'import'"
          :class="checked == 'import' ? 'checked' : ''"
        >
          导入
        </button>
      </div>
      <div class="tab-content" v-if="checked == 'export'">
        <el-input
          type="textarea"
          :rows="15"
          placeholder="请输入内容"
          v-model="exportConfigStr"
        >
        </el-input>
        <input
          class="btn success"
          type="button"
          value="复制到剪贴板"
          v-clipboard:copy="exportConfigStr"
          v-clipboard:success="copy"
          v-clipboard:error="onError"
        />
      </div>
      <div class="tab-content" v-else>
        <el-input
          type="textarea"
          :rows="15"
          placeholder="请在此输入框粘贴配置文本"
          v-model="inputConfigStr"
        >
        </el-input>
        <input
          class="btn success"
          type="button"
          value="提交配置文本"
          @click="importInput"
        />
      </div>

      <div class="tab-row">
        <input class="btn" type="button" value="返回" @click="close" />
      </div>
    </div>
  </div>
</template>

<script>
import { storage } from '@/untils/utils';

export default {
  components: {},
  name: "configBox",
  props: {
    top: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      configShadow: false,
      checked: "export",
      textarea: "",
      exportConfigStr: null,
      inputConfigStr: null,
    };
  },
  watch: {},
  mounted() {},
  methods: {
    init() {
        console.log('43434');
      this.configShadow = true;
      this.inputConfigStr = null;
      storage.get(null).then(res=> {
        console.log('123', res);
        delete res.holiday;
        this.exportConfigStr = JSON.stringify(res);
      });
    },
    close() {
      this.configShadow = false;
      this.$emit("close", false);
    },
    exportConfig() {},
    copy(e) {
      this.$message({
        message: "已复制到剪贴板，请自行保存！",
        type: "success",
        center: true,
      });
    },
    onError(e) {},
    importInput() {
      try {
        if (typeof JSON.parse(this.inputConfigStr) == "object") {
          let config = JSON.parse(this.inputConfigStr);

          storage.set(config, (val) => {
            this.$emit("success", false);

            this.$message({
              message: "恭喜,导入配置成功！",
              type: "success",
              center: true,
            });
          });
        }
      } catch (e) {
        this.$message({
          message: "导入失败，配置文本格式不正确！",
          type: "error",
          center: true,
        });
      }
    },
  },
};
</script>

<style lang="less" scoped>
.shadow {
  position: fixed;
  width: 100%;
  height: 100%;
  padding: 20px 40px;
  box-sizing: border-box;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.7);
}

.config-box {
  background: #ffffff;
  border-radius: 15px;
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
  line-height: 1;
  vertical-align: middle;
  font-size: 0;
  .tab-content {
    .btn {
      margin: 15px 0 5px;
    }
  }
}

.config-box button {
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
  background: #fff;
  border: 1px solid #dcdfe6;
  font-weight: 500;
  border-left: 0;
  color: #606266;
  -webkit-appearance: none;
  text-align: center;
  box-sizing: border-box;
  margin: 0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  padding: 12px 20px;
  font-size: 14px;
  max-width: 150px;
  position: relative;
  display: inline-block;
  outline: none;
}

.config-box button:first-child {
  border-left: 1px solid #dcdfe6;
  border-radius: 4px 0 0 4px;
  box-shadow: none !important;
}

.config-box button:last-child {
  border-radius: 0 4px 4px 0;
}

.config-box button.checked {
  color: #fff;
  background-color: #409eff;
  border-color: #409eff;
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

.tips {
  font-size: 12px;
  margin: 0;
  color: #aaaaaa;
  line-height: 1.4;
  padding: 5px 15px;
}

.reward-tips {
  padding: 0 50px;
  margin-top: 5px;
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
.success {
  color: #4eb61b;
  border-color: #4eb61b;
}

.darkMode .config-box {
  color: rgba( 255, 255, 255,  0.6);
  background-color: #373737;
  .btn {
    background-color: rgba( 255, 255, 255,  0.16);
    color: rgba( 255, 255, 255,  0.6);
    border: 1px solid rgba( 255, 255, 255,  0.6);
  }
  .success {
    border: 1px solid rgba(78, 182, 27, 0.6);
    background-color: rgba(78, 182, 27, 0.6);
  }

  button {
    background-color: rgba( 255, 255, 255,  0.16);
    color: rgba( 255, 255, 255,  0.6);
    border: 1px solid rgba( 255, 255, 255,  0.38);
  }

  button.checked {
    color: rgba( 255, 255, 255,  0.6);
    border: 1px solid rgba(64, 158,  0.38);
    background-color: rgba(64, 158,  0.6);
  }
}
</style>
