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
          <el-input v-model.number="form.amount" placeholder="请输入购买金额" type="number" min="0"></el-input>
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
import { purchaseFund } from '@/api/user.js';

export default {
  name: 'FundPurchase',
  data() {
    return {
      loading: true,
      submitting: false,
      fund: null,
      balance: 0,
      form: {
        fundCode: '',
        fundName: '',
        bankCardNo: '',
        amount: null
      },
      rules: {
        bankCardNo: [
          { required: true, message: '请输入银行卡号', trigger: 'blur' },
          { pattern: /^\d{10,19}$/, message: '银行卡号需为10-19位数字', trigger: 'blur' },
          { validator: (rule, value, callback) => {
              if (!value) {
                callback(new Error('请输入银行卡号'));
                return;
              }
              if (!/^\d{10,19}$/.test(value)) {
                callback(new Error('银行卡号需为10-19位数字'));
                return;
              }
              if (!this.luhnCheck(value)) {
                callback(new Error('银行卡号不合法，请检查后重试'));
                return;
              }
              callback();
            }, trigger: 'blur' }
        ],
        amount: [
          { required: true, message: '请输入购买金额', trigger: 'blur' },
          { type: 'number', message: '金额必须是数字', trigger: 'blur' },
          { validator: (rule, value, callback) => {
              if (value <= 0) {
                callback(new Error('金额必须大于0'));
              } else {
                callback();
              }
            }, trigger: 'blur' }
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
    onBankCardInput(value) {
      // 仅保留数字
      const digitsOnly = String(value || '').replace(/\D+/g, '');
      // 限制最长19位
      this.form.bankCardNo = digitsOnly.slice(0, 19);
    },
    luhnCheck(numberString) {
      // Luhn 校验算法
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
        // TODO: 从后端获取真实的银行卡和余额。此处先用占位值，等待接入银行卡管理接口
        this.balance = 100000.00;
      } catch (e) {
        this.$message.error('加载基金信息失败');
      } finally {
        this.loading = false;
      }
    },
    goBack() {
      const fundCode = this.form.fundCode;
      this.$router.push(`/funds/${fundCode}`);
    },
    handleSubmit() {
      this.$refs.purchaseForm.validate(async valid => {
        if (!valid) return;
        if (this.form.amount > this.balance) {
          this.$message.error('余额不足，无法购买');
          return;
        }
        const payload = {
          fundCode: this.form.fundCode,
          amount: this.form.amount,
          bankCardNo: this.form.bankCardNo,
          unitNetValue: this.fund?.performance?.unitNetValue || null
        };
        this.submitting = true;
        try {
          await purchaseFund(payload);
          this.$message.success('购买成功');
          this.goBack();
        } catch (e) {
          this.$message.error(e.message || '购买失败');
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


