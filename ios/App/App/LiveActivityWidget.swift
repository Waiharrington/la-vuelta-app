import WidgetKit
import SwiftUI
import ActivityKit

struct LiveActivityWidgetView: View {
    let context: ActivityViewContext<LiveActivityAttributes>
    
    var body: some View {
        VStack(spacing: 8) {
            // Header row
            HStack {
                Text("Carrera")
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundColor(.white.opacity(0.8))
                
                Spacer()
                
                // Orange brand running icon
                Image(systemName: "figure.run")
                    .foregroundColor(Color(red: 0.9, green: 0.35, blue: 0.15))
                    .font(.system(size: 16, weight: .bold))
            }
            
            // Metrics row (3 columns)
            HStack(alignment: .center) {
                // Column 1: Duration
                VStack(alignment: .center, spacing: 2) {
                    Text(context.state.elapsedTime)
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    Text("Duración")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.white.opacity(0.5))
                }
                .frame(maxWidth: .infinity)
                
                // Column 2: Average Pace
                VStack(alignment: .center, spacing: 2) {
                    Text(context.state.avgPace.replacingOccurrences(of: " /km", with: ""))
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    Text("Ritmo prom. (/km)")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.white.opacity(0.5))
                }
                .frame(maxWidth: .infinity)
                
                // Column 3: Distance
                VStack(alignment: .center, spacing: 2) {
                    Text(context.state.distance.replacingOccurrences(of: " km", with: ""))
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    Text("Distancia (km)")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.white.opacity(0.5))
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color(red: 0.08, green: 0.08, blue: 0.08))
    }
}

@main
struct LiveActivityWidgetBundle: WidgetBundle {
    var body: some Widget {
        LiveActivityWidget()
    }
}

struct LiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: LiveActivityAttributes.self) { context in
            // Lock screen widget layout
            LiveActivityWidgetView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack {
                        Image(systemName: "figure.run")
                            .foregroundColor(Color(red: 0.9, green: 0.35, blue: 0.15))
                        Text("Vuelta")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.distance)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        VStack {
                            Text(context.state.elapsedTime)
                                .font(.system(size: 18, weight: .bold))
                            Text("Tiempo").font(.system(size: 10)).foregroundColor(.gray)
                        }
                        Spacer()
                        VStack {
                            Text(context.state.avgPace)
                                .font(.system(size: 18, weight: .bold))
                            Text("Ritmo").font(.system(size: 10)).foregroundColor(.gray)
                        }
                    }
                    .padding(.horizontal, 8)
                }
            } compactLeading: {
                Image(systemName: "figure.run")
                    .foregroundColor(Color(red: 0.9, green: 0.35, blue: 0.15))
            } compactTrailing: {
                Text(context.state.distance)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.white)
            } minimal: {
                Image(systemName: "figure.run")
                    .foregroundColor(Color(red: 0.9, green: 0.35, blue: 0.15))
            }
        }
    }
}
