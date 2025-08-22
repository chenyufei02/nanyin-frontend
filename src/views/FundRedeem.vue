<template>
  <!-- 基金赎回页面容器 -->
  <div class="redeem-container" v-if="!loading && fund">
    <!-- 主要内容卡片 -->
    <el-card class="box-card">
      <!-- 卡片头部标题 -->
      <div slot="header" class="clearfix">
        <span>赎回基金</span>
      </div>

      <!-- 基金赎回表单 -->
      <el-form :model="form" :rules="rules" ref="redeemForm" label-width="120px">
        <!-- 基金代码输入框（只读） -->
        <el-form-item label="基金代码">
          <el-input v-model="form.fundCode" disabled></el-input>
        </el-form-item>
        <!-- 基金名称输入框（只读） -->
        <el-form-item label="基金名称">
          <el-input v-model="form.fundName" disabled></el-input>
        </el-form-item>
        <!-- 收款银行卡号输入框（带验证） -->
        <el-form-item label="收款银行卡号" prop="bankCardNo">
          <el-input
            v-model="form.bankCardNo"
            placeholder="请输入收款银行卡号"
            maxlength="19"
            @input="onBankCardInput"
          ></el-input>
        </el-form-item>
        <!-- 当前持有份额显示（只读） -->
        <el-form-item label="当前持有份额">
          <el-input :value="currentHoldingShares" disabled>
             <template slot="append">份</template>
          </el-input>
        </el-form-item>
        <!-- 赎回份额输入框（带验证） -->
        <el-form-item label="赎回份额" prop="shares">
          <el-input v-model="form.shares" placeholder="请输入要赎回的份额">
             <template slot="append">份</template>
          </el-input>
          <!-- 全部赎回按钮 -->
          <div style="margin-top: 8px;">
            <el-button size="small" type="text" @click="redeemAll">全部赎回</el-button>
          </div>
        </el-form-item>

        <!-- 操作按钮组 -->
        <el-form-item>
          <el-button type="danger" :loading="submitting" @click="handleSubmit">赎 回</el-button>
          <el-button @click="goBack">返回详情</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
  <!-- 加载状态显示 -->
  <div v-else class="loading-container">
    <el-skeleton :rows="6" animated />
  </div>
</template>

<script>
// 导入基金相关API
import { getFundDetail } from '@/api/fund.js';
// 导入用户赎回API
import { redeemFund } from '@/api/user.js';
// 导入持仓相关API
import { getMyHoldings } from '@/api/holding.js';

export default {
  name: 'FundRedeem',
  data() {
    // 赎回份额自定义校验器
    const validateShares = (rule, value, callback) => {
      // 检查是否为空
      if (!value || String(value).trim() === '') {
        return callback(new Error('请输入赎回份额'));
      }
      // 检查份额格式（支持最多四位小数）
      if (!/^\d+(\.\d{1,4})?$/.test(value)) {
        return callback(new Error('请输入有效的数字格式（最多四位小数）'));
      }
      const numericValue = parseFloat(value);
      // 检查份额是否大于0
      if (numericValue <= 0) {
        return callback(new Error('赎回份额必须大于0'));
      }
      // 检查赎回份额是否超过持有份额
      if (numericValue > this.currentHoldingShares) {
        return callback(new Error(`赎回份额不能超过持有的 ${this.currentHoldingShares} 份`));
      }
      callback();
    };

    // 银行卡号Luhn算法校验器（与购买页面一致）
    const validateBankCard = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请输入银行卡号'));
      }
      // 检查银行卡号长度和格式
      if (!/^\d{10,19}$/.test(value)) {
        return callback(new Error('银行卡号需为10-19位数字'));
      }
      // 使用Luhn算法验证银行卡号
      if (!this.luhnCheck(value)) {
        return callback(new Error('银行卡号不合法，请检查后重试'));
      }
      callback();
    };

    return {
      loading: true,              // 页面加载状态
      submitting: false,          // 表单提交状态
      fund: null,                // 基金详情数据
      currentHoldingShares: 0,   // 当前持有份额
      // 表单数据
      form: {
        fundCode: '',            // 基金代码
        fundName: '',            // 基金名称
        shares: '',              // 赎回份额
        bankCardNo: ''           // 收款银行卡号
      },
      // 表单验证规则
      rules: {
        shares: [
          { required: true, validator: validateShares, trigger: 'blur' }
        ],
        bankCardNo: [
          { required: true, validator: validateBankCard, trigger: 'blur' }
        ]
      }
    };
  },
  created() {
    // 组件创建时获取路由参数并初始化
    const fundCode = this.$route.params.fundCode;
    this.init(fundCode);
  },
  methods: {
    // 银行卡号输入处理 - 只允许数字输入
    onBankCardInput(value) {
      const digitsOnly = String(value || '').replace(/\D+/g, '');
      this.form.bankCardNo = digitsOnly.slice(0, 19);
    },
    // Luhn算法校验银行卡号有效性
    luhnCheck(numberString) {
      const digits = (numberString || '').split('').reverse().map(d => parseInt(d, 10));
      let sum = 0;
      for (let i = 0; i < digits.length; i++) {
        let digit = digits[i];
        // 偶数位置数字乘以2
        if (i % 2 === 1) {
          digit *= 2;
          // 如果结果大于9，减去9
          if (digit > 9) digit -= 9;
        }
        sum += digit;
      }
      // 总和能被10整除则有效
      return sum % 10 === 0;
    },

    // 初始化页面数据
    async init(fundCode) {
      this.loading = true;
      try {
        // 并行获取基金详情和用户持仓信息
        const [fundDetail, allHoldings] = await Promise.all([
          getFundDetail(fundCode),
          getMyHoldings()
        ]);

        // 设置基金信息
        this.fund = fundDetail;
        this.form.fundCode = this.fund?.basicInfo?.fundCode || fundCode;
        this.form.fundName = this.fund?.basicInfo?.fundName || '';

        // 查找当前基金的持仓信息
        const currentHolding = allHoldings.find(h => h.fundCode === fundCode);
        if (currentHolding) {
          this.currentHoldingShares = Number(currentHolding.totalShares);
        } else {
          this.currentHoldingShares = 0;
        }
      } catch (e) {
        this.$message.error('加载页面信息失败');
        console.error("初始化赎回页面失败:", e);
      } finally {
        this.loading = false;
      }
    },
    // 返回基金详情页
    goBack() {
      this.$router.push(`/funds/${this.form.fundCode}`);
    },
    // 处理赎回提交
    handleSubmit() {
      // 验证表单
      this.$refs.redeemForm.validate(async valid => {
        if (!valid) return;

        // 构建赎回请求数据
        const payload = {
          fundCode: this.form.fundCode,
          transactionShares: this.form.shares,
          bank_account_number: this.form.bankCardNo, // 收款银行卡号
          transactionTime: new Date().toISOString()
        };

        this.submitting = true;
        try {
          // 调用赎回API
          await redeemFund(payload);
          this.$message.success('赎回成功！正在跳转到我的持仓...');
          // 赎回成功后跳转到持仓页面
          setTimeout(() => {
            this.$router.push('/my-holdings');
          }, 1500);
        } catch (e) {
          this.$message.error(e.message || '赎回失败');
        } finally {
          this.submitting = false;
        }
      });
    },
    
    // 全部赎回方法
    redeemAll() {
      if (this.currentHoldingShares > 0) {
        // 将当前持有份额填入赎回份额输入框，保留4位小数
        this.form.shares = this.currentHoldingShares.toFixed(4);
        // 清除该字段的验证错误
        this.$refs.redeemForm.clearValidate('shares');
        this.$message.success('已自动填入全部持有份额');
      } else {
        this.$message.warning('当前没有持有份额可以赎回');
      }
    }
  }
};
</script>

<style scoped>
/* 赎回页面容器样式 */
.redeem-container {
  padding: 20px;
}
/* 加载状态容器样式 */
.loading-container {
  padding: 40px;
}
</style>