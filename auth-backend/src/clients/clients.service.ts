import {
    Injectable,
    NotFoundException,
    Logger,
    InternalServerErrorException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ClientsService {
    private readonly logger = new Logger(ClientsService.name);

    constructor(private prisma: PrismaService) { }

    /*
        #Tasks
        1. Implement rotate client secret method
        2. Update create and update methods to handle new schema changes
        3. Add Methods to find using clientID for frontend.
        4. Add a method to validate client credentials
        5. Add proper error handling using NestJS HTTP exceptions
        6. Log errors using NestJS Logger service
        7. Add Try Catch blocks where necessary
        8. Ensure Prisma errors are handled using error codes
        9. Add a method to verify redirect URIs
        10. Update DTOs accordingly
                //END TASK//
    */

    async create(data: CreateClientDto) {
        const clientId = randomBytes(16).toString('hex');
        const clientSecret = randomBytes(32).toString('hex');

        try {
            return await this.prisma.client.create({
                data: {
                    ...data,
                    clientId,
                    clientSecret,
                },
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async rotateClientSecret(id: string) {
        const newClientSecret = randomBytes(32).toString('hex');
        try {
            return await this.prisma.client.update({
                where: { id },
                data: {
                    clientSecret: newClientSecret,
                },
            });
        } catch (error) {
            this.handlePrismaError(error, id);
        }
    }

    async findByClientId(clientId: string) {
        try {
            const client = await this.prisma.client.findUnique({
                where: { clientId },
            });
            if (!client) {
                throw new NotFoundException(`Client with Client ID ${clientId} not found`);
            }
            return client;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.handlePrismaError(error);
        }
    }

    async validateClient(clientId: string, clientSecret: string): Promise<boolean> {
        try {
            const client = await this.prisma.client.findUnique({
                where: { clientId },
            });
            if (client && client.clientSecret === clientSecret) {
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Error validating client: ${error.message}`, error.stack);
            return false;
        }
    }

    async validateRedirectUri(clientId: string, redirectUri: string): Promise<boolean> {
        try {
            const client = await this.prisma.client.findUnique({
                where: { clientId },
            });
            if (!client) return false;
            return client.redirectUris.includes(redirectUri);
        } catch (error) {
            this.logger.error(`Error validating redirect URI: ${error.message}`, error.stack);
            return false;
        }
    }

    async findAll() {
        try {
            return await this.prisma.client.findMany();
        } catch (error) {
            this.logger.error(`Error finding all clients: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Could not retrieve clients');
        }
    }

    async findOne(id: string) {
        try {
            const client = await this.prisma.client.findUnique({
                where: { id },
            });
            if (!client) {
                throw new NotFoundException(`Client with ID ${id} not found`);
            }
            return client;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.handlePrismaError(error, id);
        }
    }

    async update(id: string, data: UpdateClientDto) {
        try {
            return await this.prisma.client.update({
                where: { id },
                data,
                select: {
                    id: true,
                    name: true,
                    clientId: true,
                    redirectUris: true,
                    authMode: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        } catch (error) {
            this.handlePrismaError(error, id);
        }
    }

    async remove(id: string) {
        try {
            return await this.prisma.client.delete({
                where: { id },
            });
        } catch (error) {
            this.handlePrismaError(error, id);
        }
    }

    private handlePrismaError(error: any, id?: string) {
        this.logger.error(error.message, error.stack);
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                throw new ConflictException('Unique constraint failed');
            }
            if (error.code === 'P2025') {
                throw new NotFoundException(`Client with ID ${id || 'unknown'} not found`);
            }
        }
        throw new InternalServerErrorException('An unexpected error occurred');
    }
}
