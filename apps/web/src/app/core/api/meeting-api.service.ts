import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type {
  Meeting, CreateMeetingDto, UpdateMeetingDto, MeetingQuery,
  PaginatedResponse, AddParticipantDto, UpdateParticipantDto, AddDecisionDto
} from '@mm/shared-types';

@Injectable({ providedIn: 'root' })
export class MeetingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/meetings`;

  list(query: Partial<MeetingQuery> = {}) {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.append(key, value.toString());
      }
    });
    return this.http.get<PaginatedResponse<Meeting>>(this.base, { params });
  }

  get(id: string) {
    return this.http.get<Meeting>(`${this.base}/${id}`);
  }

  create(dto: CreateMeetingDto) {
    return this.http.post<Meeting>(this.base, dto);
  }

  update(id: string, dto: UpdateMeetingDto) {
    return this.http.patch<Meeting>(`${this.base}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  addParticipant(meetingId: string, dto: AddParticipantDto) {
    return this.http.post<Meeting>(`${this.base}/${meetingId}/participants`, dto);
  }

  updateParticipant(meetingId: string, userId: string, dto: UpdateParticipantDto) {
    return this.http.patch<Meeting>(`${this.base}/${meetingId}/participants/${userId}`, dto);
  }

  removeParticipant(meetingId: string, userId: string) {
    return this.http.delete<void>(`${this.base}/${meetingId}/participants/${userId}`);
  }

  addDecision(meetingId: string, dto: AddDecisionDto) {
    return this.http.post<Meeting>(`${this.base}/${meetingId}/decisions`, dto);
  }

  removeDecision(meetingId: string, decisionId: string) {
    return this.http.delete<void>(`${this.base}/${meetingId}/decisions/${decisionId}`);
  }
}
