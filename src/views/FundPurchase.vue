<template>
  <!-- 基金购买页面容器 -->
  <div class="purchase-container" v-if="!loading && fund">
    <!-- 主要内容卡片 -->
    <el-card class="box-card">
      <!-- 卡片头部标题 -->
      <div slot="header" class="clearfix">
        <span>购买基金</span>
      </div>

      <!-- 基金购买表单 -->
      <el-form :model="form" :rules="rules" ref="purchaseForm" label-width="120px">
        <!-- 基金代码输入框（只读） -->
        <el-form-item label="基金代码">
          <el-input v-model="form.fundCode" disabled></el-input>
        </el-form-item>
        <!-- 基金名称输入框（只读） -->
        <el-form-item label="基金名称">
          <el-input v-model="form.fundName" disabled></el-input>
        </el-form-item>
        <!-- 银行卡号输入框（带验证） -->
        <el-form-item label="交易银行卡号" prop="bankCardNo">
          <el-input
            v-model="form.bankCardNo"
            placeholder="请输入银行卡号"
            maxlength="19"
            @input="onBankCardInput"
          ></el-input>
        </el-form-item>
        <!-- 可用余额显示（只读） -->
        <el-form-item label="可用余额">
          <el-input :value="formattedBalance" disabled></el-input>
        </el-form-item>
        <!-- 购买金额输入框（带验证） -->
        <el-form-item label="交易金额(元)" prop="amount">
          <el-input v-model="form.amount" placeholder="请输入购买金额"></el-input>
        </el-form-item>
        <!-- 基金净值显示（只读） -->
        <el-form-item label="成交单位净值">
          <el-input :value="latestNetValue" disabled></el-input>
        </el-form-item>
        <!-- 操作按钮组 -->
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">购买</el-button>
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
// 导入用户相关API
import { purchaseFund, getMyProfile } from '@/api/user.js';

export default {
  name: 'FundPurchase',
  data() {
    // 购买金额自定义校验器
    const validateAmount = (rule, value, callback) => {
      // 检查是否为空
      if (value == null || String(value).trim() === '') {
        return callback(new Error('请输入购买金额'));
      }
      // 检查金额格式（支持最多两位小数）
      if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        return callback(new Error('请输入有效的金额格式，最多两位小数'));
      }
      const numericValue = parseFloat(value);
      // 检查金额是否大于0
      if (numericValue <= 0) {
        return callback(new Error('购买金额必须大于0'));
      }
      // 检查余额是否充足
      if (numericValue > this.balance) {
        return callback(new Error('账户可用余额不足'));
      }
      callback();
    };

    // 银行卡号Luhn算法校验器
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
      loading: true,        // 页面加载状态
      submitting: false,    // 表单提交状态
      fund: null,          // 基金详情数据
      userId: null,        // 用户ID
      balance: 0,          // 用户可用余额
      // 表单数据
      form: {
        fundCode: '',      // 基金代码
        fundName: '',      // 基金名称
        bankCardNo: '',    // 银行卡号
        amount: ''         // 购买金额
      },
      // 表单验证规则
      rules: {
        bankCardNo: [
          { required: true, validator: validateBankCard, trigger: 'blur' }
        ],
        amount: [
          { required: true, validator: validateAmount, trigger: 'blur' }
        ]
      }
    };
  },
  computed: {
    // 格式化显示基金净值
    latestNetValue() {
      const value = this.fund?.performance?.unitNetValue;
      return value != null ? value.toFixed(4) : 'N/A';
    },
    // 格式化显示用户余额
    formattedBalance() {
      return this.balance != null ? this.balance.toFixed(2) : '0.00';
    }
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
        // 获取基金详情
        this.fund = await getFundDetail(fundCode);
        this.form.fundCode = this.fund?.basicInfo?.fundCode || fundCode;
        this.form.fundName = this.fund?.basicInfo?.fundName || '';
        // 获取用户余额
        await this.fetchBalance();
      } catch (e) {
        this.$message.error('加载基金信息失败');
      } finally {
        this.loading = false;
      }
    },
    // 获取用户余额信息
    async fetchBalance() {
      try {
        const profile = await getMyProfile();
        this.balance = Number(profile && profile.balance != null ? profile.balance : 0);
        this.userId = (profile && (profile.userId != null ? profile.userId : profile.id)) || null;
      } catch (e) {
        this.balance = 0;
      }
    },
    // 返回基金详情页
    goBack() {
      const fundCode = this.form.fundCode;
      this.$router.push(`/funds/${fundCode}`);
    },
    // 处理购买提交
    handleSubmit() {
      // 验证表单
      this.$refs.purchaseForm.validate(async valid => {
        if (!valid) return;

        // 构建购买请求数据
        const payload = {
          userId: this.userId,
          fundCode: this.form.fundCode,
          transactionAmount: this.form.amount,
          bankAccountNumber: this.form.bankCardNo,
          transactionTime: new Date().toISOString()
        };

        this.submitting = true;
        try {
          // 调用购买API
          await purchaseFund(payload);
          this.$message.success('购买成功！正在跳转到我的持仓...');
          // 购买成功后跳转到持仓页面
          setTimeout(() => {
            this.$router.push('/my-holdings');
          }, 1500);
        } catch (e) {
          this.$message.error(e.message || '购买失败');
          // 购买失败后刷新余额
          this.fetchBalance();
        } finally {
          this.submitting = false;
        }
      });
    }
  }
};
</script>

<style scoped>
/* 购买页面容器样式 */
.purchase-container {
  padding: 20px;
}
/* 加载状态容器样式 */
.loading-container {
  padding: 40px;
}
</style>


