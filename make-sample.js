// 生成导入样表：sample-import.xlsx + sample-import.csv
const fs = require('fs');
const path = require('path');
const XLSX = require(path.join(__dirname, 'js/vendor/xlsx.min.js'));

const header = ['姓名', '阶段', '总课次', '已上', '手机号', '星期', '时间', '课程', '备注'];
// 同一学员多行 = 该班完整周课表。下面演示 3 个班，各 2 节/周。
const rows = [
  // 启蒙一班 · 小雨（每周六、周三各一节）
  ['小雨', '第1阶段', 12, 3, '13800000001', '周六', '10:00-10:45', '钢琴启蒙', '喜欢小星星，注意手型'],
  ['小雨', '第1阶段', 12, 3, '13800000001', '周三', '17:00-17:45', '钢琴启蒙', '巩固自然拼读'],
  // 考级二级 · 乐乐（每周六、周日各一节）
  ['乐乐', '第2阶段', 24, 10, '13800000002', '周六', '11:00-11:45', '钢琴考级 · 二级', '哈农每天10分钟'],
  ['乐乐', '第2阶段', 24, 10, '13800000002', '周日', '09:30-10:15', '哈农练习', '手指独立性训练'],
  // 成人兴趣 · 王老师（每周二、周五晚）
  ['王老师', '成人', 20, 5, '13800000006', '周二', '19:00-19:45', '流行钢琴', '《晴天》左手和弦'],
  ['王老师', '成人', 20, 5, '13800000006', '周五', '19:00-19:45', '即兴伴奏', '柱式和弦转位'],
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([header].concat(rows));
ws['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 6 }, { wch: 13 }, { wch: 6 }, { wch: 13 }, { wch: 16 }, { wch: 24 }];
XLSX.utils.book_append_sheet(wb, ws, '学员课表');
const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync(path.join(__dirname, 'sample-import.xlsx'), buf);

// CSV 带 BOM，Excel 打开中文不乱码
const csv = [header].concat(rows).map(r => r.join(',')).join('\r\n');
fs.writeFileSync(path.join(__dirname, 'sample-import.csv'), '\ufeff' + csv, 'utf8');
console.log('DONE');
