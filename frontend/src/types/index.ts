export enum RequirementStatus {
  PENDING_SCHEDULE = '待排期',
  IN_PROJECT = '已排期',
  COMPLETED = '已完成'
}

export enum RequirementPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ProjectStatus {
  NEW = '新建未处理',
  REQUIREMENT_DESIGN = '需求设计',
  REQUIREMENT_HANDOVER = '需求交接',
  IMPLEMENTATION = '需求实现',
  COMPLETED = '上线关闭'
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  DEVELOPER = 'DEVELOPER',
  TESTER = 'TESTER',
  STAKEHOLDER = 'STAKEHOLDER'
}

export interface Requirement {
  id: number;
  code: string;
  description: string;
  requestor: string;
  department: string;
  requestDate: string;
  status: RequirementStatus;
  projectId: number | null;
  projectStatus: string | null;
}

export interface ProjectMember {
  id: number;
  userId: number;
  projectId: number;
  role: 'owner' | 'manager' | 'member';
  joinDate: string;
}

export interface ProjectDocument {
  id: number;
  projectId: number;
  title: string;
  content: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  createTime: string;
  status: ProjectStatus;
  onlineTime: string | null;
  requirements: number[];
  progress: number;
  members: ProjectMember[];
  documents: ProjectDocument[];
  description: string;
}

export interface Comment {
  id: number;
  content: string;
  userId: number;
  requirementId: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalRequirements: number;
  requirementsByStatus: Record<RequirementStatus, number>;
  totalProjects: number;
  projectsByStatus: Record<ProjectStatus, number>;
  requirementsByPriority: Record<RequirementPriority, number>;
  upcomingDeadlines: Requirement[];
  recentActivities: Activity[];
}

export interface Activity {
  id: number;
  type: 'requirement_created' | 'requirement_updated' | 'requirement_status_changed' | 
        'project_created' | 'project_updated' | 'project_status_changed' | 
        'comment_added';
  userId: number;
  entityId: number;
  entityType: 'requirement' | 'project' | 'comment';
  description: string;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  phone?: string;
  email: string;
  role: UserRole;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  username: string;
  fullName: string;
  email: string;
  department: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
}

export interface UserFormValues {
  username: string;
  email: string;
  password?: string;
  role: UserRole;
} 