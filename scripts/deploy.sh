
# 终止一个错误
set -e

# 生成静态资源
npm run build

rm -rf ../yujun9008.github.io/dist/*

# 将build生成的dist目录拷贝至上一层目录中
cp -rf docs/.vuepress/dist ../yujun9008.github.io/
# 进入生成的文件夹
cd ../yujun9008.github.io/dist

git init
git add -A
git commit -m 'deploy'
git push -f https://github.com/yujun9008/yujun9008.github.io.git master