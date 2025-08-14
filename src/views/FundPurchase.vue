<template>
  <div class="purchase-container" v-if="!loading && fund">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>购买基金</span>
      </div>

      <el-form :model="form" :rules="rules" ref="purchaseForm" label-width="120px">
        <el-form-item label="基金代码">
          <el-input v-model="form.fundCode" disabled></el-input>
        </el-form-item>
        <el-form-item label="基金名称">
          <el-input v-model="form.fundName" disabled></el-input>
        </el-form-item>
        <el-form-item label="交易银行卡号" prop="bankCardNo">
          <el-input
            v-model="form.bankCardNo"
            placeholder="请输入银行卡号"
            maxlength="19"
            @input="onBankCardInput"
          ></el-input>
        </el-form-item>
        <el-form-item label="可用余额">
          <el-input :value="formattedBalance" disabled></el-input>
        </el-form-item>
        <el-form-item label="交易金额(元)" prop="amount">
          <el-input v-model="form.amount" placeholder="请输入购买金额"></el-input>
        </el-form-item>
        <el-form-item label="成交单位净值">
          <el-input :value="latestNetValue" disabled></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">购买</el-button>
          <el-button @click="goBack">返回详情</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
  <div v-else class="loading-container">
    <el-skeleton :rows="6" animated />
  </div>
  
</template>

<script>
import { getFundDetail } from '@/api/fund.js';
import { purchaseFund, getMyProfile } from '@/api/user.js';

export default {
  name: 'FundPurchase',
  data() {
    // 【优化】为“金额”字段创建一个更健壮的自定义校验器
    const validateAmount = (rule, value, callback) => {
      if (value == null || String(value).trim() === '') {
        return callback(new Error('请输入购买金额'));
      }
      if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        return callback(new Error('请输入有效的金额格式，最多两位小数'));
      }
      const numericValue = parseFloat(value);
      if (numericValue <= 0) {
        return callback(new Error('购买金额必须大于0'));
      }
      if (numericValue > this.balance) {
        return callback(new Error('账户可用余额不足'));
      }
      callback();
    };

    // 【保留】为“银行卡号”字段创建一个Luhn算法校验器
    const validateBankCard = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请输入银行卡号'));
      }
      if (!/^\d{10,19}$/.test(value)) {
        return callback(new Error('银行卡号需为10-19位数字'));
      }
      if (!this.luhnCheck(value)) {
        return callback(new Error('银行卡号不合法，请检查后重试'));
      }
      callback();
    };

    return {
      loading: true,
      submitting: false,
      fund: null,
      userId: null,
      balance: 0,
      form: {
        fundCode: '',
        fundName: '',
        bankCardNo: '',
        amount: '' // 保持为空字符串
      },
      rules: {
        bankCardNo: [
          // 【保留】银行卡号的验证规则
          { required: true, validator: validateBankCard, trigger: 'blur' }
        ],
        amount: [
          // 【核心修正】使用我们自定义的强大校验器
          { required: true, validator: validateAmount, trigger: 'blur' }
        ]
      }
    };
  },
  computed: {
    latestNetValue() {
      const value = this.fund?.performance?.unitNetValue;
      return value != null ? value.toFixed(4) : 'N/A';
    },
    formattedBalance() {
      return this.balance != null ? this.balance.toFixed(2) : '0.00';
    }
  },
  created() {
    const fundCode = this.$route.params.fundCode;
    this.init(fundCode);
  },
  methods: {
    // 【保留】银行卡输入处理函数
    onBankCardInput(value) {
      const digitsOnly = String(value || '').replace(/\D+/g, '');
      this.form.bankCardNo = digitsOnly.slice(0, 19);
    },
    // 【保留】Luhn校验算法
    luhnCheck(numberString) {
      const digits = (numberString || '').split('').reverse().map(d => parseInt(d, 10));
      let sum = 0;
      for (let i = 0; i < digits.length; i++) {
        let digit = digits[i];
        if (i % 2 === 1) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
      }
      return sum % 10 === 0;
    },
    async init(fundCode) {
      this.loading = true;
      try {
        this.fund = await getFundDetail(fundCode);
        this.form.fundCode = this.fund?.basicInfo?.fundCode || fundCode;
        this.form.fundName = this.fund?.basicInfo?.fundName || '';
        await this.fetchBalance();
      } catch (e) {
        this.$message.error('加载基金信息失败');
      } finally {
        this.loading = false;
      }
    },
    async fetchBalance() {
      try {
        const profile = await getMyProfile();
        this.balance = Number(profile && profile.balance != null ? profile.balance : 0);
        this.userId = (profile && (profile.userId != null ? profile.userId : profile.id)) || null;
      } catch (e) {
        this.balance = 0;
      }
    },
    goBack() {
      const fundCode = this.form.fundCode;
      this.$router.push(`/funds/${fundCode}`);
    },
    handleSubmit() {
      this.$refs.purchaseForm.validate(async valid => {
        if (!valid) return;

        const payload = {
          userId: this.userId,
          fundCode: this.form.fundCode,
          transactionAmount: this.form.amount, // 直接传递字符串
          transactionTime: new Date().toISOString()
        };

        this.submitting = true;
        try {
          await purchaseFund(payload);
          this.$message.success('购买成功！正在跳转到我的持仓...');
          // 【优化】购买成功后，跳转到持仓页，让用户看到最新资产
          setTimeout(() => {
            this.$router.push('/my-holdings');
          }, 1500);
        } catch (e) {
          this.$message.error(e.message || '购买失败');
          // 购买失败后，刷新一下余额，以防万一
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
.purchase-container {
  padding: 20px;
}
.loading-container {
  padding: 40px;
}
</style>


