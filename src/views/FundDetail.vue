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

      <el-row class="fund-actions" type="flex" justify="end">
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
      <div slot="header">
        <span><i class="el-icon-data-line"></i> 历史净值走势 (近一年)</span>
      </div>
      <div ref="netValueChart" class="chart-container"></div>
    </el-card>

  </div>
  <div v-else-if="loading" class="loading-container">
    <el-skeleton :rows="6" animated />
  </div>
  <div v-else class="error-container">
    <el-alert title="基金数据加载失败" type="error" :closable="false" show-icon>
      无法找到该基金的详细信息，或加载过程中出现错误。
    </el-alert>
  </div>
</template>

<script>
import { getFundDetail } from '@/api/fund.js';
import moment from 'moment';
import * as echarts from 'echarts';

export default {
  name: 'FundDetail',
  data() {
    return {
      loading: true,
      fundData: null,
      fundCode: null,
      chartInstance: null
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
  created() {
    this.fundCode = this.$route.params.fundCode;
    this.fetchFundDetails();
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
      if (!chartDom || !this.fundData || !this.fundData.netValueHistory || this.fundData.netValueHistory.length === 0) {
        chartDom.innerHTML = '<div class="chart-empty-text">暂无历史净值数据</div>';
        return;
      }
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
</style>