import { Request, Response, NextFunction } from 'express';
import { db } from '../data/inMemoryDb';
import { InMemoryProduct, InMemoryUser } from '../data/inMemoryDb'; // Usar as interfaces do DB em memória
import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs únicos

interface AuthRequest extends Request {
  user?: InMemoryUser; // Usar a interface do usuário do DB em memória
}

// Payload esperado para criar/editar
interface ProductRequestBody {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  stock: number;
  images: { url: string }[];
}

export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      categoryId,
      stock,
      images,
    }: ProductRequestBody = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      !categoryId ||
      stock === undefined ||
      !images ||
      images.length === 0
    ) {
      res.status(400).json({
        message: 'Todos os campos são obrigatórios, incluindo imagens.',
      });
      return;
    }

    // Validação da categoria
    const categoryExists = db.categories.find((cat) => cat.id === categoryId);
    if (!categoryExists) {
      res.status(404).json({ message: 'Categoria não encontrada.' });
      return;
    }

    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Produtor não autenticado.' });
      return;
    }

    const newProduct: InMemoryProduct = {
      id: uuidv4(),
      name,
      description,
      price,
      categoryId,
      stock,
      images,
      producerId: req.user.id,
      createdAt: new Date().toISOString(),
    };

    db.products.push(newProduct); // Adiciona ao nosso array em memória

    res.status(201).json({
      success: true,
      data: newProduct,
    });
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    res
      .status(500)
      .json({ message: 'Erro ao criar produto.', error: error.message });
  }
};

export const getProducerProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Produtor não autenticado.' });
      return;
    }

    const producerProducts = db.products.filter(
      (p) => p.producerId === req.user?.id,
    );

    const productsWithCategoryNames = producerProducts.map((product) => {
      const category = db.categories.find(
        (cat) => cat.id === product.categoryId,
      );
      return {
        ...product,
        category: category
          ? { id: category.id, name: category.name }
          : undefined, // Retorna apenas ID e nome da categoria
      };
    });

    res.status(200).json({
      success: true,
      count: productsWithCategoryNames.length,
      data: productsWithCategoryNames,
    });
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    res
      .status(500)
      .json({ message: 'Erro ao listar produtos.', error: error.message });
  }
};

export const getProductById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Produtor não autenticado.' });
      return;
    }

    const product = db.products.find(
      (p) => p.id === req.params.productId && p.producerId === req.user?.id,
    );

    if (!product) {
      res.status(404).json({
        message: 'Produto não encontrado ou não pertence a este produtor.',
      });
      return;
    }

    const category = db.categories.find((cat) => cat.id === product.categoryId);
    const productWithCategory = {
      ...product,
      category: category ? { id: category.id, name: category.name } : undefined,
    };

    res.status(200).json({
      success: true,
      data: productWithCategory,
    });
  } catch (error: any) {
    console.error('Erro ao obter detalhes do produto:', error);
    res.status(500).json({
      message: 'Erro ao obter detalhes do produto.',
      error: error.message,
    });
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { categoryId, ...updateData }: Partial<ProductRequestBody> = req.body;

    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Produtor não autenticado.' });
      return;
    }

    const productIndex = db.products.findIndex(
      (p) => p.id === req.params.productId && p.producerId === req.user?.id,
    );

    if (productIndex === -1) {
      res.status(404).json({
        message: 'Produto não encontrado ou não pertence a este produtor.',
      });
      return;
    }

    const currentProduct = db.products[productIndex];
    const dataToUpdate: Partial<InMemoryProduct> = { ...updateData };

    if (categoryId) {
      const categoryExists = db.categories.find((cat) => cat.id === categoryId);
      if (!categoryExists) {
        res.status(404).json({ message: 'Categoria não encontrada.' });
        return;
      }
      dataToUpdate.categoryId = categoryId;
    }

    db.products[productIndex] = { ...currentProduct, ...dataToUpdate };

    res.status(200).json({
      success: true,
      data: db.products[productIndex],
    });
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    res
      .status(500)
      .json({ message: 'Erro ao atualizar produto.', error: error.message });
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Produtor não autenticado.' });
      return;
    }

    const initialLength = db.products.length;
    db.products = db.products.filter(
      (p) => p.id !== req.params.productId || p.producerId !== req.user?.id,
    );

    if (db.products.length === initialLength) {
      res.status(404).json({
        message: 'Produto não encontrado ou não pertence a este produtor.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Produto removido com sucesso.',
    });
  } catch (error: any) {
    console.error('Erro ao remover produto:', error);
    res
      .status(500)
      .json({ message: 'Erro ao remover produto.', error: error.message });
  }
};
