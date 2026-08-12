import Foundation
import Capacitor
import ActivityKit

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivity"
    public let pluginMethods = [
        CAPPluginMethod(name: "startActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopActivity", returnType: CAPPluginReturnPromise)
    ]
    
    private var activity: Activity<LiveActivityAttributes>? = nil
    
    @objc func startActivity(_ call: CAPPluginCall) {
        guard let distance = call.getString("distance"),
              let elapsedTime = call.getString("elapsedTime"),
              let avgPace = call.getString("avgPace") else {
            call.reject("Missing required parameters")
            return
        }
        
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.reject("Live Activities are not enabled")
            return
        }
        
        let attributes = LiveActivityAttributes(name: "La Vuelta Run")
        let initialState = LiveActivityAttributes.ContentState(
            distance: distance,
            elapsedTime: elapsedTime,
            avgPace: avgPace
        )
        
        do {
            activity = try Activity.request(
                attributes: attributes,
                content: .init(state: initialState, staleDate: nil),
                pushType: nil
            )
            call.resolve()
        } catch {
            call.reject("Failed to start Live Activity: \(error.localizedDescription)")
        }
    }
    
    @objc func updateActivity(_ call: CAPPluginCall) {
        guard let distance = call.getString("distance"),
              let elapsedTime = call.getString("elapsedTime"),
              let avgPace = call.getString("avgPace") else {
            call.reject("Missing required parameters")
            return
        }
        
        let updatedState = LiveActivityAttributes.ContentState(
            distance: distance,
            elapsedTime: elapsedTime,
            avgPace: avgPace
        )
        
        Task {
            if let activity = activity {
                await activity.update(.init(state: updatedState, staleDate: nil))
                call.resolve()
            } else {
                call.reject("No active Live Activity found")
            }
        }
    }
    
    @objc func stopActivity(_ call: CAPPluginCall) {
        Task {
            if let activity = activity {
                await activity.end(nil, dismissalPolicy: .immediate)
                self.activity = nil
                call.resolve()
            } else {
                call.resolve()
            }
        }
    }
}
