import { Test, TestingModule } from '@nestjs/testing';
import { IitdService } from './iitd.service';

describe('IitdService', () => {
  let service: IitdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IitdService],
    }).compile();

    service = module.get<IitdService>(IitdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
