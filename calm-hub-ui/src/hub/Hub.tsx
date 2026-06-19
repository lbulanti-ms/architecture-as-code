import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoChevronForwardOutline } from 'react-icons/io5';
import { TreeNavigation } from './components/tree-navigation/TreeNavigation.js';
import { BreadcrumbItem, Data, Adr } from '../model/calm.js';
import { ControlData } from '../model/control.js';
import { InterfaceData } from '../model/interface.js';
import { Navbar } from '../components/navbar/Navbar.js';
import { AdrRenderer } from './components/adr-renderer/AdrRenderer.js';
import { DocumentDetailSection } from './components/document-detail-section/DocumentDetailSection.js';
import { ControlDetailSection } from './components/control-detail-section/ControlDetailSection.js';
import { InterfaceDetailSection } from './components/interface-detail-section/InterfaceDetailSection.js';
import { DiagramSection } from './components/diagram-section/DiagramSection.js';
import { Sidebar } from '../visualizer/components/sidebar/Sidebar.js';
import type { SelectedItem } from '../visualizer/contracts/contracts.js';
import './Hub.css';

function parseCALMHubPath(ref: string): { namespace: string; type: 'architectures' | 'patterns'; id: string; version: string } | null {
    const match = ref.match(/^\/calm\/namespaces\/([^/]+)\/(architectures|patterns)\/([^/]+)\/versions\/([^/]+)$/);
    if (!match) return null;
    return { namespace: match[1], type: match[2] as 'architectures' | 'patterns', id: match[3], version: match[4] };
}

export default function Hub() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentDisplayNameRef = useRef<string | undefined>(undefined);
    const [data, setData] = useState<Data | undefined>();
    const [adrData, setAdrData] = useState<Adr | undefined>();
    const [controlData, setControlData] = useState<ControlData | undefined>();
    const [interfaceData, setInterfaceData] = useState<InterfaceData | undefined>();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);

    function handleDataLoad(data: Data) {
        setData(data);
        setAdrData(undefined);
        setControlData(undefined);
        setInterfaceData(undefined);
        setSelectedItem(null);
        currentDisplayNameRef.current = undefined;
    }

    function handleAdrLoad(adr: Adr) {
        setAdrData(adr);
        setData(undefined);
        setControlData(undefined);
        setInterfaceData(undefined);
        setSelectedItem(null);
    }

    function handleControlLoad(control: ControlData) {
        setControlData(control);
        setData(undefined);
        setAdrData(undefined);
        setInterfaceData(undefined);
        setSelectedItem(null);
    }

    function handleInterfaceLoad(iface: InterfaceData) {
        setInterfaceData(iface);
        setData(undefined);
        setAdrData(undefined);
        setControlData(undefined);
        setSelectedItem(null);
    }

    const handleItemSelect = useCallback((item: SelectedItem) => {
        setSelectedItem(item);
    }, []);

    const closeSidebar = useCallback(() => {
        setSelectedItem(null);
    }, []);

    const handleDisplayNameChange = useCallback((name: string | undefined) => {
        currentDisplayNameRef.current = name;
    }, []);

    const handleNavigateToDetailedArch = useCallback((ref: string) => {
        const parsed = parseCALMHubPath(ref);
        if (!parsed || !data) return;
        const currentCrumbs = (location.state as { breadcrumbs?: BreadcrumbItem[] } | null)?.breadcrumbs || [];
        const currentCrumb: BreadcrumbItem = {
            namespace: data.name,
            type: data.calmType === 'Architectures' ? 'architectures' : 'patterns',
            id: data.id,
            version: data.version,
            name: currentDisplayNameRef.current,
        };
        navigate(`/${parsed.namespace}/${parsed.type}/${parsed.id}/${parsed.version}`, {
            state: { breadcrumbs: [...currentCrumbs, currentCrumb] }
        });
    }, [navigate, data, location.state]);

    const breadcrumbs = (location.state as { breadcrumbs?: BreadcrumbItem[] } | null)?.breadcrumbs;
    const isDiagramView = data?.calmType === 'Architectures' || data?.calmType === 'Patterns';

    const memoizedDataLoad = useMemo(() => handleDataLoad, []);
    const memoizedAdrLoad = useMemo(() => handleAdrLoad, []);

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Navbar />
            <div className="flex flex-row flex-1 overflow-hidden bg-base-300">
                <div className={`${isSidebarOpen ? 'w-1/4' : 'w-12'} p-4 pr-2 transition-all duration-300`}>
                    <div className="h-full bg-base-100 rounded-box overflow-hidden shadow-xl flex flex-col">
                        {isSidebarOpen ? (
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <TreeNavigation onDataLoad={memoizedDataLoad} onAdrLoad={memoizedAdrLoad} onControlLoad={handleControlLoad} onInterfaceLoad={handleInterfaceLoad} onCollapse={() => setIsSidebarOpen(false)} />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center pt-3">
                                <button
                                    aria-label="Expand sidebar"
                                    className="btn btn-ghost btn-xs btn-circle"
                                    onClick={() => setIsSidebarOpen(true)}
                                >
                                    <IoChevronForwardOutline />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-auto min-w-0">
                    {interfaceData ? (
                        <InterfaceDetailSection interfaceData={interfaceData} />
                    ) : controlData ? (
                        <ControlDetailSection controlData={controlData} />
                    ) : adrData ? (
                        <AdrRenderer adrDetails={adrData} />
                    ) : isDiagramView ? (
                        <DiagramSection data={data} onItemSelect={handleItemSelect} hasDetailsPanel={!!selectedItem} breadcrumbs={breadcrumbs} onNavigateToDetailedArch={handleNavigateToDetailedArch} onDisplayNameChange={handleDisplayNameChange} />
                    ) : (
                        <DocumentDetailSection data={data} />
                    )}
                </div>
                {selectedItem && isDiagramView && (
                    <Sidebar selectedData={selectedItem.data} closeSidebar={closeSidebar} onNavigateToDetailedArch={handleNavigateToDetailedArch} />
                )}
            </div>
        </div>
    );
}
