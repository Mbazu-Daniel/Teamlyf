import { Injectable } from "@nestjs/common";
import { EMPTY, Observable, Subject } from "rxjs";
import type { AgentEvent } from "@teamlyf/agents";

@Injectable()
export class AgentEventHub {
  private readonly streams = new Map<string, Subject<AgentEvent>>();
  private readonly closed = new Set<string>();

  open(runId: string): void {
    if (this.closed.delete(runId) || !this.streams.has(runId)) {
      this.streams.set(runId, new Subject<AgentEvent>());
    }
  }

  stream(runId: string): Observable<AgentEvent> {
    if (this.closed.has(runId)) return EMPTY;
    let subject = this.streams.get(runId);
    if (!subject) {
      subject = new Subject<AgentEvent>();
      this.streams.set(runId, subject);
    }
    return subject.asObservable();
  }

  publish(event: AgentEvent): void {
    this.closed.delete(event.runId);
    this.streams.get(event.runId)?.next(event);
  }

  close(runId: string): void {
    this.closed.add(runId);
    const subject = this.streams.get(runId);
    if (!subject) return;
    subject.complete();
    this.streams.delete(runId);
  }
}
