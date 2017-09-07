/*
* Copyright (C) 2017 TypeFox and others.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import { injectable, inject } from "inversify";
import { MarkersTree, MarkerNode } from './markers-tree';
import { TreeModel, TreeServices, OpenerService, open, ITreeNode } from "@theia/core/lib/browser";

@injectable()
export class MarkersTreeServices extends TreeServices {
    @inject(OpenerService) readonly openerService: OpenerService;
}

@injectable()
export class MarkersTreeModel extends TreeModel {

    protected readonly openerService: OpenerService;

    constructor(
        @inject(MarkersTree) protected readonly tree: MarkersTree,
        @inject(MarkersTreeServices) readonly services: MarkersTreeServices
    ) {
        super(tree, services);
    }

    protected doOpenNode(node: ITreeNode): void {
        if (MarkerNode.is(node)) {
            open(this.openerService, node.uri);
        } else {
            super.doOpenNode(node);
        }
    }
}
