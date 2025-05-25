// src/routes/productRoutes.ts
import { Router } from 'express';
import {
  createProduct,
  getProducerProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { protect } from '../middlewares/authMiddleware';
import { authorizeProducer } from '../middlewares/producerMiddleware';

const router = Router();

// Todas estas rotas serão protegidas e acessíveis apenas por produtores
router
  .route('/me/products')
  .post(protect, authorizeProducer, createProduct)
  .get(protect, authorizeProducer, getProducerProducts);

router
  .route('/me/products/:productId')
  .get(protect, authorizeProducer, getProductById)
  .put(protect, authorizeProducer, updateProduct)
  .delete(protect, authorizeProducer, deleteProduct);

export default router;

// Problematic: Explicitly returning res.json(...)
export const myProblematicHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  // ... some logic ...
  if (someCondition) {
    return res.status(400).json({ message: 'Bad request' }); // This 'return' causes the type error
  }
  // ... more logic ...
  return res.status(200).json({ data: 'Success' }); // This 'return' also causes the type error
};
