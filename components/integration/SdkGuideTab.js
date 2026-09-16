"use client";

import React, { useState } from "react";
import CodeBlock from "@/components/codeBlock/CodeBlock";

const LANGUAGES = [
  { id: "node", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
];

const LANGUAGE_CLASS = {
  node: "language-javascript",
  python: "language-python",
  java: "language-java",
};

const INSTALL_SNIPPETS = {
  node: { className: "language-bash", code: `npm install gtwy-sdk` },
  python: { className: "language-bash", code: `pip install gtwy-sdk` },
  java: {
    className: "language-markdown",
    fromIntegration: true,
    code: `<dependency>
    <groupId>ai.gtwy</groupId>
    <artifactId>gtwy-sdk</artifactId>
    <version>0.4.0</version>
</dependency>`,
  },
};

const AUTH_SNIPPETS = {
  node: `const { Gtwy } = require('gtwy-sdk');

// Option 1: a pauthkey from the GTWY platform (sent as the \`pauthkey\` header)
const client = new Gtwy({ authKey: '<authKey>' });

// Option 2: a GTWY session token instead (sent as the \`Authorization\` header)
// const client = new Gtwy({ Authorization: '<your-jwt>' });`,
  python: `from gtwy import Gtwy

# Option 1: a pauthkey from the GTWY platform (sent as the \`pauthkey\` header)
client = Gtwy(auth_key="<authKey>")

# Option 2: a GTWY session token instead (sent as the \`Authorization\` header)
# client = Gtwy(authorization="<your-jwt>")`,
  java: `import ai.gtwy.Gtwy;

// Option 1: a pauthkey from the GTWY platform (sent as the pauthkey header)
Gtwy client = Gtwy.builder().authKey("<authKey>").build();

// Option 2: a GTWY session token instead (sent as the Authorization header)
// Gtwy client = Gtwy.builder().authorization("<your-jwt>").build();`,
};

const SECTIONS = [
  {
    id: "chat",
    title: "Chat Completions",
    description: "Send one message to an agent/bridge and get its reply.",
    snippets: {
      node: `const response = await client.chat.completions.create({
  agentId: 'my-agent-id',
  user: "What's the capital of France?",
});
console.log(response.content);
console.log(response.usage.totalTokens);`,
      python: `response = client.chat.completions.create(
    agent_id="my-agent-id",
    user="What's the capital of France?",
)
print(response.content)
print(response.usage.total_tokens)`,
      java: `import ai.gtwy.models.ChatCompletion;
import ai.gtwy.params.ChatCompletionParams;

ChatCompletion response = client.chat().completions().create(
    ChatCompletionParams.builder()
        .agentId("my-agent-id")
        .user("What's the capital of France?")
        .build());

System.out.println(response.getContent());
System.out.println(response.getUsage().getTotalTokens());`,
    },
  },
  {
    id: "batch",
    title: "Batch Completions",
    description: "Run many prompts against one bridge in a single call, delivered to a webhook.",
    snippets: {
      node: `const response = await client.batch.completions.create({
  agentId: 'my-agent-id',
  batch: ['Summarize doc 1', 'Summarize doc 2'],
  batchVariables: [{ docId: '1' }, { docId: '2' }],
  batchWebhook: 'https://your-service.example.com/gtwy-batch-hook',
});
console.log(response.batchId);`,
      python: `response = client.batch.completions.create(
    agent_id="my-agent-id",
    batch=["Summarize doc 1", "Summarize doc 2"],
    batch_variables=[{"docId": "1"}, {"docId": "2"}],
    batch_webhook="https://your-service.example.com/gtwy-batch-hook",
)
print(response.batch_id)`,
      java: `import ai.gtwy.models.BatchCompletion;
import ai.gtwy.params.BatchCompletionParams;
import java.util.List;
import java.util.Map;

BatchCompletion response = client.batch().completions().create(
    BatchCompletionParams.builder()
        .agentId("my-agent-id")
        .batch(List.of("Summarize doc 1", "Summarize doc 2"))
        .batchVariables(List.of(Map.of("docId", "1"), Map.of("docId", "2")))
        .batchWebhook("https://your-service.example.com/gtwy-batch-hook")
        .build());

System.out.println(response.getBatchId());`,
    },
  },
  {
    id: "rerun",
    title: "Rerun",
    description: "Replay a past message with the bridge's current configuration.",
    snippets: {
      node: `await client.rerun.create({ agentId: 'my-agent-id', messageIds: ['msg-1', 'msg-2'] });

// or rerun the last message in a thread:
await client.rerun.create({ agentId: 'my-agent-id', threadId: 't1', subThreadId: 's1' });`,
      python: `client.rerun.create(agent_id="my-agent-id", message_ids=["msg-1", "msg-2"])

# or rerun the last message in a thread:
client.rerun.create(agent_id="my-agent-id", thread_id="t1", sub_thread_id="s1")`,
      java: `import ai.gtwy.params.RerunParams;
import java.util.List;

client.rerun().create(
    RerunParams.builder().agentId("my-agent-id").messageIds(List.of("msg-1", "msg-2")).build());`,
    },
  },
  {
    id: "agent",
    title: "Agents",
    description: "Create, update, list, and delete agents (bridges).",
    fieldTables: [
      {
        method: "create",
        fields: [
          [
            "purpose",
            "string",
            "no",
            "Natural-language description of what the agent should do — GTWY drafts an initial prompt/configuration from it.",
          ],
          ["templateId", "string (24-char hex)", "no", "Start from an existing template instead of a blank agent."],
          ["bridgeType", "string", "no", '"api" (default) or "chatbot".'],
          ["bridge_limit", "number", "no", "Usage limit for the agent."],
          ["bridge_limit_reset_period", "string", "no", '"monthly", "weekly", or "daily".'],
          ["bridge_limit_start_date", "date", "no", "When the limit period starts."],
          ["folder_id", "string", "no", "Folder to create the agent in."],
          [
            "flag",
            "boolean",
            "no",
            "Defaults to false (async creation — returns accepted: true, agent created in the background). Pass true to wait and get the agent back inline on result.agent.",
          ],
        ],
      },
      {
        method: "update",
        fields: [
          ["name", "string", "no", "Agent display name."],
          ["slugName", "string", "no", "URL-safe slug."],
          ["meta", "object", "no", "Arbitrary metadata."],
          ["bridge_summary", "string", "no", "Summary description."],
          ["bridge_status", "string", "no", "Agent status."],
          ["bridge_usage", "number", "no", "Same meaning as in create."],
          ["bridge_limit", "number", "no", "Same meaning as in create."],
          ["bridge_limit_reset_period", "string", "no", "Same meaning as in create."],
          ["bridge_limit_start_date", "date", "no", "Same meaning as in create."],
          ["bridgeType", "string", "no", '"api" or "chatbot".'],
          ["page_config", "object", "no", "Chatbot page/UI configuration."],
          ["folder_id", "string", "no", "Move the agent to a different folder."],
          ["connected_agent_details", "object", "no", "Details for multi-agent orchestration."],
          ["settings", "object", "no", "Shallow-merged into the agent's existing settings."],
          ["web_search_filters", "object", "no", "Web search tool filters."],
          ["gtwy_web_search_filters", "object", "no", "Web search tool filters."],
          ["variables_path", "string", "no", "Prompt variable path config."],
          ["built_in_tools_data", "object", "no", "Built-in tools configuration."],
          ["agents", "object", "no", "Connected-agents configuration ({ connected_agents: [...] })."],
          ["functionData", "object", "no", "Function/tool linkage data."],
          ["version_description", "string", "no", "Description applied to the current version."],
          ["agent_info", "object", "no", "Shallow-merged into the agent's existing agent_info."],
          ["starterQuestion", "array", "no", "Suggested starter questions (chatbot type)."],
        ],
      },
    ],
    snippets: {
      node: `// Create (waits for the agent, returned inline)
const created = await client.agent.create({ purpose: 'A support bot', flag: true });
const agentId = created.agent._id;

// Update
await client.agent.update(agentId, { name: 'Renamed agent', folder_id: 'folder-1' });

// List
const all = await client.agent.list();
console.log(all.agents);

// Delete (soft-delete; pass { restore: true } to undo)
await client.agent.delete(agentId);`,
      python: `# Create (waits for the agent, returned inline)
created = client.agent.create(purpose="A support bot", flag=True)
agent_id = created.agent["_id"]

# Update
client.agent.update(agent_id, name="Renamed agent", folder_id="folder-1")

# List
all_agents = client.agent.list()
print(all_agents.agents)

# Delete (soft-delete; pass restore=True to undo)
client.agent.delete(agent_id)`,
      java: `import ai.gtwy.models.AgentResult;
import java.util.Map;

// Create (waits for the agent, returned inline)
AgentResult created = client.agent().create(Map.of("purpose", "A support bot", "flag", true));

// Update
client.agent().update(agentId, Map.of("name", "Renamed agent", "folder_id", "folder-1"));

// List
AgentResult all = client.agent().list();

// Delete (soft-delete; pass Map.of("restore", true) to undo)
client.agent().delete(agentId, Map.of());`,
    },
  },
  {
    id: "version",
    title: "Versions",
    description: "Create a new version, update its configuration, and publish it live.",
    fieldTables: [
      {
        method: "create",
        fields: [
          ["version_id", "string", "yes", "The existing version to branch the new version off of."],
          ["version_description", "string", "no", "Description for the new version."],
        ],
      },
      {
        method: "update",
        fields: [
          [
            "configuration",
            "object",
            "no",
            "model, prompt, tools, tool_choice, mcp_config, sampling params, ... — same shape as chat.completions.create.",
          ],
          ["service", "string", "no", "Model provider for this version."],
          ["apikey_object_id", "string", "no", "Which stored api key (see API Keys → create) this version uses."],
          ["gpt_memory", "boolean", "no", "Enable conversation memory."],
          [
            "pre_tools",
            "object",
            "no",
            "Pre-processing tool config (custom_function, query_refiner, rag_knowledgebase, gtwy_web_search).",
          ],
          ["post_tool", "object", "no", "{ id, script_id, args } — post-processing tool."],
          ["settings", "object", "no", "Same shape as settings in chat.completions.create."],
          ["variables_path", "string", "no", "Prompt variable path config."],
          [
            "function_ids",
            "array of strings",
            "no",
            "Tools attached to this version — ids from Tools → create's result.data._id.",
          ],
          [
            "functionData",
            "object",
            "no",
            "{ function_id, function_operation, script_id } — add/remove a single function.",
          ],
          ["version_description", "string", "no", "Description for this version."],
          ["embed_override", "object", "no", "Embed-specific configuration override."],
        ],
      },
      {
        method: "publish",
        fields: [["generate_summary", "boolean", "no", "Ask GTWY to generate a change summary for this publish."]],
      },
    ],
    snippets: {
      node: `// Create a version, branching off an existing one
const version = await client.version.create({ version_id: existingVersionId });

// Configure it
await client.version.update(version.versionId, {
  configuration: { model: 'gpt-4o', prompt: 'You are a helpful assistant.' },
  service: 'openai',
});

// Publish it, making it live
await client.version.publish(version.versionId);`,
      python: `# Create a version, branching off an existing one
version = client.version.create(version_id=existing_version_id)

# Configure it
client.version.update(
    version.version_id,
    configuration={"model": "gpt-4o", "prompt": "You are a helpful assistant."},
    service="openai",
)

# Publish it, making it live
client.version.publish(version.version_id)`,
      java: `import ai.gtwy.models.VersionResult;
import java.util.Map;

// Create a version, branching off an existing one
VersionResult version = client.version().create(Map.of("version_id", existingVersionId));

// Configure it
client.version().update(version.getVersionId(), Map.of(
    "configuration", Map.of("model", "gpt-4o", "prompt", "You are a helpful assistant."),
    "service", "openai"));

// Publish it, making it live
client.version().publish(version.getVersionId(), Map.of());`,
    },
  },
  {
    id: "tools",
    title: "Tools (API Calls)",
    description: "Create, update, list, and delete tools your agents can call.",
    fieldTables: [
      {
        method: "create",
        fields: [
          [
            "id",
            "string",
            "one of id / api_config",
            "An existing viasocket script id backing this tool (this is the tool's script_id).",
          ],
          [
            "api_config",
            "object { url, method, headers, query, body }",
            "one of id / api_config",
            "A user-defined HTTP call description, for a tool not backed by a script. At least one of id or api_config is required.",
          ],
          ["desc", "string", "yes", "Description of what the tool does (shown to the model)."],
          [
            "status",
            "string",
            "yes",
            '"published", "updated", "delete", or "paused". delete/paused remove the tool instead of saving it.',
          ],
          ["title", "string", "no", "Function name (letters/numbers/_/- only)."],
          ["payload", "object", "no", "Additional payload data."],
          [
            "openaiToolJson",
            "object",
            "no",
            "OpenAI-style tool/function schema — its properties/required become the tool's field schema.",
          ],
        ],
      },
      {
        method: "update",
        fields: [
          [
            "dataToSend",
            "object",
            "yes",
            "Merged directly into the stored record — pass only the fields you want to change (e.g. title).",
          ],
        ],
      },
    ],
    snippets: {
      node: `// From a user-defined HTTP call (no script needed)
const tool = await client.tools.create({
  api_config: { url: 'https://api.example.com/orders/lookup', method: 'GET' },
  desc: 'Looks up order status by order id',
  status: 'published',
});

// List / delete
await client.tools.list();
await client.tools.delete('my-script-id');`,
      python: `# From a user-defined HTTP call (no script needed)
tool = client.tools.create(
    api_config={"url": "https://api.example.com/orders/lookup", "method": "GET"},
    desc="Looks up order status by order id",
    status="published",
)

# List / delete
client.tools.list()
client.tools.delete("my-script-id")`,
      java: `import ai.gtwy.models.ApiCallResult;
import java.util.Map;

// From a user-defined HTTP call (no script needed)
ApiCallResult tool = client.tools().create(Map.of(
    "api_config", Map.of("url", "https://api.example.com/orders/lookup", "method", "GET"),
    "desc", "Looks up order status by order id",
    "status", "published"));

// List / delete
client.tools().list();
client.tools().delete("my-script-id");`,
    },
  },
  {
    id: "knowledgeBase",
    title: "Knowledge Base",
    description: "Ingest documents/URLs into a knowledge base and list/manage them.",
    fieldTables: [
      {
        method: "create",
        fields: [
          [
            "collection_details",
            "string",
            "yes",
            'Which preset collection to ingest into: "fastest", "moderate", or "high_accuracy". Any other value falls back to "fastest" — not a free-form collection name/id.',
          ],
          ["title", "string", "yes", "Title of the resource."],
          ["description", "string", "yes", "Description of the resource."],
          ["content", "string", "one of content / url", "Raw text content to ingest."],
          [
            "url",
            "string (uri)",
            "one of content / url",
            "URL to ingest content from. Must be a valid URI. At least one of content or url is required.",
          ],
          [
            "settings",
            "object",
            "no",
            "{ strategy, chunkingUrl, chunkingType, chunkSize, chunkOverlap } — merged over the target collection's own settings.",
          ],
          ["owner_id", "string", "no", "Explicit resource owner; otherwise derived from the caller's org/folder/user."],
        ],
      },
      {
        method: "createCollection",
        fields: [
          ["name", "string", "yes", "Knowledge base (RAG collection) name."],
          [
            "settings",
            "object",
            "no",
            "{ denseModel, sparseModel, chunkingType, chunkSize, chunkOverlap, rerankerModel, strategy } — all optional; defaults applied server-side.",
          ],
        ],
      },
    ],
    snippets: {
      node: `const kb = await client.knowledgeBase.create({
  collection_details: 'fastest', // "fastest" | "moderate" | "high_accuracy"
  title: 'Order lookup docs',
  description: 'Docs for the order API',
  url: 'https://example.com/docs',
});

await client.knowledgeBase.list();`,
      python: `kb = client.knowledge_base.create(
    collection_details="fastest",  # "fastest" | "moderate" | "high_accuracy"
    title="Order lookup docs",
    description="Docs for the order API",
    url="https://example.com/docs",
)

client.knowledge_base.list()`,
      java: `import ai.gtwy.models.KnowledgeBaseResult;
import java.util.Map;

KnowledgeBaseResult kb = client.knowledgeBase().create(Map.of(
    "collection_details", "fastest", // "fastest" | "moderate" | "high_accuracy"
    "title", "Order lookup docs",
    "description", "Docs for the order API",
    "url", "https://example.com/docs"));

client.knowledgeBase().list();`,
    },
  },
  {
    id: "apikey",
    title: "API Keys",
    description: "Store a provider api key under GTWY, so agents can reference it instead of a raw key.",
    fieldTables: [
      {
        method: "create",
        fields: [
          ["name", "string", "yes", "Label for the stored key."],
          ["apikey", "string", "yes", "The provider api key value. Encrypted at rest; returned masked in responses."],
          [
            "service",
            "string",
            "yes",
            'Provider this key belongs to, e.g. "openai", "anthropic". Must be a recognized service name.',
          ],
          ["apikey_limit", "number", "no", "Usage limit for this key."],
          ["apikey_limit_reset_period", "string", "no", '"monthly", "weekly", or "daily".'],
          ["apikey_limit_start_date", "date", "no", "When the limit period starts."],
        ],
      },
    ],
    snippets: {
      node: `const apikey = await client.apikey.create({
  name: 'My OpenAI key',
  apikey: 'sk-...',
  service: 'openai',
});

await client.apikey.list();`,
      python: `apikey = client.apikey.create(name="My OpenAI key", apikey="sk-...", service="openai")

client.apikey.list()`,
      java: `import ai.gtwy.models.ApiKeyResult;
import java.util.Map;

ApiKeyResult apikey = client.apikey().create(Map.of(
    "name", "My OpenAI key", "apikey", "sk-...", "service", "openai"));

client.apikey().list();`,
    },
  },
];

const FieldTable = ({ method, fields }) => (
  <div className="mt-4">
    <div className="text-sm font-medium mb-2">
      Keys accepted by <code>{method}</code>
    </div>
    <div className="overflow-x-auto">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Required?</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(([key, type, required, desc], idx) => (
            <tr key={idx}>
              <td className="font-mono text-sm whitespace-nowrap">{key}</td>
              <td className="text-sm whitespace-nowrap">{type}</td>
              <td className="text-sm whitespace-nowrap">{required}</td>
              <td className="text-sm">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SdkGuideTab = () => {
  const [language, setLanguage] = useState("node");
  const install = INSTALL_SNIPPETS[language];

  return (
    <div className="space-y-6 p-4" data-testid="sdk-guide-tab">
      {/* Language switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">GTWY SDK</h3>
          <p className="text-sm text-base-content/70">
            Call every GTWY feature programmatically from your own backend, using the official SDK for your language.
          </p>
        </div>
        <div className="join" data-testid="sdk-guide-language-switcher">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              data-testid={`sdk-guide-lang-${lang.id}`}
              onClick={() => setLanguage(lang.id)}
              className={`join-item btn btn-sm ${language === lang.id ? "btn-primary" : "btn-ghost"}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Install */}
      <div className="card bg-base-100 border border-base-300" data-testid="sdk-guide-install">
        <div className="card-body">
          <h4 className="card-title text-base">Install</h4>
          <div className="form-control">
            <CodeBlock className={install.className} fromIntegration={install.fromIntegration}>
              {install.code}
            </CodeBlock>
          </div>
        </div>
      </div>

      {/* Authentication */}
      <div className="card bg-base-100 border border-base-300" data-testid="sdk-guide-auth">
        <div className="card-body">
          <h4 className="card-title text-base">Authenticate</h4>
          <p className="text-sm text-base-content/70">
            Pass exactly one of an <code>authKey</code> (a pauthkey from the GTWY platform) or an{" "}
            <code>Authorization</code> token (a GTWY session token) — never both.
          </p>
          <div className="form-control mt-2">
            <CodeBlock className={LANGUAGE_CLASS[language]}>{AUTH_SNIPPETS[language]}</CodeBlock>
          </div>
        </div>
      </div>

      {/* One card per SDK resource */}
      {SECTIONS.map((section) => (
        <div
          key={section.id}
          className="card bg-base-100 border border-base-300"
          data-testid={`sdk-guide-section-${section.id}`}
        >
          <div className="card-body">
            <h4 className="card-title text-base">{section.title}</h4>
            <p className="text-sm text-base-content/70">{section.description}</p>
            <div className="form-control mt-2">
              <CodeBlock className={LANGUAGE_CLASS[language]}>{section.snippets[language]}</CodeBlock>
            </div>
            {section.fieldTables?.map((table) => (
              <FieldTable key={table.method} method={table.method} fields={table.fields} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SdkGuideTab;
