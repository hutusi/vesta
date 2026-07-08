# Vesta · 只买书

**只买书（Zhimaishu）** 是一座乡村图书馆的门户网站——藏在老屋里、自由取阅、凭良心借还。
本仓库代号 **Vesta**（灶神，守着不灭的炉火），仅作内部代号；对外品牌一律是「只买书」。

线上：[zhimaishu.com](https://zhimaishu.com)

## 技术栈

- [Astro](https://astro.build)（v7，纯静态输出，无适配器）+ TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4（通过 Vite 插件；主题写在 `src/styles/global.css` 的 `@theme`，没有 `tailwind.config.js`）
- [Bun](https://bun.sh) 作为包管理器与脚本运行时
- 部署到 Cloudflare Pages（免费额度，无需备案，十年低维护）
- 无数据库、无后端：内容是 Markdown，书目与留言是数据文件，搜索在前端完成

## 常用命令

```bash
bun install        # 安装依赖
bun run dev        # 本地开发（http://localhost:4321）
bun run build      # 构建到 dist/
bun run preview    # 预览构建产物
bun run check      # 类型检查（Astro + scripts）
bun run ingest     # 从扫码导出生成书目（见 data/README.md）
bun run covers     # 本地化并压缩封面（见 data/README.md）
```

## 目录结构

```
src/
  pages/            路由；en/ 下只有 about、visit 的英文版
  layouts/          BaseLayout（文档骨架）、ProsePage（Markdown 页）
  components/       Header、Footer、LangSwitcher、BookCard、CoverPlaceholder、GuestbookCard、FormEmbed
  content/pages/    about / visit / donate 的 Markdown（英文在 en/ 子目录）
  data/             catalog.json（书目，可由脚本生成）、guestbook.json（人工审核后的留言）
  lib/              pangu（盘古之白）、search.client（拼音/子串搜索）、cover、format
  i18n/ui.ts        导航与页脚的中英文案
  styles/global.css Tailwind v4 主题 + 中文排版基础
scripts/            ingest / covers 录入流水线（Bun）
public/             favicon、_headers、covers/（提交后的封面）
```

## 日常维护

- **改文案**：编辑 `src/content/pages/*.md`（关于、到访、赠书）。
- **加书**：见 [`data/README.md`](data/README.md)——扫码 → `bun run ingest` → `bun run covers`；少量也可手动编辑 `src/data/catalog.json`（字段见 `src/content.config.ts`）。
- **审留言 / 收赠书**：访客通过表单提交；确认后把留言追加进 `src/data/guestbook.json`，提交即上墙。表单地址与联系邮箱在 `src/config.ts` 里填写（推荐金数据，国内可达）。
- **改配色/字体**：`src/styles/global.css` 的 `@theme`。

## 部署

Cloudflare Pages 连接本仓库，构建命令 `bun run build`，输出目录 `dist`。锁定 `BUN_VERSION` 环境变量以复现构建；`bun.lock` 与精确版本号一起保证多年后仍能构建。若 Bun 在构建机上出问题，可退回 `npm ci && npm run build`（运行时不依赖 Bun）。
