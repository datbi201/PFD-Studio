/* ============ Rev.8: chỉ còn module PFD (module Sơ đồ đã bỏ) ============ */
const STORE={};
const dgOn=()=>false;
function adoptState(ns){state=ns;sel=new Set();selEdge=null}
function applyModuleUI(){}
function modBoot(){try{localStorage.removeItem("pfdstudio.rev6.dgm.autosave")}catch(e){}}
