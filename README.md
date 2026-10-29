<div align="center">
  <img src="assets/icon128.png" width="88" alt="飞牛 fnOS 登录页主题 图标">
  <h1>飞牛 fnOS 登录页主题</h1>
  <p>为 fnOS 登录页换上你喜欢的样子。</p>
  <p>
    <a href="https://github.com/Nyakooo/oh-my-fn-theme/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-8aab8d.svg" alt="MIT License"></a>
    <img src="https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4.svg" alt="Chrome Manifest V3">
    <img src="https://img.shields.io/badge/dependencies-none-6b8f71.svg" alt="No runtime dependencies">
  </p>
  <p><a href="README.md">简体中文</a> · <a href="README.en.md">English</a></p>
</div>

<p align="center"><img src="docs/promo.svg" alt="飞牛 fnOS 登录页主题 宣传图" width="100%"></p>

## 品牌与商店素材

[查看素材预览](docs/brand/index.html) · [尺寸与使用说明](docs/brand/README.md)。Chrome 与 Edge 的 Logo、宣传图及功能截图分别放在 `docs/store/chrome/`、`docs/store/edge/`，另含 1080×1440 竖版海报与可编辑 SVG 源文件。

## 功能

- **三套登录主题**：极简、月夜居所和奶油猫窝可用于 fnOS 登录页。极简采用暖白底色、灰绿双栏面板与深色登录按钮。
- **奶油猫窝主题**：居中悬浮登录卡片、卡片顶部云朵橘猫与斜贴便签，搭配奶油黄和焦糖棕，适合温暖治愈的私人空间。[预览猫主题](preview.html?theme=cat)；在扩展设置中选择「奶油猫窝」，点击「编辑奶油猫窝主题」。
- **樱桃汽水预设**：樱粉与奶油白、圆润卡片、原创云朵小兔插画，搭配二次元日常感文案。[预览可爱风](preview.html?theme=kawaii)；在编辑器「色彩」中选择「樱桃汽水 · 完整主题」。
- **商务蓝预设**：冷灰底色、蓝灰双栏与海军蓝按钮，搭配紧凑圆角和工作空间文案。[预览商务蓝](preview.html?theme=business)；在主题编辑器的「色彩」中选择「商务蓝 · 完整主题」即可应用，沿用极简主题的保存与同步。
- **可视化主题编辑器**：文案、模块显隐、字体、配色、圆角和布局支持实时预览与自动保存，可导入/导出主题配置。点击扩展设置中的“打开主题编辑器”进入；双击预览文字可直接编辑。登录表单仅调整样式，认证流程仍由 fnOS 处理。
- **浏览器标签外观**：自定义标签标题和 favicon。
- **明确授权**：只为用户手动添加并授权的 fnOS 地址运行，不扫描其他站点。
- **保留原登录流程**：只调整页面布局与样式，不替换登录表单或认证逻辑。

## 预览

| 登录页主题 | 桌面设计示例 |
| --- | --- |
| [打开登录页预览](preview.html) | [打开桌面预览](desktop-preview.html) |
| [打开内部桌面预览](internal-preview.html) | 可在首页预览中切换主题与预设 |

编辑器在扩展中即时保存到本地扩展存储，并实时更新已授权且启用相应主题的页面；极简和奶油猫窝分别保存文案、颜色、模块显隐、字体及布局，并通过浏览器的 `storage.sync` 同步。升级时原有极简配置会原样保留，包括已应用的旧猫窝预设；新猫窝主题使用独立配置。直接通过 HTTP 打开编辑器时仅使用浏览器本地存储，不同步到扩展。

预览页面使用本地示例数据，不连接 NAS。桌面预览仅作为设计示例；扩展不修改登录后的 Dock。

## 安装

### 从源码加载（本地测试）

1. 下载或克隆本仓库。
2. 在 Chrome 打开 `chrome://extensions`，或在 Edge 打开 `edge://extensions`。
3. 启用**开发者模式**，点击**加载已解压的扩展程序**。
4. 选择仓库中的 `dist/oh-my-fn-theme-0.1.14` 目录；若尚未生成，先在仓库根目录运行 `npm run build`。
5. 打开扩展设置，输入 fnOS 根地址（例如 `http://192.168.1.20:5666`），确认展示的地址并在浏览器原生弹窗中授权。
6. 刷新 fnOS 页面即可应用外观。

也可以下载 `dist/oh-my-fn-theme-0.1.14.zip`，解压后在扩展管理页加载解压目录。ZIP 是未签名的开发者模式扩展包，不是 Chrome Web Store 安装包。

### 地址规则

地址必须是 `http://` 或 `https://` 根地址，可以带端口，但不能包含路径、查询参数、片段、用户名或密码。权限精确到主机和端口，并覆盖该端口下的页面路径。不同子域名、端口或跳转主机需要分别授权。

## 开发

运行环境：Node.js 20 或更高版本。扩展本身使用 Chromium 扩展 API 和原生 JavaScript、CSS，不需要第三方运行时依赖。

```sh
npm run build
```

命令会读取 `manifest.json` 的版本号，生成：

- `dist/oh-my-fn-theme-<版本>/`：可在 Chrome / Edge 中加载的扩展目录。
- `dist/oh-my-fn-theme-<版本>.zip`：便于本地传递和备份的 ZIP 包。

构建过程会检查 manifest 图标文件引用。修改扩展代码后重新运行命令即可更新安装目录和 ZIP。`dist/` 已加入 `.gitignore`。

月夜居所暂不支持自定义文案、配色与布局；选择月夜时仍可修改浏览器标签标题和 favicon。浏览器的扩展选项会打开主题设置页，极简和奶油猫窝各有对应编辑入口。

## 跨电脑同步

- 在两台电脑使用同一浏览器产品、登录同一账户，开启浏览器的扩展/设置同步，并安装具有相同扩展 ID 的本扩展。Chrome 与 Edge 各自同步，不能跨浏览器产品互通。
- 目前分别同步极简和奶油猫窝主题的文案、颜色、布局、模块显隐和字体。NAS 地址授权、主题开关、标签标题、favicon 仍由每台电脑独立管理。
- 浏览器关闭同步或离线时仍可本机保存。编辑器显示“已交给浏览器同步”表示浏览器已接收配置，不代表另一台电脑已经下载完成；写入失败时会保留本地修改并自动重试，也可手动重试。
- 开发者模式下，不同加载路径可能生成不同扩展 ID。当前不会修改现有扩展 ID，避免已有配置不可访问；跨电脑安装前请核对 ID。正式分发应使用固定 ID 的同一商店扩展，或在打包流程中配置一致的公钥。配置导入/导出可作为备用迁移方式。

## 权限与隐私

扩展声明 `activeTab`、`scripting`、`storage`、`alarms` 和可选的 HTTP/HTTPS 站点权限。安装时不会获得 NAS 站点权限；只有用户在设置页确认并通过浏览器授权后，扩展才会在该地址注册内容脚本。已确认地址、主题开关、标签标题和 favicon 保存在浏览器本地扩展存储。极简和奶油猫窝的编辑器配置另通过浏览器账户的扩展同步存储保存；扩展不自建账户或同步服务器，不读取密码、Cookie 或网络请求，不拦截表单。

移除地址会注销对应的动态内容脚本并撤销该站点权限。移除扩展可清除浏览器保存的扩展数据。

## 兼容性与限制

- Chrome 与 Edge，Manifest V3。
- fnOS 页面 DOM 结构会随系统版本变化；登录面板的自动识别需要目标设备验证。
- 目前没有自动化浏览器测试。提交前请至少在目标 fnOS 版本上检查地址授权、登录页布局、表单提交流程、主题切换。

## 反馈与贡献

欢迎通过 [GitHub Issues](https://github.com/Nyakooo/oh-my-fn-theme/issues) 报告问题或提出功能建议。反馈时请注明浏览器及版本、fnOS 版本、页面类型和复现步骤；请勿提交密码、Cookie、公开可访问的 NAS 地址或其他敏感信息。

贡献代码前请先开 Issue 讨论较大的改动。提交 PR 时请说明改动目的和验证方式，并确认 `npm run build` 可以成功生成本地扩展包。

## 许可证

本项目以 [MIT License](LICENSE) 发布。
