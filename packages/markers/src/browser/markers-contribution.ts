/*
* Copyright (C) 2017 TypeFox and others.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import { MarkerWidget } from './marker-widget';
import { inject, injectable } from "inversify";
import {
    CommandContribution,
    MenuContribution,
    KeybindingContribution,
    KeybindingRegistry,
    MenuModelRegistry,
    CommandRegistry,
    Command,
    KeyCode,
    Key,
    Modifier,
    MAIN_MENU_BAR
} from "@theia/core/lib/common";
import { FrontendApplication, CommonCommands } from "@theia/core/lib/browser";

export namespace MarkerCommands {
    export const OPEN: Command = {
        id: 'markers:open',
        label: 'Markers'
    };

    export const COPY: Command = {
        id: 'marker-context:copy',
        label: 'Copy'
    }
}

export const MARKER_CONTEXT_MENU = 'marker-context-menu';

@injectable()
export class MarkersContribution implements CommandContribution, MenuContribution, KeybindingContribution {

    constructor(
        @inject(MarkerWidget) protected readonly markerWidget: MarkerWidget,
        @inject(FrontendApplication) protected readonly app: FrontendApplication
    ) { }

    registerKeyBindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeyBinding({
            commandId: MarkerCommands.OPEN.id,
            keyCode: KeyCode.createKeyCode({
                first: Key.KEY_M, modifiers: [Modifier.M2, Modifier.M1]
            })
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerSubmenu([MAIN_MENU_BAR], 'view', 'View');
        menus.registerMenuAction([MAIN_MENU_BAR, 'view'], {
            commandId: MarkerCommands.OPEN.id
        });

        menus.registerMenuAction([MARKER_CONTEXT_MENU], {
            commandId: CommonCommands.COPY.id
        });
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(MarkerCommands.OPEN, {
            isEnabled: () => true,
            execute: () => this.openMarkerView()
        });
    }

    protected openMarkerView(): void {
        this.app.shell.addToMainArea(this.markerWidget);
        this.app.shell.activateMain(this.markerWidget.id);
    }
}
