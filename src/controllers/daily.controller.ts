import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  HttpCode,
  Query,
  Get,
  Param,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/config/auth/guard/jwt.guard';
import { AnwserDailyDto } from 'src/dtos/daily/anwser.dto';
import { DailyService } from 'src/services/daily.service';

@Controller('daily')
@ApiTags('daily')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DailyController {
  constructor(private readonly dailyService: DailyService) {}
  @Post('anwser')
  @ApiOperation({ summary: 'Responder a daily' })
  @ApiResponse({
    status: 204,
  })
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async anwserDaily(@Body() dto: AnwserDailyDto, @Request() req) {
    await this.dailyService.anwserDaily(dto, req.user);
    return;
  }

  @Post(':formId/checkOrCreateDaily')
  @ApiOperation({ summary: 'Verificar ou criar daily' })
  @ApiResponse({
    status: 200,
  })
  @UseGuards(JwtAuthGuard)
  async checkOrCreateDaily(@Request() req, @Param('formId') formId: string) {
    return await this.dailyService.checkOrCreateDaily(req.user, formId);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar as Respostas dos ultimos dias' })
  @ApiResponse({
    status: 200,
    description: 'Respostas encontradas com sucesso',
  })
  @UseGuards(JwtAuthGuard)
  async getDailyEntries(
    @Query('user') userId: string,
    @Query('days') days: number,
    @Request() req,
  ) {
    return this.dailyService.getEntries(userId, days, req.user);
  }

  @Get(':formId/responses')
  @ApiOperation({ summary: 'Buscar as Respostas dos ultimos dias' })
  @ApiResponse({
    status: 200,
    description: 'Respostas encontradas com sucesso',
  })
  @UseGuards(JwtAuthGuard)
  async getFormResponses(
    @Request() req,
    @Param('formId') formId: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.dailyService.getResponses(
      formId,
      {
        userId,
        startDate,
        endDate,
      },
      req.user,
    );
  }
}
