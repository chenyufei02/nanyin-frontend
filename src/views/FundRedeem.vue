<template>
  <div class="redeem-container" v-if="!loading && fund">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>赎回基金</span>
      </div>

      <el-form :model="form" :rules="rules" ref="redeemForm" label-width="120px">
        <el-form-item label="基金代码">
          <el-input v-model="form.fundCode" disabled></el-input>
        </el-form-item>
        <el-form-item label="基金名称">
          <el-input v-model="form.fundName" disabled></el-input>
        </el-form-item>
        <el-form-item label="收款银行卡号" prop="bankCardNo">
          <el-input
            v-model="form.bankCardNo"
            placeholder="请输入收款银行卡号"
            maxlength="19"
            @input="onBankCardInput"
          ></el-input>
        </el-form-item>
        <el-form-item label="当前持有份额">
          <el-input :value="currentHoldingShares" disabled>
             <template slot="append">份</template>
          </el-input>
        </el-form-item>
        <el-form-item label="赎回份额" prop="shares">
          <el-input v-model="form.shares" placeholder="请输入要赎回的份额">
             <template slot="append">份</template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="danger" :loading="submitting" @click="handleSubmit">赎 回</el-button>
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
import { redeemFund } from '@/api/user.js';
import { getMyHoldings } from '@/api/holding.js';

export default {
  name: 'FundRedeem',
  data() {
    const validateShares = (rule, value, callback) => {
      // ... (此部分校验逻辑不变)
      if (!value || String(value).trim() === '') {
        return callback(new Error('请输入赎回份额'));
      }
      if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        return callback(new Error('请输入有效的数字格式，最多两位小数'));
      }
      const numericValue = parseFloat(value);
      if (numericValue <= 0) {
        return callback(new Error('赎回份额必须大于0'));
      }
      if (numericValue > this.currentHoldingShares) {
        return callback(new Error(`赎回份额不能超过持有的 ${this.currentHoldingShares} 份`));
      }
      callback();
    };

    // 【新增】银行卡号的校验逻辑 (与购买页面一致)
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
      currentHoldingShares: 0,
      form: {
        fundCode: '',
        fundName: '',
        shares: '',
        bankCardNo: '' // 【新增】
      },
      rules: {
        shares: [
          { required: true, validator: validateShares, trigger: 'blur' }
        ],
        // 【新增】
        bankCardNo: [
          { required: true, validator: validateBankCard, trigger: 'blur' }
        ]
      }
    };
  },
  // 【移除】对 latestNetValue 的计算，因为已经不再显示
  created() {
    const fundCode = this.$route.params.fundCode;
    this.init(fundCode);
  },
  methods: {
    // 【新增】银行卡相关辅助方法
    onBankCardInput(value) {
      const digitsOnly = String(value || '').replace(/\D+/g, '');
      this.form.bankCardNo = digitsOnly.slice(0, 19);
    },
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
        const [fundDetail, allHoldings] = await Promise.all([
          getFundDetail(fundCode),
          getMyHoldings()
        ]);

        this.fund = fundDetail;
        this.form.fundCode = this.fund?.basicInfo?.fundCode || fundCode;
        this.form.fundName = this.fund?.basicInfo?.fundName || '';

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
    goBack() {
      this.$router.push(`/funds/${this.form.fundCode}`);
    },
    handleSubmit() {
      this.$refs.redeemForm.validate(async valid => {
        if (!valid) return;

        const payload = {
          fundCode: this.form.fundCode,
          transactionShares: this.form.shares,
          bank_account_number: this.form.bankCardNo, // 【修改】将银行卡号添加到请求体
          transactionTime: new Date().toISOString()
        };

        this.submitting = true;
        try {
          await redeemFund(payload);
          this.$message.success('赎回成功！正在跳转到我的持仓...');
          setTimeout(() => {
            this.$router.push('/my-holdings');
          }, 1500);
        } catch (e) {
          this.$message.error(e.message || '赎回失败');
        } finally {
          this.submitting = false;
        }
      });
    }
  }
};
</script>

<style scoped>
.redeem-container {
  padding: 20px;
}
.loading-container {
  padding: 40px;
}
</style>