// dsh-ux-writing — UX 文案写作：微文案规则 + 按钮/错误提示指南（纯 Node 知识库）。
import { defineTool } from "@deepseek-ai/dsh-tools";

const name = "UX 文案";
const inject = ["tools"];

const RULES = [
  { id: "clarity", name: "清晰优先", en: "Clarity", desc: "用词准确直白，用户一眼看懂。宁可平淡，不可歧义。", examples: ["「保存」优于「提交此表单」", "「删除文件」优于「执行移除操作」"] },
  { id: "brevity", name: "简洁", en: "Brevity", desc: "去掉冗余词，界面空间有限，短句更易扫读。", examples: ["「继续」优于「点击此处以继续」", "「已保存」优于「你的更改已成功保存」"] },
  { id: "consistency", name: "一致性", en: "Consistency", desc: "同一动作/对象全站用同一词，避免「删除/移除/清除」混用。", examples: ["统一用「登录」而非「登陆/登录」混用", "统一「设置」与「偏好设置」"] },
  { id: "action-verb", name: "动词开头", en: "Action Verb", desc: "按钮与 CTA 用动词开头，明确用户要做什么。", examples: ["「下载报告」优于「报告下载」", "「加入购物车」优于「购物车」"] },
  { id: "active-voice", name: "主动语态", en: "Active Voice", desc: "主语 + 动作，责任明确、更有力。", examples: ["「我们无法找到该文件」优于「该文件未能被找到」"] },
  { id: "tone", name: "语气友好", en: "Friendly Tone", desc: "像人一样说话，用第二人称「你」，避免生硬与责怪。", examples: ["「请输入有效的邮箱」优于「输入错误！」"] },
];

const BUTTONS = [
  { label: "继续", desc: "引导到下一步，默认主 CTA。" },
  { label: "保存", desc: "持久化当前更改，明确、无歧义。" },
  { label: "取消", desc: "放弃操作并返回，不改变数据。" },
  { label: "知道了", desc: "确认理解提示，语气轻、不生硬。" },
  { label: "开始使用", desc: "新手引导的主 CTA，动词 + 对象清晰。" },
  { label: "了解更多", desc: "次 CTA，引导深入了解而不强推。" },
];

const ERROR_PATTERNS = [
  { pattern: "说明问题 + 给出方案", example: "「邮箱格式不正确，请检查后重试。」" },
  { pattern: "不指责用户", example: "「我们无法处理该请求」而非「你操作有误」" },
  { pattern: "给出下一步", example: "「密码错误，你可以重置密码。」" },
  { pattern: "保持具体", example: "「文件超过 10MB 上限」而非「文件太大」" },
];

async function apply(ctx, _config) {
  ctx.tools.register(defineTool({
    name: "list_ux_writing_rules",
    description: "列出 UX 微文案写作原则（清晰/简洁/一致/动词开头/主动语态/友好语气），含正反示例。",
    parameters: {},
    output: {
      schema: {
        type: "object", additionalProperties: false,
        properties: {
          count: { type: "integer", required: true },
          rules: { type: "array", required: true, items: { type: "object", additionalProperties: false, properties: { id: { type: "string", required: true }, name: { type: "string", required: true }, en: { type: "string", required: true }, desc: { type: "string", required: true } } } },
        },
      },
      render: (_a, v) => [{ type: "text", text: v.rules.map((r) => `- ${r.name}（${r.en}）：${r.desc}`).join("\n") }],
    },
    execute: async () => ({ count: RULES.length, rules: RULES.map(({ id, name, en, desc }) => ({ id, name, en, desc })) }),
  }));

  ctx.tools.register(defineTool({
    name: "get_ux_writing_rule",
    description: "查询某 UX 文案原则的说明与正反示例。`id` 传原则 id（如 clarity、action-verb、tone）。",
    parameters: { id: { type: "string", required: true, description: "原则 id 或名称子串。" } },
    output: {
      schema: {
        type: "object", additionalProperties: false,
        properties: { name: { type: "string", required: true }, en: { type: "string", required: true }, desc: { type: "string", required: true }, examples: { type: "array", required: true, items: { type: "string" } } },
      },
      render: (_a, v) => [{ type: "text", text: `【${v.name}】${v.en}\n${v.desc}\n示例：\n${v.examples.map((e) => "  - " + e).join("\n")}` }],
    },
    execute: async (args) => {
      const r = RULES.find((x) => x.id === args.id || x.name.includes(args.id) || x.en.toLowerCase().includes(String(args.id).toLowerCase()));
      if (!r) throw new Error(`未找到 UX 文案原则：${args.id}`);
      return { name: r.name, en: r.en, desc: r.desc, examples: r.examples };
    },
  }));

  ctx.tools.register(defineTool({
    name: "button_label_guide",
    description: "返回常见按钮文案及其用途，帮助选择合适的 CTA 文案。",
    parameters: {},
    output: {
      schema: {
        type: "object", additionalProperties: false,
        properties: { buttons: { type: "array", required: true, items: { type: "object", additionalProperties: false, properties: { label: { type: "string", required: true }, desc: { type: "string", required: true } } } } },
      },
      render: (_a, v) => [{ type: "text", text: v.buttons.map((b) => `- ${b.label}：${b.desc}`).join("\n") }],
    },
    execute: async () => ({ buttons: BUTTONS.map((b) => ({ ...b })) }),
  }));

  ctx.tools.register(defineTool({
    name: "error_message_guide",
    description: "返回错误提示文案的写法模板（说明问题+方案、不指责、给下一步、保持具体）。",
    parameters: {},
    output: {
      schema: {
        type: "object", additionalProperties: false,
        properties: { patterns: { type: "array", required: true, items: { type: "object", additionalProperties: false, properties: { pattern: { type: "string", required: true }, example: { type: "string", required: true } } } } },
      },
      render: (_a, v) => [{ type: "text", text: v.patterns.map((p) => `- ${p.pattern}：${p.example}`).join("\n") }],
    },
    execute: async () => ({ patterns: ERROR_PATTERNS.map((p) => ({ ...p })) }),
  }));
}

export { apply, inject, name };
