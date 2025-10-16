import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProjectNew from "./pages/ProjectNew";
import ProjectView from "./pages/ProjectView";
import DatabaseCheck from "./components/DatabaseCheck";

const queryClient = new QueryClient();

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg border border-destructive">
        <h1 className="text-2xl font-bold text-destructive mb-4">אירעה שגיאה</h1>
        <p className="text-muted-foreground mb-4">
          מצטערים, משהו השתבש. אנא טען מחדש את העמוד.
        </p>
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            פרטי שגיאה
          </summary>
          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-primary text-primary-foreground py-2 rounded hover:bg-primary/90"
        >
          טען מחדש
        </button>
      </div>
    </div>
  );
}

const App = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/db-check" element={<DatabaseCheck />} />
            <Route path="/project/new" element={<ProjectNew />} />
            <Route path="/project/:projectId" element={<ProjectView />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;