import { Request, Response, NextFunction } from 'express';
import { IUser } from '../interfaces/user';

interface AuthRequest extends Request {
  user?: IUser;
}

export const authorizeProducer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user || req.user.role !== 'producer') {
    res.status(403).json({ message: 'Acesso negado: Você não é um produtor.' });
    return; // Adicionado para sair da função aqui
  }
  next();
};
