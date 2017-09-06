/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject, decorate } from "inversify";
import { MonacoLanguages as BaseMonacoLanguages, ProtocolToMonacoConverter, MonacoToProtocolConverter } from "monaco-languageclient";
import { DisposableCollection } from '@theia/core/lib/common';
import { Languages, DiagnosticCollection } from "@theia/languages/lib/common";
import { MarkersManager, ProblemMarker } from "@theia/markers/lib/browser";
import { Diagnostic } from "@theia/languages/lib/browser";

decorate(injectable(), BaseMonacoLanguages);
decorate(inject(ProtocolToMonacoConverter), BaseMonacoLanguages, 0);
decorate(inject(MonacoToProtocolConverter), BaseMonacoLanguages, 1);

@injectable()
export class MonacoLanguages extends BaseMonacoLanguages implements Languages {

    constructor(
        @inject(ProtocolToMonacoConverter) p2m: ProtocolToMonacoConverter,
        @inject(MonacoToProtocolConverter) m2p: MonacoToProtocolConverter,
        @inject(MarkersManager) protected readonly markerManager: MarkersManager
    ) {
        super(p2m, m2p);
    }

    createDiagnosticCollection(name?: string): DiagnosticCollection {
        // FIXME: Monaco model markers should be created based on Theia problem markers
        const monacoCollection = super.createDiagnosticCollection(name);
        const owner = name || 'default';
        const collection = this.markerManager.createCollection(owner);
        const toDispose = new DisposableCollection();
        toDispose.push(collection);
        toDispose.push(monacoCollection);
        return {
            set: (uri, diagnostics) => {
                monacoCollection.set(uri, diagnostics);
                collection.setMarkers(uri, diagnostics.map(diagnostic => this.toMarker(owner, uri, diagnostic)));
            },
            dispose: () => toDispose.dispose()
        };
    }

    protected toMarker(owner: string, uri: string, diagnostic: Diagnostic): ProblemMarker {
        return {
            kind: 'problem',
            uri,
            diagnostic,
            owner
        };
    }
}
