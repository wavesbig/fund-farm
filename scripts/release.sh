#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'EOF'
用法：
  scripts/release.sh patch
  scripts/release.sh minor
  scripts/release.sh major
  scripts/release.sh 1.2.3

流程：校验工作区 -> 升版本 -> 质量检查 -> 生产构建 -> 提交/tag -> 构建并推送 GHCR -> 推送 Git -> GitHub Release。
EOF
}

fail() {
  echo "release: $*" >&2
  exit 1
}

[[ $# -eq 1 ]] || { usage; exit 1; }

release_mode=$1
repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

[[ $(git branch --show-current) == "main" ]] || fail "必须在 main 分支执行"
[[ -z $(git status --porcelain) ]] || fail "工作区有未提交改动，请先提交或清理"

current_version=$(node -p "require('./package.json').version")
if [[ $release_mode =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
  next_version=$release_mode
else
  IFS='.' read -r major minor patch <<<"$current_version"
  case "$release_mode" in
    patch) next_version="$major.$minor.$((patch + 1))" ;;
    minor) next_version="$major.$((minor + 1)).0" ;;
    major) next_version="$((major + 1)).0.0" ;;
    *) fail "无效版本参数：$release_mode" ;;
  esac
fi

tag="v$next_version"
image="ghcr.io/wavesbig/fund-farm"
release_committed=0

cleanup() {
  if [[ $release_committed -eq 0 ]] && [[ -n $(git status --porcelain) ]]; then
    git restore -- package.json package-lock.json docker-compose.prod.yml CHANGELOG.md 2>/dev/null || true
  fi
}
trap cleanup EXIT

[[ $next_version != "$current_version" ]] || fail "新版本不能等于当前版本 $current_version"

git fetch origin main --tags 2>/dev/null || true
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  git merge-base --is-ancestor origin/main HEAD || fail "本地 main 已和远端分叉，请先同步"
fi

if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
  fail "本地 tag 已存在：$tag"
fi
if git ls-remote --exit-code --tags origin "refs/tags/$tag" >/dev/null 2>&1; then
  fail "远端 tag 已存在：$tag"
fi

npm version "$next_version" --no-git-tag-version

if [[ -f "docker-compose.prod.yml" ]]; then
  node - "$next_version" <<'NODE'
const fs = require('node:fs');
const file = 'docker-compose.prod.yml';
if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  if (/如 :[^）]+）/.test(content)) {
    fs.writeFileSync(file, content.replace(/如 :[^）]+）/, `如 :${process.argv[2]}）`));
  }
}
NODE
fi

# CHANGELOG.md 缺少当前版本段落时，从上个 tag 以来的提交自动生成
if [[ ! -f "CHANGELOG.md" ]]; then
  touch CHANGELOG.md
fi

if ! grep -q "^## $tag" CHANGELOG.md; then
  prev_tag=$(git describe --tags --abbrev=0 --exclude="$tag" 2>/dev/null || echo "")
  range="${prev_tag:+$prev_tag..}HEAD"
  {
    echo "## $tag - $(date +%F)"
    echo ""
    echo "### 变更"
    echo ""
    git log $range --pretty=format:"- %s"
    echo ""
    echo ""
    cat CHANGELOG.md
  } > CHANGELOG.md.tmp && mv CHANGELOG.md.tmp CHANGELOG.md
fi

# 提取当前版本段落作为 GitHub Release 说明
release_notes=$(mktemp)
awk -v ver="$tag" '$0 == "## " ver || index($0, "## " ver " ") == 1 {flag=1; next} /^## / {flag=0} flag' CHANGELOG.md > "$release_notes"

printf '==> 发布 %s：质量检查\n' "$tag"
npm run lint
npm run type-check

printf '==> 发布 %s：生产构建\n' "$tag"
npm run build

printf '==> 发布 %s：提交版本\n' "$tag"
git add package.json package-lock.json docker-compose.prod.yml CHANGELOG.md
git commit -m "chore(release): bump version to $next_version"
release_committed=1
git tag -a "$tag" -m "Release $tag"

printf '==> 发布 %s：多架构 Docker 构建并推送\n' "$tag"
docker info >/dev/null
docker buildx build \
  ${BUILDX_BUILDER:+--builder "$BUILDX_BUILDER"} \
  --platform linux/amd64,linux/arm64 \
  -t "$image:$next_version" \
  -t "$image:latest" \
  --push \
  .

printf '==> 发布 %s：推送 Git\n' "$tag"
git push origin main "$tag"

printf '==> 发布 %s：GitHub Release\n' "$tag"
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh release create "$tag" --title "$tag" --notes-file "$release_notes"
else
  # gh 不可用时兜底：取 git 凭据管理器中已存的 GitHub 凭据直接调 API 创建
  repo=$(git remote get-url origin | sed -E 's#.*github\.com[:/]##; s#\.git$##')
  token=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null | sed -n 's/^password=//p')
  payload=$(node -e 'const fs=require("node:fs");process.stdout.write(JSON.stringify({tag_name:process.argv[1],name:process.argv[1],body:fs.readFileSync(process.argv[2],"utf8").trimEnd()}))' "$tag" "$release_notes")
  resp_file=$(mktemp)
  http_code=$(curl --silent --show-error -o "$resp_file" -w '%{http_code}' \
    -X POST \
    -H "Authorization: Bearer $token" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/$repo/releases" \
    --data-binary "$payload") || true
  if [[ $http_code != 200 && $http_code != 201 ]]; then
    cat "$resp_file" >&2 || true
    rm -f "$resp_file"
    rm -f "$release_notes"
    fail "GitHub Release 创建失败（HTTP $http_code），请手动创建：https://github.com/$repo/releases/new?tag=$tag"
  fi
  rm -f "$resp_file"
  echo "Release 已创建：https://github.com/$repo/releases/tag/$tag"
fi
rm -f "$release_notes"

printf '==> %s 发布完成\n' "$tag"
