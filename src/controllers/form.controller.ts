import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/config/auth/guard/jwt.guard';
import { FindPaginated } from 'src/dtos/common/findPaginatel.interface';
import { CreateFormDto } from 'src/dtos/form/create-form.dto';
import { UpdateFormDto } from 'src/dtos/form/update-form.dto';
import { FormDocument } from 'src/schemas/forms';
import { IForm } from 'src/schemas/interfaces/form.interface';
import { FormService } from 'src/services/form.service';

@ApiTags('forms')
@Controller('forms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new form' })
  @ApiResponse({
    status: 201,
    description: 'The form has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Request() req: any,
    @Body() createFormDto: CreateFormDto,
  ): Promise<FormDocument> {
    return this.formService.create(req.user, createFormDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all forms' })
  @ApiResponse({ status: 200, description: 'List of forms' })
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Request() req: any,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('projectId') projectId?: string,
    @Query('isCurrentForm') isCurrentForm?: boolean,
    @Query('selfForms', ParseBoolPipe) selfForms: boolean = false,
    @Query('isActive', ParseBoolPipe) isActive?: boolean,
  ): Promise<FindPaginated<IForm>> {
    return this.formService.findAll(
      req.user,
      page,
      limit,
      search,
      projectId,
      isCurrentForm,
      selfForms,
      isActive,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a form by ID' })
  @ApiResponse({ status: 200, description: 'Form found' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async findOne(@Param('id') id: string): Promise<FormDocument> {
    return this.formService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a form by ID' })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async update(
    @Param('id') id: string,
    @Body() updateFormDto: UpdateFormDto,
  ): Promise<FormDocument> {
    return this.formService.update(id, updateFormDto);
  }

  @Put('setActive/:id')
  @ApiOperation({ summary: 'setActive a form by ID' })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully activeted.',
  })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async setActive(@Param('id') id: string): Promise<void> {
    await this.formService.setActive(id);
  }
}
