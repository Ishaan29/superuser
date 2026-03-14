export interface Service {
    // Base interface for all services
}

export interface IServiceFactory {
    getService(serviceName: string): Service;
} 