import { ApiProperty } from '@nestjs/swagger';

export class CompanyEntity {
  @ApiProperty({ example: 'CMP-1001' })
  id: string;

  @ApiProperty({ example: 'Stack Builders Pvt Ltd' })
  name: string;

  @ApiProperty({ example: '+91 98765 43210' })
  phone: string;

  @ApiProperty({ example: 'Bengaluru, Karnataka' })
  address: string;

  @ApiProperty({ example: 'contact@stackbuilders.com' })
  email: string;

  @ApiProperty({ example: 1777718400000 })
  createdAt: number;

  @ApiProperty({ example: '02 May 2026' })
  createdLabel: string;
}

