<template>
  <div class="holding-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <h2>我的持仓</h2>
      </div>
      
      <!-- 搜索区域 -->
      <div class="search-container">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="基金代码">
            <el-input v-model="searchForm.fundCode" placeholder="请输入基金代码" clearable></el-input>
          </el-form-item>
          <el-form-item label="基金名称">
            <el-input v-model="searchForm.fundName" placeholder="请输入基金名称" clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="6" animated />
      </div>

      <div v-else-if="holdings.length === 0" class="empty-container">
        <el-empty description="暂无持仓信息" />
        <el-button type="primary" @click="goToFundList">去基金超市</el-button>
      </div>

      <div v-else>
        <el-table
          :data="holdings"
          style="width: 100%"
          border
          stripe
        >
          <el-table-column prop="fundCode" label="基金代码" width="120" align="center" />
          <el-table-column prop="fundName" label="基金名称" min-width="180" />
          <el-table-column label="持有份额" width="120" align="right">
            <template slot-scope="scope">
              {{ formatNumber(scope.row.totalShares) }}
            </template>
          </el-table-column>
          <el-table-column label="平均成本" width="120" align="right">
            <template slot-scope="scope">
              {{ formatNumber(scope.row.averageCost, 4) }}
            </template>
          </el-table-column>
          <el-table-column label="最新净值" width="120" align="right">
            <template slot-scope="scope">
              {{ formatNumber(scope.row.netValue, 4) }}
            </template>
          </el-table-column>
          <el-table-column label="持仓市值" width="120" align="right">
            <template slot-scope="scope">
              {{ formatNumber(scope.row.marketValue, 2) }}
            </template>
          </el-table-column>
          <el-table-column label="持仓收益" width="120" align="right">
            <template slot-scope="scope">
              <span :class="getProfitClass(scope.row.profit)">
                {{ formatNumber(scope.row.profit, 2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="收益率" width="120" align="right">
            <template slot-scope="scope">
              <span :class="getProfitClass(scope.row.profitRate)">
                {{ formatRate(scope.row.profitRate) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template slot-scope="scope">
              <el-button size="mini" type="primary" @click="goPurchase(scope.row.fundCode)">购买</el-button>
              <el-button size="mini" type="danger" @click="goRedeem(scope.row.fundCode)">赎回</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="summary-container">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="summary-item">
                <div class="summary-label">持仓总市值</div>
                <div class="summary-value">{{ formatNumber(totalMarketValue, 2) }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="summary-item">
                <div class="summary-label">累计收益</div>
                <div class="summary-value" :class="getProfitClass(totalProfit)">
                  {{ formatNumber(totalProfit, 2) }}
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="summary-item">
                <div class="summary-label">总收益率</div>
                <div class="summary-value" :class="getProfitClass(totalProfitRate)">
                  {{ formatRate(totalProfitRate) }}
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
// 导入获取持仓信息的API函数
import { getMyHoldings } from '@/api/holding.js';

export default {
  name: 'UserHolding',
  data() {
    return {
      loading: true,
      holdings: [],
      totalMarketValue: 0,
      totalProfit: 0,
      totalProfitRate: 0,
      // 搜索表单数据
      searchForm: {
        fundCode: '',
        fundName: ''
      }
    };
  },
  created() {
    this.fetchHoldings();
  },
  methods: {
    // 获取持仓数据
    async fetchHoldings() {
      this.loading = true;
      try {
        // 从localStorage获取用户信息
        let userId = null;
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          try {
            const userInfo = JSON.parse(userInfoStr);
            userId = userInfo.id;
          } catch (e) {
            console.error('解析用户信息失败:', e);
          }
        }
        
        // 如果没有用户ID，提示用户登录
        // if (!userId) {
        //   this.$message.error('请先登录后再查看持仓信息');
        //   this.$router.push('/login');
        //   return;
        // }
        
        // 调用API获取持仓数据，传递用户ID和搜索参数
        const data = await getMyHoldings(
          userId, 
          this.searchForm.fundCode, 
          this.searchForm.fundName
        );
        
        // 处理返回的数据
        this.holdings = data || [];
        
        // 计算每个持仓的收益和收益率
        this.holdings.forEach(holding => {
          // 计算收益 = 市值 - 成本价*份额
          const cost = holding.averageCost * holding.totalShares;
          holding.profit = holding.marketValue - cost;
          // 计算收益率 = 收益/成本
          holding.profitRate = cost > 0 ? holding.profit / cost : 0;
        });
        
        // 计算总市值、总收益和总收益率
        this.totalMarketValue = this.holdings.reduce((sum, item) => sum + item.marketValue, 0);
        this.totalProfit = this.holdings.reduce((sum, item) => sum + item.profit, 0);
        const totalCost = this.holdings.reduce((sum, item) => sum + (item.averageCost * item.totalShares), 0);
        this.totalProfitRate = totalCost > 0 ? this.totalProfit / totalCost : 0;
        
        // 输出日志，方便调试
        console.log('处理后的持仓数据:', this.holdings);
        console.log('总市值:', this.totalMarketValue);
        console.log('总收益:', this.totalProfit);
        console.log('总收益率:', this.totalProfitRate);
      } catch (error) {
        console.error('获取持仓信息失败:', error);
        if (error.response && error.response.status === 401) {
          this.$message.error('请先登录后再查看持仓信息');
          // 401错误已在request.js中处理，会自动跳转到登录页
        } else {
          this.$message.error('获取持仓信息失败，请稍后再试');
        }
        // 清空数据
        this.holdings = [];
        this.totalMarketValue = 0;
        this.totalProfit = 0;
        this.totalProfitRate = 0;
      } finally {
        this.loading = false;
      }
    },
    
    // 格式化数字
    formatNumber(value, decimals = 2) {
      if (value === undefined || value === null) return 'N/A';
      return Number(value).toFixed(decimals);
    },
    // 格式化收益率
    formatRate(rate) {
      if (rate === undefined || rate === null) return 'N/A';
      return `${(rate * 100).toFixed(2)}%`;
    },
    // 根据收益正负获取样式类名
    getProfitClass(value) {
      if (value === undefined || value === null) return '';
      return value > 0 ? 'profit-up' : value < 0 ? 'profit-down' : '';
    },
    // 查看基金详情
    viewDetails(fundCode) {
      this.$router.push(`/funds/${fundCode}`);
    },
    // 跳转到购买页面
    goPurchase(fundCode) {
      this.$router.push(`/funds/${fundCode}`);
    },
    // 跳转到赎回页面
    goRedeem(fundCode) {
      this.$router.push(`/funds/${fundCode}`);
    },
    // 跳转到基金列表
    goToFundList() {
      this.$router.push('/funds');
    },
    // 处理搜索
    handleSearch() {
      this.fetchHoldings();
    },
    // 重置搜索条件
    resetSearch() {
      this.searchForm.fundCode = '';
      this.searchForm.fundName = '';
      this.fetchHoldings();
    }
  }
};
</script>

<style scoped>
.holding-container {
  padding: 20px;
}
.loading-container,
.empty-container {
  padding: 40px;
  text-align: center;
}
.empty-container .el-button {
  margin-top: 20px;
}
.summary-container {
  margin-top: 30px;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
}
.summary-item {
  text-align: center;
}
.summary-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}
.summary-value {
  font-size: 24px;
  font-weight: bold;
}
.profit-up {
  color: #f56c6c; /* 红色表示上涨 */
}
.profit-down {
  color: #67c23a; /* 绿色表示下跌 */
}

/* 搜索区域样式 */
.search-container {
  margin-bottom: 20px;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}
.search-form .el-form-item {
  margin-bottom: 0;
}
</style>