<template>
  <div>
    <h2>基金超市</h2>

    <el-form :inline="true" :model="searchParams" @submit.native.prevent="handleSearch">
      <el-form-item label="基金名称/代码">
        <el-input v-model="searchParams.fundName" placeholder="输入名称或代码"></el-input>
      </el-form-item>
      <el-form-item label="基金类型">
        <el-select v-model="searchParams.fundType" placeholder="选择类型">
          <el-option label="全部" value=""></el-option>
          <el-option label="股票型" value="股票型"></el-option>
          <el-option label="混合型" value="混合型"></el-option>
          <el-option label="债券型" value="债券型"></el-option>
          </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="fundList" v-loading="loading" style="width: 100%">
      <el-table-column prop="fundCode" label="基金代码"></el-table-column>
      <el-table-column prop="fundName" label="基金名称"></el-table-column>
      <el-table-column prop="fundType" label="基金类型"></el-table-column>
      <el-table-column prop="netValue" label="最新净值"></el-table-column>
      <el-table-column prop="riskScore" label="风险等级"></el-table-column>
    </el-table>

    <el-pagination
      background
      layout="prev, pager, next"
      :total="total"
      :page-size="searchParams.size"
      :current-page.sync="searchParams.page"
      @current-change="handlePageChange">
    </el-pagination>
  </div>
</template>

<script>
import { searchFunds } from '@/api/fund.js'; // 导入我们封装好的API

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
    this.fetchFunds(); // 页面创建时，自动加载第一页数据
  },
  methods: {
    async fetchFunds() {
      this.loading = true;
      try {
        const responseData = await searchFunds(this.searchParams);
        this.fundList = responseData.records; // 后端返回的分页数据
        this.total = responseData.total;
      } catch (error) {
        this.$message.error('获取基金列表失败');
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      this.searchParams.page = 1; // 每次搜索都回到第一页
      this.fetchFunds();
    },
    handlePageChange(newPage) {
      this.searchParams.page = newPage;
      this.fetchFunds();
    }
  }
};
</script>