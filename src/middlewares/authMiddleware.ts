import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../data/inMemoryDb'; // Nosso "banco de dados" em memória
import { IUser } from '../interfaces/user'; // Supondo que IUser pode ter a propriedade 'password' vinda do DB

// Interface para a requisição autenticada.
// req.user não deve conter a senha.
interface AuthRequest extends Request {
  user?: Omit<IUser, 'password'>; // Omitimos 'password' do tipo IUser para req.user
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res
      .status(401)
      .json({ message: 'Não autorizado, nenhum token fornecido.' });
    return; // Importante: sair da função após enviar a resposta
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não está definido.');
      res.status(500).json({ message: 'Erro de configuração do servidor.' });
      return; // Sair da função
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

    // Buscar usuário no DB em memória
    const userFromDb = db.users.find((user) => user.id === decoded.id);

    if (!userFromDb) {
      res.status(401).json({
        message: 'Não autorizado, token inválido ou usuário não encontrado.',
      });
      return; // Sair da função
    }

    // Criar um novo objeto para req.user sem a senha
    // Isso evita mutar o objeto original no 'db.users' e garante que a senha não seja exposta.
    const { password, ...userToAttach } = userFromDb;
    req.user = userToAttach;

    next(); // Prosseguir para o próximo middleware ou rota
  } catch (error) {
    console.error('Erro de autenticação:', error);
    res.status(401).json({ message: 'Não autorizado, token falhou.' });
    return; // Sair da função em caso de erro na verificação do token
  }
};
