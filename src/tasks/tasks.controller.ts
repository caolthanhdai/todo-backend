import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  Delete,
  Post,
  Body,
  Req,
  Res,
  UnauthorizedException, // http 401
} from '@nestjs/common'; // import necessary decorators
import { FileFieldsInterceptor } from '@nestjs/platform-express/multer/interceptors/file-fields.interceptor';
import {
  CreateTaskDto,
  LoadTasksQueryDto,
  UpdateTaskDto,
  AddTaskMemberDto,
} from './dto';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { multerConfig } from 'src/common/multer.config';
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // CREATE TASK + FILE + IMAGE
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'files', maxCount: 10 },
        { name: 'images', maxCount: 5 },
      ],
      multerConfig, // 🔑 ÁP DỤNG CẤU HÌNH
    ),
  )
  createTask(
    @Body() dto: CreateTaskDto,
    @UploadedFiles()
    assets: {
      files?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    @Req() req: Request,
  ) {
    return this.tasksService.createTask(dto, assets, (req as any).user.userId);
  }

  // LOAD TASKS
  @Get('list')
  loadTasks(@Query() query: LoadTasksQueryDto, @Req() req: Request) {
    return this.tasksService.loadTasks((req as any).user.userId, query);
  }

  // UPDATE TASK
  @Patch(':taskId')
  updateTask(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: Request,
  ) {
    return this.tasksService.updateTask(taskId, dto, (req as any).user.userId);
  }

  // DELETE TASK
  @Delete(':taskId')
  deleteTask(@Param('taskId') taskId: string, @Req() req: Request) {
    return this.tasksService.deleteTask(taskId, (req as any).user.userId);
  }

  // ADD FILE
  @Post(':taskId/files')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  addFile(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.tasksService.addFile(taskId, file, (req as any).user.userId);
  }

  // ADD IMAGE
  @Post(':taskId/images')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  addImage(
    @Param('taskId') taskId: string,
    @UploadedFile() image: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.tasksService.addImage(taskId, image, (req as any).user.userId);
  }
  @Get(':taskId')
  getTask(@Param('taskId') taskId: string, @Req() req: Request) {
    return this.tasksService.getTaskById(taskId, (req as any).user.userId);
  }

  @Post(':taskId/members')
  addMember(
    @Param('taskId') taskId: string,
    @Body() dto: AddTaskMemberDto,
    @Req() req: Request,
  ) {
    return this.tasksService.addMemberByEmail(
      taskId,
      dto.email,
      (req as any).user.userId,
    );
  }
}
