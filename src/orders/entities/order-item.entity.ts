import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/product.entity';
import { Producer } from '../../entities/producer.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, order => order.items)
  @JoinColumn()
  order: Order;

  @ManyToOne(() => Product)
  @JoinColumn()
  product: Product;

  @Column()
  productId: string;

  @ManyToOne(() => Producer)
  @JoinColumn()
  producer: Producer;

  @Column()
  producerId: number;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ nullable: true })
  notes: string;

  @OneToOne(() => Review, review => review.orderItem)
  review: Review;
}