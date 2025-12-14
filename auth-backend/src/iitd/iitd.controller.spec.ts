import { Test, TestingModule } from '@nestjs/testing';
import { IitdController } from './iitd.controller';

describe('IitdController', () => {
  let controller: IitdController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IitdController],
    }).compile();

    controller = module.get<IitdController>(IitdController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
