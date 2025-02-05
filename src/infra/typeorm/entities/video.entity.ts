import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity()
@Unique(['videoID'])
export class Video extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  videoID: string;

  @Column()
  userId: string;

  @Column()
  fileBase64: string;

  @Column({ nullable: false, default: 'no url' })
  zipURL?: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}