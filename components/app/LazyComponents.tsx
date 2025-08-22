import React, { Suspense } from 'react';
import { LoadingFallback } from './LoadingFallback';

// Main app content with lazy loading
export const AppContent = React.lazy(() =>
  import('../AppContent').then(module => ({ 
    default: module.AppContent as unknown as React.ComponentType<any>
  })).catch(() => ({
    default: (() => (
      <div className="p-5 text-center text-psyduck-primary">
        <h1>🦆 Loading...</h1>
        <p>Starting Psyduck Learning Platform...</p>
      </div>
    )) as unknown as React.ComponentType<any>
  }))
);

export const FloatingElementsContainer = React.lazy(() =>
  import('../FloatingElementsContainer').then(module => ({ 
    default: module.FloatingElementsContainer as unknown as React.ComponentType<any>
  })).catch(() => ({ 
    default: (() => null) as unknown as React.ComponentType<any>
  }))
);

export const RoutePreloader = React.lazy(() =>
  import('../RoutePreloader').then(module => ({ 
    default: module.RoutePreloader as unknown as React.ComponentType<any>
  })).catch(() => ({ 
    default: (() => null) as unknown as React.ComponentType<any>
  }))
);

export const PerformanceMonitor = React.lazy(() =>
  import('../PerformanceMonitor').then(module => ({ 
    default: module.PerformanceMonitor as unknown as React.ComponentType<any>
  })).catch(() => ({ 
    default: (() => null) as unknown as React.ComponentType<any>
  }))
);

// Optimized provider composition with suspense boundaries
const ProvidersBundle = React.lazy(() =>
  import('../providers/AppProviders').then(m => ({ default: m.AppProviders as unknown as React.ComponentType<any> }))
);

export const AppProviders: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  return (
    <Suspense fallback={<LoadingFallback name="core services" />}> 
      <ProvidersBundle>
        {children}
      </ProvidersBundle>
    </Suspense>
  );
});

AppProviders.displayName = 'AppProviders';