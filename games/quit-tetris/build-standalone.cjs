const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'dist');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function asset(name){const file=path.resolve(root,name);if(!file.startsWith(root+path.sep))throw Error('Asset outside dist');return fs.readFileSync(file,'utf8');}
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,name)=>'<style>'+asset(name).replace(/@import[^;]*;/g,'')+'</style>');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,name)=>{const code=asset(name);new vm.Script(code,{filename:name});return '<script>'+code+'</script>';});
if(/<script\s+src=|<link[^>]+stylesheet|@import/.test(html))throw Error('External asset remains');
const target=path.resolve(process.argv[2]||path.join(__dirname,'standalone.html'));
fs.writeFileSync(target,html);console.log('Standalone HTML built with all CSS and JavaScript embedded.');
