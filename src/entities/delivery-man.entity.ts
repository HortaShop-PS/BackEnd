import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('delivery_men')
export class DeliveryMan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string;

  @Column()
  phone: string;

  @Column({ unique: true })
  cpf: string;

  @Column({ unique: true })
  cnhNumber: string;

  @Column({ nullable: true })
  vehicleType: string; // moto, carro, bicicleta, etc.

  @Column({ nullable: true })
  vehicleBrand: string;

  @Column({ nullable: true })
  vehicleModel: string;

  @Column({ nullable: true })
  vehicleYear: string;

  @Column({ nullable: true })
  vehiclePlate: string;

  @Column({ nullable: true })
  vehicleColor: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isAvailable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}