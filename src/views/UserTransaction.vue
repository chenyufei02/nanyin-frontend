<template>
  <div class="transaction-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <h2>交易记录</h2>
      </div>
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="transaction-tabs">
        <el-tab-pane label="全部交易" name="all"></el-tab-pane>
        <el-tab-pane label="购买记录" name="purchase"></el-tab-pane>
        <el-tab-pane label="赎回记录" name="redeem"></el-tab-pane>
      </el-tabs>


      <el-form :model="filterForm" class="filter-form">
          <el-row :gutter="20" type="flex" justify="left" align="middle">
              <el-col :span="5">
                  <el-form-item label="交易ID" style="margin-bottom: 0;">
                      <el-input v-model="filterForm.transactionId" placeholder="请输入交易ID" clearable></el-input>
                  </el-form-item>
              </el-col>
              <el-col :span="5">
                  <el-form-item label="基金代码" style="margin-bottom: 0;">
                      <el-input v-model="filterForm.fundCode" placeholder="请输入基金代码" clearable></el-input>
                  </el-form-item>
              </el-col>
              <el-col :span="5">
                  <el-form-item label="基金名称" style="margin-bottom: 0;">
                      <el-input v-model="filterForm.fundName" placeholder="请输入基金名称" clearable></el-input>
                  </el-form-item>
              </el-col>
              <el-col :span="4">
                  <el-form-item style="margin-bottom: 0;">
                      <el-button type="primary" @click="handleFilter">查询</el-button>
                      <el-button @click="resetFilter">重置</el-button>
                  </el-form-item>
              </el-col>
          </el-row>
      </el-form>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="6" animated />
      </div>

      <!-- 空数据状态 -->
      <div v-else-if="transactions.length === 0" class="empty-container">
        <el-empty description="暂无交易记录" />
        <el-button type="primary" @click="goToFundList">去基金超市</el-button>
      </div>

      <!-- 交易记录表格 -->
      <div v-else>
        <el-table
          :data="transactions"
          style="width: 100%"
          border
          stripe
        >
          <el-table-column prop="id" label="交易ID" width="120" align="center" />
          <el-table-column prop="fundCode" label="基金代码" width="120" align="center" />
          <el-table-column prop="fundName" label="基金名称" min-width="180" />
          <el-table-column label="交易类型" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="getTransactionTypeTag(scope.row.transactionType)">
                {{ formatTransactionType(scope.row.transactionType) }}
              </el-tag>
            </template>
          </el-table-column>
          <!-- 交易金额列 -->
          <el-table-column label="交易金额" width="120" align="right">
            <template slot-scope="scope">
              {{ scope.row.amount || scope.row.transactionAmount || '数据缺失' }}
            </template>
          </el-table-column>
          <!-- 交易份额列 -->
          <el-table-column label="交易份额" width="120" align="right">
            <template slot-scope="scope">
              {{ scope.row.shares || scope.row.transactionShares || '数据缺失' }}
            </template>
          </el-table-column>
          <el-table-column label="银行卡号" width="150" align="center">
            <template slot-scope="scope">
              {{ scope.row.bankAccountNumber || '未记录' }}
            </template>
          </el-table-column>
          <el-table-column label="交易状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="getStatusTag(scope.row.status)">
                {{ formatStatus(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="交易时间" width="180" align="center">
            <template slot-scope="scope">
              {{ formatDateTime(scope.row.transactionTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template slot-scope="scope">
              <el-button size="mini" type="primary" @click="viewDetails(scope.row.fundCode)">查看基金</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <div class="pagination-container">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
          >
          </el-pagination>
        </div>
      </div>
    </el-card>

    <!-- 交易详情对话框 -->
    <el-dialog title="交易详情" :visible.sync="dialogVisible" width="50%">
      <div v-if="currentTransaction">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="交易ID">{{ currentTransaction.transactionId }}</el-descriptions-item>
          <el-descriptions-item label="基金代码">{{ currentTransaction.fundCode }}</el-descriptions-item>
          <el-descriptions-item label="基金名称">{{ currentTransaction.fundName }}</el-descriptions-item>
          <el-descriptions-item label="交易类型">
            <el-tag :type="getTransactionTypeTag(currentTransaction.transactionType)">
              {{ formatTransactionType(currentTransaction.transactionType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="交易金额">{{ formatNumber(currentTransaction.amount, 2) }}</el-descriptions-item>
          <el-descriptions-item label="交易份额">{{ formatNumber(currentTransaction.shares, 2) }}</el-descriptions-item>
          <el-descriptions-item label="银行卡号">{{ currentTransaction.bank_account_number || currentTransaction.bankCardNo || '未记录' }}</el-descriptions-item>
          <el-descriptions-item label="交易状态">
            <el-tag :type="getStatusTag(currentTransaction.status)">
              {{ formatStatus(currentTransaction.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="交易时间">{{ formatDateTime(currentTransaction.transactionTime) }}</el-descriptions-item>
          <el-descriptions-item label="确认时间" :span="2">{{ formatDateTime(currentTransaction.confirmTime) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentTransaction.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <!-- 对话框底部按钮 -->
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="viewFundDetails(currentTransaction.fundCode)">查看基金详情</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// 导入交易记录相关的API函数
import { getMyTransactions, getTransactionById } from '@/api/transaction.js';
// 导入时间格式化库
import moment from 'moment';

export default {
  name: 'UserTransaction',
  data() {
    return {
      // 页面加载状态
      loading: true,
      // 交易记录数据数组
      transactions: [],
      // 分页相关数据
      currentPage: 1,    // 当前页码
      pageSize: 10,      // 每页显示条数
      total: 0,          // 总记录数
      // 筛选表单数据
      filterForm: {
        transactionId: '',  // 交易ID筛选
        fundCode: '',       // 基金代码筛选
        fundName: ''        // 基金名称筛选
      },
      // 交易详情对话框显示状态
      dialogVisible: false,
      // 当前选中的交易记录
      currentTransaction: null,
      // 当前激活的标签页
      activeTab: 'all'
    };
  },
  // 组件创建时获取交易记录
  created() {
    this.fetchTransactions();
  },
  methods: {
    // 获取交易记录数据的核心方法
    async fetchTransactions() {
      this.loading = true;
      try {
        // 如果有交易ID筛选条件，则获取单条交易记录
        if (this.filterForm.transactionId) {
          const data = await getTransactionById(this.filterForm.transactionId);
          if (data) {
            // 根据当前标签页筛选交易类型
            let shouldShow = true;
            if (this.activeTab === 'purchase' && data.transactionType !== '申购') {
              shouldShow = false;
            } else if (this.activeTab === 'redeem' && data.transactionType !== '赎回') {
              shouldShow = false;
            }
            
            if (shouldShow) {
              this.transactions = [data];
              this.total = 1;
            } else {
              this.transactions = [];
              this.total = 0;
              this.$message.warning('该交易记录不属于当前标签页类型');
            }
          } else {
            this.transactions = [];
            this.total = 0;
            this.$message.warning('未找到该交易记录');
          }
        } else {
          // 否则获取所有交易记录
          const data = await getMyTransactions();
          let allTransactions = data.transactions || [];
          
          // 根据标签页筛选交易类型
          if (this.activeTab === 'purchase') {
            allTransactions = allTransactions.filter(t => t.transactionType === '申购');
          } else if (this.activeTab === 'redeem') {
            allTransactions = allTransactions.filter(t => t.transactionType === '赎回');
          }
          
          // 根据筛选条件过滤交易记录
          if (this.filterForm.fundCode) {
            allTransactions = allTransactions.filter(t => 
              t.fundCode && t.fundCode.toLowerCase().includes(this.filterForm.fundCode.toLowerCase()));
          }
          
          if (this.filterForm.fundName) {
            allTransactions = allTransactions.filter(t => 
              t.fundName && t.fundName.toLowerCase().includes(this.filterForm.fundName.toLowerCase()));
          }
          
          // 按交易ID升序排列
          allTransactions.sort((a, b) => {
            const idA = parseInt(a.id) || 0;
            const idB = parseInt(b.id) || 0;
            return idA - idB;
          });
          
          this.transactions = allTransactions;
          this.total = allTransactions.length;
        }
      } catch (error) {
        console.error('获取交易记录失败:', error);
        if (error.response && error.response.status === 401) {
          this.$message.error('请先登录后再查看交易记录');
          // 401错误已在request.js中处理，会自动跳转到登录页
        } else {
          this.$message.error('获取交易记录失败，请稍后再试');
        }
        // 清空数据
        this.transactions = [];
        this.total = 0;
      } finally {
        this.loading = false;
      }
    },
    
    // 处理筛选查询
    handleFilter() {
      this.currentPage = 1;
      this.fetchTransactions();
    },
    
    // 处理标签页切换
    handleTabClick() {
      this.currentPage = 1;
      this.fetchTransactions();
    },
    
    // 重置筛选条件
    resetFilter() {
      this.filterForm.transactionId = '';
      this.filterForm.fundCode = '';
      this.filterForm.fundName = '';
      this.currentPage = 1;
      this.fetchTransactions();
    },
    
    // 查看交易详情（通过ID获取详细信息）
    async viewTransactionDetail(transactionId) {
      try {
        const data = await getTransactionById(transactionId);
        if (data) {
          this.currentTransaction = data;
          this.dialogVisible = true;
        } else {
          this.$message.warning('未找到该交易记录');
        }
      } catch (error) {
        console.error('获取交易详情失败:', error);
        this.$message.error('获取交易详情失败，请稍后再试');
      }
    },
    
    // 查看基金详情（跳转到基金详情页）
    viewDetails(fundCode) {
      this.$router.push(`/funds/${fundCode}`);
    },
    
    // 从对话框中查看基金详情
    viewFundDetails(fundCode) {
      this.dialogVisible = false;
      this.$router.push(`/funds/${fundCode}`);
    },
    
    // 跳转到基金列表页面
    goToFundList() {
      this.$router.push('/funds');
    },
    
    // 分页大小改变处理
    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchTransactions();
    },
    
    // 当前页码改变处理
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchTransactions();
    },
    
    // 格式化数字显示（保留指定小数位）
    formatNumber(value, decimals = 2) {
      if (value === undefined || value === null) return 'N/A';
      return Number(value).toFixed(decimals);
    },
    
    // 格式化日期时间显示
    formatDateTime(dateTime) {
      if (!dateTime) return 'N/A';
      return moment(dateTime).format('YYYY-MM-DD HH:mm:ss');
    },
    
    // 格式化交易类型显示文本
    formatTransactionType(type) {
      const typeMap = {
        'BUY': '购买',
        'SELL': '赎回',
        'DIVIDEND': '分红',
        'TRANSFER_IN': '转入',
        'TRANSFER_OUT': '转出'
      };
      return typeMap[type] || type;
    },
    
    // 获取交易类型对应的标签颜色类型
    getTransactionTypeTag(type) {
      const tagMap = {
        'BUY': 'success',      // 绿色
        'SELL': 'danger',      // 红色
        'DIVIDEND': 'warning', // 橙色
        'TRANSFER_IN': 'info', // 蓝色
        'TRANSFER_OUT': 'info' // 蓝色
      };
      return tagMap[type] || '';
    },
    
    // 格式化交易状态显示文本
    formatStatus(status) {
      const statusMap = {
        'PENDING': '处理中',
        'CONFIRMED': '已确认',
        'COMPLETED': '已完成',
        'FAILED': '失败',
        'CANCELLED': '已取消'
      };
      return statusMap[status] || status;
    },
    
    // 获取交易状态对应的标签颜色类型
    getStatusTag(status) {
      const tagMap = {
        'PENDING': 'info',     // 蓝色 - 处理中
        'CONFIRMED': 'warning', // 橙色 - 已确认
        'COMPLETED': 'success', // 绿色 - 已完成
        'FAILED': 'danger',     // 红色 - 失败
        'CANCELLED': 'info'     // 蓝色 - 已取消
      };
      return tagMap[status] || '';
    }
  }
};
</script>

<style scoped>
/* 交易记录页面主容器样式 */
.transaction-container {
  padding: 20px;
}
/* 筛选表单样式 */
.filter-form {
  margin-bottom: 20px;
}
/* 标签页样式 */
.transaction-tabs {
  margin-bottom: 15px;
}
/* 加载和空数据容器样式 */
.loading-container,
.empty-container {
  padding: 40px;
  text-align: center;
}
/* 空数据状态下的按钮样式 */
.empty-container .el-button {
  margin-top: 20px;
}
/* 分页组件容器样式 */
.pagination-container {
  margin-top: 20px;
  text-align: right;
}
/* 标签页头部样式 */
.el-tabs__header {
  margin-bottom: 15px;
}
</style>
