import { Request } from 'express';
import { InMemoryUser } from '../data/inMemoryDb'; // Ajuste o caminho conforme sua estrutura

declare global {
    namespace Express {
        interface Request {
            user?: InMemoryUser;
        }
    }
}