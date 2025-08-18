<template>
  <!-- 基金超市页面容器，使用flex布局实现自适应高度 -->
  <div class="fund-list-container flex-grow-container">
    <!-- 页面标题 -->
    <h2 class="page-title">基金超市</h2>

    <!-- 主要内容卡片，使用flex布局自动填充剩余空间 -->
    <el-card class="box-card flex-grow-card">
      <!-- 搜索表单：支持按基金名称/代码和基金类型搜索 -->
      <el-form
        :inline="true"
        :model="searchParams"
        class="search-form"
        @submit.native.prevent="handleSearch"
      >
        <el-row :gutter="20" style="width: 100%;">
          <!-- 基金名称/代码搜索框 -->
          <el-col :span="8">
            <el-form-item label="基金名称/代码" style="width: 100%;">
              <el-input v-model="searchParams.fundName" placeholder="输入名称或代码进行搜索" clearable style="width: 100%;"></el-input>
            </el-form-item>
          </el-col>
          <!-- 基金类型下拉选择框 -->
          <el-col :span="6">
            <el-form-item label="基金类型" style="width: 100%;">
              <el-select v-model="searchParams.fundType" placeholder="选择类型" clearable style="width: 100%;">
                <el-option label="全部" value=""></el-option>
                <el-option label="股票型" value="股票型"></el-option>
                <el-option label="混合型" value="混合型"></el-option>
                <el-option label="债券型" value="债券型"></el-option>
                <el-option label="货币型" value="货币型"></el-option>
                <el-option label="基金型" value="基金型"></el-option>
                <el-option label="保本型" value="保本型"></el-option>
                <el-option label="REITs" value="REITs"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 查询按钮 -->
          <el-col :span="4">
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="handleSearch">查 询</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 基金数据表格 -->
      <el-table
        :data="fundList"
        v-loading="loading"
        style="width: 100%; margin-top: 20px;"
        stripe
        border
      >
        <!-- 基金代码列 -->
        <el-table-column prop="fundCode"       label="基金代码"   width="120" align="center"></el-table-column>
        <!-- 基金名称列 -->
        <el-table-column prop="abbreviation"   label="基金名称"></el-table-column>
        <!-- 基金类型列：显示格式化后的基金类型 -->
        <el-table-column label="基金类型"   width="120" align="center">
            <template slot-scope="scope">
                {{ formatFundType(scope.row.fundInvestType) }}
            </template>
        </el-table-column>
        <!-- 最新净值列：保留4位小数 -->
        <el-table-column label="最新净值"   width="120" align="center">
            <template slot-scope="scope">
                {{ scope.row.latestNetValue ? scope.row.latestNetValue.toFixed(4) : 'N/A' }}
            </template>
        </el-table-column>
        <!-- 操作列：查看详情按钮 -->
        <el-table-column label="操作"          width="150" align="center">
          <template slot-scope="scope">
            <el-button size="mini" @click="viewDetails(scope.row.fundCode)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
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
/**
 * 基金超市页面组件
 * 展示基金列表，支持按名称/代码和类型搜索，分页显示，查看详情
 */
import { searchFunds } from '@/api/fund.js';

export default {
  name: 'FundList',
  data() {
    return {
      loading: false,  // 加载状态标志
      fundList: [],    // 基金列表数据
      total: 0,        // 总记录数
      searchParams: {  // 搜索参数
        page: 1,       // 当前页码
        size: 10,      // 每页显示条数
        fundName: '',  // 基金名称或代码关键词
        fundType: ''   // 基金类型
      }
    };
  },
  /**
   * 组件创建时的钩子函数
   * 初始化时获取基金列表数据
   */
  created() {
    this.fetchFunds();
  },
  methods: {
    /**
     * 获取基金列表数据
     * 根据搜索条件和分页参数从API获取基金列表
     */
    async fetchFunds() {
      this.loading = true;
      try {
        const responseData = await searchFunds(this.searchParams);
        this.fundList = responseData.records;  // 更新基金列表数据
        this.total = responseData.total;       // 更新总记录数
      } catch (error) {
        this.$message.error('获取基金列表失败，请稍后重试');
        console.error("获取基金列表失败:", error);
      } finally {
        this.loading = false;  // 无论成功失败，都关闭加载状态
      }
    },
    /**
     * 处理搜索按钮点击事件
     * 重置页码并获取符合搜索条件的基金列表
     */
    handleSearch() {
      this.searchParams.page = 1;
      this.fetchFunds();
    },
    /**
     * 处理页码变化事件
     * @param {Number} newPage - 新的页码
     */
    handlePageChange(newPage) {
      this.searchParams.page = newPage;
      this.fetchFunds();
    },
    /**
     * 查看基金详情
     * @param {String} fundCode - 基金代码
     */
    viewDetails(fundCode) {
      this.$router.push(`/funds/${fundCode}`);
    },
    /**
     * 格式化基金类型显示
     * 将基金类型代码转换为中文显示
     * @param {String} typeCode - 基金类型代码
     * @return {String} 格式化后的基金类型名称
     */
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