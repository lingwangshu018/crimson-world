// 绯界 OrangeChat 插件（统一记录层 V2）

var DEFAULT_API_URL =
  "https://crimson-tavern.boarder-72pound.chatgpt.site/api/records";
var KEY_PATTERN = /^ctv1_[A-Za-z0-9_-]{43}$/;
var MAX_REPLY_LENGTH = 12000;

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
    throw new Error(
      "缺少" + label + "。请传入任务单中的钥匙，或在插件设置中填写并保存。"
    );
  }
  if (!KEY_PATTERN.test(key)) {
    throw new Error(label + "格式不正确，请重新复制完整的 ctv1_... 钥匙。");
  }
  return key;
}

function normalizeApiUrl(value) {
  return cleanText(value).replace(/\/+$/, "");
}

async function parseResponse(response) {
  var raw = await response.text();
  var data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (error) {
    data = { error: raw || "接口返回了无法识别的内容。" };
  }
  if (!response.ok) {
    throw new Error(
      data && (data.error || data.message)
        ? String(data.error || data.message)
        : "请求失败（HTTP " + response.status + "）"
    );
  }
  return data;
}

async function requestRecords(method, key, query, body) {
  var cfg = pluginConfig();
  var response = await fetch(normalizeApiUrl(cfg.apiUrl) + (query || ""), {
    method: method,
    headers: {
      Authorization: "Bearer " + key,
      "X-Crimson-Key": key,
      "X-Tavern-Key": key,
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  return parseResponse(response);
}

function exactRecord(records, recordId) {
  var expected = cleanText(recordId);
  if (!Array.isArray(records)) return null;
  return records.find(function (record) {
    return cleanText(record && record.id) === expected;
  }) || null;
}

async function read_crimson_record(params) {
  try {
    params = params || {};
    var recordId = cleanText(params.record_id);
    if (!recordId) return { success: false, error: "record_id 不能为空。" };

    var cfg = pluginConfig();
    var readKey = resolveKey(params.read_key, cfg.readKey, "读取钥匙");
    var data = await requestRecords(
      "GET",
      readKey,
      "?recordId=" + encodeURIComponent(recordId) + "&limit=1"
    );
    var record = exactRecord(data.records, recordId);
    if (!record) {
      return {
        success: false,
        error:
          "统一记录层可以访问，但没有找到记录ID为 " +
          recordId +
          " 的记录。请回到绯界重新点击“发送给 AI”，确保同步成功。",
        data: { record_id: recordId }
      };
    }

    return {
      success: true,
      data: {
        record_id: record.id,
        module: record.module,
        title: record.title,
        summary: record.summary,
        content: record.content,
        note: record.note,
        metadata: record.metadata,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
        instruction:
          "请结合当前聊天已加载的角色卡、世界书和近期记忆继续完成记录。完成后调用 write_crimson_reply，并使用完全相同的 record_id 写回完整最终回复。"
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
    if (!keyword) return { success: false, error: "query 不能为空。" };

    var requested = parseInt(params.limit, 10);
    var limit = Number.isFinite(requested)
      ? Math.max(1, Math.min(50, requested))
      : 10;
    var cfg = pluginConfig();
    var readKey = resolveKey(params.read_key, cfg.readKey, "读取钥匙");
    var data = await requestRecords(
      "GET",
      readKey,
      "?q=" + encodeURIComponent(keyword) + "&limit=" + limit
    );

    return {
      success: true,
      data: {
        query: keyword,
        total: Number(data.total || 0),
        matched: Number(data.matched || 0),
        records: (Array.isArray(data.records) ? data.records : []).map(
          function (record) {
            return {
              id: record.id,
              module: record.module,
              title: record.title,
              summary: record.summary,
              createdAt: record.createdAt
            };
          }
        )
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
    if (!recordId) return { success: false, error: "record_id 不能为空。" };
    if (!content) {
      return {
        success: false,
        error: "content 不能为空，请传入完整最终回复。"
      };
    }
    if (content.length > MAX_REPLY_LENGTH) {
      return {
        success: false,
        error:
          "单次写回最多 " +
          MAX_REPLY_LENGTH +
          " 字，当前内容为 " +
          content.length +
          " 字。"
      };
    }

    var cfg = pluginConfig();
    var replyKey = resolveKey(params.reply_key, cfg.replyKey, "回复钥匙");
    var data = await requestRecords("POST", replyKey, "", {
      recordId: recordId,
      content: content
    });

    if (cleanText(data.recordId) !== recordId) {
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
        title: data.title || null,
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
