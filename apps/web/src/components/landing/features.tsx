import type { Icon as TablerIcon } from "@tabler/icons-react";
import {
  IconFileText,
  IconLayoutKanban,
  IconMessage,
  IconNotes,
  IconPhone,
  IconRobot,
  IconUsers,
} from "@tabler/icons-react";

const features: Array<{
  title: string;
  icon: TablerIcon;
  tone: string;
  position: string;
}> = [
  { title: "Projects", icon: IconLayoutKanban, tone: "landing-icon-violet", position: "landing-feature-projects" },
  { title: "Chat", icon: IconMessage, tone: "landing-icon-blue", position: "landing-feature-chat" },
  { title: "Documents", icon: IconFileText, tone: "landing-icon-magenta", position: "landing-feature-documents" },
  { title: "Notes", icon: IconNotes, tone: "landing-icon-lime", position: "landing-feature-notes" },
  { title: "People & HR", icon: IconUsers, tone: "landing-icon-violet", position: "landing-feature-people" },
  { title: "Calls", icon: IconPhone, tone: "landing-icon-blue", position: "landing-feature-calls" },
  { title: "AI agents", icon: IconRobot, tone: "landing-icon-magenta", position: "landing-feature-ai" },
];

export function Features() {
  return (
    <section id="features" className="landing-section scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="landing-feature-stage">
          <div className="landing-feature-copy">
            <p className="landing-kicker">Everything connected</p>
            <h2 className="landing-section-title mt-3 max-w-xl">One place for the work that moves your company.</h2>
            <p className="landing-section-copy mt-4 max-w-lg">Projects, conversations, knowledge, people, calls, and AI stay connected inside the same organization.</p>
          </div>

          <div className="landing-feature-orbit" aria-label="Teamlyf features">
            {features.map(({ title, icon: Icon, tone, position }) => (
              <div key={title} className={`landing-feature-item ${position}`}>
                <span className={`landing-feature-icon ${tone}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span>{title}</span>
              </div>
            ))}
            <div className="landing-feature-core">
              <span className="landing-feature-core-mark">T</span>
              <span>Teamlyf</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
