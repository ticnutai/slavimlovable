import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  MoreVertical,
  Plus,
  Settings,
  Trash2,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { TaskManagementDialog } from "./TaskManagementDialog";
import { CategoryManagementDialog } from "./CategoryManagementDialog";
import { ReminderManager } from "@/components/reminders/ReminderManager";

interface Task {
  id: string;
  name: string;
  status: string;
  priority?: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  dueDate?: string;
  category_id?: string;
  description?: string;
  order_index?: number;
  is_required?: boolean;
}

interface Category {
  id: string;
  name: string;
  display_name?: string;
  order_index?: number;
  color?: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => void | Promise<void>;
  onTaskClick: (task: Task) => void;
  projectId?: string;
  allTasks?: Task[];
  categories?: Category[];
}

interface KanbanStatus {
  id: string;
  name: string;
  label: string;
  color: string;
  order_index: number;
  icon: string;
  project_id?: string;
}

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  circle: Circle,
  clock: Clock,
  "alert-circle": AlertCircle,
  "check-circle-2": CheckCircle2,
};

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info text-white",
  high: "bg-warning text-white",
  urgent: "bg-destructive text-white",
};

const getPriorityLabel = (
  priority?: "low" | "medium" | "high" | "urgent",
): string => {
  if (priority === "urgent") return "דחוף";
  if (priority === "high") return "גבוה";
  if (priority === "medium") return "בינוני";
  return "נמוך";
};

export const KanbanBoard = ({
  tasks,
  onStatusChange,
  onTaskClick,
  projectId,
  allTasks = [],
  categories = [],
}: KanbanBoardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useIsAdmin();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#6B7280");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedProjectTaskId, setSelectedProjectTaskId] = useState<
    string | null
  >(null);

  const { data: statuses = [] } = useQuery({
    queryKey: ["kanban-statuses", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_statuses")
        .select("*")
        .or(
          projectId
            ? `project_id.is.null,project_id.eq.${projectId}`
            : "project_id.is.null",
        )
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as KanbanStatus[];
    },
  });

  const createStatusMutation = useMutation({
    mutationFn: async (newStatus: { label: string; color: string }) => {
      const maxOrder = Math.max(...statuses.map((s) => s.order_index), 0);
      const { error } = await supabase.from("kanban_statuses").insert({
        name: newStatus.label.toLowerCase().replace(/\s+/g, "_"),
        label: newStatus.label,
        color: newStatus.color,
        order_index: maxOrder + 1,
        icon: "circle",
        project_id: projectId || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["kanban-statuses", projectId],
      });
      setNewStatusLabel("");
      setNewStatusColor("#6B7280");
      toast({
        title: "נוסף בהצלחה",
        description: "הסטטוס החדש נוסף ללוח",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף סטטוס",
        variant: "destructive",
      });
      console.error("Error creating status:", error);
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: async (statusId: string) => {
      const { error } = await supabase
        .from("kanban_statuses")
        .delete()
        .eq("id", statusId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["kanban-statuses", projectId],
      });
      toast({
        title: "נמחק בהצלחה",
        description: "הסטטוס הוסר מהלוח",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק סטטוס",
        variant: "destructive",
      });
      console.error("Error deleting status:", error);
    },
  });

  const handleDragStart = (task: Task, e: React.DragEvent) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.id);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedTask(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = async (status: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverStatus(null);

    if (draggedTask && draggedTask.status !== status) {
      try {
        await onStatusChange(draggedTask.id, status);
        toast({
          title: "המשימה עודכנה",
          description: `המשימה הועברה ל${statuses.find((s) => s.name === status)?.label || status}`,
        });
      } catch {
        toast({
          title: "שגיאה",
          description: "לא ניתן להעביר את המשימה",
          variant: "destructive",
        });
      }
    }
    setDraggedTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const selectAllInStatus = (status: string) => {
    const statusTasks = getTasksByStatus(status);
    const newSelected = new Set(selectedTasks);
    for (const task of statusTasks) {
      newSelected.add(task.id);
    }
    setSelectedTasks(newSelected);
  };

  const clearSelection = () => {
    setSelectedTasks(new Set());
    setIsMultiSelectMode(false);
  };

  const deleteSelectedTasks = async () => {
    if (selectedTasks.size === 0) return;

    if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedTasks.size} משימות?`)) {
      return;
    }

    try {
      // Delete all selected tasks
      const deletePromises = Array.from(selectedTasks).map((taskId) =>
        supabase.from("project_tasks").delete().eq("id", taskId),
      );

      await Promise.all(deletePromises);

      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });

      toast({
        title: "נמחקו בהצלחה",
        description: `${selectedTasks.size} משימות נמחקו`,
      });

      clearSelection();
    } catch {
      toast({
        title: "שגיאה במחיקה",
        description: "לא ניתן למחוק את המשימות",
        variant: "destructive",
      });
    }
  };

  const moveSelectedTasks = async (newStatus: string) => {
    if (selectedTasks.size === 0) return;

    try {
      const movePromises: Promise<void>[] = Array.from(selectedTasks).map(
        (taskId) => Promise.resolve(onStatusChange(taskId, newStatus)),
      );

      await Promise.all(movePromises);

      toast({
        title: "הועברו בהצלחה",
        description: `${selectedTasks.size} משימות הועברו`,
      });

      clearSelection();
    } catch {
      toast({
        title: "שגיאה בהעברה",
        description: "לא ניתן להעביר את המשימות",
        variant: "destructive",
      });
    }
  };

  // Handler for reminder button click
  const handleReminderClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    const projectTask = tasks.find((t) => t.id === taskId);
    if (projectTask) {
      setSelectedProjectTaskId(projectTask.id);
      setReminderDialogOpen(true);
    }
  };

  // Handler for status change in dropdown
  const handleTaskStatusChange = (
    e: React.MouseEvent,
    taskId: string,
    newStatus: string,
  ) => {
    e.stopPropagation();
    onStatusChange(taskId, newStatus);
  };

  const handleAddStatus = () => {
    if (!newStatusLabel.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם לסטטוס",
        variant: "destructive",
      });
      return;
    }

    createStatusMutation.mutate({
      label: newStatusLabel,
      color: newStatusColor,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <div className="flex gap-2">
          {isMultiSelectMode && (
            <>
              <Button onClick={clearSelection} variant="outline" size="sm">
                ביטול בחירה ({selectedTasks.size})
              </Button>
              {selectedTasks.size > 0 && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        העבר ל...
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {statuses.map((status) => (
                        <DropdownMenuItem
                          key={status.id}
                          onClick={() => moveSelectedTasks(status.name)}
                        >
                          {status.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    onClick={deleteSelectedTasks}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 ml-1" />
                    מחק ({selectedTasks.size})
                  </Button>
                </>
              )}
            </>
          )}
          {!isMultiSelectMode && (
            <Button
              onClick={() => setIsMultiSelectMode(true)}
              variant="outline"
              size="sm"
            >
              בחירה מרובה
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setCategoryDialogOpen(true)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 ml-1" />
            הוסף קטגוריה
          </Button>
          {isAdmin && (
            <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 ml-1" />
                  ניהול סטטוסים
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle>ניהול סטטוסים בלוח קנבן</DialogTitle>
                  <DialogDescription>
                    הוסף, ערוך או מחק סטטוסים בלוח הקנבן
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">הוספת סטטוס חדש</h3>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label htmlFor="status-label">שם הסטטוס</Label>
                        <Input
                          id="status-label"
                          value={newStatusLabel}
                          onChange={(e) => setNewStatusLabel(e.target.value)}
                          placeholder="לדוגמה: בבדיקת איכות"
                        />
                      </div>
                      <div className="w-32">
                        <Label htmlFor="status-color">צבע</Label>
                        <div className="flex gap-2">
                          <Input
                            id="status-color"
                            type="color"
                            value={newStatusColor}
                            onChange={(e) => setNewStatusColor(e.target.value)}
                            className="h-10 w-16 p-1"
                          />
                          {/* eslint-disable-next-line react/style-prop-object, react/no-unknown-property, react/no-danger */}
                          <div
                            className="h-10 w-10 rounded border"
                            style={{ backgroundColor: newStatusColor }}
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={handleAddStatus}
                          disabled={createStatusMutation.isPending}
                        >
                          <Plus className="h-4 w-4 ml-1" />
                          הוסף
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">סטטוסים קיימים</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {statuses.map((status) => (
                        <div
                          key={status.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line react/style-prop-object, react/no-unknown-property, react/no-danger */}
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            <span className="font-medium">{status.label}</span>
                            {status.project_id && (
                              <Badge variant="secondary" className="text-xs">
                                מותאם אישית
                              </Badge>
                            )}
                          </div>
                          {status.project_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                deleteStatusMutation.mutate(status.id)
                              }
                              disabled={deleteStatusMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6"
        style={{
          gridTemplateColumns: `repeat(${statuses.length}, minmax(0, 1fr))`,
        }}
      >
        {statuses.map((statusConfig) => {
          const statusTasks = getTasksByStatus(statusConfig.name);
          const StatusIcon = iconMap[statusConfig.icon] || Circle;

          return (
            <section
              key={statusConfig.id}
              aria-label={`עמודת ${statusConfig.label}`}
              className={cn(
                "flex flex-col gap-3 min-w-[250px] p-2 rounded-lg transition-all",
                dragOverStatus === statusConfig.name &&
                  "bg-primary/10 ring-2 ring-primary",
              )}
              onDragOver={(e) => handleDragOver(e, statusConfig.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(statusConfig.name, e)}
            >
              <Card className="border-2 animate-fade-in">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line react/style-prop-object, react/no-unknown-property, react/no-danger */}
                      <StatusIcon
                        className="h-4 w-4"
                        style={{ color: statusConfig.color }}
                      />
                      <span>{statusConfig.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMultiSelectMode && statusTasks.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => selectAllInStatus(statusConfig.name)}
                        >
                          בחר הכל
                        </Button>
                      )}
                      <Badge variant="secondary" className="rounded-full">
                        {statusTasks.length}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>

              <div className="flex flex-col gap-2 min-h-[200px]">
                {statusTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(task, e)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "cursor-move hover:scale-[1.02] transition-transform",
                      draggedTask?.id === task.id && "opacity-50",
                      selectedTasks.has(task.id) && "ring-2 ring-primary",
                      isMultiSelectMode && "cursor-pointer",
                    )}
                    style={{
                      backgroundColor: `${statusConfig.color}15`,
                      borderLeft: `3px solid ${statusConfig.color}`,
                    }}
                    onClick={(e) => {
                      if (isMultiSelectMode) {
                        e.stopPropagation();
                        toggleTaskSelection(task.id);
                      } else {
                        onTaskClick(task);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {task.name}
                        </h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => handleReminderClick(e, task.id)}
                          >
                            <Bell className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-popover z-50"
                            >
                              {statuses.map(
                                (newStatus) =>
                                  newStatus.name !== statusConfig.name && (
                                    <DropdownMenuItem
                                      key={newStatus.id}
                                      onClick={(e) =>
                                        handleTaskStatusChange(
                                          e,
                                          task.id,
                                          newStatus.name,
                                        )
                                      }
                                    >
                                      העבר ל{newStatus.label}
                                    </DropdownMenuItem>
                                  ),
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {task.priority && (
                          <Badge
                            className={cn(
                              "text-xs",
                              priorityColors[task.priority],
                            )}
                          >
                            {getPriorityLabel(task.priority)}
                          </Badge>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.dueDate).toLocaleDateString("he-IL")}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {statusTasks.length === 0 && (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                    גרור משימות לכאן
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Dialogs */}
      {isAdmin && selectedCategoryId && allTasks && (
        <TaskManagementDialog
          isOpen={taskDialogOpen}
          onClose={() => {
            setTaskDialogOpen(false);
            setSelectedCategoryId("");
          }}
          categoryId={selectedCategoryId}
          categoryName={
            categories.find((c) => c.id === selectedCategoryId)?.display_name ||
            ""
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tasks={allTasks as any}
        />
      )}

      {isAdmin && categories && (
        <CategoryManagementDialog
          isOpen={categoryDialogOpen}
          onClose={() => setCategoryDialogOpen(false)}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          categories={categories as any}
        />
      )}

      {selectedProjectTaskId && (
        <ReminderManager
          projectTaskId={selectedProjectTaskId}
          taskName={
            tasks.find((t) => t.id === selectedProjectTaskId)?.name || ""
          }
          isOpen={reminderDialogOpen}
          onClose={() => {
            setReminderDialogOpen(false);
            setSelectedProjectTaskId(null);
          }}
        />
      )}
    </div>
  );
};
