# Git 部署步骤指南

## ✅ 你已经完成的步骤

- [x] `git init` - 初始化Git仓库
- [x] `git add .` - 添加所有文件到暂存区

## 📝 下一步：提交代码

### 步骤1: 提交代码

在命令行中执行：

```bash
git commit -m "Initial commit: 聊天视频应用"
```

### 步骤2: 创建main分支（如果需要）

```bash
git branch -M main
```

### 步骤3: 在GitHub上创建仓库

1. 访问 https://github.com/new
2. 仓库名：`chat-video-app`（或你喜欢的名字）
3. 选择 **Public**（公开）
4. **不要**勾选 "Initialize this repository with a README"（因为我们已经有了）
5. 点击 "Create repository"

### 步骤4: 连接GitHub仓库

在命令行中执行（替换 `你的用户名` 为你的GitHub用户名）：

```bash
git remote add origin https://github.com/你的用户名/chat-video-app.git
```

例如，如果你的GitHub用户名是 `zhangsan`，则执行：
```bash
git remote add origin https://github.com/zhangsan/chat-video-app.git
```

### 步骤5: 推送到GitHub

```bash
git push -u origin main
```

如果提示输入用户名和密码：
- 用户名：你的GitHub用户名
- 密码：使用 **Personal Access Token**（不是GitHub密码）
  - 如果没有Token，访问：https://github.com/settings/tokens
  - 点击 "Generate new token (classic)"
  - 勾选 `repo` 权限
  - 生成后复制Token作为密码使用

## 🚀 然后部署到Render

完成GitHub推送后：

1. 访问 https://render.com
2. 使用GitHub登录
3. 点击 "New +" → "Web Service"
4. 选择你的仓库
5. 点击 "Create Web Service"
6. 等待部署完成

## ⚠️ 常见问题

### 问题1: 提示需要身份验证
**解决方案**: 使用Personal Access Token而不是密码

### 问题2: 提示分支不存在
**解决方案**: 执行 `git branch -M main` 创建main分支

### 问题3: 提示远程仓库已存在
**解决方案**: 
```bash
git remote remove origin
git remote add origin https://github.com/你的用户名/chat-video-app.git
```

## 📋 完整命令清单

```bash
# 1. 提交代码
git commit -m "Initial commit: 聊天视频应用"

# 2. 创建main分支
git branch -M main

# 3. 添加远程仓库（替换为你的GitHub用户名）
git remote add origin https://github.com/你的用户名/chat-video-app.git

# 4. 推送到GitHub
git push -u origin main
```

## ✅ 检查是否成功

推送成功后，访问你的GitHub仓库：
```
https://github.com/你的用户名/chat-video-app
```

应该能看到所有文件都已经上传了！

