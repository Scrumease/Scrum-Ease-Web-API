import { ConflictException, Injectable } from '@nestjs/common';
import { jwtPayload } from 'src/config/auth/strategy/jwt.strategy';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Daily } from 'src/schemas/daily';
import { AnwserDailyDto, ResponseDaily } from 'src/dtos/daily/anwser.dto';
import { User, UserDocument } from 'src/schemas/user';
import { Form } from 'src/schemas/forms';
import { MailService } from './mail.service';
import { Tenant } from 'src/schemas/tenant';
import { Project, ProjectDocument } from 'src/schemas/project';

@Injectable()
export class DailyService {
  constructor(
    private readonly mailService: MailService,
    @InjectModel(Daily.name) private readonly dailyModel: Model<Daily>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Form.name) private readonly formModel: Model<Form>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
  ) {}

  async checkOrCreateDaily(user: jwtPayload, formId: string) {
    const userId = user.userId;
    const tenantId = user.currentTenant.tenantId;

    const userObj = await this.userModel.findById(userId);

    if (!userObj) {
      throw new ConflictException('Usuário não encontrado');
    }

    const userTimezone = userObj.timezone;

    const today = this.convertDateToUserTimezone(null, userTimezone.value);

    let daily = await this.dailyModel
      .findOne({
        userId,
        'formSnapshot._id': new Types.ObjectId(formId),
        date: today,
        tenantId,
      })
      .exec();

    if (!daily) {
      const form = await this.formModel.findById(formId).exec();

      daily = new this.dailyModel({
        userId,
        date: today,
        formSnapshot: form,
        formResponses: [],
        tenantId,
      });
      await daily.save();
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const formattedYesterday = this.convertDateToUserTimezone(
      yesterday,
      userTimezone.value,
    );

    const yesterdayDaily = await this.dailyModel
      .findOne({
        userId,
        'formSnapshot._id': new Types.ObjectId(formId),
        date: formattedYesterday,
        tenantId,
      })
      .exec();

    return { today: daily, yesterday: yesterdayDaily };
  }

  async anwserDaily(dto: AnwserDailyDto, user: jwtPayload) {
    const daily = await this.dailyModel
      .findOne({
        userId: user.userId,
        date: dto.date,
        tenantId: user.currentTenant.tenantId,
        'formSnapshot._id': new Types.ObjectId(dto.formId),
      })
      .populate('userId')
      .populate('tenantId')
      .populate('formSnapshot.projectId.users')
      .exec();

    if (!daily) {
      throw new ConflictException('Daily não encontrada');
    }

    if (daily.formResponses.length > 0) {
      throw new ConflictException('Daily já foi respondida');
    }

    daily.formResponses = dto.formResposes.map((response) => ({
      textQuestion: response.textQuestion,
      orderQuestion: response.orderQuestion,
      answer: response.answer,
      urgencyThreshold: response.urgencyThreshold,
    }));

    let notify: {
      user: { name: string; email: string };
      tenantName: string;
      projectName: string;
      responses: {
        responses: ResponseDaily;
        notifyTo: Types.ObjectId[];
      }[];
    };
    const responsesToNotify: {
      responses: ResponseDaily;
      notifyTo: Types.ObjectId[];
    }[] = [];
    const { questions } = daily.formSnapshot;

    for (const question of questions) {
      if (question.advancedSettings.urgencyThreshold) {
        const response = dto.formResposes.find(
          (response) =>
            response.orderQuestion === question.order &&
            response.textQuestion === question.text,
        );
        if (response) {
          const urgency = question.advancedSettings.urgencyThreshold;
          if (urgency <= response.urgencyThreshold) {
            responsesToNotify.push({
              responses: response,
              notifyTo: question.advancedSettings
                .urgencyRecipients as Types.ObjectId[],
            });
          }
        }
      }
    }

    if (responsesToNotify.length > 0) {
      const user = daily.userId as User;
      const tenant = daily.tenantId as Tenant;
      notify = {
        responses: responsesToNotify,
        user,
        tenantName: tenant.name,
        projectName: (
          await this.projectModel.findById(daily.formSnapshot.projectId)
        ).name,
      };

      const tos = (
        await this.userModel.find({
          _id: { $in: notify.responses.map((u) => u.notifyTo) },
        })
      ).map((e) => e.email);

      await this.mailService.notifyUrgent(tos, {
        user: notify.user,
        tenantName: notify.tenantName,
        projectName: notify.projectName,
        responses: notify.responses.map((r) => r.responses),
      });
    }

    await daily.updateOne(daily).exec();

    await this.sendSummaryEmail(
      daily.formSnapshot.projectId as Types.ObjectId,
      dto.date,
    );
  }

  async getEntries(
    userId: string,
    days: number,
    user: jwtPayload,
  ): Promise<any> {
    const startDate = new Date();
    const tenant = user.currentTenant.tenantId;
    startDate.setDate(startDate.getDate() - days);

    const entries = await this.dailyModel
      .aggregate([
        {
          $match: {
            user: new Types.ObjectId(userId),
            date: { $gte: startDate },
            tenant: new Types.ObjectId(tenant),
          },
        },
        {
          $group: {
            _id: '$date',
            yesterday: { $first: '$yesterday' },
            today: { $first: '$today' },
            blockers: { $first: '$blockers' },
          },
        },
        {
          $sort: { _id: -1 },
        },
      ])
      .exec();

    return entries;
  }

  async getResponses(
    formId: string,
    {
      userId,
      startDate,
      endDate,
    }: { userId?: string; startDate?: string; endDate?: string },
    user: jwtPayload,
  ) {
    const tenant = new Types.ObjectId(user.currentTenant.tenantId);
    const formObjectId = new Types.ObjectId(formId);

    const match: any = {
      tenantId: tenant,
      'formSnapshot._id': formObjectId,
    };

    if (userId) {
      match.userId = new Types.ObjectId(userId);
    }

    if (startDate || endDate) {
      const convertedDatePipeline: any = {
        $addFields: {
          convertedDate: {
            $dateFromString: {
              dateString: '$date',
              format: '%d/%m/%Y',
            },
          },
        },
      };

      match.convertedDate = {};
      if (startDate) {
        match.convertedDate.$gte = new Date(startDate);
      }
      if (endDate) {
        match.convertedDate.$lte = new Date(endDate);
      }

      const responses = await this.dailyModel
        .aggregate([
          convertedDatePipeline,
          {
            $match: match,
          },
          {
            $match: {
              formResponses: { $ne: [] },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userInfo',
            },
          },
          {
            $unwind: '$userInfo',
          },
          {
            $project: {
              _id: 1,
              userId: 1,
              'userInfo.name': 1,
              date: 1,
              formResponses: 1,
              'formSnapshot.questions': 1,
            },
          },
          {
            $sort: { convertedDate: -1 },
          },
        ])
        .exec();

      return responses;
    } else {
      const responses = await this.dailyModel
        .aggregate([
          {
            $match: match,
          },
          {
            $match: {
              formResponses: { $ne: [] },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userInfo',
            },
          },
          {
            $unwind: '$userInfo',
          },
          {
            $project: {
              _id: 1,
              userId: 1,
              'userInfo.name': 1,
              date: 1,
              formResponses: 1,
              'formSnapshot.questions': 1,
            },
          },
          {
            $sort: { date: -1 },
          },
        ])
        .exec();

      return { responses };
    }
  }

  private convertDateToUserTimezone(date: Date | string, timezone: string) {
    const currentHour = new Date().getUTCHours();
    const dateToConvert = date ? new Date(date) : new Date();
    dateToConvert.setHours(currentHour);
    return dateToConvert.toLocaleDateString('pt-BR', {
      timeZone: timezone,
    });
  }

  private async sendSummaryEmail(
    projectId: Types.ObjectId,
    currentDay: string,
  ) {
    const project = await this.projectModel.findById(projectId).exec();

    const totalUsers = project.users.length;

    const responsesForThatProject = await this.dailyModel
      .find({
        'formSnapshot.projectId': projectId,
        date: currentDay,
        formResponses: { $ne: [] },
      })
      .populate('userId', '_id email name')
      .exec();

    const totalResponses = responsesForThatProject.length;

    if (totalResponses === totalUsers) {
      const tos = project.users.map((u) => u._id);
      const responses = [];

      responsesForThatProject.map((r) => {
        r.formResponses.map((fr) => {
          responses.push({
            question: fr.textQuestion,
            answer: fr.answer,
            respondedBy: (r.userId as UserDocument).name,
          });
        });
      });

      for (const to of tos) {
        const user = await this.userModel.findOne({ _id: to }).exec();
        await this.mailService.sendEmail(
          [user.email],
          `Resumo da sua daily - Projeto: ${project.name}`,
          'daily_summary',
          {
            name: user.name,
            projectName: project.name,
            responses: responses,
            date: currentDay,
          },
        );
      }
    }
  }
}
