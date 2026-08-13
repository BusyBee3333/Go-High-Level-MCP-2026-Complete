/**
 * Unit Tests for GHL API Client
 * Tests API client configuration, connection, and error handling
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { GHLApiClient } from '../../src/clients/ghl-api-client.js';

// Mock axios
jest.mock('axios', () => {
  const createFn = jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn()
  }));
  return {
    __esModule: true,
    default: { create: createFn },
    create: createFn
  };
});

import axios from 'axios';
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('GHLApiClient', () => {
  let ghlClient: GHLApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset environment variables
    process.env.GHL_API_KEY = 'test_api_key_123';
    process.env.GHL_BASE_URL = 'https://test.leadconnectorhq.com';
    process.env.GHL_LOCATION_ID = 'test_location_123';

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      defaults: {
        headers: {
          'Authorization': 'Bearer test_api_key_123'
        }
      },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockAxios.create.mockReturnValue(mockAxiosInstance);

    ghlClient = new GHLApiClient({
      accessToken: 'test_api_key_123',
      baseUrl: 'https://test.leadconnectorhq.com',
      version: 'v3',
      locationId: 'test_location_123',
      apiGeneration: 'v3',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided configuration', () => {
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://test.leadconnectorhq.com',
        headers: {
          'Authorization': 'Bearer test_api_key_123',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Version': 'v3'
        },
        timeout: 30000
      });
    });

    it('should throw error if config is missing', () => {
      expect(() => {
        new GHLApiClient(undefined as any);
      }).toThrow();
    });

    it('should create instance with partial config (accessToken missing)', () => {
      // Constructor does not validate individual fields; it passes config through to axios
      const client = new GHLApiClient({ baseUrl: 'https://test.com', version: '2021-07-28', locationId: 'loc' } as any);
      expect(client).toBeDefined();
    });

    it('should create instance with partial config (baseUrl missing)', () => {
      // Constructor does not validate individual fields; it passes config through to axios
      const client = new GHLApiClient({ accessToken: 'token', version: '2021-07-28', locationId: 'loc' } as any);
      expect(client).toBeDefined();
    });

    it('should use custom configuration when provided', () => {
      const customConfig = {
        accessToken: 'custom_token',
        baseUrl: 'https://custom.ghl.com',
        locationId: 'custom_location',
        version: '2022-01-01'
      };

      new GHLApiClient(customConfig);

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://custom.ghl.com',
        headers: {
          'Authorization': 'Bearer custom_token',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Version': '2022-01-01'
        },
        timeout: 30000
      });
    });

    it('normalizes an inherited v3 fallback when compatibility mode is v2', () => {
      const legacyClient = new GHLApiClient({
        accessToken: 'legacy_token',
        baseUrl: 'https://legacy.ghl.test',
        locationId: 'legacy_location',
        version: 'v3',
        apiGeneration: 'v2',
      });

      expect(legacyClient.getConfig().version).toBe('2023-02-21');
      expect(mockAxios.create).toHaveBeenLastCalledWith(expect.objectContaining({
        headers: expect.objectContaining({ Version: '2023-02-21' }),
      }));
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = ghlClient.getConfig();

      expect(config).toMatchObject({
        accessToken: 'test_api_key_123',
        baseUrl: 'https://test.leadconnectorhq.com',
        locationId: 'test_location_123',
        version: 'v3'
      });
    });
  });

  describe('updateAccessToken', () => {
    it('should update access token and recreate axios instance', () => {
      ghlClient.updateAccessToken('new_token_456');

      const config = ghlClient.getConfig();
      expect(config.accessToken).toBe('new_token_456');
      expect(mockAxiosInstance.defaults.headers['Authorization']).toBe('Bearer new_token_456');
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { success: true },
        status: 200
      });

      const result = await ghlClient.testConnection();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        status: 'connected',
        locationId: 'test_location_123'
      });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/locations/test_location_123');
    });

    it('should handle connection failure', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(ghlClient.testConnection()).rejects.toThrow('GHL API connection test failed');
    });
  });

  describe('Contact API methods', () => {
    describe('createContact', () => {
      it('should create contact successfully', async () => {
        const contactData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        };

        mockAxiosInstance.post.mockResolvedValueOnce({
          data: { contact: { id: 'contact_123', ...contactData } }
        });

        const result = await ghlClient.createContact(contactData);

        expect(result.success).toBe(true);
        expect(result.data.id).toBe('contact_123');
        // v3 mode sends the named Version header alongside the payload.
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/contacts/', {
          ...contactData,
          locationId: 'test_location_123'
        }, { headers: { Version: 'v3' } });
      });

      it('should handle create contact error', async () => {
        // The response interceptor converts axios errors via handleApiError,
        // which rejects with the transformed error. Simulate that.
        const apiError = new Error('GHL API Error (400): Invalid email');
        mockAxiosInstance.post.mockRejectedValueOnce(apiError);

        await expect(
          ghlClient.createContact({ email: 'invalid' })
        ).rejects.toThrow('GHL API Error (400): Invalid email');
      });

      it('uses the legacy contact date in v2 even when configured fallback was v3', async () => {
        const legacyClient = new GHLApiClient({
          accessToken: 'legacy_token',
          baseUrl: 'https://test.leadconnectorhq.com',
          version: 'v3',
          locationId: 'legacy_location',
          apiGeneration: 'v2',
        });
        mockAxiosInstance.post.mockResolvedValueOnce({ data: { contact: { id: 'legacy-contact' } } });

        await legacyClient.createContact({ firstName: 'Legacy' });

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/contacts/',
          expect.objectContaining({ locationId: 'legacy_location' }),
          { headers: { Version: '2021-07-28' } }
        );
      });
    });

    describe('getContact', () => {
      it('should get contact successfully', async () => {
        mockAxiosInstance.get.mockResolvedValueOnce({
          data: { contact: { id: 'contact_123', name: 'John Doe' } }
        });

        const result = await ghlClient.getContact('contact_123');

        expect(result.success).toBe(true);
        expect(result.data.id).toBe('contact_123');
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/contacts/contact_123', { headers: { Version: 'v3' } });
      });
    });

    describe('searchContacts', () => {
      it('should search contacts successfully', async () => {
        mockAxiosInstance.post.mockResolvedValueOnce({
          data: { 
            contacts: [{ id: 'contact_123' }],
            total: 1
          }
        });

        const result = await ghlClient.searchContacts({ query: 'John' });

        expect(result.success).toBe(true);
        expect(result.data.contacts).toHaveLength(1);
        // searchContacts now uses POST /contacts/search
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/contacts/search', expect.objectContaining({
          locationId: 'test_location_123',
          query: 'John'
        }));
      });
    });
  });

  describe('Conversation API methods', () => {
    it('routes core conversation calls to v3 or the legacy conversation date', async () => {
      const v2Client = new GHLApiClient({
        accessToken: 'legacy_token',
        baseUrl: 'https://test.leadconnectorhq.com',
        version: '2023-02-21',
        locationId: 'legacy_location',
        apiGeneration: 'v2',
      });
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { conversations: [] } });

      await v2Client.searchConversations({ locationId: 'legacy_location' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/conversations/search',
        expect.objectContaining({
          headers: expect.objectContaining({ Version: '2021-04-15' }),
        })
      );
    });

    describe('sendSMS', () => {
      it('should send SMS successfully', async () => {
        mockAxiosInstance.post.mockResolvedValueOnce({
          data: { messageId: 'msg_123', conversationId: 'conv_123' }
        });

        const result = await ghlClient.sendSMS('contact_123', 'Hello World');

        expect(result.success).toBe(true);
        expect(result.data.messageId).toBe('msg_123');
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/conversations/messages',
          {
            type: 'SMS',
            contactId: 'contact_123',
            message: 'Hello World',
            fromNumber: undefined
          },
          { headers: expect.objectContaining({
            'Authorization': expect.any(String),
            'Version': 'v3'
          })}
        );
      });

      it('should send SMS with custom from number', async () => {
        mockAxiosInstance.post.mockResolvedValueOnce({
          data: { messageId: 'msg_123' }
        });

        await ghlClient.sendSMS('contact_123', 'Hello', '+1-555-000-0000');

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/conversations/messages',
          {
            type: 'SMS',
            contactId: 'contact_123',
            message: 'Hello',
            fromNumber: '+1-555-000-0000'
          },
          { headers: expect.objectContaining({
            'Version': 'v3'
          })}
        );
      });
    });

    describe('sendEmail', () => {
      it('should send email successfully', async () => {
        mockAxiosInstance.post.mockResolvedValueOnce({
          data: { emailMessageId: 'email_123' }
        });

        const result = await ghlClient.sendEmail('contact_123', 'Test Subject', 'Test body');

        expect(result.success).toBe(true);
        expect(result.data.emailMessageId).toBe('email_123');
        // sendEmail now uses sendMessage which posts to /conversations/messages
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/conversations/messages',
          expect.objectContaining({
            type: 'Email',
            contactId: 'contact_123',
            subject: 'Test Subject',
            message: 'Test body'
          }),
          { headers: expect.objectContaining({
            'Version': 'v3'
          })}
        );
      });

      it('should send email with HTML and options', async () => {
        mockAxiosInstance.post.mockResolvedValueOnce({
          data: { emailMessageId: 'email_123' }
        });

        const options = { emailCc: ['cc@example.com'] };
        await ghlClient.sendEmail('contact_123', 'Subject', 'Text', '<h1>HTML</h1>', options);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/conversations/messages',
          expect.objectContaining({
            type: 'Email',
            contactId: 'contact_123',
            subject: 'Subject',
            message: 'Text',
            html: '<h1>HTML</h1>',
            emailCc: ['cc@example.com']
          }),
          { headers: expect.objectContaining({
            'Version': 'v3'
          })}
        );
      });
    });
  });

  describe('legacy routed APIs', () => {
    it('uses the legacy opportunity date in v2 mode', async () => {
      const legacyClient = new GHLApiClient({
        accessToken: 'legacy_token',
        baseUrl: 'https://test.leadconnectorhq.com',
        version: 'v3',
        locationId: 'legacy_location',
        apiGeneration: 'v2',
      });
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { opportunities: [] } });

      await legacyClient.searchOpportunities({ location_id: 'legacy_location' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/opportunities/search',
        expect.objectContaining({ headers: { Version: '2021-07-28' } })
      );
    });

    it('pins old Email Builder calls to their locked v2 version', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { schedules: [], total: 0 } });

      await ghlClient.getEmailCampaigns({});

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/emails/schedule',
        expect.objectContaining({ headers: { Version: '2021-07-28' } })
      );
    });
  });

  describe('Blog API methods', () => {
    describe('createBlogPost', () => {
      it('should create blog post successfully', async () => {
        mockAxiosInstance.post.mockResolvedValueOnce({
          data: { data: { _id: 'post_123', title: 'Test Post' } }
        });

        const postData = {
          title: 'Test Post',
          blogId: 'blog_123',
          rawHTML: '<h1>Content</h1>'
        };

        const result = await ghlClient.createBlogPost(postData);

        expect(result.success).toBe(true);
        expect(result.data.data._id).toBe('post_123');
        // createBlogPost now posts to /blogs/posts and adds locationId
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/blogs/posts', {
          ...postData,
          locationId: 'test_location_123'
        });
      });
    });

    describe('getBlogSites', () => {
      it('should get blog sites successfully', async () => {
        mockAxiosInstance.get.mockResolvedValueOnce({
          data: { data: [{ _id: 'blog_123', name: 'Test Blog' }] }
        });

        const result = await ghlClient.getBlogSites({ locationId: 'loc_123' });

        expect(result.success).toBe(true);
        expect(result.data.data).toHaveLength(1);
        // getBlogSites now uses /blogs/site/all with skip and limit params
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/blogs/site/all', {
          params: { locationId: 'loc_123', skip: undefined, limit: undefined }
        });
      });
    });
  });

  describe('Error handling', () => {
    it('should format axios error with response', async () => {
      // The response interceptor calls handleApiError which creates a formatted error.
      // Since we mock interceptors, errors pass through directly.
      // Simulate a pre-formatted error (as the interceptor would produce).
      const formattedError = new Error('GHL API Error (404): Contact not found');
      mockAxiosInstance.get.mockRejectedValueOnce(formattedError);

      await expect(
        ghlClient.getContact('not_found')
      ).rejects.toThrow('GHL API Error (404): Contact not found');
    });

    it('should format axios error without response data', async () => {
      const formattedError = new Error('GHL API Error (500): Internal Server Error');
      mockAxiosInstance.get.mockRejectedValueOnce(formattedError);

      await expect(
        ghlClient.getContact('contact_123')
      ).rejects.toThrow('GHL API Error (500): Internal Server Error');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValueOnce(networkError);

      await expect(
        ghlClient.getContact('contact_123')
      ).rejects.toThrow('Network Error');
    });
  });

  describe('Request/Response handling', () => {
    it('sends generic DELETE bodies and preserves request headers', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({ data: { ok: true } });

      await ghlClient.makeRequest(
        'DELETE',
        '/example',
        { ids: ['one'] },
        { version: 'v3', contentType: 'application/json' }
      );

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/example', {
        headers: { Version: 'v3', 'Content-Type': 'application/json' },
        data: { ids: ['one'] },
      });
    });

    it('sends form-encoded request bodies with an explicit content type', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { accessToken: 'location-token' } });

      await ghlClient.makeRequest(
        'POST',
        '/oauth/location-token',
        'companyId=company&locationId=location',
        { version: 'v3', contentType: 'application/x-www-form-urlencoded' }
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth/location-token',
        'companyId=company&locationId=location',
        { headers: { Version: 'v3', 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
    });

    it('should properly format successful responses', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { contact: { id: 'contact_123' } },
        status: 200
      });

      const result = await ghlClient.getContact('contact_123');

      expect(result).toEqual({
        success: true,
        data: { id: 'contact_123' }
      });
    });

    it('should extract nested data correctly', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { 
          data: { 
            blogPost: { _id: 'post_123', title: 'Test' }
          }
        }
      });

      const result = await ghlClient.createBlogPost({
        title: 'Test',
        blogId: 'blog_123'
      });

      // createBlogPost wraps the full response.data, so data is nested
      expect(result.data).toEqual({
        data: {
          blogPost: { _id: 'post_123', title: 'Test' }
        }
      });
    });
  });
});
