<template>
  <div class="holding-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <h2>我的持仓</h2>
      </div>

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
              {{ formatNumber(scope.row.latestNetValue, 4) }}
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
        
        <!-- 分页组件 -->
        <div class="pagination-container">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[5, 10, 20, 50]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total">
          </el-pagination>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
// 导入获取持仓信息的API函数
import { getMyHoldings, getAllMyHoldings } from '@/api/holding';

export default {
  name: 'UserHolding',
  // 组件的数据模型
  data() {
    return {
      // 控制加载状态的显示
      loading: true,
      // 存储从后端获取的持仓列表
      holdings: [],
      // 汇总数据：总市值
      totalMarketValue: 0,
      // 汇总数据：总收益
      totalProfit: 0,
      // 汇总数据：总收益率
      totalProfitRate: 0,
      // 绑定搜索表单的数据
      searchForm: {
        fundCode: '',
        fundName: '',
      },
      // 分页相关数据
      currentPage: 1,      // 当前页码
      pageSize: 10,        // 每页显示条数
      total: 0             // 总记录数
    };
  },
  // 组件创建时的生命周期钩子
  created() {
    this.fetchHoldings();
  },
  methods: {
    /**
     * @description 异步方法，用于从后端获取持仓数据并处理
     */
    async fetchHoldings() {
      // 开始加载，显示加载动画
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

        console.log(`正在获取第${this.currentPage}页数据，每页${this.pageSize}条记录`);

        // 同时发起两个请求：获取分页数据和所有持仓数据（用于计算总计值）
        const [response, allHoldingsResponse] = await Promise.all([
          // 获取分页数据
          getMyHoldings(
            userId,
            this.searchForm.fundCode,
            this.searchForm.fundName,
            this.currentPage,
            this.pageSize
          ),
          // 获取所有持仓数据（用于计算总计值）
          getAllMyHoldings(userId)
        ]);

        console.log('API返回的原始数据:', response);
        // 详细记录API返回的数据结构
        if (response) {
          console.log('API返回数据类型:', typeof response);
          console.log('API返回数据是否为数组:', Array.isArray(response));
          if (typeof response === 'object' && !Array.isArray(response)) {
            console.log('API返回的对象属性:', Object.keys(response));
            if (response.records) {
              console.log('records字段类型:', typeof response.records);
              console.log('records是否为数组:', Array.isArray(response.records));
              console.log('records长度:', response.records.length);
              console.log('total值:', response.total);
            } else if (response.content) {
              console.log('content字段类型:', typeof response.content);
              console.log('content是否为数组:', Array.isArray(response.content));
              console.log('content长度:', response.content.length);
              console.log('totalElements值:', response.totalElements);
            }
          }
        }

        // 处理返回的数据，兼容分页格式
        let holdingsData = [];
        
        // 检查返回数据的格式，适配分页结构
        if (response && response.records) {
          // 新的分页格式，包含records和total
          holdingsData = response.records;
          this.total = response.total || 0;
          console.log(`总记录数: ${this.total}`);
        } else if (response && response.content) {
          // 旧的分页格式，包含content和totalElements
          holdingsData = response.content;
          this.total = response.totalElements || 0;
          console.log(`总记录数(旧格式): ${this.total}`);
        } else if (Array.isArray(response)) {
          // 旧的数组格式，直接使用
          holdingsData = response;
          this.total = response.length;
          console.log('使用旧格式数据，数组长度作为总记录数');
        } else {
          // 其他情况，使用空数组
          holdingsData = [];
          this.total = 0;
          console.log('未识别的数据格式，使用空数组');
        }

        // 将处理后的数据赋值给组件的holdings属性
        this.holdings = holdingsData || [];

        // 在控制台输出原始数据中的关键信息，用于调试
        console.log('持仓数据原始信息:', this.holdings.map(h => ({
          fundCode: h.fundCode,
          fundName: h.fundName,
          latestNetValue: h.latestNetValue
        })));

        // 遍历持仓列表，计算每个持仓的收益和收益率
        this.holdings.forEach(holding => {
          // 检查市值是否需要前端计算
          if (!holding.marketValue) {
            // 如果后端未提供市值，则使用 (最新净值 * 总份额) 进行计算
            holding.marketValue = holding.latestNetValue * holding.totalShares;
            console.log(`基金${holding.fundCode}计算市值:`, holding.marketValue);
          }

          // 计算总成本 = 平均成本 * 总份额
          const cost = holding.averageCost * holding.totalShares;
          // 计算单项收益 = 市值 - 总成本
          holding.profit = holding.marketValue - cost;
          // 计算单项收益率 = 收益 / 总成本 (成本大于0时)
          holding.profitRate = cost > 0 ? holding.profit / cost : 0;

          // 在控制台输出每项持仓的关键计算数据，用于调试
          console.log(`基金${holding.fundCode}(${holding.fundName})的最新净值:`, holding.latestNetValue);
          console.log(`基金${holding.fundCode}(${holding.fundName})的市值:`, holding.marketValue);
        });

        // 处理所有持仓数据，用于计算总计值
        let allHoldings = [];
        
        // 检查所有持仓数据的格式
        if (allHoldingsResponse && Array.isArray(allHoldingsResponse)) {
          // 直接是数组格式
          allHoldings = allHoldingsResponse;
        } else if (allHoldingsResponse && allHoldingsResponse.records && Array.isArray(allHoldingsResponse.records)) {
          // 包含records字段
          allHoldings = allHoldingsResponse.records;
        } else if (allHoldingsResponse && allHoldingsResponse.content && Array.isArray(allHoldingsResponse.content)) {
          // 包含content字段
          allHoldings = allHoldingsResponse.content;
        } else {
          // 其他情况，使用空数组
          allHoldings = [];
          console.log('未能获取所有持仓数据，总计值可能不准确');
        }

        console.log('获取到所有持仓数据数量:', allHoldings.length);

        // 处理所有持仓数据的计算
        allHoldings.forEach(holding => {
          // 检查市值是否需要前端计算
          if (!holding.marketValue) {
            holding.marketValue = holding.latestNetValue * holding.totalShares;
          }
          // 计算总成本和收益
          const cost = holding.averageCost * holding.totalShares;
          holding.profit = holding.marketValue - cost;
          holding.profitRate = cost > 0 ? holding.profit / cost : 0;
        });

        // 使用所有持仓数据计算总计值
        this.totalMarketValue = allHoldings.reduce((sum, item) => sum + item.marketValue, 0);
        this.totalProfit = allHoldings.reduce((sum, item) => sum + item.profit, 0);
        // 计算总成本
        const totalCost = allHoldings.reduce((sum, item) => sum + (item.averageCost * item.totalShares), 0);
        // 计算总收益率
        this.totalProfitRate = totalCost > 0 ? this.totalProfit / totalCost : 0;

        // 在控制台输出最终的计算结果，用于调试
        console.log('当前页持仓数据:', this.holdings);
        console.log('所有持仓数据:', allHoldings);
        console.log('总市值(所有持仓):', this.totalMarketValue);
        console.log('总收益(所有持仓):', this.totalProfit);
        console.log('总收益率(所有持仓):', this.totalProfitRate);
      } catch (error) {
        // 捕获并处理API请求或计算过程中发生的错误
        console.error('获取持仓信息失败:', error);
        // 如果是401未授权错误，提示用户登录
        if (error.response && error.response.status === 401) {
          this.$message.error('请先登录后再查看持仓信息');
          // 未登录时重定向到登录页面
          this.$router.push('/login');
        } else if (error.response && error.response.status === 403) {
          this.$message.error('您没有权限查看此信息');
        } else {
          // 其他错误，通用提示
          this.$message.error('获取持仓信息失败，请稍后再试');
        }
        // 出错时清空页面数据
        this.holdings = [];
        this.totalMarketValue = 0;
        this.totalProfit = 0;
        this.totalProfitRate = 0;
        this.total = 0; // 清空总记录数
      } finally {
        // 无论成功或失败，都结束加载状态
        this.loading = false;
      }
    },

    /**
     * @description 格式化数字，保留指定小数位数
     * @param {number} value - 需要格式化的数字
     * @param {number} [decimals=2] - 保留的小数位数，默认为2
     * @returns {string} 格式化后的字符串，或'N/A'
     */
    formatNumber(value, decimals = 2) {
      if (value === undefined || value === null) return 'N/A';
      return Number(value).toFixed(decimals);
    },

    /**
     * @description 格式化收益率，转换为百分比字符串
     * @param {number} rate - 需要格式化的收益率（小数形式）
     * @returns {string} 格式化后的百分比字符串，或'N/A'
     */
    formatRate(rate) {
      if (rate === undefined || rate === null) return 'N/A';
      return `${(rate * 100).toFixed(2)}%`;
    },

    /**
     * @description 根据数值正负返回对应的CSS类名
     * @param {number} value - 数值
     * @returns {string} 'profit-up' (正数), 'profit-down' (负数), 或 '' (零或无效值)
     */
    getProfitClass(value) {
      if (value === undefined || value === null) return '';
      return value > 0 ? 'profit-up' : value < 0 ? 'profit-down' : '';
    },

    /**
     * @description 跳转到基金详情页
     * @param {string} fundCode - 基金代码
     */
    viewDetails(fundCode) {
      this.$router.push(`/funds/${fundCode}`);
    },

    /**
     * @description 跳转到基金购买页
     * @param {string} fundCode - 基金代码
     */
    goPurchase(fundCode) {
      this.$router.push(`/funds/${fundCode}`);
    },

    /**
     * @description 跳转到基金赎回页
     * @param {string} fundCode - 基金代码
     */
    goRedeem(fundCode) {
      this.$router.push(`/funds/${fundCode}`);
    },

    /**
     * @description 跳转到基金超市列表页
     */
    goToFundList() {
      this.$router.push('/funds');
    },

    /**
     * @description 处理搜索按钮点击事件，重新获取数据
     */
    handleSearch() {
      this.fetchHoldings();
    },

    /**
     * @description 处理重置按钮点击事件，清空搜索条件并重新获取数据
     */
    resetSearch() {
      this.searchForm.fundCode = '';
      this.searchForm.fundName = '';
      this.currentPage = 1; // 重置为第一页
      this.fetchHoldings();
    },
    
    /**
     * @description 处理每页显示数量变化事件
     * @param {number} size - 新的每页显示数量
     */
    handleSizeChange(size) {
      console.log(`每页显示数量变更为: ${size}`);
      this.pageSize = size;
      this.fetchHoldings();
    },
    
    /**
     * @description 处理页码变化事件
     * @param {number} page - 新的页码
     */
    handleCurrentChange(page) {
      console.log(`当前页码变更为: ${page}`);
      this.currentPage = page;
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

/* 分页容器样式 */
.pagination-container {
  margin-top: 20px;
  text-align: center;
  padding: 10px 0;
}
</style>