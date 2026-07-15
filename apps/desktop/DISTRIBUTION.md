# 便携版分发与密钥安全说明

## 密钥绝不进仓库

用户的 API 密钥保存在**便携版运行时目录**里，而非源码：

- 便携版：`<exe 同级>/data/hermes/.env`
- 该路径被 `.gitignore` 多重覆盖（`.env`、`data/`、`apps/desktop/release/`），**永远不会进入 git**。

打包/提交前可自查（应无输出）：

```bash
git grep -nE "sk-[A-Za-z0-9_-]{20,}" -- ':!*example*' ':!*template*'
```

## 分发时只发 exe，绝不带 data/

`apps/desktop/release/` 打包出的产物是单文件便携 exe：

- ✅ **只分发** `RuyiHermesAgent-Portable-<版本>-x64.exe`
- ❌ **绝不**把 `release/data/`（含使用者本地 `.env` 明文密钥）一起打包

分发目录可用脚本生成一个只含 exe 的干净副本（见 `release/dist-share/`，该目录同样被 gitignore 排除）。接收者首次运行会在 exe 同级生成自己的 `data/` 和 `.env`，填自己的密钥。

## 为什么 .env 不能加密

Python 后端用 `python-dotenv` 读取 `.env`，只认明文；加密后后端无法读取。desktop 的 `safeStorage` 加密仅用于「远程连接 token」，不覆盖 provider API key。因此 `.env` 明文是设计使然——安全性由「不入库 + 不随包分发 + 文件系统权限」保证，而非加密。

## 弱网 / 代理环境首次安装

首次 bootstrap 需联网。受限网络下可用环境变量加速（见 `scripts/install.ps1` 的 `HERMES_LOCAL_REPO` 与 uv 复用逻辑）：

- `HERMES_LOCAL_REPO=<本地已有 checkout>` — repository 阶段从本地复制，免 GitHub clone
- `HTTPS_PROXY` / `HTTP_PROXY` + `NODE_USE_ENV_PROXY=1` — 让 bootstrap 的 Node https 走代理
- PATH 前置 Git Bash 目录 — 便于 desktop 定位非标准路径的 `bash.exe`
