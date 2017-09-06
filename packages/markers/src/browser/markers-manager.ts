/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable } from "inversify";
import { Disposable, Event, Emitter } from "@theia/core/lib/common";

export interface Marker<T> {
    id: string;
    uri: string;
    owner: string;
    kind: string;
    data: T;
}

export interface MarkerInfo {
    counter: number;
    uri: string
}

export class MarkerCollection<T> implements Disposable {

    protected readonly markers = new Map<string, Readonly<Marker<T>>[]>();
    protected readonly idSequences = new Map<string, number>();

    constructor(
        public readonly owner: string,
        public readonly kind: string,
        protected readonly fireDispose: () => void,
        protected readonly fireChange: () => void
    ) { }

    dispose(): void {
        this.fireDispose();
    }

    get uris(): string[] {
        return Array.from(this.markers.keys());
    }

    getMarkers(uri: string): Readonly<Marker<T>>[] {
        return this.markers.get(uri) || [];
    }

    setMarkers(uri: string, markerData: T[]): void {
        if (markerData.length > 0) {
            this.markers.set(uri, markerData.map(data => this.createMarker(uri, data)));
        } else {
            this.markers.delete(uri);
        }
        this.fireChange();
    }

    protected createMarker(uri: string, data: T): Readonly<Marker<T>> {
        const id = this.nextId(uri);
        return Object.freeze({
            uri,
            kind: this.kind,
            owner: this.owner,
            id: `${this.owner}_${uri}_${id}`,
            data
        });
    }

    protected nextId(uri: string): number {
        const id = this.idSequences.get(uri) || 0;
        this.idSequences.set(uri, id + 1);
        return id;
    }

}

@injectable()
export class MarkersManager {

    protected readonly owners = new Map<string, MarkerCollection<object>>();
    protected readonly onDidChangeMarkersEmitter = new Emitter<void>();

    get onDidChangeMarkers(): Event<void> {
        return this.onDidChangeMarkersEmitter.event;
    }
    protected fireOnDidChangeMarkers(): void {
        this.onDidChangeMarkersEmitter.fire(undefined);
    }

    createCollection<T extends object>(owner: string, kind: string): MarkerCollection<T> {
        if (this.owners.has(owner)) {
            throw new Error('marker collection for the given owner already exists, owner: ' + owner);
        }
        const collection = new MarkerCollection<T>(owner, kind, () => this.deleteCollection(owner), () => this.fireOnDidChangeMarkers());
        this.owners.set(owner, collection);
        return collection;
    }

    protected deleteCollection(owner: string): void {
        this.owners.delete(owner);
    }

    getMarkerInformationByKind(kind: string): MarkerInfo[] {
        const markerInfos: MarkerInfo[] = [];
        this.owners.forEach(collection => {
            if (collection.kind === kind) {
                collection.uris.forEach(uri => {
                    const markers = collection.getMarkers(uri);
                    const markerInfo = markerInfos.find(m => m.uri.toString() === uri);
                    if (markers && !markerInfo) {
                        markerInfos.push({
                            uri,
                            counter: markers.length
                        });
                    } else if (markers && markerInfo) {
                        markerInfo.counter += markers.length;
                    }
                });
            }
        });
        return markerInfos;
    }

    getMarkersByUriAndKind(uri: string, kind: string): Readonly<Marker<Object>>[] {
        const markers: Marker<Object>[] = [];
        this.owners.forEach(collection => {
            if (collection.kind === kind) {
                const markersByKind = collection.getMarkers(uri);
                markers.push(...markersByKind);
            }
        });
        return markers;
    }
}
