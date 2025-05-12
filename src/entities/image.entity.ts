import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  mimetype: string;

  @Column({ type: 'bytea' })
  data: Buffer;

  @CreateDateColumn()
  createdAt: Date;
}