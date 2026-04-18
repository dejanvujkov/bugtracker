import { IRepository } from './IRepository';
import { Comment, CreateCommentDTO, UpdateCommentDTO } from '../../core/models';

export interface ICommentRepository extends IRepository<Comment, CreateCommentDTO, UpdateCommentDTO> {
  findByTask(taskId: string): Promise<Comment[]>;
}
