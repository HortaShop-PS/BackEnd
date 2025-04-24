import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  unit: string;          // ex.: "kg", "dúzia"

  @Column()
  imageUrl: string;      // URL da foto

  @Column({ default: false })
  isFeatured: boolean;   // aparece na Home?

  @Column({ default: false })
  isNew: boolean;        // selo “Novo”
}