import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { healthResponseSchema } from '@fa/shared';
import { createZodDto } from 'nestjs-zod';
import { FoundationService } from '../foundation/foundation.service';

class HealthResponseDto extends createZodDto(healthResponseSchema) {}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly foundation: FoundationService) {}

  @Get()
  @ApiOkResponse({ type: HealthResponseDto })
  async health() {
    await this.foundation.dependencies();
    return healthResponseSchema.parse({
      status: 'ok',
      service: 'fa-rent-car-api',
      time: new Date().toISOString(),
    });
  }
}
