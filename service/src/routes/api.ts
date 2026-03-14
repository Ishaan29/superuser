import { Router } from 'express';
import { userRoutes } from './users';
import { chatRoutes } from './chats';
import { modelsRoutes } from './models';
import { promptsRoutes } from './prompts';
import { smartChatRoutes } from './smartChat';
import { searchRoutes } from './search';
import { ocrRoutes } from './ocr';

export const apiRoutes = Router();

// Mount route modules
apiRoutes.use('/users', userRoutes);
apiRoutes.use('/chats', chatRoutes);
apiRoutes.use('/models', modelsRoutes);
apiRoutes.use('/prompts', promptsRoutes);
apiRoutes.use('/chat', smartChatRoutes);
apiRoutes.use('/search', searchRoutes);
apiRoutes.use('/ocr', ocrRoutes);



