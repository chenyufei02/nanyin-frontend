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
// 1. 导入我们封装好的“获取基金详情”的API函数
import {getFundDetail} from '@/api/fund.js';
import moment from 'moment'; // 引入一个强大的日期格式化库

export default {
  name: 'FundDetail',
  data() {
    return {
      loading: true,    // 页面加载状态
      fundData: null,   // 用于存储从后端获取的所有基金数据
      fundCode: null    // 从URL中获取的基金代码
    };
  },
  computed: {
    // 使用计算属性来安全地、带格式地显示数据
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
    /**
     * 翻译器1：将基金投资类型代码转换为中文
     */
    formattedFundType() {
      if (!this.fundData || !this.fundData.basicInfo) return '未知类型';
      const typeCode = this.fundData.basicInfo.fundInvestType;
      const typeMap = {
        '0': '股票型',
        '1': '债券型',
        '2': '混合型',
        '3': '货币型',
        '6': '基金型',
        '7': '保本型',
        '8': 'REITs'
      };
      return typeMap[typeCode] || '其他';
    },

    /**
     * 翻译器2：将投资风格代码转换为中文
     */
    formattedInvestStyle() {
      if (!this.fundData || !this.fundData.basicInfo || !this.fundData.basicInfo.investStyle) return '';
      const styleCode = this.fundData.basicInfo.investStyle;
      const styleMap = {
        '1': '成长型',
        '2': '价值型', // 收入型通常指价值型
        '3': '平衡型'
      };
      return styleMap[styleCode] || '';
    }
  },
  created() {
    // 2. 页面创建时，从URL中获取基金代码
    this.fundCode = this.$route.params.fundCode;
    // 3. 调用方法去获取数据
    this.fetchFundDetails();
  },
  methods: {
    // 4. 核心方法：调用API获取数据111
    async fetchFundDetails() {
      this.loading = true;
      try {
        // a. 调用API函数，并传入从URL中获取的fundCode
        this.fundData = await getFundDetail(this.fundCode);
      } catch (error) {
        console.error("获取基金详情失败:", error);
        this.fundData = null; // 加载失败时清空数据
      } finally {
        this.loading = false;
      }
    },
    goToPurchase() {
      if (!this.fundCode) return;
      this.$router.push(`/funds/${this.fundCode}/purchase`);
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
  color: #f56c6c; /* 红色 */
}
.is-down {
  color: #67c23a; /* 绿色 */
}
.loading-container, .error-container {
  padding: 40px;
}
</style>