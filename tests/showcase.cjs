const fs=require('fs'),assert=require('assert/strict'),path=require('path'),root=path.join(__dirname,'../dist');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'unique IDs');
for(const [,id] of html.matchAll(/data-case="([^"]+)"/g))assert(ids.includes('case-'+id),'dialog exists '+id);
const mobile=[...html.matchAll(/id="mobile-project-([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(mobile,['shopper','castledecks','aethel','other']);
assert(html.includes('featured-pair'));assert(html.includes('Other work'));assert(!html.includes('Public demo coming soon'));
assert(html.includes('https://castledecks-castledecks-pef3gg-472347-2-25-70-220.sslip.io/'));
for(const name of ['storefront','dashboard','handheld']){const file=path.join(root,'assets/shopper/'+name+'.webp');assert(fs.statSync(file).size>10000);assert(html.includes('/assets/shopper/'+name+'.webp'));}
for(const [,url] of html.matchAll(/(?:href|src)="(\/(?!\/)[^"?#]+)(?:[?#][^"]*)?"/g)) assert(fs.existsSync(path.join(root,url)), 'local asset '+url);
for(const name of ['battle','deck'])assert(fs.statSync(path.join(root,'assets/castledecks/'+name+'.webp')).size>10000);
assert(html.includes('Assisted rehearsal'));
assert(!/data:image|base64|CAPTURE_NEXT|DASH_NEXT/.test(html));
console.log('Showcase passed: ordered features, compact archive, valid dialogs/links, real local assets, no transfer debris.');
