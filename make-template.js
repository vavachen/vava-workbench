// 生成可直接填写的导入模板：import-template.xlsx
const fs = require('fs');
const path = require('path');
const XLSX = require(path.join(__dirname, 'js/vendor/xlsx.min.js'));

const header = ['姓名', '阶段', '总课次', '已上', '手机号', '星期', '时间', '课程', '备注'];

// 两行示例（导入前可保留也可删除，解析会一并导入）
const examples = [
  ['小雨', '第1阶段', 12, 3, '13800000001', '周六', '10:00-10:45', '钢琴启蒙', '喜欢小星星，注意手型'],
  ['小雨', '第1阶段', 12, 3, '13800000001', '周三', '17:00-17:45', '钢琴启蒙', '巩固自然拼读'],
];

// 留空行供填写（用占位提示，导入时解析会跳过空姓名行）
const blanks = Array.from({ length: 12 }, () => [
  '', '', '', '', '', '', '', '', '',
]);

const aoa = [header].concat(examples, blanks);
const ws = XLSX.utils.aoa_to_sheet(aoa);
ws['!cols'] = [
  { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 6 }, { wch: 13 },
  { wch: 7 }, { wch: 13 }, { wch: 18 }, { wch: 24 },
];

// 说明 sheet
const tips = [
  ['列', '含义', '说明 / 示例'],
  ['姓名', '学员姓名', '同一姓名多行 = 同一个班的完整周课表（只建 1 个学员）'],
  ['阶段', '学习阶段', '如 第1阶段 / 第2阶段 / 成人 / 考级二级'],
  ['总课次', '该班总课次', '数字，如 12'],
  ['已上', '已上过的课次', '数字，如 3（默认 0）'],
  ['手机号', '家长/学员手机', '选填，如 13800000001'],
  ['星期', '上课星期', '支持：周一~周日 / 星期一~星期日 / 1~7 / Mon~Sun'],
  ['时间', '上课时间段', '如 10:00-10:45（直接填文本即可）'],
  ['课程', '本次课内容', '如 钢琴启蒙 / 哈农练习 / 即兴伴奏'],
  ['备注', '备注', '选填，如 注意手型 / 每天练10分钟'],
  ['', '', ''],
  ['导入步骤', '', 'App → 工作安排 → 导入表格 → 选本文件(.xlsx) → 确认导入 N 个班'],
  ['提示', '', '空姓名行会被自动忽略；同名重复周次不会重复导入'],
];
const wst = XLSX.utils.aoa_to_sheet(tips);
wst['!cols'] = [{ wch: 10 }, { wch: 16 }, { wch: 52 }];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '导入模板');
XLSX.utils.book_append_sheet(wb, wst, '填写说明');

const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync(path.join(__dirname, 'import-template.xlsx'), buf);
console.log('DONE import-template.xlsx');
