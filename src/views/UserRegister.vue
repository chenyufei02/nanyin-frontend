<template>
  <!-- 注册页面主容器 -->
  <div class="register-container">
    <!-- 注册表单卡片 -->
    <el-card class="register-card">
      <!-- 卡片头部标题 -->
      <div slot="header" class="clearfix">
        <h2>注册新用户</h2>
      </div>

      <!-- 注册表单 -->
      <el-form
        :model="registerForm"
        :rules="registerRules"
        ref="registerFormRef"
        label-width="80px"
        @submit.native.prevent="handleRegister"
      >
        <!-- 用户名输入框 -->
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="registerForm.password" placeholder="请输入密码"></el-input>
        </el-form-item>

        <!-- 确认密码输入框 -->
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input type="password" v-model="registerForm.confirmPassword" placeholder="请再次输入密码"></el-input>
        </el-form-item>

        <!-- 注册按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            @click="handleRegister"
            :loading="loading"
            style="width: 100%;"
          >
            注 册
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 登录链接 -->
      <div class="login-link">
        已有账户？ <router-link to="/login">立即登录</router-link>
      </div>
    </el-card>
  </div>
</template>

<script>
// 导入注册API函数
import { register } from '@/api/auth.js';

export default {
  name: 'UserRegister',
  data() {
    // 自定义密码确认验证器，确保两次输入的密码一致
    const validatePass = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'));
      } else if (value !== this.registerForm.password) {
        callback(new Error('两次输入密码不一致!'));
      } else {
        callback();
      }
    };
    
    return {
      // 注册表单数据对象，用于双向绑定
      registerForm: {
        username: '',        // 用户名
        password: '',        // 密码
        confirmPassword: ''  // 确认密码
      },
      // 表单验证规则配置
      registerRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 15, message: '长度在 3 到 15 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, validator: validatePass, trigger: 'blur' }
        ]
      },
      // 注册按钮加载状态，防止重复提交
      loading: false
    };
  },
  methods: {
    // 处理用户注册的核心方法
    handleRegister() {
      // 首先验证表单数据
      this.$refs.registerFormRef.validate(async (valid) => {
        if (!valid) {
          // 表单验证失败，直接返回
          return false;
        }

        // 设置加载状态，禁用注册按钮
        this.loading = true;

        try {
          // 调用注册API，只传递用户名和密码（不传确认密码）
          await register({
            username: this.registerForm.username,
            password: this.registerForm.password
          });

          // 显示注册成功提示
          this.$message.success('注册成功！将自动跳转到登录页...');

          // 延迟1.5秒后自动跳转到登录页面
          setTimeout(() => {
            this.$router.push('/login');
          }, 1500);

        } catch (error) {
          // 注册失败处理
          // 显示具体的错误信息给用户
          this.$message.error(error.message || '注册失败，请稍后重试');
          console.error('注册失败:', error);
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
/* 注册页面主容器样式 - 居中布局 */
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f2f6fc;
}
/* 注册卡片样式 */
.register-card {
  width: 450px;
}
/* 标题样式 */
.clearfix h2 {
  text-align: center;
  margin: 0;
}
/* 登录链接样式 */
.login-link {
  text-align: center;
  margin-top: 10px;
}
</style>