/**
 * GHL Workflow Builder Tools
 * 
 * 7 tools for full workflow CRUD via the hidden internal GHL API.
 * These go beyond the public API (which only lists workflows) to provide:
 * - Create workflows with triggers and actions
 * - Get/list workflows with full action data (workflowData.templates)
 * - Update workflow actions and triggers
 * - Delete, publish, and clone workflows
 * 
 * Auth: Firebase token refresh (browser-free, no CDP needed).
 * See SKILL.md at skills/ghl-workflow-builder/SKILL.md for full schemas.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  WorkflowBuilderClient,
  WorkflowAction,
  WorkflowTrigger,
} from '../clients/workflow-builder-client.js';

// ─── Tool result type ───────────────────────────────────────

interface ToolResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────

function success(data: unknown): ToolResult {
  return {
    content: [{
      type: 'text',
      text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
    }],
  };
}

function error(msg: string): ToolResult {
  return {
    content: [{ type: 'text', text: msg }],
    isError: true,
  };
}

// ─── Tool class ─────────────────────────────────────────────

export class WorkflowBuilderTools {
  private client: WorkflowBuilderClient | null = null;
  private initError: string | null = null;

  constructor() {
    try {
      this.client = WorkflowBuilderClient.fromEnv();
    } catch (err: any) {
      this.initError = err.message;
      process.stderr.write(`[WorkflowBuilderTools] Init warning: ${err.message}\n`);
    }
  }

  /**
   * Returns MCP tool definitions for the 7 workflow builder tools.
   */
  getTools(): Tool[] {
    return [
      // ─── CREATE ─────────────────────────────────────────
      {
        name: 'ghl_create_workflow',
        description:
          'Create a new GHL workflow with optional trigger and actions. ' +
          'Actions are chained automatically via next/parentKey unless you provide explicit linkage (for branching). ' +
          'Returns the created workflow with ID, status, and action details. ' +
          'Trigger types: contact_tag, contact_created, form_submission, customer_reply, appointment, inbound_webhook, payment_received, etc. ' +
          'Action types: sms, email, add_contact_tag, wait, if_else, webhook, create_opportunity, custom_code, etc.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Workflow name (required)',
            },
            trigger: {
              type: 'object',
              description: 'Optional trigger. Properties: type (string, required), name (string), data (object with trigger-specific config like tagName, tagEvent)',
              properties: {
                type: { type: 'string', description: 'Trigger type: contact_tag, form_submission, contact_created, customer_reply, appointment, inbound_webhook, payment_received, etc.' },
                name: { type: 'string', description: 'Display name for the trigger' },
                data: { type: 'object', description: 'Trigger-specific data, e.g. {tagName: "hot-lead", tagEvent: "added"} for contact_tag' },
              },
              required: ['type'],
            },
            actions: {
              type: 'array',
              description: 'Array of action objects. Each has: type (string, required), name (string, required), attributes (object). For branching, set id, next (array of IDs), parentKey, cat, nodeType.',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', description: 'Action type: sms, email, add_contact_tag, wait, if_else, webhook, etc.' },
                  name: { type: 'string', description: 'Display name' },
                  attributes: { type: 'object', description: 'Action config (body, tags, delay, conditions, etc.)' },
                  id: { type: 'string', description: 'Optional UUID — auto-generated if omitted' },
                  next: { type: 'array', items: { type: 'string' }, description: 'Next action ID(s) — auto-chained if omitted' },
                  parentKey: { type: 'string', description: 'Previous action ID — auto-set if omitted' },
                  cat: { type: 'string', description: 'Category (conditions, multi-path, transition)' },
                  nodeType: { type: 'string', description: 'Node type (condition-node, branch-yes, branch-no)' },
                },
                required: ['type', 'name'],
              },
            },
            publish: {
              type: 'boolean',
              description: 'If true, publish the workflow immediately after creation (default: draft)',
            },
          },
          required: ['name'],
          additionalProperties: false,
        },
        _meta: { labels: { category: 'workflows', access: 'write', complexity: 'complex' } },
      } as Tool,

      // ─── LIST FULL ──────────────────────────────────────
      {
        name: 'ghl_list_workflows_full',
        description:
          'List all workflows with names, IDs, and statuses via the internal API. ' +
          'Returns more data than the public API including workflow counts and status breakdown. ' +
          'Supports pagination via limit/offset.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max workflows to return (default 50)' },
            offset: { type: 'number', description: 'Pagination offset (default 0)' },
            sortBy: { type: 'string', description: 'Sort field: name, createdAt, updatedAt (default name)' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order (default asc)' },
          },
          additionalProperties: false,
        },
        _meta: { labels: { category: 'workflows', access: 'read', complexity: 'simple' } },
      } as Tool,

      // ─── GET FULL ───────────────────────────────────────
      {
        name: 'ghl_get_workflow_full',
        description:
          'Get a single workflow with full detail: all action nodes (workflowData.templates), ' +
          'triggers, version, status, and metadata. Use this to inspect workflow structure before updating.',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: {
              type: 'string',
              description: 'The workflow ID to retrieve',
            },
          },
          required: ['workflowId'],
          additionalProperties: false,
        },
        _meta: { labels: { category: 'workflows', access: 'read', complexity: 'simple' } },
      } as Tool,

      // ─── UPDATE ACTIONS ─────────────────────────────────
      {
        name: 'ghl_update_workflow_actions',
        description:
          'Add or replace actions (and optionally triggers) in an existing workflow. ' +
          'Automatically handles version tracking (GETs current version before PUT). ' +
          'Actions are auto-chained unless explicit next/parentKey is provided for branching. ' +
          'Can also update workflow name and status.',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: {
              type: 'string',
              description: 'The workflow ID to update',
            },
            name: {
              type: 'string',
              description: 'New workflow name (optional)',
            },
            actions: {
              type: 'array',
              description: 'New actions array — replaces all existing actions',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  name: { type: 'string' },
                  attributes: { type: 'object' },
                  id: { type: 'string' },
                  next: { type: 'array', items: { type: 'string' } },
                  parentKey: { type: 'string' },
                  cat: { type: 'string' },
                  nodeType: { type: 'string' },
                },
                required: ['type', 'name'],
              },
            },
            triggers: {
              type: 'array',
              description: 'New triggers — replaces existing triggers',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  name: { type: 'string' },
                  data: { type: 'object' },
                },
                required: ['type'],
              },
            },
            status: {
              type: 'string',
              enum: ['draft', 'published'],
              description: 'Set workflow status',
            },
          },
          required: ['workflowId'],
          additionalProperties: false,
        },
        _meta: { labels: { category: 'workflows', access: 'write', complexity: 'complex' } },
      } as Tool,

      // ─── DELETE ─────────────────────────────────────────
      {
        name: 'ghl_delete_workflow_internal',
        description:
          'Permanently delete a workflow by ID through the internal workflow-builder API. This cannot be undone. ' +
          'Returns confirmation of deletion.',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: {
              type: 'string',
              description: 'The workflow ID to delete',
            },
          },
          required: ['workflowId'],
          additionalProperties: false,
        },
        _meta: { labels: { category: 'workflows', access: 'delete', complexity: 'simple' } },
      } as Tool,

      // ─── PUBLISH ────────────────────────────────────────
      {
        name: 'ghl_publish_workflow',
        description:
          'Publish a draft workflow, making it active and able to be triggered. ' +
          'Equivalent to flipping status from "draft" to "published". ' +
          'Returns the updated workflow state.',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: {
              type: 'string',
              description: 'The workflow ID to publish',
            },
          },
          required: ['workflowId'],
          additionalProperties: false,
        },
        _meta: { labels: { category: 'workflows', access: 'write', complexity: 'simple' } },
      } as Tool,

      // ─── CLONE ──────────────────────────────────────────
      {
        name: 'ghl_clone_workflow',
        description:
          'Duplicate an existing workflow with a new name. Clones all actions and triggers ' +
          'with remapped IDs. The clone starts as a draft. ' +
          'Returns the new workflow with its ID and full action data.',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: {
              type: 'string',
              description: 'The source workflow ID to clone',
            },
            newName: {
              type: 'string',
              description: 'Name for the cloned workflow (default: "{original name} (copy)")',
            },
          },
          required: ['workflowId'],
          additionalProperties: false,
        },
        _meta: { labels: { category: 'workflows', access: 'write', complexity: 'complex' } },
      } as Tool,
    ];
  }

  /**
   * Execute a workflow builder tool by name.
   */
  async executeWorkflowBuilderTool(name: string, params: Record<string, unknown>): Promise<ToolResult> {
    if (!this.client) {
      return error(
        `Workflow builder not initialized: ${this.initError || 'Unknown error'}. ` +
        'Ensure GHL_FIREBASE_API_KEY and GHL_FIREBASE_REFRESH_TOKEN are set.'
      );
    }

    try {
      switch (name) {
        case 'ghl_create_workflow':
          return await this.createWorkflow(params);
        case 'ghl_list_workflows_full':
          return await this.listWorkflowsFull(params);
        case 'ghl_get_workflow_full':
          return await this.getWorkflowFull(params);
        case 'ghl_update_workflow_actions':
          return await this.updateWorkflowActions(params);
        case 'ghl_delete_workflow_internal':
          return await this.deleteWorkflow(params);
        case 'ghl_publish_workflow':
          return await this.publishWorkflow(params);
        case 'ghl_clone_workflow':
          return await this.cloneWorkflow(params);
        default:
          return error(`Unknown workflow builder tool: ${name}`);
      }
    } catch (err: any) {
      return error(`Error executing ${name}: ${err.message}`);
    }
  }

  // ─── Tool Implementations ─────────────────────────────────

  private async createWorkflow(params: Record<string, unknown>): Promise<ToolResult> {
    const name = params.name as string;
    if (!name) return error('name is required');

    // Step 1: Create empty workflow
    const { id } = await this.client!.createWorkflow(name);

    // Step 2: Add actions if provided
    const rawActions = params.actions as WorkflowAction[] | undefined;
    const trigger = params.trigger as WorkflowTrigger | undefined;
    const publish = params.publish as boolean | undefined;

    if (rawActions?.length || trigger) {
      await this.client!.updateWorkflow(id, {
        actions: rawActions,
        triggers: trigger ? [trigger] : undefined,
        status: publish ? 'published' : 'draft',
      });
    }

    // Step 3: Publish if requested (and not already done above)
    if (publish && !rawActions?.length && !trigger) {
      await this.client!.publishWorkflow(id);
    }

    // Return final state
    const workflow = await this.client!.getWorkflow(id);
    return success({
      message: `Workflow "${name}" created successfully`,
      workflow: {
        id: workflow._id,
        name: workflow.name,
        status: workflow.status,
        version: workflow.version,
        actionCount: workflow.workflowData?.templates?.length || 0,
        actions: (workflow.workflowData?.templates || []).map((t, i) => ({
          order: i,
          type: t.type,
          name: t.name,
          id: t.id,
        })),
        url: `https://app.gohighlevel.com/v2/location/${this.client!.getLocationId()}/automation/workflow/${workflow._id}`,
      },
    });
  }

  private async listWorkflowsFull(params: Record<string, unknown>): Promise<ToolResult> {
    const result = await this.client!.listWorkflows({
      limit: params.limit as number | undefined,
      offset: params.offset as number | undefined,
      sortBy: params.sortBy as string | undefined,
      sortOrder: params.sortOrder as 'asc' | 'desc' | undefined,
    });

    return success({
      total: result.total,
      count: result.rows.length,
      workflows: result.rows.map(w => ({
        id: w._id,
        name: w.name,
        status: w.status,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
    });
  }

  private async getWorkflowFull(params: Record<string, unknown>): Promise<ToolResult> {
    const workflowId = params.workflowId as string;
    if (!workflowId) return error('workflowId is required');

    const workflow = await this.client!.getWorkflow(workflowId);

    return success({
      id: workflow._id,
      name: workflow.name,
      status: workflow.status,
      version: workflow.version,
      actionCount: workflow.workflowData?.templates?.length || 0,
      actions: workflow.workflowData?.templates || [],
      triggers: workflow.triggers || [],
      url: `https://app.gohighlevel.com/v2/location/${this.client!.getLocationId()}/automation/workflow/${workflow._id}`,
    });
  }

  private async updateWorkflowActions(params: Record<string, unknown>): Promise<ToolResult> {
    const workflowId = params.workflowId as string;
    if (!workflowId) return error('workflowId is required');

    const workflow = await this.client!.updateWorkflow(workflowId, {
      name: params.name as string | undefined,
      actions: params.actions as WorkflowAction[] | undefined,
      triggers: params.triggers as WorkflowTrigger[] | undefined,
      status: params.status as 'draft' | 'published' | undefined,
    });

    return success({
      message: `Workflow "${workflow.name}" updated successfully`,
      id: workflow._id,
      name: workflow.name,
      status: workflow.status,
      version: workflow.version,
      actionCount: workflow.workflowData?.templates?.length || 0,
      actions: (workflow.workflowData?.templates || []).map((t, i) => ({
        order: i,
        type: t.type,
        name: t.name,
        id: t.id,
      })),
    });
  }

  private async deleteWorkflow(params: Record<string, unknown>): Promise<ToolResult> {
    const workflowId = params.workflowId as string;
    if (!workflowId) return error('workflowId is required');

    await this.client!.deleteWorkflow(workflowId);

    return success({
      message: `Workflow ${workflowId} deleted successfully`,
      workflowId,
    });
  }

  private async publishWorkflow(params: Record<string, unknown>): Promise<ToolResult> {
    const workflowId = params.workflowId as string;
    if (!workflowId) return error('workflowId is required');

    const workflow = await this.client!.publishWorkflow(workflowId);

    return success({
      message: `Workflow "${workflow.name}" published successfully`,
      id: workflow._id,
      name: workflow.name,
      status: workflow.status,
      version: workflow.version,
    });
  }

  private async cloneWorkflow(params: Record<string, unknown>): Promise<ToolResult> {
    const workflowId = params.workflowId as string;
    if (!workflowId) return error('workflowId is required');

    const newName = params.newName as string | undefined;
    const workflow = await this.client!.cloneWorkflow(workflowId, newName);

    return success({
      message: `Workflow cloned as "${workflow.name}"`,
      sourceId: workflowId,
      newWorkflow: {
        id: workflow._id,
        name: workflow.name,
        status: workflow.status,
        version: workflow.version,
        actionCount: workflow.workflowData?.templates?.length || 0,
        url: `https://app.gohighlevel.com/v2/location/${this.client!.getLocationId()}/automation/workflow/${workflow._id}`,
      },
    });
  }
}

// ─── Helper for tool registry ───────────────────────────────

export function isWorkflowBuilderTool(toolName: string): boolean {
  return [
    'ghl_create_workflow',
    'ghl_list_workflows_full',
    'ghl_get_workflow_full',
    'ghl_update_workflow_actions',
    'ghl_delete_workflow_internal',
    'ghl_publish_workflow',
    'ghl_clone_workflow',
  ].includes(toolName);
}
