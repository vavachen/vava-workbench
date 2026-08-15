// 解析 出勤 AI.xlsx → js/plans.js（window.VAVA_PLANS）
const XLSX = require("./js/vendor/xlsx.min.js");
const fs = require("fs");

const buf = fs.readFileSync("C:/Users/86159/Desktop/出勤 AI.xlsx");
const wb = XLSX.read(buf, { type: "buffer" });

function dayOf(text) {
  if (!text) return 0;
  const t = text.replace(/\s/g, "");
  const map = { 日: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };
  if (map[t] !== undefined) return map[t];
  if (t.includes("周日") || t.includes("星期日")) return 0;
  if (t.includes("周一") || t.includes("星期一")) return 1;
  if (t.includes("周二") || t.includes("星期二")) return 2;
  if (t.includes("周三") || t.includes("星期三")) return 3;
  if (t.includes("周四") || t.includes("星期四")) return 4;
  if (t.includes("周五") || t.includes("星期五")) return 5;
  if (t.includes("周六") || t.includes("星期六")) return 6;
  return 2;
}
function clean(s) {
  if (s == null) return "";
  return String(s).replace(/\r/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

const classes = [];
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  // 解析表头行（含 阶段/学员/时间）——直接取单元格，避免空格截断
  let stage = "", student = "", day = 2, time = "";
  for (const r of rows) {
    const s0 = String(r[0] || ""), s2 = String(r[2] || ""), s4 = String(r[4] || "");
    if (s0.includes("阶段")) stage = s0.replace(/^.*阶段[:：]\s*/, "").trim();
    if (s2.includes("学员")) student = s2.replace(/^.*学员[:：]\s*/, "").split(/[，,]/)[0].trim();
    if (s4.includes("时间")) {
      const mt = s4.match(/每周([一二三四五六日日])\s*([\d:.：-]+)/);
      if (mt) { day = dayOf(mt[1]); time = mt[2].replace(/[：]/g, ":").trim(); }
    }
  }
  // 逐课：col0 为数字 1-36
  const plan = [];
  for (const r of rows) {
    const seq = Number(r[0]);
    if (!Number.isInteger(seq) || seq < 1 || seq > 200) continue;
    if (plan.find(p => p.seq === seq)) continue;
    const content = clean(r[1]);
    const date = clean(r[2]);
    const note = clean(r[4]);
    const renewal = note.includes("续费");
    plan.push({ seq, content, date, done: date !== "", renewal });
  }
  plan.sort((a, b) => a.seq - b.seq);
  // 已上 = 最后有上课日期的课序之前（含）全部算已上，下次课 = 下一节
  const lastDated = plan.reduce((m, p) => p.date ? Math.max(m, p.seq) : m, 0);
  plan.forEach(p => { p.done = p.seq <= lastDated; });
  const done = plan.filter(p => p.done).length;
  classes.push({
    name: student || name,
    stage: stage || name,
    total: plan.length,
    done,
    phone: "",
    day,
    time: time || "待补",
    plan
  });
}

const js = "window.VAVA_PLANS = " + JSON.stringify(classes, null, 2) + ";\n";
fs.writeFileSync("js/plans.js", js, "utf8");

// 验证输出
classes.forEach(c => {
  console.log(`${c.name} | ${c.stage} | 周${["日","一","二","三","四","五","六"][c.day]} ${c.time} | 共${c.total}课 已上${c.done} | 续费${c.plan.filter(p=>p.renewal).length}处`);
  console.log("  示例课1:", JSON.stringify(c.plan[0]));
  console.log("  示例续费:", JSON.stringify(c.plan.find(p=>p.renewal)));
  console.log("  末课:", JSON.stringify(c.plan[c.plan.length-1]));
});
console.log("\nWROTE js/plans.js (" + classes.length + " classes)");
