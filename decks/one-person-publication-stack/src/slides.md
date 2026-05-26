---
theme: default
title: "一个人的教育出版社：如何用 AI 重塑工作流"
info: |
  ## AI for Education: The One-Person Publication Stack
  By Herbert Yang · Inturious Labs · May 28, 2026 · Shanghai
  https://inturious.com
layout: cover
background: https://cover.sli.dev
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

# 一个人的教育出版社:<br>如何用 AI 重塑工作流

用 Claude 实现内容编辑和出版的高度自动化

May 28, 2026, Shanghai

<div class="abs-br m-6 flex gap-2">
  <a href="https://inturious.com" target="_blank" class="text-sm opacity-50 hover:opacity-100">
    Inturious Labs
  </a>
</div>

---
layout: image
image: /img/AI.jpg
backgroundSize: cover
class: flex flex-col items-center justify-center
---

<div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

<div class="relative z-10">

# 提纲

<v-clicks>

- 背景
  - 2025: AI 大跃进的元年
  - 一人公司 Inturious Labs 的诞生
  - 为什么做 The Sunday Blender (TSB)
- AI 如何实现 TSB 工作流的高度自动化
  - 搭建网站
  - 总结新闻故事
  - 初始化文章模版
  - 自动抓取新闻图片
  - 核查文本格式和 SEO 信息
  - 从文本到音频，视频的多媒体扩展
  - 社交媒体上的自动推广
- 总结

</v-clicks>

</div>

---
layout: image
image: /img/speaker.jpg
backgroundSize: contain
style: 'background-color: #FFEED6'
---

---
layout: image-right
image: /img/peter.jpg
---

# 背景 1: 2025 - AI 狂飙的元年

<v-clicks>

- 大语言模型/LLM 的突飞猛进
- AI 智能体/agent 的雨后春笋
- 无代码/no-code 开发技术的成熟
- 打造个人品牌/IP 是唯一确定的高回报投入
  - 掌握对自己的叙事权
  - 掌握自己的数据主权
  - 掌握自己内容的分发渠道
- 巨头的垄断和无限的资本投入 (`OpenClaw`) 
- 最稀缺的资源
  - GPU 算力（电力能源）
  - 投喂给 LLM 的原始数据 (`Scale AI`)

</v-clicks>

---
layout: image-right
image: /img/inturious.jpg
---

# 背景 2: Inturious Labs

<v-clicks>

- “超级个体”的涌现
  - 产品经理
  - 项目经理
  - 前端工程师
  - UI 设计师
  - 后端工程师
  - 测试工程师
- “一人公司”
  - [不需要 CS 背景](https://herbertyang.xyz/docs/about/herbert-yang/)
  - 多条产品线同时开发
  - 先做再说
  - 随时转型
- https://inturious.com/

</v-clicks>

---
layout: image-right
image: /img/tsb.jpg
---

# 背景 3: 为什么做<br>The Sunday Blender

<v-clicks>

- https://weekly.sundayblender.com/about/
- 从小培养阅读能力的重要性
- 遍寻宇内，没有合适的内容
- AI 技术的成熟，使不可能成为可能
- 得到初期用户的喜爱

<div class="absolute bottom-6 left-12">
  <img src="/img/tsb-signup.jpg" class="w-56 h-56" />
</div>

</v-clicks>

---
layout: image-right
image: /img/website.jpg
backgroundSize: contain
---

# 工作流 Buff 1: 建网站

<v-clicks>

- 网站架构：[静态网页 weekly.sundayblender.com](https://weekly.sundayblender.com/)
- 前端架构: [Hugo](https://gohugo.io/)
- 后端：不需要
- 服务器部署: [Vercel](https://vercel.com)
- 电子邮件发送： [Buttondown](https://buttondown.com/) 
- 付费： [Stripe](https://stripe.com/)
- 前世的涅槃：从 Substack 完成移植
- 图片处理
  - 格式转化，PNG/HEIC/Webp => `JPG`
  - Resize，横幅 < `1200px`
  - 多版本，原始版 + 网页版 + 缩略版
  - Lazy loading

</v-clicks>

---
layout: image-right
image: /img/prompt.jpg
backgroundSize: contain
---

# 工作流 Buff 2: 总结新闻故事

<v-clicks>

- 人工收集，选择新闻故事素材
- [claude.ai](https://claude.ai) 来完成 100 字的故事总结
- 如何应对 AI 幻觉？
  - 三个 LLM 模型交叉验证 （Claude, Gemini, Grok)
  - 人工`直觉`，`经验`和`常识`依旧重要
  - 幻觉无法 100% 根治
  - 产品定位：是`教育`，不是新闻

</v-clicks>

---
layout: image-right
image: /img/template.jpg
backgroundSize: contain
---

# 工作流 Buff 3: 初始化文章模版

<v-clicks>

- 用 Python 脚本实现`重复性`和`标准化`流程的自动化
  - frontmatter
  - 通用格式和段落
  - SEO 关键词
  - 播客 shownotes
  - 前后文章的引用 
- https://github.com/Inturious-Labs/sundayblender/blob/main/scripts/init_article.py
</v-clicks>

---
layout: image-right
image: /img/audit.jpg
backgroundSize: contain
---

# 工作流 Buff 4: 核查文本格式和 SEO 信息

<v-clicks>

- 用 Python 脚本实现内容发布前最后一步审核
  - 提升文章的`完整性`，`统一性`，和`准确性`
  - 相信`代码`，不相信人为核查
  - 将繁重的脑力工作外包给机器
  - 大幅降低内容创建者发布前的焦虑和压力

- https://github.com/Inturious-Labs/sundayblender/blob/main/scripts/audit_final.py

</v-clicks>

---
layout: image-right
image: /img/pdf.jpg
backgroundSize: contain
---

# 工作流 Buff 5: 从文本到音频/视频的多媒体扩展

<v-clicks>

- HTML => PDF (10s): [Python 脚本](https://github.com/Inturious-Labs/sundayblender/blob/main/scripts/html_to_pdf.py)将 HTML 网页转化为可读性更高，适合打印的 PDF
- PDF => MP3 (5m): [Google NotebookLM](https://notebooklm.google.com) 将 PDF 转化为美式英语原声 AI 主理人解读的播客; 在[小宇宙](https://www.xiaoyuzhoufm.com/podcast/691d248b88967822c085fda5)，[苹果 Podcast](https://podcasts.apple.com/us/podcast/the-sunday-blender-podcast/id1853996806), [Spotify](https://open.spotify.com/show/0p6Boxgcyy9eJzdBQlu4CG)，[Youtube](https://youtube.com/playlist?list=PLouj80O7ZtFbHlcdDlhuo4xA07yy5W-Ep&si=re62-BJPjEhKjZ6s) 全网统一发布

<div class="absolute bottom-6 left-12">
  <img src="/img/tsb-podcast.svg" class="w-40 h-40" />
</div>

</v-clicks>

---
layout: image-right
image: /img/tweets.jpg
backgroundSize: contain
---

# 工作流 Buff 6: 社交媒体上的推广宣传

<v-clicks>

- 自动发推
  - 将 20+ 新闻故事以每隔 X 小时的频率自动发布到 [Twitter](https://x.com/SundayBlender) 上，增加曝光度
- 按照要求在网络上搜索目标用户和 KOL
  - 搜集 KOL 名单和联系方式，整理成xls表格
  - 了解 KOL 背景和关注热点，寻找共鸣
  - 自动生成 cold-call 电子邮件
  - [OpenClaw](https://openclaw.ai)/[Hermes](https://github.com/nousresearch/hermes-agent) 智能体可以用本地大语言模型来跑 24/7 的查询任务

</v-clicks>

---
layout: image
image: /img/wave.jpg
backgroundSize: cover
---

<div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

<div class="relative z-10">

# 总结

<v-clicks>

- （几乎）没有做不到的，只有想不到的。体验: https://weekly.sundayblender.com
- 2026 年的 AI 类似 1995 年的互联网。所有的产品模式，商业模式都将被重塑；大量产业格局会被重新洗牌

| 人群 | 用 AI 来 ... | 能力提升 |
| --- | --- | --- |
| 普通用户 | 查询 | 3-5x |
| 程序员 | 开发工具和产品 | 5-10x |
| 投资者 | 信息搜索，辨别信号，分析趋势，聚合信息，自动执行 | 10-100x |
| 内容创建者 | 收集数据，整理数据，编辑内容，分享内容，构建叙事 | <span v-click class="text-yellow-300 font-bold text-2xl">100-1000x</span> |

</v-clicks>

</div>

<div class="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
  <img src="/img/wechat.jpg" class="w-20" />
</div>