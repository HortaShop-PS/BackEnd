import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../entities/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from '../../entities/order-status-history.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled'
}

@Entity('orders') // ← USAR NOVO NOME SEM ASPAS
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: number;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  items: OrderItem[];

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  trackingCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderStatusHistory, history => history.order, { cascade: true })
  statusHistory: OrderStatusHistory[];

  // ← ADICIONAR COLUNAS NOVAS (TypeORM vai criar automaticamente)
  @Column({ type: 'text', nullable: true })
  statusNotes: string | null;

  @Column({ type: 'boolean', default: false })
  readyForPickup: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readyNotifiedAt: Date | null;
}