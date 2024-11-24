import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PermissionsEnum } from 'src/enums/permissions.enum';
import { Daily, DailyDocument } from 'src/schemas/daily';
import { Form, FormDocument } from 'src/schemas/forms';
import { Project, ProjectDocument } from 'src/schemas/project';
import { Role, RoleDocument } from 'src/schemas/role';
import { Tenant, TenantDocument } from 'src/schemas/tenant';
import { User, UserDocument } from 'src/schemas/user';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Form.name) private formModel: Model<FormDocument>,
    @InjectModel(Daily.name) private dailyModel: Model<DailyDocument>,
  ) {}

  async seed() {
    await this.clean();
    await this.applySeed();
  }

  private async clean() {
    // Limpa os documentos existentes para evitar duplicação

    await Promise.all([
      this.userModel.deleteMany({}),
      this.roleModel.deleteMany({}),
      this.tenantModel.deleteMany({}),
      this.projectModel.deleteMany({}),
      this.formModel.deleteMany({}),
      this.dailyModel.deleteMany({}),
    ]);
  }

  private async applySeed() {
    // Cria o Tenant
    const tenant = await new this.tenantModel({
      name: 'Empresa X',
      identifier: 'empresa-x',
    }).save();

    // Cria Role de Administrador
    const adminRole = await new this.roleModel({
      name: 'Administrador',
      tenantId: tenant._id,
      permissions: Object.values(PermissionsEnum),
    }).save();

    // Cria Role de Usuário com permissão de VIEW_USER
    const userRole = await new this.roleModel({
      name: 'Usuário',
      tenantId: tenant._id,
      permissions: [PermissionsEnum.VIEW_USER],
    }).save();

    // Cria Usuários
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = await Promise.all(
      Array.from({ length: 5 }, async (_, i) => {
        const isAdmin = i === 0;
        return new this.userModel({
          name: isAdmin ? 'Admin User' : `User ${i}`,
          email: isAdmin ? 'admin@empresa.com' : `user${i}@empresa.com`,
          password: hashedPassword,
          tenantRoles: [
            {
              tenant: tenant._id,
              role: isAdmin ? adminRole._id : userRole._id,
            },
          ],
          timezone: { value: 'America/Sao_Paulo', offset: -3 },
        }).save();
      }),
    );

    console.log('Seed concluída para Tenants, Roles e Users!');

    const projects = await Promise.all(
      ['Projeto A', 'Projeto B'].map(async (projectName, i) => {
        // Distribuir usuários entre os projetos
        const projectUsers = i === 0 ? users.slice(0, 3) : users.slice(2);
        return new this.projectModel({
          name: projectName,
          isActive: true,
          description: `Descrição do ${projectName}`,
          tenantId: tenant._id,
          users: projectUsers.map((user) => user._id),
        }).save();
      }),
    );

    // Criação dos forms associados aos projetos
    const forms = await Promise.all(
      projects.map(async (project, i) => {
        return new this.formModel({
          tenantId: tenant._id,
          projectId: project._id,
          questions: [
            {
              text: 'Como foi seu dia?',
              answerType: 'text',
              order: 1,
              advancedSettings: {
                urgencyRequired: false,
              },
            },
            {
              text: 'Teve algum bloqueio?',
              answerType: 'yes/no',
              order: 2,
              advancedSettings: {
                urgencyRequired: true,
                urgencyThreshold: 5,
                urgencyRecipients: [users[0]._id], // Envia ao admin
              },
            },
            {
              text: 'Em que está focado atualmente?',
              answerType: 'multiple choice',
              order: 3,
              choices: ['Desenvolvimento', 'Teste', 'Documentação'],
              advancedSettings: {
                urgencyRequired: false,
              },
            },
          ],
          isCurrentForm: true,
          notifyDays: ['Monday', 'Wednesday', 'Friday'],
          notifyTime: '09:00',
        }).save();
      }),
    );

    // Criação das entradas de Daily para os usuários em 15 dias
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 15; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayOffset);

      await Promise.all(
        users.map(async (user) => {
          const form = forms[Math.floor(Math.random() * forms.length)];
          const shouldRespondToday = Math.random() > 0.3; // 70% chance de responder

          if (shouldRespondToday) {
            return new this.dailyModel({
              userId: user._id,
              date: new Intl.DateTimeFormat('pt-BR').format(date),
              tenantId: tenant._id,
              formSnapshot: form,
              formResponses: form.questions.map((question) => {
                const answer =
                  question.answerType === 'text'
                    ? 'Resposta do usuário'
                    : question.answerType === 'yes/no'
                      ? Math.random() > 0.5
                      : question.choices[
                          Math.floor(Math.random() * question.choices.length)
                        ];

                return {
                  textQuestion: question.text,
                  orderQuestion: question.order,
                  answer,
                  urgencyThreshold: question.advancedSettings.urgencyThreshold,
                };
              }),
            }).save();
          }
        }),
      );
    }

    console.log('Seed concluída para Projects, Forms e Daily Entries!');
  }
}
