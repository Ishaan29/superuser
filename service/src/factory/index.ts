export { IServiceFactory, Service } from './IServiceFactory';
export { ServiceFactory } from './ServiceFactory';
export { ServiceRegistry, ServiceConfig } from './ServiceRegistry';

// Export a default configured service factory
import { ServiceFactory } from './ServiceFactory';
export const defaultServiceFactory = new ServiceFactory();

// Usage example in comments:
/*
// Basic usage with ServiceFactory
import { defaultServiceFactory } from './factory';
const chatService = defaultServiceFactory.getChatService();

// Advanced usage with ServiceRegistry
import { ServiceRegistry } from './factory';
import { ChatService } from '../services/ChatService';

const registry = new ServiceRegistry();
registry.register('ChatService', ChatService, {
  singleton: true,
  dependencies: []
});

const chatService = registry.getService('ChatService') as ChatService;
*/ 