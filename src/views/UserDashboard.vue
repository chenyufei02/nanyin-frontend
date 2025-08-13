<template>
  <div class="dashboard-container" v-loading="loading">
    <div v-if="!loading && dashboardData">

      <el-row :gutter="20" class="top-section" v-if="dashboardData.userProfile">
        <el-col :span="16">
          <el-card class="box-card">
            <div slot="header">
              <span><i class="el-icon-user-solid"></i> 基础信息</span>
            </div>
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

      <el-row :gutter="20" class="stats-section" v-if="dashboardData.profitLossStats">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">当前总资产</div>
            <div class="stat-value">{{ formatCurrency(dashboardData.profitLossStats.totalMarketValue) }}</div>
          </div>
        </el-col>
        </el-row>
      <el-alert
        v-else
        title="暂无投资数据"
        type="info"
        description="您还没有任何交易记录，暂无法计算盈亏。快去基金超市看看吧！"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;">
      </el-alert>

      </div>
  </div>
</template>

<script>
// 导入我们封装好的API
import { getMyDashboard, getAISuggestion } from '@/api/user.js';
// 导入ECharts
import * as echarts from 'echarts';

export default {
  name: 'UserDashboard',
  data() {
    return {
      loading: true,
      aiLoading: false,
      dashboardData: null
    };
  },
  created() {
    this.fetchDashboardData();
  },
  methods: {
    // 从后端获取所有主页数据
    async fetchDashboardData() {
      this.loading = true;
      try {
        this.dashboardData = await getMyDashboard();
        // 数据加载成功后，在下一个DOM更新周期初始化所有图表
        this.$nextTick(() => {
          this.initCharts();
        });
      } catch (error) {
        this.$message.error('主页数据加载失败');
        console.error("加载主页数据失败:", error);
      } finally {
        this.loading = false;
      }
    },
    // 调用AI建议接口
    async fetchAISuggestion() {
        this.aiLoading = true;
        try {
            const suggestion = await getAISuggestion();
            this.$alert(suggestion, 'AI投资建议', {
                confirmButtonText: '确定',
                dangerouslyUseHTMLString: true // 如果AI返回的是富文本，需要开启此项
            });
        } catch (error) {
            this.$message.error('AI建议生成失败');
        } finally {
            this.aiLoading = false;
        }
    },
    // 初始化所有图表
    initCharts() {
      this.initAssetAllocationChart();
      this.initRiskInsightChart();
      this.initMonthlyFlowChart();
      this.initHistoricalDataChart();
    },
    // 渲染持仓占比图
    initAssetAllocationChart() {
      const chartDom = this.$refs.assetAllocationChart;
      if (!chartDom) return;
      const myChart = echarts.init(chartDom);
      const data = JSON.parse(this.dashboardData.assetAllocationJson);
      const chartData = Object.keys(data).map(key => ({ name: key, value: data[key] }));

      const option = {
        tooltip: { trigger: 'item' },
        legend: { top: '5%', left: 'center' },
        series: [{
          name: '持仓分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          data: chartData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
      myChart.setOption(option);
    },
    // 其他图表的初始化方法...
    initRiskInsightChart() { /* ... */ },
    initMonthlyFlowChart() { /* ... */ },
    initHistoricalDataChart() { /* ... */ },

    // --- 辅助方法 ---
    formatCurrency(value, withSign = false) {
      if (value == null) return 'N/A';
      const sign = withSign && value > 0 ? '+' : '';
      return `${sign}${value.toFixed(2)} 元`;
    },
    formatPercentage(value) {
      if (value == null) return 'N/A';
      return `${value.toFixed(2)}%`;
    },
    getProfitLossClass(value) {
      if (value == null) return '';
      return value >= 0 ? 'is-up' : 'is-down';
    },
    goToHoldings() {
      this.$router.push('/my-holdings');
    }
  }
};
</script>

<style scoped>
/* 样式与FundDetail.vue类似，您可以复用或自定义 */
.dashboard-container { padding: 20px; }
.box-card { margin-bottom: 20px; }
.chart { height: 300px; width: 100%; }
.stat-card {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  text-align: center;
}
.stat-label { color: #909399; margin-bottom: 10px; }
.stat-value { font-size: 24px; font-weight: bold; }
.is-up { color: #f56c6c; }
.is-down { color: #67c23a; }
.ai-card-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100px;
}
</style>