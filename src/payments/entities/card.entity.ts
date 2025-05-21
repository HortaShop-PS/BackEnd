import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../entities/user.entity'; 

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number; // Ou string, dependendo do tipo do ID do User. Este campo será usado para associar o cartão ao usuário.

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User; // Relação com User comentada temporariamente

  @Column({ length: 4 })
  last4Digits: string;

  @Column()
  brand: string; // e.g., 'visa', 'mastercard'

  @Column({ length: 2 })
  expiryMonth: string; // MM

  @Column({ length: 2 })
  expiryYear: string; // YY

  @Column()
  cardholderName: string;

  @Column()
  cardType: string; // 'debit' or 'credit'

  // O CVV não deve ser armazenado por razões de segurança.
  // O número completo do cartão também não deve ser armazenado diretamente.
  // Idealmente, um token de um gateway de pagamento seria usado.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}