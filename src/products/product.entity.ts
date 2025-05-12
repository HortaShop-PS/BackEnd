import { Producer } from 'src/entities/producer.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

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

  @ManyToOne(() => Producer, (producer) => producer.products)
  @JoinColumn({ name: 'producer_id' })
  producer: Producer;

  @Column({ nullable: true })
  description?: string;
}
