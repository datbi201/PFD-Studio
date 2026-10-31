/* ===== THƯ VIỆN KÝ HIỆU Rev.3 — lõi ===== */
const S=(w,h,body,ports)=>({w,h,body,ports:ports||[{id:"w",x:-w/2,y:0,d:"w"},{id:"e",x:w/2,y:0,d:"e"},{id:"n",x:0,y:-h/2,d:"n"},{id:"s",x:0,y:h/2,d:"s"}]});
const SYMBOLS={};
const CAT_ORDER=["Bình / Tháp","Trao đổi nhiệt","Bơm","Máy nén / Quạt / Turbine","Van","Phụ kiện đường ống","Đo lường tại ống (inline)","Đo & điều khiển (C&I)","Điện / Tủ điều khiển","Giếng / Package / Xuất nhập","Hạ tầng chuỗi cung ứng khí","Vận tải (xe / tàu / tàu hỏa)","Dòng vào / ra & nối","Chú thích"];
function reg(key,label,cat,prefix,vars,opt){
 SYMBOLS[key]=Object.assign({label,cat,prefix,vars:vars.map(v=>({n:v[0],def:v[1]}))},opt||{});
 SYMBOLS[key].def=SYMBOLS[key].vars[0].def;
}
function varOf(n){const s=SYMBOLS[n.type];return s.vars[Math.min(Math.max(+n.v||0,0),s.vars.length-1)]}
function xpPort(def,p){
 const w=def.w,h=def.h,f=Math.min(1,Math.max(0,+p.f)),o=+p.o||0,s=p.s;
 if(s==="n")return{id:p.id,x:r2((f-.5)*w),y:r2(-h/2-o),d:"n",l:p.l,u:1};
 if(s==="s")return{id:p.id,x:r2((f-.5)*w),y:r2(h/2+o),d:"s",l:p.l,u:1};
 if(s==="w")return{id:p.id,x:r2(-w/2-o),y:r2((f-.5)*h),d:"w",l:p.l,u:1};
 return{id:p.id,x:r2(w/2+o),y:r2((f-.5)*h),d:"e",l:p.l,u:1};
}
const r2=v=>Math.round(v*100)/100;
function symDef(n){
 if(n.type==="text")return textDef(n);
 if(n.type==="area")return{w:n.w||420,h:n.h||260,ports:[],body:""};
 let def=varOf(n).def;
 if(n.hp&&n.hp.length)def=Object.assign({},def,{ports:def.ports.filter(p=>!n.hp.includes(p.id))});
 if(!n.xp||!n.xp.length)return def;
 return Object.assign({},def,{ports:def.ports.concat(n.xp.map(p=>xpPort(def,p)))});
}
function sym(b,k){
 k=k||1;const bw=RS.body/k,tw=RS.thin/k,I=SCH.ink;
 return b.replace(/class="body"/g,`fill="${SCH.fill}" stroke="${I}" stroke-width="${bw}" stroke-linejoin="round"`)
  .replace(/class="thin"/g,`fill="none" stroke="${I}" stroke-width="${tw}"`)
  .replace(/class="dash"/g,`fill="none" stroke="${I}" stroke-width="${tw}" stroke-dasharray="4 3"`)
  .replace(/class="grey"/g,`fill="${SCH.grey}" stroke="${I}" stroke-width="${bw}" stroke-linejoin="round"`)
  .replace(/class="wat"/g,`fill="${SCH.wat}" stroke="${I}" stroke-width="${tw}" stroke-linejoin="round"`)
  .replace(/class="solid"/g,`fill="${I}" stroke="${I}" stroke-width="${tw}" stroke-linejoin="round"`)
  .split(INK).join(I);
}
/* cổng đặc biệt */
const PW=(w,h)=>[{id:"w",x:-w/2,y:0,d:"w"},{id:"e",x:w/2,y:0,d:"e"}];
const P4=(w,h,yv)=>[{id:"w",x:-w/2,y:0,d:"w"},{id:"e",x:w/2,y:0,d:"e"},{id:"n",x:0,y:-h/2,d:"n"},{id:"s",x:0,y:yv===undefined?h/2:yv,d:"s"}];
const R=(x,y,w,h,c,rx)=>`<rect class="${c||"body"}" x="${x}" y="${y}" width="${w}" height="${h}"${rx?` rx="${rx}"`:""}/>`;
const C=(x,y,r,c)=>`<circle class="${c||"body"}" cx="${x}" cy="${y}" r="${r}"/>`;
const L=(d,c)=>`<path class="${c||"thin"}" d="${d}"/>`;
const T=(x,y,t,fs)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial" font-size="${fs||9}" font-weight="700" fill="${INK}">${t}</text>`;
/* SC: vẽ theo toạ độ tự nhiên rồi tự căn giữa về gốc (0,0) */
const SC=(x0,x1,y0,y1,body,ports)=>{const cx=(x0+x1)/2,cy=(y0+y1)/2;return S(r2(x1-x0),r2(y1-y0),`<g transform="translate(${r2(-cx)},${r2(-cy)})">${body}</g>`,ports?ports.map(p=>Object.assign({},p,{x:r2(p.x-cx),y:r2(p.y-cy)})):undefined)};
const PT=(id,x,y,d,l)=>({id,x,y,d,l});
const LB=(x,y,t,fs,a)=>`<text x="${x}" y="${y}" text-anchor="${a||"middle"}" font-family="Arial" font-size="${fs||7.5}" font-weight="700" fill="${INK}">${t}</text>`;
const BOWY=(a,hh,dy)=>`M${-a} ${-hh+dy} L${a} ${hh+dy} V${-hh+dy} L${-a} ${hh+dy} Z`;
const BOW=(a,hh)=>{a=a||18;hh=hh||10;return`M${-a} ${-hh} L${a} ${hh} V${-hh} L${-a} ${hh} Z`};

/* ===== BÌNH / THÁP ===== */
const HS=(x0,x1,y0,y1)=>`<rect class="body" x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" rx="${(y1-y0)/2}"/>`;
reg("h_sep","Bình tách ngang","Bình / Tháp","V",[
 ["A — Cơ bản",S(124,48,HS(-62,62,-24,24)+L("M-62 6H62")+L("M-30 -24V6"))],
 ["B — Có demister",S(124,48,HS(-62,62,-24,24)+L("M-62 6H62")+L("M30 -24V6","dash")+L("M36 -24V6","dash"))],
 ["C — Đầu dĩa + chân đỡ",S(124,60,`<path class="body" d="M-50 -24H50Q62 -24 62 0Q62 24 50 24H-50Q-62 24 -62 0Q-62 -24 -50 -24Z"/>`+L("M-40 24V32M40 24V32M-48 32H-32M32 32H48"),P4(124,60,32))],
 ["D — Có thùng nước (boot)",S(124,70,HS(-62,62,-24,24)+L("M-62 6H62")+R(24,24,24,22,"body",3),[{id:"w",x:-62,y:0,d:"w"},{id:"e",x:62,y:0,d:"e"},{id:"n",x:0,y:-24,d:"n"},{id:"s",x:36,y:46,d:"s"}])]
]);
reg("v_sep","Bình tách đứng","Bình / Tháp","V",[
 ["A — Cơ bản",S(50,112,R(-25,-56,50,112,"body",25)+L("M-25 24H25"))],
 ["B — Có demister",S(50,112,R(-25,-56,50,112,"body",25)+L("M-25 -22H25","dash")+L("M-25 -16H25","dash"))],
 ["C — Cyclone (vào tiếp tuyến)",S(56,120,R(-25,-56,50,112,"body",25)+L("M-25 -30H-36M-36 -30l5 -4M-36 -30l5 4")+L("M-25 24H25"),[{id:"w",x:-25,y:-30,d:"w"},{id:"e",x:25,y:10,d:"e"},{id:"n",x:0,y:-56,d:"n"},{id:"s",x:0,y:56,d:"s"}])],
 ["D — Đầu dĩa + chân",S(54,130,`<path class="body" d="M-24 -50Q-24 -62 0 -62Q24 -62 24 -50V50Q24 62 0 62Q-24 62 -24 50Z"/>`+L("M-24 30H24")+L("M-18 62V70M18 62V70M-24 70H-12M12 70H24"),P4(54,130,70))]
]);
reg("sep3","Tách 3 pha","Bình / Tháp","V",[
 ["A — Boot nước",S(132,72,`<g transform="translate(0,-9)">`+HS(-66,66,-27,27)+L("M-66 8H66M18 -27V8")+R(34,20,28,24,"body",4)+`</g>`,[{id:"w",x:-66,y:-9,d:"w"},{id:"e",x:66,y:-9,d:"e"},{id:"n",x:0,y:-36,d:"n"},{id:"s",x:48,y:35,d:"s"}])],
 ["B — Tấm chắn (weir)",S(132,60,HS(-66,66,-27,27)+L("M-66 6H66M20 -27V6","thin")+L("M20 6V20","thin")+L("M-66 -4H-10","dash"),[{id:"w",x:-66,y:0,d:"w"},{id:"e",x:66,y:0,d:"e"},{id:"n",x:0,y:-27,d:"n"},{id:"s",x:43,y:27,d:"s"}])],
 ["C — Đầu dĩa + chân",S(132,72,`<path class="body" d="M-52 -27H52Q66 -27 66 0Q66 27 52 27H-52Q-66 27 -66 0Q-66 -27 -52 -27Z"/>`+L("M-66 6H66M18 -27V6M-44 27V35M44 27V35M-52 35H-36M36 35H52"),[{id:"w",x:-66,y:0,d:"w"},{id:"e",x:66,y:0,d:"e"},{id:"n",x:0,y:-27,d:"n"},{id:"s",x:0,y:35,d:"s"}])]
]);
reg("scrubber","Scrubber / KO drum","Bình / Tháp","V",[
 ["A — Đứng có lưới",S(44,100,R(-22,-50,44,100,"body",20)+L("M-22 -28H22")+L("M-22 -22H22","dash"))],
 ["B — Có đáy chứa lỏng",S(44,110,R(-22,-50,44,100,"body",20)+L("M-22 -22H22","dash")+R(-8,50,16,12,"body",2),P4(44,110,62))],
 ["C — Nằm ngang",S(100,42,HS(-50,50,-21,21)+L("M10 -21V21","dash")+L("M16 -21V21","dash"))]
]);
reg("fsep","Lọc tách / Coalescer","Bình / Tháp","F",[
 ["A — Filter separator",S(120,46,HS(-60,60,-23,23)+L("M-5 -23V23")+L("M5 -23V23")+L("M-5 0H5","dash"))],
 ["B — Coalescer đứng",S(44,96,R(-22,-48,44,96,"body",16)+L("M-10 -28V30M10 -28V30M-10 30H10","thin"))]
]);
reg("desalter","Desalter / Tách tĩnh điện","Bình / Tháp","V",[
 ["A — Điện cực",S(130,50,HS(-65,65,-25,25)+L("M-30 -10H30M-30 0H30M-30 10H30","dash")+L("M-30 -25V-34M30 -25V-34M-36 -34H-24M24 -34H36")+L("M-65 14H65"))]
]);
reg("hydrocyclone","Hydrocyclone","Bình / Tháp","HC",[
 ["A — Hình nón",S(40,100,`<path class="body" d="M-18 -50H18V-8L5 50H-5L-18 -8Z"/>`+L("M-18 -30H-30M-30 -30l5 -4M-30 -30l5 4"),[{id:"w",x:-18,y:-30,d:"w"},{id:"e",x:18,y:-30,d:"e"},{id:"n",x:0,y:-50,d:"n"},{id:"s",x:0,y:50,d:"s"}])],
 ["B — Cụm 3 cyclone",S(90,100,[-30,0,30].map(x=>`<path class="body" d="M${x-10} -40H${x+10}V-8L${x+3} 40H${x-3}L${x-10} -8Z"/>`).join("")+R(-45,-50,90,14,"body",2))]
]);
reg("column","Tháp chưng cất / hấp thụ","Bình / Tháp","T",[
 ["A — Đĩa (tray)",S(58,154,R(-29,-77,58,154,"body",12)+L("M-29 -45H29M-29 -15H29M-29 15H29M-29 45H29"))],
 ["B — Đệm (packed)",S(58,154,R(-29,-77,58,154,"body",12)+`<g clip-path="none">`+L("M-29 -40L29 -10M-29 -10L29 -40M-29 -10L29 20M-29 20L29 -10M-29 20L29 50M-29 50L29 20","thin")+`</g>`)],
 ["C — Đĩa + phần đệm",S(58,154,R(-29,-77,58,154,"body",12)+L("M-29 -50H29M-29 -30H29")+L("M-29 0L29 28M-29 28L29 0M-29 28L29 56M-29 56L29 28"))],
 ["D — Mảnh (stripper)",S(40,150,R(-20,-75,40,150,"body",10)+L("M-20 -45H20M-20 -15H20M-20 15H20M-20 45H20"))]
]);
reg("reactor","Reactor / Lò phản ứng","Bình / Tháp","R",[
 ["A — Cơ bản",S(62,104,R(-31,-52,62,104,"body",28)+L("M-31 -10Q0 -28 31 -10M-31 18Q0 0 31 18"))],
 ["B — Có cánh khuấy (CSTR)",S(66,110,R(-31,-48,62,96,"body",14)+L("M0 -64V28")+L("M-14 28H14M-10 20H10","solid")+C(0,-64,5,"body"),[{id:"w",x:-31,y:0,d:"w"},{id:"e",x:31,y:0,d:"e"},{id:"n",x:0,y:-69,d:"n"},{id:"s",x:0,y:48,d:"s"}])],
 ["C — Tầng xúc tác cố định",S(62,110,R(-31,-52,62,104,"body",22)+L("M-31 -20H31M-31 14H31")+L("M-31 -20L31 14M-31 14L31 -20","thin"))],
 ["D — Có áo gia nhiệt",S(74,110,R(-31,-52,62,104,"body",22)+L("M-37 -30V30Q-37 40 -31 44M37 -30V30Q37 40 31 44","thin"))]
]);
reg("tank","Bồn chứa thường áp","Bình / Tháp","TK",[
 ["A — Mái côn",S(96,62,R(-48,-24,96,48,"body")+L("M-48 -24Q0 -46 48 -24M-48 10H48"))],
 ["B — Mái nổi",S(96,62,R(-48,-24,96,48,"body")+L("M-48 -14H48M-48 -10H48"))],
 ["C — Mái vòm",S(96,66,R(-48,-20,96,44,"body")+`<path class="body" d="M-48 -20Q0 -50 48 -20Z"/>`)],
 ["D — Bồn nằm (bullet)",S(110,46,HS(-55,55,-18,18)+L("M-30 18V28M30 18V28M-40 28H-20M20 28H40"),P4(110,46,28))]
]);
reg("sphere","Bồn cầu (LPG)","Bình / Tháp","TK",[
 ["A — Chân đỡ",S(76,92,C(0,-4,34)+L("M-34 8H34M-20 26L-24 40M20 26L24 40M-30 40H-18M18 40H30"),P4(76,92,40))],
 ["B — Đơn giản",S(70,70,C(0,0,34)+L("M-34 0H34","dash"))]
]);
reg("flare","Đuốc đốt khí (Flare)","Bình / Tháp","FL",[
 ["A — Ống đuốc",S(30,118,R(-5,-31,10,90,"body")+`<path class="body" d="M0 -59Q-14 -45 -6 -33H6Q14 -45 0 -59Z"/>`,[{id:"w",x:-5,y:30,d:"w"},{id:"s",x:0,y:59,d:"s"}])],
 ["B — Ground flare",S(70,70,R(-34,-30,68,60,"body")+`<path class="body" d="M0 -12Q-10 0 -4 8H4Q10 0 0 -12Z"/>`,[{id:"w",x:-34,y:0,d:"w"},{id:"s",x:0,y:30,d:"s"}])],
 ["C — Knock-out + đuốc",S(60,130,R(-18,10,36,50,"body",14)+R(-4,-60,8,70,"body")+`<path class="body" d="M0 -72Q-10 -62 -5 -58H5Q10 -62 0 -72Z"/>`,[{id:"w",x:-18,y:35,d:"w"},{id:"s",x:0,y:60,d:"s"}])]
]);
reg("slug_catcher","Slug catcher","Bình / Tháp","SC",[
 ["A — Kiểu ngón",S(100,84,R(-50,-42,100,36,"body",18)+L("M-30 -6V38M0 -6V38M30 -6V38M-30 38H30"),[{id:"w",x:-50,y:-24,d:"w"},{id:"e",x:50,y:-24,d:"e"},{id:"n",x:0,y:-42,d:"n"},{id:"s",x:0,y:38,d:"s"}])],
 ["B — Bình lớn",S(130,52,HS(-65,65,-26,26)+L("M-40 26V38M40 26V38"),P4(130,52,38))]
]);
reg("cpi","Tách dầu API / CPI","Bình / Tháp","S",[
 ["A — Hộp tấm nghiêng",S(100,50,R(-50,-25,100,50,"body")+L("M-30 -25L-20 25M-10 -25L0 25M10 -25L20 25M30 -25L40 25"))]
]);
reg("sump","Hố gom / Sump","Bình / Tháp","SP",[
 ["A — Hố hở",S(60,50,`<path class="body" d="M-30 -20H30L22 22H-22Z"/>`+L("M-26 -4H26","dash"),[{id:"w",x:-30,y:-20,d:"w"},{id:"e",x:30,y:-20,d:"e"},{id:"n",x:0,y:-20,d:"n"},{id:"s",x:0,y:22,d:"s"}])],
 ["B — Bể chìm",S(70,50,R(-35,-25,70,50,"body")+L("M-35 -8H35","dash"))]
]);

/* ===== TRAO ĐỔI NHIỆT ===== */
reg("exchanger","Trao đổi nhiệt vỏ-ống","Trao đổi nhiệt","E",[
 ["A — Ký hiệu chữ thập",S(76,38,R(-38,-19,76,38,"body",6)+C(0,0,13,"thin")+L("M-13 0H13M0 -13V13"))],
 ["B — Ống chữ U",S(76,38,R(-38,-19,76,38,"body",6)+L("M-24 -8H20Q30 -8 30 0Q30 8 20 8H-24"))],
 ["C — Có vách ngăn (TEMA)",S(80,38,R(-40,-19,80,38,"body",6)+L("M-14 -19V8M14 -8V19M-40 0H-26M26 0H40","thin"))],
 ["D — Vỏ-ống đứng",S(40,80,R(-20,-40,40,80,"body",6)+L("M-8 -40V40M8 -40V40"))]
]);
reg("plate_hx","Trao đổi nhiệt tấm","Trao đổi nhiệt","E",[
 ["A — Tấm",S(60,48,R(-30,-24,60,48,"body")+L("M-20 -24V24M-10 -24V24M0 -24V24M10 -24V24M20 -24V24"))],
 ["B — Khung + tấm",S(70,48,R(-35,-24,6,48,"grey")+R(29,-24,6,48,"grey")+R(-29,-20,58,40,"body")+L("M-14 -20V20M-4 -20V20M6 -20V20M16 -20V20"))]
]);
reg("double_pipe","Ống lồng ống","Trao đổi nhiệt","E",[
 ["A — Hairpin",S(80,36,R(-40,-12,80,24,"body")+L("M-40 0H40"))]
]);
reg("reboiler","Reboiler / Kettle","Trao đổi nhiệt","E",[
 ["A — Kettle",S(80,40,R(-40,-20,80,40,"body",20)+L("M-26 0H-16L-9 -9L0 9L9 -9L16 0H26"))],
 ["B — Thermosyphon",S(44,70,R(-22,-35,44,70,"body",8)+L("M-10 -35V35M10 -35V35"))]
]);
reg("condenser","Condenser / Cooler","Trao đổi nhiệt","E",[
 ["A — Chữ nhật",S(76,38,R(-38,-19,76,38,"body",6)+L("M-24 -8L24 8M-24 8L24 -8","thin"))],
 ["B — Nước làm mát",S(76,38,R(-38,-19,76,38,"body",6)+L("M-24 6Q-12 -6 0 6Q12 -6 24 6"))]
]);
reg("chiller","Chiller","Trao đổi nhiệt","E",[
 ["A — Chiller",S(76,38,R(-38,-19,76,38,"body",19)+T(0,3,"CH",11))]
]);
reg("aircooler","Air cooler / Fin-fan","Trao đổi nhiệt","E",[
 ["A — Cấp gió (forced)",S(96,46,`<g transform="translate(0,-9)">`+R(-48,-14,96,28,"body")+C(-24,22,9,"thin")+C(24,22,9,"thin")+L("M-48 14H-33M48 14H33")+`</g>`,[{id:"w",x:-48,y:-9,d:"w"},{id:"e",x:48,y:-9,d:"e"},{id:"n",x:0,y:-23,d:"n"},{id:"s",x:0,y:22,d:"s"}])],
 ["B — Hút gió (induced)",S(96,46,`<g transform="translate(0,9)">`+R(-48,-14,96,28,"body")+C(-24,-22,9,"thin")+C(24,-22,9,"thin")+L("M-48 -14H-33M48 -14H33")+`</g>`,[{id:"w",x:-48,y:9,d:"w"},{id:"e",x:48,y:9,d:"e"},{id:"n",x:0,y:-31,d:"n"},{id:"s",x:0,y:23,d:"s"}])],
 ["C — Một quạt",S(64,46,`<g transform="translate(0,-9)">`+R(-32,-14,64,28,"body")+C(0,22,9,"thin")+`</g>`,[{id:"w",x:-32,y:-9,d:"w"},{id:"e",x:32,y:-9,d:"e"},{id:"n",x:0,y:-23,d:"n"},{id:"s",x:0,y:31,d:"s"}])]
]);
reg("heater","Lò gia nhiệt","Trao đổi nhiệt","H",[
 ["A — Hộp lửa",S(72,76,R(-36,-38,72,76,"body")+L("M-18 26Q-8 6 0 22Q8 4 18 26Q10 34 -18 26")+L("M-24 -18H24M-24 -6H24"))],
 ["B — Cabin + ống khói",S(72,100,R(-36,-18,72,56,"body")+R(-8,-50,16,32,"body")+L("M-24 -4H24M-24 8H24")+L("M-16 30Q-6 14 0 26Q6 12 16 30"),[{id:"w",x:-36,y:10,d:"w"},{id:"e",x:36,y:10,d:"e"},{id:"n",x:0,y:-50,d:"n"},{id:"s",x:0,y:38,d:"s"}])],
 ["C — Lò điện",S(60,50,R(-30,-25,60,50,"body")+L("M-20 0H-14L-8 -10L0 10L8 -10L14 0H20"))],
 ["D — Lò dầu nóng",S(70,70,R(-35,-35,70,70,"body")+C(0,0,18,"thin")+L("M-12 -4Q-6 -12 0 -4Q6 4 12 -4M-12 6Q-6 -2 0 6Q6 14 12 6"))]
]);
reg("wasteheat","Nồi hơi / Waste heat","Trao đổi nhiệt","B",[
 ["A — Boiler",S(80,70,R(-40,-35,80,70,"body")+C(0,0,20,"thin")+T(0,4,"B",12))],
 ["B — HRSG",S(90,60,R(-45,-30,90,60,"body")+L("M-30 -30V30M-10 -30V30M10 -30V30M30 -30V30","dash"))]
]);
reg("cooling_tower","Tháp giải nhiệt","Trao đổi nhiệt","CT",[
 ["A — Cooling tower",S(80,80,`<path class="body" d="M-40 -30H40L34 30H-34Z"/>`+L("M-34 -10H34M-36 10H36","dash")+C(0,-40,7,"thin"),[{id:"w",x:-37,y:0,d:"w"},{id:"e",x:37,y:0,d:"e"},{id:"n",x:0,y:-47,d:"n"},{id:"s",x:0,y:30,d:"s"}])]
]);
