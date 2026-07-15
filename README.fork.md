# RuyiHermesAgent 便携版（Fork 说明）

> 本仓库是 [Nous Research / Hermes Agent](https://github.com/NousResearch/hermes-agent) 的定制 fork，
> 目标是把桌面端打包成 **Windows 免安装绿色便携版**，并让它在**受限网络 / 非标准环境**下也能一键跑通。
> 上游完整文档见 [README.md](README.md)。

仓库地址：`github.com/Odys-eng/RuyiHermesAgent-portable`
桌面版本：`0.1.1`　产物：`RuyiHermesAgent-Portable-0.1.1-x64.exe`（Windows x64，约 94 MB）

---

## 这个 Fork 做了什么

### 1. Windows 绿色便携版打包
- 基于 electron-builder 的 `portable` target，产出**单文件 exe**，双击即用、免安装。
- 所有用户数据（配置、运行时、密钥）写入 **exe 同级的 `data/` 目录**，不写系统、不留残留，删除即干净卸载。
- 完整打包命令：`npm run desktop:package:portable:win`，产物在 `apps/desktop/release/`。

### 2. 便携版运行时隔离（核心修复）
原版桌面端启动时会复用宿主机上任何已有的全局 Hermes 安装，当版本不匹配时导致后端启动失败、无限重启（`/api/ready` 撞 headless 404）。本 fork 修复：
- **强制使用自己的 data 目录**：便携模式无条件把 `HERMES_HOME` 指向 `data/hermes`，无视宿主机继承的全局变量（含 Windows 用户环境注册表）。
- **不复用全局安装**：便携模式跳过「复用 PATH 上的 hermes / 系统 Python」等路径，直接在自己的 data 目录里 bootstrap 匹配的运行时。
- **装完即复用**：修复了「装完仍判定未安装 → 无限重装」的死循环，bootstrap 完成后正确复用已建好的运行时。

### 3. 受限网络 / 弱网首次安装优化
针对代理环境和国内网络，让首次 bootstrap 不必死磕慢速国外源：
- **uv 复用**：`install.ps1` / `install.sh` 在下载 uv 前，先复用 PATH 上已有的 uv，避开 astral.sh 下载超时。
- **仓库本地复用**：通过 `HERMES_LOCAL_REPO` 环境变量指向本地已有 checkout，用 `git clone <本地路径>` 走文件系统秒级完成，免 GitHub 大仓库 clone。
- **install 脚本本地读取**：bootstrap 优先从 `HERMES_LOCAL_REPO` 读取 install 脚本，避免打包版 `SOURCE_REPO_ROOT` 失效后被迫联网下载（弱网下报 `read ECONNRESET`）。

### 4. 打包契约与测试加固
- 显式校验便携产物的 PE 架构：接受 electron-builder 32 位（ia32）自解压启动壳，同时强制校验应用本体为 x64。
- `install.ps1` / `install.sh` 默认仓库指向本 fork，`verify:install-source` 发布护栏据此校验。

### 5. 密钥与分发安全
- 用户 API 密钥保存在被 `.gitignore` 覆盖的 `data/hermes/.env`，**永不入库**。
- 分发时只发 exe、绝不带 `data/`；详见 [apps/desktop/DISTRIBUTION.md](apps/desktop/DISTRIBUTION.md)。

---

## 快速开始

### 直接使用（推荐）
从 [Releases](https://github.com/Odys-eng/RuyiHermesAgent-portable/releases) 下载 `RuyiHermesAgent-Portable-0.1.1-x64.exe`，双击运行。

1. 首次启动会自动 bootstrap 运行时（需联网，几分钟）。
2. 首次运行后编辑 exe 同级的 `data/hermes/.env`，填入你自己的 provider API key，例如：
   ```
   MINIMAX_CN_API_KEY=你的密钥
   ```
   （或 `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENROUTER_API_KEY` 等。）
3. 重启应用即可对话。

> 未做代码签名，首次运行如遇 Windows SmartScreen 提示，点「更多信息」→「仍要运行」。

### 从源码打包
```bash
npm ci
uv sync --locked
npm run desktop:package:portable:win
# 产物：apps/desktop/release/RuyiHermesAgent-Portable-0.1.1-x64.exe
```

---

## 提交记录一览

| 提交 | 内容 |
|---|---|
| `c05d652` | 便携版隔离运行时，不复用机器全局 Hermes 安装 |
| `2243973` | uv 阶段优先复用 PATH 上已有的 uv |
| `c967e8b` | repository 阶段支持 `HERMES_LOCAL_REPO` 本地复用 |
| `5ad709f` | bootstrap 支持从 `HERMES_LOCAL_REPO` 读取 install 脚本 |
| `a372fc4` | 便携模式装完后复用运行时，修复 bootstrap 死循环 |
| `3263e1e` | 便携版分发与密钥安全说明 |

---

## 致谢

核心 Agent 能力来自 [Nous Research 的 Hermes Agent](https://github.com/NousResearch/hermes-agent)（MIT 许可）。本 fork 仅在其之上做 Windows 便携化打包与受限环境适配。
