/*
* Copyright (C) 2017 TypeFox and others.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import { interfaces, Container } from "inversify";
import { MarkersTree } from './markers-tree';
import { MarkersTreeModel, MarkersTreeServices } from './marker-tree-model';
import { MarkerWidget } from './marker-widget';
import { createTreeContainer, Tree, ITree, TreeWidget, ITreeModel, TreeModel, TreeServices, TreeProps, defaultTreeProps } from "@theia/core/lib/browser";
import { MARKER_CONTEXT_MENU } from "./markers-contribution";

export const MARKER_TREE_PROPS = <TreeProps>{
    ...defaultTreeProps,
    contextMenuPath: MARKER_CONTEXT_MENU
};

export function createMarkerContainer(parent: interfaces.Container): Container {
    const child = createTreeContainer(parent);

    child.unbind(Tree);
    child.bind(MarkersTree).toSelf();
    child.rebind(ITree).toDynamicValue(ctx => ctx.container.get(MarkersTree));

    child.unbind(TreeModel);
    child.bind(MarkersTreeModel).toSelf();
    child.rebind(ITreeModel).toDynamicValue(ctx => ctx.container.get(MarkersTreeModel));

    child.unbind(TreeServices);
    child.bind(MarkersTreeServices).toSelf();

    child.unbind(TreeWidget);
    child.bind(MarkerWidget).toSelf();

    child.rebind(TreeProps).toConstantValue(MARKER_TREE_PROPS);

    return child;
}

export function createMarkerWidget(parent: interfaces.Container): MarkerWidget {
    return createMarkerContainer(parent).get(MarkerWidget);
}

