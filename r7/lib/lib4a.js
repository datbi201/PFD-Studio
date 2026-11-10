/* ===== TURBINE HƠI NHIỀU ÁP SUẤT & MÁY NÉN NHIỀU CẤP (Rev.4) ===== */
/* Turbine hơi: hình thang hẹp ở phía hơi vào (trái), rộng ở phía xả (phải). Cổng hơi = đầu ống nhô lên/xuống từ thân. */
function _stg(a,hl,hr){return{a,hl,hr,yt:x=>-hl-(x+a)*(hr-hl)/(2*a),yb:x=>hl+(x+a)*(hr-hl)/(2*a)}}
function stTurb(o){
 const a=o.a||34,hl=o.hl||12,hr=o.hr||24,g=_stg(a,hl,hr),ports=[];let pre="",post="",x0=-a,x1=a,y0=-hr,y1=hr;
 (o.stubs||[]).forEach(s=>{
  const top=s.side==="t",y=top?g.yt(s.x):g.yb(s.x),len=s.len||14,ye=top?y-len:y+len;
  if(s.duct){pre+=`<path class="body" d="M${s.x-11} ${top?g.yt(s.x-11)-2:g.yb(s.x-11)+2}V${top?ye:ye}H${s.x+11}V${top?g.yt(s.x+11)-2:g.yb(s.x+11)+2}"/>`+L(`M${s.x-7} ${ye+(top?2:-2)}V${ye+(top?10:-10)}M${s.x} ${ye+(top?2:-2)}V${ye+(top?10:-10)}M${s.x+7} ${ye+(top?2:-2)}V${ye+(top?10:-10)}`,"thin")}
  else pre+=L(`M${s.x} ${y}V${ye}`,"body");
  if(s.arrow){const ym=(y+ye)/2;post+=`<path class="solid" d="M${s.x-3.5} ${ym-3}L${s.x+3.5} ${ym-3}L${s.x} ${ym+3.5}Z"/>`}
  if(s.l)post+=LB(s.x+(s.lx||0),top?ye-3:ye+9,s.l);
  ports.push(PT(s.id,s.x,ye,top?"n":"s",s.l));
  y0=Math.min(y0,Math.min(ye,y)-(s.l&&top?9:0));y1=Math.max(y1,Math.max(ye,y)+(s.l&&!top?10:0));
 });
 let b=pre+`<path class="body" d="M${-a} ${-hl}L${a} ${-hr}V${hr}L${-a} ${hl}Z"/>`;
 if(o.shL){b+=L(`M${-a-o.shL} 0H${-a}`,"body");x0=-a-o.shL;ports.push(PT("shL",x0,0,"w","SHAFT"))}
 if(o.shR){b+=L(`M${a} 0H${a+o.shR}`,"body");x1=a+o.shR;ports.push(PT("shR",x1,0,"e","SHAFT"))}
 if(o.cpl){b+=R(a+4,-5,5,10,"body")+R(a+10,-5,5,10,"body")}
 return{b:b+post,ports,x0,x1,y0,y1,a,hl,hr,g};
}
function stSym(o){const t=stTurb(o);return SC(t.x0,t.x1,t.y0,t.y1,t.b,t.ports)}
reg("steam_turbine","Turbine hơi (HP / MP / LP)","Máy nén / Quạt / Turbine","ST",[
 ["A — Đối áp (HP vào → LP ra)",stSym({stubs:[{side:"t",x:-22,id:"hp",l:"HP",arrow:1},{side:"b",x:22,id:"ex",l:"LP",arrow:1}],shL:12,shR:12})],
 ["B — Ngưng hơi (xả chân không)",stSym({stubs:[{side:"t",x:-22,id:"hp",l:"HP",arrow:1},{side:"b",x:20,id:"ex",l:"EXH",duct:1,len:18}],shL:12,shR:12})],
 ["C — Trích hơi MP (đối áp)",stSym({a:38,stubs:[{side:"t",x:-26,id:"hp",l:"HP",arrow:1},{side:"b",x:-2,id:"mp",l:"MP",arrow:1},{side:"b",x:28,id:"ex",l:"LP",arrow:1}],shL:12,shR:12})],
 ["D — Nhiều áp suất HP / MP / LP",stSym({a:42,hl:12,hr:26,stubs:[{side:"t",x:-30,id:"hp",l:"HP",arrow:1},{side:"t",x:-2,id:"mp",l:"MP",arrow:1},{side:"t",x:24,id:"lp",l:"LP",arrow:1},{side:"b",x:30,id:"ex",l:"EXH",arrow:1}],shL:12,shR:12})],
 ["E — Trích + ngưng (extraction-condensing)",stSym({a:40,stubs:[{side:"t",x:-28,id:"hp",l:"HP",arrow:1},{side:"b",x:-6,id:"mp",l:"MP",arrow:1},{side:"b",x:26,id:"ex",l:"EXH",duct:1,len:18}],shL:12,shR:12})],
 ["F — Turbine + máy phát (STG)",(()=>{
   const t=stTurb({stubs:[{side:"t",x:-22,id:"hp",l:"HP",arrow:1},{side:"b",x:22,id:"ex",l:"EXH",duct:1,len:18}],shL:0,shR:16}),gx=t.x1+16;
   return SC(t.x0,gx+16,t.y0,t.y1,t.b+C(gx,0,16)+LB(gx,4,"G",12)+L(`M${t.x1} 0H${gx-16}`,"body"),[...t.ports,PT("e",gx+16,0,"e","POWER")]);
 })()],
 ["G — HP + LP hai thân, hâm hơi (reheat)",(()=>{
   const h=stTurb({a:22,hl:8,hr:14,stubs:[{side:"t",x:-12,id:"hp",l:"HP",arrow:1},{side:"b",x:12,id:"crh",l:"CRH"}]}),
         l=stTurb({a:36,hl:12,hr:26,stubs:[{side:"t",x:-22,id:"hrh",l:"HRH",arrow:1},{side:"b",x:24,id:"ex",l:"EXH",duct:1,len:18}]}),gap=28,ox=h.x1+gap+36;
   const body=h.b+`<g transform="translate(${ox},0)">${l.b}</g>`+L(`M${h.a} 0H${ox-36}`,"body")+L(`M${-h.a-12} 0H${-h.a}`,"body");
   const ports=[...h.ports,...l.ports.map(p=>PT(p.id,p.x+ox,p.y,p.d,p.l)),PT("shL",-h.a-12,0,"w","SHAFT"),PT("shR",ox+36+12,0,"e","SHAFT")];
   return SC(-h.a-12,ox+48,Math.min(h.y0,l.y0),Math.max(h.y1,l.y1),body+L(`M${ox+36} 0H${ox+48}`,"body"),ports);
 })()],
 ["H — Dẫn động máy nén (khớp nối + trục)",stSym({stubs:[{side:"t",x:-22,id:"hp",l:"HP",arrow:1},{side:"b",x:22,id:"ex",l:"LP",arrow:1}],shL:10,shR:28,cpl:1})]
]);

/* ===== MÁY NÉN NHIỀU CẤP ===== */
function _cs(x0,x1,hs,hd){return`<path class="body" d="M${x0} ${-hs}L${x1} ${-hd}V${hd}L${x0} ${hs}Z"/>`}
const _csYb=(x0,x1,hs,hd,x)=>hs+(x-x0)/(x1-x0)*(hd-hs);
const _cstub=(x,y0,y1)=>L(`M${x} ${y0}V${y1}`,"body");
const _cooler=(x,y,w,h)=>R(x,y,w,h,"body",4)+L(`M${x+8} ${y+h/2}Q${x+w*.3} ${y+3} ${x+w/2} ${y+h/2}T${x+w-8} ${y+h/2}`,"thin");
reg("compressor2","Máy nén nhiều cấp (2–3 cấp)","Máy nén / Quạt / Turbine","K",[
 ["A — 2 cấp ly tâm + làm mát giữa cấp",(()=>{
   const yb1=_csYb(-58,-8,24,16,-14),yb2=_csYb(30,74,18,11,38);
   const b=_cs(-58,-8,24,16)+_cs(30,74,18,11)+L("M-58 0H-8M30 0H74","thin")+L(`M-14 ${yb1}V51H-4`,"body")+L(`M38 ${yb2}V51H30`,"body")+_cooler(-4,40,34,22)+LB(13,74,"IC",7);
   return SC(-58,74,-24,76,b,[PT("w",-58,0,"w","SUCTION"),PT("e",74,0,"e","DISCH"),PT("cw1",6,62,"s","CW"),PT("cw2",20,62,"s","CW")]);
 })()],
 ["B — 2 cấp, cửa liên cấp để hở (IS-out / IS-in)",(()=>{
   const yb1=_csYb(-58,-8,24,16,-14),yb2=_csYb(8,52,18,11,22);
   const b=_cs(-58,-8,24,16)+_cs(8,52,18,11)+L("M-58 0H-8M8 0H52","thin")+_cstub(-14,yb1,36)+_cstub(22,yb2,36)+LB(-14,46,"IS-OUT")+LB(22,46,"IS-IN");
   return SC(-58,52,-24,48,b,[PT("w",-58,0,"w","SUCTION"),PT("e",52,0,"e","DISCH"),PT("isout",-14,36,"s","IS-OUT"),PT("isin",22,36,"s","IS-IN")]);
 })()],
 ["C — Piston 2 cấp (2 xy-lanh, cửa liên cấp)",(()=>{
   const b=R(-56,-18,38,36,"body",2)+L("M-37 -18V18","thin")+R(16,-11,30,22,"body",2)+L("M31 -11V11","thin")+C(-1,0,9)+L("M-18 0H-10M8 0H16M-1 -9V9","thin")+L("M-37 18V38M31 11V38","body")+LB(-37,48,"IS-OUT")+LB(31,48,"IS-IN");
   return SC(-56,46,-18,50,b,[PT("w",-56,0,"w","SUCTION"),PT("e",46,0,"e","DISCH"),PT("isout",-37,38,"s","IS-OUT"),PT("isin",31,38,"s","IS-IN")]);
 })()],
 ["D — Piston 2 cấp + làm mát giữa cấp",(()=>{
   const b=R(-56,-18,38,36,"body",2)+L("M-37 -18V18","thin")+R(16,-11,30,22,"body",2)+L("M31 -11V11","thin")+C(-1,0,9)+L("M-18 0H-10M8 0H16M-1 -9V9","thin")+L("M-37 18V50H-18M31 11V50H14","body")+_cooler(-18,38,32,24)+LB(-2,74,"IC",7);
   return SC(-56,46,-18,78,b,[PT("w",-56,0,"w","SUCTION"),PT("e",46,0,"e","DISCH"),PT("cw1",-8,62,"s","CW"),PT("cw2",4,62,"s","CW")]);
 })()],
 ["E — 3 cấp ly tâm (cửa liên cấp 1 và 2)",(()=>{
   const y1=_csYb(-84,-36,24,17,-42),y2=_csYb(-26,20,19,13,-6),y3=_csYb(-26,20,19,13,16);
   const b=_cs(-84,-36,24,17)+_cs(-26,20,19,13)+_cs(30,72,15,10)+L("M-84 0H-36M-26 0H20M30 0H72","thin")+_cstub(-42,y1,34)+_cstub(-6,-y2,-32)+_cstub(14,y3,34)+_cstub(40,-_csYb(30,72,15,10,40),-30)+LB(-42,44,"IS1-OUT")+LB(-6,-35,"IS1-IN")+LB(14,44,"IS2-OUT")+LB(40,-33,"IS2-IN");
   return SC(-84,72,-40,46,b,[PT("w",-84,0,"w","SUCTION"),PT("e",72,0,"e","DISCH"),PT("is1o",-42,34,"s","IS1-OUT"),PT("is1i",-6,-32,"n","IS1-IN"),PT("is2o",14,34,"s","IS2-OUT"),PT("is2i",40,-30,"n","IS2-IN")]);
 })()],
 ["F — 1 vỏ, 2 phần (back-to-back)",(()=>{
   const b=R(-52,-22,104,44,"body",12)+L("M0 -22V22","thin")+`<path class="body" d="M-44 -16L-8 -10V10L-44 16Z"/><path class="body" d="M8 -10L44 -16V16L8 10Z" transform="scale(1,1)"/>`+L("M-44 0H-8M8 0H44","thin")+L("M-26 22V38M26 -22V-38","body")+LB(-26,48,"IS-OUT")+LB(26,-41,"IS-IN");
   return SC(-52,52,-40,50,b,[PT("w",-52,0,"w","SUCTION"),PT("e",52,0,"e","DISCH"),PT("isout",-26,38,"s","IS-OUT"),PT("isin",26,-38,"n","IS-IN")]);
 })()],
 ["G — 2 cấp ly tâm + động cơ điện",(()=>{
   const y1=_csYb(-46,-6,22,15,-12);
   const b=R(-100,-15,42,30,"body",3)+LB(-79,5,"M",13)+L("M-58 0H-46","body")+_cs(-46,-6,22,15)+_cs(6,46,17,10)+L("M-46 0H-6M6 0H46","thin")+_cstub(-34,-_csYb(-46,-6,22,15,-34),-34)+_cstub(-12,y1,34)+_cstub(16,-_csYb(6,46,17,10,16),-34)+LB(-34,-37,"IN")+LB(-12,44,"IS-OUT")+LB(16,-37,"IS-IN");
   return SC(-100,46,-36,46,b,[PT("n",-34,-34,"n","SUCTION"),PT("e",46,0,"e","DISCH"),PT("isout",-12,34,"s","IS-OUT"),PT("isin",16,-34,"n","IS-IN")]);
 })()]
]);
