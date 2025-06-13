import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { PageContextType, PageContextState } from '../types';

const defaultPageContextState: PageContextState = {
  pagePath: '',
  pageTitle: undefined,
  contextData: undefined,
};

const PageContext = createContext<PageContextType | undefined>(undefined);

export const PageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pageState, setPageState] = useState<PageContextState>(defaultPageContextState);

  const setPageContext = useCallback((path: string, title?: string, data?: any) => {
    setPageState({
      pagePath: path,
      pageTitle: title,
      contextData: data,
    });
  }, []);

  return (
    <PageContext.Provider value={{ ...pageState, setPageContext }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = (): PageContextType => {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error('usePageContext must be used within a PageProvider');
  }
  return context;
};