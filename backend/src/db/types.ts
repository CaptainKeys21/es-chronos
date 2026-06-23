export interface UserRow {
  id: string;
  username: string;
  email: string;
  pwd_hash: string;
}

export interface AgendaRow {
  id: string;
  name: string;
  owner_id: string;
  timezone: string;
  visibility: string;
}

export interface ParticipantRow {
  id: string;
  user_id: string;
  permissions: string;
  agenda_id: string;
}

export interface TaskRow {
  id: string;
  name: string;
  progress: number;
  deadline: Date;
  owner_id: string | null;
  agenda_id: string;
}

export interface EventRow {
  id: string;
  name: string;
  weekdays: string;
  status: string;
  date: Date;
  agenda_id: string;
}

export interface RoleRow {
  id: string;
  name: string;
  agenda_id: string;
}

export interface ParticipantEventRow {
  p_id: string;
  e_id: string;
}

export interface ParticipantRoleRow {
  p_id: string;
  r_id: string;
}
