import { ForbiddenException } from '@nestjs/common';
import { InMemoryDataService } from '../common/data/in-memory-data.service';
import { CompaniesService } from '../companies/companies.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateExpertDto } from './dto/create-expert.dto';
import { ExpertsService } from './experts.service';

describe('ExpertsService subscription enforcement', () => {
  it('does not create a wellness expert for HR when the company has no active plan', () => {
    const data = new InMemoryDataService();
    data.companies.push({ id: 'CMP-1001', name: 'Acme Wellness' } as any);
    const service = new ExpertsService(
      data,
      new CompaniesService(data),
      new SubscriptionsService(data),
    );
    const expert = {
      name: 'Alex Expert',
      specialization: 'Nutritionist',
      experience: '5 years',
      email: 'alex.expert@gmail.com',
      password: 'secure123',
      companyId: 'CMP-1001',
    } as CreateExpertDto;

    expect(() => service.create(expert, true)).toThrow(ForbiddenException);
    expect(data.experts).toHaveLength(0);
  });
});

describe('ExpertsService availability validation', () => {
  it('removes past and consultation-overlapping slots while retaining later free slots', () => {
    const data = new InMemoryDataService();
    const companyId = 'CMP-AVAILABILITY-TEST';
    data.companies.push({ id: companyId, name: 'Availability Test Company' } as any);
    const expertId = 'expert-availability-test';
    const now = new Date();
    const appointmentStart = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    appointmentStart.setMinutes(0, 0, 0);
    const asSlot = (minutes: number) =>
      new Date(appointmentStart.getTime() + minutes * 60_000).toISOString();
    const appointmentDate = `${appointmentStart.getFullYear()}-${String(appointmentStart.getMonth() + 1).padStart(2, '0')}-${String(appointmentStart.getDate()).padStart(2, '0')}`;
    const appointmentTime = `${String(appointmentStart.getHours()).padStart(2, '0')}:${String(appointmentStart.getMinutes()).padStart(2, '0')}`;
    const freeSlot = new Date(appointmentStart.getTime() + 3 * 60 * 60 * 1000).toISOString();
    const pastSlot = new Date(now.getTime() - 60_000).toISOString();

    data.experts.push({
      id: expertId,
      name: 'Alex Expert',
      email: 'alex.availability@gmail.com',
      username: 'alex.availability@gmail.com',
      password: 'secure123',
      specialization: 'Nutritionist',
      experience: '5 years',
      phoneNumber: '',
      companyId,
      companyName: 'Availability Test Company',
      status: 'Active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      availableSlots: [],
    });
    data.consultations.push({
      id: 'consult-availability-test',
      employeeId: 'employee-availability-test',
      employeeName: 'Jamie Employee',
      expertId,
      expertName: 'Alex Expert',
      purpose: 'Scheduled consultation',
      category: 'Nutritionist',
      requestedOn: now.toISOString(),
      status: 'accepted',
      rejectionReason: '',
      sessionTitle: 'Scheduled consultation',
      sessionDate: appointmentDate,
      sessionTime: appointmentTime,
      sessionDuration: '45 min',
      sessionMeetingLink: 'https://meet.example.com/session',
      sessionCreatedAt: now.toISOString(),
      createdByExpert: false,
      sourceCheckinId: '',
      followUpPriority: '',
      companyId,
      companyName: 'Availability Test Company',
      createdAt: now.toISOString(),
    });

    const service = new ExpertsService(
      data,
      new CompaniesService(data),
      new SubscriptionsService(data),
    );
    const updated = service.update(expertId, {
      availableSlots: [
        asSlot(0),
        asSlot(15),
        asSlot(30),
        asSlot(45),
        freeSlot,
        pastSlot,
        freeSlot,
      ],
    });

    expect(updated.availableSlots).toEqual([asSlot(45), freeSlot]);
  });

  it('allows a time again when its previous consultation was canceled', () => {
    const data = new InMemoryDataService();
    const companyId = 'CMP-CANCELED-TEST';
    data.companies.push({ id: companyId, name: 'Canceled Test Company' } as any);
    const now = new Date();
    const slot = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    slot.setSeconds(0, 0);
    const expertId = 'expert-canceled-test';
    data.experts.push({
      id: expertId,
      name: 'Alex Expert',
      email: 'alex.canceled@gmail.com',
      username: 'alex.canceled@gmail.com',
      password: 'secure123',
      specialization: 'Nutritionist',
      experience: '5 years',
      phoneNumber: '',
      companyId,
      companyName: 'Canceled Test Company',
      status: 'Active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      availableSlots: [],
    });
    data.consultations.push({
      id: 'consult-canceled-test',
      expertId,
      status: 'cancelled',
      sessionDate: `${slot.getFullYear()}-${String(slot.getMonth() + 1).padStart(2, '0')}-${String(slot.getDate()).padStart(2, '0')}`,
      sessionTime: `${String(slot.getHours()).padStart(2, '0')}:${String(slot.getMinutes()).padStart(2, '0')}`,
      sessionDuration: '30 min',
    } as any);

    const service = new ExpertsService(
      data,
      new CompaniesService(data),
      new SubscriptionsService(data),
    );

    expect(service.update(expertId, { availableSlots: [slot.toISOString()] }).availableSlots)
      .toEqual([slot.toISOString()]);
  });
});
