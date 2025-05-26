import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Product } from '../products/product.entity';

@Entity('producers')
export class Producer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  cnpj: string;

  @Column({ nullable: true })
  farmName: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToOne(() => User, { eager: true })
  @JoinColumn()
  user: User;

  @Column()
  userId: number;

  @OneToMany(() => Product, product => product.producer)
  products: Product[];
}