import { Producer } from 'src/entities/producer.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Review } from '../reviews/entities/review.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  unit: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isNew: boolean;
  
  @Column({ nullable: true })
  category?: string;

  @Column({ default: false })
  isOrganic: boolean;

  @Column({ nullable: true })
  harvestSeason?: string;

  @Column({ nullable: true })
  origin?: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @ManyToOne(() => Producer, (producer) => producer.products)
  @JoinColumn({ name: 'producer_id' })
  producer: Producer;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => Review, review => review.product)
  reviews: Review[];
}