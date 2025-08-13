<template>
  <div class="profile-container">
    <h2 class="page-title">个人资料</h2>

    <el-card class="box-card" v-loading="loading">
      <div slot="header" class="clearfix">
        <span>基本信息</span>
        <div style="float: right;">
          <el-button v-if="!isEditing" type="primary" icon="el-icon-edit" @click="toggleEdit(true)">编 辑</el-button>
          <el-button v-if="isEditing" type="success" icon="el-icon-check" @click="saveProfile">保 存</el-button>
          <el-button v-if="isEditing" @click="toggleEdit(false)">取 消</el-button>
        </div>
      </div>

      <el-form :model="profileForm" :rules="profileRules" ref="profileFormRef" label-width="100px">

        <el-form-item label="真实姓名" prop="name">
          <span v-if="!isEditing">{{ profileForm.name }}</span>
          <el-input v-else v-model="profileForm.name"></el-input>
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <span v-if="!isEditing">{{ profileForm.phone }}</span>
          <el-input v-else v-model="profileForm.phone"></el-input>
        </el-form-item>

        <el-form-item label="证件类型" prop="idType">
          <span v-if="!isEditing">{{ profileForm.idType }}</span>
          <el-select v-else v-model="profileForm.idType" placeholder="请选择证件类型" style="width: 100%;">
            <el-option label="中华人民共和国居民身份证" value="身份证"></el-option>
            <el-option label="香港永久性居民身份证" value="香港永久性居民身份证"></el-option>
            <el-option label="澳门永久性居民身份证" value="澳门永久性居民身份证"></el-option>
            <el-option label="护照" value="护照"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="证件号码" prop="idNumber">
          <span v-if="!isEditing">{{ profileForm.idNumber }}</span>
          <el-input v-else v-model="profileForm.idNumber"></el-input>
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <span v-if="!isEditing">{{ profileForm.gender }}</span>
          <el-select v-else v-model="profileForm.gender" placeholder="请选择性别" style="width: 100%;">
            <el-option label="男" value="男"></el-option>
            <el-option label="女" value="女"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="出生日期" prop="birthDate">
          <span v-if="!isEditing">{{ profileForm.birthDate }}</span>
          <el-date-picker v-else v-model="profileForm.birthDate" type="date" placeholder="选择日期" style="width: 100%;"></el-date-picker>
        </el-form-item>

        <el-form-item label="职业" prop="occupation">
          <span v-if="!isEditing">{{ profileForm.occupation }}</span>
          <el-input v-else v-model="profileForm.occupation"></el-input>
        </el-form-item>

        <el-form-item label="国籍" prop="nationality">
          <span v-if="!isEditing">{{ profileForm.nationality }}</span>
          <el-select v-else v-model="profileForm.nationality" placeholder="请选择国籍" filterable style="width: 100%;">
             <el-option label="中国" value="中国"></el-option>
             <el-option label="中国香港" value="中国香港"></el-option>
             <el-option label="中国澳门" value="中国澳门"></el-option>
             <el-option label="中国台湾" value="中国台湾"></el-option>
             </el-select>
        </el-form-item>

        <el-form-item label="联系地址" prop="address">
          <span v-if="!isEditing">{{ profileForm.address }}</span>
          <el-input v-else v-model="profileForm.address" type="textarea"></el-input>
        </el-form-item>

      </el-form>
    </el-card>
  </div>
</template>

<script>
import { getMyProfile, updateMyProfile } from '@/api/user.js';

export default {
  name: 'UserProfile',
  data() {
    return {
      loading: false,
      isEditing: false,
      profileForm: {}, // 初始化为空对象，由API填充
      originalProfile: {},
      // 【核心修正】补全所有字段的校验规则
      profileRules: {
        name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
        gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
        idType: [{ required: true, message: '请输入证件类型', trigger: 'blur' }],
        idNumber: [{ required: true, message: '请输入证件号码', trigger: 'blur' }],
        birthDate: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
        nationality: [{ required: true, message: '请输入国籍', trigger: 'blur' }],
        occupation: [{ required: true, message: '请输入职业', trigger: 'blur' }],
        phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
        address: [{ required: true, message: '请输入联系地址', trigger: 'blur' }],
      }
    };
  },
  created() {
    this.fetchProfile();
  },
  methods: {
    // 从后端获取个人资料
    async fetchProfile() {
      this.loading = true;
      try {
        const responseData = await getMyProfile();
        if (responseData) {
          this.profileForm = responseData;
          this.originalProfile = JSON.parse(JSON.stringify(responseData));
          this.isEditing = false;
        } else {
          this.$message.info('欢迎您！请先完善您的个人资料。');
          this.profileForm = { userId: null, name: '', gender: '', idType: '身份证', idNumber: '', birthDate: null, nationality: '中国', occupation: '', phone: '', address: '' };
          this.originalProfile = JSON.parse(JSON.stringify(this.profileForm));
          this.isEditing = true;
        }
      } catch (error) {
        this.$message.error('获取个人资料失败');
      } finally {
        this.loading = false;
      }
    },

  toggleEdit(editing) {
    this.isEditing = editing;
    // 【修改】“取消”时，不再从this.originalProfile恢复
    // 因为对于新用户，this.originalProfile也是空的
    if (!editing && this.profileForm.userId) { // 只有老用户取消才恢复
         this.profileForm = JSON.parse(JSON.stringify(this.originalProfile));
    } else if (!editing && !this.profileForm.userId) {
        // 如果新用户在未保存的情况下点击“取消”，可以给个提示或不操作
        this.$message.warning('请先保存您的初始资料');
    }
  },
    // 保存个人资料
  saveProfile() {
    this.$refs.profileFormRef.validate(async (valid) => {
      if (!valid) return false;

      this.loading = true;
      try {
        // 调用更新API，传入表单数据
        const updatedProfile = await updateMyProfile(this.profileForm);
        // 更新成功后，将返回的数据更新到表单和原始数据中
        this.profileForm = updatedProfile;
        this.originalProfile = JSON.parse(JSON.stringify(updatedProfile));

        this.$message.success('个人资料保存成功！');
        this.isEditing = false; // 退出编辑模式
      } catch (error) {
        this.$message.error('保存失败，请稍后重试');
        console.error("保存个人资料失败:", error);
      } finally {
        this.loading = false;
      }
    });
  }
  }
};
</script>

<style scoped>
.profile-container {
  padding: 20px;
}
.page-title {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 20px;
}
/* 在非编辑模式下，让文本看起来更像普通文本 */
.el-form-item__content span {
  color: #606266;
  line-height: 40px; /* 与输入框高度对齐 */
}
</style>