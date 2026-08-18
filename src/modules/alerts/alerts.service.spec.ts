import { ConfigService } from '@nestjs/config';
import { AlertsService } from './alerts.service';

const createClientMock = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

describe('AlertsService', () => {
  it('updates donor fields without RPC payload injection and runs points/score RPCs explicitly', async () => {
    const rpcMock = jest
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    let capturedUsersUpdatePayload: Record<string, unknown> | undefined;

    const donationResponsesSelectBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          response_id: 'resp-1',
          user_id: 'user-1',
          status: 'Arrived',
        },
      }),
    };

    const donationResponsesUpdateBuilder = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    const usersUpdateBuilder = {
      update: jest.fn((payload: Record<string, unknown>) => {
        capturedUsersUpdatePayload = payload;
        return usersUpdateBuilder;
      }),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    const scoreEventsInsertBuilder = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };

    const alertsUpdateBuilder = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    let alertsCallCount = 0;
    let donationResponsesCallCount = 0;

    const supabaseMock = {
      from: jest.fn((table: string) => {
        if (table === 'alerts') {
          alertsCallCount += 1;

          if (alertsCallCount === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: {
                  alert_id: 'alert-1',
                  hospital_id: 'hospital-1',
                  units_needed: 2,
                  units_fulfilled: 1,
                },
              }),
            };
          }

          return alertsUpdateBuilder;
        }

        if (table === 'donation_responses') {
          donationResponsesCallCount += 1;
          return donationResponsesCallCount === 1
            ? donationResponsesSelectBuilder
            : donationResponsesUpdateBuilder;
        }

        if (table === 'users') {
          return usersUpdateBuilder;
        }

        if (table === 'score_events') {
          return scoreEventsInsertBuilder;
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

    const service = new AlertsService(configServiceMock);

    await service.confirmDonation('alert-1', 'resp-1', 'hospital-1');

    expect(capturedUsersUpdatePayload).toBeDefined();
    expect(capturedUsersUpdatePayload).not.toHaveProperty('reward_points');
    expect(rpcMock).toHaveBeenNthCalledWith(1, 'increment_points', {
      p_user_id: 'user-1',
      p_points: 100,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'increment_donor_score', {
      p_user_id: 'user-1',
      p_delta: 10,
    });
  });
});
