/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable } from "inversify";
import URI from "@theia/core/lib/common/uri";
import { Disposable, Event, Emitter } from "@theia/core/lib/common";

export interface Marker {
    uri: URI;
    kind: string;
    owner: string;
}

export interface MarkerInfo {
    counter: number;
    uri: URI
}

export class MarkerCollection implements Disposable {

    protected readonly markers = new Map<string, Marker[]>();

    constructor(
        public readonly owner: string,
        protected readonly fireDispose: () => void,
        protected readonly fireChange: () => void
    ) { }

    dispose(): void {
        this.fireDispose();
    }

    get uris(): string[] {
        return Array.from(this.markers.keys());
    }

    getMarkers(uri: string): Marker[] {
        return this.markers.get(uri) || [];
    }

    setMarkers(uri: string, markers: Marker[]): void {
        if (markers.length > 0) {
            this.markers.set(uri, markers);
        } else {
            this.markers.delete(uri);
        }
        this.fireChange();
    }

}

@injectable()
export class MarkersManager {

    protected readonly owners = new Map<string, MarkerCollection>();
    protected readonly onDidChangeMarkersEmitter = new Emitter<void>();

    get onDidChangeMarkers(): Event<void> {
        return this.onDidChangeMarkersEmitter.event;
    }
    protected fireOnDidChangeMarkers(): void {
        this.onDidChangeMarkersEmitter.fire(undefined);
    }

    createCollection(owner: string): MarkerCollection {
        if (this.owners.has(owner)) {
            throw new Error('marker collection for the given owner already exists, owner: ' + owner);
        }
        const collection = new MarkerCollection(owner, () => this.deleteCollection(owner), () => this.fireOnDidChangeMarkers());
        this.owners.set(owner, collection);
        return collection;
    }

    protected deleteCollection(owner: string): void {
        this.owners.delete(owner);
    }

    getMarkerInformationByKind(kind: string): MarkerInfo[] {
        const markerInfos: MarkerInfo[] = [];
        this.owners.forEach(collection => {
            collection.uris.forEach(uri => {
                const markers = collection.getMarkers(uri).filter(marker => marker.kind === kind);
                const markerInfo = markerInfos.find(m => m.uri.toString() === uri);
                if (markers && !markerInfo) {
                    markerInfos.push({
                        uri: new URI(uri),
                        counter: markers.length
                    });
                } else if (markers && markerInfo) {
                    markerInfo.counter += markers.length;
                }
            });
        });
        return markerInfos;
    }

    getMarkersByUriAndKind(uri: URI, kind: string): Marker[] {
        const markers: Marker[] = [];
        this.owners.forEach(collection => {
            const markersByKind = collection.getMarkers(uri.toString()).filter(marker => marker.kind === kind);
            Array.prototype.push.apply(markers, markersByKind);
        });
        return markers;
    }
}
