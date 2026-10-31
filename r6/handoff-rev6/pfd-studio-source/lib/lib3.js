/* ===== Bổ sung: phin lọc + bản đồ tương thích với file cũ ===== */
reg("filter","Phin lọc / Filter","Bình / Tháp","F",[
 ["A — Phin lọc đứng",S(44,58,R(-22,-29,44,58,"body",10)+L("M-22 -6H22","dash"))],
 ["B — Cartridge",S(44,64,R(-22,-32,44,64,"body",6)+L("M-10 -18V18M0 -18V18M10 -18V18M-10 18H10","thin"))],
 ["C — Lọc ngang",S(80,36,HS(-40,40,-18,18)+L("M-12 -18V18M12 -18V18")+L("M-12 0H12","dash"))],
 ["D — Lọc than hoạt tính",S(50,64,R(-25,-32,50,64,"body",10)+L("M-25 -8H25M-25 8H25")+C(-10,-20,2,"solid")+C(10,-20,2,"solid"))]
]);
const LEGACY={mixer:["agitator",2],valve_3way:["valve_ball",2],filter:["filter",0]};
