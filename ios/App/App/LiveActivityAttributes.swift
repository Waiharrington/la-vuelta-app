import Foundation
import ActivityKit

public struct LiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var distance: String
        public var elapsedTime: String
        public var avgPace: String
    }
    
    public var name: String
}
