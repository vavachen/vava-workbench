/* 后端数据持久化（JSON 文件，零依赖，便于部署） */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'data.json');
const xhs = require('./providers/xiaohongshu');
const policy = require('./providers/policy');

let data = { xhsTrends: [], policyList: [], travelCache: {}, lastSync: 0, xhsApi: null, initialized: false };

function load() {
  try { if (fs.existsSync(FILE)) data = Object.assign(data, JSON.parse(fs.readFileSync(FILE, 'utf8'))); } catch (e) {}
  if (!data.initialized) {
    data.xhsTrends = xhs.seed();
    data.policyList = policy.seed();
    data.initialized = true;
    save();
  }
  return data;
}
function save() { try { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); } catch (e) {} }
function get() { return data; }

module.exports = { load, save, get };
