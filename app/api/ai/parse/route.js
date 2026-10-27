import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { isArray, isObject, isString } from 'lodash';
import { verifyRequestAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * 获取当前有效的大模型配置
 * 优先级：前端传递的配置 > 环境变量配置 > 默认预设
 */
function resolveAiConfig(bodyConfig = {}) {
  const apiKey =
    (isString(bodyConfig.apiKey) && bodyConfig.apiKey.trim()) ||
    process.env.OPENAI_API_KEY ||
    process.env.AI_API_KEY ||
    '';

  const baseURL =
    (isString(bodyConfig.baseURL) && bodyConfig.baseURL.trim()) ||
    process.env.OPENAI_BASE_URL ||
    process.env.AI_BASE_URL ||
    'https://api.deepseek.com/v1';

  const model =
    (isString(bodyConfig.model) && bodyConfig.model.trim()) ||
    process.env.OPENAI_MODEL ||
    process.env.AI_MODEL ||
    'deepseek-chat';

  return { apiKey, baseURL, model };
}

/**
 * GET: 查询服务端是否已通过环境变量配置了通用大模型
 */
export async function GET(request) {
  try {
    if (!verifyRequestAuth(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasServerKey = Boolean(process.env.OPENAI_API_KEY || process.env.AI_API_KEY);
    const serverBaseURL = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || '';
    const serverModel = process.env.OPENAI_MODEL || process.env.AI_MODEL || '';

    return NextResponse.json({
      success: true,
      hasServerKey,
      serverBaseURL,
      serverModel
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: 使用官方 openai SDK 调用兼容 OpenAPI/OpenAI 的大模型进行 OCR 解析或连通性测试
 */
export async function POST(request) {
  try {
    if (!verifyRequestAuth(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { apiKey, baseURL, model } = resolveAiConfig(body);

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_API_KEY',
          message: '未配置大模型 API Key，请在页面设置或环境变量中配置'
        },
        { status: 400 }
      );
    }

    // 初始化官方 OpenAI SDK 客户端（通用兼容模式）
    const client = new OpenAI({
      apiKey,
      baseURL,
      timeout: 45000,
      maxRetries: 2
    });

    // 0. 拉取模型列表模式 (调用官方 SDK client.models.list())
    if (body.action === 'models' || body.fetchModels === true) {
      const response = await client.models.list();
      const rawList = isArray(response) ? response : response?.data || [];
      const modelIds = rawList
        .map((item) => (isString(item) ? item : item?.id))
        .filter((id) => isString(id) && id.trim().length > 0);

      const uniqueModels = Array.from(new Set(modelIds)).sort();
      return NextResponse.json({
        success: true,
        models: uniqueModels,
        count: uniqueModels.length
      });
    }

    // 1. 连通性测试模式
    if (body.test === true) {
      const ping = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: '请回复 pong' }],
        max_tokens: 10
      });
      const reply = ping.choices?.[0]?.message?.content?.trim() || '';
      return NextResponse.json({
        success: true,
        model,
        reply,
        message: `大模型连接成功 (${model})`
      });
    }

    // 2. 基金持仓 OCR 文本解析
    const rawText = isString(body.text) ? body.text.trim() : '';
    if (!rawText) {
      return NextResponse.json({ success: false, error: 'EMPTY_TEXT', message: '待解析文本为空' }, { status: 400 });
    }

    const systemPrompt = `你是一个专业的基金持仓OCR文本结构化提取助手。
任务：从用户提供的图片OCR文字中识别所有基金持仓信息，准确提取基金名称、6位纯数字代码、持仓金额与收益。

提取规范：
1. fundName（必填）：基金全名，保留完整名称与后缀（如“易方达蓝筹精选混合”、“招商中证白酒指数A”）。
2. fundCode（重要）：6位纯数字基金代码。若文本中出现6位代码则提取；若文本只有基金名字但属于常见基金且确信代码可补全；若无法确定或无代码则填空字符串 ""。
3. holdAmounts：持仓金额（元），仅包含纯数字与小数点（如 "15000.00"），去除逗号千分位与货币符号；找不到填空字符串 ""。
4. holdGains：持有收益或累计收益（元），仅包含数字与小数点，亏损需带负号（如 "320.50" 或 "-85.20"）；找不到填空字符串 ""。

输出格式要求：
必须只输出合法的 JSON 数组，严禁包含任何 Markdown 格式块（不要输出 \`\`\`json 或 \`\`\`）、思考过程或额外文字。
示例格式：
[
  {
    "fundCode": "005827",
    "fundName": "易方达蓝筹精选混合",
    "holdAmounts": "15000.00",
    "holdGains": "320.50"
  }
]`;

    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawText }
      ]
    });

    const responseContent = completion.choices?.[0]?.message?.content || '';

    // 清洗模型输出中的思考标签、Markdown 标记等
    const cleaned = responseContent
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/[\u00A0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g, ' ')
      .trim();

    // 正则提取首个完整的 JSON 数组结构 [...]
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      console.warn('[AI Parse] Model did not return JSON array:', responseContent);
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_JSON',
          message: '模型未返回有效 JSON 格式数据',
          raw: responseContent
        },
        { status: 422 }
      );
    }

    let parsedList = [];
    try {
      parsedList = JSON.parse(arrayMatch[0]);
    } catch (parseErr) {
      console.error('[AI Parse] JSON.parse error:', parseErr, 'Raw:', arrayMatch[0]);
      return NextResponse.json(
        {
          success: false,
          error: 'JSON_PARSE_ERROR',
          message: '模型返回内容 JSON 反序列化失败',
          raw: arrayMatch[0]
        },
        { status: 422 }
      );
    }

    if (!isArray(parsedList)) {
      return NextResponse.json({ success: false, error: 'NOT_ARRAY', message: '解析结果非数组格式' }, { status: 422 });
    }

    // 格式化并清洗字段
    const sanitizedResults = parsedList
      .filter((item) => isObject(item) && (item.fundCode || item.fundName))
      .map((item) => ({
        fundCode: isString(item.fundCode) ? item.fundCode.trim() : String(item.fundCode || '').trim(),
        fundName: isString(item.fundName) ? item.fundName.trim() : String(item.fundName || '').trim(),
        holdAmounts: isString(item.holdAmounts)
          ? item.holdAmounts.trim()
          : item.holdAmounts != null
            ? String(item.holdAmounts).trim()
            : '',
        holdGains: isString(item.holdGains)
          ? item.holdGains.trim()
          : item.holdGains != null
            ? String(item.holdGains).trim()
            : ''
      }));

    return NextResponse.json({
      success: true,
      data: sanitizedResults,
      count: sanitizedResults.length
    });
  } catch (err) {
    console.error('[API /api/ai/parse Error]', err);
    return NextResponse.json(
      {
        success: false,
        error: err.code || 'AI_REQUEST_FAILED',
        message: err.message || '大模型请求失败'
      },
      { status: 500 }
    );
  }
}
