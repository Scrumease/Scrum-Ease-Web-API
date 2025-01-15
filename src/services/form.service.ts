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
    search?: string,
    projectId?: string,
    isCurrentForm?: string,
    selfForms?: boolean,
    isActive?: boolean,
  ): Promise<FindPaginated<IForm>> {
    const tenantId = currentUser.currentTenant.tenantId;

    const match: any = {
      tenantId: new Types.ObjectId(tenantId),
      ...(projectId && { projectId: new Types.ObjectId(projectId) }),
      ...(isCurrentForm !== undefined && {
        isCurrentForm: isCurrentForm === 'true',
      }),
    };

    if (selfForms) {
      const userProjects = await this.projectModel
        .find({
          users: { $in: [new Types.ObjectId(currentUser.userId)] }, // Busca os projetos que contêm o usuário
        })
        .select('_id')
        .exec();

      const projectIds = userProjects.map((p) => p._id);
      match.projectId = { $in: projectIds };
    }

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'projects',
          localField: 'projectId',
          foreignField: '_id',
          as: 'project',
        },
      },
      { $unwind: '$project' },
    ];

    if (isActive !== undefined) {
      pipeline.push({ $match: { 'project.isActive': isActive } });
    }
    if (search) {
      pipeline.push({
        $match: {
          'project.name': { $regex: search, $options: 'i' },
        },
      });
    }

    if (limit > 0) {
      pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'questions.advancedSettings.urgencyRecipients',
          foreignField: '_id',
          as: 'questions.advancedSettings.urgencyRecipients',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'project.users',
          foreignField: '_id',
          as: 'project.users',
        },
      },
    );

    const forms = await this.formModel.aggregate(pipeline).exec();

    const totalPipeline = pipeline.filter(
      (stage) => !('$skip' in stage || '$limit' in stage),
    );
    const total = (await this.formModel.aggregate(totalPipeline).exec()).length;

    return {
      page,
      limit,
      total,
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
