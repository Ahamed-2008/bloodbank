import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlertsExpiryService } from './alerts-expiry.service';

const createClientMock = jest.fn();

jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

describe('AlertsExpiryService', () => {
  let loggerLog: jest.SpyInstance;
  let loggerError: jest.SpyInstance;

  beforeEach(() => {
    createClientMock.mockReset();
    loggerLog = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'SUPABASE_URL') return 'http://localhost:54321';
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'test-key';
      return undefined;
    }),
  } as unknown as ConfigService;

  it('updates expired active alerts and logs the changed row count', async () => {
    const query = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: [{ alert_id: 'alert-1' }, { alert_id: 'alert-2' }],
        error: null,
      }),
    };
    const supabase = { from: jest.fn().mockReturnValue(query) };
    createClientMock.mockReturnValueOnce(supabase);

    const service = new AlertsExpiryService(configService);
    await service.expireAlerts();

    expect(supabase.from).toHaveBeenCalledWith('alerts');
    expect(query.update).toHaveBeenCalledWith({ status: 'Expired' });
    expect(query.eq).toHaveBeenCalledWith('status', 'Active');
    expect(query.lt).toHaveBeenCalledWith('expires_at', expect.any(String));
    expect(query.select).toHaveBeenCalledWith('alert_id');
    expect(loggerLog).toHaveBeenCalledWith('Expired 2 alerts');
  });

  it('does not log when no alerts were updated', async () => {
    const query = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    createClientMock.mockReturnValueOnce({
      from: jest.fn().mockReturnValue(query),
    });

    const service = new AlertsExpiryService(configService);
    await service.expireAlerts();

    expect(loggerLog).not.toHaveBeenCalled();
    expect(loggerError).not.toHaveBeenCalled();
  });

  it('catches database failures without rejecting the scheduled call', async () => {
    const query = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      select: jest.fn().mockRejectedValue(new Error('database unavailable')),
    };
    createClientMock.mockReturnValueOnce({
      from: jest.fn().mockReturnValue(query),
    });

    const service = new AlertsExpiryService(configService);
    await expect(service.expireAlerts()).resolves.toBeUndefined();

    expect(loggerLog).not.toHaveBeenCalled();
    expect(loggerError).toHaveBeenCalledWith(
      'Failed to expire alerts.',
      expect.any(String),
    );
  });
});
