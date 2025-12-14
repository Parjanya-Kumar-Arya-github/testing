import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Logger,
    UsePipes,
    ValidationPipe,
    HttpException,
    HttpStatus,
    UseGuards,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../common/gaurds/jwt-auth.guard';
import { RolesGuard } from '../common/gaurds/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@Controller('clients')
export class ClientsController {
    private readonly logger = new Logger(ClientsController.name);

    constructor(private readonly clientsService: ClientsService) { }
    /* #Tasks */
    //1. Add admin in routes for admin Protection. ie: /admin/clients
    //2. Add Gaurds for admin protection(Once Guards are defined then do this )
    //3. Add Public route to get client details without client secret
    //4. Add a route for rotate client secret
    //5. Add validation pipes for DTOs and whitelisting
    //6. Update DTOs and methods to include new schema
    //7. Check service file for task in service;
    //8. Add Try Catch blocks where necessary
    //9. Add Proper prisma error handling using error codes and map them to HTTP exceptions
    //10. Logg the errors properly using NestJS Logger service
    /*END*/

    // --- Admin Routes ---

    @Post('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async create(@Body() createClientDto: CreateClientDto, @CurrentUser() user: RequestUser) {
        try {
            this.logger.log(`Admin ${user.sub} creating client ${createClientDto.name}`);
            return await this.clientsService.create(createClientDto);
        } catch (error) {
            this.handleError(error, 'Error creating client');
        }
    }

    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async findAll(@CurrentUser() user: RequestUser) {
        try {
            this.logger.log(`Admin ${user.sub} requested all clients`);
            return await this.clientsService.findAll();
        } catch (error) {
            this.handleError(error, 'Error finding all clients');
        }
    }

    @Get('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
        try {
            this.logger.log(`Admin ${user.sub} requested client ${id}`);
            return await this.clientsService.findOne(id);
        } catch (error) {
            this.handleError(error, `Error finding client with ID ${id}`);
        }
    }

    @Patch('admin/:id/rotate')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async rotateClientSecret(@Param('id') id: string, @CurrentUser() user: RequestUser) {
        try {
            this.logger.warn(`Admin ${user.sub} rotating secret for client ${id}`);
            return await this.clientsService.rotateClientSecret(id);
        } catch (error) {
            this.handleError(error, `Error rotating secret for client ${id}`);
        }
    }

    @Patch('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto, @CurrentUser() user: RequestUser) {
        try {
            this.logger.log(`Admin ${user.sub} updating client ${id}`);
            return await this.clientsService.update(id, updateClientDto);
        } catch (error) {
            this.handleError(error, `Error updating client ${id}`);
        }
    }

    @Delete('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
        try {
            this.logger.warn(`Admin ${user.sub} deleting client ${id}`);
            return await this.clientsService.remove(id);
        } catch (error) {
            this.handleError(error, `Error deleting client ${id}`);
        }
    }

    // --- Public Routes ---

    // Public route to get details by clientId (not internal ID)
    @Get('public/:clientId')
    async findOnePublic(@Param('clientId') clientId: string) {
        try {
            const client = await this.clientsService.findByClientId(clientId);
            if (!client) {
                // This should not happen as service throws, but for type safety:
                throw new BadRequestException('Client not found'); // Should map to NotFound but verify service throws NotFound
            }
            return {
                id: client.id,
                name: client.name,
                clientId: client.clientId,
                redirectUris: client.redirectUris,
                authMode: client.authMode,
                // Do not return clientSecret
            };
        } catch (error) {
            this.handleError(error, `Error finding public client details for ${clientId}`);
        }
    }

    private handleError(error: any, message: string) {
        this.logger.error(`${message}: ${error.message}`, error.stack);
        if (error instanceof HttpException) {
            throw error;
        }
        throw new InternalServerErrorException(message);
    }
}
