import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
export class MessageAuthorDto {
  userId!: string;
  name!: string;
  avatarSrc?: string | null;
}
export class MessageResponseDto {
  messageId!: string;
  taskId!: string;
  content!: string;
  createdAt!: Date;
  author!: MessageAuthorDto;
}
export class TaskWithLastMessageDto {
  taskId!: string;
  title!: string;
  updatedAt!: Date;
  lastMessage?: MessageResponseDto | null;
}

export class PaginationResponseDto<T> {
  data!: T[];
  nextCursor!: string | null;
}
