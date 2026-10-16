import { ForbiddenException } from '@nestjs/common';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import { CompaniesService } from '../companies/companies.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeesService } from './employees.service';

describe('EmployeesService subscription enforcement', () => {
  it('does not create an employee for HR when the company has no active plan', () => {
    const data = new InMemoryDataService();
    data.companies.push({ id: 'CMP-1001', name: 'Acme Wellness' } as any);
    const service = new EmployeesService(
      data,
      new CompaniesService(data),
      new SubscriptionsService(data),
    );
    const employee = {
      name: 'Alex Employee',
      department: 'Engineering',
      email: 'alex.employee@gmail.com',
      password: 'secure123',
      companyId: 'CMP-1001',
    } as CreateEmployeeDto;

    expect(() => service.create(employee, true)).toThrow(ForbiddenException);
    expect(data.employees).toHaveLength(0);
  });
});
