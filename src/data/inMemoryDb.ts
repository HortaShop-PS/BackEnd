import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs únicos

// --- Interfaces de Dados ---
export interface InMemoryProduct {
    id: string; // Usaremos string para IDs gerados por uuid
    name: string;
    description: string;
    price: number;
    categoryId: string; // ID da categoria
    stock: number;
    images: { url: string }[];
    producerId: string; // ID do produtor
    createdAt: string; // Data em formato ISO string
}

export interface InMemoryCategory {
    id: string;
    name: string;
    description?: string;
}

export interface InMemoryUser {
    id: string;
    name: string;
    email: string;
    password?: string; // Opcional, para não expor a senha
    role: 'user' | 'producer' | 'admin';
    createdAt: string;
}

// --- Dados Iniciais (Simulando um DB preenchido) ---
const categories: InMemoryCategory[] = [
    { id: uuidv4(), name: 'Vegetais', description: 'Produtos frescos da horta' },
    { id: uuidv4(), name: 'Frutas', description: 'Frutas selecionadas' },
    { id: uuidv4(), name: 'Laticínios', description: 'Leite, queijos e iogurtes' },
];

// O produtor com a role 'producer'
const producerId = uuidv4();
const users: InMemoryUser[] = [
    { id: uuidv4(), name: 'Usuário Comum', email: 'user@example.com', password: 'hashedpassword1', role: 'user', createdAt: new Date().toISOString() },
    { id: producerId, name: 'Produtor Teste', email: 'produtor@example.com', password: 'hashedpassword2', role: 'producer', createdAt: new Date().toISOString() },
];

const products: InMemoryProduct[] = [
    {
        id: uuidv4(),
        name: 'Tomate Orgânico',
        description: 'Tomates frescos cultivados sem agrotóxicos, ideais para saladas.',
        price: 5.99,
        categoryId: categories[0].id, // Associando ao ID da categoria 'Vegetais'
        stock: 100,
        images: [{ url: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Tomate' }],
        producerId: producerId,
        createdAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        name: 'Maçã Fuji',
        description: 'Maçãs doces e crocantes, perfeitas para um lanche saudável.',
        price: 8.50,
        categoryId: categories[1].id, // Associando ao ID da categoria 'Frutas'
        stock: 150,
        images: [{ url: 'https://via.placeholder.com/150/00FF00/FFFFFF?text=Maca' }],
        producerId: producerId,
        createdAt: new Date().toISOString()
    },
];

// Exporta as "coleções"
export const db = {
    products,
    categories,
    users,
};