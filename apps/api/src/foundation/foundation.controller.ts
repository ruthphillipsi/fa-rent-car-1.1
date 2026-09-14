import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { foundationResponseSchema, paginationSchema, systemResponseSchema } from '@fa/shared';
import { createZodDto } from 'nestjs-zod';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { FoundationService } from './foundation.service';

class FoundationQueryDto extends createZodDto(paginationSchema) {}
class FoundationResponseDto extends createZodDto(foundationResponseSchema) {}
class SystemResponseDto extends createZodDto(systemResponseSchema) {}

@ApiTags('Foundation')
@ApiCookieAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Controller('admin')
export class FoundationController {
  constructor(private readonly foundation: FoundationService) {}

  @Get('foundation')
  @ApiQuery({ type: FoundationQueryDto })
  @ApiOkResponse({ type: FoundationResponseDto })
  overview(@Query() query: FoundationQueryDto) {
    return this.foundation.overview(query);
  }

  @Get('system')
  @Roles('SUPERADMIN')
  @ApiOkResponse({ type: SystemResponseDto })
  system() {
    return this.foundation.dependencies();
  }
}
