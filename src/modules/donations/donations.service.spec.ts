import { ConfigService } from '@nestjs/config';
import { DonationsService } from './donations.service';

const createClientMock = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

describe('DonationsService', () => {
  it('increments accepted count via RPC when alert is accepted', async () => {
    const rpcMock = jest.fn().mockResolvedValue({ error: null });

    const donationResponsesSelectBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null }),
    };

    const donationResponsesInsertBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { response_id: 'resp-1' },
        error: null,
      }),
    };

    const alertNotificationsUpdateBuilder = {
      update: jest.fn().mockReturnThis(),
      eq: jest
        .fn()
        .mockReturnValueOnce({ eq: jest.fn().mockResolvedValue({ error: null }) }),
    };

    let donationResponsesCallCount = 0;

    const supabaseMock = {
      from: jest.fn((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                user_id: 'user-1',
                blood_group: 'O+',
                is_eligible: true,
                aadhaar_verified: true,
              },
            }),
          };
        }

        if (table === 'alerts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                alert_id: 'alert-1',
                blood_group: 'O+',
                status: 'Active',
                units_needed: 2,
                units_fulfilled: 0,
                hospital_id: 'hospital-1',
                expires_at: '2099-01-01T00:00:00.000Z',
              },
            }),
          };
        }

        if (table === 'donation_responses') {
          donationResponsesCallCount += 1;
          return donationResponsesCallCount === 1
            ? donationResponsesSelectBuilder
            : donationResponsesInsertBuilder;
        }

        if (table === 'alert_notifications') {
          return alertNotificationsUpdateBuilder;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
      rpc: rpcMock,
    };

    createClientMock.mockReturnValueOnce(supabaseMock);

    const configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'SUPABASE_URL') return 'http://localhost:54321';
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'test-key';
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new DonationsService(configServiceMock);

    await service.acceptAlert('user-1', 'alert-1', { eta_minutes: 20 });

    expect(rpcMock).toHaveBeenCalledWith('increment_accepted_count', {
      p_alert_id: 'alert-1',
    });
  });
});
