import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}

  healthCheck(): string {
    return 'The service is up and running!';
  }
}
