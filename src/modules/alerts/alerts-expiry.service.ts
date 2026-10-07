import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AlertsExpiryService {
  private readonly logger = new Logger(AlertsExpiryService.name);
  private readonly supabase: SupabaseClient;

  constructor(configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    const supabaseKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined.');
    if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined.');

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  @Cron('*/1 * * * *')
  async expireAlerts(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('alerts')
        .update({ status: 'Expired' })
        .eq('status', 'Active')
        .lt('expires_at', new Date().toISOString())
        .select('alert_id');

      if (error) throw error;
      if (data?.length) this.logger.log(`Expired ${data.length} alerts`);
    } catch (error) {
      this.logger.error(
        'Failed to expire alerts.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
