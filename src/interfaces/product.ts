// As interfaces para a lógica do backend (com IDs do próprio sistema, e não do MongoDB)
export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  stock: number;
  images: { url: string }[];
  producerId: string;
  createdAt: string;
}
