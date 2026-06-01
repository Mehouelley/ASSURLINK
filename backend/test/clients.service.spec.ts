import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from '../../src/modules/clients/clients.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CreateClientDto } from '../../src/modules/clients/dto/create-client.dto';
import { NotFoundException } from '@nestjs/common';

describe('ClientsService Unit Tests', () => {
  let clientsService: ClientsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    client: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    clientsService = moduleRef.get<ClientsService>(ClientsService);
    prismaService = moduleRef.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new client', async () => {
      const companyId = 'company-1';
      const userId = 'user-1';
      const createClientDto: CreateClientDto = {
        client_type: 'individual',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+225 01 02 03 04',
      };

      const mockClient = {
        id: 'client-1',
        company_id: companyId,
        ...createClientDto,
        is_active: true,
        created_by: userId,
      };

      mockPrismaService.client.create.mockResolvedValue(mockClient);

      const result = await clientsService.create(companyId, userId, createClientDto);

      expect(mockPrismaService.client.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          company_id: companyId,
          first_name: createClientDto.first_name,
          created_by: userId,
        }),
      });
      expect(result).toMatchObject(mockClient);
    });
  });

  describe('findAll', () => {
    it('should return all clients for a company', async () => {
      const companyId = 'company-1';
      const mockClients = [
        {
          id: 'client-1',
          company_id: companyId,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+225 01 02 03 04',
          is_active: true,
        },
        {
          id: 'client-2',
          company_id: companyId,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone: '+225 05 06 07 08',
          is_active: true,
        },
      ];

      mockPrismaService.client.findMany.mockResolvedValue(mockClients);

      const result = await clientsService.findAll(companyId);

      expect(mockPrismaService.client.findMany).toHaveBeenCalledWith({
        where: { company_id: companyId },
        orderBy: { created_at: 'desc' },
      });
      expect(result).toEqual(mockClients);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no clients exist', async () => {
      const companyId = 'company-1';

      mockPrismaService.client.findMany.mockResolvedValue([]);

      const result = await clientsService.findAll(companyId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a single client', async () => {
      const clientId = 'client-1';
      const mockClient = {
        id: clientId,
        company_id: 'company-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+225 01 02 03 04',
        is_active: true,
      };

      mockPrismaService.client.findUnique.mockResolvedValue(mockClient);

      const result = await clientsService.findOne(clientId);

      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(result).toEqual(mockClient);
    });

    it('should throw NotFoundException if client not found', async () => {
      const clientId = 'non-existent';

      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(clientsService.findOne(clientId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      const clientId = 'client-1';
      const companyId = 'company-1';
      const updateData = {
        first_name: 'Jonathan',
        phone: '+225 10 20 30 40',
      };

      const mockUpdatedClient = {
        id: clientId,
        company_id: companyId,
        first_name: 'Jonathan',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+225 10 20 30 40',
        is_active: true,
      };

      mockPrismaService.client.findUnique.mockResolvedValue({
        id: clientId,
        company_id: companyId,
      });
      mockPrismaService.client.update.mockResolvedValue(mockUpdatedClient);

      const result = await clientsService.update(clientId, updateData);

      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(mockPrismaService.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
        data: expect.objectContaining(updateData),
      });
      expect(result.first_name).toBe('Jonathan');
    });

    it('should throw NotFoundException if client not found', async () => {
      const clientId = 'non-existent';

      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(
        clientsService.update(clientId, { first_name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a client', async () => {
      const clientId = 'client-1';
      const mockClient = {
        id: clientId,
        company_id: 'company-1',
        is_active: false,
      };

      mockPrismaService.client.findUnique.mockResolvedValue({
        id: clientId,
      });
      mockPrismaService.client.update.mockResolvedValue(mockClient);

      const result = await clientsService.remove(clientId);

      expect(mockPrismaService.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
        data: { is_active: false },
      });
      expect(result.is_active).toBe(false);
    });
  });
});
