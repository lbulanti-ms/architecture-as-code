import { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { CalmService } from '../../service/calm-service.js';
import { ControlService } from '../../service/control-service.js';
import { InterfaceService } from '../../service/interface-service.js';
import { AdrService } from '../../service/adr-service/adr-service.js';
import { Data, Adr, isSlug } from '../../model/calm.js';
import { ControlData } from '../../model/control.js';
import { InterfaceData } from '../../model/interface.js';
import {
    type TypeInUrl,
    mapTypeInUrlToTypeInUI,
    loadResource,
    loadResourceForId,
} from '../components/tree-navigation/navigation-loaders.js';

type HubParams = {
    namespace: string;
    type: TypeInUrl;
    id: string;
    version: string;
};

interface UseResourceFromRouteOptions {
    onDataLoad: (data: Data) => void;
    onAdrLoad: (adr: Adr) => void;
    onControlLoad: (control: ControlData) => void;
    onInterfaceLoad: (iface: InterfaceData) => void;
    /**
     * Invoked when the routed resource fails to load (e.g. a deep link or a
     * detailed-architecture reference to a resource that does not exist), so the
     * page can show a not-found state instead of an empty pane. Never invoked
     * for a load started for a previous route. Expected stable (memoised).
     */
    onLoadError?: (error: unknown) => void;
}

/**
 * Deep-link / external-navigation loading for the item-detail route
 * (`/:namespace/:type/:id/:version`). Previously lived inside both
 * `TreeNavigation` (desktop) and `MobileNavMenu` (mobile); lifted here so it
 * runs from {@link Hub} directly on both viewports, independent of which
 * navigation surface is mounted. There must be exactly one owner of this effect.
 *
 * `onControlLoad`/`onInterfaceLoad` are read through refs (not effect deps) so
 * passing fresh callbacks does not re-fire the load; `onDataLoad`/`onAdrLoad`
 * are expected to be stable (memoised by the caller).
 */
export function useResourceFromRoute({
    onDataLoad,
    onAdrLoad,
    onControlLoad,
    onInterfaceLoad,
    onLoadError,
}: UseResourceFromRouteOptions) {
    const params = useParams<HubParams>();

    const onControlLoadRef = useRef(onControlLoad);
    onControlLoadRef.current = onControlLoad;
    const onInterfaceLoadRef = useRef(onInterfaceLoad);
    onInterfaceLoadRef.current = onInterfaceLoad;

    const calmService = useMemo(() => new CalmService(), []);
    const controlService = useMemo(() => new ControlService(), []);
    const interfaceService = useMemo(() => new InterfaceService(), []);
    const adrService = useMemo(() => new AdrService(), []);

    useEffect(() => {
        if (!(params.namespace && params.type && params.id && params.version)) return;
        const uiType = mapTypeInUrlToTypeInUI(params.type);
        const namespace = params.namespace;

        // The loaders have no cancellation, so a rejection can arrive after the
        // user has already navigated on; only report errors for the current route.
        let cancelled = false;
        const reportError = (error: unknown) => {
            if (!cancelled) onLoadError?.(error);
        };

        if (uiType === 'Interfaces') {
            interfaceService
                .fetchInterfacesForNamespace(namespace)
                .then((interfaces) => {
                    const match = interfaces.find((i) => i.id === Number(params.id));
                    if (match) {
                        onInterfaceLoadRef.current({
                            namespace,
                            interfaceId: match.id,
                            interfaceName: match.name,
                            interfaceDescription: match.description,
                        });
                    }
                })
                .catch(() => undefined);
            return;
        }

        if (uiType === 'Controls') {
            controlService
                .fetchControlsForDomain(namespace)
                .then((controls) => {
                    // Controls are deep-linked both by numeric id (mobile drill-down) and by
                    // name slug (global/Explorer search -> /controls/<name>/detail), so match either.
                    const match = controls.find((c) => String(c.id) === params.id || c.name === params.id);
                    if (match) {
                        onControlLoadRef.current({
                            domain: namespace,
                            controlId: match.id,
                            controlName: match.name,
                            controlDescription: match.description,
                            controlTitle: match.title,
                        });
                    }
                })
                .catch(() => undefined);
            return;
        }

        if (isSlug(params.id)) {
            loadResourceForId(params.version, uiType, namespace, params.id, calmService, onDataLoad, reportError);
        } else {
            loadResource({
                version: params.version,
                type: uiType,
                namespace,
                resourceID: params.id,
                calmService,
                onDataLoad,
                onAdrLoad,
                adrService,
                onError: reportError,
            });
        }
        return () => {
            cancelled = true;
        };
    }, [params, calmService, adrService, interfaceService, controlService, onDataLoad, onAdrLoad, onLoadError]);
}
