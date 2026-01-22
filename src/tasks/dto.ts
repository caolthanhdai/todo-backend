import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsEmail,
} from 'class-validator';
import { Role, TaskPriority, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueTime?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueTime?: string;
}

export class LoadTasksQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
export interface TaskMemberResponseDto {
  userId: string;
  name: string;
  email: string;
  avatarSrc?: string | null;
  role: Role;
}

export interface TaskResponseDto {
  taskId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;

  members: TaskMemberResponseDto[];

  files?: {
    id: string;
    name: string;
    url: string;
    files?: {
      id: string;
      name: string;
      url: string;
      uploadedAt: string;
      uploadedBy?: {
        userId: string;
        name: string;
      };
    }[];
  }[];

  images?: {
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
    uploadedBy?: {
      userId: string;
      name: string;
    };
  }[];

  messagesCount: number;
  createdAt: string;
  updatedAt: string;
}

export class AddTaskMemberDto {
  @IsEmail()
  email!: string;
}
