import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, FolderPlus } from 'lucide-react';
import { ProjectsList } from '@/components/dashboard/ProjectsList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FolderManagement } from '@/components/dashboard/FolderManagement';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  // 🚨 AUTH BYPASS for testing
  const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';
  
  useEffect(() => {
    if (BYPASS_AUTH) {
      console.warn('⚠️ AUTH BYPASS ENABLED - FOR TESTING ONLY!');
      return; // Skip auth check
    }
    
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate, BYPASS_AUTH]);

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      console.log('🔍 [DEBUG] Starting folder creation...', { name, userId: user?.id });
      
      // Allow bypassing user check in test mode
      if (!user && !BYPASS_AUTH) {
        console.error('❌ [DEBUG] No user found');
        throw new Error('משתמש לא מחובר');
      }
      
      console.log('📤 [DEBUG] Inserting folder:', { name, created_by: user?.id || 'test-user' });
      
      const { data, error} = await supabase
        .from('folders')
        .insert([{ name, created_by: user?.id || 'test-user' }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ [DEBUG] Supabase error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
        throw error;
      }
      
      console.log('✅ [DEBUG] Folder created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ [DEBUG] Mutation onSuccess triggered', data);
      setFolderName("");
      setNewFolderOpen(false);
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast({
        title: 'תיקייה נוספה בהצלחה',
        description: 'התיקייה החדשה זמינה כעת',
      });
    },
    onError: (error: Error) => {
      console.error('❌ [DEBUG] Mutation onError triggered:', error);
      toast({
        title: 'שגיאה ביצירת תיקייה',
        description: `${error.message} - בדוק את הקונסול למידע נוסף`,
        variant: 'destructive',
      });
    },
  });

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'התנתקת בהצלחה',
      description: 'להתראות!',
    });
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent shadow-glow"></div>
          <p className="text-sm text-muted-foreground animate-pulse">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle" dir="rtl">
      <header className="border-b bg-card/80 backdrop-blur-md shadow-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold gradient-text">מערכת ניהול פרויקטים</h1>
            <p className="text-sm text-muted-foreground mt-1">ניהול שלבי עבודה אדריכליים מתקדם</p>
          </div>
          <div className="flex items-center gap-3 animate-fade-in">
            <Button onClick={() => setNewFolderOpen(true)} variant="gradient" size="lg" className="shadow-lg">
              <FolderPlus className="ml-2 h-5 w-5" />
              הוסף תיקייה
            </Button>
            <Button onClick={() => navigate('/project/new')} variant="gradient" size="lg" className="shadow-lg">
              <Plus className="ml-2 h-5 w-5" />
              פרויקט חדש
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="lg" className="hover-lift">
              <LogOut className="ml-2 h-5 w-5" />
              התנתק
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="projects">פרויקטים</TabsTrigger>
            <TabsTrigger value="folders">תיקיות</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects">
            <ProjectsList />
          </TabsContent>
          
          <TabsContent value="folders">
            <FolderManagement />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת תיקייה חדשה</DialogTitle>
            <DialogDescription>הזן שם לתיקייה החדשה שלך</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createFolderMutation.mutate(folderName); }}>
            <Input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="שם תיקיה"
              required
              className="mb-4"
              autoFocus
            />
            <Button 
              type="submit" 
              disabled={createFolderMutation.isPending || !folderName} 
              variant="gradient"
              className="w-full"
            >
              צור תיקייה
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
