import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { User } from '../../entities/user.entity';
  
  @Entity('addresses')
  export class Address {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    street: string;
  
    @Column()
    number: string;
  
    @Column({ nullable: true })
    complement?: string;
  
    @Column()
    neighborhood: string;
  
    @Column()
    city: string;
  
    @Column()
    state: string;
  
    @Column()
    zipCode: string;
  
    @Column({ nullable: true })
    country?: string;
  
    @Column('decimal', { precision: 10, scale: 8, nullable: true })
    latitude?: number;
  
    @Column('decimal', { precision: 11, scale: 8, nullable: true })
    longitude?: number;
  
    @Column({ nullable: true })
    formattedAddress?: string;
  
    @Column({ default: false })
    isDefault: boolean;
  
    @ManyToOne(() => User, user => user.addresses, { nullable: false })
    user: User;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }