const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const fileInput = document.getElementById("fileInput");
const modeSelect = document.getElementById("mode");
const previewBtn = document.getElementById("previewBtn");
const downloadBtn = document.getElementById("downloadBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const uploadBtn = document.getElementById("uploadBtn");
const previewArea = document.getElementById("previewArea");
const copiedMsg = document.getElementById("copiedMsg");
const warningDiv = document.getElementById("warning");
const libraryDiv = document.getElementById("library");
const storageUsage = document.getElementById("storageUsage");
const clearLibraryBtn = document.getElementById("clearLibraryBtn");
const addCatboxBtn = document.getElementById("addCatboxBtn");
const exportLibraryBtn = document.getElementById("exportLibraryBtn");
const importLibraryBtn = document.getElementById("importLibraryBtn");
const importLibraryInput = document.getElementById("importLibraryInput");

let img = new Image();
let mask = {x:0,y:0,w:0,h:0};
let dragging=false,resizing=false;
let dragStartX=0,dragStartY=0,handle=null;
let currentMode="crop";

const MAX_SIZE=4096, MIN_W=50, MIN_H=50*9/16;
const EXPORT_W=1280, EXPORT_H=720;

function getMouse(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

// --- Cropper functions ---
function initMask(){
  const iw=canvas.width, ih=canvas.height;
  if(iw/ih>16/9){
    const mh=ih*0.8, mw=mh*16/9;
    mask={w:mw,h:mh,x:(iw-mw)/2,y:(ih-mh)/2};
  } else {
    const mw=iw*0.8, mh=mw*9/16;
    mask={w:mw,h:mh,x:(iw-mw)/2,y:(ih-mh)/2};
  }
  clampMask();
}
function clampMask(){
  if(mask.w<MIN_W){mask.w=MIN_W;mask.h=MIN_H;}
  if(mask.h<MIN_H){mask.h=MIN_H;mask.w=MIN_W;}
  if(mask.x<0) mask.x=0;
  if(mask.y<0) mask.y=0;
  if(mask.x+mask.w>canvas.width) mask.x=canvas.width-mask.w;
  if(mask.y+mask.h>canvas.height) mask.y=canvas.height-mask.h;
}
function getHandles(){
  return [
    {name:"tl",x:mask.x,y:mask.y,cursor:"nwse-resize"},
    {name:"tr",x:mask.x+mask.w,y:mask.y,cursor:"nesw-resize"},
    {name:"bl",x:mask.x,y:mask.y+mask.h,cursor:"nesw-resize"},
    {name:"br",x:mask.x+mask.w,y:mask.y+mask.h,cursor:"nwse-resize"},
    {name:"tm",x:mask.x+mask.w/2,y:mask.y,cursor:"ns-resize"},
    {name:"bm",x:mask.x+mask.w/2,y:mask.y+mask.h,cursor:"ns-resize"},
    {name:"ml",x:mask.x,y:mask.y+mask.h/2,cursor:"ew-resize"},
    {name:"mr",x:mask.x+mask.w,y:mask.y+mask.h/2,cursor:"ew-resize"}
  ];
}
function hitHandle(mx,my){
  return getHandles().find(h=>mx>=h.x-6&&mx<=h.x+6&&my>=h.y-6&&my<=h.y+6);
}
function drawScene(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(currentMode==="crop"){
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    ctx.fillStyle="rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.rect(0,0,canvas.width,canvas.height);
    ctx.moveTo(mask.x,mask.y);
    ctx.rect(mask.x,mask.y,mask.w,mask.h);
    ctx.fill("evenodd");
    ctx.strokeStyle="red"; ctx.lineWidth=2; ctx.strokeRect(mask.x,mask.y,mask.w,mask.h);
    ctx.setLineDash([6,4]); ctx.strokeStyle="yellow";
    for(let i=1;i<3;i++){
      ctx.beginPath(); ctx.moveTo(mask.x+(mask.w*i)/3,mask.y); ctx.lineTo(mask.x+(mask.w*i)/3,mask.y+mask.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mask.x,mask.y+(mask.h*i)/3); ctx.lineTo(mask.x+mask.w,mask.y+(mask.h*i)/3); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle="red"; getHandles().forEach(h=>ctx.fillRect(h.x-4,h.y-4,8,8));
  } else {
    ctx.fillStyle="black"; ctx.fillRect(0,0,canvas.width,canvas.height);
    const scale=Math.min(canvas.width/img.width,canvas.height/img.height);
    const iw=img.width*scale, ih=img.height*scale;
    const ix=(canvas.width-iw)/2, iy=(canvas.height-ih)/2;
    ctx.drawImage(img,ix,iy,iw,ih);
  }
}
function resizeIfNeeded(image){
  if(image.width<=MAX_SIZE&&image.height<=MAX_SIZE){warningDiv.textContent=""; return image;}
  const scale=Math.min(MAX_SIZE/image.width,MAX_SIZE/image.height);
  const newW=Math.round(image.width*scale), newH=Math.round(image.height*scale);
  const tmp=document.createElement("canvas"); tmp.width=newW; tmp.height=newH;
  tmp.getContext("2d").drawImage(image,0,0,newW,newH);
  const resized=new Image(); resized.src=tmp.toDataURL("image/png");
  warningDiv.textContent=`⚠️ Image resized to ${newW}×${newH}`;
  return resized;
}
function renderExportCanvas(){
  const out=document.createElement("canvas"); out.width=EXPORT_W; out.height=EXPORT_H;
  const c2=out.getContext("2d");
  if(currentMode==="crop"){
    const sx=mask.x*(img.width/canvas.width);
    const sy=mask.y*(img.height/canvas.height);
    const sw=mask.w*(img.width/canvas.width);
    const sh=mask.h*(img.height/canvas.height);
    c2.drawImage(img,sx,sy,sw,sh,0,0,EXPORT_W,EXPORT_H);
  } else {
    c2.fillStyle="black"; c2.fillRect(0,0,EXPORT_W,EXPORT_H);
    const scale=Math.min(EXPORT_W/img.width,EXPORT_H/img.height);
    const iw=img.width*scale, ih=img.height*scale;
    const ix=(EXPORT_W-iw)/2, iy=(EXPORT_H-ih)/2;
    c2.drawImage(img,ix,iy,iw,ih);
  }
  return out;
}

// --- File input with preview scaling ---
fileInput.addEventListener("change",e=>{
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const raw=new Image();
    raw.onload=()=>{
      const finalImg=resizeIfNeeded(raw);
      finalImg.onload=()=>{
        const maxPreviewW=1280, maxPreviewH=720;
        let pw=finalImg.width, ph=finalImg.height;
        const scale=Math.min(maxPreviewW/pw, maxPreviewH/ph, 1);
        pw=Math.round(pw*scale); ph=Math.round(ph*scale);
        if(currentMode==="fit"){canvas.width=pw; canvas.height=Math.round(pw*9/16);}
        else {canvas.width=pw; canvas.height=ph;}
        img=finalImg; initMask(); drawScene();
        previewBtn.disabled=downloadBtn.disabled=copyLinkBtn.disabled=uploadBtn.disabled=false;
      };
      if(finalImg.complete&&finalImg.naturalWidth>0) finalImg.onload();
    };
    raw.src=ev.target.result;
  };
  reader.readAsDataURL(file);
});

// --- Mode switch
modeSelect.addEventListener("change",()=>{
  currentMode=modeSelect.value;
  if(!img.src) return;
  if(currentMode==="fit"){canvas.width=Math.min(img.width,1280); canvas.height=Math.round(canvas.width*9/16);}
  else {canvas.width=Math.min(img.width,1280); canvas.height=Math.min(img.height,720); initMask();}
  drawScene();
});

// --- Crop interactions
canvas.addEventListener("mousedown",e=>{
  if(currentMode!=="crop") return;
  const {x:mx,y:my}=getMouse(e);
  const h=hitHandle(mx,my);
  if(h){resizing=true; handle=h.name;}
  else if(mx>=mask.x&&mx<=mask.x+mask.w&&my>=mask.y&&my<=mask.y+mask.h){dragging=true; dragStartX=mx-mask.x; dragStartY=my-mask.y;}
});
canvas.addEventListener("mousemove",e=>{
  if(currentMode!=="crop") return;
  const {x:mx,y:my}=getMouse(e);
  const h=hitHandle(mx,my);
  canvas.style.cursor=h?h.cursor:(mx>=mask.x&&mx<=mask.x+mask.w&&my>=mask.y&&my<=mask.y+mask.h?"move":"default");
  if(dragging){mask.x=mx-dragStartX; mask.y=my-dragStartY; clampMask(); drawScene();}
  if(resizing){
    let newW,newH;
    if(handle==="tm"){newH=(mask.y+mask.h)-my; newW=newH*16/9; mask.x+=(mask.w-newW)/2; mask.y=my;}
    else if(handle==="bm"){newH=my-mask.y; newW=newH*16/9; mask.x+=(mask.w-newW)/2;}
    else if(handle==="ml"){newW=(mask.x+mask.w)-mx; newH=newW*9/16; mask.y+=(mask.h-newH)/2; mask.x=mx;}
    else if(handle==="mr"){newW=mx-mask.x; newH=newW*9/16; mask.y+=(mask.h-newH)/2;}
    else {newW=(handle==="tl"||handle==="bl")?(mask.x+mask.w-mx):(mx-mask.x); newH=newW*9/16;
      if(handle==="tl"||handle==="tr") mask.y=mask.y+mask.h-newH;
      if(handle==="tl"||handle==="bl") mask.x=mask.x+mask.w-newW;}
    mask.w=newW; mask.h=newH; clampMask(); drawScene();
  }
});
["mouseup","mouseleave"].forEach(evt=>canvas.addEventListener(evt,()=>{dragging=false;resizing=false;}));

// --- Export buttons
previewBtn.addEventListener("click",()=>{
  const exportCanvas=renderExportCanvas();
  const imgEl=new Image(); imgEl.src=exportCanvas.toDataURL("image/png");
  previewArea.innerHTML="<h3>Export Preview (1280×720)</h3>";
  previewArea.appendChild(imgEl);
});
downloadBtn.addEventListener("click",()=>{
  const cropCanvas=renderExportCanvas(); const dataUrl=cropCanvas.toDataURL("image/png");
  const a=document.createElement("a"); a.download="exported.png"; a.href=dataUrl; a.click();
  saveToLibrary(dataUrl);
});
copyLinkBtn.addEventListener("click",async()=>{
  const cropCanvas=renderExportCanvas(); const dataUrl=cropCanvas.toDataURL("image/png");
  try{await navigator.clipboard.writeText(dataUrl);
    copiedMsg.textContent="✅ Image link copied!"; copiedMsg.style.display="block";
    setTimeout(()=>copiedMsg.style.display="none",2000); saveToLibrary(dataUrl);}
  catch(err){alert("Failed to copy link: "+err);}
});
uploadBtn.addEventListener("click",async()=>{
  const cropCanvas=renderExportCanvas(); const dataUrl=cropCanvas.toDataURL("image/png");
  try{const blob=await new Promise(res=>cropCanvas.toBlob(res,"image/png"));
    await navigator.clipboard.write([new ClipboardItem({"image/png":blob})]);
    copiedMsg.textContent="✅ Image copied to clipboard! Paste into Catbox.";
    copiedMsg.style.display="block";}
  catch(err){const a=document.createElement("a"); a.download="exported.png"; a.href=dataUrl; a.click();}
  saveToLibrary(dataUrl); window.open("https://catbox.moe","_blank");
});

// --- Library
function updateStorageUsage(){
  const libStr=localStorage.getItem("exportLibrary")||"[]";
  const bytes=new Blob([libStr]).size;
  const mb=(bytes/1024/1024).toFixed(2);
  storageUsage.textContent=`📦 Storage used: ${mb} MB / ~5 MB`;
}
function enforceStorageLimit(){
  let lib=JSON.parse(localStorage.getItem("exportLibrary")||"[]");
  while(true){
    const libStr=JSON.stringify(lib);
    const bytes=new Blob([libStr]).size;
    const mb=bytes/1024/1024;
    if(mb<4.5) break;
    lib.pop();
  }
  localStorage.setItem("exportLibrary",JSON.stringify(lib));
  renderLibrary(lib); updateStorageUsage();
}
function saveToLibrary(dataUrl){
  let lib=JSON.parse(localStorage.getItem("exportLibrary")||"[]");
  lib.unshift({id:Date.now(),dataUrl,timestamp:new Date().toLocaleString()});
  localStorage.setItem("exportLibrary",JSON.stringify(lib));
  enforceStorageLimit();
}
function renderLibrary(lib){
  libraryDiv.innerHTML="";
  if(lib.length===0){libraryDiv.innerHTML="<p>No exports saved yet.</p>"; return;}
  lib.forEach(item=>{
    const isCatbox=item.dataUrl.includes("catbox.moe");
    const isExternal=item.dataUrl.startsWith("http")&&!isCatbox;
    const div=document.createElement("div"); div.className="lib-item";
    const warn=isExternal?`<p class="warn">⚠️ External image link may be large.</p>`:"";
    div.innerHTML=`
      <img src="${item.dataUrl}">
      <div class="lib-info">
        <p><strong>${item.timestamp}</strong></p>
        ${warn}
        <div class="lib-actions">
          <button onclick="copyFromLibrary('${item.id}')">Copy Link</button>
          ${isCatbox?"":`<button onclick="downloadFromLibrary('${item.id}')">Download</button>`}
          <button onclick="openFromLibrary('${item.id}')">Open</button>
          <button onclick="replaceLink('${item.id}')">Replace Link</button>
          <button onclick="deleteFromLibrary('${item.id}')">Delete</button>
        </div>
      </div>
    `;
    libraryDiv.appendChild(div);
  });
}
function loadLibrary(){
  const data=JSON.parse(localStorage.getItem("exportLibrary")||"[]");
  renderLibrary(data); updateStorageUsage();
}
function copyFromLibrary(id){
  const lib=JSON.parse(localStorage.getItem("exportLibrary")||"[]");
  const item=lib.find(i=>String(i.id)===String(id));
  if(!item) return;
  navigator.clipboard.writeText(item.dataUrl).then(()=>{
    copiedMsg.textContent="✅ Library image link copied!";
    copiedMsg.style.display="block";
    setTimeout(()=>copiedMsg.style.display="none",2000);
  });
}
function downloadFromLibrary(id){
  const lib=JSON.parse(localStorage.getItem("exportLibrary")||"[]");
  const item=lib.find(i=>String(i.id)===String(id));
  if(!item) return;
  const a=document.createElement("a");
  a.download="exported.png"; a.href=item.dataUrl; a.click();
}
function openFromLibrary(id){
  const lib=JSON.parse(localStorage.getItem("exportLibrary")||"[]");
  const item=lib.find(i=>String(i.id)===String(id));
  if(item) window.open(item.dataUrl,"_blank");
}
function replaceLink(id){
  const newLink=prompt("Enter new Catbox or image URL:"); if(!newLink) return;
  let lib=JSON.parse(localStorage.getItem("exportLibrary")||"[]");
  const item=lib.find(i=>String(i.id)===String(id));
  if(item){item.dataUrl=newLink; item.timestamp=new Date().toLocaleString()+" (Replaced)";}
  localStorage.setItem("exportLibrary",JSON.stringify(lib));
  renderLibrary(lib); updateStorageUsage();
}
function deleteFromLibrary(id){
  let lib=JSON.parse(localStorage.getItem("exportLibrary")||"[]");
  lib=lib.filter(i=>String(i.id)!==String(id));
  localStorage.setItem("exportLibrary",JSON.stringify(lib));
  renderLibrary(lib); updateStorageUsage();
}

clearLibraryBtn.addEventListener("click",()=>{
  if(confirm("Clear all saved exports?")){
    localStorage.removeItem("exportLibrary");
    renderLibrary([]); updateStorageUsage();
  }
});
addCatboxBtn.addEventListener("click",()=>{
  const url=prompt("Enter Catbox (or image) URL:"); if(!url) return;
  if(!/^https?:\/\//i.test(url)){alert("Enter a valid http/https URL"); return;}
  let lib=JSON.parse(localStorage.getItem("exportLibrary")||"[]");
  lib.unshift({id:Date.now(),dataUrl:url,timestamp:new Date().toLocaleString()+" (Imported)"});
  localStorage.setItem("exportLibrary",JSON.stringify(lib));
  renderLibrary(lib); updateStorageUsage();
});
exportLibraryBtn.addEventListener("click",()=>{
  const lib=JSON.parse(localStorage.getItem("exportLibrary")||"[]");
  const base64Count=lib.filter(item=>item.dataUrl.startsWith("data:")).length;
  if(base64Count>0){
    const proceed=confirm(`⚠️ ${base64Count} base64 images in library.\nThis will make file large.\n💡 Replace with Catbox links to shrink it.\nExport anyway?`);
    if(!proceed) return;
  }
  const blob=new Blob([JSON.stringify(lib)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="exportLibrary.json"; a.click();
  URL.revokeObjectURL(url);
});
importLibraryBtn.addEventListener("click",()=>importLibraryInput.click());
importLibraryInput.addEventListener("change",e=>{
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const imported=JSON.parse(ev.target.result);
      if(!Array.isArray(imported)) throw new Error("Invalid file");
      let lib=JSON.parse(localStorage.getItem("exportLibrary")||"[]");
      lib=imported.concat(lib);
      localStorage.setItem("exportLibrary",JSON.stringify(lib));
      enforceStorageLimit();
      alert("✅ Library imported!");
    }catch(err){alert("⚠️ Import failed: "+err.message);}
  };
  reader.readAsText(file);
});

// Load library at startup
loadLibrary();
