import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { GHLToolClient } from './ghl-tool-client.js';

/**
 * The top-level Notes module (2026-04-21 changelog) is a v3 API surface, so
 * every call carries the named `v3` Version header.
 */
const NOTES_VERSION = 'v3';

const NOTE_TOOLS: Tool[] = [
  {
    name: 'create_note',
    description: 'Create a top-level GHL note from the 2026-04-21 Notes API changelog.',
    inputSchema: {
      type: 'object',
      properties: {
        body: { type: 'object', description: 'Full request body to send to POST /notes/.', additionalProperties: true },
        payload: { type: 'object', description: 'Alias for body.', additionalProperties: true }
      }
    },
    _meta: { labels: { category: 'notes', access: 'write', complexity: 'simple' } }
  },
  {
    name: 'search_notes',
    description: 'Search top-level GHL notes.',
    inputSchema: {
      type: 'object',
      properties: {
        body: { type: 'object', description: 'Full request body to send to POST /notes/search.', additionalProperties: true },
        payload: { type: 'object', description: 'Alias for body.', additionalProperties: true }
      }
    },
    _meta: { labels: { category: 'notes', access: 'read', complexity: 'simple' } }
  },
  {
    name: 'get_note',
    description: 'Get a top-level GHL note by ID.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Note ID.' } },
      required: ['id']
    },
    _meta: { labels: { category: 'notes', access: 'read', complexity: 'simple' } }
  },
  {
    name: 'update_note',
    description: 'Update a top-level GHL note by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Note ID.' },
        body: { type: 'object', description: 'Full request body.', additionalProperties: true },
        payload: { type: 'object', description: 'Alias for body.', additionalProperties: true }
      },
      required: ['id']
    },
    _meta: { labels: { category: 'notes', access: 'write', complexity: 'simple' } }
  },
  {
    name: 'delete_note',
    description: 'Delete a top-level GHL note by ID.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Note ID.' } },
      required: ['id']
    },
    _meta: { labels: { category: 'notes', access: 'delete', complexity: 'simple' } }
  },
  {
    name: 'update_note_attachments',
    description: 'Patch attachments for a top-level GHL note.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Note ID.' },
        body: { type: 'object', description: 'Full request body.', additionalProperties: true },
        payload: { type: 'object', description: 'Alias for body.', additionalProperties: true }
      },
      required: ['id']
    },
    _meta: { labels: { category: 'notes', access: 'write', complexity: 'simple' } }
  },
  {
    name: 'update_note_relations',
    description: 'Update relations for a top-level GHL note.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Note ID.' },
        body: { type: 'object', description: 'Full request body.', additionalProperties: true },
        payload: { type: 'object', description: 'Alias for body.', additionalProperties: true }
      },
      required: ['id']
    },
    _meta: { labels: { category: 'notes', access: 'write', complexity: 'simple' } }
  },
  {
    name: 'restore_note',
    description: 'Restore a deleted top-level GHL note.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Note ID.' },
        body: { type: 'object', description: 'Optional request body.', additionalProperties: true },
        payload: { type: 'object', description: 'Alias for body.', additionalProperties: true }
      },
      required: ['id']
    },
    _meta: { labels: { category: 'notes', access: 'write', complexity: 'simple' } }
  }
];

export class NotesTools {
  constructor(private ghlClient: GHLToolClient) {}

  getToolDefinitions(): Tool[] {
    return NOTE_TOOLS;
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    switch (toolName) {
      case 'create_note':
        return this.ghlClient.makeRequest('POST', '/notes/', this.body(args), { version: NOTES_VERSION });
      case 'search_notes':
        return this.ghlClient.makeRequest('POST', '/notes/search', this.body(args), { version: NOTES_VERSION });
      case 'get_note':
        return this.ghlClient.makeRequest('GET', `/notes/${this.id(args)}`, undefined, { version: NOTES_VERSION });
      case 'update_note':
        return this.ghlClient.makeRequest('PUT', `/notes/${this.id(args)}`, this.body(args), { version: NOTES_VERSION });
      case 'delete_note':
        return this.ghlClient.makeRequest('DELETE', `/notes/${this.id(args)}`, undefined, { version: NOTES_VERSION });
      case 'update_note_attachments':
        return this.ghlClient.makeRequest('PATCH', `/notes/${this.id(args)}/attachments`, this.body(args), { version: NOTES_VERSION });
      case 'update_note_relations':
        return this.ghlClient.makeRequest('PUT', `/notes/${this.id(args)}/relations`, this.body(args), { version: NOTES_VERSION });
      case 'restore_note':
        return this.ghlClient.makeRequest('POST', `/notes/${this.id(args)}/restore`, this.body(args), { version: NOTES_VERSION });
      default:
        throw new Error(`Unknown notes tool: ${toolName}`);
    }
  }

  private id(args: Record<string, unknown>): string {
    if (!args.id) throw new Error('id is required');
    return encodeURIComponent(String(args.id));
  }

  private body(args: Record<string, unknown>): Record<string, unknown> | undefined {
    const explicit = args.body || args.payload;
    if (explicit && typeof explicit === 'object' && !Array.isArray(explicit)) return explicit as Record<string, unknown>;
    const { id: _id, body: _body, payload: _payload, ...rest } = args;
    return Object.keys(rest).length ? rest : undefined;
  }
}
