/*
* Copyright (C) 2017 TypeFox and others.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import { injectable, inject } from 'inversify';
import { ProblemWidget } from './problem-widget';
import {
    MenuModelRegistry, Command, CommandContribution,
    MenuContribution, KeybindingContribution, KeybindingRegistry,
    KeyCode, Key, Modifier, CommandRegistry, MAIN_MENU_BAR
} from '@theia/core/lib/common';
import { CommonCommands, FrontendApplication } from '@theia/core/lib/browser';

export const MARKER_CONTEXT_MENU = 'marker-context-menu';

export namespace ProblemCommands {
    export const OPEN: Command = {
        id: 'markers:open',
        label: 'Markers'
    };
}

@injectable()
export class ProblemContribution implements CommandContribution, MenuContribution, KeybindingContribution {

    constructor(
        @inject(ProblemWidget) protected readonly markerWidget: ProblemWidget,
        @inject(FrontendApplication) protected readonly app: FrontendApplication) {
    }

    registerKeyBindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeyBinding({
            commandId: ProblemCommands.OPEN.id,
            keyCode: KeyCode.createKeyCode({
                first: Key.KEY_M, modifiers: [Modifier.M2, Modifier.M1]
            })
        });
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(ProblemCommands.OPEN, {
            isEnabled: () => true,
            execute: () => this.openMarkerView()
        });
    }

    protected openMarkerView(): void {
        this.app.shell.addToMainArea(this.markerWidget);
        this.app.shell.activateMain(this.markerWidget.id);
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerSubmenu([MAIN_MENU_BAR], 'view', 'View');
        menus.registerMenuAction([MAIN_MENU_BAR, 'view'], {
            commandId: ProblemCommands.OPEN.id
        });

        menus.registerMenuAction([MARKER_CONTEXT_MENU], {
            commandId: CommonCommands.COPY.id
        });
    }
}
