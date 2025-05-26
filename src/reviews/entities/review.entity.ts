import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Product } from '../../products/product.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Producer } from '../../entities/producer.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  productId: string;

  @ManyToOne(() => OrderItem, { nullable: true })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;

  @Column({ nullable: true })
  orderItemId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  // Producer review fields
  @ManyToOne(() => Producer, { nullable: true })
  @JoinColumn({ name: 'producer_id' })
  producer: Producer | null;

  @Column({ nullable: true })
  producerId: number;

  @Column({ type: 'int', nullable: true })
  producerRating: number;

  @Column({ type: 'text', nullable: true })
  producerComment: string;

  @Column({ type: 'int', nullable: true })
  orderRating: number;

  @Column({ type: 'text', nullable: true })
  orderComment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
