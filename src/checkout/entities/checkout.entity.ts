import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../entities/user.entity';

export enum DeliveryMethod {
  DELIVERY = 'delivery',
  PICKUP = 'pickup'
}

@Entity('checkouts')
export class Checkout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'cart_id' })
  cartId: number;

  @Column({ name: 'order_id', nullable: true })
  orderId: string;

  @Column({ name: 'address_id', nullable: true })
  addressId: number;

  @Column({
    type: 'enum',
    enum: DeliveryMethod,
    name: 'delivery_method',
    nullable: true
  })
  deliveryMethod: DeliveryMethod;

  @Column({ name: 'coupon_code', nullable: true })
  couponCode: string;

  @Column({ name: 'subtotal', type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'discount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ name: 'total', type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}