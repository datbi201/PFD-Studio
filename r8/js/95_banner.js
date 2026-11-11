/* Rev.8: bản vẽ chứa loại ký hiệu không có trong thư viện → băng đỏ nêu rõ, không mất thiết bị lặng lẽ */
window.addEventListener("load",function(){
 function showBanner(msg){var d=document.getElementById("pfdLibWarn");if(!d){d=document.createElement("div");d.id="pfdLibWarn";d.setAttribute("role","alert");
  d.style.cssText="position:fixed;top:0;left:0;right:0;z-index:99999;background:#b91c1c;color:#fff;padding:10px 40px 10px 14px;font:600 14px Arial,sans-serif;text-align:center";
  var x=document.createElement("button");x.textContent="✕";x.setAttribute("aria-label","Đóng cảnh báo");x.style.cssText="position:absolute;right:8px;top:6px;background:transparent;border:0;color:#fff;font-size:18px;cursor:pointer";x.onclick=function(){d.remove()};d.appendChild(x);
  var t=document.createElement("span");t.id="pfdLibWarnTxt";d.insertBefore(t,x);document.body.appendChild(d)}
  document.getElementById("pfdLibWarnTxt").textContent=msg}
 setInterval(function(){try{
  var miss=window.__PFD_MISSING__||[];
  if(miss.length){window.__PFD_MISSING__=[];
   var cnt={},uniq=[];miss.forEach(function(t){if(!cnt[t]){cnt[t]=0;uniq.push(t)}cnt[t]++});
   var detail=uniq.map(function(t){return t+" ("+cnt[t]+")"}).join(", ");
   showBanner(_("⚠ BẢN VẼ CHỨA "+miss.length+" THIẾT BỊ thuộc "+uniq.length+" loại ký hiệu KHÔNG có trong thư viện của bản này nên không hiển thị được: "+detail+". Các thiết bị còn lại vẫn mở bình thường; đừng lưu đè nếu cần giữ nguyên bản vẽ gốc.","⚠ THE DRAWING CONTAINS "+miss.length+" DEVICES of "+uniq.length+" symbol types that are NOT in this version's library and cannot be shown: "+detail+". The other devices open normally; do not overwrite the file if you need to keep the original."));
  }
 }catch(e){}},1200);
});
