/*
* Copyright (C) 2017 TypeFox and others.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import { injectable, inject } from 'inversify';
import { ProblemWidget } from './problem-widget';
import { MarkerContribution } from '../marker-contribution';
import { MenuModelRegistry } from '@theia/core/lib/common';
import { CommonCommands } from '@theia/core/lib/browser';

export const MARKER_CONTEXT_MENU = 'marker-context-menu';

@injectable()
export class ProblemContribution extends MarkerContribution {

    constructor( @inject(ProblemWidget) protected readonly markerWidget: ProblemWidget) {
        super();
    }

    protected openMarkerView(): void {
        this.app.shell.addToMainArea(this.markerWidget);
        this.app.shell.activateMain(this.markerWidget.id);
    }

    registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);

        menus.registerMenuAction([MARKER_CONTEXT_MENU], {
            commandId: CommonCommands.COPY.id
        });
    }
}



