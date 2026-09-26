import { Injectable } from "@nestjs/common";
import { Observable, Subject } from "rxjs";
import type { AgentEvent } from "@teamlyf/agents";

@Injectable()
export class AgentEventHub {
  private readonly streams = new Map<string, Subject<AgentEvent>>();

  stream(runId: string): Observable<AgentEvent> {
    let subject = this.streams.get(runId);
    if (!subject) {
      subject = new Subject<AgentEvent>();
      this.streams.set(runId, subject);
    }
    return subject.asObservable();
  }

  publish(event: AgentEvent): void {
    this.streams.get(event.runId)?.next(event);
  }

  close(runId: string): void {
    const subject = this.streams.get(runId);
    if (!subject) return;
    subject.complete();
    this.streams.delete(runId);
  }
}
