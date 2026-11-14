# 总统任期与美国经济

这是一个研究型交互可视化项目，覆盖 1948 Q1 至 2026 Q3。页面使用四个模块回答不同问题：连续时间图解释历史背景，箱线图比较总统任内季度分布，单项排名展示更换评价维度后排序如何变化，任期聚类比较多指标经济画像。

## 指标与口径

- 实际 GDP 同比增长率由 FRED/BEA 的 GDPC1 计算，各有效季度等权平均。
- 失业率使用 FRED/BLS 的 UNRATE 月度数据汇总为季度平均，再在总统任内对有效季度等权平均。
- CPI 通胀率先由 CPIAUCSL 计算月度同比，再汇总为季度平均。
- 有效联邦基金利率采用 FEDFUNDS 季度平均，1954 Q3 以前保持缺失。
- 总统支持率采用 Gallup 公布的全任期平均工作支持率。Donald Trump II 的 41% 是截至 2025 年末的阶段平均。
- 衰退月份采用 NBER 月度衰退日期。衰退月份占比使用已观察执政月份作分母。新衰退频率是任内开始的衰退次数按 48 个月折算。

季度按季末在任总统归属。Truman 的经济覆盖从 1948 年开始，Donald Trump II 的经济覆盖截至 2026 Q3。不完整覆盖使用空心符号标记。

排名是单项数值排序。GDP 增长和支持率默认从高到低，失业率、通胀率、联邦基金利率与衰退指标默认从低到高。通胀和利率排序仅描述数值大小，不表示越低越好。页面不合成总分，也不作总统个人能力的因果判断。

箱线图仅用于具有季度观测值的四项宏观指标。箱体表示第 25—75 百分位，中线为中位数，须线采用 Tukey 1.5×IQR 规则，空心圆表示离群季度，金色菱形表示任期内季度平均值。支持率和衰退指标只有任期汇总值，因此放在单项排名中，不伪装成季度分布。

## 数据文件

- `data/quarters.json` 保存 315 个季度的四项宏观指标。
- `data/approval.json` 保存 Gallup 总统支持率平均值及完整性标记。
- `data/history.json` 保存总统任期和 NBER 衰退区间。
- `data/fred-export.zip` 保存生成季度数据所用的 FRED 原始快照。

## 本地运行

在本目录运行 `python -m http.server 8000`，然后访问 `http://127.0.0.1:8000/`。Vega、Vega-Lite 和 Vega-Embed 已存放在 `vendor/`，无需构建步骤或 API 密钥。

## 部署到 GitHub Pages

1. 新建或打开目标 GitHub 仓库，把本目录内的 `index.html`、`style.css`、`stats.css`、`app.js`、`charts.js`、`data/` 与 `vendor/` 放在仓库根目录。
2. 推送到默认分支（通常是 `main`）。
3. 在仓库的 **Settings → Pages** 中，将 **Build and deployment** 设为 **Deploy from a branch**，分支选择 `main`，目录选择 `/ (root)`，然后保存。
4. 等待 GitHub Pages 工作流完成，再访问设置页显示的网址。更新时覆盖同名文件并再次推送即可。

`economic-atlas.html` 是便于提交或离线保存的单文件版本；GitHub Pages 应优先使用拆分文件版本，以便浏览器缓存和后续维护。

## 来源

- [FRED](https://fred.stlouisfed.org/)
- [Gallup Presidential Job Approval Center](https://news.gallup.com/interactives/507569/presidential-job-approval-center.aspx)
- [NBER Business Cycle Expansions and Contractions](https://www.nber.org/research/data/us-business-cycle-expansions-and-contractions)
- [总统任期与衰退日期说明](data/history.md)

## 模块 04

在仓库根目录运行 `python build_clusters.py` 可从季度快照重建 `data/clusters.json`（NumPy、SciPy、scikit-learn、threadpoolctl）。主分析对各指标有效季度等权平均，再按任期进行总体标准差 Z 标准化。Ward 使用欧氏距离，K-means 使用固定种子 42、50 次初始化。两种算法均比较 K=2、3、4。留一检验每次重新标准化与拟合。党派只用于事后列联表与 ARI。模块使用完整历史样本，独立于其他图表的筛选器。离线单文件为此前的三模块版本。
