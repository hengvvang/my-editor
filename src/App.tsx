import React from "react";
import { DocumentProvider } from "./features/documents/context/DocumentContext";
import { EditorProvider } from "./features/editor/context/EditorContext";
import { WorkspaceProvider } from "./features/workspace/context/WorkspaceContext";
import { SidebarProvider } from "./features/sidebar/context/SidebarContext";
import { MainLayout } from "./layout/MainLayout";

import "./styles/index.css";
import "./styles/print.css";

function App() {
    return (
        <EditorProvider>
            <DocumentProvider>
                <WorkspaceProvider>
                    <SidebarProvider>
                        <MainLayout />
                    </SidebarProvider>
                </WorkspaceProvider>
            </DocumentProvider>
        </EditorProvider>
    );
}

export default App;
