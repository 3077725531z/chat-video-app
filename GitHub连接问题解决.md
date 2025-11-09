# 🔧 GitHub连接问题解决方案

## 问题：无法连接到GitHub

错误信息：`Failed to connect to github.com port 443`

这通常是网络连接问题，可能是：
- 网络防火墙阻止
- GitHub访问受限
- DNS解析问题
- 需要代理

---

## 解决方案

### 方案1：检查网络连接（最简单）

1. **检查能否访问GitHub网站**
   - 在浏览器打开：https://github.com
   - 如果打不开，说明网络有问题

2. **尝试使用手机热点**
   - 如果当前网络有问题，切换到手机热点试试

---

### 方案2：配置Git使用代理（如果需要代理）

如果你需要使用代理访问GitHub：

```bash
# 设置HTTP代理（替换为你的代理地址和端口）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 如果使用SOCKS5代理
git config --global http.proxy socks5://127.0.0.1:1080
git config --global https.proxy socks5://127.0.0.1:1080

# 取消代理设置
git config --global --unset http.proxy
git config --global --unset https.proxy
```

---

### 方案3：使用SSH连接（推荐）

SSH连接通常更稳定：

1. **检查是否已有SSH密钥**
   ```bash
   ls -al ~/.ssh
   ```

2. **如果没有，生成SSH密钥**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
   按回车使用默认设置

3. **添加SSH密钥到GitHub**
   - 复制公钥内容：
     ```bash
     cat ~/.ssh/id_ed25519.pub
     ```
   - 访问：https://github.com/settings/keys
   - 点击 "New SSH key"
   - 粘贴公钥内容

4. **更改远程仓库地址为SSH**
   ```bash
   git remote set-url origin git@github.com:3077725531z/chat-video-app.git
   ```

5. **测试SSH连接**
   ```bash
   ssh -T git@github.com
   ```

6. **再次推送**
   ```bash
   git push
   ```

---

### 方案4：使用GitHub Desktop（图形界面）

如果命令行有问题，可以使用GitHub Desktop：

1. 下载：https://desktop.github.com
2. 安装并登录
3. 打开项目
4. 点击 "Push origin" 按钮

---

### 方案5：修改DNS（Windows）

1. 打开 "网络和共享中心"
2. 点击 "更改适配器设置"
3. 右键你的网络连接 → "属性"
4. 选择 "Internet协议版本4(TCP/IPv4)" → "属性"
5. 使用以下DNS服务器：
   - 首选：8.8.8.8
   - 备用：8.8.4.4
6. 重启网络

---

### 方案6：增加超时时间

```bash
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999
```

---

### 方案7：使用GitHub镜像（临时方案）

如果GitHub完全无法访问，可以使用镜像：

```bash
# 使用Gitee作为中转
# 1. 在Gitee创建仓库
# 2. 添加Gitee作为远程仓库
git remote add gitee https://gitee.com/你的用户名/chat-video-app.git
git push gitee main

# 然后在Gitee设置中同步到GitHub
```

---

## 🔍 快速诊断

### 测试1：检查GitHub连接
```bash
ping github.com
```

### 测试2：检查HTTPS连接
```bash
curl -I https://github.com
```

### 测试3：检查Git配置
```bash
git config --list
```

---

## 💡 推荐方案

**最推荐：使用SSH连接**
- 更稳定
- 不需要每次输入密码
- 不受HTTPS端口限制

**其次：检查网络/使用代理**
- 如果网络环境需要代理
- 配置Git使用代理

**最后：使用GitHub Desktop**
- 图形界面，更简单
- 自动处理连接问题

---

## ❓ 仍然无法解决？

1. **检查防火墙设置**
   - 确保Git和GitHub不被阻止

2. **尝试不同网络**
   - 切换到手机热点
   - 使用其他WiFi

3. **联系网络管理员**
   - 如果是公司/学校网络
   - 可能需要开放端口

4. **使用VPN**
   - 如果GitHub被完全屏蔽
   - 使用VPN访问

---

## 📞 需要帮助？

如果以上方案都不行，请提供：
- 错误信息
- 网络环境（家庭/公司/学校）
- 是否使用代理/VPN
- 能否访问GitHub网站

