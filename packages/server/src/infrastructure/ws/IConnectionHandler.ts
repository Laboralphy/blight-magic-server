/**
 * Handles the traffic of one WebSocket connection
 */
export interface IConnectionHandler {
    handleMessage(raw: string): Promise<void>;
    handleClose(): Promise<void>;
}
