import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { jwtPayload } from 'src/config/auth/strategy/jwt.strategy';
import { FindPaginated } from 'src/dtos/common/findPaginatel.interface';
import { CreateFormDto } from 'src/dtos/form/create-form.dto';
import { UpdateFormDto } from 'src/dtos/form/update-form.dto';
import { FormDocument } from 'src/schemas/forms';
import { IForm } from 'src/schemas/interfaces/form.interface';
import { IProject } from 'src/schemas/interfaces/project.interface';
import { Project, ProjectDocument } from 'src/schemas/project';
import { User } from 'src/schemas/user';

@Injectable()
export class FormService {
  constructor(
    @InjectModel('Form') private formModel: Model<FormDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(
    currentUser: jwtPayload,
    createFormDto: CreateFormDto,
  ): Promise<FormDocument> {
    await this.formModel
      .updateMany(
        {
          tenantId: currentUser.currentTenant.tenantId,
          projectId: createFormDto.projectId,
        },
        { $set: { isCurrentForm: false } },
      )
      .exec();

    const newForm = new this.formModel({
      ...createFormDto,
      tenantId: currentUser.currentTenant.tenantId,
    });
    return newForm.save();
  }

  async findAll(
    currentUser: jwtPayload,
    page: number,
    limit: number,
    projectId?: string,
    isCurrentForm?: boolean,
    selfForms?: boolean,
  ): Promise<FindPaginated<IForm>> {
    const tenantId = currentUser.currentTenant.tenantId;
    let forms: IForm[];

    // Ajuste na construção da query
    const query: any = {
      tenantId,
      ...(projectId && { projectId: new Types.ObjectId(projectId) }),
      ...(isCurrentForm !== undefined && { isCurrentForm }),
    };

    if (selfForms) {
      const projectsWithUser = await this.projectModel
        .find({
          users: { $in: [new Types.ObjectId(currentUser.userId)] }, // Busca os projetos que contêm o usuário
        })
        .select('_id')
        .exec();

      const projectIds = projectsWithUser.map((project) => project._id);

      query.projectId = { $in: projectIds };
    }

    if (limit < 0) {
      forms = await this.formModel
        .find({
          ...query,
        })
        .populate({ path: 'projectId', model: Project.name, select: 'name' })
        .populate({
          path: 'questions.advancedSettings.urgencyRecipients',
          model: User.name,
          select: 'name email',
        })
        .populate({
          path: 'projectId.users',
          model: User.name,
          select: '_id',
        })
        .exec();
    } else {
      forms = await this.formModel
        .find({
          ...query,
        })
        .populate({
          path: 'projectId',
          model: Project.name,
          select: 'name users',
        })
        .populate({
          path: 'questions.advancedSettings.urgencyRecipients',
          model: User.name,
          select: 'name email',
        })
        .populate({
          path: 'projectId.users',
          model: User.name,
          select: '_id',
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
    }

    const total = await this.formModel
      .countDocuments({
        ...query,
      })
      .exec();

    return {
      page,
      limit,
      total: total,
      data: forms,
    };
  }

  async findOne(id: string): Promise<FormDocument> {
    const form = await this.formModel
      .findById(new Types.ObjectId(id))
      .populate({
        path: 'projectId',
        select: 'users name',
        populate: {
          path: 'users',
          model: User.name,
          select: '_id name email',
        },
      })
      .exec();
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    return form;
  }

  async update(
    id: string,
    updateFormDto: UpdateFormDto,
  ): Promise<FormDocument> {
    const existingForm = await this.formModel
      .findByIdAndUpdate(new Types.ObjectId(id), updateFormDto, { new: true })
      .exec();
    if (!existingForm) {
      throw new NotFoundException('Form not found');
    }
    return existingForm;
  }

  async setActive(id: string): Promise<FormDocument> {
    await this.formModel.updateMany({}, { $set: { isCurrentForm: false } });
    const form = await this.formModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { isCurrentForm: true },
        { new: true },
      )
      .exec();
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    return form;
  }
}
