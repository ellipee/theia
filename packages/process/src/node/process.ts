/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from "inversify";
import { ProcessManager } from './process-manager';
import { ILogger, Emitter, Event, Disposable } from '@theia/core/lib/common';
import * as child from 'child_process';
import * as stream from 'stream';

export interface IProcessExitEvent {
    code: number,
    signal?: string
}

@injectable()
export abstract class Process implements Disposable {

    readonly id: number;
    abstract readonly type: 'Raw' | 'Terminal';
    abstract pid: number;
    abstract output: stream.Readable;
    protected abstract process: child.ChildProcess | undefined;
    protected abstract terminal: any;
    protected readonly exitEmitter = new Emitter<IProcessExitEvent>();
    protected readonly errorEmitter = new Emitter<Error>();
    protected _killed = false;

    constructor(
        @inject(ProcessManager) protected readonly processManager: ProcessManager,
        protected readonly logger: ILogger) {
        this.id = this.processManager.register(this);
        this.exitEmitter.event(this.handleOnExit.bind(this));
        this.errorEmitter.event(this.handleOnError.bind(this));
    }

    abstract kill(signal?: string): void;

    get killed() {
        return this._killed;
    }

    set killed(killed: boolean) {
        /* readonly public property */
    }

    get onExit(): Event<IProcessExitEvent> {
        return this.exitEmitter.event;

    }

    get onError(): Event<Error> {
        return this.errorEmitter.event;

    }

    dispose() {
        this.processManager.delete(this);

        if (this.killed === false) {
            const p = new Promise<void>(resolve => {
                this.kill();
                this.exitEmitter.event(event => resolve());
            });
            p.then(() => {
                this.exitEmitter.dispose();
                this.errorEmitter.dispose();
            });
        } else {
            this.exitEmitter.dispose();
            this.errorEmitter.dispose();
        }
    }

    protected emitOnExit(code: number, signal?: string) {
        this.exitEmitter.fire({ 'code': code, 'signal': signal });
    }

    protected handleOnExit(event: IProcessExitEvent) {
        this._killed = true;
        let logMsg = `Process ${this.pid} has exited with code ${event.code}`;

        if (event.signal !== undefined) {
            logMsg += `, signal : ${event.signal}.`;
        }
        this.logger.info(logMsg);
    }

    protected emitOnError(err: Error) {
        this.errorEmitter.fire(err);
    }

    protected handleOnError(error: Error) {
        this._killed = true;
        this.logger.error(error.toString());
    }
}
