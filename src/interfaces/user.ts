export interface IUser {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: 'user' | 'producer' | 'admin';
    createdAt: string;
}