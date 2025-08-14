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
        <el-col :span="5"><div class="stat-card"><div class="stat-label">可用余额</div><div class="stat-value">{{ formatCurrency(dashboardData.balance) }}</div></div></el-col>
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

      <el-row :gutter="20" class="charts-section">
        <el-col :span="12">
          <el-card class="box-card"><div slot="header"><span>持仓占比 (环形图)</span></div><div ref="assetAllocationPieChart" class="chart"></div></el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="box-card"><div slot="header"><span>资产配置 (雷达图)</span></div><div ref="assetAllocationRadarChart" class="chart"></div></el-card>
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
import { getMyDashboard, getAISuggestion, updateMyProfile } from '@/api/user.js';
import * as echarts from 'echarts';
import moment from "moment";

export default {
  name: 'UserDashboard',
  data() {
    return {
      // 页面加载状态
      loading: true,
      aiLoading: false,
      // 存储从后端获取的所有主页数据
      dashboardData: null,

      // 个人资料模块所需的数据
      isEditing: false,
      profileForm: {},
      originalProfile: {},
      profileRules: {
        name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
        phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
        idNumber: [{ required: true, message: '请输入证件号码', trigger: 'blur' }],
        // ... 其他规则
      }
    };
  },

  // --- 【【【 核心修正：使用 watch 监听器 】】】 ---
  watch: {
    // 监听 dashboardData 属性的变化
    dashboardData(newData, oldData) {
      // 当 newData 不为空 (数据从后端成功返回) 且 oldData 为空 (首次加载)
      if (newData && !oldData) {
        // 数据已经有了，Vue会去更新DOM。我们使用$nextTick确保在DOM更新后才画图。
        this.$nextTick(() => {
          this.initCharts();
        });
      }
    }
  },

  computed: {
    // --- 【【【 新增这个计算属性 】】】 ---
    userAge() {
      if (this.dashboardData && this.dashboardData.userProfile && this.dashboardData.userProfile.birthDate) {
        // 使用 moment.js 根据出生日期计算当前年龄
        return moment().diff(this.dashboardData.userProfile.birthDate, 'years');
      }
      return '未知';
    },

    // ... (其他所有 computed 属性如 formatCurrency 等保持不变) ...
  },

  created() {
    // created 钩子现在只负责触发数据获取
    this.fetchDashboardData();
  },

  methods: {
    /**
     * 核心方法：从后端获取所有主页所需的数据
     */
    async fetchDashboardData() {
      this.loading = true;
      try {
        // 获取数据并赋值，这将自动触发上面的 watch 监听器
        this.dashboardData = await getMyDashboard();

        // 【重要】这里的 console.log 可以保留用于调试，也可以删掉
        console.log("后端返回的主页原始数据:", this.dashboardData);

        // 初始化个人资料表单
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

    /**
     * 调用AI建议接口，并用弹窗展示结果
     */
    async fetchAISuggestion() {
        this.aiLoading = true;
        try {
            const suggestion = await getAISuggestion();
            this.$alert(suggestion.replace(/\n/g, '<br/>'), 'AI投资建议', {
                confirmButtonText: '关闭',
                dangerouslyUseHTMLString: true
            });
        } catch (error) {
            this.$message.error('AI建议生成失败');
        } finally {
            this.aiLoading = false;
        }
    },

    /**
     * 初始化所有图表的总调度方法
     */
    initCharts() {
      if (!this.dashboardData) return;
      this.initAssetAllocationPieChart();
      this.initAssetAllocationRadarChart();
    },

    /**
     * 初始化持仓占比环形图
     */
    initAssetAllocationPieChart() {
      const chartDom = this.$refs.assetAllocationPieChart;
      // 增加一个额外的保护，确保DOM元素存在
      if (!chartDom) return;
      if (!this.dashboardData.assetAllocationJson || this.dashboardData.assetAllocationJson === '{}') {
        chartDom.innerHTML = '<div class="chart-empty-text">暂无持仓数据</div>';
        return;
      }
      const myChart = echarts.init(chartDom);
      const data = JSON.parse(this.dashboardData.assetAllocationJson);
      const chartData = Object.keys(data).map(key => ({ name: key, value: data[key] }));
      const option = {
        tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c}元 ({d}%)' },
        legend: { top: 'bottom' },
        series: [{
          name: '持仓分布',
          type: 'pie',
          radius: ['40%', '70%'],
          data: chartData,
        }]
      };
      myChart.setOption(option);
    },

    /**
     * 【核心修正】初始化资产配置雷达图，动态计算坐标轴最大值
     */
    initAssetAllocationRadarChart() {
      const chartDom = this.$refs.assetAllocationRadarChart;
      if (!chartDom) return;
      if (!this.dashboardData.assetAllocationJson || this.dashboardData.assetAllocationJson === '{}') {
          chartDom.innerHTML = '<div class="chart-empty-text">暂无持仓数据</div>';
          return;
      }
      const myChart = echarts.init(chartDom);
      const data = JSON.parse(this.dashboardData.assetAllocationJson);

      // --- 【【【 新增逻辑：动态计算最大值 】】】 ---
      // 1. 获取所有持仓类型的市值
      const values = Object.values(data);
      if (values.length === 0) return; // 如果没有有效数据，则不绘制

      // 2. 找到其中的最大值
      const maxValue = Math.max(...values);

      // 3. 将最大值向上取整到一个合适的刻度（比如向上取到最近的千位数），并增加一点缓冲
      //    例如，如果最大值是 1001，我们会把坐标轴最大值设为 2000
      const axisMax = Math.ceil(maxValue / 1000) * 1000 * 1.2;
      // --- 新增逻辑结束 ---

      const option = {
        tooltip: { trigger: 'item' },
        radar: {
          // --- 【【【 核心修正：使用动态计算出的 axisMax 】】】 ---
          indicator: Object.keys(data).map(key => ({ name: key, max: axisMax }))
        },
        series: [{
            name: '资产配置',
            type: 'radar',
            data: [{ value: Object.values(data), name: '市值(元)' }]
        }]
      };
      myChart.setOption(option);
    },

    // ... (其他所有方法如 toggleEdit, saveProfile, formatCurrency 等保持不变) ...
    toggleEdit(editing) {
      this.isEditing = editing;
      if (!editing) {
        this.profileForm = { ...this.originalProfile };
      }
    },

    saveProfile() {
      this.$refs.profileFormRef.validate(async (valid) => {
        if (!valid) return false;
        this.loading = true;
        try {
          const submissionData = { ...this.profileForm };
          delete submissionData.userId;
          delete submissionData.balance;
          delete submissionData.id;
          delete submissionData.createTime;
          delete submissionData.updateTime;
          const updatedProfileVO = await updateMyProfile(submissionData);
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

    formatCurrency(value, withSign = false) {
      if (value == null || isNaN(value)) return '0.00 元';
      const sign = withSign && value > 0 ? '+' : '';
      return `${sign}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元`;
    },

    formatPercentage(value) {
      if (value == null || isNaN(value)) return '0.00%';
      const sign = value > 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}%`;
    },

    getProfitLossClass(value) {
      if (value == null || value === 0) return '';
      return value > 0 ? 'is-up' : 'is-down';
    },

    goToHoldings() {
      this.$router.push('/my-holdings');
    }
  }
};
</script>

<style scoped>
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

/* --- 【【【 核心修正 】】】 --- */

/* 1. 顶部卡片行 Flex 布局，并拉伸等高 */
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

/* 2. 【新增】基础信息卡片顶部的 header 样式 */
.profile-header {
  display: flex;
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  margin-bottom: 15px; /* 与下方描述列表的间距 */
}
.profile-header .welcome-text {
  margin: 0; /* 移除 p 标签默认的上下边距 */
  font-size: 1.1rem; /* 稍微调整字体大小 */
}
.tags-container {
  flex-shrink: 0; /* 防止标签被压缩 */
}

/* 3. AI卡片内容垂直居中 */
.ai-card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
}

/* --- 其他样式保持不变 --- */
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