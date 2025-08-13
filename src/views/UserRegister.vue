<template>
  <div class="register-container">
    <el-card class="register-card">
      <div slot="header" class="clearfix">
        <h2>注册新用户</h2>
      </div>

      <el-form
        :model="registerForm"
        :rules="registerRules"
        ref="registerFormRef"
        label-width="80px"
        @submit.native.prevent="handleRegister"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="registerForm.password" placeholder="请输入密码"></el-input>
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input type="password" v-model="registerForm.confirmPassword" placeholder="请再次输入密码"></el-input>
        </el-form-item>

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

      <div class="login-link">
        已有账户？ <router-link to="/login">立即登录</router-link>
      </div>
    </el-card>
  </div>
</template>

<script>
// 1. 导入我们之前封装好的注册API函数
import { register } from '@/api/auth.js';

export default {
  name: 'UserRegister',
  data() {
    // 自定义一个校验规则，用于确认两次输入的密码是否一致
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
      // 2. 定义表单数据对象
      registerForm: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      // 3. 定义表单校验规则
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
      // 4. 定义加载状态
      loading: false
    };
  },
  methods: {
    // 5. 点击“注册”按钮时触发的核心方法
    handleRegister() {
      this.$refs.registerFormRef.validate(async (valid) => {
        if (!valid) {
          return false;
        }

        this.loading = true;

        try {
          // a. 调用注册API，注意只传递username和password
          await register({
            username: this.registerForm.username,
            password: this.registerForm.password
          });

          // b. 弹出成功提示
          this.$message.success('注册成功！将自动跳转到登录页...');

          // c. 延迟1.5秒后，跳转到登录页
          setTimeout(() => {
            this.$router.push('/login');
          }, 1500);

        } catch (error) {
          // 使用Element UI的Message组件，弹出后端返回的具体错误信息
          this.$message.error(error.message || '注册失败，请稍后重试');
          console.error('注册失败:', error);
        } finally {
          this.loading = false;
        }
      });
    }
  }
};
</script>

<style scoped>
/* 样式与登录页面保持一致 */
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f2f6fc;
}
.register-card {
  width: 450px;
}
.clearfix h2 {
  text-align: center;
  margin: 0;
}
.login-link {
  text-align: center;
  margin-top: 10px;
}
</style>