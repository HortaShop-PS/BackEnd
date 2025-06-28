import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Producer } from './producer.entity';
import { Review } from '../reviews/entities/review.entity';
import { Notification } from './notification.entity';
import { DeviceToken } from './device-token.entity';
import { Address } from '../addresses/entities/address.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', default: 'consumer' })
  userType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Producer, producer => producer.user)
  producer?: Producer;

  @OneToMany(() => Review, review => review.user)
  reviews: Review[];

  @OneToMany(() => Notification, notification => notification.user)
  notifications: Notification[];

  @OneToMany(() => DeviceToken, deviceToken => deviceToken.user)
  deviceTokens: DeviceToken[];

  @OneToMany(() => Address, address => address.user)
  addresses: Address[];
}
