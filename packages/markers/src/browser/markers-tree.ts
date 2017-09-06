/*
* Copyright (C) 2017 TypeFox and others.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import { injectable, inject } from "inversify";
import { Tree, ICompositeTreeNode, ITreeNode, ISelectableTreeNode, IExpandableTreeNode } from "@theia/core/lib/browser";
import { MarkersManager, Marker } from './markers-manager';
import { UriSelection } from "@theia/filesystem/lib/common";
import URI from "@theia/core/lib/common/uri";

@injectable()
export class MarkersTree extends Tree {

    protected markerRoot: MarkerRootNode;
    protected markerInfoNodeCache: MarkerInfoNode[] = [];
    protected markerNodeCache: MarkerNode[] = [];

    constructor( @inject(MarkersManager) protected readonly markersManager: MarkersManager) {
        super();

        markersManager.onDidChangeMarkers(() => this.refresh());

        // TODO must be generalized
        this.markerRoot = {
            visible: false,
            id: 'markerTree',
            name: 'MarkerTree',
            kind: 'problem',
            children: [],
            parent: undefined
        };

        this.root = this.markerRoot;
    }

    resolveChildren(parent: ICompositeTreeNode): Promise<ITreeNode[]> {
        if (MarkerRootNode.is(parent)) {
            return this.getMarkerInfoNodes((parent as MarkerRootNode));
        } else if (MarkerInfoNode.is(parent)) {
            return this.getMarkerNodes(parent);
        }
        return super.resolveChildren(parent);
    }

    getMarkerInfoNodes(parent: MarkerRootNode): Promise<MarkerInfoNode[]> {
        // FIXME change to foreach...
        const markerFiles = this.markersManager.getMarkerInformationByKind(this.markerRoot.kind);
        const uriNodes: MarkerInfoNode[] = [];
        // FIXME use this.getNode() instead of local caches
        // FIXME reuse existing nodes instead of creating new
        markerFiles.forEach(markerInfo => {
            const cachedMarkerInfo = this.markerInfoNodeCache.find(m => m.uri.toString() === markerInfo.uri);
            const markerInfoNodeUri = new URI(markerInfo.uri);
            const markerInfoNode: MarkerInfoNode = {
                children: [],
                expanded: cachedMarkerInfo ? cachedMarkerInfo.expanded : false,
                uri: markerInfoNodeUri,
                id: 'markerInfo-' + markerInfoNodeUri.displayName,
                name: markerInfoNodeUri.displayName,
                parent,
                selected: false,
                numberOfMarkers: markerInfo.counter
            };
            uriNodes.push(markerInfoNode);
        });
        this.markerInfoNodeCache = uriNodes;
        return Promise.resolve(uriNodes);
    }

    getMarkerNodes(parent: MarkerInfoNode): Promise<MarkerNode[]> {
        const markers = this.markersManager.getMarkersByUriAndKind(parent.uri.toString(), parent.parent.kind);
        const markerNodes: MarkerNode[] = [];
        let counter: number = 0;
        // FIXME use this.getNode() instead of local caches
        // FIXME reuse existing nodes instead of creating new
        markers.forEach(marker => {
            counter++;
            const cachedMarkerNode = this.markerNodeCache.find(m => m.uri.toString() === marker.uri);
            const uri = new URI(marker.uri);
            const markerNode: MarkerNode = {
                id: marker.id,
                name: marker.kind,
                parent,
                selected: cachedMarkerNode ? cachedMarkerNode.selected : false,
                uri,
                marker
            };
            markerNodes.push(markerNode);
        });
        this.markerNodeCache = markerNodes;
        return Promise.resolve(markerNodes);
    }
}

export interface MarkerNode extends UriSelection, ISelectableTreeNode {
    marker: Marker<object>;
}
export namespace MarkerNode {
    export function is(node: ITreeNode | undefined): node is MarkerNode {
        return UriSelection.is(node) && ISelectableTreeNode.is(node) && 'marker' in node;
    }
}

export interface MarkerInfoNode extends UriSelection, ISelectableTreeNode, IExpandableTreeNode {
    parent: MarkerRootNode;
    numberOfMarkers: number;
}
export namespace MarkerInfoNode {
    export function is(node: ITreeNode | undefined): node is MarkerInfoNode {
        return IExpandableTreeNode.is(node) && UriSelection.is(node);
    }
}

export interface MarkerRootNode extends ICompositeTreeNode {
    kind: string;
}
export namespace MarkerRootNode {
    export function is(node: ITreeNode | undefined): node is MarkerRootNode {
        return ICompositeTreeNode.is(node) && 'kind' in node;
    }
}
