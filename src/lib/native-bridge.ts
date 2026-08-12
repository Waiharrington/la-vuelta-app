import { registerPlugin } from "@capacitor/core";

export interface LiveActivityPlugin {
  startActivity(options: {
    distance: string;
    elapsedTime: string;
    avgPace: string;
  }): Promise<void>;
  updateActivity(options: {
    distance: string;
    elapsedTime: string;
    avgPace: string;
  }): Promise<void>;
  stopActivity(): Promise<void>;
}

const LiveActivity = registerPlugin<LiveActivityPlugin>("LiveActivity");

export default LiveActivity;
