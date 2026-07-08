# 藏书数据与录入流程

图书馆的书目由数据文件驱动，没有数据库。想给几千本书建目录，不要手动敲——用扫码 App，再用脚本转换。

## 一、扫码建目录

用一个中文藏书 App 逐箱扫条形码（推荐 **晒书房**；藏书馆、微信读书可作备选）。App 会自动把 ISBN 解析成书名、作者、出版社和封面。扫完后，从 App 导出 **CSV / Excel**。

> 若导出的是 Excel（.xlsx），先用「另存为 CSV」转成 CSV——录入脚本只读 CSV，以此避免多一个依赖。

## 二、生成书目

把导出的 CSV 放进 `data/raw/`，然后：

```bash
bun run ingest
```

脚本会（`scripts/ingest.ts` + `scripts/lib.ts`）：

- 把 App 的列名映射到我们的字段（列名别名在 `scripts/ingest.ts` 顶部，按需微调）；
- 规范化 ISBN（去连字符、ISBN-10 转 13、校验位验证），作为每本书的 `id`；无 ISBN 的书用拼音生成稳定 `id`；
- 按 ISBN 去重；把杂乱的分类归并到统一类目；
- 输出排序稳定的 `src/data/catalog.json`（diff 干净），并把封面链接单独写到 `src/data/covers-src.json`。

## 三、本地化封面

外链封面会失效，绝不直接引用。运行：

```bash
bun run covers          # 抓取 covers-src.json 里的封面
bun run covers --force  # 连已有封面的也重新抓
```

封面会被压缩转成 WebP，存到 `public/covers/<id>.webp`，并回填 `catalog.json` 的 `cover` 字段。**记得把 `public/covers/` 和更新后的 `catalog.json` 一起提交。** 抓取失败的书没有封面，会自动用按书名生成的文字封面兜底，永远不会出现裂图。

## 说明

- `data/raw/` 里的原始导出**不纳入版本库**（可能较大、也是你的私有数据），随时可重新导出。
- 手动补录：没有 ISBN、或 App 没识别出的书，可直接编辑 `src/data/catalog.json`，字段见 `src/content.config.ts` 里的 schema。
