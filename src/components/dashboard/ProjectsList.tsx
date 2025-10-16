import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Calendar, Plus, Folder as FolderIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { EmptyState } from '@/components/ui/empty-state';
import { CardSkeleton } from '@/components/ui/loading-skeleton';

interface Project {
  id: string;
  client_name: string;
  address: string | null;
  gush: string | null;
  parcel: string | null;
  plot: string | null;
  priority: number | null;
  created_at: string;
  folder_id: string | null;
}

interface Folder {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}



import { useState } from 'react';

export const ProjectsList = () => {
  const queryClient = useQueryClient();
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const handleAssignFolder = (projectId: string, folderId: string | null) => {
    updateProjectFolderMutation.mutate({ projectId, folderId });
  };

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('folders')
        .insert([{ name }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setFolderName("");
      setNewFolderOpen(false);
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });

  const updateProjectFolderMutation = useMutation({
    mutationFn: async ({ projectId, folderId }: { projectId: string; folderId: string | null }) => {
      const { error } = await supabase
        .from('projects')
        .update({ folder_id: folderId })
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
  const navigate = useNavigate();

  // שליפת תיקיות
  const { data: folders = [], isLoading: isFoldersLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Folder[];
    },
  });

  // שליפת פרויקטים
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const isLoading = isFoldersLoading || isProjectsLoading;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton count={6} />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="אין פרויקטים עדיין"
        description="התחל ביצירת הפרויקט הראשון שלך וצא לדרך"
        action={{
          label: 'צור פרויקט חדש',
          onClick: () => navigate('/project/new'),
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">הפרויקטים שלי</h2>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} פרויקטים פעילים</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">הוסף תיקיה</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>הוספת תיקיה חדשה</DialogTitle>
                <DialogDescription>הקלד שם עבור התיקיה שתרצה ליצור</DialogDescription>
              </DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createFolderMutation.mutate(folderName); }}>
                <Input
                  value={folderName}
                  onChange={e => setFolderName(e.target.value)}
                  placeholder="שם תיקיה"
                  required
                  className="mb-4"
                  autoFocus
                />
                <Button type="submit" disabled={createFolderMutation.isPending || !folderName} variant="gradient">
                  צור תיקיה
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button onClick={() => navigate('/project/new')} variant="gradient" className="shadow-lg">
            <Plus className="ml-2 h-4 w-4" />
            פרויקט חדש
          </Button>
        </div>
      </div>
      {/* הצגת פרויקטים לפי תיקיות */}
      {folders.length > 0 && (
        <div className="space-y-8">
          {folders.map(folder => {
            const folderProjects = projects.filter(p => p.folder_id === folder.id);
            if (folderProjects.length === 0) return null;
            return (
              <div key={folder.id} className="border rounded-lg p-4 bg-card/60">
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-bold text-lg">📁 {folder.name}</span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {folderProjects.map((project, index) => (
                    <Card
                      key={project.id}
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="hover:shadow-xl transition-shadow duration-200 cursor-pointer group overflow-hidden"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
                      <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <span className="group-hover:gradient-text transition-all">{project.client_name}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button size="icon" variant="ghost" className="ml-2" title="שנה תיקיה">
                                <FolderIcon className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAssignFolder(project.id, null); }}>
                                ללא תיקיה
                              </DropdownMenuItem>
                              {folders.map(f => (
                                <DropdownMenuItem key={f.id} onClick={(e) => { e.stopPropagation(); handleAssignFolder(project.id, f.id); }}>
                                  {f.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardTitle>
                        {project.address && (
                          <CardDescription className="flex items-center gap-1 mt-2">
                            <MapPin className="h-3 w-3" />
                            {project.address}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3 relative z-10">
                        {(project.gush || project.parcel || project.plot) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            {project.gush && (
                              <span className="px-2 py-1 bg-muted rounded-md">גוש: {project.gush}</span>
                            )}
                            {project.parcel && (
                              <span className="px-2 py-1 bg-muted rounded-md">חלקה: {project.parcel}</span>
                            )}
                            {project.plot && (
                              <span className="px-2 py-1 bg-muted rounded-md">מגרש: {project.plot}</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <Calendar className="h-3 w-3" />
                          <span>נוצר: {format(new Date(project.created_at), 'dd/MM/yyyy', { locale: he })}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* פרויקטים ללא תיקיה */}
      <div className="mt-8">
  {projects.some(p => !p.folder_id) && (
          <>
            <div className="font-bold text-lg mb-4">פרויקטים ללא תיקיה</div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.filter(p => !p.folder_id).map((project, index) => (
                <Card
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="hover:shadow-xl transition-shadow duration-200 cursor-pointer group overflow-hidden"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <span className="group-hover:gradient-text transition-all">{project.client_name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="ml-2" title="שנה תיקיה">
                            <FolderIcon className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateProjectFolderMutation.mutate({ projectId: project.id, folderId: null }); }}>
                            ללא תיקיה
                          </DropdownMenuItem>
                          {folders.map(f => (
                            <DropdownMenuItem key={f.id} onClick={(e) => { e.stopPropagation(); updateProjectFolderMutation.mutate({ projectId: project.id, folderId: f.id }); }}>
                              {f.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardTitle>
                    {project.address && (
                      <CardDescription className="flex items-center gap-1 mt-2">
                        <MapPin className="h-3 w-3" />
                        {project.address}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 relative z-10">
                    {(project.gush || project.parcel || project.plot) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        {project.gush && (
                          <span className="px-2 py-1 bg-muted rounded-md">גוש: {project.gush}</span>
                        )}
                        {project.parcel && (
                          <span className="px-2 py-1 bg-muted rounded-md">חלקה: {project.parcel}</span>
                        )}
                        {project.plot && (
                          <span className="px-2 py-1 bg-muted rounded-md">מגרש: {project.plot}</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <Calendar className="h-3 w-3" />
                      <span>נוצר: {format(new Date(project.created_at), 'dd/MM/yyyy', { locale: he })}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
