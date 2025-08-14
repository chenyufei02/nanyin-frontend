<template>
  <div class="holding-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <h2>我的持仓</h2>
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
              {{ formatNumber(scope.row.shares) }}
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
          <el-table-column label="操作" width="240" align="center">
            <template slot-scope="scope">
              <el-button size="mini" type="primary" @click="viewDetails(scope.row.fundCode)">查看详情</el-button>
              <el-button size="mini" type="success" @click="goToPurchase(scope.row.fundCode)">申购</el-button>
              <el-button size="mini" type="warning" @click="showRedeemDialog(scope.row)">赎回</el-button>
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

    <!-- 赎回对话框 -->
    <el-dialog title="基金赎回" :visible.sync="redeemDialogVisible" width="40%">
      <div v-if="currentHolding">
        <el-form :model="redeemForm" :rules="redeemRules" ref="redeemFormRef" label-width="120px">
          <el-form-item label="基金代码">
            <el-input v-model="redeemForm.fundCode" disabled></el-input>
          </el-form-item>
          <el-form-item label="基金名称">
            <el-input v-model="redeemForm.fundName" disabled></el-input>
          </el-form-item>
          <el-form-item label="持有份额">
            <el-input :value="formatNumber(currentHolding.shares)" disabled></el-input>
          </el-form-item>
          <el-form-item label="最新净值">
            <el-input :value="formatNumber(currentHolding.netValue, 4)" disabled></el-input>
          </el-form-item>
          <el-form-item label="赎回份额" prop="shares">
            <el-input v-model.number="redeemForm.shares" placeholder="请输入赎回份额" type="number" min="0">
              <template slot="append">
                <el-button type="text" @click="setMaxShares">全部赎回</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="交易银行卡号" prop="bankCardNo">
            <el-input
              v-model="redeemForm.bankCardNo"
              placeholder="请输入收款银行卡号"
              maxlength="19"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="redeemDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleRedeem">确认赎回</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// 导入API函数
import { getMyHoldings } from '@/api/fund.js';
import { redeemFund } from '@/api/user.js';

export default {
  name: 'UserHolding',
  data() {
    return {
      loading: true,
      holdings: [],
      totalMarketValue: 0,
      totalProfit: 0,
      totalProfitRate: 0,
      redeemDialogVisible: false,
      currentHolding: null,
      submitting: false,
      redeemForm: {
        fundCode: '',
        fundName: '',
        shares: null,
        bankCardNo: ''
      },
      redeemRules: {
        shares: [
          { required: true, message: '请输入赎回份额', trigger: 'blur' },
          { type: 'number', message: '份额必须是数字', trigger: 'blur' }
        ],
        bankCardNo: [
          { required: true, message: '请输入银行卡号', trigger: 'blur' },
          { pattern: /^\d{10,19}$/, message: '银行卡号需为10-19位数字', trigger: 'blur' }
        ]
      }
    };
  },
  
  created() {
    // 在created钩子中添加自定义验证器
    this.redeemRules.shares.push({ validator: this.validateShares, trigger: 'blur' });
    
    // 获取持仓数据
    this.fetchHoldings();
  },
  methods: {
    // 获取持仓数据
    async fetchHoldings() {
      this.loading = true;
      try {
        const data = await getMyHoldings();
        this.holdings = data.holdings || [];
        this.totalMarketValue = data.totalMarketValue || 0;
        this.totalProfit = data.totalProfit || 0;
        this.totalProfitRate = data.totalProfitRate || 0;
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
    // 跳转到基金列表
    goToFundList() {
      this.$router.push('/funds');
    },
    // 跳转到申购页面
    goToPurchase(fundCode) {
      this.$router.push(`/funds/${fundCode}/purchase`);
    },
    // 显示赎回对话框
    showRedeemDialog(holding) {
      this.currentHolding = holding;
      this.redeemForm.fundCode = holding.fundCode;
      this.redeemForm.fundName = holding.fundName;
      this.redeemForm.shares = null;
      this.redeemForm.bankCardNo = '';
      this.redeemDialogVisible = true;
      
      // 重置表单验证
      if (this.$refs.redeemFormRef) {
        this.$refs.redeemFormRef.clearValidate();
      }
    },

    // 设置最大赎回份额
    setMaxShares() {
      if (this.currentHolding) {
        this.redeemForm.shares = this.currentHolding.shares;
      }
    },

    // 验证赎回份额
    validateShares(rule, value, callback) {
      if (this.currentHolding && value > this.currentHolding.shares) {
        callback(new Error(`赎回份额不能超过持有份额 ${this.formatNumber(this.currentHolding.shares)}份`));
      } else if (value <= 0) {
        callback(new Error('赎回份额必须大于0'));
      } else {
        callback();
      }
    },

    // 处理赎回提交
    handleRedeem() {
      this.$refs.redeemFormRef.validate(async (valid) => {
        if (valid) {
          this.submitting = true;
          try {
            const payload = {
              fundCode: this.redeemForm.fundCode,
              bankCardNo: this.redeemForm.bankCardNo,
              bank_account_number: this.redeemForm.bankCardNo, // 添加bank_account_number字段以兼容后端
              unitNetValue: this.currentHolding.netValue,
              shares: this.redeemForm.shares,
              amount: this.redeemForm.shares * this.currentHolding.netValue,
              transactionTime: new Date().toISOString()
            };

            // 调用赎回API
            await redeemFund(payload);
            this.$message.success('赎回申请提交成功');
            this.redeemDialogVisible = false;
            
            // 刷新持仓数据
            this.fetchHoldings();
          } catch (error) {
            console.error('赎回失败:', error);
            this.$message.error('赎回失败: ' + (error.message || '未知错误'));
          } finally {
            this.submitting = false;
          }
        }
      });
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
</style>