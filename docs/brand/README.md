# 飞牛 fnOS 登录页主题 · 品牌与商店素材

正式名称：飞牛 fnOS 登录页主题。界面简称：Fn主题。

商店简介：为飞牛 fnOS 登录页换上喜欢的风格，支持极简主题文案、配色与布局自定义，实时预览。

视觉方向：月夜深青灰（#1b2b31）底色与暖米金（#eedab2）标识。通过官网 favicon 的原始图形生成蒙版，只替换颜色，不重绘或改变牛角 / F 的轮廓与比例。去掉所有主题色签，各尺寸使用同一简洁图形。宣传主张为“让每一次登录，都有你的风格”。本项目为第三方扩展，不代表飞牛官方出品。

## 素材清单

| 用途 | Chrome | Edge |
| --- | --- | --- |
| 商店图标 | `../store/chrome/logo-128.png`，128×128，图形 96×96、四周透明留白 16px | `../store/edge/logo-300.png`，300×300，独立留白比例 |
| 小宣传图 | `promo-small-440x280.png`，无文案构图 | `promo-small-440x280.png`，名称与短句构图 |
| 大横幅 | `promo-marquee-1400x560.png` | `promo-marquee-1400x560.png` |
| 功能截图 | `screenshot-editor-1280x800.png`、`screenshot-minimal-1280x800.png`、`screenshot-moonlit-1280x800.png` | 同尺寸、独立目录 |
| 竖版宣传海报 | `poster-1080x1440.png` | 共用 |

`assets/icon16.png` 至 `assets/icon512.png` 是扩展、工具栏及品牌图标导出；原始矢量位于 `assets/brand/symbol.svg`，`assets/icon.svg` 为扩展使用副本。每张宣传图另保留同名 SVG 可编辑源文件。PNG 宣传图及截图均无透明通道；图标 PNG 保留透明背景。

功能截图来自实际本地预览和编辑器；海报及宣传横幅中的主题卡片为构图用示意图，不作为真实界面截图。浏览器账户同步仅适用于极简配置，需同一浏览器产品和账户、启用扩展同步并使用相同扩展 ID。

## 重建

安装 Node.js、`sharp`，并提供 Noto Sans CJK SC 字体；在仓库根目录运行：

```sh
node scripts/brand-assets.mjs
```

脚本会读取 `editor-preview.png` 及本目录 `source-login-*.png` 的真实界面截图。界面变化后先更新截图，再重建素材。浏览器截图应通过浏览器工具采集。

## 尺寸来源

核对日期：2026-10-28。

- [Chrome 官方图片规范](https://developer.chrome.com/docs/webstore/images)：图标 128×128，正方形图形 96×96；小宣传图 440×280；大横幅 1400×560；截图采用 1280×800。Chrome 建议宣传图尽量不放文字，所以小图采用无文案构图。
- [Edge 官方发布规范](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)：商店 Logo 推荐 300×300、最低 128×128；小宣传图 440×280；大横幅 1400×560；截图可用 1280×800 或 640×480。

飞牛品牌参考来自[飞牛官网](https://fnnas.com/)展示的[标识素材](https://static2.fnnas.com/official/fnos-logo.png)，参考副本保存在 `docs/brand/fnos-reference.png`。新图标直接嵌入[官网 favicon](https://fnnas.com/favicon.ico)原图，通过原图蒙版改为月夜配色，保留轮廓与比例，仅调整外框圆角，不重绘牛角或 F；各尺寸均不增加色签。该图标是第三方主题扩展标识；飞牛原标识及名称的权利归原权利人所有。
