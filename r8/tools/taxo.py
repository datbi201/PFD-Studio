# -*- coding: utf-8 -*-
import re,json
CLS={ # id: (vi,en)
'vessel':('Bình chịu áp','Pressure vessels'),
'column':('Tháp & lò phản ứng','Columns & reactors'),
'tank':('Bồn, bể & kho chứa','Tanks & storage'),
'pump':('Bơm','Pumps'),
'comp':('Máy nén, quạt & expander','Compressors, fans & expanders'),
'drive':('Động cơ & truyền động','Drivers & power'),
'hx':('Trao đổi nhiệt','Heat exchangers'),
'fired':('Lò, đốt & nồi hơi','Furnaces, burners & boilers'),
'valve':('Van','Valves'),
'act':('Cơ cấu chấp hành','Actuators'),
'sep':('Lọc & tách','Filtration & separation'),
'mix':('Khuấy & trộn','Agitation & mixing'),
'solid':('Xử lý chất rắn','Solids handling'),
'pipe':('Phụ kiện đường ống','Pipe fittings'),
'line':('Đường ống, dòng & tín hiệu','Lines, streams & signals'),
'inst':('Đo lường & điều khiển','Instruments & control'),
'elec':('Điện & tủ điều khiển','Electrical & panels'),
'hvac':('Thông gió & điều hoà','HVAC & ventilation'),
'upstream':('Giếng, giàn & hạ tầng khí','Wells, platforms & gas infrastructure'),
'transport':('Vận tải & xuất nhập','Transport & loading'),
'water':('Xử lý nước & môi trường','Water & environment'),
'misc':('Chú thích & khác','Notes & misc.'),
}
CLS_ORDER=['vessel','column','tank','pump','comp','drive','hx','fired','valve','act','sep','mix','solid','pipe','line','inst','elec','hvac','upstream','transport','water','misc']
# sub: (id, vi, en) ; id unique within class
def S(i,vi,en): return (i,vi,en)
SUB={
'vessel':[S('sep','Bình tách (separator)','Separators'),S('sep3','Bình tách 3 pha','Three-phase separators'),S('ko','Knock-out drum & scrubber','Knock-out drums & scrubbers'),S('drum','Bình chứa / drum (chung)','Vessels & drums (general)'),S('jacket','Bình có áo / cuộn gia nhiệt','Jacketed & coiled vessels'),S('sphere','Bình cầu','Spherical vessels'),S('cyl','Chai & bình khí nén','Gas cylinders & receivers'),S('slug','Slug catcher','Slug catchers')],
'column':[S('tray','Tháp đĩa','Tray columns'),S('packed','Tháp đệm / lớp cố định','Packed / fixed-bed columns'),S('fluid','Tháp tầng sôi','Fluidized-bed columns'),S('gen','Tháp (chung)','Columns (general)'),S('int','Đĩa & ruột tháp','Trays & internals'),S('react','Lò phản ứng','Reactors')],
'tank':[S('fixed','Bồn mái cố định','Fixed-roof tanks'),S('float','Bồn mái nổi','Floating-roof tanks'),S('open','Bồn hở & bể','Open tanks & basins'),S('sphere','Bồn cầu','Spherical tanks'),S('lng','Bồn lạnh / LNG','Cryogenic / LNG tanks'),S('cone','Bồn & bunke đáy côn','Conical-bottom tanks & bunkers'),S('silo','Silo, phễu & kho rời','Silos, hoppers & bulk storage'),S('pack','Thùng phuy, bao & container','Drums, bags & containers'),S('gen','Bồn chứa (chung)','Tanks (general)')],
'pump':[S('cent','Bơm ly tâm','Centrifugal pumps'),S('recip','Bơm piston / plunger','Reciprocating pumps'),S('rot','Bơm quay (bánh răng, trục vít, khoang)','Rotary pumps (gear, screw, cavity)'),S('diaph','Bơm màng','Diaphragm pumps'),S('vac','Bơm chân không','Vacuum pumps'),S('jet','Bơm tia / ejector','Jet pumps / ejectors'),S('gen','Bơm (chung)','Pumps (general)')],
'comp':[S('cent','Máy nén ly tâm','Centrifugal compressors'),S('recip','Máy nén piston','Reciprocating compressors'),S('screw','Máy nén trục vít','Screw compressors'),S('rot','Máy nén quay (vòng lỏng, cánh gạt)','Rotary compressors'),S('multi','Máy nén nhiều cấp','Multi-stage compressors'),S('gen','Máy nén (chung)','Compressors (general)'),S('fan','Quạt & máy thổi','Fans & blowers'),S('exp','Turbine-expander','Turbo-expanders')],
'drive':[S('motor','Động cơ điện','Electric motors'),S('turb','Turbine hơi / khí','Steam / gas turbines'),S('engine','Động cơ đốt trong','Internal-combustion engines'),S('gen','Máy phát điện','Generators'),S('gear','Bánh răng & hộp số','Gears & gearboxes'),S('other','Truyền động khác','Other drivers')],
'hx':[S('st','Vỏ-ống (shell & tube)','Shell & tube'),S('plate','Tấm (plate)','Plate'),S('dp','Ống lồng ống / hairpin','Double-pipe / hairpin'),S('spiral','Xoắn / cuộn','Spiral / coil'),S('air','Làm mát bằng không khí','Air coolers / finned'),S('cond','Ngưng tụ, làm mát, gia nhiệt','Condensers, coolers & heaters'),S('reb','Reboiler & bay hơi','Reboilers & evaporators'),S('ct','Tháp giải nhiệt','Cooling towers'),S('gen','Ký hiệu TBTN chung','General HX symbols')],
'fired':[S('furn','Lò gia nhiệt / lò nung','Fired heaters / furnaces'),S('boiler','Nồi hơi & thu hồi nhiệt','Boilers & waste-heat'),S('burner','Đầu đốt & buồng đốt','Burners & combustion chambers'),S('flare','Đuốc đốt khí (flare)','Flares'),S('stack','Ống khói','Stacks & chimneys'),S('kiln','Lò nung / lò luyện','Kilns')],
'valve':[S('gate','Van cổng','Gate valves'),S('globe','Van cầu','Globe valves'),S('ball','Van bi','Ball valves'),S('bfly','Van bướm','Butterfly valves'),S('plug','Van nút & van kim','Plug & needle valves'),S('diaph','Van màng, pinch, dao, ống mềm','Diaphragm, pinch, knife & hose valves'),S('check','Van một chiều','Check valves'),S('ctrl','Van điều khiển','Control valves'),S('relief','Van an toàn / giảm áp / đĩa nổ','Safety, relief valves & rupture discs'),S('reg','Van điều áp (regulator)','Regulators'),S('way','Van 3 / 4 ngả','Three- & four-way valves'),S('esd','Van ESD / SDV / BDV','ESD / SDV / BDV valves'),S('oper','Van có cơ cấu vận hành (tay, mô-tơ, điện từ…)','Operated valves (manual, motor, solenoid…)'),S('gen','Van (chung / khác)','Valves (general / other)')],
'act':[S('diaph','Cơ cấu màng','Diaphragm actuators'),S('piston','Cơ cấu piston','Piston actuators'),S('motor','Cơ cấu mô-tơ','Motor actuators'),S('manual','Cơ cấu tay / cần gạt','Manual actuators'),S('sol','Cơ cấu điện từ','Solenoid actuators'),S('spring','Cơ cấu lò xo','Spring actuators'),S('gen','Cơ cấu (chung)','Actuators (general)')],
'sep':[S('liq','Bộ lọc lỏng','Liquid filters'),S('gas','Bộ lọc khí','Gas filters'),S('press','Lọc ép, băng, quay, lớp lỏng','Press, belt & rotary filters'),S('strain','Lưới lọc (strainer)','Strainers'),S('centr','Máy ly tâm','Centrifuges'),S('cyc','Xyclon & hydrocyclone','Cyclones & hydrocyclones'),S('esp','Tách tĩnh điện / từ','Electrostatic & magnetic'),S('screen','Sàng & lưới sàng','Screens & sieves'),S('scrub','Tháp rửa (scrubber)','Scrubbers'),S('memb','Màng lọc & tách khác','Membranes & other separators'),S('coal','Coalescer / demister','Coalescers & demisters')],
'mix':[S('agit','Máy khuấy (agitator)','Agitators'),S('static','Thiết bị trộn tĩnh / trên đường ống','Static & in-line mixers'),S('knead','Máy nhào & trộn khác','Kneaders & other mixers')],
'solid':[S('conv','Băng tải & vít tải','Conveyors'),S('lift','Gầu tải, thang nâng, cần cẩu','Elevators, lifts & cranes'),S('crush','Máy nghiền & đập','Crushers & mills'),S('dry','Thiết bị sấy','Dryers'),S('feed','Cấp liệu & định lượng','Feeders & proportioners'),S('shape','Ép, đùn, tạo hình','Presses, extruders & shaping'),S('scale','Cân','Scales'),S('pack','Đóng bao & pallet','Bagging & palletizing')],
'pipe':[S('red','Côn thu & chuyển bậc','Reducers & transitions'),S('fl','Mặt bích, khớp nối & mối nối','Flanges, couplings & joints'),S('blind','Mù & đĩa bịt','Blinds & blanks'),S('hose','Ống mềm & khớp giãn nở','Hoses & expansion joints'),S('trap','Bẫy hơi & xả','Steam traps & drains'),S('vent','Vent, thở & ống thông hơi','Vents & breathers'),S('arr','Chặn lửa','Flame arrestors'),S('sight','Kính quan sát','Sight glasses'),S('orif','Tấm tiết lưu','Orifices'),S('ejec','Ejector, vòi phun & phụ kiện khác','Ejectors, nozzles & other'),S('sil','Bộ tiêu âm','Silencers'),S('ins','Bảo ôn & gia nhiệt kèm','Insulation & tracing'),S('sup','Giá đỡ, cửa người & ổ nối','Supports, manholes & sockets'),S('elbow','Cút, tê & nối','Elbows, tees & joints')],
'line':[S('types','Các loại đường ống','Pipe line types'),S('sig','Tín hiệu & điều khiển','Signal lines'),S('conn','Nối bản vẽ & dòng vào/ra','Off-page & stream ends'),S('arrow','Mũi tên & chiều dòng','Arrows & flow direction'),S('junc','Giao cắt & rẽ nhánh','Crossings & junctions')],
'inst':[S('bubble','Vòng đo (bong bóng DCS / PLC / rời rạc)','Instrument bubbles (DCS / PLC / discrete)'),S('xmtr','Máy phát (transmitter)','Transmitters'),S('ind','Chỉ thị & ghi','Indicators & recorders'),S('ctrl','Bộ điều khiển','Controllers'),S('sw','Công tắc, báo động & SIS','Switches, alarms & SIS'),S('flow','Phần tử đo lưu lượng','Flow elements & meters'),S('level','Đo mức & phân tích','Level & analyzers'),S('func','Hàm chức năng','Function blocks'),S('misc','Khác','Other')],
'elec':[S('panel','Tủ điều khiển & HMI','Cabinets & HMI'),S('power','MCC, biến áp & UPS','MCC, transformers & UPS'),S('gen','Phát điện & lưu trữ','Power generation & storage')],
'hvac':[S('damp','Van chắn gió (damper)','Dampers'),S('duct','Ống gió','Ducts'),S('fan','Quạt thông gió','Ventilation fans'),S('treat','Xử lý không khí','Air treatment'),S('term','Miệng gió & lưới','Terminals & grilles'),S('ctrl','Điều khiển & cảm biến gió','Air controls & sensors'),S('sil','Tiêu âm','Silencers'),S('fit','Cút, tê & chuyển bậc','Elbows, tees & transitions'),S('hvac','HVAC / điều hoà','HVAC / air-conditioning')],
'upstream':[S('well','Đầu giếng, choke & manifold','Wellheads, chokes & manifolds'),S('plat','Giàn & thiết bị dưới biển','Platforms & subsea'),S('plant','Nhà máy xử lý khí / LNG','Gas plants / LNG'),S('stat','Trạm nén, điều áp & van','Compressor, PRS & valve stations'),S('term','Cảng, kho & kho ngầm','Terminals & storage'),S('pig','Pig, skid & tuyến ống','Pigs, skids & pipelines'),S('cons','Nhà máy điện & hộ tiêu thụ','Power plants & consumers')],
'transport':[S('road','Xe bồn, xe nâng','Trucks & vehicles'),S('rail','Tàu hỏa & toa bồn','Rail'),S('ship','Tàu & sà lan','Ships & barges'),S('load','Cần xuất nhập & container','Loading arms & containers')],
'water':[S('clar','Bể lắng, thickener & tuyển nổi','Clarifiers, thickeners & flotation'),S('aer','Xử lý nước & nước thải','Water & wastewater'),S('dust','Xử lý bụi & khí thải','Dust & flue-gas'),S('food','Bồn thực phẩm & lên men','Food & fermentation')],
'misc':[S('note','Chú thích & khung','Notes & frames'),S('sym','Ký hiệu chung / ISO 7000','General symbols'),S('char','Ký hiệu đặc tính (kiểu, nguyên lý)','Characteristic symbols'),S('other','Khác','Other')],
}
SUBIDX={c:{s[0]:s for s in v} for c,v in SUB.items()}

def R(pat,cls,sub): return (re.compile(pat),cls,sub)
RULES=[
# --- phi thiết bị / ký hiệu chung
R(r'iso 7000|^diode',  'misc','sym'),
R(r'characteristics |^wm (disc|electromagnetic|hammer|impact|jaw|roller|liquid) type',  'misc','char'),
R(r'\bwm (text|area|note)|annot',  'misc','note'),
# --- hvac (wm german)
R(r'klappe|damper|jalousie|beipass|berstr',  'hvac','damp'),
R(r'luftleitung|duct|flexible_luft',  'hvac','duct'),
R(r'ventilator|axialventilator|radialventilator|ventilator_konvektor|induktions',  'hvac','fan'),
R(r'luftfilter|luftk|lufterw|luftbefeuchter|luftmisch|mischkammer|luft_misch',  'hvac','treat'),
R(r'durchlass|wetterschutz|fortluft',  'hvac','term'),
R(r'regler|stellantrieb|messf|str_mungsgleich',  'hvac','ctrl'),
R(r'schalld',  'hvac','sil'),
R(r'bogen_90|abzweig|bergang|verteilungselement',  'hvac','fit'),
# --- actuators
R(r'actuator|^dp act|^dp act ',  'act',None),
# --- line / signals
R(r'signal |capillary',  'line','sig'),
R(r'offpage|connector offpage|^dp connector|feed$|^feed|product$|^product|^offpage|^junction',  'line','conn'),
R(r'line crossing|line junction|junction',  'line','junc'),
R(r'big arrow|flow direction|flowmotion|flow motion|slope$',  'line','arrow'),
R(r'^(wm|dp) (pipe|pipeline|secondary pipeline|line process|pipe insulated|pipe jacketed|pipe traced)|jacked pipeline',  'line','types'),
# --- valves (ngoại lệ trước)
R(r'tray.*valve|valve.*tray|valve type trays|tray valve|valve trays|valve_trays',  'column','int'),
R(r'rotary valve|feeder.*valve|valve type$|rotary_valve type',  'solid','feed'),
R(r'breather|pvrv',  'pipe','vent'),
R(r'rupture|relief|safety|psv|prv|pressure and vacuum',  'valve','relief'),
R(r'esd|sdv|bdv',  'valve','esd'),
R(r'regulator|pressure reducing|reducing valve|back pressure|differential pressure',  'valve','reg'),
R(r'solenoid|manual operated|manual valve|motor operated|motor valve|hydraulic|pneumatic|piston operated|hand wheel|electro hydraulic',  'valve','oper'),
R(r'three way|3 way|four way|4 way|valve3|diverter|three_way',  'valve','way'),
R(r'check|swing check|lift check|non return|back draft',  'valve','check'),
R(r'control valve|valve control|continuously operated|valve regulated|valve reg|choke',  'valve','ctrl'),
R(r'diaphragm valve|valves diaphragm|valve diaphragm|pinch|knife|hose type|piston or plunger|valve piston',  'valve','diaph'),
R(r'butterfly|valve disc',  'valve','bfly'),
R(r'gate valve|valve gate|gate type|valves gate',  'valve','gate'),
R(r'globe',  'valve','globe'),
R(r'ball valve|valve ball|ball type|ball valve',  'valve','ball'),
R(r'plug|needle|excess flow',  'valve','plug'),
R(r'valve|angle valve|stop check',  'valve','gen'),
]
RULES+=[
# --- instruments
R(r'function (summing|averaging|difference|multiplying|dividing|square|exponential|conversion|high|low|unspecified|bias)',  'inst','func'),
R(r'discrete instrument|dcs|plc|hardware interlock|^dp inst |inst (field|local|panel|computer|plc|shared|behind)|control function|computer function|pilot light',  'inst','bubble'),
R(r'transmitter',  'inst','xmtr'),
R(r'indicator|recorder|gauge(?! glass)|level gauge',  'inst','ind'),
R(r'controller|alarm',  'inst','ctrl'),
R(r'orifice element|flow element|venturi|flow nozzle|rotameter|turbine meter|turbine propeller|magnetic$|^rc magnetic|ultrasonic|vortex|pitot|wedge meter|flume|weir|positive displacement$|quick change|flow conditioning|restriction orifice|volume meter|flow (orifice|rotameter|turbine|venturi|magnetic)|^rc turbine$|flowmeter|^rc diaphragm$',  'inst','flow'),
R(r'analy[sz]er|level gauge glass|levelinst|level',  'inst','level'),
# --- fittings
R(r'reducer|concentric piping',  'pipe','red'),
R(r'spectacle|spade|blind|spacer|dummy cover|interchangeable disc|open disc|blank|figure 8',  'pipe','blind'),
R(r'hose|flexible pipe|compensator|expansion joint|flexible hose',  'pipe','hose'),
R(r'flange|coupling|welded connection|spool|\bcap$|^rc cap|^rc plug|breakthrough',  'pipe','fl'),
R(r'steam trap|drain funnel|self operating release|outlet steam gas|vent outlet|vent to atmosphere',  'pipe','trap'),
R(r'vent|siphon|gas vent|exhaust head|vent cover',  'pipe','vent'),
R(r'flame arrest|detonation|arrestor|arrester',  'pipe','arr'),
R(r'sight|viewing glass',  'pipe','sight'),
R(r'orifice plate',  'pipe','orif'),
R(r'silencer',  'pipe','sil'),
R(r'insulat|jacketed pipe|tracer|cooled or heated|heated or cooled',  'pipe','ins'),
R(r'^wm (support|manhole|socket)|^wm (support leg|support ring)',  'pipe','sup'),
R(r'ejector|eductor|injector|mixing nozzle|desuperheater|pulsation|funnel|damper$|spray nozzle|nozzle',  'pipe','ejec'),
R(r'strainer|cone type strainer|basket|duplex|suction filter',  'sep','strain'),
# --- pumps
R(r'jet pump|ejector pump|jet type$',  'pump','jet'),
R(r'vacuum pump|liquid ring vacuum|pump vacuum|vac pump',  'pump','vac'),
R(r'diaphragm pump|pump diaphragm|pumps? diaphragm',  'pump','diaph'),
R(r'reciprocating pump|pump reciprocating|piston pump|pump piston|positive displacement pump|pump positive|pd pump',  'pump','recip'),
R(r'gear pump|screw pump|progressive cavity|pump (gear|screw|rotary|progressive)|pumps (gear|screw)',  'pump','rot'),
R(r'centrifugal pump|pump centrifugal|pump (horizontal|vertical|sump)|pumps centrifugal|pumps turbine|^rc pump$|^wm pump$|^wm pump liquid|^dp pump general',  'pump','cent'),
R(r'\bpump\b',  'pump','gen'),
# --- compressors / fans / expanders / drivers
R(r'gas expander|turbine expander|expander|turbo expander',  'comp','exp'),
R(r'finned.*fan|fin fan',  'hx','air'),
R(r'blower|(^| )fan( |$)|axial fan|radial fan|anglosaxon|fan axial|ventilation',  'comp','fan'),
R(r'compressor.*centrifugal|centrifugal compressor|compressor centrifugal|turbo type|turbo compressor',  'comp','cent'),
R(r'compressor.*(reciprocating|piston)|reciprocating compressor|piston compressor',  'comp','recip'),
R(r'compressor.*screw|screw compressor',  'comp','screw'),
R(r'compressor.*(rotary|liquid ring|roller vane|diaphragm|ejector)|rotary compressor|liquid ring compressor',  'comp','rot'),
R(r'compressor',  'comp','gen'),
R(r'vacuum pump or compressor',  'pump','vac'),
R(r'electric motor|driver electric|drive motor|^dio.*motor|\bmotor\b',  'drive','motor'),
R(r'generator',  'drive','gen'),
R(r'steam turbine|turbine general|driver turbine|drive turbine|^wm turbine|turbine drive',  'drive','turb'),
R(r'diesel engine|engine',  'drive','engine'),
R(r'^(wm|rc|dp) gear$|gearwheels|gear type',  'drive','gear'),
R(r'^rc driver$',  'drive','other'),
# --- mixing
R(r'agitator|stirrer|impeller',  'mix','agit'),
R(r'static mixer|in line (rotary|static)|in line mixer|inline mixer',  'mix','static'),
R(r'kneader|mixer|mixing path',  'mix','knead'),
# --- heat exchangers etc.
R(r'cooling tower|wet cooling',  'hx','ct'),
R(r'kettle|reboiler|evaporator|film evaporator|thin film|steam generator',  'hx','reb'),
R(r'plate (and frame|type)|plate heat|plate_hx|hx plate|heat exchanger plate|symbol plate',  'hx','plate'),
R(r'spiral|coil immersed|tube coil|hx coil|symbol hex spiral',  'hx','spiral'),
R(r'double pipe|hairpin|hx double',  'hx','dp'),
R(r'air cool|finned|fin fan|hx air|aircooler',  'hx','air'),
R(r'shell and tube|shell tube|tube bundle|floating head|u tube|u shaped|straight tubes|tema|fixed straight|exchanger [123]|single pass|heat exchanger m|m shape|hx shell|exchanger$',  'hx','st'),
R(r'condenser|cooler|chiller|heater|heating cooling|electric heater|spray cooler|^wm furnace$',  'hx','cond'),
R(r'heat exchanger|hex|tbtn|heat consumer',  'hx','gen'),
# --- fired
R(r'flare',  'fired','flare'),
R(r'stack|chimney',  'fired','stack'),
R(r'burner|firing|combustion chamber',  'fired','burner'),
R(r'boiler|waste heat|steam boiler|wasteheat',  'fired','boiler'),
R(r'fired heater|furnace|^dp furnace|vessels furnace',  'fired','furn'),
R(r'kiln',  'fired','kiln'),
# --- separation
R(r'hydrocyclone|cyclone',  'sep','cyc'),
R(r'centrifuge|decanter|elutriator',  'sep','centr'),
R(r'precipitator|electrostatic|magnetic separator|electromagnetic|permanent magnet',  'sep','esp'),
R(r'scrubber',  'sep','scrub'),
R(r'screening|screen |sifter|sieve|sorting|screen inclined|screen vibrating',  'sep','screen'),
R(r'filter press|filter belt|rotary (drum|filter)|belt or roll|belt for|bed filter|liquid bed|fixed bed filter|press filter',  'sep','press'),
R(r'gas filter|filter gas|filter air|hepa|air filter|bag filter|filter bag|activated carbon',  'sep','gas'),
R(r'filter|cartridge',  'sep','liq'),
R(r'membrane|solidifier|impact separator|coalesc|demister',  'sep','memb'),
R(r'gravity separator|settling|separator three phase|three phase|3 phase|sep3',  'vessel','sep3'),
R(r'knock out|knockout|^wm knock|^dp knockout',  'vessel','ko'),
R(r'separator',  'vessel','sep'),
# --- solids
R(r'conveyor|conveyer|screw type closed|chain type|roller conveyer',  'solid','conv'),
R(r'elevator|\blift\b|crane|forklift',  'solid','lift'),
R(r'crush|mill|breaker|pulveri|grinding|hammer|jaw|cone type',  'solid','crush'),
R(r'dryer|drier|drying',  'solid','dry'),
R(r'feeder|proportion|distribution device|rotary table|airlock|solids proportioner|loading arm',  'solid','feed'),
R(r'press (piston|roller)|extruder|shaping|pelletiz|pelletizing',  'solid','shape'),
R(r'scale|weigh',  'solid','scale'),
R(r'bag filling|palletizer|palette|palletizing',  'solid','pack'),
# --- transport
R(r'ship|vessel ship|barge',  'transport','ship'),
R(r'tank car|wagon|rail',  'transport','rail'),
R(r'truck|industrial truck|box truck',  'transport','road'),
R(r'container|iso tank',  'transport','load'),
# --- columns & reactors
R(r'reactor|half pipe reactor|fluid contacting|autoclave',  'column','react'),
R(r'fluidi[sz]ed bed|vessel fluidized|^wm fluidized',  'column','fluid'),
R(r'packing|packed|fixed bed|vessel fixed|two fixed bed',  'column','packed'),
R(r'tray (general|with baffle|bubble|valve)|sieve tray|filter insert|internals|^wm tray general|baffle trays',  'column','int'),
R(r'tray column|column.*tray|bubble cap|vessel trays|vessel internal trayed|sectioned',  'column','tray'),
R(r'column|tower|vessel general column',  'column','gen'),
# --- vessels/tanks
R(r'jacket|coil|heating cooling|heating or cooling|heating coil|thermal insulation|electrical heating|full tube|semi tube',  'vessel','jacket'),
R(r'gas bottle|gas cylinder|cylinder',  'vessel','cyl'),
R(r'sphere|spherical',  'tank','sphere'),
R(r'floating roof',  'tank','float'),
R(r'tank (open|open top)|open top|basin|open bulk|^dp tank open|sump',  'tank','open'),
R(r'conical|cone roof|dome roof|dished roof|tank dome|tank cone|fixed roof|tank double wall',  'tank','fixed'),
R(r'bunker|silo|hopper|bulk storage',  'tank','silo'),
R(r'barrel|drum|bag$|^wm bag|storage bag|storage container|container',  'tank','pack'),
R(r'gas holder|tank|storage|cistern|container for',  'tank','gen'),
R(r'vessel|pressurized|accumulator|dome',  'vessel','drum'),
# --- misc
R(r'hood|electrolysis|hall|^rc misc|computer|control',  'misc','other'),
]
OV={
'wm_bogen_90_grad':('hvac','fit'),'wm_diode':('misc','sym'),'wm_diode01':('misc','sym'),'wm_dust_trap':('sep','memb'),'wm_gear':('drive','gear'),'wm_liftequip':('solid','lift'),
'wm_p_id_2061':('tank','open'),'wm_p_id_2062':('vessel','drum'),'wm_p_id_301':('vessel','drum'),'wm_p_id_x2063':('vessel','drum'),
'wm_p_id_x8011':('column','tray'),'wm_p_id_x8012':('column','tray'),'wm_p_id_x8013':('column','tray'),'wm_p_id_x8014':('column','packed'),'wm_p_id_x8015':('column','packed'),'wm_p_id_x8016':('column','packed'),
'wm_p_id_x8081':('tank','silo'),'wm_p_id_x8084':('tank','silo'),'wm_p_id_x8085':('tank','silo'),'wm_p_id_x8086':('tank','silo'),'wm_p_id_x8100':('column','gen'),'wm_p_id_x8101':('column','gen'),'wm_p_id_x8200':('vessel','drum'),
'wm_str_mungsgleichrichter':('hvac','ctrl'),'rc_driver':('drive','other'),'rc_turbine':('inst','flow'),'rc_diaphragm':('inst','misc'),'dio_instruments_temperature_element':('inst','level'),
'lo_characteristics_vibration_type_3831':('misc','char'),'dp_signal_data':('line','sig'),'dp_signal_electric':('line','sig'),
'wm_self_operating_release_valve_steam_trap':('pipe','trap'),'dio_valves_orifice':('pipe','orif'),'dio_valves_gauge':('inst','ind'),'dio_valves_rotameter':('inst','flow'),
'rc_plug':('pipe','fl'),'rc_cap':('pipe','fl'),'wm_compressor_ejector_type_vacuum_pump_jet':('pump','jet'),'wm_column_with_two_fixed_bed_sections_and_intermedi':('column','packed'),
'rc_heat_exchanger_steam_boiler':('fired','boiler'),'rc_heat_exchanger_burner_firing_system':('fired','burner'),'dp_fired_heater':('fired','furn'),'dio_vessels_drum_or_condenser':('vessel','drum'),
'wm_jet_pump_liquid_type_ejector_pump':('pump','jet'),'wm_screening_device_sieve_strainer_general_iso_1062':('sep','screen'),'wm_screening_device_sieve_strainer_vibrating_type_i':('sep','screen'),'wm_screening_device_basket_reeltype_iso_10628_2':('sep','screen'),'lo_screening_device_basket_reel_type_x8030':('sep','screen'),'dp_signal_pneumatic':('line','sig'),'dp_signal_capillary':('line','sig'),'dio_heat_exchangers_hairpin_exchanger':('hx','dp'),
}
def classify(key,label_en=''):
    if key in OV: return OV[key]
    if key.startswith(('wm_vessel_with_','lo_vessel_with_')) and re.search('heating|cooling|coil',key): return ('vessel','jacket')
    if key.startswith(('wm_vessel_with_dished_ends_and_support','lo_vessel_with_dished_ends_and_support')): return ('vessel','drum')
    k=key.split('_',1)[1] if '_' in key and key.split('_')[0] in('wm','rc','dio','lo','dp') else key
    pre=key.split('_')[0] if key.split('_')[0] in('wm','rc','dio','lo','dp') else 'bi'
    t=(pre+' '+k.replace('_',' ')+' '+(label_en or '').lower().replace('-',' ')).lower()
    for rx,c,s in RULES:
        if rx.search(t):
            if s is None:
                s=actsub(t)
            return c,s
    return None,None
def actsub(t):
    for pat,s in [('diaphragm','diaph'),('piston','piston'),('motor','motor'),('manual|handwheel|lever','manual'),('solenoid','sol'),('spring','spring')]:
        if re.search(pat,t): return s
    return 'gen'

BI={ # PFD Studio gốc: key -> (cls,sub)
'h_sep':('vessel','sep'),'v_sep':('vessel','sep'),'sep3':('vessel','sep3'),'scrubber':('vessel','ko'),'fsep':('sep','coal'),'desalter':('sep','esp'),'hydrocyclone':('sep','cyc'),
'column':('column','tray'),'reactor':('column','react'),'tank':('tank','fixed'),'sphere':('tank','sphere'),'flare':('fired','flare'),'slug_catcher':('vessel','slug'),'cpi':('sep','memb'),'sump':('tank','open'),'filter':('sep','liq'),
'exchanger':('hx','st'),'plate_hx':('hx','plate'),'double_pipe':('hx','dp'),'reboiler':('hx','reb'),'condenser':('hx','cond'),'chiller':('hx','cond'),'aircooler':('hx','air'),'heater':('fired','furn'),'wasteheat':('fired','boiler'),'cooling_tower':('hx','ct'),
'pump':('pump','cent'),'pd_pump':('pump','recip'),'vac_pump':('pump','vac'),
'compressor':('comp','gen'),'blower':('comp','fan'),'expander':('comp','exp'),'motor':('drive','motor'),'agitator':('mix','agit'),'steam_turbine':('drive','turb'),'compressor2':('comp','multi'),
'valve_gate':('valve','gate'),'valve_ball':('valve','ball'),'valve_globe':('valve','globe'),'valve_butterfly':('valve','bfly'),'valve_plug':('valve','plug'),'valve_check':('valve','check'),'valve_control':('valve','ctrl'),'valve_esd':('valve','esd'),'valve_psv':('valve','relief'),'valve_rd':('valve','relief'),'valve_reg':('valve','reg'),'valve_sol':('valve','oper'),'vent_valve':('pipe','vent'),
'reducer':('pipe','red'),'strainer':('sep','strain'),'arrestor':('pipe','arr'),'spec_blind':('pipe','blind'),'flange':('pipe','fl'),'sight':('pipe','sight'),'vent_drain':('pipe','vent'),'ptap':('pipe','ejec'),
'orifice':('inst','flow'),'flowmeter':('inst','flow'),'analyzer':('inst','level'),'levelinst':('inst','level'),
'pt':('inst','xmtr'),'tt':('inst','xmtr'),'ft':('inst','xmtr'),'lt':('inst','xmtr'),'at':('inst','xmtr'),'pdt':('inst','xmtr'),
'pi':('inst','ind'),'ti':('inst','ind'),'fi':('inst','ind'),'li':('inst','ind'),'gauge':('inst','ind'),'fq':('inst','ind'),
'pic':('inst','ctrl'),'tic':('inst','ctrl'),'fic':('inst','ctrl'),'lic':('inst','ctrl'),'aic':('inst','ctrl'),
'psh':('inst','sw'),'psl':('inst','sw'),'pshh':('inst','sw'),'pall':('inst','sw'),'lsh':('inst','sw'),'lsl':('inst','sw'),'lshh':('inst','sw'),'lsll':('inst','sw'),'tsh':('inst','sw'),'fsl':('inst','sw'),'zs':('inst','sw'),'hs':('inst','sw'),'ys':('inst','sw'),'sis':('inst','sw'),'alarm':('inst','sw'),
'instrument':('inst','bubble'),
'cabinet':('elec','panel'),'hmi':('elec','panel'),'power':('elec','power'),
'wellhead':('upstream','well'),'choke':('upstream','well'),'manifold':('upstream','well'),'pig':('upstream','pig'),'skid':('upstream','pig'),'loading':('transport','load'),'pipeline':('upstream','pig'),
'feed':('line','conn'),'product':('line','conn'),'offpage':('line','conn'),'junction':('line','junc'),
'text':('misc','note'),'area':('misc','note'),'note':('misc','note'),
'platform':('upstream','plat'),'subsea':('upstream','plat'),'gas_plant':('upstream','plant'),'comp_station':('upstream','stat'),'lng_tank':('tank','lng'),'regas':('upstream','plant'),'city_gate':('upstream','stat'),'power_plant':('upstream','cons'),'consumer':('upstream','cons'),'valve_station':('upstream','stat'),'terminal':('upstream','term'),'storage':('upstream','term'),
'truck':('transport','road'),'rail':('transport','rail'),'ship':('transport','ship'),'container':('transport','load'),
'jvessel':('column','react'),'centrifuge':('sep','centr'),'dryer':('solid','dry'),'evaporator':('hx','reb'),'clarifier':('water','clar'),'aeration':('water','aer'),'membrane':('sep','memb'),'conveyor':('solid','conv'),'silo':('tank','silo'),'mill':('solid','crush'),'dust':('water','dust'),'powergen':('elec','gen'),'hvac':('hvac','hvac'),'accum':('vessel','cyl'),'flotation':('water','clar'),'kiln':('fired','kiln'),'foodtank':('water','food'),
}
