import { Injectable } from '@nestjs/common';
import { jwtPayload } from 'src/config/auth/strategy/jwt.strategy';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query, QueryWithHelpers, Types } from 'mongoose';
import { Project } from 'src/schemas/project';
import { CreateProjectDto } from 'src/dtos/project/create-dto';
import { FindPaginated } from 'src/dtos/common/findPaginatel.interface';
import { IProject } from 'src/schemas/interfaces/project.interface';
import { User } from 'src/schemas/user';
import { ProjectCountByUser } from 'src/dtos/project/project-count-by-user';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
  ) {}

  async create(dto: CreateProjectDto, user: jwtPayload) {
    const project = new this.projectModel({
      ...dto,
      tenantId: user.currentTenant.tenantId,
    });
    return await project.save();
  }

  async findAll(
    currentUser: jwtPayload,
    page: number,
    limit: number,
    search?: string,
  ): Promise<FindPaginated<IProject>> {
    const tenantId = currentUser.currentTenant.tenantId;
    let projects: IProject[];
    if (limit < 0) {
      projects = await this.projectModel
        .find({
          tenantId,
          name: { $regex: search || '', $options: 'i' },
        })
        .populate({ path: 'users', model: User.name, select: '_id name email' })
        .exec();
    } else {
      projects = await this.projectModel
        .find({
          tenantId,
          name: { $regex: search || '', $options: 'i' },
        })
        .populate({ path: 'users', model: User.name, select: 'name email' })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
    }

    const total = await this.projectModel
      .countDocuments({
        tenantId,
        name: { $regex: search || '', $options: 'i' },
      })
      .exec();

    return {
      page,
      limit,
      total: total,
      data: projects,
    };
  }

  async toggleActive(id: string, user: jwtPayload) {
    const project = await this.projectModel.findOne({
      _id: id,
      tenantId: user.currentTenant.tenantId,
    });
    if (!project) {
      return null;
    }
    project.isActive = !project.isActive;
    return await project.save();
  }

  async findById(user: jwtPayload, id: string): Promise<IProject> {
    const project = await this.projectModel
      .findOne({
        _id: new Types.ObjectId(id),
        tenantId: user.currentTenant.tenantId,
      })
      .exec();
    return project;
  }

  async update(id: string, dto: CreateProjectDto, user: jwtPayload) {
    const project = await this.projectModel.findOne({
      _id: id,
      tenantId: user.currentTenant.tenantId,
    });
    if (!project) {
      return null;
    }
    project.name = dto.name;
    project.description = dto.description;
    project.users = dto.users.map((u) => new Types.ObjectId(u));
    return await project.save();
  }

  async getProjectCountByUser(tenantId: string): Promise<ProjectCountByUser[]> {
    const result = await this.projectModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
        },
      },
      {
        $unwind: '$users',
      },
      {
        $group: {
          _id: '$users',
          totalProjects: { $sum: 1 },
          activeProjects: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          userId: '$user._id',
          userName: '$user.name',
          totalProjects: 1,
          activeProjects: 1,
        },
      },
    ]);

    return result.map((item) => ({
      userId: item.userId,
      userName: item.userName,
      totalProjects: item.totalProjects,
      activeProjects: item.activeProjects,
    }));
  }
}
