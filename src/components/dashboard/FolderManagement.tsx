import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FolderPlus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import './FolderManagement.css';

interface Folder {
  id: string;
  name: string;
  color: string | null;
  order_index: number;
  created_by: string;
}

export const FolderManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#6B7280');

  const { data: folders, isLoading, error: queryError } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      console.log('📁 [FolderManagement] Fetching folders...');
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('❌ [FolderManagement] Error fetching folders:', error);
        throw error;
      }
      console.log('✅ [FolderManagement] Folders fetched:', data);
      return data as Folder[];
    },
  });

  console.log('🔍 [FolderManagement] Current state:', { 
    folders, 
    isLoading, 
    queryError,
    foldersCount: folders?.length 
  });

  const createFolder = useMutation({
    mutationFn: async (folderData: { name: string; color: string }) => {
      console.log('🔨 [FolderManagement] Creating folder:', folderData);
      
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          name: folderData.name,
          color: folderData.color,
          created_by: user?.id,
          order_index: (folders?.length || 0) + 1,
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ [FolderManagement] Create folder error:', error);
        throw error;
      }
      console.log('✅ [FolderManagement] Folder created:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 [FolderManagement] onSuccess triggered:', data);
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setIsCreateOpen(false);
      setNewFolderName('');
      setNewFolderColor('#6B7280');
      toast({
        title: 'תיקייה נוצרה בהצלחה',
        description: 'התיקייה החדשה נוספה למערכת',
      });
    },
    onError: (error) => {
      console.error('💥 [FolderManagement] onError triggered:', error);
      toast({
        title: 'שגיאה',
        description: `לא הצלחנו ליצור את התיקייה: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      // First, remove folder_id from all projects in this folder
      await supabase
        .from('projects')
        .update({ folder_id: null })
        .eq('folder_id', folderId);

      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'תיקייה נמחקה',
        description: 'התיקייה והפרויקטים שבה הועברו לכלל הפרויקטים',
      });
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין שם לתיקייה',
        variant: 'destructive',
      });
      return;
    }
    createFolder.mutate({ name: newFolderName, color: newFolderColor });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול תיקיות</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <FolderPlus className="ml-2 h-4 w-4" />
              תיקייה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>יצירת תיקייה חדשה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">שם התיקייה</Label>
                <Input
                  id="folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="הזן שם לתיקייה..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder-color">צבע התיקייה</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="folder-color"
                    type="color"
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <span className="text-sm text-muted-foreground">{newFolderColor}</span>
                </div>
              </div>
              <Button
                onClick={handleCreateFolder}
                disabled={createFolder.isPending}
                className="w-full"
              >
                {createFolder.isPending ? 'יוצר...' : 'צור תיקייה'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {folders && folders.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="p-6 rounded-lg border-2 hover:shadow-lg transition-all"
              style={{ borderColor: folder.color || '#6B7280' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: folder.color || '#6B7280' }}
                  >
                    <FolderPlus className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">{folder.name}</h3>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setNewFolderName(folder.name);
                    setNewFolderColor(folder.color || '#6B7280');
                    setIsCreateOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 ml-2" />
                  ערוך
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => deleteFolder.mutate(folder.id)}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחק
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <FolderPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>אין תיקיות עדיין</p>
          <p className="text-sm mt-2">לחץ על "תיקייה חדשה" כדי ליצור תיקייה ראשונה</p>
        </div>
      )}
    </div>
  );
};
