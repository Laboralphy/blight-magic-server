import type { ServerMessage } from '@blight/protocol';
import type { SocketStatus } from './SocketClient';
import type { useSessionStore } from '../stores/sessionStore';
import type { useChatStore } from '../stores/chatStore';
import type { useGameStore } from '../stores/gameStore';

/**
 * The part of SocketClient the dispatcher listens to
 */
export interface IServerEventSource {
    on<T extends ServerMessage['type']>(
        type: T,
        handler: (message: Extract<ServerMessage, { type: T }>) => void
    ): void;
    onStatus(listener: (status: SocketStatus) => void): void;
}

/**
 * Routes every server message to the store that owns the matching state
 */
export class ServerEventDispatcher {
    constructor(
        private readonly session: ReturnType<typeof useSessionStore>,
        private readonly chat: ReturnType<typeof useChatStore>,
        private readonly game: ReturnType<typeof useGameStore>
    ) {}

    bind(source: IServerEventSource): void {
        const { session, chat, game } = this;
        source.onStatus((status) => {
            session.statusChanged(status);
            if (status === 'closed') {
                game.reset();
            }
        });
        source.on('auth.welcome', (m) => {
            chat.clear();
            session.welcomed(m.userId, m.name);
        });
        source.on('auth.error', (m) => session.rejected(m.reason));
        source.on('chat.message', (m) =>
            chat.message(m.channel, m.from.name, m.from.color, m.text)
        );
        source.on('chat.channel', (m) => chat.enteredChannel(m.channel));
        source.on('chat.presence', (m) =>
            chat.info(`${m.name} ${m.event === 'joined' ? 'joined' : 'left'} #${m.channel}`)
        );
        source.on('system.info', (m) => chat.info(m.text));
        source.on('system.error', (m) => chat.error(m.text));
        source.on('game.joined', (m) => game.joined(m.game));
        source.on('game.left', (m) => {
            game.left(m.gameId);
            chat.info(`You left game ${m.gameId} (${m.reason})`);
        });
        source.on('game.state', (m) => game.stateReceived(m.state));
    }
}
