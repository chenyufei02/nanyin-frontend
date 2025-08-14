<template>
  <div class="fund-detail-container" v-if="!loading && fundData">
    <el-card class="box-card fund-card">
      <div slot="header" class="clearfix">
        <div class="card-title">
          <span class="fund-name">{{ fundData.basicInfo.fundName }}</span>
          <span class="fund-code">{{ fundData.basicInfo.fundCode }}</span>
        </div>
        <div class="fund-tags">
          <el-tag size="small">{{ formattedFundType }}</el-tag>
          <el-tag type="warning" size="small" v-if="formattedInvestStyle">{{ formattedInvestStyle }}</el-tag>
        </div>
      </div>

      <el-row class="fund-actions" type="flex" justify="right">
        <el-col :span="8" :offset="16" style="text-align: right;">
          <el-button type="primary" @click="goToPurchase">购买</el-button>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="fund-stats">
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">最新净值 ({{ latestDate }})</div>
            <div class="stat-value">{{ latestNetValue }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">日涨跌幅</div>
            <div class="stat-value" :class="dailyChangeClass">
              {{ dailyChangeRate }}
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">累计净值</div>
            <div class="stat-value">{{ latestAccumNetValue }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="box-card performance-card">
      <div slot="header">
        <span><i class="el-icon-s-marketing"></i> 业绩表现</span>
      </div>
      <el-table :data="performanceData" style="width: 100%" stripe>
        <el-table-column prop="stage" label="阶段" width="120"></el-table-column>
        <el-table-column label="本基金涨幅">
          <template slot-scope="scope">
            <span :class="getProfitLossClass(scope.row.growthRate)">{{ formatPercentage(scope.row.growthRate) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="rank" label="同类排名"></el-table-column>
      </el-table>
    </el-card>
    <el-card class="box-card chart-card">
      <div slot="header" class="clearfix">
        <span><i class="el-icon-trend-charts"></i> 历史净值走势</span>
        <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :picker-options="pickerOptions"
            @change="handleDateChange"
            value-format="yyyy-MM-dd">
        </el-date-picker>
      </div>
      <div id="netValueChart" style="height: 400px;"></div>
    </el-card>
  </div>

</template>

<script>
import moment from 'moment';
import * as echarts from 'echarts';
// 导入API函数
import {getFundDetail, getFundNetValueTrends} from '@/api/fund.js';


export default {
  name: 'FundDetail',
  data() {
    return {
      loading: true,    // 页面加载状态
      fundData: null,   // 用于存储从后端获取的所有基金数据
      fundCode: null,    // 从URL中获取的基金代码
      dateRange: null,     // 日期范围
      chartInstance: null,
      chart: null,        // ECharts实例
      pickerOptions: {    // 日期选择器配置
        disabledDate: (time) => {
          // 禁用大于最新净值日期的日期
          if (this.fundData && this.fundData.performance && this.fundData.performance.endDate) {
            return time.getTime() > moment(this.fundData.performance.endDate).endOf('day');
          }
          return false;
        },
        shortcuts: [{
          text: '最近一周',
          onClick: (picker) => {
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
    latestNetValue() {
      return this.fundData?.performance?.unitNetValue?.toFixed(4) || 'N/A';
    },
    latestAccumNetValue() {
      return this.fundData?.performance?.accumNetValue?.toFixed(4) || 'N/A';
    },
    dailyChangeRate() {
      const rate = this.fundData?.performance?.dailyGrowthRate;
      if (rate == null) return 'N/A';
      return `${(rate * 100).toFixed(2)}%`;
    },
    dailyChangeClass() {
      const rate = this.fundData?.performance?.dailyGrowthRate;
      if (rate == null) return '';
      return rate > 0 ? 'is-up' : 'is-down';
    },
    latestDate() {
      const date = this.fundData?.performance?.endDate;
      return date ? moment(date).format('YYYY-MM-DD') : 'N/A';
    },
    formattedFundType() {
      if (!this.fundData || !this.fundData.basicInfo) return '未知类型';
      const typeCode = this.fundData.basicInfo.fundInvestType;
      const typeMap = {
        '0': '股票型', '1': '债券型', '2': '混合型', '3': '货币型',
        '6': '基金型', '7': '保本型', '8': 'REITs'
      };
      return typeMap[typeCode] || '其他';
    },
    formattedInvestStyle() {
      if (!this.fundData || !this.fundData.basicInfo || !this.fundData.basicInfo.investStyle) return '';
      const styleCode = this.fundData.basicInfo.investStyle;
      const styleMap = {
        '1': '成长型', '2': '价值型', '3': '平衡型'
      };
      return styleMap[styleCode] || '';
    },
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
  mounted() {
    // 页面挂载时，从URL中获取基金代码并获取数据

    // 添加窗口大小调整事件监听
    window.addEventListener('resize', this.handleResize);
  },

  beforeDestroy() {
    // 组件销毁前清理事件监听和图表实例
    window.removeEventListener('resize', this.handleResize);
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },

  async created() {
    this.fundCode = this.$route.params.fundCode;
    // 先获取基金详情，再设置默认日期范围
    await this.fetchFundDetails();
    if (this.fundData && this.fundData.performance && this.fundData.performance.endDate) {
      const end = moment(this.fundData.performance.endDate).toDate();
      const start = moment(this.fundData.performance.endDate).subtract(1, 'month').toDate();
      this.dateRange = [start, end];
      // 获取净值走势数据
      this.handleDateChange(this.dateRange);
    }
  },
  methods: {
    async fetchFundDetails() {
      this.loading = true;
      try {
        this.fundData = await getFundDetail(this.fundCode);
        this.$nextTick(() => {
          this.initNetValueChart();
        });
      } catch (error) {
        console.error("获取基金详情失败:", error);
        this.fundData = null;
      } finally {
        this.loading = false;
      }
    },
    initNetValueChart() {
      const chartDom = this.$refs.netValueChart;

      // --- 【【【 核心修正：分步判断，修复逻辑漏洞 】】】 ---

      // 1. 首先，也是最重要的一步：先确认图表的HTML容器(chartDom)是否已准备好。
      //    如果还没准备好，就什么也别做，直接退出函数，这可以完美避免报错。
      if (!chartDom) {
        console.warn("图表容器尚未渲染，跳过本次初始化。");
        return;
      }

      // 2. 只有在确认HTML元素存在后，我们才继续判断数据是否有效。
      //    现在我们可以安全地操作 chartDom 了。
      if (!this.fundData || !this.fundData.netValueHistory || this.fundData.netValueHistory.length === 0) {
        // 如果没有数据，安全地设置提示文本
        chartDom.innerHTML = '<div class="chart-empty-text">暂无历史净值数据</div>';
        // 如果之前有图表实例，最好清空一下，避免旧图残留
        if (this.chartInstance) {
          this.chartInstance.clear();
        }
        return;
      }

      // 如果代码能执行到这里，说明容器和数据都已就绪，开始画图
      this.chartInstance = echarts.init(chartDom);
      const dates = this.fundData.netValueHistory.map(item => moment(item.endDate).format('YYYY-MM-DD'));
      const unitValues = this.fundData.netValueHistory.map(item => item.unitNetValue);
      const accumValues = this.fundData.netValueHistory.map(item => item.accumNetValue);
      const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        legend: { data: ['单位净值', '累计净值'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dates },
        yAxis: { type: 'value', scale: true, axisLabel: { formatter: '{value}' } },
        series: [
          { name: '单位净值', type: 'line', smooth: true, data: unitValues },
          { name: '累计净值', type: 'line', smooth: true, data: accumValues }
        ]
      };
      this.chartInstance.setOption(option);
    },
    goToPurchase() {
      if (!this.fundCode) return;
      this.$router.push(`/funds/${this.fundCode}/purchase`);
    },

    // 处理日期范围变化
    async handleDateChange(dates) {
      if (!dates) return;
      try {
        // 将日期格式转换为后端所需的格式
        const startDate = moment(dates[0]).format('YYYY-MM-DD');
        const endDate = moment(dates[1]).format('YYYY-MM-DD');
        const response = await getFundNetValueTrends(this.fundCode, startDate, endDate);
        if (response && typeof response === 'object' && response[this.fundCode]) {
          this.updateChart(response);
        } else {
          console.error('净值走势数据格式不正确:', response);
          this.$message.error('获取净值走势数据失败，数据格式不正确');
        }
      } catch (error) {
        console.error('获取净值走势数据失败:', error);
        if (error.response && error.response.status === 400) {
          this.$message.error('日期格式不正确，请重新选择日期范围');
        } else {
          this.$message.error('获取净值走势数据失败，请稍后重试');
        }
      }
    },

    // 初始化图表
    initChart() {
      if (!this.chart) {
        this.chart = echarts.init(document.getElementById('netValueChart'));
      }
    },

    // 更新图表数据
    updateChart(data) {
      if (!data || !data[this.fundCode] || !Array.isArray(data[this.fundCode]) || data[this.fundCode].length === 0) {
        console.error('暂无净值走势数据');
        const chartDom = document.getElementById('netValueChart');
        if (chartDom) {
          chartDom.innerHTML = '<div class="chart-empty-text">暂无历史净值数据</div>';
        }
        return;
      }
      this.initChart();
      const trendData = data[this.fundCode];

      // 计算净值的最大最小值，用于设置y轴范围
      const values = trendData.map(item => item.unitNetValue);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const valueRange = maxValue - minValue;
      // 设置y轴的范围，上下各扩展20%
      const yMin = minValue - valueRange * 0.2;
      const yMax = maxValue + valueRange * 0.2;

      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            const data = params[0].data;
            return `日期：${moment(data[0]).format('YYYY-MM-DD')}<br/>净值：${data[1].toFixed(4)}`;
          }
        },
        xAxis: {
          type: 'time',
          boundaryGap: false,
          axisLabel: {
            formatter: function(value) {
              return moment(value).format('MM-DD');
            }
          }
        },
        yAxis: {
          type: 'value',
          name: '单位净值',
          min: yMin,
          max: yMax,
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed'
            }
          },
          axisLabel: {
             formatter: function(value) {
               return value.toFixed(4);
             }
           }
        },
        series: [{
          name: '单位净值',
          type: 'line',
          data: trendData.map(item => [item.date, item.unitNetValue]),
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: '#409EFF'
          },
          itemStyle: {
            color: '#409EFF'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0,
                color: 'rgba(64,158,255,0.3)'
              }, {
                offset: 1,
                color: 'rgba(64,158,255,0)'
              }]
            }
          }
        }]
      };
      this.chart.setOption(option);
    },

    // 处理窗口大小变化
    handleResize() {
      if (this.chart) {
        this.chart.resize();
      }
    },
    formatRank(rank, base) {
      if (rank == null || base == null || base === 0) return 'N/A';
      return `${rank} / ${base}`;
    },
    formatPercentage(value) {
      if (value == null) return 'N/A';
      const sign = value > 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}%`;
    },
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