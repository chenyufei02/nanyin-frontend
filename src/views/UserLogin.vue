<template>
  <!-- 登录页面主容器 -->
  <div class="login-container">
    <!-- 登录表单卡片 -->
    <el-card class="login-card">
      <!-- 卡片头部标题 -->
      <div slot="header" class="clearfix">
        <h2>基金交易系统登录</h2>
      </div>

      <!-- 登录表单 -->
      <el-form
        :model="loginForm"
        :rules="loginRules"
        ref="loginFormRef"
        label-width="80px"
        @submit.native.prevent="handleLogin"
      >
        <!-- 用户名输入框 -->
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="loginForm.password" placeholder="请输入密码"></el-input>
        </el-form-item>

        <!-- 登录按钮 -->
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

      <!-- 注册链接 -->
      <div class="register-link">
        还没有账户？ <router-link to="/register">立即注册</router-link>
      </div>
    </el-card>
  </div>
</template>

<script>
// 导入登录API函数
import { login } from '@/api/auth.js';

export default {
  name: 'UserLogin',
  data() {
    return {
      // 登录表单数据对象，用于双向绑定
      loginForm: {
        username: '',  // 用户名
        password: ''   // 密码
      },
      // 表单验证规则
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      // 登录按钮加载状态，防止重复提交
      loading: false
    };
  },
  methods: {
    // 处理登录逻辑的核心方法
    handleLogin() {
      // 首先验证表单数据
      this.$refs.loginFormRef.validate(async (valid) => {
        if (!valid) {
          // 表单验证失败，直接返回
          return false;
        }

        // 设置加载状态，禁用登录按钮
        this.loading = true;

        try {
          // 调用登录API，传入表单数据
          // axios响应拦截器会处理外层ApiResponseVO，这里直接获取data部分
          const responseData = await login(this.loginForm);

          // 从响应数据中提取访问令牌
          if (responseData && responseData.accessToken) {
              // 将Bearer前缀和令牌拼接后存储到本地存储
              localStorage.setItem('authToken', 'Bearer ' + responseData.accessToken);

              // 显示登录成功提示
              this.$message.success('登录成功！');

              // 跳转到用户仪表板页面
              this.$router.push('/dashboard');
          } else {
              // 后端返回的数据结构不符合预期
              throw new Error('从后端返回的Token格式不正确');
          }

        } catch (error) {
          // 登录失败处理
          // 显示具体的错误信息给用户
          this.$message.error(error.message || '登录失败，请稍后重试');
          console.error('登录失败:', error);
        } finally {
          // 无论成功或失败，都要结束加载状态
          this.loading = false;
        }
      });
    }
  }
};
</script>

<style scoped>
/* 登录页面主容器样式 - 居中布局 */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f2f6fc;
}
/* 登录卡片样式 */
.login-card {
  width: 450px;
}
/* 标题样式 */
.clearfix h2 {
  text-align: center;
  margin: 0;
}
/* 注册链接样式 */
.register-link {
  text-align: center;
  margin-top: 10px;
}
</style>