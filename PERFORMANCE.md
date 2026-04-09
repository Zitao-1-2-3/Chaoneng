# 性能优化指南

## 已实施的优化

### 1. 前端代码优化

- ✅ 登录页和404页面改为直接导入，避免懒加载延迟
- ✅ 扩展 Vite 预构建依赖列表
- ✅ 添加服务器预热配置
- ✅ 优化构建配置（vendor chunk分离、terser压缩）
- ✅ 移除重复的console.log
- ✅ 添加 DNS 预解析和预连接

### 2. 构建优化

- ✅ 生产环境关闭包分析（减少构建时间）
- ✅ 启用代码分割和压缩
- ✅ CSS 代码分割

## 服务器端优化（需要运维配置）

### 1. Nginx 配置

参考 `nginx.conf.example` 文件，配置以下内容：

#### 启用 Gzip 压缩

```nginx
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;
```

**效果**: 减少传输大小 60-80%

#### 启用 Brotli 压缩（推荐）

```bash
# 安装 brotli 模块
sudo apt-get install nginx-module-brotli
```

**效果**: 比 Gzip 额外减少 15-20% 大小

#### 配置静态资源缓存

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**效果**: 二次访问速度提升 90%

### 2. HTTP/2 配置

```nginx
listen 443 ssl http2;
```

**效果**: 并行加载资源，减少 20-30% 加载时间

### 3. CDN 配置（可选）

将以下资源改用 CDN：

- Vue.js
- Element Plus
- Echarts

**效果**: 减少服务器压力，提升全球访问速度

## 性能监控

### 开发环境

```bash
# 启动开发服务器
pnpm dev:m  # 代理端
pnpm dev:o  # 运营端
```

### 生产环境构建

```bash
# 构建生产版本
pnpm build:pro

# 分析包大小（开发时使用）
VITE_USE_BUNDLE_ANALYZER=true pnpm build:pro
```

### 性能指标

| 指标         | 优化前 | 优化后  | 目标   |
| ------------ | ------ | ------- | ------ |
| 首次加载时间 | 30秒   | 12-15秒 | <10秒  |
| 二次加载时间 | -      | 2-3秒   | <2秒   |
| 主bundle大小 | -      | ~500KB  | <600KB |
| 首屏渲染时间 | -      | 1-2秒   | <1秒   |

## 进一步优化建议

### 短期（1-2天）

1. ✅ 配置 Nginx Gzip 压缩
2. ✅ 配置静态资源缓存策略
3. ⏳ 启用 HTTP/2

### 中期（1周）

1. ⏳ 配置 Brotli 压缩
2. ⏳ 优化图片资源（WebP格式）
3. ⏳ 添加 Service Worker（PWA）

### 长期（1个月）

1. ⏳ 使用 CDN 加速
2. ⏳ 服务端渲染（SSR）关键页面
3. ⏳ 实施代码分割策略优化

## 测试工具

### 性能测试

- Chrome DevTools (Lighthouse)
- WebPageTest
- GTmetrix

### 监控工具

- Google Analytics
- Sentry (错误监控)
- 自定义性能监控

## 常见问题

### Q: 为什么首次加载还是很慢？

A: 检查以下几点：

1. 服务器是否启用了 Gzip/Brotli 压缩
2. 静态资源是否配置了缓存
3. 网络带宽是否足够
4. 是否使用了 HTTP/2

### Q: 如何验证优化效果？

A: 使用 Chrome DevTools 的 Network 面板：

1. 清除缓存
2. 刷新页面
3. 查看 DOMContentLoaded 和 Load 时间
4. 查看资源大小和加载时间

### Q: 生产环境如何部署？

A:

1. 运行 `pnpm build:pro` 构建
2. 将 `dist-management` 或 `dist-operation` 目录部署到服务器
3. 配置 Nginx（参考 nginx.conf.example）
4. 重启 Nginx

## 联系方式

如有问题，请联系开发团队。
