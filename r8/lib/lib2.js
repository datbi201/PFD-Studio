/* ===== PHỤ KIỆN ĐƯỜNG ỐNG ===== */
const IP=(w,h)=>[{id:"w",x:-w/2,y:0,d:"w"},{id:"e",x:w/2,y:0,d:"e"},{id:"n",x:0,y:-h/2,d:"n"},{id:"s",x:0,y:h/2,d:"s"}];
reg("reducer","Côn thu / Reducer","Phụ kiện đường ống","RD",[
 ["A — Đồng tâm",S(32,24,`<path class="body" d="M-16 -11L16 -5V5L-16 11Z"/>`)],
 ["B — Lệch tâm",S(32,24,`<path class="body" d="M-16 -11L16 -5V11H-16Z"/>`)],
 ["C — Mở rộng (swage)",S(34,24,`<path class="body" d="M-17 -4L17 -11V11L-17 4Z"/>`)]
]);
reg("strainer","Lọc ống / Strainer","Phụ kiện đường ống","STR",[
 ["A — Dạng Y",S(36,32,L("M-18 0H18")+`<path class="body" d="M-12 -8H12V8H-12Z"/>`+L("M0 8L8 20","thin"),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"n",x:0,y:-8,d:"n"},{id:"s",x:8,y:20,d:"s"}])],
 ["B — Rổ lọc (basket)",S(40,36,R(-18,-12,36,24,"body")+L("M-12 -6V6M-4 -6V6M4 -6V6M12 -6V6")+L("M-22 0H-18M18 0H22"),PW(40,36))],
 ["C — Dạng T",S(36,32,R(-14,-8,28,16,"body")+L("M-14 0H14","dash"),IP(36,24))],
 ["D — Phin tạm (cone)",S(36,24,`<path class="body" d="M-16 -10L16 0L-16 10Z"/>`+L("M-16 -10V10"))]
]);
reg("arrestor","Chặn lửa / Flame arrestor","Phụ kiện đường ống","FA",[
 ["A — Flame arrestor",S(36,28,R(-14,-12,28,24,"body")+L("M-8 -12V12M-2 -12V12M4 -12V12M10 -12V12")+L("M-18 0H-14M14 0H18"),PW(36,28))]
]);
reg("spec_blind","Mặt bích mù / Spectacle","Phụ kiện đường ống","SB",[
 ["A — Spectacle (mở)",S(40,24,C(-9,0,8)+C(9,0,8,"solid")+L("M-17 0H-24M17 0H24"),PW(40,24))],
 ["B — Spectacle (đóng)",S(40,24,C(-9,0,8,"solid")+C(9,0,8)+L("M-17 0H-24M17 0H24"),PW(40,24))],
 ["C — Mặt bích mù",S(20,28,L("M-10 0H0")+R(-2,-12,6,24,"solid"),[{id:"w",x:-10,y:0,d:"w"},{id:"e",x:4,y:0,d:"e"}])],
 ["D — Nắp bịt (cap)",S(22,22,L("M-11 0H0")+`<path class="body" d="M0 -8Q10 0 0 8Z"/>`,[{id:"w",x:-11,y:0,d:"w"}])]
]);
reg("flange","Mặt bích / Khớp nối","Phụ kiện đường ống","FL",[
 ["A — Cặp mặt bích",S(24,26,L("M-12 0H12")+L("M-3 -11V11M3 -11V11"),PW(24,26))],
 ["B — Khớp giãn nở (bellows)",S(40,26,L("M-20 0H-14M14 0H20")+L("M-14 -9L-10 9L-6 -9L-2 9L2 -9L6 9L10 -9L14 9","thin"),PW(40,26))],
 ["C — Ống mềm (hose)",S(44,24,L("M-22 0H-16M16 0H22")+`<path class="thin" d="M-16 0Q-8 -12 0 0T16 0"/>`,PW(44,24))],
 ["D — Điểm nối nhanh",S(26,26,C(0,0,6,"solid")+L("M-13 0H-6M6 0H13"),PW(26,26))]
]);
reg("sight","Kính quan sát / Bẫy hơi","Phụ kiện đường ống","SG",[
 ["A — Sight glass",S(34,30,L("M-17 0H-10M10 0H17")+C(0,0,10)+L("M-6 -6L6 6M6 -6L-6 6","thin"),PW(34,30))],
 ["B — Steam trap",S(34,30,C(0,0,10)+L("M-17 0H-10M10 0H17")+T(0,4,"ST",9),PW(34,30))],
 ["C — Silencer",S(46,28,R(-18,-12,36,24,"body",6)+L("M-23 0H-18M18 0H23")+L("M-8 -12V12M0 -12V12M8 -12V12","dash"),PW(46,28))],
 ["D — Drain pot",S(40,50,R(-14,-14,28,36,"body",4)+L("M-20 -4H-14M14 -4H20")+L("M0 22V30"),[{id:"w",x:-20,y:-4,d:"w"},{id:"e",x:20,y:-4,d:"e"},{id:"n",x:0,y:-14,d:"n"},{id:"s",x:0,y:30,d:"s"}])]
]);
reg("vent_drain","Vent / Drain / Lấy mẫu","Phụ kiện đường ống","VT",[
 ["A — Vent",S(26,34,L("M0 17V-4")+`<path class="body" d="M-8 -4H8L0 -16Z"/>`,[{id:"s",x:0,y:17,d:"s"},{id:"n",x:0,y:-16,d:"n"}])],
 ["B — Drain",S(26,34,L("M0 -17V4")+`<path class="body" d="M-8 4H8L0 16Z"/>`,[{id:"n",x:0,y:-17,d:"n"},{id:"s",x:0,y:16,d:"s"}])],
 ["C — Điểm lấy mẫu",S(30,34,L("M0 17V0")+C(0,-8,8)+T(0,-5,"S",10),[{id:"s",x:0,y:17,d:"s"},{id:"n",x:0,y:-16,d:"n"}])],
 ["D — Điểm hoá chất (injection)",S(34,34,L("M0 17V-2")+C(0,-10,7)+L("M-5 -15L5 -5M5 -15L-5 -5","thin"),[{id:"s",x:0,y:17,d:"s"},{id:"n",x:0,y:-17,d:"n"}])],
 ["E — Đầu nối ống mềm",S(34,26,L("M-17 0H-6")+`<path class="body" d="M-6 -7L6 -7L6 7L-6 7Z"/>`+L("M6 0H17"),PW(34,26))]
]);
reg("ptap","Thermowell / Nhánh đo","Phụ kiện đường ống","TW",[
 ["A — Thermowell",S(24,34,L("M0 -2V-17")+`<path class="body" d="M-4 -2H4V12L0 17L-4 12Z"/>`,[{id:"n",x:0,y:-17,d:"n"},{id:"s",x:0,y:17,d:"s"}])],
 ["B — Nhánh áp suất",S(24,30,L("M0 15V-8")+C(0,-12,4,"solid"),[{id:"s",x:0,y:15,d:"s"},{id:"n",x:0,y:-16,d:"n"}])]
]);

/* ===== ĐO LƯỜNG TẠI ỐNG (inline) ===== */
const IW=(w,h)=>[{id:"w",x:-w/2,y:0,d:"w"},{id:"e",x:w/2,y:0,d:"e"},{id:"n",x:0,y:-h/2,d:"n"},{id:"s",x:0,y:h/2,d:"s"}];
reg("orifice","Tấm tiết lưu / FE","Đo lường tại ống (inline)","FE",[
 ["A — Orifice plate",S(36,40,L("M-18 0H-4M4 0H18")+L("M-4 -14V14M4 -14V14","body")+L("M-4 -14H4M-4 14H4","thin"),IW(36,40))],
 ["B — Có ống đo áp chênh",S(36,50,L("M-18 0H18")+L("M-3 -12V12M3 -12V12","body")+L("M-3 -12V-24M3 -12V-24","thin")+C(0,-24,2.5,"solid"),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"n",x:0,y:-26,d:"n"},{id:"s",x:0,y:12,d:"s"}])],
 ["C — Venturi",S(54,30,`<path class="body" d="M-27 -10L-8 -5H8L27 -10V10L8 5H-8L-27 10Z"/>`,IW(54,20))],
 ["D — Flow nozzle",S(44,30,`<path class="body" d="M-22 -10Q-6 -10 -2 -4H22V4H-2Q-6 10 -22 10Z"/>`,IW(44,20))],
 ["E — Pitot / Annubar",S(34,44,L("M-17 0H17")+L("M0 -22V8")+C(0,8,3,"solid"),[{id:"w",x:-17,y:0,d:"w"},{id:"e",x:17,y:0,d:"e"},{id:"n",x:0,y:-22,d:"n"},{id:"s",x:0,y:10,d:"s"}])]
]);
reg("flowmeter","Lưu lượng kế (inline)","Đo lường tại ống (inline)","FT",[
 ["A — Coriolis",S(60,46,R(-24,-12,48,24,"body",4)+L("M-30 0H-24M24 0H30")+L("M-14 -6H10Q16 -6 16 0T10 6H-14","thin"),IW(60,24))],
 ["B — Siêu âm",S(60,40,R(-24,-12,48,24,"body",4)+L("M-30 0H-24M24 0H30")+L("M-12 -12L12 12","dash")+L("M12 -12L-12 12","dash"),IW(60,24))],
 ["C — Từ (mag)",S(60,40,R(-24,-12,48,24,"body",4)+L("M-30 0H-24M24 0H30")+T(0,4,"MAG",10),IW(60,24))],
 ["D — Vortex",S(60,40,R(-24,-12,48,24,"body",4)+L("M-30 0H-24M24 0H30")+`<path class="thin" d="M-4 -7L2 0L-4 7Z"/>`,IW(60,24))],
 ["E — Turbine",S(54,40,C(0,0,13)+L("M-27 0H-13M13 0H27")+L("M0 0L8 -9M0 0L-9 -5M0 0L3 10","thin"),IW(54,26))],
 ["F — PD (bánh răng)",S(54,40,C(0,0,13)+L("M-27 0H-13M13 0H27")+C(-5,0,5,"thin")+C(5,0,5,"thin"),IW(54,26))],
 ["G — Rotameter",S(34,50,`<path class="body" d="M-8 -20L8 -20L5 20H-5Z"/>`+L("M-17 20H-5M5 -20H17","thin")+L("M-3 6H3","solid"),[{id:"w",x:-17,y:20,d:"w"},{id:"e",x:17,y:-20,d:"e"},{id:"n",x:0,y:-20,d:"n"},{id:"s",x:0,y:20,d:"s"}])]
]);
reg("analyzer","Đầu dò phân tích","Đo lường tại ống (inline)","AE",[
 ["A — Đầu dò (probe)",S(26,36,L("M0 18V0")+R(-8,-14,16,14,"body")+T(0,-3,"AE",8),[{id:"s",x:0,y:18,d:"s"},{id:"n",x:0,y:-14,d:"n"}])],
 ["B — H2S / CO2 online",S(46,40,R(-20,-14,40,28,"body",3)+T(0,4,"AT",12)+L("M0 14V22","thin"),[{id:"w",x:-20,y:0,d:"w"},{id:"e",x:20,y:0,d:"e"},{id:"n",x:0,y:-14,d:"n"},{id:"s",x:0,y:22,d:"s"}])],
 ["C — Máy đo điểm sương",S(46,40,R(-20,-14,40,28,"body",3)+T(0,4,"DP",11),[{id:"w",x:-20,y:0,d:"w"},{id:"e",x:20,y:0,d:"e"},{id:"n",x:0,y:-14,d:"n"},{id:"s",x:0,y:14,d:"s"}])]
]);
reg("levelinst","Đo mức (tại bình)","Đo lường tại ống (inline)","LG",[
 ["A — Kính đo mức (LG)",S(26,70,L("M0 -35H-10M0 35H-10")+R(0,-35,10,70,"body")+L("M0 5H10","dash"),[{id:"w",x:-10,y:-35,d:"w"},{id:"e",x:10,y:0,d:"e"},{id:"n",x:5,y:-35,d:"n"},{id:"s",x:5,y:35,d:"s"}])],
 ["B — Radar / sóng dẫn",S(34,64,L("M0 -10V32")+`<path class="body" d="M-12 -10H12L6 -30H-6Z"/>`+L("M-4 -34Q0 -38 4 -34","thin"),[{id:"w",x:-12,y:-10,d:"w"},{id:"e",x:12,y:-10,d:"e"},{id:"n",x:0,y:-36,d:"n"},{id:"s",x:0,y:32,d:"s"}])],
 ["C — Phao (float)",S(34,60,R(-8,-26,16,52,"body",3)+C(0,6,6,"grey")+L("M-8 -10H-17M8 -10H17","thin"),[{id:"w",x:-17,y:-10,d:"w"},{id:"e",x:17,y:-10,d:"e"},{id:"n",x:0,y:-26,d:"n"},{id:"s",x:0,y:26,d:"s"}])],
 ["D — Đo mức áp chênh (DP)",S(40,60,L("M-20 -24H0M-20 24H0")+R(0,-30,20,60,"body",3)+T(10,4,"DP",9),[{id:"w",x:-20,y:-24,d:"w"},{id:"e",x:20,y:0,d:"e"},{id:"n",x:10,y:-30,d:"n"},{id:"s",x:10,y:30,d:"s"}])]
]);

/* ===== ĐO & ĐIỀU KHIỂN (C&I): vòng tròn theo ISA 5.1 ===== */
const BUB=[
 ["A — Tại hiện trường",C(0,0,19)],
 ["B — Trong phòng điều khiển",C(0,0,19)+L("M-19 0H19")],
 ["C — Tủ phụ / local panel",C(0,0,19)+L("M-19 0H19","dash")],
 ["D — DCS (hiển thị chia sẻ)",R(-19,-19,38,38,"body")+C(0,0,15,"thin")],
 ["E — PLC / logic (thoi)",`<path class="body" d="M0 -22L22 0L0 22L-22 0Z"/>`+L("M-14 0H14","thin")],
 ["F — Máy tính (lục giác)",`<path class="body" d="M-20 0L-10 -18H10L20 0L10 18H-10Z"/>`]
];
function bub(key,label,prefix){reg(key,label,"Đo & điều khiển (C&I)",prefix,BUB.map(b=>[b[0],S(40,40,b[1])]),{bub:true})}
[["pt","Máy phát áp suất (PT)","PT"],["tt","Máy phát nhiệt độ (TT)","TT"],["ft","Máy phát lưu lượng (FT)","FT"],["lt","Máy phát mức (LT)","LT"],["at","Máy phân tích (AT)","AT"],["pdt","Máy phát áp chênh (PDT)","PDT"],
 ["pi","Chỉ thị áp suất (PI)","PI"],["ti","Chỉ thị nhiệt độ (TI)","TI"],["fi","Chỉ thị lưu lượng (FI)","FI"],["li","Chỉ thị mức (LI)","LI"],
 ["pic","Bộ điều khiển áp suất (PIC)","PIC"],["tic","Bộ điều khiển nhiệt độ (TIC)","TIC"],["fic","Bộ điều khiển lưu lượng (FIC)","FIC"],["lic","Bộ điều khiển mức (LIC)","LIC"],["aic","Bộ điều khiển phân tích (AIC)","AIC"],
 ["psh","Công tắc áp cao (PSH)","PSH"],["psl","Công tắc áp thấp (PSL)","PSL"],["pshh","Áp rất cao (PSHH)","PSHH"],["pall","Áp rất thấp (PSLL)","PSLL"],
 ["lsh","Công tắc mức cao (LSH)","LSH"],["lsl","Công tắc mức thấp (LSL)","LSL"],["lshh","Mức rất cao (LSHH)","LSHH"],["lsll","Mức rất thấp (LSLL)","LSLL"],
 ["tsh","Công tắc nhiệt cao (TSH)","TSH"],["fsl","Công tắc lưu lượng thấp (FSL)","FSL"],
 ["zs","Công tắc hành trình (ZSO/ZSC)","ZS"],["hs","Công tắc tay / nút (HS)","HS"],["ys","Rơ-le / logic (YS)","YS"],["fq","Tổng lưu (FQI)","FQI"],["sis","Chức năng an toàn (SIS)","SIS"]
].forEach(a=>bub(a[0],a[1],a[2]));
reg("instrument","Vòng đo / điều khiển (tự đặt tên)","Đo & điều khiển (C&I)","PIC",BUB.map(b=>[b[0],S(40,40,b[1])]),{bub:true});
reg("gauge","Đồng hồ cơ","Đo & điều khiển (C&I)","PI",[
 ["A — Đồng hồ áp suất",S(34,44,C(0,-6,12)+L("M0 6V16")+L("M-6 -3L0 -6L5 -12","thin"),[{id:"s",x:0,y:16,d:"s"},{id:"n",x:0,y:-18,d:"n"},{id:"w",x:-12,y:-6,d:"w"},{id:"e",x:12,y:-6,d:"e"}])],
 ["B — Đồng hồ nhiệt độ",S(34,50,C(0,-10,12)+L("M0 2V16")+C(0,20,4,"solid")+L("M-6 -7L0 -10L5 -16","thin"),[{id:"s",x:0,y:24,d:"s"},{id:"n",x:0,y:-22,d:"n"},{id:"w",x:-12,y:-10,d:"w"},{id:"e",x:12,y:-10,d:"e"}])],
 ["C — Đồng hồ + cách ly (seal)",S(34,56,C(0,-14,12)+L("M0 -2V10")+R(-7,10,14,10,"body",2)+L("M0 20V26"),[{id:"s",x:0,y:26,d:"s"},{id:"n",x:0,y:-26,d:"n"},{id:"w",x:-12,y:-14,d:"w"},{id:"e",x:12,y:-14,d:"e"}])]
]);
reg("alarm","Báo động / An toàn","Đo & điều khiển (C&I)","UA",[
 ["A — Còi (horn)",S(40,36,`<path class="body" d="M-16 -8H-4L12 -16V16L-4 8H-16Z"/>`+L("M16 -6Q22 0 16 6M20 -10Q30 0 20 10"))],
 ["B — Đèn báo",S(34,34,C(0,0,14)+L("M-10 -10L10 10M10 -10L-10 10","thin"))],
 ["C — Nút ESD (nấm)",S(34,36,`<path class="body" d="M-14 0Q0 -22 14 0Z"/>`+R(-8,0,16,12,"body")+T(0,10,"E",9))],
 ["D — Cảm biến lửa (FD)",S(34,34,C(0,0,14)+`<path class="solid" d="M0 -8Q-7 0 -3 6H3Q7 0 0 -8Z"/>`)],
 ["E — Cảm biến khí (GD)",S(34,34,C(0,0,14)+T(0,4,"GD",9))],
 ["F — Cảm biến khói (SD)",S(34,34,C(0,0,14)+T(0,4,"SD",9))]
]);

/* ===== ĐIỆN / TỦ ĐIỀU KHIỂN ===== */
function box(key,label,prefix,items){reg(key,label,"Điện / Tủ điều khiển",prefix,items.map(i=>[i[0],S(i[1]||72,i[2]||44,R(-(i[1]||72)/2,-(i[2]||44)/2,i[1]||72,i[2]||44,"body",i[4]||2)+T(0,5,i[3],11))]))}
box("cabinet","Tủ điều khiển","CAB",[["A — DCS",76,44,"DCS"],["B — PLC",76,44,"PLC"],["C — ESD / SIS",76,44,"ESD"],["D — RTU",76,44,"RTU"],["E — F&G panel",76,44,"F&amp;G"],["F — Hộp nối (JB)",56,36,"JB"]]);
reg("hmi","Trạm vận hành / HMI","Điện / Tủ điều khiển","HMI",[
 ["A — HMI",S(56,48,R(-26,-20,52,32,"body",3)+L("M-10 20H10M0 12V20")+L("M-18 -12H18M-18 -4H8","thin"))],
 ["B — Panel cục bộ (LCP)",S(60,48,R(-28,-22,56,44,"body",2)+C(-14,-8,5)+C(2,-8,5)+L("M-20 10H20","thin"))]
]);
reg("power","MCC / Máy biến áp / UPS","Điện / Tủ điều khiển","MCC",[
 ["A — MCC",S(60,44,R(-30,-22,60,44,"body")+L("M-10 -22V22M10 -22V22")+T(0,5,"MCC",10))],
 ["B — Biến áp",S(52,40,C(-8,0,14)+C(8,0,14))],
 ["C — UPS / Ắc quy",S(52,40,R(-26,-18,52,36,"body")+L("M-10 -8V8M-4 -4V4M2 -8V8M8 -4V4")+T(0,16,"UPS",8))],
 ["D — Cầu dao / Switchgear",S(50,40,R(-25,-18,50,36,"body")+L("M-14 0H-4L8 -8M8 0H14","thin"))]
]);

/* ===== GIẾNG / PACKAGE / XUẤT NHẬP ===== */
reg("wellhead","Đầu giếng (Xmas tree)","Giếng / Package / Xuất nhập","WH",[
 ["A — Cây thông",S(50,82,R(-5,-6,10,44,"body")+L("M-20 -22H20")+`<path class="body" d="M-20 -22H-5V-10H-20ZM5 -22H20V-10H5Z"/>`+R(-8,-36,16,14,"body")+R(-12,38,24,10,"grey"),[{id:"w",x:-20,y:-16,d:"w"},{id:"e",x:20,y:-16,d:"e"},{id:"n",x:0,y:-36,d:"n"},{id:"s",x:0,y:48,d:"s"}])],
 ["B — Đầu giếng đơn giản",S(40,60,R(-6,-20,12,50,"body")+R(-14,-30,28,10,"grey")+L("M6 -10H20"),[{id:"w",x:-6,y:0,d:"w"},{id:"e",x:20,y:-10,d:"e"},{id:"n",x:0,y:-30,d:"n"},{id:"s",x:0,y:30,d:"s"}])]
]);
reg("choke","Van tiết lưu (choke)","Giếng / Package / Xuất nhập","CK",[
 ["A — Choke",S(40,36,`<path class="body" d="M-18 -10L18 10V-10L-18 10Z"/>`+L("M0 0V-14M-8 -14H8")+L("M-4 6L4 6","thin"))],
 ["B — Choke điều chỉnh được",S(40,44,`<path class="body" d="M-18 -10L18 10V-10L-18 10Z"/>`+L("M0 0V-14")+`<path class="body" d="M-12 -14A12 12 0 0 1 12 -14Z"/>`+L("M-6 -4L6 6","thin"),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"n",x:0,y:-26,d:"n"},{id:"s",x:0,y:10,d:"s"}])]
]);
reg("manifold","Manifold / Header","Giếng / Package / Xuất nhập","MF",[
 ["A — Header 4 nhánh",S(160,40,R(-80,-8,160,16,"body",3)+[-60,-20,20,60].map(x=>L(`M${x} -8V-20`)).join(""),[{id:"w",x:-80,y:0,d:"w"},{id:"e",x:80,y:0,d:"e"},{id:"n",x:-60,y:-20,d:"n"},{id:"s",x:60,y:8,d:"s"},{id:"n2",x:-20,y:-20,d:"n"},{id:"n3",x:20,y:-20,d:"n"},{id:"n4",x:60,y:-20,d:"n"},{id:"s2",x:-60,y:8,d:"s"},{id:"s3",x:-20,y:8,d:"s"},{id:"s4",x:20,y:8,d:"s"}])],
 ["B — Header dọc",S(40,140,R(-8,-60,16,120,"body",3)+[-40,-10,20,50].map(y=>L(`M8 ${y}H20`)).join(""),[{id:"n",x:0,y:-60,d:"n"},{id:"s",x:0,y:60,d:"s"},{id:"e",x:20,y:-40,d:"e"},{id:"e2",x:20,y:-10,d:"e"},{id:"e3",x:20,y:20,d:"e"},{id:"e4",x:20,y:50,d:"e"},{id:"w",x:-8,y:0,d:"w"}])]
]);
reg("pig","Pig launcher / receiver","Giếng / Package / Xuất nhập","PL",[
 ["A — Launcher",S(92,32,R(-46,-6,48,12,"body")+`<path class="body" d="M2 -6L18 -16V16L2 6Z"/>`+R(18,-16,28,32,"body"),[{id:"w",x:-46,y:0,d:"w"},{id:"e",x:46,y:0,d:"e"},{id:"n",x:32,y:-16,d:"n"},{id:"s",x:32,y:16,d:"s"}])],
 ["B — Receiver",S(92,32,R(-46,-16,28,32,"body")+`<path class="body" d="M-18 -16L-2 -6V6L-18 16Z"/>`+R(-2,-6,48,12,"body"),[{id:"w",x:-46,y:0,d:"w"},{id:"e",x:46,y:0,d:"e"},{id:"n",x:-32,y:-16,d:"n"},{id:"s",x:-32,y:16,d:"s"}])]
]);
reg("skid","Skid / Package","Giếng / Package / Xuất nhập","PK",[
 ["A — Skid đo đếm (LACT)",S(90,52,R(-45,-26,90,52,"body")+L("M-45 -26L-33 -14M45 -26L33 -14","thin")+T(0,5,"LACT",11))],
 ["B — Skid hoá chất",S(80,50,R(-40,-25,80,50,"body")+R(-28,-14,24,28,"body",3)+R(4,-14,24,28,"body",3))],
 ["C — Package chung",S(90,52,R(-45,-26,90,52,"body")+L("M-45 -26H45","thin")+T(0,10,"PKG",12))],
 ["D — Skid đo ngoài (bơm + lưu lượng)",S(90,52,R(-45,-26,90,52,"body")+C(-20,0,12)+R(2,-10,28,20,"body",3))]
]);
reg("loading","Xuất nhập (xe / tàu / toa)","Giếng / Package / Xuất nhập","LD",[
 ["A — Cần xuất (loading arm)",S(60,60,L("M-30 0H-4L16 -20H30")+C(-4,0,4,"solid")+C(16,-20,3,"solid"),[{id:"w",x:-30,y:0,d:"w"},{id:"e",x:30,y:-20,d:"e"},{id:"n",x:16,y:-20,d:"n"},{id:"s",x:-4,y:0,d:"s"}])],
 ["B — Xe bồn",S(100,44,R(-34,-14,68,24,"body",12)+R(-50,-6,16,16,"body",2)+C(-40,14,6)+C(-8,14,6)+C(18,14,6)+L("M-50 14H-46M-2 14H12","thin"),[{id:"w",x:-50,y:0,d:"w"},{id:"e",x:34,y:-2,d:"e"},{id:"n",x:0,y:-14,d:"n"},{id:"s",x:0,y:20,d:"s"}])],
 ["C — Tàu / Jetty",S(120,50,`<path class="body" d="M-60 -6H60L48 14H-48Z"/>`+R(-20,-22,36,16,"body")+L("M-60 -6H-70"),[{id:"w",x:-60,y:-6,d:"w"},{id:"e",x:60,y:-6,d:"e"},{id:"n",x:0,y:-22,d:"n"},{id:"s",x:0,y:14,d:"s"}])],
 ["D — Toa tàu hoả",S(100,36,R(-40,-12,80,22,"body",10)+C(-26,16,5)+C(-10,16,5)+C(10,16,5)+C(26,16,5)+L("M-50 4H-40M40 4H50"),[{id:"w",x:-50,y:4,d:"w"},{id:"e",x:50,y:4,d:"e"},{id:"n",x:0,y:-12,d:"n"},{id:"s",x:0,y:21,d:"s"}])]
]);
reg("pipeline","Đường ống / Riser / SSIV","Giếng / Package / Xuất nhập","PL",[
 ["A — Pipeline (đoạn dài)",S(140,20,L("M-70 -5H70M-70 5H70","body")+L("M-70 -5V5M70 -5V5","thin"),IW(140,10))],
 ["B — Riser",S(24,100,L("M-5 -50V50M5 -50V50","body")+L("M-5 40L-14 50M5 40L14 50","thin"),[{id:"n",x:0,y:-50,d:"n"},{id:"s",x:0,y:50,d:"s"},{id:"w",x:-5,y:0,d:"w"},{id:"e",x:5,y:0,d:"e"}])],
 ["C — Cắt ngắt (break)",S(40,30,L("M-20 -6H-8L-2 6L2 -6L8 6H20","thin"),PW(40,30))]
]);

/* ===== DÒNG VÀO / RA & NỐI ===== */
reg("feed","Dòng vào (Feed)","Dòng vào / ra & nối","",[
 ["A — Mũi tên",S(78,26,`<path class="body" d="M-39 -13H20L39 0L20 13H-39Z"/>`,[{id:"e",x:39,y:0,d:"e"},{id:"w",x:-39,y:0,d:"w"}])],
 ["B — Hình tròn",S(40,40,C(0,0,18)+L("M-8 0H8M3 -5L8 0L3 5","thin"),[{id:"e",x:18,y:0,d:"e"},{id:"w",x:-18,y:0,d:"w"},{id:"n",x:0,y:-18,d:"n"},{id:"s",x:0,y:18,d:"s"}])],
 ["C — Tam giác",S(46,36,`<path class="body" d="M-23 -18L23 0L-23 18Z"/>`,[{id:"e",x:23,y:0,d:"e"},{id:"w",x:-23,y:0,d:"w"}])]
]);
reg("product","Dòng ra (Product)","Dòng vào / ra & nối","",[
 ["A — Mũi tên",S(78,26,`<path class="body" d="M-20 -13H39V13H-20L-39 0Z"/>`,[{id:"w",x:-39,y:0,d:"w"},{id:"e",x:39,y:0,d:"e"}])],
 ["B — Hình tròn",S(40,40,C(0,0,18)+L("M-8 0H8M3 -5L8 0L3 5","thin"),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"n",x:0,y:-18,d:"n"},{id:"s",x:0,y:18,d:"s"}])],
 ["C — Tam giác",S(46,36,`<path class="body" d="M23 -18L-23 0L23 18Z"/>`,[{id:"e",x:23,y:0,d:"e"},{id:"w",x:-23,y:0,d:"w"}])]
]);
reg("offpage","Ký hiệu nối bản vẽ","Dòng vào / ra & nối","OP",[
 ["A — Đến bản vẽ khác",S(56,34,`<path class="body" d="M-28 -17H8L28 0L8 17H-28Z"/>`,[{id:"w",x:-28,y:0,d:"w"},{id:"e",x:28,y:0,d:"e"},{id:"n",x:0,y:-17,d:"n"},{id:"s",x:0,y:17,d:"s"}])],
 ["B — Từ bản vẽ khác",S(56,34,`<path class="body" d="M-8 -17H28V17H-8L-28 0Z"/>`,[{id:"w",x:-28,y:0,d:"w"},{id:"e",x:28,y:0,d:"e"},{id:"n",x:0,y:-17,d:"n"},{id:"s",x:0,y:17,d:"s"}])],
 ["C — Vòng số hiệu",S(40,40,C(0,0,18),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"n",x:0,y:-18,d:"n"},{id:"s",x:0,y:18,d:"s"}])],
 ["D — Điểm nối (tie-in)",S(44,40,`<path class="body" d="M-22 0L-11 -18H11L22 0L11 18H-11Z"/>`)]
]);
reg("junction","Điểm rẽ nhánh (tee)","Dòng vào / ra & nối","",[
 ["A — Chấm",S(10,10,C(0,0,4,"solid"),[{id:"w",x:-5,y:0,d:"w"},{id:"e",x:5,y:0,d:"e"},{id:"n",x:0,y:-5,d:"n"},{id:"s",x:0,y:5,d:"s"}])],
 ["B — Chấm lớn",S(16,16,C(0,0,6,"solid"),[{id:"w",x:-8,y:0,d:"w"},{id:"e",x:8,y:0,d:"e"},{id:"n",x:0,y:-8,d:"n"},{id:"s",x:0,y:8,d:"s"}])]
],{nolabel:true});

/* ===== CHÚ THÍCH ===== */
reg("text","Khung chữ / Ghi chú","Chú thích","",[["A — Chữ",S(110,36,"",[])]]);
reg("area","Khung ranh giới / Package","Chú thích","",[["A — Gạch chấm",S(110,60,"",[])]]);
reg("note","Ghi chú / Hold / Revision","Chú thích","",[
 ["A — Nhãn ghi chú",S(90,40,`<path class="body" d="M-45 -20H33L45 -8V20H-45Z"/>`+L("M33 -20V-8H45"))],
 ["B — Hold (△)",S(40,40,`<path class="body" d="M0 -18L18 16H-18Z"/>`+T(0,10,"H",12))],
 ["C — Revision (△)",S(40,40,`<path class="body" d="M0 -18L18 16H-18Z"/>`+T(0,10,"1",12))],
 ["D — Mũi tên chỉ hướng",S(60,26,`<path class="solid" d="M-28 -4H10V-10L28 0L10 10V4H-28Z"/>`,[])]
],{nolabel:false});
const INSERTABLE=["valve_gate","valve_ball","valve_globe","valve_butterfly","valve_check","valve_control","valve_esd","valve_reg","valve_sol","pump","pd_pump","exchanger","plate_hx","condenser","filter_dummy","aircooler","heater","strainer","orifice","flowmeter","reducer","arrestor","spec_blind","flange","sight","junction","blower","agitator"].filter(k=>SYMBOLS[k]);
