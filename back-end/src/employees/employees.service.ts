import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HARDCODED_SUPER_ADMIN_EMAIL } from '../common/constants/super-admin';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import {
  cleanText,
  createPrefixedRecordId,
  formatIndianPhoneNumber,
  isValidGmailAddress,
  isValidPassword,
  normalizeEmail,
  normalizeLookupValue,
} from '../common/utils/record.utils';
import { CompaniesService } from '../companies/companies.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeEntity } from './entities/employee.entity';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly data: InMemoryDataService,
    private readonly companiesService: CompaniesService,
  ) {}

  findAll(filters?: {
    email?: string;
    companyId?: string;
    companyName?: string;
    status?: string;
    department?: string;
  }): EmployeeEntity[] {
    let employees = [...this.data.employees];

    if (filters?.email) {
      const normalizedEmail = normalizeEmail(filters.email);
      employees = employees.filter((employee) => employee.email === normalizedEmail);
    }

    if (filters?.companyId) {
      const normalizedCompanyId = cleanText(filters.companyId);
      employees = employees.filter(
        (employee) => cleanText(employee.companyId) === normalizedCompanyId,
      );
    }

    if (filters?.companyName) {
      const normalizedCompanyName = normalizeLookupValue(filters.companyName);
      employees = employees.filter(
        (employee) =>
          normalizeLookupValue(employee.companyName) === normalizedCompanyName,
      );
    }

    if (filters?.status) {
      const normalizedStatus = normalizeLookupValue(filters.status);
      employees = employees.filter(
        (employee) => normalizeLookupValue(employee.status) === normalizedStatus,
      );
    }

    if (filters?.department) {
      const normalizedDepartment = normalizeLookupValue(filters.department);
      employees = employees.filter(
        (employee) =>
          normalizeLookupValue(employee.department) === normalizedDepartment,
      );
    }

    return employees;
  }

  findOne(id: string): EmployeeEntity {
    const normalizedId = cleanText(id);
    const employee =
      this.data.employees.find((entry) => entry.id === normalizedId) ?? null;

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    return employee;
  }

  create(createEmployeeDto: CreateEmployeeDto): EmployeeEntity {
    const company = this.resolveCompanyReference(
      createEmployeeDto.companyId,
      createEmployeeDto.companyName,
    );
    const preparedEmployee = this.prepareCreateInput(createEmployeeDto, company);
    this.assertEmailIsAvailable(preparedEmployee.email);

    const employee: EmployeeEntity = {
      id: createPrefixedRecordId('employee'),
      name: preparedEmployee.name,
      email: preparedEmployee.email,
      username: preparedEmployee.email,
      password: preparedEmployee.password,
      department: preparedEmployee.department,
      status: preparedEmployee.status,
      age: preparedEmployee.age,
      gender: preparedEmployee.gender,
      phoneNumber: preparedEmployee.phoneNumber,
      companyId: preparedEmployee.companyId,
      companyName: preparedEmployee.companyName,
      heightCm: preparedEmployee.heightCm,
      weightKg: preparedEmployee.weightKg,
      rewardPointsBalance: preparedEmployee.rewardPointsBalance,
      claimedRewardIds: preparedEmployee.claimedRewardIds,
      createdAt: preparedEmployee.createdAt,
      updatedAt: preparedEmployee.updatedAt,
    };

    this.data.employees.unshift(employee);
    return employee;
  }

  update(id: string, updateEmployeeDto: UpdateEmployeeDto): EmployeeEntity {
    const currentEmployee = this.findOne(id);
    const hasCompanyId =
      Object.prototype.hasOwnProperty.call(updateEmployeeDto, 'companyId');
    const hasCompanyName =
      Object.prototype.hasOwnProperty.call(updateEmployeeDto, 'companyName');
    const nextCompany = hasCompanyId || hasCompanyName
      ? this.resolveCompanyReference(
          hasCompanyId ? updateEmployeeDto.companyId : currentEmployee.companyId,
          hasCompanyName
            ? updateEmployeeDto.companyName
            : currentEmployee.companyName,
        )
      : this.resolveCompanyReference(
          currentEmployee.companyId,
          currentEmployee.companyName,
        );
    const nextEmail = Object.prototype.hasOwnProperty.call(updateEmployeeDto, 'email')
      ? normalizeEmail(updateEmployeeDto.email)
      : currentEmployee.email;
    const nextName = Object.prototype.hasOwnProperty.call(updateEmployeeDto, 'name')
      ? cleanText(updateEmployeeDto.name)
      : currentEmployee.name;
    const nextDepartment = Object.prototype.hasOwnProperty.call(
      updateEmployeeDto,
      'department',
    )
      ? cleanText(updateEmployeeDto.department)
      : currentEmployee.department;
    const nextPassword = Object.prototype.hasOwnProperty.call(
      updateEmployeeDto,
      'password',
    )
      ? cleanText(updateEmployeeDto.password)
      : currentEmployee.password;
    const nextStatus = Object.prototype.hasOwnProperty.call(updateEmployeeDto, 'status')
      ? cleanText(updateEmployeeDto.status)
      : currentEmployee.status;
    const nextAge = Object.prototype.hasOwnProperty.call(updateEmployeeDto, 'age')
      ? this.normalizeMetricValue(updateEmployeeDto.age, {
          label: 'Age',
          min: 18,
          max: 99,
        })
      : currentEmployee.age;
    const nextGender = Object.prototype.hasOwnProperty.call(updateEmployeeDto, 'gender')
      ? cleanText(updateEmployeeDto.gender)
      : currentEmployee.gender;
    const nextPhoneNumber = Object.prototype.hasOwnProperty.call(
      updateEmployeeDto,
      'phoneNumber',
    )
      ? this.normalizeOptionalPhoneNumber(updateEmployeeDto.phoneNumber)
      : currentEmployee.phoneNumber;
    const nextHeightCm = Object.prototype.hasOwnProperty.call(
      updateEmployeeDto,
      'heightCm',
    )
      ? this.normalizeMetricValue(updateEmployeeDto.heightCm, {
          label: 'Height',
          min: 80,
          max: 250,
        })
      : currentEmployee.heightCm;
    const nextWeightKg = Object.prototype.hasOwnProperty.call(
      updateEmployeeDto,
      'weightKg',
    )
      ? this.normalizeMetricValue(updateEmployeeDto.weightKg, {
          label: 'Weight',
          min: 20,
          max: 300,
        })
      : currentEmployee.weightKg;
    const nextRewardPointsBalance = Object.prototype.hasOwnProperty.call(
      updateEmployeeDto,
      'rewardPointsBalance',
    )
      ? this.normalizeRewardPointsBalance(updateEmployeeDto.rewardPointsBalance)
      : this.normalizeRewardPointsBalance(currentEmployee.rewardPointsBalance);
    const nextClaimedRewardIds = Object.prototype.hasOwnProperty.call(
      updateEmployeeDto,
      'claimedRewardIds',
    )
      ? this.normalizeClaimedRewardIds(updateEmployeeDto.claimedRewardIds)
      : this.normalizeClaimedRewardIds(currentEmployee.claimedRewardIds);

    if (!nextName) {
      throw new BadRequestException('Employee name cannot be blank.');
    }

    if (!nextDepartment) {
      throw new BadRequestException('Choose a department for the employee.');
    }

    if (!nextEmail || !isValidGmailAddress(nextEmail)) {
      throw new BadRequestException('Enter a valid Gmail address for the employee.');
    }

    if (!nextPassword || !isValidPassword(nextPassword)) {
      throw new BadRequestException(
        'Employee password must be at least 6 characters long.',
      );
    }

    if (
      this.data.employees.some(
        (employee) => employee.id !== currentEmployee.id && employee.email === nextEmail,
      )
    ) {
      throw new BadRequestException(
        'Another employee already uses that email address.',
      );
    }

    this.assertEmailIsAvailable(nextEmail, currentEmployee.id);

    currentEmployee.name = nextName;
    currentEmployee.email = nextEmail;
    currentEmployee.username = nextEmail;
    currentEmployee.password = nextPassword;
    currentEmployee.department = nextDepartment;
    currentEmployee.status = nextStatus || 'Active';
    currentEmployee.age = nextAge;
    currentEmployee.gender = nextGender;
    currentEmployee.phoneNumber = nextPhoneNumber;
    currentEmployee.companyId = nextCompany.id;
    currentEmployee.companyName = nextCompany.name;
    currentEmployee.heightCm = nextHeightCm;
    currentEmployee.weightKg = nextWeightKg;
    currentEmployee.rewardPointsBalance = nextRewardPointsBalance;
    currentEmployee.claimedRewardIds = nextClaimedRewardIds;
    currentEmployee.updatedAt = new Date().toISOString();

    return currentEmployee;
  }

  remove(id: string): EmployeeEntity {
    const employee = this.findOne(id);
    const employeeIndex = this.data.employees.findIndex(
      (entry) => entry.id === employee.id,
    );

    this.data.employees.splice(employeeIndex, 1);
    return employee;
  }

  private prepareCreateInput(
    createEmployeeDto: CreateEmployeeDto,
    company: { id: string; name: string },
  ) {
    const name = cleanText(createEmployeeDto.name);
    const department = cleanText(createEmployeeDto.department);
    const email = normalizeEmail(createEmployeeDto.email);
    const password = cleanText(createEmployeeDto.password);
    const status = cleanText(createEmployeeDto.status) || 'Active';
    const age = this.normalizeMetricValue(createEmployeeDto.age, {
      label: 'Age',
      min: 18,
      max: 99,
    });
    const gender = cleanText(createEmployeeDto.gender);
    const phoneNumber = this.normalizeOptionalPhoneNumber(
      createEmployeeDto.phoneNumber,
    );
    const heightCm = this.normalizeMetricValue(createEmployeeDto.heightCm, {
      label: 'Height',
      min: 80,
      max: 250,
    });
    const weightKg = this.normalizeMetricValue(createEmployeeDto.weightKg, {
      label: 'Weight',
      min: 20,
      max: 300,
    });
    const rewardPointsBalance = this.normalizeRewardPointsBalance(
      createEmployeeDto.rewardPointsBalance,
    );
    const claimedRewardIds = this.normalizeClaimedRewardIds(
      createEmployeeDto.claimedRewardIds,
    );
    const now = new Date().toISOString();

    if (!name || !department || !email || !password) {
      throw new BadRequestException(
        'Please complete all employee fields before saving.',
      );
    }

    if (!isValidGmailAddress(email)) {
      throw new BadRequestException('Enter a valid Gmail address for the employee.');
    }

    if (!isValidPassword(password)) {
      throw new BadRequestException(
        'Employee password must be at least 6 characters long.',
      );
    }

    return {
      name,
      department,
      email,
      password,
      status,
      age,
      gender,
      phoneNumber,
      companyId: company.id,
      companyName: company.name,
      heightCm,
      weightKg,
      rewardPointsBalance,
      claimedRewardIds,
      createdAt: now,
      updatedAt: now,
    };
  }

  private resolveCompanyReference(companyId?: string, companyName?: string) {
    const normalizedCompanyId = cleanText(companyId);
    const normalizedCompanyName = normalizeLookupValue(companyName);
    const companies = this.companiesService.findAll();
    const company =
      companies.find(
        (entry) => normalizedCompanyId && entry.id === normalizedCompanyId,
      ) ??
      companies.find(
        (entry) =>
          normalizedCompanyName &&
          normalizeLookupValue(entry.name) === normalizedCompanyName,
      ) ??
      null;

    if (!company) {
      throw new BadRequestException(
        'Select a valid company name that already exists.',
      );
    }

    return company;
  }

  private assertEmailIsAvailable(email: string, ignoreEmployeeId?: string): void {
    if (email === normalizeEmail(HARDCODED_SUPER_ADMIN_EMAIL)) {
      throw new BadRequestException(
        'That email address is already assigned to the super user account.',
      );
    }

    if (
      this.data.hrProfiles.some(
        (profile) => profile.email === email,
      )
    ) {
      throw new BadRequestException(
        'That email address is already assigned to an HR account.',
      );
    }

    if (
      this.data.experts.some(
        (expert) => expert.email === email,
      )
    ) {
      throw new BadRequestException(
        'That email address is already assigned to a wellness expert account.',
      );
    }

    if (
      this.data.employees.some(
        (employee) =>
          employee.id !== cleanText(ignoreEmployeeId) && employee.email === email,
      )
    ) {
      throw new BadRequestException('An employee with that email already exists.');
    }
  }

  private normalizeMetricValue(
    value: unknown,
    options: { label: string; min: number; max: number },
  ): string {
    const raw = cleanText(value);
    if (!raw) {
      return '';
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < options.min || parsed > options.max) {
      throw new BadRequestException(
        `${options.label} must be between ${options.min} and ${options.max}.`,
      );
    }

    return String(parsed);
  }

  private normalizeOptionalPhoneNumber(value: unknown): string {
    const rawPhoneNumber = cleanText(value);
    if (!rawPhoneNumber) {
      return '';
    }

    const formattedPhoneNumber = formatIndianPhoneNumber(rawPhoneNumber);
    if (!formattedPhoneNumber) {
      throw new BadRequestException('Enter a valid Indian phone number.');
    }

    return formattedPhoneNumber;
  }

  private normalizeRewardPointsBalance(value: unknown): string {
    const raw = cleanText(value);
    if (!raw) {
      return '500';
    }

    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new BadRequestException(
        'Reward points balance must be 0 or a positive whole number.',
      );
    }

    return String(parsed);
  }

  private normalizeClaimedRewardIds(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return [...new Set(value.map((entry) => cleanText(entry)).filter(Boolean))];
  }
}
