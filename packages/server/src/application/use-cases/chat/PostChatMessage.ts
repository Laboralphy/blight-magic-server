import type { IChatService } from '../../ports/IChatService';

export type PostChatMessageDeps = {
    chatService: IChatService;
};

/**
 * A user says something in its current room
 */
export class PostChatMessage {
    private readonly deps: PostChatMessageDeps;

    constructor({ chatService }: PostChatMessageDeps) {
        this.deps = { chatService };
    }

    execute(userId: string, text: string): void {
        this.deps.chatService.post(userId, text);
    }
}
