import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateMessageDto, PaginationResponseDto } from './dto';
import { TaskWithLastMessageDto } from './dto';
import { MessageResponseDto } from './dto';

interface AuthRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  // SSR: list tasks + last message
  @Get('messages')
  getTasks(
    @Req() req: AuthRequest,
    @Query('cursor') cursor?: string,
  ): Promise<PaginationResponseDto<TaskWithLastMessageDto>> {
    return this.service.getTasksWithLastMessage(req.user.userId, 20, cursor);
  }

  @Get('tasks/:taskId/messages')
  getInitialMessages(@Param('taskId') taskId: string, @Req() req: AuthRequest) {
    return this.service.getInitialTaskMessages(taskId, req.user.userId);
  }

  @Get('tasks/:taskId/messages/before')
  getMessagesBefore(
    @Param('taskId') taskId: string,
    @Query('cursor') cursor: string,
    @Req() req: AuthRequest,
  ) {
    return this.service.getMessagesBefore(taskId, req.user.userId, cursor);
  }
  @Post('tasks/:taskId/messages')
  sendMessage(
    @Param('taskId') taskId: string,
    @Body() dto: CreateMessageDto,
    @Req() req: AuthRequest,
  ): Promise<MessageResponseDto> {
    return this.service.sendMessage(taskId, req.user.userId, dto.content);
  }
}
