// Rebuild editable vector branding and exact store PNG exports.
// Run with sharp available on Node's module path (see docs/brand/README.md).
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const symbol = await readFile('assets/brand/symbol.svg', 'utf8');
const inner = symbol.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const font = 'Noto Sans CJK SC, sans-serif';
const icon = (x,y,size) => `<g transform="translate(${x} ${y}) scale(${size/256})">${inner}</g>`;
const text = (x,y,value,size=20,color='#182f53',weight=500) => `<text x="${x}" y="${y}" fill="${color}" font-family="${font}" font-size="${size}" font-weight="${weight}">${value}</text>`;
const svg = (w,h,body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="wash" x2="1" y2="1"><stop stop-color="#f4f1e8"/><stop offset="1" stop-color="#dce5dc"/></linearGradient><linearGradient id="deep" x2="1" y2="1"><stop stop-color="#1b2b31"/><stop offset="1" stop-color="#314b4b"/></linearGradient></defs>${body}</svg>`;
const card = (x,y,w,h,night=false) => {
 const bg=night?'#182c34':'#fff',side=night?'#254047':'#eaece5',ink=night?'#eedab2':'#45583d',muted=night?'#94afa6':'#a0ac96';
 return `<g transform="translate(${x} ${y})"><rect x="3" y="12" width="${w}" height="${h}" rx="18" fill="#182c34" opacity=".09"/><rect width="${w}" height="${h}" rx="16" fill="${bg}"/><path d="M16 0H${w*.52}V${h}H16Q0 ${h} 0 ${h-16}V16Q0 0 16 0" fill="${side}"/>${text(20,32,'fnOS',Math.max(10,w*.04),ink,700)}${text(20,h*.34,night?'欢迎回家。':'留一点空间，',w*.061,ink)}${text(20,h*.47,night?'今晚，也很美。':'给自己。',w*.061,ink)}<rect x="20" y="${h*.58}" width="${w*.3}" height="3" rx="1.5" fill="${muted}" opacity=".5"/><rect x="20" y="${h*.63}" width="${w*.23}" height="3" rx="1.5" fill="${muted}" opacity=".3"/>${night?`<circle cx="${w*.32}" cy="${h*.77}" r="${w*.045}" fill="#e6c58e"/><circle cx="${w*.34}" cy="${h*.75}" r="${w*.044}" fill="${side}"/>`:`<ellipse cx="${w*.2}" cy="${h*.8}" rx="${w*.08}" ry="${w*.04}" fill="none" stroke="#9baa91"/><ellipse cx="${w*.2}" cy="${h*.8}" rx="${w*.04}" ry="${w*.08}" fill="none" stroke="#9baa91"/>`}${text(w*.59,h*.28,'欢迎回来',w*.044,night?'#f0dec0':'#354033',600)}<rect x="${w*.59}" y="${h*.38}" width="${w*.33}" height="${h*.12}" rx="4" fill="${night?'#31464b':'#f5f6f2'}" stroke="${night?'#41565b':'#e1e5da'}"/><rect x="${w*.59}" y="${h*.55}" width="${w*.33}" height="${h*.12}" rx="4" fill="${night?'#31464b':'#f5f6f2'}" stroke="${night?'#41565b':'#e1e5da'}"/><rect x="${w*.59}" y="${h*.74}" width="${w*.33}" height="${h*.12}" rx="4" fill="${night?'#b7b888':'#3e5136'}"/></g>`;
};
async function output(path,w,h,body,transparent=false) {
 const source=svg(w,h,body); await writeFile(path+'.svg',source);
 let renderer=sharp(Buffer.from(source)); if(!transparent)renderer=renderer.flatten({background:'#ffffff'}).removeAlpha();
 await renderer.png().toFile(path+'.png');
}
for(const n of [16,24,32,48,64,96,128,256,300,512]){
 const pad=n===128?16:0;
 const source=svg(n,n,icon(pad,pad,n-pad*2));
 await sharp(Buffer.from(source)).png().toFile(`assets/icon${n}.png`);
}
await output('docs/store/chrome/logo-128',128,128,icon(16,16,96),true);
await output('docs/store/edge/logo-300',300,300,icon(12,12,276),true);
for(const store of ['chrome','edge']) {
 const small=store==='chrome'
 ? `<rect width="440" height="280" fill="url(#deep)"/><circle cx="385" cy="15" r="160" fill="#b2c5a5" opacity=".2"/>${card(154,26,250,157)}${card(198,117,210,132,true)}${icon(18,86,135)}<circle cx="62" cy="240" r="7" fill="#f6e9ce"/><circle cx="84" cy="240" r="7" fill="#a8c6a0"/><circle cx="106" cy="240" r="7" fill="#a4caff"/>`
 : `<rect width="440" height="280" fill="url(#wash)"/>${icon(24,24,66)}${text(102,52,'飞牛 fnOS 登录页主题',19,'#304746',700)}${text(103,76,'让每一次登录，都有你的风格。',10,'#829487')}${card(25,108,235,148)}${card(222,135,192,121,true)}`;
 await output(`docs/store/${store}/promo-small-440x280`,440,280,small);
 const banner=`<rect width="1400" height="560" fill="url(#deep)"/><circle cx="1230" cy="25" r="440" fill="#b2c5a5" opacity=".12"/><circle cx="850" cy="585" r="300" fill="#c6d3b5" opacity=".1"/>${icon(53,53,80)}${text(151,105,'飞牛 fnOS 登录页主题',27,'#fff',700)}${text(65,235,'让每一次登录，',58,'#fff',700)}${text(65,319,'都有你的风格。',58,'#fff',700)}${text(68,383,'两种风格 · 极简主题可视化编辑 · 实时预览',19,'#d8ddca')}${text(68,470,store==='chrome'?'为 Chrome 而设计':'为 Microsoft Edge 而设计',15,'#adc2b2')}${card(660,80,490,318)}${card(930,250,400,259,true)}`;
 await output(`docs/store/${store}/promo-marquee-1400x560`,1400,560,banner);
 const shots = [
  ['editor','editor-preview.png','极简主题编辑器','文案 / 配色 / 布局 · 实时预览'],
  ['minimal','docs/brand/source-login-minimal.png','极简主题','暖白纸面 · 灰绿双栏'],
  ['moonlit','docs/brand/source-login-moonlit.png','月夜居所','夜色插画 · 互动陪伴']
 ];
 for (const [name,file,label,caption] of shots) {
  const encoded=(await readFile(file)).toString('base64');
  // These captured source screenshots are JPEGs. Declaring them as PNG makes
  // SVG renderers silently omit the image, leaving a blank store screenshot.
  const shot=`<rect width="1280" height="800" fill="#fff"/>${icon(22,12,56)}${text(88,42,'飞牛 fnOS 登录页主题 · '+label,22,'#304746',700)}${text(88,65,'第三方主题扩展 · 本地示例页面，不连接 NAS',10,'#8d9c90')}${text(920,45,caption,14,'#829487')}<image x="0" y="80" width="1280" height="720" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/jpeg;base64,${encoded}"/>`;
  await output(`docs/store/${store}/screenshot-${name}-1280x800`,1280,800,shot);
 }

}
const poster=`<rect width="1080" height="1440" fill="url(#wash)"/><circle cx="1020" cy="390" r="540" fill="#dae4d7" opacity=".55"/>${icon(61,64,98)}${text(179,125,'飞牛 fnOS 登录页主题',37,'#304746',700)}${text(73,290,'让每一次登录，',76,'#304746',700)}${text(73,395,'都有你的风格。',76,'#304746',700)}${text(78,469,'为 fnOS 登录页，留一点自己的空间。',25,'#829487')}${card(74,555,830,460)}${card(435,822,570,350,true)}${text(78,1260,'双主题  /  文案自定义  /  实时预览',25,'#49665b',600)}${text(78,1310,'Chrome 与 Edge · 浏览器扩展',18,'#829487')}${text(78,1380,'第三方主题扩展，非飞牛官方产品。',15,'#8d9c90')}`;
await output('docs/brand/poster-1080x1440',1080,1440,poster);
await writeFile('docs/promo.svg', svg(1400,560,`<rect width="1400" height="560" fill="url(#wash)"/>${icon(50,50,85)}${text(157,107,'飞牛 fnOS 登录页主题',28,'#304746',700)}${text(66,241,'让每一次登录，',58,'#304746',700)}${text(66,329,'都有你的风格。',58,'#304746',700)}${text(70,407,'双主题 · 极简可视化编辑 · 实时预览',22,'#829487')}${card(660,70,510,330)}${card(941,260,390,250,true)}`));
console.log('Brand SVG sources and Chrome/Edge PNG assets generated.');
