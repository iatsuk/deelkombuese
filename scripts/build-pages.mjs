import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=new URL('../dist/',import.meta.url);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const name of ['index.html','favicon.svg','manifest.webmanifest','sw.js','src','fonts','assets','impressum','datenschutz']){
  await cp(new URL(name,new URL('../',import.meta.url)),new URL(name,out),{recursive:true});
}
await writeFile(new URL('.nojekyll',out),'');
console.log(`Статический сайт подготовлен: ${root}dist/`);
