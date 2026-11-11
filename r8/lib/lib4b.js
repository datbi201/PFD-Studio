/* ===== HẠ TẦNG CHUỖI CUNG ỨNG KHÍ (Rev.4) ===== */
const CAT_INF="Hạ tầng chuỗi cung ứng khí";
/* sóng nước, đáy biển, nhà */
const WV=(x0,x1,y,cls)=>{let n=Math.max(1,Math.round((x1-x0)/10));return`<path class="thin" d="M${x0} ${y}q5 -4 10 0${" t10 0".repeat(n-1)}"/>`};
const SEABED=(x0,x1,y)=>L(`M${x0} ${y}H${x1}`,"body")+L(Array.from({length:Math.floor((x1-x0)/10)},(_,i)=>`M${x0+4+i*10} ${y}l-4 6`).join(""),"thin");
const HOUSE=(x,y,w,h,door)=>`<path class="body" d="M${x} ${y}V${y-h}L${x+w/2} ${y-h-w*.38}L${x+w} ${y-h}V${y}Z"/>`+(door===false?"":R(x+w/2-3,y-9,6,9,"thin"));
const FLAME=(x,y,s)=>`<path class="solid" d="M${x} ${y}Q${x-4*s} ${y-5*s} ${x-1*s} ${y-12*s}Q${x} ${y-8*s} ${x+2*s} ${y-9*s}Q${x+5*s} ${y-4*s} ${x} ${y}Z"/>`;
const STACK=(x,y0,y1,w)=>R(x-(w||5)/2,y0,w||5,y1-y0,"body");
const BRK=(x,y,s)=>`<path class="body" d="M${x-8*s} ${y-6*s}L${x+8*s} ${y+6*s}V${y-6*s}L${x-8*s} ${y+6*s}Z"/>`;

/* --- Giàn khoan / khai thác --- */
const _jacket=(xl,xr,yt,yb)=>`<path class="body" d="M${xl} ${yt}L${xl-8} ${yb}H${xr+8}L${xr} ${yt}Z"/>`+L(`M${xl-3} ${yt+(yb-yt)*.32}H${xr+3}M${xl-6} ${yt+(yb-yt)*.66}H${xr+6}M${xl} ${yt}L${xr+3} ${yt+(yb-yt)*.32}M${xr} ${yt}L${xl-3} ${yt+(yb-yt)*.32}M${xl-3} ${yt+(yb-yt)*.32}L${xr+6} ${yt+(yb-yt)*.66}M${xr+3} ${yt+(yb-yt)*.32}L${xl-6} ${yt+(yb-yt)*.66}`,"thin");
reg("platform","Giàn khai thác / FPSO","Hạ tầng chuỗi cung ứng khí","PF",[
 ["A — Giàn cố định (jacket)",SC(-46,46,-48,40,_jacket(-24,24,-14,40)+WV(-46,46,0,"wat")+SEABED(-46,46,40)+R(-32,-26,64,12,"body")+R(-24,-38,14,12,"body")+R(-6,-34,20,8,"body")+L("M26 -26L40 -44M-30 -26V-46M-30 -46L-12 -40")+FLAME(40,-44,.8),[PT("w",-32,-20,"w"),PT("e",32,-20,"e"),PT("n",-17,-38,"n"),PT("s",0,40,"s","RISER")])],
 ["B — Giàn tự nâng (jack-up)",SC(-44,44,-54,36,R(-34,-22,68,12,"body")+L("M-24 -10V36M0 -10V36M24 -10V36","body")+`<path class="body" d="M-32 36H-16L-24 28ZM-8 36H8L0 28ZM16 36H32L24 28Z"/>`+`<path class="thin" d="M12 -22L18 -50L24 -22Z"/>`+R(-34,-28,18,6,"body")+WV(-44,44,6,"wat")+L("M-44 36H44","body"),[PT("w",-34,-16,"w"),PT("e",34,-16,"e"),PT("n",18,-50,"n"),PT("s",0,36,"s")])],
 ["C — Giàn bán chìm (semi-submersible)",SC(-46,46,-54,24,R(-36,-32,72,12,"body")+R(-28,-20,10,30,"body")+R(18,-20,10,30,"body")+R(-42,10,40,12,"body",6)+R(2,10,40,12,"body",6)+`<path class="thin" d="M-6 -32L0 -54L6 -32Z"/>`+WV(-46,46,0,"wat"),[PT("w",-36,-26,"w"),PT("e",36,-26,"e"),PT("n",0,-54,"n"),PT("s",0,22,"s")])],
 ["D — FPSO (tàu chứa nổi)",SC(-58,58,-54,42,`<path class="body" d="M-56 -2V10Q-56 18 -48 18H38L56 -4Z"/>`+R(-44,-18,22,16,"body")+R(-16,-26,16,24,"body")+L("M-50 -2V-40")+FLAME(-50,-40,.9)+R(26,-12,10,16,"body")+L("M31 18V42M31 18L20 38M31 18L42 38","body")+WV(-58,58,8,"wat"),[PT("w",-56,4,"w"),PT("e",56,-4,"e"),PT("n",-8,-26,"n"),PT("s",31,42,"s","RISER")])],
 ["E — Giàn đầu giếng không người (WHP)",SC(-30,30,-46,38,L("M-10 -14L-20 38M10 -14L20 38M0 -14V38","body")+R(-18,-24,36,10,"body")+R(-7,-36,14,12,"body")+L("M-18 -24V-44")+WV(-30,30,6,"wat")+L("M-30 38H30","body"),[PT("w",-18,-19,"w"),PT("e",18,-19,"e"),PT("n",0,-36,"n"),PT("s",0,38,"s")])],
 ["F — Giàn xử lý trung tâm (CPP)",SC(-52,62,-60,42,_jacket(-34,34,-12,42)+WV(-52,62,2,"wat")+SEABED(-52,62,42)+R(-46,-22,92,10,"body")+R(-40,-38,24,16,"body")+R(-12,-34,16,12,"body")+R(8,-44,34,22,"body")+L("M44 -44L58 -62")+FLAME(58,-62,.8)+L("M46 -17H58"),[PT("w",-46,-17,"w"),PT("e",58,-17,"e"),PT("n",-28,-38,"n"),PT("s",0,42,"s")])]
]);
reg("subsea","Thiết bị dưới biển (Subsea)","Hạ tầng chuỗi cung ứng khí","SS",[
 ["A — Cây thông dưới biển (subsea tree)",SC(-30,30,-30,36,SEABED(-30,30,26)+R(-20,-26,40,52,"dash")+R(-14,18,28,8,"body")+R(-6,-8,12,26,"body",2)+C(0,2,4)+R(-8,-18,16,10,"body",2)+L("M6 4H26"),[PT("w",-30,10,"w"),PT("e",26,4,"e","FLOWLINE"),PT("n",0,-26,"n","UMB"),PT("s",0,36,"s","WELL")])],
 ["B — Manifold dưới biển",SC(-48,48,-24,34,SEABED(-48,48,24)+R(-42,-16,84,34,"dash")+L("M-36 -4H36","body")+L("M-26 -4V18M-9 -4V18M9 -4V18M26 -4V18")+C(-26,6,3,"solid")+C(-9,6,3,"solid")+C(9,6,3,"solid")+C(26,6,3,"solid"),[PT("w",-42,-4,"w"),PT("e",42,-4,"e"),PT("s1",-26,24,"s"),PT("s2",-9,24,"s"),PT("s3",9,24,"s"),PT("s4",26,24,"s")])],
 ["C — PLEM / PLET (đầu nối ống đáy biển)",SC(-34,34,-22,26,SEABED(-34,34,18)+R(-24,-14,48,30,"dash")+L("M-34 0H-6","body")+C(2,0,5)+L("M7 0H34","body")+L("M2 -5V-14","body"),[PT("w",-34,0,"w"),PT("e",34,0,"e"),PT("n",2,-14,"n")])],
 ["D — Template 3 cây thông",SC(-52,52,-30,34,SEABED(-52,52,24)+R(-46,-24,92,44,"dash")+[-26,0,26].map(x=>R(x-5,-8,10,24,"body",2)+R(x-7,-16,14,8,"body",2)+L(`M${x} -16V-24`)).join("")+L("M-46 -20H46","thin"),[PT("w",-46,0,"w"),PT("e",46,0,"e"),PT("n",0,-24,"n"),PT("s",0,24,"s")])]
]);
/* --- Nhà máy & trạm --- */
reg("gas_plant","Nhà máy xử lý khí / LNG","Hạ tầng chuỗi cung ứng khí","GP",[
 ["A — Nhà máy xử lý khí (GPP)",SC(-56,56,-48,36,R(-52,-42,104,76,"dash")+R(-44,-34,14,56,"body",5)+R(-24,-24,12,46,"body",5)+HS(-6,32,6,22)+STACK(46,-40,22,6)+C(10,-10,8)+L("M-30 -20H-24M-12 -8H-6M32 14H42M18 -10H26")+L("M-52 14H-44M42 22H52","body"),[PT("w",-52,14,"w"),PT("e",52,22,"e"),PT("n",-37,-34,"n"),PT("s",-18,34,"s")])],
 ["B — Dây chuyền hóa lỏng LNG (train)",SC(-62,62,-52,38,R(-52,-14,26,28,"body",14)+LB(-39,4,"K",12)+L("M-26 0H-14","body")+R(-14,-44,24,78,"body",2)+L("M-14 -28H10M-14 -10H10M-14 8H10M-14 26H10","thin")+R(26,-30,32,58,"body",4)+`<path class="body" d="M26 -30Q42 -48 58 -30"/>`+L("M10 18H26","body"),[PT("w",-52,0,"w","FEED GAS"),PT("e",58,6,"e","LNG"),PT("n",-2,-44,"n"),PT("s",-2,34,"s")])],
 ["C — Phân đoạn NGL / LPG (3 tháp)",SC(-56,56,-50,36,R(-48,-44,14,76,"body",5)+L("M-48 -22H-34M-48 -2H-34M-48 18H-34")+R(-22,-30,14,62,"body",5)+L("M-22 -10H-8M-22 10H-8")+R(4,-16,14,48,"body",5)+C(40,10,10)+L("M-34 -30H-22M-8 -16H4M18 16H30M-27 32V40H11V32","body"),[PT("w",-48,-30,"w"),PT("e",50,10,"e"),PT("n",-41,-44,"n"),PT("s",-8,40,"s")])]
]);
reg("comp_station","Trạm nén khí","Hạ tầng chuỗi cung ứng khí","CS",[
 ["A — Trạm nén ly tâm",SC(-48,48,-46,22,R(-40,-18,80,40,"body",3)+L("M-40 -18L0 -28L40 -18","body")+C(-16,2,10)+C(14,2,10)+L("M-26 2H-6M4 2H24","thin")+STACK(30,-46,-24,6),[PT("w",-48,6,"w"),PT("e",48,6,"e"),PT("n",30,-46,"n"),PT("s",0,22,"s")])],
 ["B — Trạm nén dùng turbine khí",SC(-52,52,-46,22,R(-44,-18,88,40,"body",3)+`<path class="body" d="M-34 -8L-14 -2V14L-34 20Z"/>`+R(-14,-4,16,16,"body",3)+`<path class="body" d="M2 -2L22 -8V20L2 14Z"/>`+L("M22 6H30","thin")+C(38,6,6)+STACK(-6,-46,-18,10),[PT("w",-52,6,"w"),PT("e",52,6,"e"),PT("n",-6,-46,"n"),PT("s",0,22,"s")])],
 ["C — Trạm nén piston",SC(-48,48,-46,22,R(-40,-18,80,40,"body",3)+[-24,0,24].map(x=>R(x-6,-34,12,22,"body",2)+L(`M${x-6} -26H${x+6}`)).join("")+L("M-34 12H34","thin")+L("M-40 4H-48M40 4H48","body"),[PT("w",-48,4,"w"),PT("e",48,4,"e"),PT("n",0,-34,"n"),PT("s",0,22,"s")])]
]);
reg("lng_tank","Bồn LNG / Kho lạnh","Hạ tầng chuỗi cung ứng khí","TK",[
 ["A — Full containment (mái vòm)",SC(-44,44,-44,30,R(-40,-18,80,48,"body")+`<path class="body" d="M-40 -18Q0 -52 40 -18"/>`+R(-33,-14,66,42,"dash")+L("M-40 -2H40M-40 12H40","thin"),[PT("w",-40,6,"w"),PT("e",40,6,"e"),PT("n",0,-34,"n"),PT("s",0,30,"s")])],
 ["B — Single containment + đê bao",SC(-56,56,-36,30,`<path class="dash" d="M-56 30L-46 14H46L56 30Z"/>`+R(-28,-20,56,46,"body")+`<path class="body" d="M-28 -20L0 -34L28 -20Z"/>`+L("M-28 4H28","thin"),[PT("w",-28,2,"w"),PT("e",28,2,"e"),PT("n",0,-34,"n"),PT("s",0,30,"s")])],
 ["C — Bồn cầu LNG (Moss) + skirt",SC(-34,34,-38,40,C(0,-4,30)+L("M-30 -4H30","thin")+`<path class="body" d="M-22 20L-16 40H16L22 20"/>`+L("M0 -34V-42M-4 -42H4","body"),[PT("w",-30,-4,"w"),PT("e",30,-4,"e"),PT("n",0,-42,"n"),PT("s",0,40,"s")])],
 ["D — Bồn chìm / bán chìm",SC(-50,50,-34,34,L("M-50 -4H-34M34 -4H50","body")+R(-34,-4,68,36,"body")+`<path class="body" d="M-34 -4Q0 -30 34 -4"/>`+L("M-34 8H34","dash"),[PT("w",-50,-4,"w"),PT("e",50,-4,"e"),PT("n",0,-17,"n"),PT("s",0,32,"s")])],
 ["E — Bồn LNG nhỏ (vệ tinh, chân đỡ)",SC(-24,24,-44,44,R(-14,-34,28,60,"body",14)+L("M-10 26V42M10 26V42M-18 42H-4M4 42H18")+L("M-14 -8H14","thin"),[PT("w",-14,-4,"w"),PT("e",14,-4,"e"),PT("n",0,-34,"n"),PT("s",0,42,"s")])]
]);
reg("regas","Hóa khí LNG (Regas)","Hạ tầng chuỗi cung ứng khí","RV",[
 ["A — ORV (giàn trao đổi nhiệt nước biển)",SC(-40,40,-44,40,R(-36,-38,72,8,"body")+[-30,-18,-6,6,18,28].map(x=>R(x,-30,8,56,"body")).join("")+R(-36,26,72,8,"body")+L("M-20 -44V-38M20 -44V-38","body")+WV(-30,30,-20,"wat"),[PT("w",-36,30,"w","LNG"),PT("e",36,-34,"e","NG"),PT("n",0,-44,"n","SW"),PT("s",0,34,"s")])],
 ["B — SCV (đốt chìm)",SC(-40,40,-52,32,R(-32,-14,64,44,"body",3)+WV(-28,28,-4,"wat")+L("M-22 8H-12L-8 14L0 4L8 14L12 8H22","thin")+STACK(22,-50,-14,8)+FLAME(-14,30,1)+L("M-32 18H-40M32 8H40","body"),[PT("w",-40,18,"w","LNG"),PT("e",40,8,"e","NG"),PT("n",22,-50,"n"),PT("s",0,30,"s")])],
 ["C — AAV (bay hơi bằng không khí)",SC(-36,36,-44,44,R(-5,-38,10,76,"body")+L("M-5 -28H-30M5 -28H30M-5 -12H-30M5 -12H30M-5 4H-30M5 4H30M-5 20H-30M5 20H30","thin")+L("M-30 -34V26M30 -34V26","thin")+L("M0 38V44M0 -38V-44","body"),[PT("w",-30,26,"w"),PT("e",30,-34,"e"),PT("n",0,-44,"n","NG"),PT("s",0,44,"s","LNG")])],
 ["D — IFV (môi chất trung gian)",SC(-50,50,-26,28,HS(-34,34,-12,12)+L("M-22 -4H-14L-8 4L0 -4L8 4L14 -4H22","thin")+R(-6,-26,12,14,"body",2)+L("M-50 0H-34M34 0H50","body")+C(0,22,5,"body"),[PT("w",-50,0,"w","LNG"),PT("e",50,0,"e","NG"),PT("n",0,-26,"n"),PT("s",0,28,"s")])]
]);
reg("city_gate","Trạm điều áp / đo đếm (PRS / PRMS)","Hạ tầng chuỗi cung ứng khí","PRS",[
 ["A — Trạm điều áp (PRS)",SC(-46,46,-34,26,R(-38,-24,76,46,"dash")+L("M-46 0H-14M14 0H46","body")+C(0,0,14)+BRK(0,0,.9)+`<path class="body" d="M-7 -14A7 7 0 0 1 7 -14Z"/>`+L("M0 -14V-21H20V-30M14 -30H26","thin"),[PT("w",-46,0,"w","IN"),PT("e",46,0,"e","OUT"),PT("n",20,-30,"n","RELIEF"),PT("s",0,22,"s")])],
 ["B — Trạm đo đếm (metering)",SC(-46,46,-28,26,R(-38,-22,76,44,"dash")+L("M-46 0H-14M14 0H46","body")+C(0,0,14)+LB(0,4,"M",12)+L("M-26 -2V-14M26 -2V-14M-26 -14H26","thin"),[PT("w",-46,0,"w","IN"),PT("e",46,0,"e","OUT"),PT("n",0,-22,"n"),PT("s",0,22,"s")])],
 ["C — Trạm điều áp + đo đếm (PRMS)",SC(-60,60,-34,26,R(-52,-24,104,46,"dash")+L("M-60 0H-30M-10 0H10M30 0H60","body")+C(-20,0,10)+BRK(-20,0,.7)+C(20,0,10)+LB(20,4,"M",10)+`<path class="body" d="M-26 -10A6 6 0 0 1 -14 -10Z"/>`,[PT("w",-60,0,"w","IN"),PT("e",60,0,"e","OUT"),PT("n",0,-24,"n"),PT("s",0,22,"s")])]
]);
reg("power_plant","Nhà máy điện khí","Hạ tầng chuỗi cung ứng khí","PP",[
 ["A — Chu trình hỗn hợp (CCGT)",SC(-72,66,-58,32,C(-52,0,14)+LB(-52,4,"GT",10)+L("M-38 0H-20","body")+R(-20,-30,28,58,"body",2)+L("M-20 -14H8M-20 2H8M-20 18H8","thin")+STACK(-6,-56,-30,8)+L("M8 0H24","body")+C(40,0,14)+LB(40,4,"ST",10)+L("M54 0H66","body")+L("M-66 0H-66","thin"),[PT("w",-66,0,"w","FUEL"),PT("e",66,0,"e","POWER"),PT("n",-6,-56,"n","STACK"),PT("s",-6,28,"s","WATER")])],
 ["B — Tua-bin khí + máy phát (GT)",SC(-40,52,-48,24,C(-22,0,14)+LB(-22,4,"GT",10)+L("M-8 0H6","body")+C(20,0,13)+LB(20,4,"G",12)+STACK(-22,-46,-14,8)+L("M-40 0H-36M33 0H52","body"),[PT("w",-40,0,"w","FUEL"),PT("e",52,0,"e","POWER"),PT("n",-22,-46,"n","EXH"),PT("s",0,24,"s")])],
 ["C — Nhà máy động cơ khí (gas engine)",SC(-52,52,-30,28,[-34,0,34].map(x=>R(x-14,-12,28,24,"body",3)+LB(x,5,"E",11)+L(`M${x+14} 0H${x+20}`,"body")).join("")+L("M-52 0H-48","body")+C(-34,22,0.01)+L("M-34 12V20M0 12V20M34 12V20M-34 20H34","body"),[PT("w",-52,0,"w","GAS"),PT("e",50,0,"e","POWER"),PT("n",0,-12,"n"),PT("s",0,20,"s")])],
 ["D — Nhiệt điện khí (lò hơi + turbine)",SC(-62,62,-54,30,R(-52,-24,34,52,"body",3)+FLAME(-35,28,1.2)+STACK(-35,-52,-24,8)+L("M-18 -6H0","body")+C(18,-6,14)+LB(18,-2,"ST",10)+L("M32 -6H44","body")+C(52,-6,10)+LB(52,-2,"G",9),[PT("w",-52,4,"w","GAS"),PT("e",62,-6,"e","POWER"),PT("n",-35,-52,"n"),PT("s",18,12,"s","COND")])]
]);
reg("consumer","Hộ tiêu thụ khí","Hạ tầng chuỗi cung ứng khí","CU",[
 ["A — Nhà máy / khu công nghiệp",SC(-44,40,-40,26,`<path class="body" d="M-40 24V-6L-26 -18V-6L-12 -18V-6L2 -18V24Z"/>`+R(12,-34,8,58,"body")+R(26,-24,8,48,"body")+R(-34,8,10,8,"thin")+R(-18,8,10,8,"thin")+L("M-44 24H40","body"),[PT("w",-40,8,"w"),PT("e",34,8,"e"),PT("n",16,-34,"n"),PT("s",0,24,"s")])],
 ["B — Khu dân cư / đô thị",SC(-54,54,-46,24,HOUSE(-50,24,28,18)+HOUSE(-14,24,32,26)+HOUSE(26,24,26,16)+L("M-54 24H54","body"),[PT("w",-54,6,"w"),PT("e",54,6,"e"),PT("n",2,-46,"n"),PT("s",0,24,"s")])],
 ["C — Trạm nạp CNG / LNG (cây xăng)",SC(-42,42,-40,28,R(-40,-34,80,8,"body")+L("M-32 -26V24M32 -26V24","body")+R(-8,-16,16,38,"body",2)+R(-5,-12,10,9,"thin")+L("M8 -4Q22 -4 20 10","thin")+LB(0,16,"CNG",6.5)+L("M-42 24H42","body"),[PT("w",-42,0,"w"),PT("e",42,0,"e"),PT("n",0,-34,"n"),PT("s",0,28,"s")])],
 ["D — Hộ gia đình / bếp",SC(-30,30,-40,26,HOUSE(-24,24,48,28)+FLAME(0,24,1.3)+L("M-30 24H30","body"),[PT("w",-30,6,"w"),PT("e",30,6,"e"),PT("n",0,-40,"n"),PT("s",0,24,"s")])],
 ["E — Nhà máy phân đạm / hóa chất",SC(-54,54,-52,32,R(-48,-44,14,76,"body",5)+L("M-48 -24H-34M-48 -4H-34M-48 16H-34")+C(-8,6,18)+L("M-26 6H-34","thin")+L("M-8 -12V-40")+R(16,-10,28,40,"body",4)+STACK(50,-50,-10,6)+L("M-34 -34H-8","thin"),[PT("w",-48,-34,"w"),PT("e",44,8,"e"),PT("n",-41,-44,"n"),PT("s",0,32,"s")])],
 ["F — Tòa nhà thương mại / khách sạn",SC(-32,32,-50,28,R(-20,-44,40,72,"body")+L("M-20 -28H20M-20 -12H20M-20 4H20M-20 20H20M-6 -44V28M8 -44V28","thin")+R(-30,10,10,18,"body")+R(20,0,10,28,"body"),[PT("w",-30,18,"w"),PT("e",30,14,"e"),PT("n",0,-44,"n"),PT("s",0,28,"s")])]
]);
reg("valve_station","Trạm van tuyến ống","Hạ tầng chuỗi cung ứng khí","VS",[
 ["A — Trạm van chặn (block valve)",SC(-40,40,-26,26,R(-22,-20,44,40,"dash")+L("M-40 0H-12M12 0H40","body")+BRK(0,0,1.1)+L("M0 -8V-16M-6 -16H6","thin"),[PT("w",-40,0,"w"),PT("e",40,0,"e"),PT("n",0,-20,"n"),PT("s",0,20,"s")])],
 ["B — Trạm phóng / nhận thoi (pig)",SC(-48,48,-30,26,R(-40,-24,80,46,"dash")+HS(-34,4,-8,8)+R(4,-6,8,12,"body")+L("M-48 0H-34M12 0H20M20 0H48","body")+BRK(30,0,.8)+L("M-16 -8V-20H-4","thin"),[PT("w",-48,0,"w"),PT("e",48,0,"e"),PT("n",-4,-20,"n","KICKER"),PT("s",0,22,"s")])],
 ["C — Trạm cắt khẩn cấp (SSV / ESD)",SC(-40,40,-36,26,R(-22,-24,44,46,"dash")+L("M-40 0H-12M12 0H40","body")+BRK(0,0,1.1)+L("M0 -8V-14","thin")+`<path class="body" d="M-8 -14A8 8 0 0 1 8 -14Z"/>`+C(18,-20,0.01)+C(26,-26,6)+L("M20 -22L8 -16","thin"),[PT("w",-40,0,"w"),PT("e",40,0,"e"),PT("n",0,-24,"n"),PT("s",0,22,"s")])]
]);
reg("terminal","Cảng / Kho / Phao (terminal)","Hạ tầng chuỗi cung ứng khí","TM",[
 ["A — Cầu cảng (jetty) + tàu",SC(-56,60,-34,32,L("M-56 0H12","body")+L("M-48 0V18M-32 0V18M-16 0V18M0 0V18","body")+WV(-56,60,16,"wat")+`<path class="body" d="M10 6H60L52 24H18Z"/>`+R(34,-8,18,14,"body")+L("M12 0L28 -14L40 -14","body")+C(12,0,3,"solid")+C(28,-14,2.5,"solid"),[PT("w",-56,0,"w"),PT("e",60,6,"e"),PT("n",28,-14,"n","ARM"),PT("s",-24,18,"s")])],
 ["B — Phao một điểm (SPM / CALM)",SC(-40,40,-40,40,WV(-40,40,0,"wat")+`<path class="body" d="M-14 0L-10 -14H10L14 0Z"/>`+L("M0 -14V-26M-8 -26H8","body")+L("M0 0V30M-6 0L-24 30M6 0L24 30","thin")+L("M0 -22C20 -30 26 -20 40 -20","dash")+L("M-40 30H40","body"),[PT("w",-40,30,"w","PLEM"),PT("e",40,-20,"e","HOSE"),PT("n",0,-26,"n"),PT("s",0,30,"s")])],
 ["C — Kho LPG (bồn trụ nằm + bồn cầu)",SC(-60,60,-32,34,HS(-56,-16,-12,12)+L("M-46 12V22M-26 12V22M-52 22H-40M-32 22H-20")+C(14,-4,22)+L("M-8 26L-6 34M14 18V34M36 26L34 34M-12 34H40")+HS(30,60,-18,-2)+L("M-16 0H-8","body"),[PT("w",-56,0,"w"),PT("e",60,-10,"e"),PT("n",14,-26,"n"),PT("s",14,34,"s")])],
 ["D — Kho xăng dầu (3 bồn + đê)",SC(-62,62,-34,30,R(-60,-2,120,32,"dash")+[-40,0,40].map(x=>R(x-16,-22,32,44,"body")+`<path class="body" d="M${x-16} -22L${x} -30L${x+16} -22Z"/>`).join(""),[PT("w",-60,16,"w"),PT("e",60,16,"e"),PT("n",0,-30,"n"),PT("s",0,30,"s")])]
]);
reg("storage","Kho chứa khí ngầm (UGS)","Hạ tầng chuỗi cung ứng khí","UGS",[
 ["A — Mỏ cạn kiệt (depleted reservoir)",SC(-52,52,-30,50,L("M-52 -4H52","body")+R(-4,-20,8,16,"body",1)+L("M0 -20V-30")+L("M0 -4V22","body")+`<path class="body" d="M-40 36Q-30 18 0 18Q30 18 40 36Q30 46 0 46Q-30 46 -40 36Z"/>`+C(-20,34,1.5,"solid")+C(-6,38,1.5,"solid")+C(10,34,1.5,"solid")+C(24,38,1.5,"solid")+C(0,30,1.5,"solid"),[PT("w",-52,-4,"w"),PT("e",52,-4,"e"),PT("n",0,-30,"n"),PT("s",0,46,"s")])],
 ["B — Hang muối (salt cavern)",SC(-52,52,-30,56,L("M-52 -4H52","body")+R(-4,-20,8,16,"body",1)+L("M0 -20V-30")+`<path class="body" d="M-3 -4V10Q-22 18 -20 36Q-18 52 0 52Q18 52 20 36Q22 18 3 10V-4"/>`+L("M-14 30Q0 24 14 30","thin"),[PT("w",-52,-4,"w"),PT("e",52,-4,"e"),PT("n",0,-30,"n"),PT("s",0,52,"s")])],
 ["C — Tầng chứa nước (aquifer)",SC(-52,52,-30,50,L("M-52 -4H52","body")+R(-4,-20,8,16,"body",1)+L("M0 -20V-30")+L("M0 -4V20","body")+`<path class="body" d="M-50 40Q0 4 50 40"/>`+`<path class="thin" d="M-50 50Q0 14 50 50"/>`+L("M-30 34L-24 40M-10 24L-4 30M10 24L16 30M30 34L36 40","thin"),[PT("w",-52,-4,"w"),PT("e",52,-4,"e"),PT("n",0,-30,"n"),PT("s",0,50,"s")])]
]);
