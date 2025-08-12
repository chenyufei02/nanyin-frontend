<template>
  <div class="fund-list-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <h2>基金超市</h2>
      </div>

      <el-form
        :inline="true"
        :model="searchParams"
        class="search-form"
        @submit.native.prevent="handleSearch"
      >
        <el-form-item label="基金名称/代码">
          <el-input v-model="searchParams.fundName" placeholder="输入名称或代码进行搜索" clearable></el-input>
        </el-form-item>
        <el-form-item label="基金类型">
          <el-select v-model="searchParams.fundType" placeholder="选择类型" clearable>
            <el-option label="全部" value=""></el-option>
            <el-option label="股票型" value="股票型"></el-option>
            <el-option label="混合型" value="混合型"></el-option>
            <el-option label="债券型" value="债券型"></el-option>
            <el-option label="指数型" value="指数型"></el-option>
            <el-option label="货币型" value="货币型"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">查 询</el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="fundList"
        v-loading="loading"
        style="width: 100%;"
        stripe
        border
      >
        <el-table-column prop="fundCode"       label="基金代码"   width="120" align="center"></el-table-column>
        <el-table-column prop="abbreviation"   label="基金名称"></el-table-column>
        <el-table-column label="基金类型" width="120" align="center">
          <template slot-scope="scope">
            {{ formatFundType(scope.row.fundInvestType) }}
          </template>
        </el-table-column>
        <el-table-column label="最新净值" width="120" align="center">
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
          @current-change="handlePageChange">
        </el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script>
// 1. 导入我们之前在 fund.js 中封装好的API函数
import { searchFunds } from '@/api/fund.js';

export default {
  name: 'FundList',
  data() {
    return {
      loading: false,     // 表格的加载状态
      fundList: [],       // 表格显示的数据
      total: 0,           // 数据总条数，用于分页
      searchParams: {     // 搜索和分页的参数
        page: 1,
        size: 10,
        fundName: '',
        fundType: ''
      }
    };
  },
  created() {
    // 页面一加载，就立刻去获取第一页的数据
    this.fetchFunds();
  },
  methods: {
    // 核心方法：从后端获取基金数据
    async fetchFunds() {
      this.loading = true; // 开始加载
      try {
        // 调用API函数，并传入当前的搜索和分页参数
        const responseData = await searchFunds(this.searchParams);

        // Mybatis-Plus分页返回的数据结构是 { records: [...], total: ... }
        this.fundList = responseData.records;
        this.total = responseData.total;

      } catch (error) {
        this.$message.error('获取基金列表失败，请稍后重试');
        console.error("获取基金列表失败:", error);
      } finally {
        this.loading = false; // 结束加载
      }
    },
    // 点击“查询”按钮时触发
    handleSearch() {
      this.searchParams.page = 1; // 每次执行新的搜索时，都应该回到第一页
      this.fetchFunds();
    },
    // 当分页器的页码发生变化时触发
    handlePageChange(newPage) {
      this.searchParams.page = newPage;
      this.fetchFunds();
    },
    // 点击“查看详情”时触发
    viewDetails(fundCode) {
      // 使用路由跳转到详情页，并通过路径传递基金代码
      this.$router.push(`/funds/${fundCode}`);
    },
    formatFundType(typeCode) {
      // 这是我们在 fund_basic_info 表注释中约定的规则
      const typeMap = {
        '0': '股票型',
        '1': '债券型',
        '2': '混合型',
        '3': '货币型',
        '6': '基金型',
        '7': '保本型',
        '8': 'REITs'
      };
      return typeMap[typeCode] || '其他'; // 如果找不到对应的类型，显示“其他”
    }


  }
};
</script>

<style scoped>
.fund-list-container {
  padding: 20px;
}
.search-form {
  margin-bottom: 20px;
}
.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>