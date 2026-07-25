// 绯界 OrangeChat 插件
// 读取指定记录，并把最终回复追加写回同一记录的 note 字段。

var DEFAULT_API_URL = "https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault";
var KEY_PATTERN = /^ctv1_[A-Za-z0-9_-]{43}$/;
var MAX_REPLY_LENGTH = 8000;

function cleanText(value) {
  return String(value == null ? "" : value)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function cleanKey(value) {
  return cleanText(value).replace(/\s+/g, "");
}

function pluginConfig() {
  var source = typeof config === "object" && config ? config : {};
  return {
    apiUrl: cleanText(source.api_url) || DEFAULT_API_URL,
    readKey: cleanKey(source.read_key),
    replyKey: cleanKey(source.reply_key)
  };
}

function resolveKey(explicitValue, configuredValue, label) {
  var key = cleanKey(explicitValue) || cleanKey(configuredValue);
  if (!key) {
    throw new Error("缺少" + label + "。请把任务单中的钥匙传给工具，或在插件设置中填写后保存配置。");
  }
  if (!KEY_PATTERN.test(key)) {
    throw new Error(label + "格式不正确。请重新复制完整的 ctv1_... 钥匙，并确认没有遗漏字符。");
  }
  return key;
}

function normalizeApiUrl(value) {
  return cleanText(value).replace(/\/+$/, "");
}

async function parseResponse(response) {
  var text = await response.text();
  var data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { error: text || "接口返回了无法识别的内容。" };
  }

  if (!response.ok) {
    var message = data && (data.error || data.message)
      ? String(data.error || data.message)
      : "请求失败（HTTP " + response.status + "）";
    var requestError = new Error(message);
    requestError.status = response.status;
    requestError.data = data;
    throw requestError;
  }

  return data;
}

async function requestVault(method, key, query, body) {
  var cfg = pluginConfig();
  var url = normalizeApiUrl(cfg.apiUrl) + (query || "");
  var options = {
    method: method,
    headers: {
      "Authorization": "Bearer " + key,
      "X-Tavern-Key": key,
      "Accept": "application/json"
    }
  };

  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  var response = await fetch(url, options);
  return parseResponse(response);
}

function exactRecord(records, recordId) {
  var expected = cleanText(recordId);
  if (!Array.isArray(records)) return null;
  for (var i = 0; i < records.length; i += 1) {
    if (cleanText(records[i] && records[i].id) === expected) {
      return records[i];
    }
  }
  return null;
}

function recordTitle(record) {
  return cleanText(
    record && (
      record.title ||
      record.topic ||
      record.drinkName ||
      record.module_name ||
      record.moduleName
    )
  ) || "未命名记录";
}

async function read_crimson_record(params) {
  try {
    params = params || {};
    var recordId = cleanText(params.record_id);
    if (!recordId) {
      return { success: false, error: "record_id 不能为空。" };
    }

    var cfg = pluginConfig();
    var readKey = resolveKey(params.read_key, cfg.readKey, "读取钥匙");
    var query = "?q=" + encodeURIComponent(recordId) + "&limit=25";
    var data = await requestVault("GET", readKey, query);
    var record = exactRecord(data.records, recordId);

    if (!record) {
      return {
        success: false,
        error: "接口可以访问，但没有找到记录ID为 " + recordId + " 的记录。请确认网页已经同步最新档案，并确认记录ID没有复制错误。",
        data: {
          record_id: recordId,
          matched: Number(data.matched || 0),
          returned_ids: Array.isArray(data.records)
            ? data.records.map(function (item) { return item && item.id; }).filter(Boolean)
            : []
        }
      };
    }

    return {
      success: true,
      data: {
        record_id: recordId,
        title: recordTitle(record),
        record: record,
        vault_updated_at: data.updatedAt || null,
        instruction: "请结合当前聊天已加载的角色卡、世界书和近期记忆继续完成这条记录。完成后调用 write_crimson_reply，并使用完全相同的 record_id 写回完整最终回复。"
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error && error.message ? error.message : String(error)
    };
  }
}

async function search_crimson_records(params) {
  try {
    params = params || {};
    var keyword = cleanText(params.query);
    if (!keyword) {
      return { success: false, error: "query 不能为空。" };
    }

    var parsedLimit = parseInt(params.limit, 10);
    var limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(25, parsedLimit))
      : 10;
    var cfg = pluginConfig();
    var readKey = resolveKey(params.read_key, cfg.readKey, "读取钥匙");
    var query = "?q=" + encodeURIComponent(keyword) + "&limit=" + limit;
    var data = await requestVault("GET", readKey, query);
    var records = Array.isArray(data.records) ? data.records : [];

    return {
      success: true,
      data: {
        query: keyword,
        total: Number(data.total || 0),
        matched: Number(data.matched || records.length),
        records: records.map(function (record) {
          return {
            id: record && record.id,
            title: recordTitle(record),
            createdAt: record && record.createdAt,
            module: record && (record.module_name || record.moduleName || null),
            record: record
          };
        })
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error && error.message ? error.message : String(error)
    };
  }
}

async function write_crimson_reply(params) {
  try {
    params = params || {};
    var recordId = cleanText(params.record_id);
    var content = cleanText(params.content);
    if (!recordId) {
      return { success: false, error: "record_id 不能为空。" };
    }
    if (!content) {
      return { success: false, error: "content 不能为空。请传入需要写回的完整最终回复。" };
    }
    if (content.length > MAX_REPLY_LENGTH) {
      return {
        success: false,
        error: "单次写回最多 " + MAX_REPLY_LENGTH + " 字，当前内容为 " + content.length + " 字。请缩短后重试。"
      };
    }

    var cfg = pluginConfig();
    var replyKey = resolveKey(params.reply_key, cfg.replyKey, "回复钥匙");
    var data = await requestVault("POST", replyKey, "", {
      recordId: recordId,
      content: content
    });

    if (cleanText(data.recordId) && cleanText(data.recordId) !== recordId) {
      return {
        success: false,
        error: "接口返回的记录ID与目标记录不一致，插件已停止确认成功。",
        data: data
      };
    }

    return {
      success: true,
      data: {
        record_id: recordId,
        title: data.drinkName || data.title || null,
        already_applied: Boolean(data.alreadyApplied),
        appended_chars: Number(data.appendedChars || 0),
        note_updated_at: data.noteUpdatedAt || null,
        note: data.note || content,
        message: data.alreadyApplied
          ? "这段回复此前已经写入，无需重复追加。"
          : "完整回复已经写回指定记录的 note 字段。"
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error && error.message ? error.message : String(error)
    };
  }
}

exports.read_crimson_record = read_crimson_record;
exports.write_crimson_reply = write_crimson_reply;
exports.search_crimson_records = search_crimson_records;
