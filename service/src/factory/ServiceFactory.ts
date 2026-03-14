import { IServiceFactory, Service } from './IServiceFactory';
import { ChatService } from '../services/ChatService';
import { UserService } from '../services/UserService';
import { PromptExtracterService } from '../services/PromptExtracterService';
import PromptService from '../services/promptService';
import { PromptRepository } from '../repository/impl/promptRepository';
import { PromptModel } from '../models/Prompt';

export class ServiceFactory implements IServiceFactory {
    private services: Map<string, Service> = new Map();

    constructor() {
        this.initializeServices();
    }

    private initializeServices(): void {
        // Initialize all services as singletons
        this.services.set('ChatService', new ChatService());
        this.services.set('UserService', new UserService());
        this.services.set('PromptExtracterService', new PromptExtracterService());
        this.services.set('PromptService', new PromptService(new PromptRepository(PromptModel)));
    }

    getService(serviceName: string): Service {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service '${serviceName}' not found. Available services: ${Array.from(this.services.keys()).join(', ')}`);
        }
        return service;
    }

    // Type-safe service getters
    getChatService(): ChatService {
        return this.getService('ChatService') as ChatService;
    }

    getUserService(): UserService {
        return this.getService('UserService') as UserService;
    }

    getPromptExtracterService(): PromptExtracterService {
        return this.getService('PromptExtracterService') as PromptExtracterService;
    }

    getPromptService(): PromptService {
        return this.getService('PromptService') as PromptService;
    }

    // Register new services dynamically
    registerService(serviceName: string, service: Service): void {
        this.services.set(serviceName, service);
    }

    // Get all available service names
    getAvailableServices(): string[] {
        return Array.from(this.services.keys());
    }

    // Check if service exists
    hasService(serviceName: string): boolean {
        return this.services.has(serviceName);
    }
} 