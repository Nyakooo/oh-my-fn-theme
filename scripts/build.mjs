import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
const version = manifest.version;
const dist = resolve(root, 'dist');
const packageDir = join(dist, `oh-my-fn-theme-${version}`);
const files = [
  'manifest.json', 'background.js', 'content.js', 'theme.css',
  'options.html', 'options.js', 'options.css', 'assets'
];

if (!version || !Array.isArray(manifest.permissions)) throw new Error('manifest.json 缺少版本或权限定义');
await rm(dist, { recursive: true, force: true });
await mkdir(packageDir, { recursive: true });
for (const file of files) await cp(resolve(root, file), join(packageDir, file), { recursive: true });
const copiedManifest = JSON.parse(await readFile(join(packageDir, 'manifest.json'), 'utf8'));
for (const path of [...Object.values(copiedManifest.icons), ...Object.values(copiedManifest.action?.default_icon ?? {})]) {
  if (!(await stat(join(packageDir, path)).catch(() => null))) throw new Error(`扩展图标不存在：${path}`);
}
const zipPath = join(dist, `oh-my-fn-theme-${version}.zip`);
await new Promise((resolvePromise, reject) => {
  const child = spawn('zip', ['-qr', zipPath, `oh-my-fn-theme-${version}`], { cwd: dist, stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', (code) => code === 0 ? resolvePromise() : reject(new Error(`zip 退出码：${code}`)));
});
console.log(`扩展目录：${packageDir}`);
console.log(`ZIP 包：${zipPath}`);
