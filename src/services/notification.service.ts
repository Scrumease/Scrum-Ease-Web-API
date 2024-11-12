import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MailService } from './mail.service';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/schemas/user';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Form } from 'src/schemas/forms';
import { DailyService } from './daily.service';
import { sendRemindEmailDto } from 'src/dtos/notification/sendRemindEmail.dto';
import { Tenant } from 'src/schemas/tenant';
import { Project, ProjectDocument } from 'src/schemas/project';
import { Daily, DailyDocument } from 'src/schemas/daily';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly dailyService: DailyService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Form.name) private readonly formModel: Model<Form>,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<Tenant>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Daily.name) private readonly dailyModel: Model<Daily>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async notifyDaily() {
    this.logger.debug(
      'Verificando se há usuários para enviar notificação de daily',
    );
    //this.sendDailySummary();
    const notifications = await this.getUsersForDailyNotifications();
    for (const notify of notifications) {
      await this.mailService.sendRemindEmail(notify);
      this.logger.log(
        'Email enviado para ' + notify.user.email + ' com sucesso!',
      );
    }

    this.logger.debug(
      'Fim da verificação de usuários para enviar notificação de daily',
    );
  }

  // TODO: fazer funcao em daily service que confere se a ultima resposta foi enviada, para enviar na hora o resumo das daily

  // Função que será executada diariamente às 23:59 no UTC -12:00
  @Cron('59 23 * * *', {
    timeZone: 'Etc/GMT+12', // Último fuso horário antes de virar o dia
  })
  async sendDailySummary() {
    const today = new Date();

    // Adiciona 12 horas para garantir que a consulta seja para o dia anterior em UTC-12
    const lastTimeZoneToday = new Date(today.setUTCHours(12, 0, 0, 0));
    const date = lastTimeZoneToday.toLocaleDateString('pt-BR');

    this.logger.debug(date);

    // Busca projetos que têm dailies sem resposta para o dia específico
    const projectsWithNoResponses = await this.dailyModel
      .aggregate([
        {
          $match: {
            date,
            formResponses: { $size: 0 },
          },
        },
        {
          $lookup: {
            from: 'formSnapshots', // Nome da coleção onde os snapshots de formulários estão
            localField: 'formSnapshot._id', // Campo no daily que referencia o formSnapshot
            foreignField: '_id', // Campo em formSnapshots que é a chave primária
            as: 'snapshotInfo',
          },
        },
        {
          $unwind: {
            path: '$snapshotInfo',
            preserveNullAndEmptyArrays: true, // Para garantir que os dailies sejam retornados mesmo sem correspondência
          },
        },
        {
          $lookup: {
            from: 'projects', // Nome da coleção de projetos
            localField: 'snapshotInfo.projectId', // Campo no snapshot que referencia o projeto
            foreignField: '_id', // Campo em projects que é a chave primária
            as: 'projectInfo',
          },
        },
        {
          $unwind: {
            path: '$projectInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            date: 1,
            formSnapshot: 1,
            projectId: '$projectInfo._id',
            projectName: '$projectInfo.name', // Supondo que o projeto tem um campo `name`
          },
        },
      ])
      .exec();

    if (projectsWithNoResponses.length === 0) {
      this.logger.log(
        'Nenhuma daily sem resposta encontrada para os projetos.',
      );
      return;
    }

    // Busca dailies completas para os projetos que têm dailies sem resposta
    const dailyDocs = await this.dailyModel
      .find({
        date,
        'formSnapshot.projectId': {
          $in: projectsWithNoResponses.map((p) => p.formSnapshot.projectId),
        }, // Filtra apenas os projetos relevantes
      })
      .populate('userId', 'name email')
      .populate('formSnapshot.projectId', '_id name')
      .exec();

    // Organiza os resumos por projeto
    const summaries: {
      projects: {
        projectId: string;
        projectName: string;
        usersToSend: { name: string; email: string }[];
        responses: { question: string; answer: any; respondedBy: string }[];
      }[];
    } = {
      projects: [],
    };

    dailyDocs.forEach((d) => {
      const projectId = (d.formSnapshot.projectId as ProjectDocument)._id;
      const projectName = (d.formSnapshot.projectId as ProjectDocument).name;

      // Verifica se o projeto já existe na lista de resumos
      let projectSummary = summaries.projects.find(
        (p) => p.projectId === projectId.toHexString(),
      );

      if (!projectSummary) {
        // Se não existir, cria um novo objeto para o projeto
        projectSummary = {
          projectId: projectId.toHexString(),
          projectName,
          usersToSend: [],
          responses: [],
        };
        summaries.projects.push(projectSummary);
      }

      // Adiciona usuário à lista de destinatários
      if (
        !projectSummary.usersToSend.some(
          (user) => user.email === (d.userId as UserDocument).email,
        )
      ) {
        projectSummary.usersToSend.push({
          name: (d.userId as UserDocument).name,
          email: (d.userId as UserDocument).email,
        });
      }

      // Adiciona as respostas
      d.formResponses.forEach((response) => {
        projectSummary.responses.push({
          question: response.textQuestion,
          answer: response.answer,
          respondedBy: (d.userId as UserDocument).name,
        });
      });
    });

    // Envia os e-mails
    for (const project of summaries.projects) {
      if (project.responses.length !== 0) {
        for (const user of project.usersToSend) {
          await this.mailService.sendEmail(
            [user.email],
            `Resumo da sua daily - Projeto: ${project.projectName}`,
            'daily_summary',
            {
              name: user.name,
              projectName: project.projectName,
              responses: project.responses,
              date,
            },
          );
        }
      }
    }

    console.log('Resumos diários enviados.');
  }

  private async getUsersForDailyNotifications(): Promise<sendRemindEmailDto[]> {
    const notifications: sendRemindEmailDto[] = [];

    const aggregatedData = await this.formModel.aggregate([
      {
        $lookup: {
          from: 'tenants',
          localField: 'tenantId',
          foreignField: '_id',
          as: 'tenant',
        },
      },
      {
        $unwind: '$tenant',
      },
      {
        $lookup: {
          from: 'projects',
          localField: 'projectId',
          foreignField: '_id',
          as: 'project',
        },
      },
      {
        $unwind: '$project',
      },
      {
        $match: {
          isCurrentForm: true,
        },
      },
      {
        $project: {
          _id: 1,
          notifyTime: 1,
          notifyDays: 1,
          'tenant.name': 1,
          'tenant._id': 1,
          'project._id': 1,
          'project.name': 1,
        },
      },
    ]);

    for (const form of aggregatedData) {
      const { notifyTime, notifyDays, tenant } = form;

      const project = await this.projectModel
        .findById(form.project._id)
        .populate('users', 'name email timezone')
        .exec();
      const { users }: { users: any[] } = project;
      for (const user of users) {
        const currentTime = this.getCurrentTimeInUserTimezone(
          user.timezone.value,
        );

        const currentDay = this.getCurrentDayInUserTimezone(
          user.timezone.value,
        );

        if (
          this.compareTimes(notifyTime, currentTime) &&
          notifyDays.includes(currentDay)
        ) {
          const daily = await this.dailyService.checkOrCreateDaily(
            {
              email: user.email,
              userId: user._id.toHexString(),
              name: user.name,
              currentTenant: {
                tenantId: form.tenant._id.toString(),
                role: undefined,
              },
            },
            form._id.toString(),
          );

          if (daily.today.formResponses.length === 0) {
            notifications.push({
              user: {
                name: user.name,
                email: user.email,
              },
              tenantName: tenant.name,
              projectName: project.name,
            });
          }
        }
      }
    }

    return notifications;
  }

  private getCurrentTimeInUserTimezone(timezone: string): string {
    return new Date().toLocaleTimeString('pt-BR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private getCurrentDayInUserTimezone(timezone: string): string {
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      timeZone: timezone,
    });
  }

  private compareTimes(notifyTime: string, currentTime: string): boolean {
    return notifyTime === currentTime;
  }
}
