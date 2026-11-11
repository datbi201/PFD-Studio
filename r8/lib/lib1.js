/* ===== BƠM ===== */
const PORT_WE_N=(w,h,yn)=>[{id:"w",x:-w/2,y:0,d:"w"},{id:"e",x:w/2,y:0,d:"e"},{id:"n",x:0,y:yn,d:"n"},{id:"s",x:0,y:h/2,d:"s"}];
reg("pump","Bơm ly tâm","Bơm","P",[
 ["A — Tròn + tam giác",S(48,40,C(0,0,18)+L("M0 -16L16 12H-16ZM-24 0H-18M18 0H24"))],
 ["B — ISO (đẩy lên trên)",S(48,46,C(0,4,18)+L("M0 -14V-22M0 -22H24")+L("M-24 4H-18"),[{id:"w",x:-24,y:4,d:"w"},{id:"e",x:24,y:-22,d:"e"},{id:"n",x:0,y:-22,d:"n"},{id:"s",x:0,y:22,d:"s"}])],
 ["C — Volute (cổ ra phía trên)",S(54,50,`<path class="body" d="M-18 -4A18 18 0 1 0 14 -12L24 -22H-6V-12A18 18 0 0 0 -18 -4Z"/>`+L("M-26 4H-18"),[{id:"w",x:-26,y:4,d:"w"},{id:"e",x:24,y:-22,d:"e"},{id:"n",x:9,y:-22,d:"n"},{id:"s",x:0,y:22,d:"s"}])],
 ["D — Bơm + động cơ",S(86,40,C(-18,0,18)+L("M-18 -16L-2 12H-34Z")+R(0,-12,32,24,"body")+T(16,4,"M",11)+L("M-36 0H-42"),[{id:"w",x:-36,y:0,d:"w"},{id:"e",x:32,y:0,d:"e"},{id:"n",x:-18,y:-18,d:"n"},{id:"s",x:-18,y:18,d:"s"}])],
 ["E — Bơm đứng (sump)",S(40,100,R(-8,-30,16,70,"body")+C(0,-44,14)+L("M-14 -44H14M0 -58V-30","thin")+R(-12,40,24,14,"body",3),[{id:"w",x:-14,y:-44,d:"w"},{id:"e",x:14,y:-44,d:"e"},{id:"n",x:0,y:-58,d:"n"},{id:"s",x:0,y:54,d:"s"}])],
 ["F — Bơm chìm (ESP)",S(34,100,R(-8,-48,16,96,"body",5)+L("M-8 -28H8M-8 -8H8M-8 12H8M-8 32H8"))]
]);
reg("pd_pump","Bơm thể tích / định lượng","Bơm","P",[
 ["A — Bánh răng",S(48,40,C(0,0,18)+C(-6,0,6,"thin")+C(6,0,6,"thin")+L("M-24 0H-18M18 0H24"))],
 ["B — Piston (reciprocating)",S(54,40,R(-18,-14,36,28,"body",3)+L("M-6 -14V14M6 -14V14M-18 0H-24M18 0H24"))],
 ["C — Trục vít",S(54,40,R(-18,-14,36,28,"body",14)+L("M-12 -8L-4 8M-4 -8L4 8M4 -8L12 8M-24 0H-18M18 0H24"))],
 ["D — Màng (diaphragm)",S(48,40,C(0,0,18)+L("M-12 0Q0 -14 12 0")+L("M-24 0H-18M18 0H24"))],
 ["E — Trục vít xoắn (PCP)",S(60,40,R(-24,-12,48,24,"body",12)+L("M-14 -6Q-8 6 -2 -6T10 -6M-30 0H-24M24 0H30"),PW(60,40))],
 ["F — Định lượng (metering)",S(44,44,C(0,4,16)+L("M0 -12V-24M-8 -24H8")+L("M-8 4H8M0 -4V12"),[{id:"w",x:-16,y:4,d:"w"},{id:"e",x:16,y:4,d:"e"},{id:"n",x:0,y:-24,d:"n"},{id:"s",x:0,y:20,d:"s"}])]
]);
reg("vac_pump","Bơm chân không / Ejector","Bơm","VP",[
 ["A — Bơm chân không",S(48,40,C(0,0,18)+T(0,4,"V",11)+L("M-24 0H-18M18 0H24"))],
 ["B — Ejector",S(70,30,`<path class="body" d="M-35 -8H-10L5 -4H35V4H5L-10 8H-35Z"/>`,[{id:"w",x:-35,y:0,d:"w"},{id:"e",x:35,y:0,d:"e"},{id:"n",x:-12,y:-8,d:"n"},{id:"s",x:-12,y:8,d:"s"}])]
]);

/* ===== MÁY NÉN / QUẠT / TURBINE / ĐỘNG CƠ ===== */
reg("compressor","Máy nén","Máy nén / Quạt / Turbine","K",[
 ["A — Ly tâm (hình thang)",S(62,44,`<path class="body" d="M-28 -20H16L30 0L16 20H-28Z"/>`+L("M-28 0H30"))],
 ["B — Ly tâm (ISO)",S(60,52,`<path class="body" d="M-30 -26L30 -14V14L-30 26Z"/>`,[{id:"w",x:-30,y:0,d:"w"},{id:"e",x:30,y:0,d:"e"},{id:"n",x:0,y:-20,d:"n"},{id:"s",x:0,y:20,d:"s"}])],
 ["C — Piston (reciprocating)",S(70,50,C(-12,0,18)+R(6,-8,30,16,"body")+L("M-12 -18V-26M-12 18V26"),[{id:"w",x:-30,y:0,d:"w"},{id:"e",x:36,y:0,d:"e"},{id:"n",x:-12,y:-26,d:"n"},{id:"s",x:-12,y:26,d:"s"}])],
 ["D — Trục vít",S(60,44,R(-28,-18,56,36,"body",16)+L("M-18 -10L-8 10M-8 -10L2 10M2 -10L12 10"))],
 ["E — Hướng trục",S(70,46,`<path class="body" d="M-35 -10L35 -22V22L-35 10Z"/>`+L("M-20 -9V9M-6 -12V12M8 -15V15M22 -18V18"),[{id:"w",x:-35,y:0,d:"w"},{id:"e",x:35,y:0,d:"e"},{id:"n",x:0,y:-17,d:"n"},{id:"s",x:0,y:17,d:"s"}])],
 ["F — Máy nén + động cơ",S(110,46,`<path class="body" d="M-52 -20H-8L6 0L-8 20H-52Z"/>`+L("M-52 0H6")+R(10,-14,40,28,"body")+T(30,5,"M",13),[{id:"w",x:-52,y:0,d:"w"},{id:"e",x:50,y:0,d:"e"},{id:"n",x:-24,y:-20,d:"n"},{id:"s",x:-24,y:20,d:"s"}])]
]);
reg("blower","Quạt / Blower","Máy nén / Quạt / Turbine","FN",[
 ["A — Quạt hướng trục",S(44,44,C(0,0,20)+L("M0 0L8 -14M0 0L-14 -6M0 0L6 14"))],
 ["B — Blower ly tâm",S(48,44,C(0,0,18)+L("M0 0L10 -14M0 0L-12 -8M0 0L2 16")+L("M18 -18H34"),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:34,y:-18,d:"e"},{id:"n",x:0,y:-18,d:"n"},{id:"s",x:0,y:18,d:"s"}])]
]);
reg("expander","Turbine / Expander","Máy nén / Quạt / Turbine","K",[
 ["A — Turbo-expander",S(62,44,`<path class="body" d="M-30 -14H14L30 -22V22L14 14H-30Z"/>`)],
 ["B — Turbine hơi",S(62,44,`<path class="body" d="M-30 -14L30 -22V22L-30 14Z"/>`+T(0,4,"ST",10),[{id:"w",x:-30,y:0,d:"w"},{id:"e",x:30,y:0,d:"e"},{id:"n",x:0,y:-18,d:"n"},{id:"s",x:0,y:18,d:"s"}])],
 ["C — Turbine khí (GT)",S(100,50,`<path class="body" d="M-50 -24L-10 -14V14L-50 24Z"/>`+R(-10,-12,22,24,"body",4)+`<path class="body" d="M12 -14L50 -24V24L12 14Z"/>`,[{id:"w",x:-50,y:0,d:"w"},{id:"e",x:50,y:0,d:"e"},{id:"n",x:1,y:-17,d:"n"},{id:"s",x:1,y:17,d:"s"}])]
]);
reg("motor","Động cơ / Máy phát","Máy nén / Quạt / Turbine","M",[
 ["A — Động cơ điện (M)",S(40,40,C(0,0,18)+T(0,5,"M",14))],
 ["B — Máy phát (G)",S(40,40,C(0,0,18)+T(0,5,"G",14))],
 ["C — Động cơ đốt trong",S(46,40,R(-22,-18,44,36,"body",4)+T(0,5,"E",14))],
 ["D — Hộp số",S(40,32,R(-20,-16,40,32,"body")+C(-6,0,7,"thin")+C(7,0,5,"thin"))],
 ["E — Biến tần (VFD)",S(40,36,R(-20,-18,40,36,"body")+L("M-12 4Q-6 -8 0 4T12 4"))]
]);
reg("agitator","Máy khuấy / Mixer","Máy nén / Quạt / Turbine","AG",[
 ["A — Cánh khuấy",S(40,70,L("M0 -34V26")+L("M-14 26H14M-10 18H10","solid")+C(0,-40,6,"body"),[{id:"w",x:-6,y:-40,d:"w"},{id:"e",x:6,y:-40,d:"e"},{id:"n",x:0,y:-46,d:"n"},{id:"s",x:0,y:28,d:"s"}])],
 ["B — Mixer tĩnh",S(70,26,R(-35,-12,70,24,"body")+L("M-25 -12L-15 12M-5 -12L5 12M15 -12L25 12"))],
 ["C — Điểm trộn",S(44,44,C(0,0,20)+L("M-12 -12L12 12M12 -12L-12 12"))]
]);

/* ===== VAN ===== */
const ACT_D=(y)=>`<path class="body" d="M-11 ${y}A11 11 0 0 1 11 ${y}Z"/>`;
const ACT_P=(y)=>R(-9,y-16,18,16,"body")+L(`M-9 ${y-8}H9`);
const ACT_M=(y)=>C(0,y-9,9)+T(0,y-6,"M",10);
const ACT_S=(y)=>`<path class="body" d="M-11 ${y}A11 11 0 0 1 11 ${y}Z"/>`+L(`M-6 ${y-9}L6 ${y-9}M-5 ${y-6}L5 ${y-6}`);
const VP=(a,ytop,ybot)=>[{id:"w",x:-a,y:0,d:"w"},{id:"e",x:a,y:0,d:"e"},{id:"n",x:0,y:ytop,d:"n"},{id:"s",x:0,y:ybot,d:"s"}];
const VS=(a,hh,extra,ytop)=>S(a*2,Math.abs(ytop||-hh)+hh,`<path class="body" d="${BOW(a,hh)}"/>`+(extra||""),VP(a,ytop===undefined?-hh:ytop,hh));
reg("valve_gate","Van cổng (gate)","Van","HV",[
 ["A — Ký hiệu chuẩn",VS(18,10)],
 ["B — Có tay quay",VS(18,10,L("M0 0V-16M-7 -16H7"),-16)],
 ["C — Khóa (LO/LC)",VS(18,10,L("M0 0V-12")+R(-4,-20,8,8,"solid"),-20)]
]);
reg("valve_ball","Van bi (ball)","Van","HV",[
 ["A — Chấm đặc",VS(18,10,C(0,0,3.5,"solid"))],
 ["B — Tay gạt",VS(18,10,C(0,0,3.5,"solid")+L("M0 0V-12M-8 -12H8"),-12)],
 ["C — Van bi 3 ngả",S(36,36,`<path class="body" d="M-18 -10L0 0L-18 10ZM18 -10L0 0L18 10ZM-10 18L0 0L10 18Z"/>`+C(0,0,3.5,"solid"),[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"s",x:0,y:18,d:"s"},{id:"n",x:0,y:-10,d:"n"}])]
]);
reg("valve_globe","Van cầu (globe)","Van","HV",[
 ["A — Vòng tròn",VS(18,10,C(0,0,4.5))],
 ["B — Có tay quay",VS(18,10,C(0,0,4.5)+L("M0 -4.5V-16M-7 -16H7"),-16)]
]);
reg("valve_butterfly","Van bướm","Van","HV",[
 ["A — Vạch đứng",VS(18,10,L("M0 -10V10"))],
 ["B — Cánh bướm",VS(18,10,`<path class="body" d="M-3 -8Q0 0 -3 8L3 8Q0 0 3 -8Z"/>`.replace("body","thin"))]
]);
reg("valve_plug","Van nút / Needle","Van","HV",[
 ["A — Van nút (plug)",VS(18,10,`<path class="thin" d="M-4 -6L4 -6L0 4Z"/>`)],
 ["B — Van kim (needle)",VS(18,10,L("M0 0V-10M-5 -10H5M-3 -3L0 4L3 -3"),-10)]
]);
reg("valve_check","Van một chiều","Van","CV",[
 ["A — Cơ bản",S(36,22,`<path class="body" d="M-18 -11L6 0L-18 11Z"/>`+L("M8 -11V11M6 0H18"),PW(36,22).concat([{id:"n",x:0,y:-11,d:"n"},{id:"s",x:0,y:11,d:"s"}]))],
 ["B — Swing check",S(36,22,`<path class="body" d="M-18 -10L18 10V-10L-18 10Z"/>`+L("M0 -10V0M0 0L8 6"))],
 ["C — Wafer (dual plate)",S(36,24,R(-4,-12,8,24,"body")+L("M-18 0H-4M4 0H18")+L("M-4 -12L4 0L-4 12","thin"))]
]);
reg("valve_control","Van điều khiển","Van","PV",[
 ["A — Màng (diaphragm)",S(38,38,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V-1")+ACT_D(-1),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-12,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["B — Piston",S(38,44,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V0")+ACT_P(0),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-16,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["C — Động cơ (motor)",S(38,44,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V0")+ACT_M(0),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-18,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["D — Có positioner",S(48,44,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V-1")+ACT_D(-1)+R(8,-12,12,9,"body")+L("M11 -7H17"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-12,d:"n"},{id:"s",x:0,y:19,d:"s"}])]
]);
reg("valve_esd","Van ESD / SDV / BDV","Van","XV",[
 ["A — Màng + lò xo (SDV)",S(38,38,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V-1")+ACT_S(-1),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-12,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["B — Piston + lò xo",S(38,44,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V0")+ACT_P(0)+L("M-4 -14L4 -10L-4 -6"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-16,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["C — Van bi + solenoid (ESDV)",S(38,44,`<path class="body" d="${BOWY(19,10,9)}"/>`+C(0,9,3.5,"solid")+L("M0 9V0")+R(-9,-14,18,14,"body")+L("M-5 -14L5 0M5 -14L-5 0"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-14,d:"n"},{id:"s",x:0,y:19,d:"s"}])]
]);
reg("valve_psv","Van an toàn PSV","Van","PSV",[
 ["A — Góc, lò xo",S(40,48,`<path class="body" d="M-9 22H9L0 8ZM0 8L16 -2V18Z"/>`+L("M0 8V-6L-5 -9L5 -13L-5 -17L5 -21L0 -24"),[{id:"s",x:0,y:22,d:"s"},{id:"e",x:16,y:8,d:"e"},{id:"n",x:0,y:-24,d:"n"}])],
 ["B — Thẳng, lò xo",S(36,56,`<path class="body" d="M-10 24L10 24L0 10Z"/>`+`<path class="body" d="M-10 -4H10L0 10Z"/>`+L("M0 -4V-12L-5 -15L5 -19L-5 -23L5 -27L0 -30"),[{id:"s",x:0,y:24,d:"s"},{id:"n",x:0,y:-30,d:"n"},{id:"e",x:10,y:3,d:"e"},{id:"w",x:-10,y:3,d:"w"}])],
 ["C — Pilot-operated",S(56,56,`<path class="body" d="M-9 22H9L0 8ZM0 8L16 -2V18Z"/>`+L("M0 8V-6L-5 -9L5 -13L-5 -17L5 -21L0 -24")+C(22,-18,7,"body")+L("M16 -2L22 -11M0 -14H15L22 -11"),[{id:"s",x:0,y:22,d:"s"},{id:"e",x:16,y:8,d:"e"},{id:"n",x:0,y:-24,d:"n"}])]
]);
reg("valve_rd","Đĩa nổ / Rupture disc","Van","RD",[
 ["A — Rupture disc",S(34,26,L("M-17 0H-8M8 0H17")+`<path class="body" d="M-8 -11Q4 0 -8 11M8 -11Q-4 0 8 11"/>`,PW(34,26))]
]);
reg("valve_reg","Van giảm áp / PCV tự lực","Van","PCV",[
 ["A — Tự lực (lò xo)",S(38,38,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V-1")+ACT_D(-1)+L("M-14 -1L14 -1M0 -1V-6","thin"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-12,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["B — Back-pressure",S(38,38,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V-1")+ACT_D(-1)+L("M-14 -8L14 -8"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-12,d:"n"},{id:"s",x:0,y:19,d:"s"}])]
]);
reg("valve_sol","Van điện từ / Float","Van","SV",[
 ["A — Solenoid",S(38,38,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V0")+R(-8,-14,16,14,"body")+L("M-5 -11L5 -3M5 -11L-5 -3","thin"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-14,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["B — Float valve",S(40,44,`<path class="body" d="${BOWY(19,10,9)}"/>`+L("M0 9V-4L12 -4")+C(15,-4,4,"body"),[{id:"w",x:-19,y:9,d:"w"},{id:"e",x:19,y:9,d:"e"},{id:"n",x:0,y:-8,d:"n"},{id:"s",x:0,y:19,d:"s"}])],
 ["C — Van 4 ngả",S(40,40,`<path class="body" d="M-18 -10L0 0L-18 10ZM18 -10L0 0L18 10ZM-10 18L0 0L10 18ZM-10 -18L0 0L10 -18Z"/>`,[{id:"w",x:-18,y:0,d:"w"},{id:"e",x:18,y:0,d:"e"},{id:"s",x:0,y:18,d:"s"},{id:"n",x:0,y:-18,d:"n"}])]
]);
reg("vent_valve","PVRV / Breather","Van","PV",[
 ["A — PV valve",S(36,44,`<path class="body" d="M-10 22H10L0 8ZM-10 -8H10L0 8Z"/>`+L("M-6 -12H6M-4 -16H4"),[{id:"s",x:0,y:22,d:"s"},{id:"n",x:0,y:-16,d:"n"},{id:"e",x:10,y:7,d:"e"},{id:"w",x:-10,y:7,d:"w"}])],
 ["B — Vent mở",S(30,40,L("M0 20V-4")+`<path class="body" d="M-12 -4H12L0 -20Z"/>`,[{id:"s",x:0,y:20,d:"s"},{id:"n",x:0,y:-20,d:"n"},{id:"e",x:12,y:-4,d:"e"},{id:"w",x:-12,y:-4,d:"w"}])]
]);
const INS_ITEMS=[];
