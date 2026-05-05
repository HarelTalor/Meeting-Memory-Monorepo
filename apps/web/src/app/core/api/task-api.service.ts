import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { Task, CreateTaskDto, UpdateTaskDto, TaskQuery, PaginatedResponse } from '@mm/shared-types';

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tasks`;

  list(query: Partial<TaskQuery> = {}) {
    const params = new HttpParams({ fromObject: query as Record<string, string> });
    return this.http.get<PaginatedResponse<Task>>(this.base, { params });
  }

  get(id: string) { return this.http.get<Task>(`${this.base}/${id}`); }

  create(dto: CreateTaskDto) { return this.http.post<Task>(this.base, dto); }

  update(id: string, dto: UpdateTaskDto) { return this.http.patch<Task>(`${this.base}/${id}`, dto); }

  delete(id: string) { return this.http.delete<void>(`${this.base}/${id}`); }
}
