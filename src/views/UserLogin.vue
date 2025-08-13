<template>
  <div class="login-container">
    <el-card class="login-card">
      <div slot="header" class="clearfix">
        <h2>基金交易系统登录</h2>
      </div>

      <el-form
        :model="loginForm"
        :rules="loginRules"
        ref="loginFormRef"
        label-width="80px"
        @submit.native.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="loginForm.password" placeholder="请输入密码"></el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="handleLogin"
            :loading="loading"
            style="width: 100%;"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-link">
        还没有账户？ <router-link to="/register">立即注册</router-link>
      </div>
    </el-card>
  </div>
</template>

<script>
// 1. 导入我们之前封装好的登录API函数
import { login } from '@/api/auth.js';

export default {
  name: 'UserLogin',
  data() {
    return {
      // 2. 定义一个对象，用于双向绑定表单中的数据
      loginForm: {
        username: '',
        password: ''
      },
      // 3. 定义表单的校验规则
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      // 4. 定义一个加载状态，防止用户重复点击
      loading: false
    };
  },
  methods: {
    // 5. 点击“登录”按钮时触发的核心方法
    handleLogin() {
      // a. 首先，对整个表单进行校验
      this.$refs.loginFormRef.validate(async (valid) => {
        if (!valid) {
          // 如果校验不通过，直接返回
          return false;
        }

        this.loading = true; // 开始加载，按钮变为加载状态

        try {
          // b. 调用我们封装好的API函数，并传入表单数据
          //    axios响应拦截器会处理外层 ApiResponseVO，这里直接拿到data部分
          const responseData = await login(this.loginForm);

          // c. 【核心优化】从响应数据中，精确地提取accessToken
          if (responseData && responseData.accessToken) {
              // d. 将 "Bearer " 前缀和纯净的Token拼接后，存入本地存储
              localStorage.setItem('authToken', 'Bearer ' + responseData.accessToken);

              // e. 弹出成功提示
              this.$message.success('登录成功！');

              // f. 跳转到“我的主页” (dashboard)
              this.$router.push('/dashboard');
          } else {
              // g. 如果后端返回的数据结构不符合预期，给出一个明确的错误
              throw new Error('从后端返回的Token格式不正确');
          }

        } catch (error) {
          // h. 【核心优化】如果API调用失败（例如密码错误），
          //     将后端返回的具体错误信息，通过Element UI的Message组件弹给用户
          this.$message.error(error.message || '登录失败，请稍后重试');
          console.error('登录失败:', error);
        } finally {
          // i. 无论成功还是失败，最后都结束加载状态
          this.loading = false;
        }
      });
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f2f6fc;
}
.login-card {
  width: 450px;
}
.clearfix h2 {
  text-align: center;
  margin: 0;
}
.register-link {
  text-align: center;
  margin-top: 10px;
}
</style>