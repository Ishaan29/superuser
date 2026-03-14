import { IServiceFactory, Service } from './IServiceFactory';

export interface ServiceConfig {
    singleton?: boolean;
    dependencies?: string[];
    factory?: () => Service;
}

export class ServiceRegistry implements IServiceFactory {
    private services: Map<string, Service> = new Map();
    private serviceConfigs: Map<string, ServiceConfig> = new Map();
    private singletons: Map<string, Service> = new Map();

    /**
     * Register a service with configuration
     */
    register(serviceName: string, serviceClass: new (...args: any[]) => Service, config: ServiceConfig = {}): void {
        this.serviceConfigs.set(serviceName, {
            singleton: true, // Default to singleton
            dependencies: [],
            factory: () => new serviceClass(),
            ...config
        });
    }

    /**
     * Register a service factory function
     */
    registerFactory(serviceName: string, factory: () => Service, config: ServiceConfig = {}): void {
        this.serviceConfigs.set(serviceName, {
            singleton: true,
            dependencies: [],
            factory,
            ...config
        });
    }

    /**
     * Get service instance
     */
    getService(serviceName: string): Service {
        const config = this.serviceConfigs.get(serviceName);
        if (!config) {
            throw new Error(`Service '${serviceName}' is not registered`);
        }

        // Return singleton if exists and configured as singleton
        if (config.singleton && this.singletons.has(serviceName)) {
            return this.singletons.get(serviceName)!;
        }

        // Resolve dependencies first
        const dependencies = this.resolveDependencies(config.dependencies || []);
        
        // Create new instance
        const service = config.factory!();
        
        // Store as singleton if configured
        if (config.singleton) {
            this.singletons.set(serviceName, service);
        }

        return service;
    }

    /**
     * Resolve service dependencies
     */
    private resolveDependencies(dependencies: string[]): Service[] {
        return dependencies.map(dep => this.getService(dep));
    }

    /**
     * Check if service is registered
     */
    isRegistered(serviceName: string): boolean {
        return this.serviceConfigs.has(serviceName);
    }

    /**
     * Get all registered service names
     */
    getRegisteredServices(): string[] {
        return Array.from(this.serviceConfigs.keys());
    }

    /**
     * Clear all services and singletons
     */
    clear(): void {
        this.services.clear();
        this.serviceConfigs.clear();
        this.singletons.clear();
    }

    /**
     * Remove a specific service
     */
    unregister(serviceName: string): void {
        this.serviceConfigs.delete(serviceName);
        this.singletons.delete(serviceName);
        this.services.delete(serviceName);
    }
} 