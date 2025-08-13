<template>
  <div class="dashboard-container" v-loading="loading">
    <div v-if="!loading && dashboardData">
      <h2 class="page-title">我的主页</h2>

      <el-row :gutter="20" class="top-section">
        <el-col :span="16">
          <el-card class="box-card" v-if="dashboardData.userProfile">
            <div slot="header"><span><i class="el-icon-user-solid"></i> 基础信息</span></div>
            <div class="user-profile-body">
               <p><strong>欢迎您，{{ dashboardData.userProfile.name || '新用户' }}</strong></p>
               <p>我们为您生成了以下的投资画像标签：</p>
               <el-tag type="success" style="margin-right: 5px;">稳健型投资者</el-tag>
               <el-tag type="warning" style="margin-right: 5px;">长期持有</el-tag>
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
      isEditing: false,      // 是否处于编辑模式
      profileForm: {},       // 用于表单双向绑定
      originalProfile: {},   // 用于“取消”时恢复数据
      profileRules: {      // 表单校验规则
        name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
        gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
        idType: [{ required: true, message: '请输入证件类型', trigger: 'blur' }],
        idNumber: [{ required: true, message: '请输入证件号码', trigger: 'blur' }],
        birthDate: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
        nationality: [{ required: true, message: '请输入国籍', trigger: 'blur' }],
        occupation: [{ required: true, message: '请输入职业', trigger: 'blur' }],
        phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
        address: [{ required: true, message: '请输入联系地址', trigger: 'blur' }],
      }
    };
  },
  created() {
    // 组件创建时，调用方法从后端获取数据
    this.fetchDashboardData();
  },
  methods: {
    /**
     * 核心方法：从后端获取所有主页所需的数据
     */
    async fetchDashboardData() {
      this.loading = true;
      try {
        this.dashboardData = await getMyDashboard();
        // 获取到数据后，初始化个人资料表单
        if (this.dashboardData && this.dashboardData.userProfile) {
            this.profileForm = { ...this.dashboardData.userProfile, balance: this.dashboardData.balance };
            this.originalProfile = { ...this.profileForm };
        }
        // 在下一个DOM更新周期初始化所有图表
        this.$nextTick(() => {
          this.initCharts();
        });
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
                dangerouslyUseHTMLString: true // 允许内容中使用<br/>换行
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
      if (!chartDom || !this.dashboardData.assetAllocationJson || this.dashboardData.assetAllocationJson === '{}') return;
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
     * 初始化资产配置雷达图
     */
    initAssetAllocationRadarChart() {
      const chartDom = this.$refs.assetAllocationRadarChart;
      if (!chartDom || !this.dashboardData.assetAllocationJson || this.dashboardData.assetAllocationJson === '{}') return;
      const myChart = echarts.init(chartDom);
      const data = JSON.parse(this.dashboardData.assetAllocationJson);
      const option = {
        tooltip: { trigger: 'item' },
        radar: {
          indicator: Object.keys(data).map(key => ({ name: key }))
        },
        series: [{
            name: '资产配置',
            type: 'radar',
            data: [{ value: Object.values(data), name: '市值(元)' }]
        }]
      };
      myChart.setOption(option);
    },

    /**
     * 切换个人资料的编辑/查看模式
     */
    toggleEdit(editing) {
      this.isEditing = editing;
      if (!editing) {
        this.profileForm = { ...this.originalProfile };
      }
    },

    /**
     * 保存个人资料
     */
// 文件: src/views/UserDashboard.vue -> methods

  saveProfile() {
    debugger;
    this.$refs.profileFormRef.validate(async (valid) => {
      if (!valid) return false;

      this.loading = true;
      try {
        // 【【【 核心修正 】】】
        // 1. 创建一个profileForm的副本
        const submissionData = { ...this.profileForm };
        // 2. 从副本中删除userId和balance字段，确保发送给后端的数据与DTO完全匹配
        delete submissionData.userId;
        delete submissionData.balance;
        delete submissionData.id; // 也删除可能存在的主键id
        delete submissionData.createTime;
        delete submissionData.updateTime;

        // 3. 调用更新API，传入“干净”的数据副本
        const updatedProfileVO = await updateMyProfile(submissionData);

        // 4. 更新成功后，用后端返回的最新数据更新表单和原始数据
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
     * 将数字格式化为货币字符串
     */
    formatCurrency(value, withSign = false) {
      if (value == null || isNaN(value)) return '0.00 元';
      const sign = withSign && value > 0 ? '+' : '';
      return `${sign}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元`;
    },

    /**
     * 将数字格式化为百分比字符串
     */
    formatPercentage(value) {
      if (value == null || isNaN(value)) return '0.00%';
      const sign = value > 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}%`;
    },

    /**
     * 根据盈亏值返回对应的CSS Class
     */
    getProfitLossClass(value) {
      if (value == null || value === 0) return '';
      return value > 0 ? 'is-up' : 'is-down';
    },

    /**
     * 跳转到“我的持仓”独立页面
     */
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
.top-section {
  display: flex;
  align-items: stretch; /* 让列等高 */
}
.top-section .el-col {
  display: flex; /* 让列成为flex容器，以便卡片能撑满 */
}
.top-section .el-card {
  width: 100%; /* 让卡片撑满列的宽度 */
  display: flex;
  flex-direction: column;
}
.top-section .el-card >>> .el-card__body {
    flex-grow: 1; /* 让卡片内容区自动成长，填满剩余空间 */
}
.ai-card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex-grow: 1;
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
.holdings-section .el-table {
  margin-top: 0;
}
.empty-text {
  text-align: center;
  color: #909399;
  padding: 20px;
}
.no-stats-alert {
  height: 100%;
}
.balance-text {
  font-weight: bold;
  color: #E6A23C;
  font-size: 1.2rem;
  line-height: 40px;
}
.profile-section .el-form-item__content span {
  color: #606266;
  line-height: 40px;
}
</style>