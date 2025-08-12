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
          const responseData = await login(this.loginForm);

          // c. 【核心】登录成功后，后端会返回包含token的对象
          // 我们将 token 存入浏览器的 localStorage，以便后续所有请求都能携带它
          localStorage.setItem('authToken', responseData.token);

          // d. 弹出成功提示
          this.$message.success('登录成功！');

          // e. 跳转到“我的主页” (dashboard)
          this.$router.push('/dashboard');

        } catch (error) {
          // f. 如果API调用失败（例如密码错误），在请求拦截器中已经处理了错误提示
          // 我们只需要在控制台打印错误即可
          console.error('登录失败:', error);
        } finally {
          // g. 无论成功还是失败，最后都结束加载状态
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