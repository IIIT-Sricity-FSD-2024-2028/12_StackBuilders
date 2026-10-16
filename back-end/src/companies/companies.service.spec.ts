import { CompaniesService } from './companies.service';
import { CompanyEntity } from './entities/company.entity';
import { InMemoryDataService } from '../common/data/in-memory-data.service';

describe('CompaniesService', () => {
  let data: InMemoryDataService;
  let service: CompaniesService;
  let company: CompanyEntity;

  beforeEach(() => {
    data = new InMemoryDataService();
    service = new CompaniesService(data);
    company = {
      id: 'CMP-1001',
      name: 'Acme Wellness',
      phone: '+91 98765 43210',
      address: 'Bengaluru',
      email: 'contact@acme.example',
      createdAt: Date.now(),
      createdLabel: '14 Oct 2026',
    };
    data.companies.push(company);
    data.hrProfiles.push({
      id: 'hr-1',
      companyId: company.id,
      companyName: company.name,
      status: 'Active',
    } as any);
    data.employees.push({
      id: 'employee-1',
      companyId: company.id,
      companyName: company.name,
      status: 'Active',
    } as any);
    data.experts.push({
      id: 'expert-1',
      companyId: company.id,
      companyName: company.name,
      status: 'Active',
    } as any);
    data.consultations.push({ companyId: company.id } as any);
    data.wellnessCheckins.push({ companyId: company.id } as any);
    data.checkinResponses.push({ companyId: company.id } as any);
    data.liveSessions.push({ companyId: company.id } as any);
    data.videos.push({ companyId: company.id } as any);
    data.challenges.push({ companyId: company.id } as any);
    data.rewards.push({ companyId: company.id } as any);
    data.subscriptions.push({
      id: 'sub-1',
      companyId: company.id,
      companyName: company.name,
      status: 'active',
    });
  });

  it('removes the company accounts but retains its wellness history', () => {
    const archived = service.remove(company.id);

    expect(archived.archivedAt).toBeDefined();
    expect(service.findAll()).toEqual([]);
    expect(data.companies).toHaveLength(1);
    expect(data.hrProfiles).toHaveLength(0);
    expect(data.employees).toHaveLength(0);
    expect(data.experts).toHaveLength(0);
    expect(data.consultations).toHaveLength(1);
    expect(data.wellnessCheckins).toHaveLength(1);
    expect(data.checkinResponses).toHaveLength(1);
    expect(data.liveSessions).toHaveLength(1);
    expect(data.videos).toHaveLength(1);
    expect(data.challenges).toHaveLength(1);
    expect(data.rewards).toHaveLength(1);
    expect(data.subscriptions[0].status).toBe('cancelled');
  });

  it('allows a fresh company with the same name after archiving the old one', () => {
    service.remove(company.id);

    const replacement = service.create({
      name: company.name,
      phone: '9876543211',
      address: 'Pune',
      email: 'new-contact@acme.example',
    });

    expect(replacement.id).not.toBe(company.id);
    expect(service.findAll()).toEqual([replacement]);
    expect(data.hrProfiles).toHaveLength(0);
  });
});
