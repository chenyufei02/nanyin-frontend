<!--suppress ALL -->
<template>
  <div class="dashboard-container" v-loading="loading">
    <div v-if="!loading && dashboardData">
      <h2 class="page-title">我的主页</h2>

      <el-row :gutter="20" class="top-section">
        <el-col :span="16">
          <el-card class="box-card user-profile-card" v-if="dashboardData.userProfile">
            <div slot="header" class="clearfix">
              <span><i class="el-icon-user-solid"></i> 基础信息</span>
            </div>
            <div class="user-profile-body">
              <div class="profile-header">
                <p class="welcome-text">
                  <strong>欢迎您，{{ dashboardData.userProfile.name || '新用户' }}</strong>
                </p>
                <div class="tags-container">
                  <el-tag type="success" style="margin-right: 5px;">稳健型投资者</el-tag>
                  <el-tag type="warning">长期持有</el-tag>
                </div>
              </div>

              <el-descriptions class="margin-top" :column="2" border>
                <el-descriptions-item>
                  <template slot="label"><i class="el-icon-male"></i><i class="el-icon-female"></i> 性别</template>
                  {{ dashboardData.userProfile.gender }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template slot="label"><i class="el-icon-date"></i> 年龄</template>
                  {{ userAge }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template slot="label"><i class="el-icon-briefcase"></i> 职业</template>
                  <el-tag size="small">{{ dashboardData.userProfile.occupation }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item>
                  <template slot="label"><i class="el-icon-postcard"></i> 证件类型</template>
                  {{ dashboardData.userProfile.idType }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template slot="label"><i class="el-icon-bank-card"></i> 证件号码</template>
                  {{ dashboardData.userProfile.idNumber }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template slot="label"><i class="el-icon-location-outline"></i> 联系地址</template>
                  {{ dashboardData.userProfile.address }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="box-card ai-card">
            <div slot="header"><span><i class="el-icon-magic-stick"></i> AI投资助手</span></div>
            <div class="ai-card-body">
              <p>获取一份为您量身定制的投资分析与建议报告。</p>
              <el-button type="primary" @click="fetchAISuggestion" :loading="aiLoading">立即生成</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="stats-section">
        <el-col :span="5">
          <div class="stat-card">
            <div class="stat-label">可用余额</div>
            <div class="stat-value">{{ formatCurrency(dashboardData.balance) }}</div>
          </div>
        </el-col>
        <template v-if="dashboardData.profitLossStats">
          <el-col :span="5"><div class="stat-card"><div class="stat-label">当前总价值</div><div class="stat-value">{{ formatCurrency(dashboardData.profitLossStats.totalMarketValue) }}</div></div></el-col>
          <el-col :span="5"><div class="stat-card"><div class="stat-label">累计总投资</div><div class="stat-value">{{ formatCurrency(dashboardData.profitLossStats.totalInvestment) }}</div></div></el-col>
          <el-col :span="4"><div class="stat-card"><div class="stat-label">累计总盈亏</div><div class="stat-value" :class="getProfitLossClass(dashboardData.profitLossStats.totalProfitLoss)">{{ formatCurrency(dashboardData.profitLossStats.totalProfitLoss, true) }}</div></div></el-col>
          <el-col :span="5"><div class="stat-card"><div class="stat-label">总盈亏率</div><div class="stat-value" :class="getProfitLossClass(dashboardData.profitLossStats.profitLossRate)">{{ formatPercentage(dashboardData.profitLossStats.profitLossRate) }}</div></div></el-col>
        </template>
        <el-col :span="19" v-else>
            <el-alert title="暂无投资数据" type="info" description="您还没有任何交易记录，暂无法计算盈亏。" show-icon :closable="false" class="no-stats-alert"></el-alert>
        </el-col>
      </el-row>

      <el-card class="box-card profile-section">
        <div slot="header" class="clearfix">
            <span><i class="el-icon-document"></i> 个人资料</span>
            <div style="float: right;">
                <el-button v-if="!isEditing" type="primary" size="small" icon="el-icon-edit" @click="toggleEdit(true)">编 辑</el-button>
                <el-button v-if="isEditing" type="success" size="small" icon="el-icon-check" @click="saveProfile">保 存</el-button>
                <el-button v-if="isEditing" size="small" @click="toggleEdit(false)">取 消</el-button>
            </div>
        </div>
        <el-form :model="profileForm" :rules="profileRules" ref="profileFormRef" label-width="100px" v-if="profileForm">
            <el-form-item label="账户余额">
              <span class="balance-text">{{ formatCurrency(profileForm.balance) }}</span>
            </el-form-item>
            <el-form-item label="真实姓名" prop="name"><span v-if="!isEditing">{{ profileForm.name }}</span><el-input v-else v-model="profileForm.name"></el-input></el-form-item>
            <el-form-item label="手机号" prop="phone"><span v-if="!isEditing">{{ profileForm.phone }}</span><el-input v-else v-model="profileForm.phone"></el-input></el-form-item>
            <el-form-item label="证件类型" prop="idType"><span v-if="!isEditing">{{ profileForm.idType }}</span><el-select v-else v-model="profileForm.idType" placeholder="请选择证件类型" style="width: 100%;"><el-option label="中华人民共和国居民身份证" value="身份证"></el-option></el-select></el-form-item>
            <el-form-item label="证件号码" prop="idNumber"><span v-if="!isEditing">{{ profileForm.idNumber }}</span><el-input v-else v-model="profileForm.idNumber"></el-input></el-form-item>
            <el-form-item label="性别" prop="gender"><span v-if="!isEditing">{{ profileForm.gender }}</span><el-select v-else v-model="profileForm.gender" placeholder="请选择性别" style="width: 100%;"><el-option label="男" value="男"></el-option><el-option label="女" value="女"></el-option></el-select></el-form-item>
            <el-form-item label="出生日期" prop="birthDate"><span v-if="!isEditing">{{ profileForm.birthDate }}</span><el-date-picker v-else v-model="profileForm.birthDate" type="date" placeholder="选择日期" style="width: 100%;"></el-date-picker></el-form-item>
            <el-form-item label="职业" prop="occupation"><span v-if="!isEditing">{{ profileForm.occupation }}</span><el-input v-else v-model="profileForm.occupation"></el-input></el-form-item>
            <el-form-item label="国籍" prop="nationality">
              <span v-if="!isEditing">{{ profileForm.nationality }}</span>
              <el-select
                  v-else
                  v-model="profileForm.nationality"
                  placeholder="请选择国籍"
                  filterable
                  style="width: 100%;" >
                  <el-option label="中国" value="中国"></el-option>
                  <el-option label="中国香港" value="中国香港"></el-option>
                  <el-option label="中国澳门" value="中国澳门"></el-option>
                  <el-option label="中国台湾" value="中国台湾"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="联系地址" prop="address"><span v-if="!isEditing">{{ profileForm.address }}</span><el-input v-else v-model="profileForm.address" type="textarea"></el-input></el-form-item>
        </el-form>
      </el-card>

    </div>
  </div>
</template>

<script>
// 导入所有需要的API函数和库

import moment from "moment";
import { getMyDashboard, updateMyProfile } from '@/api/user.js';
export default {
  name: 'UserDashboard',
  data() {
    return {
      // 页面整体加载状态
      loading: true,
      // AI建议按钮的加载状态
      aiLoading: false,
      // 存储从后端获取的所有主页数据
      dashboardData: null,
      // 控制个人资料是否处于编辑模式
      isEditing: false,
      // 个人资料表单的数据模型
      profileForm: {},
      // 存储原始的个人资料，用于取消编辑时恢复
      originalProfile: {},
      // 个人资料表单的验证规则
      profileRules: {
        name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
        phone: [
          { required: true, message: '请输入手机号', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
        ],
        idNumber: [
          { required: true, message: '请输入证件号码', trigger: 'blur' },
          { validator: this.validateIdNumber, trigger: 'blur' }
        ],
      }
    };
  },

  // 使用 watch 监听器来响应数据的变化
  watch: {

    /**
     * @description 监听身份证号输入框的变化，自动解析并填充出生日期和性别
     * @param {string} newValue - 新的身份证号
     */
    'profileForm.idNumber': function(newValue) {
      // 仅在编辑模式且输入为18位时触发
      if (this.isEditing && newValue && newValue.length === 18) {
        try {
          // 从身份证号中提取出生日期的年、月、日
          const year = newValue.substring(6, 10);
          const month = newValue.substring(10, 12);
          const day = newValue.substring(12, 14);
          const birthDateStr = `${year}-${month}-${day}`;

          // 验证提取的日期是否有效
          const date = new Date(birthDateStr);
          if (!isNaN(date.getTime())&& date.getFullYear() > 1900 && date.getFullYear() <= new Date().getFullYear()) {
            // 设置出生日期
            this.profileForm.birthDate = date;

            // 根据身份证号第17位判断性别（奇数为男，偶数为女）
            const genderBit = parseInt(newValue.charAt(16));
            this.profileForm.gender = genderBit % 2 === 1 ? '男' : '女';

            // 提示用户已自动填充
            this.$message.success('已根据身份证号自动填充出生日期和性别');
          }
        } catch (error) {
          console.error('监听器解析身份证出错:', error);
        }
      }
    }
  },

  // 计算属性
  computed: {
    //根据出生日期动态计算当前年龄
    userAge() {
      if (this.dashboardData && this.dashboardData.userProfile && this.dashboardData.userProfile.birthDate) {
        // 使用 moment.js 计算当前日期与出生日期的年份差
        return moment().diff(this.dashboardData.userProfile.birthDate, 'years');
      }
      return '未知';
    },
  },

  // created生命周期钩子，组件实例创建后立即调用
  created() {
    // 触发数据获取
    this.fetchDashboardData();
  },

  methods: {
    //核心方法：从后端异步获取所有主页所需的数据
    async fetchDashboardData() {
      this.loading = true;
      try {
        // 调用API获取数据并赋值给dashboardData，这将自动触发watch监听器
        this.dashboardData = await getMyDashboard();
        // 初始化个人资料表单，使用扩展运算符进行浅拷贝，避免直接修改原始数据
        if (this.dashboardData && this.dashboardData.userProfile) {
            this.profileForm = { ...this.dashboardData.userProfile, balance: this.dashboardData.balance };
            this.originalProfile = { ...this.profileForm };
        }

      } catch (error) {
        this.$message.error('主页数据加载失败，请刷新页面重试');
        console.error("加载主页数据失败:", error);
      } finally {
        this.loading = false;
      }
    },

    // 调用AI建议接口，并用弹窗展示结果
    async fetchAISuggestion() {
      this.$message.info('AI投资建议功能正在开发中，敬请期待！');
    },

    /**
     * @description 切换个人资料的编辑状态
     * @param {boolean} editing - true表示进入编辑状态，false表示退出
     */
    toggleEdit(editing) {
      this.isEditing = editing;
      // 如果是取消编辑，则恢复原始数据
      if (!editing) {
        this.profileForm = { ...this.originalProfile };
      }
    },

    /**
     * @description 保存更新后的个人资料
     */
    saveProfile() {
      // 对表单进行校验
      this.$refs.profileFormRef.validate(async (valid) => {
        if (!valid) return false;
        this.loading = true;
        try {
          // 创建一个用于提交的副本，并删除不需要的字段
          const submissionData = { ...this.profileForm };
          delete submissionData.userId;
          delete submissionData.balance;
          delete submissionData.id;
          delete submissionData.createTime;
          delete submissionData.updateTime;
          // 调用API更新个人资料
          const updatedProfileVO = await updateMyProfile(submissionData);
          // 更新成功后，将返回的数据更新到表单和原始数据中
          this.profileForm = { ...updatedProfileVO, balance: this.profileForm.balance };
          this.originalProfile = { ...this.profileForm };
          this.$message.success('个人资料保存成功！');
          this.isEditing = false;
        } catch (error) {
          this.$message.error('保存失败，请稍后重试');
        } finally {
          this.loading = false;
        }
      });
    },

    /**
     * @description 格式化货币显示
     * @param {number} value - 金额
     * @param {boolean} withSign - 是否带正负号
     * @returns {string} 格式化后的字符串
     */
    formatCurrency(value, withSign = false) {
      if (value == null || isNaN(value)) return '0.00 元';
      const sign = withSign && value > 0 ? '+' : '';
      return `${sign}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元`;
    },

    /**
     * @description 格式化百分比显示
     * @param {number} value - 小数形式的百分比
     * @returns {string} 格式化后的字符串
     */
    formatPercentage(value) {
      if (value == null || isNaN(value)) return '0.00%';
      const sign = value > 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}%`;
    },

    /**
     * @description 根据数值正负返回对应的CSS类名（用于盈亏显示）
     * @param {number} value - 数值
     * @returns {string} 'is-up'或'is-down'
     */
    getProfitLossClass(value) {
      if (value == null || value === 0) return '';
      return value > 0 ? 'is-up' : 'is-down';
    },

    /**
     * @description 身份证号码的自定义校验规则
     */
    validateIdNumber(rule, value, callback) {
      if (!value) {
        callback();
        return;
      }

      // 使用正则表达式验证身份证号码格式
      const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
      if (!reg.test(value)) {
        callback(new Error('请输入正确的身份证号码'));
        return;
      }

      // 18位身份证号码的进一步处理
      if (value.length === 18) {
        try {
          // 提取出生日期
          const year = value.substring(6, 10);
          const month = value.substring(10, 12);
          const day = value.substring(12, 14);
          const birthDateStr = `${year}-${month}-${day}`;

          const date = new Date(birthDateStr);
          if (isNaN(date.getTime())) {
            callback(new Error('身份证号中的出生日期无效'));
            return;
          }

          callback();
        } catch (error) {
          console.error('解析身份证出生日期出错:', error);
          callback(new Error('身份证号格式有误'));
        }
      } else {
        callback();
      }
    }
  }
};
</script>

<style scoped>
/* 样式部分 */
.dashboard-container {
  padding: 20px;
}
.page-title {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  margin-top: 0;
  margin-bottom: 20px;
}
.box-card {
  margin-bottom: 20px;
}
/* 顶部卡片行 Flex 布局，并拉伸等高 */
.top-section {
  display: flex;
  align-items: stretch;
}
.top-section .el-col {
  display: flex;
}
.top-section .el-card {
  width: 100%;
  display: flex;
  flex-direction: column;
}
.top-section .el-card >>> .el-card__body {
  flex-grow: 1;
}
/* 基础信息卡片顶部的 header 样式 */
.profile-header {
  display: flex;
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  margin-bottom: 15px; /* 与下方描述列表的间距 */
}
.profile-header .welcome-text {
  margin: 0; /* 移除 p 标签默认的上下边距 */
  font-size: 1.1rem; /* 调整字体大小 */
}
.tags-container {
  flex-shrink: 0; /* 防止标签被压缩 */
}
/* AI卡片内容垂直居中 */
.ai-card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
}
.stats-section {
  margin-bottom: 20px;
}
.stat-card {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  text-align: center;
  height: 100%;
}
.stat-label {
  color: #909399;
  margin-bottom: 10px;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
}
.is-up {
  color: #f56c6c;
}
.is-down {
  color: #67c23a;
}
.chart {
  height: 300px;
  width: 100%;
}
.profile-section .el-form-item__content span {
  color: #606266;
  line-height: 40px;
}
</style>