import type { WorkflowTemplate as LibTemplate, N8nWorkflow, N8nNode } from './types';
import type { WorkflowTemplate as CanvasWorkflowTemplate } from '../data/workflowTemplates';

type CanvasCategory = CanvasWorkflowTemplate['nodes'][number]['category'];

interface MappedNode {
  type: string;
  category: CanvasCategory;
}

const TYPE_MAP: Record<string, MappedNode> = {
  'n8n-nodes-base.manualTrigger': { type: 'manual', category: 'trigger' },
  'n8n-nodes-base.scheduleTrigger': { type: 'schedule', category: 'trigger' },
  'n8n-nodes-base.schedule': { type: 'schedule', category: 'trigger' },
  'n8n-nodes-base.cron': { type: 'cron', category: 'trigger' },
  'n8n-nodes-base.webhook': { type: 'webhook', category: 'trigger' },
  'n8n-nodes-base.formTrigger': { type: 'form_submission', category: 'trigger' },
  'n8n-nodes-base.chatTrigger': { type: 'chat_listener', category: 'trigger' },
  'n8n-nodes-base.emailReadImap': { type: 'email_imap', category: 'trigger' },
  'n8n-nodes-base.gmailTrigger': { type: 'gmail_trigger', category: 'trigger' },
  'n8n-nodes-base.googleDriveTrigger': { type: 'drive_trigger', category: 'trigger' },
  'n8n-nodes-base.googleSheetsTrigger': { type: 'sheets_trigger', category: 'trigger' },
  'n8n-nodes-base.executeWorkflowTrigger': { type: 'execute_workflow_trigger', category: 'trigger' },
  'n8n-nodes-base.code': { type: 'code', category: 'core' },
  'n8n-nodes-base.if': { type: 'if', category: 'core' },
  'n8n-nodes-base.switch': { type: 'if', category: 'core' },
  'n8n-nodes-base.merge': { type: 'merge', category: 'core' },
  'n8n-nodes-base.splitInBatches': { type: 'loop_for', category: 'core' },
  'n8n-nodes-base.splitOut': { type: 'split', category: 'core' },
  'n8n-nodes-base.splitOutBatches': { type: 'split', category: 'core' },
  'n8n-nodes-base.set': { type: 'edit_fields', category: 'core' },
  'n8n-nodes-base.editFields': { type: 'edit_fields', category: 'core' },
  'n8n-nodes-base.aggregate': { type: 'aggregate', category: 'core' },
  'n8n-nodes-base.dateTime': { type: 'date_time', category: 'core' },
  'n8n-nodes-base.executionData': { type: 'execution_data', category: 'core' },
  'n8n-nodes-base.convertToFile': { type: 'convert_to_file', category: 'core' },
  'n8n-nodes-base.httpRequest': { type: 'http', category: 'app' },
  'n8n-nodes-base.slack': { type: 'slack', category: 'app' },
  'n8n-nodes-base.gmail': { type: 'gmail_app', category: 'app' },
  'n8n-nodes-base.github': { type: 'github', category: 'app' },
  'n8n-nodes-base.googleSheets': { type: 'sheets_app', category: 'app' },
  'n8n-nodes-base.googleDocs': { type: 'docs_app', category: 'app' },
  'n8n-nodes-base.googleCalendar': { type: 'calendar_app', category: 'app' },
  'n8n-nodes-base.googleDrive': { type: 'drive_trigger', category: 'app' },
  'n8n-nodes-base.dropbox': { type: 'dropbox', category: 'app' },
  'n8n-nodes-base.bitly': { type: 'bitly', category: 'app' },
  'n8n-nodes-base.bluesky': { type: 'bluesky', category: 'app' },
  'n8n-nodes-base.elevenlabs': { type: 'elevenlabs', category: 'app' },
  'n8n-nodes-base.pushbullet': { type: 'pushbullet', category: 'app' },
  'n8n-nodes-base.readWriteFile': { type: 'document', category: 'app' },
  'n8n-nodes-base.document': { type: 'document', category: 'app' },
  '@n8n/n8n-nodes-langchain.agent': { type: 'agent', category: 'ai' },
  '@n8n/n8n-nodes-langchain.chainLlm': { type: 'agent', category: 'ai' },
  '@n8n/n8n-nodes-langchain.chainSummarization': { type: 'agent', category: 'ai' },
  '@n8n/n8n-nodes-langchain.openAi': { type: 'agent', category: 'ai_models' },
  '@n8n/n8n-nodes-langchain.lmChatOpenAi': { type: 'agent', category: 'ai_models' },
  '@n8n/n8n-nodes-langchain.lmChatAnthropic': { type: 'agent', category: 'ai_models' },
  '@n8n/n8n-nodes-langchain.lmChatGoogleGemini': { type: 'agent', category: 'ai_models' },
  '@n8n/n8n-nodes-langchain.lmChatOllama': { type: 'agent', category: 'ai_models' },
  '@n8n/n8n-nodes-langchain.embeddingsOpenAi': { type: 'embeddings_openai', category: 'ai_models' },
  '@n8n/n8n-nodes-langchain.embeddingsGoogleGemini': { type: 'embeddings_gemini', category: 'ai_models' },
};

const FALLBACK: MappedNode = { type: 'utilities', category: 'app' };

function mapNodeType(n8nType: string): MappedNode {
  return TYPE_MAP[n8nType] || TYPE_MAP[n8nType.trim()] || FALLBACK;
}

function buildConfig(node: N8nNode): Record<string, any> {
  const params = node.parameters || {};
  const config: Record<string, any> = {
    title: node.name,
    description: `${node.name} (${node.type})`,
    mockInputs: {},
    mockOutputs: {},
  };

  switch (node.type) {
    case 'n8n-nodes-base.code':
      config.code = typeof params.jsCode === 'string' ? params.jsCode : undefined;
      break;
    case 'n8n-nodes-base.httpRequest':
      config.httpUrl = typeof params.url === 'string' ? params.url : undefined;
      config.httpMethod = typeof params.method === 'string' ? params.method.toUpperCase() : 'GET';
      if (params.body) {
        try {
          config.httpBody = typeof params.body === 'string' ? params.body : JSON.stringify(params.body);
        } catch { /* non-serializable body */ }
      }
      if (params.sendHeaders && Array.isArray(params.headerParameters?.parameters)) {
        const headers: Record<string, string> = {};
        params.headerParameters.parameters.forEach((h: any) => {
          if (h?.name) headers[h.name] = h.value ?? '';
        });
        try { config.httpHeaders = JSON.stringify(headers); } catch { /* noop */ }
      }
      break;
    case 'n8n-nodes-base.webhook':
      config.webhookUrl = typeof params.path === 'string' ? `/webhook/${params.path}` : '';
      break;
    case 'n8n-nodes-base.scheduleTrigger':
    case 'n8n-nodes-base.schedule':
      config.scheduleInterval = 'every_hour';
      config.cronExpression = params.rule?.cron || undefined;
      break;
    case 'n8n-nodes-base.splitInBatches':
      config.loopItems = JSON.stringify(params.batchSize ? [params.batchSize] : [1]);
      break;
    default:
      if (node.type.startsWith('@n8n/n8n-nodes-langchain')) {
        config.model = 'gemini-3-flash-preview';
        config.systemPrompt =
          params.systemMessage ||
          params.promptText ||
          params.text ||
          'You are a helpful automation agent.';
      }
      break;
  }

  return config;
}

const SKIP_TYPES = new Set(['n8n-nodes-base.stickyNote']);

export function toCanvasTemplate(tpl: LibTemplate): CanvasWorkflowTemplate {
  const wf: N8nWorkflow = tpl.workflow;

  const nodes = wf.nodes
    .filter(n => !SKIP_TYPES.has(n.type) && !n.disabled)
    .map((n, i) => {
      const mapped = mapNodeType(n.type);
      return {
        id: n.name,
        type: mapped.type,
        label: n.name,
        category: mapped.category,
        x: Math.round((n.position?.[0] ?? 200 + i * 220)),
        y: Math.round(n.position?.[1] ?? 240),
        config: buildConfig(n),
      };
    });

  const validIds = new Set(nodes.map(n => n.id));
  const connections: CanvasWorkflowTemplate['connections'] = [];
  let connIdx = 0;

  Object.entries(wf.connections || {}).forEach(([sourceName, outputs]) => {
    const source = wf.nodes.find(n => n.name === sourceName);
    if (!source || SKIP_TYPES.has(source.type)) return;
    const sourceMapped = mapNodeType(source.type);

    Object.entries(outputs).forEach(([, groups]) => {
      if (!Array.isArray(groups)) return;
      groups.forEach((targets, outputIndex) => {
        if (!Array.isArray(targets)) return;
        targets.forEach(target => {
          if (!target?.node) return;
          if (!validIds.has(sourceName) || !validIds.has(target.node)) return;
          connections.push({
            id: `conn-${connIdx++}`,
            fromId: sourceName,
            toId: target.node,
            fromPort:
              sourceMapped.type === 'if'
                ? outputIndex === 0
                  ? 'true'
                  : 'false'
                : undefined,
          });
        });
      });
    });
  });

  return {
    id: tpl.slug || tpl.id,
    name: tpl.name,
    description: tpl.description,
    nodeCount: nodes.length,
    nodes,
    connections,
  };
}

export function extractWebhookUrl(wf: N8nWorkflow): string {
  const webhookNode = wf.nodes.find(
    n => n.type === 'n8n-nodes-base.webhook' || n.type === 'n8n-nodes-base.formTrigger'
  );
  const path = webhookNode?.parameters?.path;
  if (!path) return '';
  const domain = webhookNode?.parameters?.options?.domain || '';
  return domain ? `${domain}/webhook/${path}` : `/webhook/${path}`;
}
