"use strict";
// GitHub Pages must expose only user-facing artifacts, not source, workflows,
// node_modules, local journals, or future secret-bearing files.
const fs=require("node:fs"),path=require("node:path");
const root=__dirname,dist=path.join(root,"dist");
const files=["index.html","edgeai.html","tracker.html","manifest.json","icon.svg","apple-touch-icon.png"];
if(fs.existsSync(dist))fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(dist,{recursive:true});
for(const name of files){
 const source=path.join(root,name);
 if(!fs.existsSync(source))throw Error("Missing public asset "+name);
 fs.copyFileSync(source,path.join(dist,name));
}
const dataPath=path.join(root,"public","data.json");
const data=JSON.parse(fs.readFileSync(dataPath,"utf8"));
if(data.demo||!data.markets?.US?.dataAsOf||!data.markets?.SE?.dataAsOf)
 throw Error("Refusing to deploy missing/demo market dataset");
fs.copyFileSync(dataPath,path.join(dist,"data.json"));
console.log("Pages staging ready: "+files.length+" assets + data.json; no repository source uploaded");
