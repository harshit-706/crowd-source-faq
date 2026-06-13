import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Response } from 'express';
import { verifyAndLoadUser, type AuthedRequest } from '../middleware/authShared.js';
import User from '../models/User.js';

vi.mock('../models/User.js', () => {
  return {
    default: {
      findOne: vi.fn(),
    },
  };
});

describe('X-Internal-API-Key Bypass in verifyAndLoadUser', () => {
  const originalEnv = process.env.INTERNAL_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.INTERNAL_API_KEY = originalEnv;
  });

  it('should not bypass if INTERNAL_API_KEY is not set in environment', async () => {
    delete process.env.INTERNAL_API_KEY;
    const req = {
      headers: {
        'x-internal-api-key': 'secret-key',
      },
    } as unknown as AuthedRequest;

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status } as unknown as Response;

    const result = await verifyAndLoadUser(req, res);

    expect(result).toBeNull();
    expect(User.findOne).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
  });

  it('should not bypass if x-internal-api-key header is incorrect', async () => {
    process.env.INTERNAL_API_KEY = 'correct-secret';
    const req = {
      headers: {
        'x-internal-api-key': 'incorrect-secret',
      },
    } as unknown as AuthedRequest;

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status } as unknown as Response;

    const result = await verifyAndLoadUser(req, res);

    expect(result).toBeNull();
    expect(User.findOne).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
  });

  it('should bypass auth, load system admin user, and populate req fields if keys match', async () => {
    process.env.INTERNAL_API_KEY = 'correct-secret';
    const req = {
      headers: {
        'x-internal-api-key': 'correct-secret',
      },
    } as unknown as AuthedRequest;

    const mockAdminUser = {
      _id: 'mock-admin-id',
      name: 'System Admin',
      email: 'admin@yaksha.com',
      role: 'admin',
    };

    const findOneMock = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue(mockAdminUser),
    });
    User.findOne = findOneMock;

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status } as unknown as Response;

    const result = await verifyAndLoadUser(req, res);

    expect(result).toEqual(mockAdminUser);
    expect(findOneMock).toHaveBeenCalledWith({ role: 'admin' });
    expect(req.user).toEqual(mockAdminUser);
    expect(req.auth).toEqual({ id: 'mock-admin-id' });
    expect(status).not.toHaveBeenCalled();
  });
});
