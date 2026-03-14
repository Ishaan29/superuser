import { ServiceFactory } from '../factory/ServiceFactory';
import { ServiceRegistry } from '../factory/ServiceRegistry';
import { ChatService } from '../services/ChatService';
import { UserService } from '../services/UserService';
import { PromptExtracterService } from '../services/PromptExtracterService';
import PromptService from '../services/promptService';
import LLMRouterService from '../services/llmRouterService';
import { ChatSemanticSearchService } from '../services/ChatSemanticSearchService';
import { PromptRepository } from '../repository/impl/promptRepository';
import { PromptModel } from '../models/Prompt';
import ChatSummaryService from '../services/chatMemoryService.ai';

export class ServiceContainer {
    private static instance: ServiceContainer;
    private serviceFactory: ServiceFactory;
    private serviceRegistry: ServiceRegistry;
    private initialized = false;

    private constructor() {
        this.serviceFactory = new ServiceFactory();
        this.serviceRegistry = new ServiceRegistry();
    }

    public static getInstance(): ServiceContainer {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer();
        }
        return ServiceContainer.instance;
    }

    /**
     * Initialize all services at app startup
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            console.log('⚠️  Services already initialized, skipping...');
            return;
        }

        console.log('🔧 Initializing services...');
        
        try {
            // Register services with advanced registry
            this.registerServices();
            
            // Validate all services
            await this.validateServices();
            
            this.initialized = true;
            console.log('✅ All services initialized successfully');
            
            // Log registered services
            this.logRegisteredServices();
            
        } catch (error) {
            console.error('❌ Failed to initialize services:', error);
            throw error;
        }
    }

    /**
     * Register all services in the registry
     */
    private registerServices(): void {
        // Register ChatService
        this.serviceRegistry.register('ChatService', ChatService, {
            singleton: true,
            dependencies: []
        });

        // Register UserService
        this.serviceRegistry.register('UserService', UserService, {
            singleton: true,
            dependencies: []
        });

        // Register PromptExtracterService
        this.serviceRegistry.register('PromptExtracterService', PromptExtracterService, {
            singleton: true,
            dependencies: []
        });

        // Register PromptService with factory for dependency injection
        this.serviceRegistry.registerFactory('PromptService', () => {
            const promptRepository = new PromptRepository(PromptModel);
            return new PromptService(promptRepository);
        }, {
            singleton: true,
            dependencies: []
        });

        // Register LLMRouterService
        this.serviceRegistry.register('LLMRouterService', LLMRouterService, {
            singleton: true,
            dependencies: []
        });

        // Register ChatSemanticSearchService
        this.serviceRegistry.register('ChatSemanticSearchService', ChatSemanticSearchService, {
            singleton: true,
            dependencies: []
        });

        // Register ChatMemoryService
        this.serviceRegistry.register('ChatMemoryService', ChatSummaryService, {
            singleton: true,
            dependencies: []
        });

        console.log('📋 Services registered in registry');
    }

    /**
     * Validate all services are working
     */
    private async validateServices(): Promise<void> {
        const serviceNames = this.serviceRegistry.getRegisteredServices();
        
        for (const serviceName of serviceNames) {
            try {
                const service = this.serviceRegistry.getService(serviceName);
                if (!service) {
                    throw new Error(`Service ${serviceName} not found`);
                }
                console.log(`✓ ${serviceName} validated`);
            } catch (error) {
                console.error(`✗ ${serviceName} validation failed:`, error);
                throw error;
            }
        }
    }

    /**
     * Log all registered services
     */
    private logRegisteredServices(): void {
        const services = this.serviceRegistry.getRegisteredServices();
        console.log('📦 Registered Services:');
        services.forEach(service => {
            console.log(`   • ${service}`);
        });
    }

    /**
     * Get the service factory instance
     */
    public getServiceFactory(): ServiceFactory {
        if (!this.initialized) {
            throw new Error('Services not initialized. Call initialize() first.');
        }
        return this.serviceFactory;
    }

    /**
     * Get the service registry instance
     */
    public getServiceRegistry(): ServiceRegistry {
        if (!this.initialized) {
            throw new Error('Services not initialized. Call initialize() first.');
        }
        return this.serviceRegistry;
    }

    /**
     * Get service by name with type safety
     */
    public getService<T>(serviceName: string): T {
        if (!this.initialized) {
            throw new Error('Services not initialized. Call initialize() first.');
        }
        return this.serviceRegistry.getService(serviceName) as T;
    }

    /**
     * Convenience methods for specific services
     */
    public getChatService(): ChatService {
        return this.getService<ChatService>('ChatService');
    }

    public getUserService(): UserService {
        return this.getService<UserService>('UserService');
    }

    public getPromptExtracterService(): PromptExtracterService {
        return this.getService<PromptExtracterService>('PromptExtracterService');
    }

    public getPromptService(): PromptService {
        return this.getService<PromptService>('PromptService');
    }

    public getLLMRouterService(): LLMRouterService {
        return this.getService<LLMRouterService>('LLMRouterService');
    }

    public getChatSemanticSearchService(): ChatSemanticSearchService {
        return this.getService<ChatSemanticSearchService>('ChatSemanticSearchService');
    }

    public getChatMemoryService(): ChatSummaryService {
        return this.getService<ChatSummaryService>('ChatMemoryService');
    }

    /**
     * Shutdown all services
     */
    public async shutdown(): Promise<void> {
        console.log('🛑 Shutting down services...');
        
        // Clear service registry
        this.serviceRegistry.clear();
        
        this.initialized = false;
        console.log('✅ Services shutdown complete');
    }
} 