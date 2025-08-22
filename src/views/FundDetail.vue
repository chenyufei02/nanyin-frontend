<template>
  <!-- 基金详情页主容器，只有在数据加载完成且存在时才显示 -->
  <div class="fund-detail-container" v-if="!loading && fundData">
    <!-- 基金基本信息卡片 -->
    <el-card class="box-card fund-card">
      <!-- 卡片头部：基金名称、代码和标签 -->
      <div slot="header" class="clearfix">
        <div class="card-title">
          <span class="fund-name">{{ fundData.basicInfo.fundName }}</span>
          <span class="fund-code">{{ fundData.basicInfo.fundCode }}</span>
        </div>
        <!-- 基金类型和投资风格标签 -->
        <div class="fund-tags">
          <el-tag size="small">{{ formattedFundType }}</el-tag>
          <el-tag type="warning" size="small" v-if="formattedInvestStyle">{{ formattedInvestStyle }}</el-tag>
        </div>
      </div>

      <!-- 基金操作按钮区域：购买和赎回 -->
      <el-row class="fund-actions" type="flex" justify="right">
        <el-col :span="8" :offset="16" style="text-align: right;">
          <el-button type="primary" @click="goToPurchase">购买</el-button>
          <el-button type="danger" @click="goToRedeem" style="margin-left: 10px;">赎 回</el-button>
        </el-col>
      </el-row>

      <!-- 基金关键统计数据展示区域 -->
      <el-row :gutter="20" class="fund-stats">
        <!-- 最新净值 -->
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">最新净值 ({{ latestDate }})</div>
            <div class="stat-value">{{ latestNetValue }}</div>
          </div>
        </el-col>
        <!-- 日涨跌幅 -->
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">日涨跌幅</div>
            <div class="stat-value" :class="dailyChangeClass">
              {{ dailyChangeRate }}
            </div>
          </div>
        </el-col>
        <!-- 累计净值 -->
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">累计净值</div>
            <div class="stat-value">{{ latestAccumNetValue }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 业绩表现卡片：展示不同时间段的基金表现 -->
    <el-card class="box-card performance-card">
      <div slot="header">
        <span><i class="el-icon-s-marketing"></i> 业绩表现</span>
      </div>
      <!-- 业绩表现数据表格 -->
      <el-table :data="performanceData" style="width: 100%" stripe>
        <el-table-column prop="stage" label="阶段" width="120"></el-table-column>
        <el-table-column label="本基金涨幅">
          <template slot-scope="scope">
            <!-- 根据涨跌情况动态设置颜色 -->
            <span :class="getProfitLossClass(scope.row.growthRate)">{{ formatPercentage(scope.row.growthRate) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="rank" label="同类排名"></el-table-column>
      </el-table>
    </el-card>
    
    <!-- 历史净值走势图卡片 -->
    <el-card class="box-card chart-card">
      <div slot="header" class="clearfix">
        <span><i class="el-icon-trend-charts"></i> 历史净值走势</span>
      </div>
      <!-- 净值走势图容器 -->
      <div id="netValueChart" style="height: 400px;">
        <el-empty description="历史净值走势图正在开发中....."></el-empty>
      </div>
    </el-card>
  </div>

</template>

<script>
/**
 * 基金详情页组件
 * 展示基金的基本信息、业绩表现和历史净值走势
 */

// 导入第三方库
import moment from 'moment';  // 日期处理库

// 导入API函数
import {getFundDetail} from '@/api/fund.js';

export default {
  name: 'FundDetail',
  data() {
    return {
      loading: true,    // 页面加载状态
      fundData: null,   // 用于存储从后端获取的所有基金数据
      fundCode: null,    // 从URL中获取的基金代码
      dateRange: null,     // 日期范围选择器的值
      chartInstance: null,  // 图表实例（初始化用）
      chart: null,        // ECharts实例（更新数据用）
      
      // 日期选择器配置
      pickerOptions: {    
        // 禁用日期：不允许选择大于最新净值日期的日期
        disabledDate: (time) => {
          if (this.fundData && this.fundData.performance && this.fundData.performance.endDate) {
            return time.getTime() > moment(this.fundData.performance.endDate).endOf('day');
          }
          return false;
        },
        // 日期选择器快捷选项配置
        shortcuts: [{
          text: '最近一周',
          onClick: (picker) => {
            // 设置日期范围为最近一周
            const end = moment(this.fundData.performance.endDate).toDate();
            const start = moment(this.fundData.performance.endDate).subtract(7, 'days').toDate();
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近一个月',
          onClick: (picker) => {
            const end = moment(this.fundData.performance.endDate).toDate();
            const start = moment(this.fundData.performance.endDate).subtract(1, 'month').toDate();
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近三个月',
          onClick: (picker) => {
            const end = moment(this.fundData.performance.endDate).toDate();
            const start = moment(this.fundData.performance.endDate).subtract(3, 'months').toDate();
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近六个月',
          onClick: (picker) => {
            const end = moment(this.fundData.performance.endDate).toDate();
            const start = moment(this.fundData.performance.endDate).subtract(6, 'months').toDate();
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近一年',
          onClick: (picker) => {
            const end = moment(this.fundData.performance.endDate).toDate();
            const start = moment(this.fundData.performance.endDate).subtract(1, 'year').toDate();
            picker.$emit('pick', [start, end]);
          }
        }]
      }
    };
  },
  computed: {
    /**
     * @returns {string} 格式化后的净值或'N/A'
     */
    latestNetValue() {
      return this.fundData?.performance?.unitNetValue?.toFixed(4) || 'N/A';
    },
    
    /**
     * @returns {string} 格式化后的累计净值或'N/A'
     */
    latestAccumNetValue() {
      return this.fundData?.performance?.accumNetValue?.toFixed(4) || 'N/A';
    },
    
    /**
     * @returns {string} 格式化后的涨跌幅百分比
     */
    dailyChangeRate() {
      const rate = this.fundData?.performance?.dailyGrowthRate;
      if (rate == null) return 'N/A';
      return `${(rate * 100).toFixed(2)}%`;
    },
    
    /**
     * @returns {string} 涨跌对应的CSS类名
     */
    dailyChangeClass() {
      const rate = this.fundData?.performance?.dailyGrowthRate;
      if (rate == null) return '';
      return rate > 0 ? 'is-up' : 'is-down';
    },
    
    /**
     * @returns {string} 格式化的日期字符串
     */
    latestDate() {
      const date = this.fundData?.performance?.endDate;
      return date ? moment(date).format('YYYY-MM-DD') : 'N/A';
    },
    
    /**
     * @returns {string} 基金类型名称
     */
    formattedFundType() {
      if (!this.fundData || !this.fundData.basicInfo) return '未知类型';
      const typeCode = this.fundData.basicInfo.fundInvestType;
      const typeMap = {
        '0': '股票型', '1': '债券型', '2': '混合型', '3': '货币型',
        '6': '基金型', '7': '保本型', '8': 'REITs'
      };
      return typeMap[typeCode] || '其他';
    },
    
    /**
     * @returns {string} 投资风格名称
     */
    formattedInvestStyle() {
      if (!this.fundData || !this.fundData.basicInfo || !this.fundData.basicInfo.investStyle) return '';
      const styleCode = this.fundData.basicInfo.investStyle;
      const styleMap = {
        '1': '成长型', '2': '价值型', '3': '平衡型'
      };
      return styleMap[styleCode] || '';
    },
    
    /**
     * @returns {Array} 包含各时间段业绩数据的数组
     */
    performanceData() {
      if (!this.fundData || !this.fundData.performance) return [];
      const perf = this.fundData.performance;
      return [
        { stage: '最近一周', growthRate: perf.weeklyGrowthRate, rank: this.formatRank(perf.rank1w, perf.rankBase1w) },
        { stage: '最近一月', growthRate: perf.monthly1mGrowthRate, rank: this.formatRank(perf.rank1m, perf.rankBase1m) },
        { stage: '最近三月', growthRate: perf.monthly3mGrowthRate, rank: this.formatRank(perf.rank3m, perf.rankBase3m) },
        { stage: '最近半年', growthRate: perf.monthly6mGrowthRate, rank: this.formatRank(perf.rank6m, perf.rankBase6m) },
        { stage: '最近一年', growthRate: perf.yearly1yGrowthRate, rank: this.formatRank(perf.rank1y, perf.rankBase1y) },
        { stage: '成立以来', growthRate: perf.fromEstablishmentGrowthRate, rank: this.formatRank(perf.rankEstablishment, perf.rankBaseEstablishment) },
      ];
    }
  },
  /**
   * 组件挂载完成后的钩子函数
   * 添加窗口大小调整事件监听，确保图表能够响应窗口大小变化
   */
  mounted() {
    // 添加窗口大小调整事件监听
    window.addEventListener('resize', this.handleResize);
  },

  /**
   * 组件销毁前的钩子函数
   * 清理事件监听和图表实例，防止内存泄漏
   */
  beforeDestroy() {
    // 组件销毁前清理事件监听和图表实例
    window.removeEventListener('resize', this.handleResize);
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },

  /**
   * 组件创建时的钩子函数
   * 获取基金代码，加载基金详情和净值走势数据
   */
  async created() {
    // 从路由参数中获取基金代码
    this.fundCode = this.$route.params.fundCode;
    // 先获取基金详情，再设置默认日期范围
    await this.fetchFundDetails();
  },
  methods: {
    /**
     * 获取基金详情数据
     */
    async fetchFundDetails() {
      this.loading = true;
      try {
        // 调用API获取基金详情
        this.fundData = await getFundDetail(this.fundCode);
        // 在DOM更新后初始化净值图表
        // this.$nextTick(() => {
        //   this.initNetValueChart();
        // });
      } catch (error) {
        console.error("获取基金详情失败:", error);
        this.fundData = null;
      } finally {
        this.loading = false;
      }
    },
    /**
     * 跳转到基金购买页面
     */
    goToPurchase() {
      if (!this.fundCode) return;
      this.$router.push(`/funds/${this.fundCode}/purchase`);
    },
    /**
     * 跳转到基金赎回页面
     */
    goToRedeem() {
      if (!this.fundCode) return;
      // 点击赎回按钮时，跳转到我们新配置的赎回页面路由
      this.$router.push(`/funds/${this.fundCode}/redeem`);
    },
    /**
     * 处理窗口大小变化事件
     */
    handleResize() {
      if (this.chart) {
        this.chart.resize();
      }
    },
    /**
     * 格式化排名显示
     * @param {Number} rank - 当前排名
     * @param {Number} base - 总基金数量
     * @return {String} 格式化后的排名，如"10 / 100"
     */
    formatRank(rank, base) {
      if (rank == null || base == null || base === 0) return 'N/A';
      return `${rank} / ${base}`;
    },
    /**
     * 格式化百分比显示
     * @param {Number} value - 百分比值
     * @return {String} 格式化后的百分比字符串，如"+5.68%"或"-2.31%"
     */
    formatPercentage(value) {
      if (value == null) return 'N/A';
      const sign = value > 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}%`;
    },
    /**
     * 获取收益/亏损的CSS类名
     * 根据数值的正负返回不同的CSS类名，用于显示不同颜色
     * @param {Number} value - 收益率值
     * @return {String} CSS类名：正值返回"is-up"，负值返回"is-down"
     */
    getProfitLossClass(value) {
      if (value == null || value === 0) return '';
      return value > 0 ? 'is-up' : 'is-down';
    }
  }
};
</script>

<style scoped>
.fund-detail-container {
  padding: 20px;
}
.fund-actions {
  margin-bottom: 10px;
}
.fund-card .card-title {
  display: flex;
  align-items: baseline;
}
.fund-name {
  font-size: 1.5rem;
  font-weight: bold;
}
.fund-code {
  font-size: 1rem;
  color: #888;
  margin-left: 10px;
}
.fund-tags {
  margin-top: 10px;
}
.fund-tags .el-tag {
  margin-right: 10px;
}
.fund-stats {
  text-align: center;
}
.stat-item {
  padding: 10px 0;
}
.stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 1.8rem;
  font-weight: 500;
}
.is-up {
  color: #f56c6c;
}
.is-down {
  color: #67c23a;
}
.loading-container, .error-container {
  padding: 40px;
}
.performance-card {
  margin-top: 20px;
}
.chart-card {
  margin-top: 20px;
}
.chart-container {
  height: 400px;
  width: 100%;
}
.chart-empty-text {
  text-align: center;
  color: #909399;
  padding-top: 150px;
}

.chart-card {
  margin-top: 20px;
}

.chart-card .clearfix {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#netValueChart {
  width: 100%;
  margin-top: 20px;
}
</style>