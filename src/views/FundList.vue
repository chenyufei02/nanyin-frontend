<template>
  <div class="fund-list-container flex-grow-container">
    <h2 class="page-title">基金超市</h2>

    <el-card class="box-card flex-grow-card">
      <el-form
        :inline="true"
        :model="searchParams"
        class="search-form"
        @submit.native.prevent="handleSearch"
      >
        <el-row :gutter="20" style="width: 100%;">
          <el-col :span="8">
            <el-form-item label="基金名称/代码" style="width: 100%;">
              <el-input v-model="searchParams.fundName" placeholder="输入名称或代码进行搜索" clearable style="width: 100%;"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="基金类型" style="width: 100%;">
              <el-select v-model="searchParams.fundType" placeholder="选择类型" clearable style="width: 100%;">
                <el-option label="全部" value=""></el-option>
                <el-option label="股票型" value="股票型"></el-option>
                <el-option label="混合型" value="混合型"></el-option>
                <el-option label="债券型" value="债券型"></el-option>
                <el-option label="指数型" value="指数型"></el-option>
                <el-option label="货币型" value="货币型"></el-option>
                <el-option label="基金型" value="基金型"></el-option>
                <el-option label="保本型" value="保本型"></el-option>
                <el-option label="REITs" value="REITs"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="handleSearch">查 询</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-table
        :data="fundList"
        v-loading="loading"
        style="width: 100%; margin-top: 20px;"
        stripe
        border
      >
        <el-table-column prop="fundCode"       label="基金代码"   width="120" align="center"></el-table-column>
        <el-table-column prop="abbreviation"   label="基金名称"></el-table-column>
        <el-table-column label="基金类型"   width="120" align="center">
            <template slot-scope="scope">
                {{ formatFundType(scope.row.fundInvestType) }}
            </template>
        </el-table-column>
        <el-table-column label="最新净值"   width="120" align="center">
            <template slot-scope="scope">
                {{ scope.row.latestNetValue ? scope.row.latestNetValue.toFixed(4) : 'N/A' }}
            </template>
        </el-table-column>
        <el-table-column label="操作"          width="150" align="center">
          <template slot-scope="scope">
            <el-button size="mini" @click="viewDetails(scope.row.fundCode)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper"
          :total="total"
          :page-size="searchParams.size"
          :current-page.sync="searchParams.page"
          @current-change="handlePageChange"
          :hide-on-single-page="false"> </el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script>
import { searchFunds } from '@/api/fund.js';

export default {
  name: 'FundList',
  data() {
    return {
      loading: false,
      fundList: [],
      total: 0,
      searchParams: {
        page: 1,
        size: 10,
        fundName: '',
        fundType: ''
      }
    };
  },
  created() {
    this.fetchFunds();
  },
  methods: {
    async fetchFunds() {
      this.loading = true;
      try {
        const responseData = await searchFunds(this.searchParams);
        this.fundList = responseData.records;
        this.total = responseData.total;
      } catch (error) {
        this.$message.error('获取基金列表失败，请稍后重试');
        console.error("获取基金列表失败:", error);
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      this.searchParams.page = 1;
      this.fetchFunds();
    },
    handlePageChange(newPage) {
      this.searchParams.page = newPage;
      this.fetchFunds();
    },
    viewDetails(fundCode) {
      this.$router.push(`/funds/${fundCode}`);
    },
    formatFundType(typeCode) {
      const typeMap = {
        '0': '股票型', '1': '债券型', '2': '混合型', '3': '货币型',
        '6': '基金型', '7': '保本型', '8': 'REITs'
      };
      return typeMap[typeCode] || '其他';
    }
  }
};
</script>

<style scoped>
/* 定义一个可以自动成长的Flex容器的样式 */
.flex-grow-container {
  display: flex;
  flex-direction: column;
  /* 【核心修正】使用 vh 单位，让容器高度等于视口高度减去顶部导航栏高度 */
  height: calc(100vh - 60px);
}

/* 让卡片在Flex容器中自动成长，占据剩余空间 */
.flex-grow-card {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

/* 让卡片的内容区（包含表格）也自动成长 */
.flex-grow-card >>> .el-card__body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  /* 【核心修正】移除 height: 100%，因为它在Flex子项中可能导致计算错误 */
}


/* 让表格在卡片内容区中自动成长 */
.flex-grow-card >>> .el-table {
  flex-grow: 1;
  /* 【核心修正】设置 height: 0，这是让flex-grow正确计算高度的关键技巧 */
  height: 0;
}

/* --- 以下为页面原有样式 --- */

.fund-list-container {
  padding: 20px;
}
.page-title {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 20px;
  margin-top: 0;
}
.fund-list-container >>> .el-table {
    font-size: 14px;
}
.search-form .el-form-item {
  width: 100%;
  margin-bottom: 0;
}
.search-form .el-row {
  align-items: center;
}
.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>