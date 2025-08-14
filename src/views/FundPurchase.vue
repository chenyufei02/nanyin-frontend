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
import { purchaseFund, getMyProfile } from '@/api/user.js';

export default {
  name: 'FundPurchase',
  data() {
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
              if (value == null || value === '') {
                callback();
                return;
              }
              if (value <= 0) {
                callback(new Error('金额必须大于0'));
                return;
              }
              if (Number(value) > Number(this.balance || 0)) {
                callback(new Error('金额不足'));
                return;
              }
              callback();
            }, trigger: 'change' }
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
    // 将日期格式化为后端要求的本地时间格式：YYYY-MM-DDTHH:mm:ss（不带Z）
    formatDateTimeLocal(date) {
      const d = date instanceof Date ? date : new Date(date);
      const pad = n => String(n).padStart(2, '0');
      const yyyy = d.getFullYear();
      const MM = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const HH = pad(d.getHours());
      const mm = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`;
    },
    goBack() {
      const fundCode = this.form.fundCode;
      this.$router.push(`/funds/${fundCode}`);
    },
    handleSubmit() {
      this.$refs.purchaseForm.validate(async valid => {
        if (!valid) return;
        if (this.form.amount > this.balance) {
          this.$message.error('金额不足');
          return;
        }
        const payload = {
          fundCode: this.form.fundCode,
          // 兼容后端不同字段命名
          transactionAmount: Number(this.form.amount),
          amount: Number(this.form.amount),
          bankCardNo: this.form.bankCardNo,
          unitNetValue: this.fund?.performance?.unitNetValue ?? null,
          transactionTime: this.formatDateTimeLocal(new Date())
        };
        this.submitting = true;
        try {
          const resp = await purchaseFund(payload);
          // 如果后端返回了新的余额，则直接使用返回值覆盖（兼容多种字段）
          const possibleBalance = (resp && (
            resp.availableBalance ?? resp.balance ?? resp.newBalance ??
            (resp.data ? (resp.data.availableBalance ?? resp.data.balance ?? resp.data.newBalance) : undefined)
          ));
          if (possibleBalance != null) {
            this.balance = Number(possibleBalance);
          } else {
            await this.fetchBalance();
          }
          this.$message.success(`购买成功，新的可用余额：${this.formattedBalance} 元`);
          this.form.amount = null;
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


