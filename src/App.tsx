import React from "react";
import { DocumentProvider } from "./features/documents/context/DocumentContext";
import { EditorProvider } from "./features/editor/context/EditorContext";
import { WorkspaceProvider } from "./features/workspace/context/WorkspaceContext";
import { SidebarProvider } from "./features/sidebar/context/SidebarContext";
import { VimProvider } from "./features/vim/context/VimContext";
import { LockProvider } from "./features/security/context/LockContext";
import { MainLayout } from "./layout/MainLayout";

import "./styles/index.css";
import "./styles/print.css";

function App() {
    return (
        <EditorProvider>
            <DocumentProvider>
                <WorkspaceProvider>
                    <SidebarProvider>
                        <LockProvider>
                            <VimProvider>
                                <MainLayout />
                            </VimProvider>
                        </LockProvider>
                    </SidebarProvider>
                </WorkspaceProvider>
            </DocumentProvider>
        </EditorProvider>
    );
}

export default App;
